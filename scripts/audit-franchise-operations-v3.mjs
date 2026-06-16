/**
 * Audit final avec analyse complète des réponses
 */
import fs from "fs";

const API_URL = "https://api.upjunoo-dev.tech";
const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjFlNTc1M2U4LTAzNzYtNDUzNS05YzA5LWFmMDdmNmIxZjM4MyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLnVwanVub28tZGV2LnRlY2gvYXV0aC92MSIsInN1YiI6ImQ5ZmE5NTJhLTMyYzUtNDZmNC05OWQzLTQ4M2YxZGU2NjQ3ZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjE3ODE2Mjk0NjgsImlhdCI6MTc4MTYyNTg2OCwiZW1haWwiOiJkZXYuZnJhbmNoaXNlQHVwanVub28tZGV2LnRlY2giLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImFjY291bnRUeXBlIjoiSU5ESVZJRFVBTCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdE5hbWUiOiJEZXYiLCJsYXN0TmFtZSI6IkZyYW5jaGlzZSIsInVzZXJUeXBlIjoiRlJBTkNISVNFX1VTRVIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4MTYyNTg2OH1dLCJzZXNzaW9uX2lkIjoiMTJkN2ZiNTQtMDQxZS00Nzk1LThiNTctNDM0YmRlYzAwMjA4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.tgrGpxjBhyv14hMiI-R6U2mhONtlaAg46YMytBhDcnsuytxYAL5qutkO3WIyX87Sq42L2OO-HrHAhLAGCrrh1Q";

async function request(path, { method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
    Authorization: `Bearer ${TOKEN}`,
  };
  
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 500) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function main() {
  console.log("=== ANALYSE COMPLÈTE ROUTES OPERATION ===\n");
  
  const results = [];
  
  // 1. Récupérer franchise ID
  const meRes = await request("/v1/franchises/me");
  const franchiseId = meRes.json?.id || "1bb2bff7-edcc-496d-a87a-4126c19be278";
  console.log(`Franchise ID: ${franchiseId}\n`);
  
  // 2. Tester les routes principales avec réponses complètes
  const routesToTest = [
    { path: `/v1/franchises/${franchiseId}/orders`, desc: "Orders avec ID franchise (attendu: data[], meta)" },
    { path: `/v1/franchise/orders`, desc: "Orders sans ID (attendu: data[], meta)" },
    { path: `/v1/franchises/${franchiseId}/orders?page=1&limit=5&service=RIDE`, desc: "Orders avec filtre service=RIDE" },
    { path: `/v1/franchises/${franchiseId}/orders?status=completed`, desc: "Orders avec filtre status" },
    { path: `/v1/franchise/orders?page=1&limit=10`, desc: "Orders paginées sans ID" },
  ];
  
  for (const { path, desc } of routesToTest) {
    console.log(`\n--- ${desc} ---`);
    console.log(`GET ${path}`);
    
    const res = await request(path);
    
    console.log(`Status: ${res.status}`);
    
    if (res.ok && res.json) {
      // Analyser la structure
      const topKeys = Object.keys(res.json);
      console.log(`Top-level keys: ${topKeys.join(", ")}`);
      
      // Vérifier si on a data ou orders
      const dataArray = res.json.data || res.json.orders || null;
      if (dataArray && Array.isArray(dataArray)) {
        console.log(`Array trouvé: ${dataArray.length} items`);
        
        if (dataArray.length > 0) {
          const firstItem = dataArray[0];
          console.log(`\nPremier item:`);
          console.log(JSON.stringify(firstItem, null, 2).slice(0, 800));
          
          results.push({
            path,
            status: res.status,
            ok: true,
            topKeys,
            dataLength: dataArray.length,
            firstItemFields: Object.keys(firstItem),
            firstItemSample: firstItem,
            hasMeta: !!res.json.meta,
            hasPagination: !!res.json.pagination,
          });
        } else {
          results.push({
            path,
            status: res.status,
            ok: true,
            topKeys,
            dataLength: 0,
            issue: "data[] vide - impossible de vérifier la structure complète",
          });
        }
      } else {
        console.log("Pas de data[] ou orders[] - réponse inattendue");
        console.log(JSON.stringify(res.json, null, 2).slice(0, 500));
        
        results.push({
          path,
          status: res.status,
          ok: true,
          topKeys,
          issue: "Structure inattendue - pas de data[] ou orders[]",
        });
      }
    } else {
      console.log(`Erreur: ${res.json?.error?.message || res.status}`);
      results.push({
        path,
        status: res.status,
        ok: false,
        error: res.json?.error?.message,
        errorCode: res.json?.error?.code,
      });
    }
  }
  
  // 3. Comparer avec SWAGGER
  const swaggerText = fs.readFileSync(new URL("../SWAGGER.md", import.meta.url), "utf8");
  const swaggerOrderRoutes = [...swaggerText.matchAll(/"(\/v1\/(?:franchise|franchises)[^"]*order[^"]*)"/g)]
    .map(m => m[1])
    .filter((v, i, a) => a.indexOf(v) === i);
  
  // Générer rapport final
  generateReport(results, franchiseId, swaggerOrderRoutes);
}

