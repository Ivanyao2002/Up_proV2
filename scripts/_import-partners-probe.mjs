/**
 * SONDE LECTURE SEULE — préparation de l'import des partenaires.
 * - Parse docs/la liste des partenaires.xlsx (accents corrects)
 * - Login admin + liste des franchises + villes catalogue CI
 * Aucune création. Usage: node scripts/_import-partners-probe.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const XLSX_PATH = "docs/la liste des partenaires.xlsx";

async function api(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

function normKey(k) {
  return String(k).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}

function parseXlsx() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  // map headers
  const sample = rows[0] ?? {};
  const keyMap = {};
  for (const key of Object.keys(sample)) {
    const nk = normKey(key);
    if (nk.startsWith("nom") && !nk.includes("entreprise")) keyMap.nom = key;
    else if (nk.startsWith("prenom")) keyMap.prenoms = key;
    else if (nk === "sexe") keyMap.sexe = key;
    else if (nk.includes("lieu") || nk.includes("activite")) keyMap.lieu = key;
    else if (nk.includes("contact")) keyMap.contact = key;
    else if (nk.includes("email") || nk.includes("adresse")) keyMap.email = key;
    else if (nk.includes("entreprise")) keyMap.entreprise = key;
    else if (nk.includes("typedecompte") || nk.includes("typecompte")) keyMap.typeCompte = key;
    else if (nk.includes("compte")) keyMap.compte = key;
    else if (nk.includes("partenaire")) keyMap.partenaire = key;
  }
  const parsed = rows
    .map((r) => ({
      nom: String(r[keyMap.nom] ?? "").trim(),
      prenoms: String(r[keyMap.prenoms] ?? "").trim(),
      sexe: String(r[keyMap.sexe] ?? "").trim(),
      lieu: String(r[keyMap.lieu] ?? "").trim(),
      contact: String(r[keyMap.contact] ?? "").trim(),
      email: String(r[keyMap.email] ?? "").trim(),
      compte: String(r[keyMap.compte] ?? "").trim(),
      typeCompte: String(r[keyMap.typeCompte] ?? "").trim(),
      entreprise: String(r[keyMap.entreprise] ?? "").trim(),
      partenaire: String(r[keyMap.partenaire] ?? "").trim(),
    }))
    .filter((r) => r.nom || r.prenoms || r.entreprise);
  return { keyMap, headers: Object.keys(sample), parsed };
}

function main2(parsed) {
  const entreprises = parsed.filter((r) => r.entreprise);
  const noEmail = parsed.filter((r) => !r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
  const dupEmails = {};
  for (const r of parsed) if (r.email) dupEmails[r.email.toLowerCase()] = (dupEmails[r.email.toLowerCase()] ?? 0) + 1;
  const dups = Object.entries(dupEmails).filter(([, n]) => n > 1);
  const lieux = [...new Set(parsed.map((r) => r.lieu).filter(Boolean))].sort();

  console.log(`\n===== XLSX =====`);
  console.log(`Total lignes exploitables : ${parsed.length}`);
  console.log(`→ Personnes morales (ENTREPRISE) : ${entreprises.length}`);
  console.log(`→ Personnes physiques            : ${parsed.length - entreprises.length}`);
  console.log(`\nSans email valide (${noEmail.length}) :`);
  for (const r of noEmail) console.log(`   - ${r.nom} ${r.prenoms} | email="${r.email}" | contact=${r.contact}`);
  console.log(`\nEmails en double (${dups.length}) :`);
  for (const [e, n] of dups) console.log(`   - ${e} ×${n}`);
  console.log(`\nLIEU D'ACTIVITÉ distincts (${lieux.length}) :\n   ${lieux.join(", ")}`);
}

async function main() {
  const { keyMap, headers, parsed } = parseXlsx();
  console.log("Colonnes xlsx détectées :", headers);
  console.log("Mapping colonnes :", keyMap);
  main2(parsed);

  console.log(`\n===== API (${API_URL}) =====`);
  const login = await api("/v1/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) { console.error("Login échoué", login.status, JSON.stringify(login.json).slice(0, 300)); process.exit(1); }
  console.log("Login admin : OK");

  const fr = await api("/v1/admin/franchises?page=1&limit=100", { token });
  const frItems = fr.json?.items ?? fr.json?.data ?? fr.json?.franchises ?? [];
  console.log(`\nFranchises (${frItems.length}) :`);
  for (const f of frItems) {
    console.log(`   - id=${f.id} | name=${f.name ?? f.legal_name ?? "?"} | city=${f.city ?? f.cityLabel ?? f.city_id ?? "?"} | country=${f.country_code ?? f.country_id ?? "?"}`);
  }

  // Villes CI
  let cityItems = [];
  const cca = await api("/v1/catalog/countries/CI/cities", { token });
  cityItems = cca.json?.items ?? cca.json?.cities ?? cca.json?.data ?? [];
  if (!cityItems.length) {
    const boot = await api("/v1/catalog/bootstrap", { token });
    cityItems = boot.json?.cities ?? boot.json?.data?.cities ?? [];
  }
  console.log(`\nVilles catalogue CI (${cityItems.length}) :`);
  for (const c of cityItems) console.log(`   - id=${c.id} | label=${c.label ?? c.name ?? "?"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
