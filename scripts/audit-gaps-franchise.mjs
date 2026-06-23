/**
 * Script #1 — Audit dynamique des écarts API backend
 *
 * Lit un fichier MD de gaps (format standard GAPS_*.md), appelle chaque endpoint
 * avec le token fourni, vérifie les assertions définies dans le MD et génère
 * un rapport MD de résultats.
 *
 * Usage:
 *   node scripts/audit-gaps-franchise.mjs \
 *     --token=<JWT_FRANCHISE> \
 *     --gaps=BACKEND_API_GAPS_2026-06-20.md \
 *     [--var franchiseId=1bb2bff7-edcc-496d-a87a-4126c19be278] \
 *     [--var sample_freight_id=abc-123] \
 *     [--output=AUDIT_RESULT.md]
 *
 * Le flag --var peut être répété autant de fois que nécessaire.
 */

import { readFileSync, writeFileSync } from "fs";

const API = "https://api.upjunoo-dev.tech";

// ── Parse CLI args ────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);

function getArg(name) {
  const found = argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : null;
}

function getVars() {
  const vars = {};
  for (const a of argv) {
    if (a.startsWith("--var=")) {
      const [k, ...v] = a.slice("--var=".length).split("=");
      vars[k] = v.join("=");
    } else if (a.startsWith("--var ")) {
      // support --var key=value (space-separated captured as one token by shell)
      const [k, ...v] = a.slice(6).split("=");
      vars[k] = v.join("=");
    }
  }
  return vars;
}

const TOKEN = getArg("token");
const GAPS_FILE = getArg("gaps");
const VARS = getVars();
const DATE_STR = new Date().toISOString().slice(0, 10);
const OUTPUT_FILE = getArg("output") ?? `AUDIT_RESULT_${DATE_STR}.md`;

if (!TOKEN) {
  console.error("❌  --token=<jwt> est obligatoire");
  process.exit(1);
}
if (!GAPS_FILE) {
  console.error("❌  --gaps=<fichier.md> est obligatoire");
  process.exit(1);
}

// ── Interpolation des variables {{...}} ───────────────────────────────────────
function interpolate(str) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (VARS[key] !== undefined) return VARS[key];
    console.warn(`    ⚠️  Variable {{${key}}} non fournie — fournir --var ${key}=<valeur>`);
    return `MISSING_${key}`;
  });
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function req(method, path, body) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
    "X-Client-Type": "back-office",
  };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text.slice(0, 400) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    return { status: 0, ok: false, json: null, networkError: String(err) };
  }
}

// ── Deep get sur un objet JSON ────────────────────────────────────────────────
function deepGet(obj, path) {
  if (obj == null || path === "") return obj;
  const parts = path.split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    // support array index json.items[0]
    const arrMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrMatch) {
      cur = cur[arrMatch[1]]?.[Number(arrMatch[2])];
    } else {
      cur = cur[part];
    }
  }
  return cur;
}

