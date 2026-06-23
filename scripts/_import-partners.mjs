/**
 * IMPORT DES PARTENAIRES (depuis docs/la liste des partenaires.xlsx) vers l'API live.
 *
 * Décisions (validées) :
 *  - partner_type = FLEET pour tous
 *  - HERMAN : email corrigé kherman@2022@gmail.com -> kherman2022@gmail.com
 *  - KOUDOU Marc (sans email) : IGNORÉ (création manuelle plus tard)
 *  - mot de passe commun temporaire : Upjunoo@2026
 *  - société (colonne ENTREPRISE) -> legal_form COMPANY (gérant = NOM/PRÉNOMS)
 *    sinon -> INDIVIDUAL
 *  - ville = Abidjan (catalogue) ; commune réelle conservée dans `address`
 *
 * Idempotent : saute tout email déjà présent côté API.
 *
 * Usage :
 *   node scripts/_import-partners.mjs --test     # crée 1 physique + 1 société puis s'arrête
 *   node scripts/_import-partners.mjs            # crée tous les restants
 *   node scripts/_import-partners.mjs --dry-run  # n'appelle pas l'API (récap + CSV prévisionnel)
 */
import { createRequire } from "module";
import { writeFileSync } from "fs";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const XLSX_PATH = "docs/la liste des partenaires.xlsx";

const COMMON_PASSWORD = "Upjunoo@2026";
const PARTNER_TYPE = "FLEET";
const EMAIL_FIXES = { "kherman@2022@gmail.com": "kherman2022@gmail.com" };

const argv = process.argv.slice(2);
const TEST = argv.includes("--test");
const DRY = argv.includes("--dry-run");

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
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

function normKey(k) {
  return String(k).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatPhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("225")) return `+${digits}`;
  return `+225${digits}`;
}

