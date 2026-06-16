/**
 * Audit approfondi des routes "operation" courses franchise
 * Test avec franchiseId du token et différentes variantes de routes
 */
import fs from "fs";

const API_URL = "https://api.upjunoo-dev.tech";
const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjFlNTc1M2U4LTAzNzYtNDUzNS05YzA5LWFmMDdmNmIxZjM4MyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLnVwanVub28tZGV2LnRlY2gvYXV0aC92MSIsInN1YiI6ImQ5ZmE5NTJhLTMyYzUtNDZmNC05OWQzLTQ4M2YxZGU2NjQ3ZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjE3ODE2Mjk0NjgsImlhdCI6MTc4MTYyNTg2OCwiZW1haWwiOiJkZXYuZnJhbmNoaXNlQHVwanVub28tZGV2LnRlY2giLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImFjY291bnRUeXBlIjoiSU5ESVZJRFVBTCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdE5hbWUiOiJEZXYiLCJsYXN0TmFtZSI6IkZyYW5jaGlzZSIsInVzZXJUeXBlIjoiRlJBTkNISVNFX1VTRVIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4MTYyNTg2OH1dLCJzZXNzaW9uX2lkIjoiMTJkN2ZiNTQtMDQxZS00Nzk1LThiNTctNDM0YmRlYzAwMjA4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.tgrGpxjBhyv14hMiI-R6U2mhONtlaAg46YMytBhDcnsuytxYAL5qutkO3WIyX87Sq42L2OO-HrHAhLAGCrrh1Q";

async function request(path, { method = "GET", body, token = TOKEN } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
    Authorization: `Bearer ${token}`,
  };
  
  const url = `${API_URL}${path}`;
  console.log(`  → ${method} ${url}`);
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
    return { status: res.status, ok: res.ok, json, url };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, url };
  }
}

async function main() {
  console.log("=== AUDIT APPROFONDI - ROUTES OPERATION FRANCHISE ===\n");
  
  const results = [];
  
  // 1. Récupérer les infos du franchise
  console.log("1. Récupération des infos franchise...");
  const meRes = await request("/v1/auth/me");
  console.log("   User:", JSON.stringify(meRes.json?.user, null, 2));
  
  // Essayer de trouver l'ID franchise
  let franchiseId = null;
  
  // Tester différentes routes pour obtenir les franchises
  console.log("\n2. Recherche de la franchise associée...\n");
  
  const franchiseProbeRoutes = [
    "/v1/franchise/dashboard",
    "/v1/franchises/me",
    "/v1/franchise/me",
    "/v1/franchises?page=1&limit=10",
    "/v1/admin/franchises?page=1&limit=5",
  ];
  
  for (const route of franchiseProbeRoutes) {
    const res = await request(route);
    console.log(`   ${route}: [${res.status}]`);
    
    if (res.ok && res.json) {
      // Chercher un ID franchise dans la réponse
      const jsonStr = JSON.stringify(res.json);
      const idMatch = jsonStr.match(/"id":\s*"?([^"\s}]+)"?/);
      if (idMatch && !franchiseId) {
        franchiseId = idMatch[1];
        console.log(`   ✅ ID trouvé: ${franchiseId}`);
      }
    }
  }
  
  // 3. Tester les routes orders avec l'ID trouvé ou des IDs de test
  console.log("\n3. Test routes orders avec différents IDs...\n");
  
  const testIds = [franchiseId, "1", "2", "me"].filter(Boolean);
  const orderRoutes = [
    "/v1/franchises/{id}/orders",
    "/v1/franchise/orders",
  ];
  
  for (const routeTemplate of orderRoutes) {
    for (const id of testIds) {
      const route = routeTemplate.replace("{id}", id);
      const res = await request(route);
      
      results.push({
        route,
        id,
        status: res.status,
        ok: res.ok,
        hasData: res.json?.data !== undefined,
        dataLength: res.json?.data?.length ?? null,
        fields: res.json ? Object.keys(res.json) : [],
        sample: res.json?.data?.[0] ? JSON.stringify(res.json.data[0]).slice(0, 200) : null,
        error: res.json?.error?.message || res.json?.error,
        errorCode: res.json?.error?.code,
      });
    }
  }
  
  // 4. Tester route orders détail
  console.log("\n4. Test route détail order...\n");
  
  const detailRoutes = [
    "/v1/franchise/orders/00000000-0000-0000-0000-000000000001",
    "/v1/admin/orders/RIDE/00000000-0000-0000-0000-000000000001",
  ];
  
  for (const route of detailRoutes) {
    const res = await request(route);
    results.push({
      route,
      status: res.status,
      ok: res.ok,
      fields: res.json ? Object.keys(res.json) : [],
      error: res.json?.error?.message,
      errorCode: res.json?.error?.code,
    });
  }
  
  // 5. Tester les paramètres de filtre
  console.log("\n5. Test filtres sur /v1/franchise/orders...\n");
  
  const filterTests = [
    "?page=1&limit=10",
    "?status=pending",
    "?service=RIDE",
    "?from=2025-01-01&to=2025-12-31",
    "?serviceType=RIDE",
  ];
  
  for (const filter of filterTests) {
    const route = `/v1/franchise/orders${filter}`;
    const res = await request(route);
    console.log(`   ${filter}: [${res.status}] ${res.ok ? (res.json?.meta?.total ?? "?") + " résultats" : res.json?.error?.message}`);
  }
  
  // Générer rapport
  generateReport(results, franchiseId);
}

