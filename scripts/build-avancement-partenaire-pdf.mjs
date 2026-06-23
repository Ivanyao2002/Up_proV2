/**
 * Génère le "Rapport d'Avancement — Portail Partenaire" en HTML brandé,
 * dans le style de guide-pdf/RAPPORT_AVANCEMENT_FRANCHISE.pdf.
 *
 * Usage: node scripts/build-avancement-partenaire-pdf.mjs
 * Sortie: guide-pdf/rapport-avancement-portail-partenaire.html
 *         (convertir ensuite via scripts/html-to-pdf.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(path.resolve(__dirname, ".."), "guide-pdf");
fs.mkdirSync(OUT_DIR, { recursive: true });

const REPORTER = "Yao Ivan · Équipe Front";
const TOTAL_PAGES = 5;

// ── Données ────────────────────────────────────────────────────────────────
const domains = [
  { label: "Ma Flotte (dashboard, véhicules, chauffeurs, courses, carte, perf.)", pct: 88 },
  { label: "Location (réservations location)", pct: 85 },
  { label: "Compte (profil, membres équipe)", pct: 85 },
  { label: "Activité (courses, récurrentes, shifts, rapports)", pct: 80 },
  { label: "Support (chat, notifications)", pct: 80 },
  { label: "Finance (portefeuille, recharges, acomptes, revenus, ledger)", pct: 75 },
  { label: "Fret (offres, zones, détail)", pct: 45 },
  { label: "Tracking GPS", pct: 10 },
];

const detail = [
  ["Ma Flotte — dashboard, véhicules, chauffeurs, courses, carte live, perf.", "~98 %", "Listes & détails OK, KYC / assignation / recharge OK", "BON", "ok"],
  ["Compte — profil, membres équipe", "~95 %", "Membres CRUD OK ; documents profil → 403 (endpoint admin)", "BON", "ok"],
  ["Location — réservations location", "~90 %", "Création + actions de statut OK", "BON", "ok"],
  ["Activité — courses, récurrentes, shifts, rapports", "~95 %", "Lecture OK ; création de shift absente côté UI", "PARTIEL", "warn"],
  ["Support — chat, notifications", "100 %", "Endpoints OK ; pas de temps réel (socket absent)", "PARTIEL", "warn"],
  ["Finance — portefeuille, recharges, acomptes, revenus, ledger", "~95 %", "Wallet / retrait / transferts OK ; top-up OK (endpoint 200, bug front payload/PSP) ; acomptes OK (endpoint 200, catch silencieux front)", "BON", "ok"],
  ["Fret — offres, zones, détail", "~70 %", "Offres OK ; détail cassé (build error), zones mockées", "INCOMPLET", "bad"],
  ["Tracking GPS", "~30 %", "Aucune API — données mockées, carte non fonctionnelle", "MOCK", "bad"],
];

const anomalies = [
  ["/partner/freight/[id]", "Imports inexistants → build error → HTTP 500 sur tout le portail", "À CORRIGER (front)", "warn"],
  ["/partner/freight/zones", "Données mockées + création / édition / suppression inopérantes", "À CORRIGER (front)", "warn"],
  ["/partner/tracking", "Page entièrement mockée, carte non fonctionnelle", "À CORRIGER (front)", "warn"],
  ["POST /v1/partners/{id}/wallet/top-up", "Endpoint OK (200) — bug front : payload manquant + flux PSP non implémenté", "À CORRIGER (front)", "warn"],
  ["GET /v1/partners/{id}/revenue", "Params ignorés → recherche & pagination inertes", "À CORRIGER (front)", "warn"],
  ["GET /v1/partners/{id}/settlements", "Endpoint OK (200, items=[], pagination) — bug front : catch silencieux wallet.service.ts:421 masque le résultat", "À CORRIGER (front)", "warn"],
  ["GET /v1/admin/kyc/documents", "403 — endpoint admin appelé pour un partenaire", "À CORRIGER (front)", "warn"],
  ["Socket.io (carte live + notifications)", "Absent — fonctionne en polling / refresh HTTP", "BACKEND", "back"],
];

// ── Helpers HTML ─────────────────────────────────────────────────────────────
const barColor = (p) => (p >= 85 ? "var(--teal)" : p >= 50 ? "var(--gold)" : "var(--red)");
const statutPill = (txt, kind) => {
  const map = { ok: "pill-green", warn: "pill-amber", bad: "pill-red", back: "pill-amber" };
  return `<span class="pill ${map[kind] || "pill-gray"}">${txt}</span>`;
};

function footer(pageNum) {
  return `<div class="footer">
    <span>UPJUNOO PRO — Avancement Portail Partenaire</span>
    <span class="rep">Rapporteur : ${REPORTER}</span>
    <span>Page ${pageNum} / ${TOTAL_PAGES}</span>
  </div>`;
}

const callout = (kind, icon, title, body) =>
  `<div class="callout ${kind}"><p><span class="ico">${icon}</span><b>${title}</b> — ${body}</p></div>`;

const p0card = (title, body) =>
  `<div class="p0"><div class="p0-head"><span class="badge-p0">P0</span><b>${title}</b></div><p>${body}</p></div>`;
const pXcard = (lvl, title, body) =>
  `<div class="pX ${lvl === "P1" ? "lvl-p1" : "lvl-p2"}"><div class="p0-head"><span class="badge-${lvl}">${lvl}</span><b>${title}</b></div><p>${body}</p></div>`;

// ── HTML ─────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Rapport d'Avancement — Portail Partenaire</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --teal: #0e6e6a; --teal-d: #0a5a57; --gold: #f5b301; --gold-d:#e0a200;
    --ink: #14333a; --muted: #5b7177; --line: #e3eaec; --bg: #f6f9f9; --red:#e23b3b;
    --green:#1f9d57; --green-bg:#e9f7ef; --amber-bg:#fdf6e3; --red-bg:#fdecec; --green-bg2:#eaf7f0;
  }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: var(--ink); font-size: 12.5px; line-height: 1.5; }
  .page { page-break-after: always; position: relative; padding: 16mm 15mm 20mm; min-height: 297mm; }
  .page:last-child { page-break-after: avoid; }

  /* ── COVER ── */
  .cover { background: var(--teal); color: #fff; padding: 22mm 18mm; overflow: hidden; }
  .cover .c1 { position:absolute; top:-70px; right:-60px; width:360px; height:360px; border-radius:50%; background: rgba(255,255,255,.05);}
  .cover .c2 { position:absolute; bottom:-120px; left:-90px; width:340px; height:340px; border-radius:50%; background: rgba(255,255,255,.04);}
  .cover .logo { font-size: 30px; font-weight: 800; letter-spacing: .5px; margin-bottom: 30px; }
  .cover .logo b { color: var(--gold); }
  .cover .tag { background: var(--gold); color: #1a1a1a; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 9px 20px; border-radius: 999px; display:inline-block; margin-bottom: 30px; }
  .cover h1 { font-size: 46px; font-weight: 800; line-height: 1.08; margin-bottom: 4px; }
  .cover h1 .y { color: var(--gold); }
  .cover .lead { font-size: 15px; opacity: .9; max-width: 560px; margin-top: 18px; line-height: 1.6; }
  .cover .big { margin-top: 40px; display: flex; align-items: baseline; gap: 18px; }
  .cover .big .n { font-size: 92px; font-weight: 800; color: var(--gold); line-height: 1; }
  .cover .big .d { font-size: 15px; opacity: .9; }
  .cover .rule { width: 70px; height: 4px; background: var(--gold); margin: 34px 0 22px; border-radius:2px; }
  .cover .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 760px; }
  .cover .meta .k { font-size: 10px; letter-spacing: 1.2px; opacity: .65; margin-bottom: 5px; text-transform: uppercase; }
  .cover .meta .v { font-size: 13.5px; font-weight: 600; }
  .cover .who { margin-top: 30px; display:flex; align-items:center; gap: 12px; }
  .cover .ava { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; }
  .cover .who .nm { font-size: 13px; opacity:.92; }
  .cover .conf { margin-top: 26px; font-size: 12px; opacity: .7; letter-spacing: .3px; }

  /* ── Sections ── */
  h2.sec { font-size: 26px; font-weight: 800; color: var(--teal); margin-bottom: 4px; }
  h2.sec .y { color: var(--gold); }
  .sub { color: var(--muted); font-size: 12.5px; margin-bottom: 20px; }
  .blk { font-size: 13px; font-weight: 800; color: var(--ink); border-left: 4px solid var(--teal); padding-left: 9px; margin: 22px 0 12px; letter-spacing: .3px; }

  /* stat cards */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 6px; }
  .stat { border: 1px solid var(--line); border-radius: 12px; padding: 16px 16px 14px; border-top: 4px solid var(--teal); }
  .stat.g { border-top-color: var(--green); } .stat.y { border-top-color: var(--gold); } .stat.r { border-top-color: var(--red); }
  .stat .n { font-size: 30px; font-weight: 800; color: var(--ink); }
  .stat .l { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; margin-top: 4px; }

  /* callouts */
  .callout { border-radius: 10px; padding: 13px 16px; margin-bottom: 10px; font-size: 12.5px; }
  .callout .ico { font-weight: 800; margin-right: 4px; }
  .callout.green { background: var(--green-bg); border-left: 4px solid var(--green); }
  .callout.amber { background: var(--amber-bg); border-left: 4px solid var(--gold); }
  .callout.red   { background: var(--red-bg); border-left: 4px solid var(--red); }

  /* tables */
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: var(--teal); }
  th { color: #fff; text-align: left; font-size: 10.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; padding: 11px 12px; }
  td { padding: 11px 12px; border-bottom: 1px solid var(--line); font-size: 12px; vertical-align: top; }
  tbody tr:nth-child(even) { background: var(--bg); }
  .mono { font-family: 'Consolas', monospace; font-size: 11px; color: var(--teal-d); }

  /* pills */
  .pill { display:inline-block; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
  .pill-green { background: var(--green-bg); color: var(--green); }
  .pill-amber { background: #fcefcf; color: #a9760a; }
  .pill-red { background: var(--red-bg); color: var(--red); }
  .pill-gray { background: #eef2f2; color: var(--muted); }

  /* bar chart */
  .bar-row { display: grid; grid-template-columns: 230px 1fr 46px; align-items: center; gap: 12px; margin-bottom: 11px; }
  .bar-row .nm { font-size: 11.5px; font-weight: 600; }
  .track { background: #e6edee; border-radius: 999px; height: 15px; overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; }
  .bar-row .pc { font-size: 13px; font-weight: 800; text-align: right; }
  .legend { font-size: 10.5px; color: var(--muted); margin-top: 8px; }
  .legend b { display:inline-block; width:9px; height:9px; border-radius:2px; margin: 0 3px 0 10px; vertical-align: middle; }

  /* trois niveaux */
  .lvl-pill { background: var(--green-bg); color: var(--green); font-weight: 800; font-size: 11px; padding: 4px 9px; border-radius: 6px; }
  .lvl-pill.y { background:#fcefcf; color:#a9760a; }

  /* P0/PX cards */
  .p0, .pX { border-radius: 10px; padding: 13px 16px; margin-bottom: 11px; border-left: 4px solid var(--red); background: var(--red-bg); }
  .pX.lvl-p1 { border-left-color: var(--gold); background: var(--amber-bg); }
  .pX.lvl-p2 { border-left-color: var(--teal); background: var(--bg); }
  .p0-head { display:flex; align-items:center; gap: 9px; margin-bottom: 5px; }
  .p0-head b { font-size: 13.5px; }
  .badge-p0 { background: var(--red); color:#fff; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
  .badge-P1 { background: var(--gold); color:#1a1a1a; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
  .badge-P2 { background: var(--teal); color:#fff; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
  .p0 p, .pX p { font-size: 12px; line-height: 1.5; }

  .concl { background: var(--green-bg2); border-left: 4px solid var(--teal); border-radius: 10px; padding: 15px 18px; font-size: 12.5px; line-height: 1.6; margin-top: 6px; }

  .footer { position: absolute; bottom: 9mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items:center; font-size: 9.5px; color: #9bb0b3; border-top: 1px solid var(--line); padding-top: 7px; }
  .footer .rep { color: var(--teal); font-weight: 700; }
</style></head><body>

<!-- COVER -->
<section class="page cover">
  <div class="c1"></div><div class="c2"></div>
  <div class="logo">UPJUNOO <b>PRO</b></div>
  <div class="tag">● ÉTAT D'AVANCEMENT — PORTAIL PARTENAIRE</div>
  <h1>Rapport d'Avancement<br><span class="y">Portail Partenaire</span></h1>
  <p class="lead">Niveau de finition du portail Partenaire (web), santé de l'intégration au backend réel, et feuille de route restante pour atteindre 100 % de fonctionnement.</p>
  <div class="big"><div class="n">~82%</div><div class="d">de finition globale du module<br>au 23 juin 2026</div></div>
  <div class="rule"></div>
  <div class="meta">
    <div><div class="k">Date d'analyse</div><div class="v">23 Juin 2026</div></div>
    <div><div class="k">Périmètre</div><div class="v">Portail Partenaire (web) · 41 pages</div></div>
    <div><div class="k">Environnement</div><div class="v">api.upjunoo-dev.tech</div></div>
  </div>
  <div class="who"><div class="ava">YI</div><div class="nm">Rapporteur : <b>Yao Ivan</b> · Équipe Front</div></div>
  <div class="conf">CONFIDENTIEL TECHNIQUE | Version 1.0</div>
</section>

<!-- PAGE 1 — VUE D'ENSEMBLE -->
<section class="page">
  <h2 class="sec">Vue d'ensemble <span class="y">Avancement</span></h2>
  <p class="sub">Synthèse du niveau de finition du portail Partenaire au 23 juin 2026.</p>
  <div class="stats">
    <div class="stat"><div class="n">~82 %</div><div class="l">Finition globale</div></div>
    <div class="stat g"><div class="n">~95 %</div><div class="l">Front-end construit</div></div>
    <div class="stat y"><div class="n">~78 %</div><div class="l">Fonctionnel réel</div></div>
    <div class="stat r"><div class="n">29</div><div class="l">Anomalies ouvertes</div></div>
  </div>

  <div class="blk">LECTURE RAPIDE</div>
  ${callout("green", "✓", "Fondations très solides", "Ma Flotte (véhicules, chauffeurs, courses, carte, détails), Wallet (retrait, transferts), Membres, Location, Réservations et SOS sont construits et branchés sur le backend réel. C'est le cœur du portail, mature et stable.")}
  ${callout("amber", "⚠", "À finaliser", "Finance (top-up & acomptes : endpoints OK au 23/06, bugs front à corriger — payload/PSP et catch silencieux), Support (pas de temps réel / socket), Activité (création de shift absente côté UI) : l'interface est prête mais des actions clés restent inertes.")}
  ${callout("red", "✗", "Bloquants pour le 100 %", "3 pages reposent sur des données mockées ou cassées : Détail offre de fret (build error qui renvoie HTTP 500 sur tout le portail), Zones & Couloirs (mock + actions sans effet) et Tracking GPS (mock + carte non fonctionnelle).")}

  <div class="blk">TROIS NIVEAUX DE LECTURE</div>
  <p class="sub" style="font-style:italic;margin-bottom:12px">Le « pourcentage de finition » dépend de l'angle : code construit, fonctionnement réel, ou couverture du périmètre attendu.</p>
  <table>
    <thead><tr><th>Dimension</th><th>Niveau</th><th>Interprétation</th></tr></thead>
    <tbody>
      <tr><td><b>Front-end construit</b> (UI + câblage API)</td><td><span class="lvl-pill">~95 %</span></td><td>41 pages existent et sont reliées aux services API ; presque tous les écrans sont en place.</td></tr>
      <tr><td><b>Fonctionnel bout-en-bout</b> (vrai backend)</td><td><span class="lvl-pill y">~78 %</span></td><td>Listes & actions principales OK ; 3 pages mockées/cassées et quelques actions inertes.</td></tr>
      <tr><td><b>Couverture du périmètre</b></td><td><span class="lvl-pill y">~80 %</span></td><td>Modules attendus présents ; manquent surtout le vrai Fret bout-en-bout et le tracking réel.</td></tr>
    </tbody>
  </table>
  ${callout("green", "↗", "Trajectoire", "Test runtime du 23 juin : 37 routes parcourues, login OK, 36 chargées sans crash. Le front est en avance ; l'essentiel des écarts restants relève d'endpoints backend (top-up, acomptes, socket) et de 3 pages front à débrancher du mock.")}
  ${footer(1)}
</section>

<!-- PAGE 2 — AVANCEMENT PAR DOMAINE -->
<section class="page">
  <h2 class="sec">Avancement <span class="y">par domaine</span></h2>
  <p class="sub">Niveau de finition effectif (UI + intégration backend réelle) de chaque domaine du portail.</p>
  <div class="blk">NIVEAU DE FINITION</div>
  ${domains.map((d) => `
    <div class="bar-row">
      <div class="nm">${d.label}</div>
      <div class="track"><div class="fill" style="width:${d.pct}%;background:${barColor(d.pct)}"></div></div>
      <div class="pc">${d.pct}%</div>
    </div>`).join("")}
  <div class="legend"><b style="background:var(--teal)"></b>≥ 85 % <b style="background:var(--gold)"></b>50–84 % <b style="background:var(--red)"></b>&lt; 50 %</div>

  <div class="blk">DÉTAIL FRONT / BACKEND</div>
  <table>
    <thead><tr><th>Domaine</th><th>Front-end</th><th>Backend réel</th><th>Statut</th></tr></thead>
    <tbody>
      ${detail.map((r) => `<tr><td><b>${r[0].split(" — ")[0]}</b> — ${r[0].split(" — ")[1] || ""}</td><td><span class="pill pill-green">${r[1]}</span></td><td>${r[2]}</td><td>${statutPill(r[3], r[4])}</td></tr>`).join("")}
    </tbody>
  </table>
  ${footer(2)}
</section>

<!-- PAGE 3 — SANTÉ INTÉGRATION -->
<section class="page">
  <h2 class="sec">Santé de <span class="y">l'intégration & recette</span></h2>
  <p class="sub">Test runtime automatisé du 23 juin 2026 (Puppeteer, login partenaire) + revue de code exhaustive des 41 pages.</p>
  <div class="stats">
    <div class="stat"><div class="n">37</div><div class="l">Routes testées</div></div>
    <div class="stat g"><div class="n">36</div><div class="l">Chargées sans crash</div></div>
    <div class="stat y"><div class="n">19</div><div class="l">Pages avec avertissement</div></div>
    <div class="stat r"><div class="n">1</div><div class="l">Route en erreur 500</div></div>
  </div>

  <div class="blk">ANOMALIES PAR SÉVÉRITÉ</div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat r"><div class="n">6</div><div class="l">Haute</div></div>
    <div class="stat y"><div class="n">15</div><div class="l">Moyenne</div></div>
    <div class="stat"><div class="n">8</div><div class="l">Basse</div></div>
  </div>

  <div class="blk">PRINCIPALES ANOMALIES À CORRIGER</div>
  <table>
    <thead><tr><th>Élément</th><th>Problème</th><th>Statut</th></tr></thead>
    <tbody>
      ${anomalies.map((a) => `<tr><td class="mono">${a[0]}</td><td>${a[1]}</td><td>${statutPill(a[2], a[3])}</td></tr>`).join("")}
    </tbody>
  </table>
  <p class="sub" style="margin-top:14px;font-style:italic">Détail complet des 29 anomalies (constat, repro, correction, captures réelles) dans le « Rapport de corrections — Portail Partenaire ».</p>
  ${footer(3)}
</section>

<!-- PAGE 4 — RESTE À FAIRE P0 -->
<section class="page">
  <h2 class="sec">Reste à faire <span class="y">Priorité P0 (bloquant)</span></h2>
  <p class="sub">Sans ces éléments, le portail ne peut pas être considéré comme « 100 % fonctionnel ».</p>
  ${p0card("Détail offre de fret cassé (build error)", "<b>Critique</b> : <span class='mono'>PartnerFreightDetailPage.tsx</span> importe des hooks inexistants → erreur de build qui renvoie <b>HTTP 500 sur l'ensemble du portail</b> dès que la route est compilée. Créer <span class='mono'>usePartnerFreightOfferDetail</span> / <span class='mono'>useUpdateFreightOfferStatus</span> (+ route detail) ou retirer la page.")}
  ${p0card("Page Zones & Couloirs mockée", "Données codées en dur (commentaire « Mock data »), formulaire « Créer » sans <span class='mono'>onSubmit</span>, suppression/édition sans effet. Brancher un service réel + mutations create/edit/delete.")}
  ${p0card("Page Tracking GPS mockée", "Missions codées en dur, « Voir carte » sans carte, recherche inerte. Brancher l'API de tracking + un vrai composant carte, ou afficher un état « à venir ».")}
  ${p0card("Top-up portefeuille — bug front (endpoint backend OK)", "✅ Endpoint <span class='mono'>POST /wallet/top-up</span> vérifié le 23/06 : répond 200 (Swagger live). Bug front uniquement : payload manquant, flux PSP non implémenté, commentaire obsolète dans <span class='mono'>wallet.service.ts:439-441</span>. Supprimer le commentaire, implémenter le payload et la redirection PSP (DB-06 : demander la documentation du contrat).")}
  ${p0card("Revenus — recherche & pagination inertes", "<span class='mono'>usePartnerRevenuePaginated</span> ignore ses params : ni recherche ni page transmises à l'API. Faire passer <span class='mono'>buildListQuery(params)</span> au service, ou masquer les contrôles.")}
  ${callout("amber", "⏱", "Charge restante", "Les 3 pages mockées/cassées et les correctifs front (revenus, documents 403, top-up payload/PSP, catch acomptes, création shift) sont rapides — le backend est prêt. Le seul gros morceau côté backend restant : Socket.io temps réel (carte live + notifications).")}
  ${footer(4)}
</section>

<!-- PAGE 5 — P1 / P2 / HORS SCOPE / CONCLUSION -->
<section class="page">
  <h2 class="sec">Reste à faire <span class="y">P1 · P2 & conclusion</span></h2>
  <p class="sub">Améliorations importantes puis finitions, périmètre non retenu, et synthèse finale.</p>

  <div class="blk">PRIORITÉ P1 — IMPORTANTS</div>
  ${pXcard("P1", "Documents profil en erreur 403", "Le panneau documents du profil appelle <span class='mono'>/v1/admin/kyc/documents</span> (route admin) → 403 pour un partenaire. Utiliser l'endpoint partenaire <span class='mono'>/v1/partners/{id}/documents</span> déjà disponible.")}
  ${pXcard("P1", "Temps réel chat & notifications", "Aucun <span class='mono'>refetchInterval</span> ni socket → messages/notifications n'apparaissent pas sans rechargement. Ajouter polling court ou brancher Socket.io (rooms partner:notifications / partner:live-map).")}
  ${pXcard("P1", "Création de shift & KPI flotte", "Bouton « Nouveau shift » absent alors que l'API existe. KPI chauffeurs (en ligne / en course) calculés sur la page courante au lieu des totaux serveur ; page Performance tronquée à la 1ʳᵉ page.")}

  <div class="blk">PRIORITÉ P2 — FINITIONS</div>
  ${pXcard("P2", "Affichage & finitions UI", "Libellés de paiement bruts (« paid »/« pending ») sur courses & réservations ; preset « Tout » désactivé sur les courses ; carte live : position GPS inventée pour chauffeurs sans coordonnées + « temps d'attente » codé en dur ; colonne « Chauffeur affecté » vide ; barres de filtres sans bouton reset ; repli détail véhicule forçant « 0 places ».")}

  <div class="blk">HORS SCOPE (NON RETENU CETTE ITÉRATION)</div>
  <table>
    <thead><tr><th>Fonctionnalité</th><th>Raison</th></tr></thead>
    <tbody>
      <tr><td>Cron automatique & push temps réel (socket serveur)</td><td>Côté backend — hors périmètre front</td></tr>
      <tr><td>Export PDF des tableaux</td><td>Non retenu (CSV/Excel suffisent)</td></tr>
      <tr><td>Création d'un chauffeur seul (sans véhicule)</td><td>Remplacé par le binôme chauffeur + véhicule</td></tr>
    </tbody>
  </table>

  <div class="blk">CONCLUSION</div>
  <div class="concl">Le portail Partenaire est <b>construit à ~95 %</b> et <b>fonctionnel à ~78 %</b> (finition globale <b>~82 %</b>). Les fondations — Flotte, Wallet, Membres, Location, Réservations, SOS — sont solides et branchées sur le backend réel. ✅ <b>Reclassement du 23/06</b> : les endpoints top-up et acomptes (settlements) sont confirmés opérationnels (200) — les anomalies N°05 et N°10 sont des bugs front, pas des manques backend. Pour atteindre 100 %, le travail se concentre sur : <b>3 pages à débrancher du mock / réparer</b> (détail fret, zones, tracking), <b>le temps réel (socket) côté backend</b>, et une poignée de correctifs front ciblés (top-up payload/PSP, catch acomptes, revenus, documents 403, création shift, KPI flotte).</div>
  ${footer(5)}
</section>

</body></html>`;

const htmlPath = path.join(OUT_DIR, "rapport-avancement-portail-partenaire.html");
fs.writeFileSync(htmlPath, html, "utf-8");
console.log("✅ HTML généré :", htmlPath);