function titleCase(s) {
  return s.replace(/\w[^\s'-]*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function parseXlsx() {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const sample = rows[0] ?? {};
  const km = {};
  for (const key of Object.keys(sample)) {
    const nk = normKey(key);
    if (nk === "nom") km.nom = key;
    else if (nk.startsWith("prenom")) km.prenoms = key;
    else if (nk.includes("lieu") || nk === "lieudactivite") km.lieu = key;
    else if (nk === "contact") km.contact = key;
    else if (nk.includes("adresseemail") || nk === "email") km.email = key;
    else if (nk === "entreprise") km.entreprise = key;
    else if (nk === "partenaire") km.partenaire = key;
  }
  return rows
    .map((r) => ({
      nom: String(r[km.nom] ?? "").trim(),
      prenoms: String(r[km.prenoms] ?? "").trim(),
      lieu: String(r[km.lieu] ?? "").trim(),
      contact: String(r[km.contact] ?? "").trim(),
      email: String(r[km.email] ?? "").trim(),
      entreprise: String(r[km.entreprise] ?? "").trim(),
      partenaire: String(r[km.partenaire] ?? "").trim(),
    }))
    .filter((r) => r.nom || r.prenoms || r.entreprise);
}

function buildPayload(row, ctx) {
  const isCompany = Boolean(row.entreprise);
  const fullName = `${row.nom} ${titleCase(row.prenoms)}`.trim();
  const legalName = isCompany ? row.entreprise : fullName;
  const phone = formatPhone(row.contact);
  const address = [row.lieu, row.partenaire ? `réf ${row.partenaire}` : ""]
    .filter(Boolean)
    .join(" — ");

  const body = {
    franchiseId: ctx.franchiseId,
    legalName,
    tradeName: legalName,
    cityId: ctx.cityId,
    email: row._email,
    password: COMMON_PASSWORD,
    contactEmail: row._email,
    partnerType: PARTNER_TYPE,
    legalForm: isCompany ? "COMPANY" : "INDIVIDUAL",
  };
  if (phone) { body.contactPhone = phone; body.phone = phone; }
  if (address) body.address = address;
  if (isCompany) {
    body.managerFirstName = titleCase(row.prenoms);
    body.managerLastName = row.nom;
  }
  return body;
}

async function fetchExistingEmails(token) {
  const emails = new Set();
  for (let page = 1; page <= 20; page++) {
    const res = await api(`/v1/admin/partners?page=${page}&limit=100`, { token });
    const items = res.json?.items ?? res.json?.data ?? [];
    for (const it of items) {
      const e = (it.contact_email ?? it.contactEmail ?? "").toLowerCase().trim();
      if (e) emails.add(e);
    }
    const total = res.json?.pagination?.total ?? items.length;
    if (items.length < 100 || emails.size >= total) break;
  }
  return emails;
}

function toCsv(results) {
  const head = ["idx", "status", "legalForm", "display", "email", "password", "phone", "partnerId", "httpStatus", "error"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.join(",")];
  for (const r of results) {
    lines.push([r.idx, r.status, r.legalForm, r.display, r.email, r.password, r.phone, r.partnerId, r.httpStatus, r.error].map(esc).join(","));
  }
  return lines.join("\r\n");
}

async function main() {
  const rows = parseXlsx();

  // Prépare emails (fix HERMAN, marque les invalides)
  const eligible = [];
  const skippedNoEmail = [];
  for (const row of rows) {
    let email = row.email;
    if (EMAIL_FIXES[email]) email = EMAIL_FIXES[email];
    if (!isEmail(email)) { skippedNoEmail.push(row); continue; }
    row._email = email.toLowerCase();
    eligible.push(row);
  }

  console.log(`\n=== IMPORT PARTENAIRES ${DRY ? "(DRY-RUN)" : TEST ? "(TEST)" : "(LIVE)"} ===`);
  console.log(`Lignes xlsx : ${rows.length} | éligibles : ${eligible.length} | ignorées (email) : ${skippedNoEmail.length}`);
  for (const r of skippedNoEmail) console.log(`   ⏭️  ignoré (email manquant/invalide) : ${r.nom} ${r.prenoms} (${r.email || "vide"})`);

  // Login + contexte (franchise + ville Abidjan)
  const login = await api("/v1/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) { console.error("Login échoué", login.status); process.exit(1); }

  const fr = await api("/v1/admin/franchises?page=1&limit=10", { token });
  const franchise = (fr.json?.items ?? fr.json?.data ?? [])[0];
  const cc = await api("/v1/catalog/countries/CI/cities", { token });
  const cities = cc.json?.items ?? cc.json?.cities ?? cc.json?.data ?? [];
  const abidjan = cities.find((c) => (c.label ?? c.name ?? "").toLowerCase() === "abidjan");
  if (!franchise?.id || !abidjan?.id) { console.error("Franchise ou ville Abidjan introuvable"); process.exit(1); }
  const ctx = { franchiseId: String(franchise.id), cityId: String(abidjan.id) };
  console.log(`Contexte : franchise="${franchise.name}" (${ctx.franchiseId}) | ville=Abidjan (${ctx.cityId})`);

  const existing = DRY ? new Set() : await fetchExistingEmails(token);
  console.log(`Partenaires déjà existants côté API : ${existing.size}`);

  // Sélection à créer
  let toCreate = eligible.filter((r) => !existing.has(r._email));
  if (TEST) {
    const firstIndiv = toCreate.find((r) => !r.entreprise);
    const firstCompany = toCreate.find((r) => r.entreprise);
    toCreate = [firstIndiv, firstCompany].filter(Boolean);
    console.log(`\nMODE TEST : création de ${toCreate.length} partenaire(s) (1 physique + 1 société).`);
  }

  const results = [];
  let idx = 0;
  for (const row of eligible) {
    idx++;
    const isCompany = Boolean(row.entreprise);
    const display = isCompany ? row.entreprise : `${row.nom} ${titleCase(row.prenoms)}`;
    const base = {
      idx, legalForm: isCompany ? "COMPANY" : "INDIVIDUAL", display,
      email: row._email, password: COMMON_PASSWORD, phone: formatPhone(row.contact),
      partnerId: "", httpStatus: "", error: "",
    };

    if (existing.has(row._email)) { results.push({ ...base, status: "déjà existant" }); continue; }
    if (!toCreate.includes(row)) { results.push({ ...base, status: "non traité (mode test)" }); continue; }

    const body = buildPayload(row, ctx);
    if (DRY) { results.push({ ...base, status: "dry-run (non créé)" }); continue; }

    const res = await api("/v1/partners", { method: "POST", token, body });
    if (res.ok && res.json?.partner?.id) {
      results.push({ ...base, status: "créé", partnerId: res.json.partner.id, httpStatus: res.status });
      console.log(`   ✅ [${idx}] ${base.legalForm} ${display} -> ${res.json.partner.id}`);
    } else {
      const err = res.json?.error?.message ?? res.json?.message ?? JSON.stringify(res.json).slice(0, 200);
      results.push({ ...base, status: "ERREUR", httpStatus: res.status, error: err });
      console.log(`   ❌ [${idx}] ${display} -> HTTP ${res.status} : ${err}`);
    }
  }

  // Récap + CSV
  const counts = results.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  console.log(`\n=== RÉCAP ===`);
  for (const [k, v] of Object.entries(counts)) console.log(`   ${k} : ${v}`);
  const csv = toCsv(results);
  const out = `scripts/_import-partners-result${TEST ? "-test" : DRY ? "-dryrun" : ""}.csv`;
  writeFileSync(out, "﻿" + csv, "utf8");
  console.log(`\nCSV écrit : ${out}`);

  // Vérification post-test : relire les créés
  if (TEST && !DRY) {
    for (const r of results.filter((x) => x.status === "créé")) {
      const detail = await api(`/v1/admin/partners/${r.partnerId}`, { token });
      const p = detail.json?.partner ?? {};
      console.log(`\n🔎 Vérif ${r.partnerId} :`);
      console.log(`   legal_form=${p.legal_form} | legal_name=${p.legal_name} | manager=${p.manager_first_name ?? "-"} ${p.manager_last_name ?? "-"} | display=${p.manager_display_name ?? "-"}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