// ── Évaluer une assertion ─────────────────────────────────────────────────────
// Assert format: "json.field.path: <rule>"
// Rules: exists | not_empty | "literal" | 200 (number) | ok (bare word)
function evalAssert(assertLine, httpStatus, json) {
  const colonIdx = assertLine.indexOf(":");
  if (colonIdx === -1) return { pass: false, reason: `Format invalide: "${assertLine}"` };

  const lhs = assertLine.slice(0, colonIdx).trim();
  const rhs = assertLine.slice(colonIdx + 1).trim();

  // status_http: 200
  if (lhs === "status_http") {
    const expected = parseInt(rhs, 10);
    const pass = httpStatus === expected;
    return { pass, reason: pass ? `HTTP ${httpStatus}` : `HTTP ${httpStatus} ≠ ${expected}` };
  }

  // json.xxx.yyy: <rule>
  if (lhs.startsWith("json")) {
    const jsonPath = lhs === "json" ? "" : lhs.slice(5); // remove "json."
    const value = deepGet(json, jsonPath);

    if (rhs === "exists") {
      const pass = value !== undefined && value !== null;
      return { pass, reason: pass ? `"${lhs}" = ${JSON.stringify(value)?.slice(0, 80)}` : `"${lhs}" absent ou null` };
    }

    if (rhs === "not_empty") {
      const pass = value != null && (Array.isArray(value) ? value.length > 0 : (typeof value === "string" ? value.length > 0 : Object.keys(value ?? {}).length > 0));
      return { pass, reason: pass ? `"${lhs}" non vide (${Array.isArray(value) ? value.length + " items" : typeof value})` : `"${lhs}" vide ou null (${JSON.stringify(value)?.slice(0, 60)})` };
    }

    if (rhs === "not_zero") {
      const pass = typeof value === "number" && value !== 0;
      return { pass, reason: pass ? `"${lhs}" = ${value}` : `"${lhs}" = ${value} (attendu ≠ 0)` };
    }

    if (rhs === "is_array") {
      const pass = Array.isArray(value);
      return { pass, reason: pass ? `"${lhs}" est un tableau (${value.length} items)` : `"${lhs}" n'est pas un tableau (${typeof value})` };
    }

    if (rhs === "is_object") {
      const pass = value !== null && typeof value === "object" && !Array.isArray(value);
      return { pass, reason: pass ? `"${lhs}" est un objet` : `"${lhs}" n'est pas un objet (${typeof value})` };
    }

    // Literal comparison (strip quotes if present)
    const literal = rhs.replace(/^["']|["']$/g, "");
    const pass = String(value) === literal;
    return { pass, reason: pass ? `"${lhs}" = "${value}"` : `"${lhs}" = "${value}" ≠ "${literal}"` };
  }

  return { pass: false, reason: `Assert non reconnu: "${assertLine}"` };
}

// ── Parser le MD ─────────────────────────────────────────────────────────────
function parseMd(content) {
  const checks = [];
  // Découpe par blocs ## CHECK-xxx
  const blocks = content.split(/^## CHECK-/m).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    const headerLine = lines[0].trim(); // e.g. "001 · GET /v1/..."

    // Extraire ID et titre
    const headerMatch = headerLine.match(/^(\w+)\s*[·\-]\s*(.*)/);
    const id = headerMatch ? `CHECK-${headerMatch[1]}` : `CHECK-?`;
    const titleRest = headerMatch ? headerMatch[2].trim() : headerLine;

    const check = {
      id,
      title: titleRest,
      type: null,
      method: "GET",
      url: null,
      body: null,
      asserts: [],
      symptom: null,
      notes: null,
    };

    let inAssert = false;
    let inVars = false;
    let inBody = false;
    let bodyLines = [];
    const localVars = { ...VARS };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("**Type :**")) {
        check.type = trimmed.replace("**Type :**", "").trim();
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**Méthode :**")) {
        check.method = trimmed.replace("**Méthode :**", "").trim().toUpperCase();
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**URL :**")) {
        check.url = trimmed.replace("**URL :**", "").trim();
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**Variables :**")) {
        inVars = true; inAssert = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**Assert :**")) {
        inAssert = true; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**Body :**")) {
        inBody = true; inAssert = false; inVars = false;
        continue;
      }
      if (trimmed.startsWith("**Symptôme :**")) {
        check.symptom = trimmed.replace("**Symptôme :**", "").trim();
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("**Notes :**")) {
        check.notes = trimmed.replace("**Notes :**", "").trim();
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      // Nouvelle section ** => stop les modes
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        inAssert = false; inVars = false; inBody = false;
        continue;
      }
      if (trimmed.startsWith("---")) {
        inAssert = false; inVars = false; inBody = false;
        continue;
      }

      if (inVars && trimmed.startsWith("-")) {
        const varMatch = trimmed.match(/^-\s*(\w+)\s*=\s*(.+)/);
        if (varMatch) localVars[varMatch[1]] = varMatch[2].trim();
        continue;
      }

      if (inAssert && trimmed.startsWith("-")) {
        const assertText = trimmed.slice(1).trim();
        if (assertText) check.asserts.push(assertText);
        continue;
      }

      if (inBody) {
        if (trimmed.startsWith("```")) { inBody = false; continue; }
        bodyLines.push(trimmed);
        continue;
      }
    }

    // Résoudre les variables locales dans l'URL
    if (check.url) {
      check.url = check.url.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (localVars[key]) return localVars[key];
        console.warn(`    ⚠️  Variable {{${key}}} non définie pour ${id}`);
        return `MISSING_${key}`;
      });
    }

    // Body JSON
    if (bodyLines.length > 0) {
      try { check.body = JSON.parse(bodyLines.join("\n")); } catch { check.body = null; }
    }

    if (check.url) checks.push(check);
  }

  return checks;
}

// ── Main ──────────────────────────────────────────────────────────────────────
let mdContent;
try {
  mdContent = readFileSync(GAPS_FILE, "utf8");
} catch {
  console.error(`❌  Fichier introuvable : ${GAPS_FILE}`);
  process.exit(1);
}

const checks = parseMd(mdContent);