function generateReport(results, franchiseId) {
  const now = new Date().toISOString();
  
  let md = `# Rapport d'Audit Approfondi - Routes Operation (Courses Franchise)
**Date:** ${now}  
**API:** ${API_URL}  
**Franchise ID détecté:** ${franchiseId || "Non trouvé"}

---

## Problèmes Critiques Identifiés

`;

  // Grouper par problème
  const okResults = results.filter(r => r.ok);
  const accessDenied = results.filter(r => r.status === 403);
  const notFound = results.filter(r => r.status === 404);
  const serverError = results.filter(r => r.status >= 500);
  
  if (okResults.length === 0) {
    md += `### 🚨 ALERTE: Aucune route operation ne fonctionne pour le token franchise!

Le token utilisé (dev.franchise@upjunoo-dev.tech) ne peut accéder à **aucune** route de courses.
`;
  }

  if (accessDenied.length > 0) {
    md += `### ❌ Erreurs 403 - Accès Refusé

| Route | ID Testé | Code Erreur |
|-------|----------|-------------|
${accessDenied.map(r => `| ${r.route} | ${r.id || "-"} | ${r.errorCode || "N/A"} |`).join("\n")}

**Analyse:** Le backend ne reconnaît pas ce token comme ayant les droits sur ces ressources, 
même pour la franchise associée à l'utilisateur.

**Causes possibles:**
1. La franchise n'est pas correctement liée à l'utilisateur dans user_metadata
2. Le middleware d'autorisation ne vérifie pas correctement la relation user-franchise
3. Les routes attendent un autre format d'ID ou un paramètre différent

`;
  }

  if (notFound.length > 0) {
    md += `### ❌ Erreurs 404 - Routes Non Implémentées

| Route | Status |
|-------|--------|
${notFound.map(r => `| ${r.route} | 404 |`).join("\n")}

`;
  }

  if (okResults.length > 0) {
    md += `### ✅ Routes Fonctionnelles

| Route | ID | Champs Réponse | Données |
|-------|-----|----------------|---------|
${okResults.map(r => `| ${r.route} | ${r.id || "-"} | ${r.fields.join(", ")} | ${r.hasData ? r.dataLength + " items" : "N/A"} |`).join("\n")}

**Structure data[0] pour routes OK:**
${okResults.filter(r => r.sample).map(r => `
**${r.route}:**
\`\`\`json
${r.sample}
\`\`\`
`).join("\n")}
`;
  }

  md += `
---

## Détail Complet des Tests

| Route | Status | OK | Has Data | Error Code |
|-------|--------|-----|----------|------------|
${results.map(r => `| ${r.route} | ${r.status} | ${r.ok ? "✅" : "❌"} | ${r.hasData ? "✅" : "❌"} | ${r.errorCode || "-"} |`).join("\n")}

---

## Recommandations pour le Backend

### Priorité 1: Accès Franchise (CRITIQUE)

Les routes "/v1/franchises/{id}/orders" retournent 403 FRANCHISE_ACCESS_DENIED même avec un token franchise valide.

**À vérifier:**
1. Vérifier que l'utilisateur dev.franchise@upjunoo-dev.tech a bien un 
   
2. Vérifier que le middleware vérifie correctement cette liaison
3. Considérer l'implémentation d'une route "/v1/franchise/orders" (sans ID) 
   qui utilise automatiquement la franchise de l'utilisateur connecté

### Priorité 2: Implémenter Routes Manquantes

- 

### Priorité 3: Documentation Swagger

Mettre à jour SWAGGER.md pour refléter:
- Les routes qui nécessitent l'ID franchise
- Les routes qui utilisent automatiquement la franchise du token

---

## Notes pour le Frontend

Actuellement, le frontend ne peut pas afficher les courses de la franchise car:
1. Les routes retournent 403
2. Il n'y a pas d'alternative fonctionnelle

**Action temporaire:** Utiliser des mocks ou désactiver la feature en attendant le fix backend.

---
*Généré automatiquement par scripts/audit-franchise-operations-v2.mjs*
`;

  fs.writeFileSync(new URL("../BACKEND_API_GAPS_OPERATION.md", import.meta.url), md, "utf8");
  console.log("\n✅ Rapport généré: BACKEND_API_GAPS_OPERATION.md");
}

main().catch(console.error);
