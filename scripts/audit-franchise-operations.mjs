/**
 * Audit spécifique des routes "operation" courses franchise
 * Compare SWAGGER.md vs API live avec le token fourni
 */
import fs from "fs";

const API_URL = "https://api.upjunoo-dev.tech";
// Token fourni par l'utilisateur
const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjFlNTc1M2U4LTAzNzYtNDUzNS05YzA5LWFmMDdmNmIxZjM4MyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLnVwanVub28tZGV2LnRlY2gvYXV0aC92MSIsInN1YiI6ImQ5ZmE5NTJhLTMyYzUtNDZmNC05OWQzLTQ4M2YxZGU2NjQ3ZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjE3ODE2Mjk0NjgsImlhdCI6MTc4MTYyNTg2OCwiZW1haWwiOiJkZXYuZnJhbmNoaXNlQHVwanVub28tZGV2LnRlY2giLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImFjY291bnRUeXBlIjoiSU5ESVZJRFVBTCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdE5hbWUiOiJEZXYiLCJsYXN0TmFtZSI6IkZyYW5jaGlzZSIsInVzZXJUeXBlIjoiRlJBTkNISVNFX1VTRVIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4MTYyNTg2OH1dLCJzZXNzaW9uX2lkIjoiMTJkN2ZiNTQtMDQxZS00Nzk1LThiNTctNDM0YmRlYzAwMjA4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.tgrGpxjBhyv14hMiI-R6U2mhONtlaAg46YMytBhDcnsuytxYAL5qutkO3WIyX87Sq42L2OO-HrHAhLAGCrrh1Q";

const swaggerText = fs.readFileSync(new URL("../SWAGGER.md", import.meta.url), "utf8");

// Routes "operation" attendues pour les courses franchise
const EXPECTED_OPERATION_ROUTES = [
  {
    path: "/v1/franchises/{id}/orders",
    method: "GET",
    description: "Liste paginée des courses de la franchise",
    expectedFields: ["data", "meta", "links"],
    dataFields: ["id", "ref", "status", "service", "from_label", "to_label", "client_name", "driver_name", "amount_fcfa", "created_at"]
  },
  {
    path: "/v1/franchises/{id}/orders/{orderId}",
    method: "GET", 
    description: "Détails d'une course spécifique",
    expectedFields: ["id", "ref", "status", "service", "from", "to", "client", "driver", "vehicle", "payments", "timeline"]
  },
  {
    path: "/v1/franchises/{id}/trips",
    method: "GET",
    description: "Liste des trips (alternative à orders)",
    expectedFields: ["data", "meta"]
  },
  {
    path: "/v1/admin/orders",
    method: "GET",
    description: "Liste admin des courses",
    expectedFields: ["data", "meta"]
  },
  {
    path: "/v1/admin/orders/{orderId}",
    method: "GET",
    description: "Détails admin d'une course",
    expectedFields: ["id", "ref", "status", "service"]
  }
];

async function request(path, { method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
    Authorization: `Bearer ${TOKEN}`,
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
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 200) }; }
    return { status: res.status, ok: res.ok, json, url };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, url };
  }
}