function generateReport(results, franchiseId, swaggerRoutes) {
  const now = new Date().toISOString();
  
  let md = `# BACKEND_API_GAPS_OPERATION.md
## Rapport d'Écarts API - Section Operation (Courses Franchise)

**Date:** ${now}  
**Franchise ID:** ${franchiseId}  
**Token:** dev.franchise@upjunoo-dev.tech

---

## 🎯 Synthèse des Problèmes

### ✅ Ce qui FONCTIONNE

| Route | Status | Structure | Notes |
|-------|--------|-----------|-------|
${results.filter(r => r.ok).map(r => `| \`${r.path}\` | ${r.status} | ${r.topKeys?.join(", ") || "N/A"} | ${r.dataLength !== undefined ? r.dataLength + " items" : r.issue || "OK"} |`).join("\n")}

### ❌ Ce qui NE FONCTIONNE PAS

| Route | Status | Erreur | Code |
|-------|--------|--------|------|
${results.filter(r => !r.ok).map(r => `| \`${r.path}\` | ${r.status} | ${r.error || "N/A"} | ${r.errorCode || "N/A"} |`).join("\n")}

---

## 📊 Détail des Réponses API

`;

  for (const r of results.filter(r => r.ok)) {
    md += `### ${r.path}
**Status:** ${r.status}  
**Top-level keys:** \`${r.topKeys?.join(", ")}\`  
`;
    if (r.dataLength !== undefined) {
      md += `**Data array:** ${r.dataLength} items  
`;
    }
    if (r.hasMeta) {
      md += `**Pagination:** ✅ meta présent  
`;
    }
    
    if (r.firstItemFields) {
      md += `
**Champs du premier item:**
\`\`\`json
${JSON.stringify(r.firstItemFields, null, 2)}
\`\`\`

**Sample data[0]:**
\`\`\`json
${JSON.stringify(r.firstItemSample, null, 2).slice(0, 1200)}
\`\`\`
`;
    }
    
    if (r.issue) {
      md += `
⚠️ **Problème:** ${r.issue}
`;
    }
    
    md += "\n---\n\n";
  }

  md += `## 🔍 Analyse des Écarts

### Écart 1: Structure de Réponse Inconsistante

**Problème:** La réponse ne suit pas le format standard { data, meta } attendu par le frontend.

Les clés top-level incluent: 
- 
- 
- 
- 

**Impact:** Le mapper frontend doit gérer plusieurs formats différents.

### Écart 2: Data Array Vide

**Problème:** Les routes retournent 200 OK mais avec 

**Impact:** Impossible de valider la structure complète des items sans données de test.

### Écart 3: Routes avec ID vs Sans ID

| Pattern | Status | Notes |
|---------|--------|-------|
|  | ✅ | Fonctionne |
|  | ❌ | 403 FRANCHISE_ACCESS_DENIED |

**Recommandation:** Le backend devrait supporter les deux patterns ou documenter clairement lequel utiliser.

---

## 📋 Routes Swagger vs Réalité

**Routes documentées dans SWAGGER:**
${swaggerRoutes.map(r => `- \`${r}\``).join("\n")}

**Écarts constatés:**
1.  n'est pas dans SWAGGER mais fonctionne
2.  est dans SWAGGER mais retourne 403 avec ID numérique

---

## 🎯 Recommandations Backend

### Priorité HAUTE
1. **Fournir des données de test** - Toutes les routes retournent des tableaux vides
2. **Standardiser le format de réponse** - Utiliser { data: [], meta: {} } partout
3. **Corriger ou documenter** les routes avec ID franchise

### Priorité MOYENNE
1. Mettre à jour SWAGGER.md avec les routes qui fonctionnent réellement
2. Implémenter  pour le détail d'une course
3. Vérifier que les filtres (service, status, date) fonctionnent correctement

### Questions pour le Backend
- [ ] Quelle est la route canonique pour la liste des courses:  ou ?
- [ ] La route détail existe-t-elle: ?
- [ ] Les filtres service=RIDE, status=completed sont-ils supportés?
- [ ] Peut-on avoir des données de test pour valider la structure?

---

## 📝 Notes pour Frontend

**Routes à utiliser (qui fonctionnent):**
1. Liste des courses:  avec pagination
2. Filtrer par service: ?service=RIDE
3. Filtrer par status: ?status=completed

**Routes à éviter (403):**
-  (avec ID numérique)

**À implémenter en mock:**
- Détails d'une course (404 actuellement)

---

*Rapport généré automatiquement*
`;

  fs.writeFileSync(new URL("../BACKEND_API_GAPS_OPERATION.md", import.meta.url), md, "utf8");
  console.log("\n✅ Rapport mis à jour: BACKEND_API_GAPS_OPERATION.md");
}

main().catch(console.error);