if (checks.length === 0) {
  console.error(`❌  Aucun bloc CHECK-xxx trouvé dans ${GAPS_FILE}`);
  console.error(`    Vérifier que le fichier suit le format standard (## CHECK-001 · ...)`);
  process.exit(1);
}

console.log(`\n🔍  Audit API — ${DATE_STR}`);
console.log(`    Fichier  : ${GAPS_FILE}`);
console.log(`    Checks   : ${checks.length}`);
console.log(`    API      : ${API}\n`);

const results = [];

for (const check of checks) {
  process.stdout.write(`⏳  [${check.id}] ${check.title} ... `);

  const r = await req(check.method, check.url, check.body);

  const assertResults = [];
  let allPass = true;

  for (const assertLine of check.asserts) {
    const { pass, reason } = evalAssert(assertLine, r.status, r.json);
    assertResults.push({ assertLine, pass, reason });
    if (!pass) allPass = false;
  }

  // Si pas d'asserts définis, fallback: HTTP 200 + pas d'erreur connue
  if (check.asserts.length === 0) {
    const pass = r.ok && r.json?.status !== "error";
    assertResults.push({
      assertLine: "status_http: 2xx (fallback)",
      pass,
      reason: pass ? `HTTP ${r.status}` : `HTTP ${r.status} — ${r.json?.message ?? r.networkError ?? "erreur"}`,
    });
    if (!pass) allPass = false;
  }

  const status = allPass ? "✅" : "❌";
  const icon = allPass ? "✅" : "❌";
  console.log(icon);

  for (const ar of assertResults) {
    const a = ar.pass ? "  ✓" : "  ✗";
    console.log(`${a}  ${ar.reason}`);
  }
  console.log("");

  results.push({ check, r, assertResults, allPass, status });
}

// ── Stats ────────────────────────────────────────────────────────────────────
const total = results.length;
const fixed = results.filter((r) => r.allPass).length;
const broken = results.filter((r) => !r.allPass).length;

console.log("─".repeat(60));
console.log(`📊  ${fixed}/${total} corrigés  |  ❌ ${broken} échoués`);
console.log("─".repeat(60));

// ── Génération rapport MD ────────────────────────────────────────────────────
const sourceTitle = mdContent.match(/^#\s+(.+)/m)?.[1] ?? GAPS_FILE;

const md = [
  `# Rapport d'audit — ${DATE_STR}`,
  ``,
  `**Source gaps :** \`${GAPS_FILE}\`  `,
  `**API :** ${API}  `,
  `**Généré le :** ${new Date().toISOString()}`,
  ``,
  `## Résumé`,
  ``,
  `| Statut | Nombre |`,
  `|--------|--------|`,
  `| ✅ Corrigé / OK | ${fixed} |`,
  `| ❌ Bug confirmé | ${broken} |`,
  `| **Total** | **${total}** |`,
  ``,
  `---`,
  ``,
  `## Détail`,
  ``,
];

for (const { check, r, assertResults, allPass } of results) {
  md.push(`### ${allPass ? "✅" : "❌"} [${check.id}] ${check.title}`);
  md.push(``);
  md.push(`| Clé | Valeur |`);
  md.push(`|-----|--------|`);
  md.push(`| **Type** | ${check.type ?? "—"} |`);
  md.push(`| **Endpoint** | \`${check.method} ${check.url}\` |`);
  md.push(`| **HTTP reçu** | ${r.status} |`);
  if (check.symptom) md.push(`| **Symptôme** | ${check.symptom} |`);
  md.push(``);

  md.push(`**Assertions :**`);
  md.push(``);
  for (const ar of assertResults) {
    md.push(`- ${ar.pass ? "✅" : "❌"} \`${ar.assertLine}\` — ${ar.reason}`);
  }
  md.push(``);

  // Extrait de la réponse (limité)
  if (r.json) {
    md.push(`<details><summary>Réponse API</summary>`);
    md.push(``);
    md.push("```json");
    md.push(JSON.stringify(r.json, null, 2).slice(0, 800));
    md.push("```");
    md.push(``);
    md.push(`</details>`);
    md.push(``);
  }

  if (check.notes) {
    md.push(`> **Notes :** ${check.notes}`);
    md.push(``);
  }

  md.push(`---`);
  md.push(``);
}

md.push(`*Généré par \`audit-gaps-franchise.mjs\` le ${new Date().toISOString()}*`);

writeFileSync(OUTPUT_FILE, md.join("\n"), "utf8");
console.log(`\n📄  Rapport : ${OUTPUT_FILE}\n`);