function probePath(p) {
  return p
    .replace(/\{id\}/g, "1")
    .replace(/\{orderId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{franchiseId\}/g, "1");
}

async function main() {
  console.log("=== AUDIT ROUTES OPERATION - COURSES FRANCHISE ===\n");
  
  const results = [];
  const issues = [];
  
  // 1. Vérifier le token
  console.log("1. Vérification du token...");
  const meRes = await request("/v1/auth/me");
  if (!meRes.ok) {
    console.error("   ❌ Token invalide ou expiré", meRes.status);
    process.exit(1);
  }
  console.log("   ✅ Token valide", meRes.json?.user?.email || "");
  
  // 2. Tester les routes
  console.log("\n2. Test des routes operation...\n");
  
  for (const route of EXPECTED_OPERATION_ROUTES) {
    const probePath_ = probePath(route.path);
    const res = await request(probePath_);
    
    const result = {
      path: route.path,
      method: route.method,
      description: route.description,
      status: res.status,
      ok: res.ok,
      fields: [],
      missingFields: [],
      issues: []
    };
    
    if (res.ok && res.json) {
      result.fields = Object.keys(res.json);
      
      // Vérifier les champs attendus
      for (const field of route.expectedFields) {
        if (!result.fields.includes(field)) {
          result.missingFields.push(field);
        }
      }
      
      // Vérifier structure data si présente
      if (res.json.data && Array.isArray(res.json.data) && res.json.data.length > 0) {
        const firstItem = res.json.data[0];
        result.dataItemFields = Object.keys(firstItem);
        
        if (route.dataFields) {
          for (const field of route.dataFields) {
            if (!result.dataItemFields.includes(field)) {
              result.missingFields.push(`data[].${field}`);
            }
          }
        }
      }
      
      // Vérifier si data est vide
      if (res.json.data && Array.isArray(res.json.data) && res.json.data.length === 0) {
        result.issues.push("data[] vide - impossible de vérifier la structure des items");
      }
      
      // Vérifier meta pour pagination
      if (res.json.meta) {
        const metaFields = Object.keys(res.json.meta);
        const expectedMeta = ["current_page", "last_page", "per_page", "total"];
        for (const mf of expectedMeta) {
          if (!metaFields.includes(mf)) {
            result.issues.push(`meta.${mf} manquant`);
          }
        }
      }
    } else {
      result.error = res.json?.error?.message || res.json?.message || "Erreur inconnue";
      result.errorCode = res.json?.error?.code || res.json?.code || "";
    }
    
    results.push(result);
    
    // Log
    const icon = res.ok ? "✅" : res.status === 404 ? "❌" : res.status === 501 ? "⚠️" : "❌";
    console.log(`${icon} ${route.path} [${res.status}]`);
    if (result.missingFields.length > 0) {
      console.log(`   Champs manquants: ${result.missingFields.join(", ")}`);
    }
    if (result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.join(", ")}`);
    }
    if (result.error) {
      console.log(`   Erreur: ${result.error} ${result.errorCode ? `(${result.errorCode})` : ""}`);
    }
    console.log("");
  }
  
  // 3. Recherche des routes alternatives dans Swagger
  console.log("\n3. Analyse du SWAGGER.md local...\n");
  
  const swaggerPaths = [];
  const pathRegex = /"(\/v1\/(?:franchises?|admin)[^"]*order[^"]*)"/gi;
  let match;
  while ((match = pathRegex.exec(swaggerText)) !== null) {
    swaggerPaths.push(match[1]);
  }
  
  console.log(`   Routes "order" trouvées dans SWAGGER.md: ${swaggerPaths.length}`);
  for (const p of swaggerPaths.slice(0, 10)) {
    console.log(`   - ${p}`);
  }
  
  // 4. Générer rapport
  const report = generateReport(results, swaggerPaths);
  const reportPath = new URL(`../BACKEND_API_GAPS_OPERATION.md`, import.meta.url);
  fs.writeFileSync(reportPath, report, "utf8");
  
  console.log(`\n✅ Rapport généré: BACKEND_API_GAPS_OPERATION.md`);
}

function generateReport(results, swaggerPaths) {
  const now = new Date().toISOString();
  
  let md = `# Rapport d'Audit - API Routes Operation (Courses Franchise)
**Date:** ${now}  
**API:** https://api.upjunoo-dev.tech  
**Token:** Franchise (dev.franchise@upjunoo-dev.tech)

---

## Résumé Exécutif

| Statut | Count |
|--------|-------|
| ✅ OK | ${results.filter(r => r.ok && r.issues.length === 0).length} |
| ⚠️ OK avec problèmes | ${results.filter(r => r.ok && r.issues.length > 0).length} |
| ❌ Erreur/Non trouvé | ${results.filter(r => !r.ok).length} |

---

## Problèmes Identifiés

`;

  // Problèmes critiques
  for (const r of results) {
    if (!r.ok) {
      md += `### ❌ ${r.path}
**Status:** ${r.status}  
**Erreur:** ${r.error || "N/A"}  
**Code:** ${r.errorCode || "N/A"}  

`;
    } else if (r.issues.length > 0 || r.missingFields.length > 0) {
      md += `### ⚠️ ${r.path}
**Status:** ${r.status}  
`;
      if (r.missingFields.length > 0) {
        md += `**Champs manquants:**\n${r.missingFields.map(f => `- \`${f}\``).join("\n")}  
`;
      }
      if (r.issues.length > 0) {
        md += `**Problèmes:**\n${r.issues.map(i => `- ${i}`).join("\n")}  
`;
      }
      md += `\n**Champs présents:** \`${r.fields.join(", ")}\`  
`;
      if (r.dataItemFields) {
        md += `**Champs data[0]:** \`${r.dataItemFields.join(", ")}\`  
`;
      }
      md += "\n";
    }
  }

  md += `---

## Détail par Route

`;

  for (const r of results) {
    const icon = r.ok ? (r.issues.length === 0 ? "✅" : "⚠️") : "❌";
    md += `### ${icon} ${r.method} ${r.path}
**Description:** ${r.description}  
**Status HTTP:** ${r.status}  

**Réponse:**\n\`\`\`json\n${JSON.stringify(r.json || { error: r.error }, null, 2).slice(0, 800)}\n\`\`\`

---

`;
  }

  md += `## Comparaison avec SWAGGER.md

**Routes "order" trouvées dans SWAGGER:**
${swaggerPaths.map(p => `- \`${p}\``).join("\n")}

**Routes testées non trouvées dans SWAGGER:**
${results.filter(r => !swaggerPaths.includes(r.path)).map(r => `- ⚠️ \`${r.path}\` - ${r.ok ? "Fonctionne" : "Erreur"}`).join("\n") || "- Aucune"}

---

## Recommandations Backend

`;

  // Générer recommandations
  const recommendations = [];
  
  for (const r of results) {
    if (!r.ok && r.status === 404) {
      recommendations.push(`Implémenter la route \`${r.path}\` - retourne 404`);
    }
    if (r.missingFields.length > 0) {
      recommendations.push(`Ajouter les champs manquants sur \`${r.path}\`: ${r.missingFields.join(", ")}`);
    }
    if (r.issues.includes("data[] vide - impossible de vérifier la structure des items")) {
      recommendations.push(`Fournir des données de test sur \`${r.path}\` pour valider la structure`);
    }
  }

  if (recommendations.length === 0) {
    md += "✅ Aucune recommandation - toutes les routes fonctionnent correctement.\n";
  } else {
    md += recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n");
  }

  md += `

---
*Généré automatiquement par scripts/audit-franchise-operations.mjs*
`;

  return md;
}

main().catch(console.error);
