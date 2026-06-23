/**
 * Script #2 — Application de correctifs frontend
 *
 * Lit un fichier MD de correctifs (format standard FIXES_*.md),
 * applique les modifications dans les fichiers TS/TSX du projet
 * et génère un rapport d'implémentation.
 *
 * Usage:
 *   node scripts/apply-frontend-fixes.mjs \
 *     --fixes=FRONTEND_FIXES_2026-06-20.md \
 *     [--dry-run]          ← simule sans écrire
 *     [--output=FIXES_APPLIED_<date>.md]
 *
 * Format des blocs FIX dans le MD :
 *
 *   ## FIX-001 · Description courte
 *   **Fichier :** src/features/franchise/api/trips.service.ts
 *   **Action :** replace | insert_after | insert_before | create_file | delete_lines
 *   **Recherche :**
 *   ```
 *   texte exact à trouver (pour replace/insert_after/insert_before)
 *   ```
 *   **Remplacement :**
 *   ```
 *   nouveau texte
 *   ```
 *   **Raison :** Explication du correctif
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const argv = process.argv.slice(2);

function getArg(name) {
  const found = argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : null;
}

const FIXES_FILE = getArg("fixes");
const DRY_RUN = argv.includes("--dry-run");
const DATE_STR = new Date().toISOString().slice(0, 10);
const OUTPUT_FILE = getArg("output") ?? `FIXES_APPLIED_${DATE_STR}.md`;

// Racine du projet = dossier parent de scripts/
const PROJECT_ROOT = new URL("../", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\//g, "\\");

if (!FIXES_FILE) {
  console.error("❌  --fixes=<fichier.md> est obligatoire");
  console.error("    Exemple: node scripts/apply-frontend-fixes.mjs --fixes=FRONTEND_FIXES_2026-06-20.md");
  process.exit(1);
}

console.log(`\n🔧  Application de correctifs frontend — ${DATE_STR}`);
console.log(`    Fichier fixes : ${FIXES_FILE}`);
console.log(`    Projet root   : ${PROJECT_ROOT}`);
if (DRY_RUN) console.log(`    MODE          : DRY-RUN (aucun fichier modifié)\n`);
else console.log(`    MODE          : LIVE (fichiers modifiés)\n`);

// ── Parser le MD de correctifs ────────────────────────────────────────────────
function extractCodeBlock(text) {
  // Extrait le contenu entre ``` ... ``` (premier bloc trouvé)
  const match = text.match(/```[^\n]*\n([\s\S]*?)```/);
  return match ? match[1] : null;
}

function parseFixes(content) {
  const fixes = [];
  const blocks = content.split(/^## FIX-/m).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    const headerLine = lines[0].trim();
    const headerMatch = headerLine.match(/^(\w+)\s*[·\-]\s*(.*)/);
    const id = headerMatch ? `FIX-${headerMatch[1]}` : `FIX-?`;
    const title = headerMatch ? headerMatch[2].trim() : headerLine;

    const fix = {
      id,
      title,
      file: null,
      action: null,
      search: null,
      replacement: null,
      reason: null,
      skip: false,
      skipReason: null,
    };

    // Reconstruit le bloc complet pour extraire les code blocks
    const fullBlock = block;

    // Extrait **Fichier :**
    const fileMatch = fullBlock.match(/\*\*Fichier\s*:\*\*\s*(.+)/);
    if (fileMatch) fix.file = fileMatch[1].trim();

    // Extrait **Action :**
    const actionMatch = fullBlock.match(/\*\*Action\s*:\*\*\s*(.+)/);
    if (actionMatch) fix.action = actionMatch[1].trim().toLowerCase();

    // Extrait **Raison :**
    const raisonMatch = fullBlock.match(/\*\*Raison\s*:\*\*\s*(.+)/);
    if (raisonMatch) fix.reason = raisonMatch[1].trim();

    // Extrait **Skip :**
    const skipMatch = fullBlock.match(/\*\*Skip\s*:\*\*\s*(.+)/);
    if (skipMatch) {
      fix.skip = true;
      fix.skipReason = skipMatch[1].trim();
    }

    // Extrait les blocs code : Recherche et Remplacement
    // On cherche les sections **Recherche :** et **Remplacement :**
    const searchSection = fullBlock.match(/\*\*Recherche\s*:\*\*[\s\S]*?(```[\s\S]*?```)/);
    if (searchSection) fix.search = extractCodeBlock(searchSection[1] + "\n");

    const replaceSection = fullBlock.match(/\*\*Remplacement\s*:\*\*[\s\S]*?(```[\s\S]*?```)/);
    if (replaceSection) fix.replacement = extractCodeBlock(replaceSection[1] + "\n");

    // Pour create_file, **Contenu :** au lieu de **Remplacement :**
    const contentSection = fullBlock.match(/\*\*Contenu\s*:\*\*[\s\S]*?(```[\s\S]*?```)/);
    if (contentSection && !fix.replacement) fix.replacement = extractCodeBlock(contentSection[1] + "\n");

    if (fix.file && fix.action) fixes.push(fix);
  }

  return fixes;
}

// ── Appliquer un correctif ────────────────────────────────────────────────────
function applyFix(fix) {
  const filePath = `${PROJECT_ROOT}${fix.file.replace(/\//g, "\\")}`;

  if (fix.action === "create_file") {
    if (existsSync(filePath)) {
      return { status: "⚠️", detail: `Fichier déjà existant — skip (supprimer manuellement si nécessaire)` };
    }
    if (!DRY_RUN) {
      const dir = dirname(filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, fix.replacement ?? "", "utf8");
    }
    return { status: "✅", detail: `Fichier créé${DRY_RUN ? " (dry-run)" : ""}` };
  }

  // Pour les autres actions, le fichier doit exister
  if (!existsSync(filePath)) {
    return { status: "❌", detail: `Fichier introuvable : ${filePath}` };
  }

  const original = readFileSync(filePath, "utf8");

  if (fix.action === "replace") {
    if (!fix.search) return { status: "❌", detail: "Section **Recherche :** manquante dans le FIX" };
    if (!original.includes(fix.search)) {
      return { status: "⚠️", detail: `Texte recherché non trouvé dans le fichier — peut-être déjà appliqué ?` };
    }
    const updated = original.replace(fix.search, fix.replacement ?? "");
    if (!DRY_RUN) writeFileSync(filePath, updated, "utf8");
    const linesChanged = (fix.replacement ?? "").split("\n").length;
    return { status: "✅", detail: `Remplacement appliqué (${linesChanged} lignes)${DRY_RUN ? " (dry-run)" : ""}` };
  }

  if (fix.action === "replace_all") {
    if (!fix.search) return { status: "❌", detail: "Section **Recherche :** manquante dans le FIX" };
    if (!original.includes(fix.search)) {
      return { status: "⚠️", detail: `Texte recherché non trouvé — peut-être déjà appliqué ?` };
    }
    const updated = original.split(fix.search).join(fix.replacement ?? "");
    if (!DRY_RUN) writeFileSync(filePath, updated, "utf8");
    const count = original.split(fix.search).length - 1;
    return { status: "✅", detail: `${count} occurrence(s) remplacée(s)${DRY_RUN ? " (dry-run)" : ""}` };
  }

  if (fix.action === "insert_after") {
    if (!fix.search) return { status: "❌", detail: "Section **Recherche :** manquante" };
    if (!original.includes(fix.search)) {
      return { status: "⚠️", detail: `Ancre non trouvée dans le fichier — peut-être déjà appliqué ?` };
    }
    const updated = original.replace(fix.search, `${fix.search}\n${fix.replacement ?? ""}`);
    if (!DRY_RUN) writeFileSync(filePath, updated, "utf8");
    return { status: "✅", detail: `Insertion après ancre effectuée${DRY_RUN ? " (dry-run)" : ""}` };
  }

  if (fix.action === "insert_before") {
    if (!fix.search) return { status: "❌", detail: "Section **Recherche :** manquante" };
    if (!original.includes(fix.search)) {
      return { status: "⚠️", detail: `Ancre non trouvée dans le fichier — peut-être déjà appliqué ?` };
    }
    const updated = original.replace(fix.search, `${fix.replacement ?? ""}\n${fix.search}`);
    if (!DRY_RUN) writeFileSync(filePath, updated, "utf8");
    return { status: "✅", detail: `Insertion avant ancre effectuée${DRY_RUN ? " (dry-run)" : ""}` };
  }

  if (fix.action === "delete_lines") {
    if (!fix.search) return { status: "❌", detail: "Section **Recherche :** manquante" };
    if (!original.includes(fix.search)) {
      return { status: "⚠️", detail: `Texte à supprimer non trouvé — peut-être déjà supprimé ?` };
    }
    const updated = original.replace(fix.search, "");
    if (!DRY_RUN) writeFileSync(filePath, updated, "utf8");
    return { status: "✅", detail: `Lignes supprimées${DRY_RUN ? " (dry-run)" : ""}` };
  }

  return { status: "❌", detail: `Action inconnue : "${fix.action}". Actions valides : replace, replace_all, insert_after, insert_before, delete_lines, create_file` };
}

// ── Main ──────────────────────────────────────────────────────────────────────
let mdContent;
try {
  mdContent = readFileSync(FIXES_FILE, "utf8");
} catch {
  console.error(`❌  Fichier introuvable : ${FIXES_FILE}`);
  process.exit(1);
}

const fixes = parseFixes(mdContent);

if (fixes.length === 0) {
  console.error(`❌  Aucun bloc FIX-xxx trouvé dans ${FIXES_FILE}`);
  console.error(`    Vérifier que le fichier suit le format standard (## FIX-001 · ...)`);
  process.exit(1);
}

console.log(`    Correctifs trouvés : ${fixes.length}\n`);

const results = [];

for (const fix of fixes) {
  if (fix.skip) {
    console.log(`⏭️   [${fix.id}] ${fix.title}`);
    console.log(`     Skipped : ${fix.skipReason ?? "marqué skip"}\n`);
    results.push({ fix, status: "⏭️", detail: fix.skipReason ?? "Skipped manuellement" });
    continue;
  }

  process.stdout.write(`⏳  [${fix.id}] ${fix.title} ... `);
  const { status, detail } = applyFix(fix);
  console.log(status);
  console.log(`     ${detail}`);
  if (fix.reason) console.log(`     Raison : ${fix.reason}`);
  console.log(`     Fichier : ${fix.file}\n`);
  results.push({ fix, status, detail });
}

// ── Stats ────────────────────────────────────────────────────────────────────
const total = results.length;
const applied = results.filter((r) => r.status === "✅").length;
const failed = results.filter((r) => r.status === "❌").length;
const partial = results.filter((r) => r.status === "⚠️").length;
const skipped = results.filter((r) => r.status === "⏭️").length;

console.log("─".repeat(60));
console.log(`📊  ${applied}/${total} appliqués  |  ❌ ${failed} échoués  |  ⚠️  ${partial} partiels  |  ⏭️  ${skipped} skipped`);
console.log("─".repeat(60));

// ── Rapport MD ───────────────────────────────────────────────────────────────
const md = [
  `# Rapport de correctifs frontend — ${DATE_STR}`,
  ``,
  `**Source fixes :** \`${FIXES_FILE}\`  `,
  `**Mode :** ${DRY_RUN ? "Dry-run (simulation)" : "Live (fichiers modifiés)"}  `,
  `**Généré le :** ${new Date().toISOString()}`,
  ``,
  `## Résumé`,
  ``,
  `| Statut | Nombre |`,
  `|--------|--------|`,
  `| ✅ Appliqué | ${applied} |`,
  `| ❌ Échec | ${failed} |`,
  `| ⚠️ Partiel / Déjà appliqué | ${partial} |`,
  `| ⏭️ Skipped | ${skipped} |`,
  `| **Total** | **${total}** |`,
  ``,
  `---`,
  ``,
  `## Détail`,
  ``,
];

for (const { fix, status, detail } of results) {
  md.push(`### ${status} [${fix.id}] ${fix.title}`);
  md.push(``);
  md.push(`| Clé | Valeur |`);
  md.push(`|-----|--------|`);
  md.push(`| **Fichier** | \`${fix.file ?? "N/A"}\` |`);
  md.push(`| **Action** | \`${fix.action ?? "N/A"}\` |`);
  md.push(`| **Résultat** | ${detail} |`);
  if (fix.reason) md.push(`| **Raison** | ${fix.reason} |`);
  md.push(``);
  md.push(`---`);
  md.push(``);
}

md.push(`*Généré par \`apply-frontend-fixes.mjs\` le ${new Date().toISOString()}*`);

writeFileSync(OUTPUT_FILE, md.join("\n"), "utf8");
console.log(`\n📄  Rapport : ${OUTPUT_FILE}\n`);
