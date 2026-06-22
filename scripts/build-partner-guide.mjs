/**
 * Génère le guide utilisateur HTML (guide-pdf/guide-utilisateur.html) à partir
 * du contenu structuré + captures présentes dans guide-pdf/captures/.
 *
 * Si une capture est absente, un encadré placeholder est inséré à la place.
 *
 * Usage : node scripts/build-partner-guide.mjs
 * Puis  : node scripts/html-to-pdf.mjs guide-pdf/guide-utilisateur.html guide-pdf/Guide_Utilisateur_UpJunoo.pdf
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CAPTURES_DIR = path.resolve(ROOT, "guide-pdf", "captures");
const OUT_HTML = path.resolve(ROOT, "guide-pdf", "guide-utilisateur.html");

function img(file, caption) {
  const abs = path.join(CAPTURES_DIR, file);
  if (fs.existsSync(abs)) {
    return `<figure class="shot">
      <img src="captures/${file}" alt="${caption}" />
      <figcaption>${caption}</figcaption>
    </figure>`;
  }
  return `<div class="placeholder">
    <div class="ph-icon">📷</div>
    <div class="ph-label">${caption}</div>
    <div class="ph-file">capture manquante : <code>captures/${file}</code></div>
  </div>`;
}

const SECTIONS = `
<div class="page"><div class="inner">
  <h2 id="sec-1" class="sec"><span class="sec-num">1</span> Connexion au portail</h2>
  <p class="sub">Accédez à votre espace partenaire UpJunoo PRO</p>
  ${img("01-login.png", "Page de connexion partenaire")}
  <div class="block-title">Étapes de connexion</div>
  <ol class="steps">
    <li>Rendez-vous sur <code>https://pro.upjunoo.com</code> dans votre navigateur</li>
    <li>Saisissez votre <strong>adresse email</strong> partenaire</li>
    <li>Entrez votre <strong>mot de passe</strong></li>
    <li>Cliquez sur <strong>Se connecter</strong></li>
  </ol>
  <div class="info-banner"><strong>Mot de passe oublié ?</strong> — Cliquez sur « Mot de passe oublié ? » sous le formulaire pour recevoir un lien de réinitialisation par email.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-2" class="sec"><span class="sec-num">2</span> Tableau de bord</h2>
  <p class="sub">Vue d'ensemble de votre activité en temps réel</p>
  ${img("02-dashboard.png", "Tableau de bord — vue d'ensemble")}
  <div class="block-title">Indicateurs clés</div>
  <ul class="feat">
    <li><strong>Véhicules actifs</strong> — nombre de véhicules approuvés et opérationnels</li>
    <li><strong>Chauffeurs en ligne</strong> — chauffeurs disponibles pour des courses</li>
    <li><strong>Courses du jour</strong> — courses effectuées depuis minuit</li>
    <li><strong>Chiffre d'affaires</strong> — revenus générés sur la période sélectionnée</li>
  </ul>
  <div class="info-banner"><strong>Navigation</strong> — Le menu latéral gauche donne accès à tous les modules : <strong>Ma Flotte</strong>, <strong>Activité</strong>, <strong>Opportunités</strong>, <strong>Finance</strong> et <strong>Support</strong>.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-3" class="sec"><span class="sec-num">3</span> Gestion de la flotte</h2>
  <p class="sub">Gérez vos véhicules, leurs documents et leurs assignations</p>

  <h3 class="subsec">3.1 — Liste des véhicules</h3>
  ${img("03-vehicles-list.png", "Liste des véhicules")}
  <p>Menu : <strong>Ma Flotte → Véhicules</strong>. Colonnes : immatriculation, marque, modèle, chauffeur affecté, année, couleur, catégorie, type et statut.</p>
  <ul class="feat">
    <li><strong>Filtrer</strong> par statut : Approuvés · En validation · Rejetés · Brouillons</li>
    <li><strong>Rechercher</strong> par plaque, marque ou chauffeur</li>
    <li><strong>Exporter</strong> en CSV ou Excel</li>
  </ul>

  <h3 class="subsec">3.2 — Détail d'un véhicule</h3>
  ${img("04-vehicle-detail.png", "Détail d'un véhicule — carte grise et informations")}
  <p>Accédez à la fiche complète en cliquant sur l'immatriculation. Téléversez la <strong>carte grise</strong> (JPG/PNG/PDF, max 5 Mo) et consultez toutes les informations du véhicule.</p>
  <div class="warn-banner"><strong>Activation requise</strong> — Le véhicule doit avoir une carte grise <strong>approuvée</strong> pour être opérationnel sur la plateforme.</div>

  <h3 class="subsec">3.3 — Assigner un chauffeur</h3>
  ${img("05-assign-modal.png", "Modal d'assignation d'un chauffeur")}
  <p>Sur la fiche d'un véhicule <strong>approuvé sans chauffeur</strong>, le bouton « Assigner un chauffeur » ouvre la liste des chauffeurs disponibles. Sélectionnez un chauffeur et confirmez.</p>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-4" class="sec"><span class="sec-num">4</span> Gestion des chauffeurs</h2>
  <p class="sub">Suivi et gestion de vos chauffeurs partenaires</p>

  <h3 class="subsec">4.1 — Liste des chauffeurs</h3>
  ${img("06-drivers-list.png", "Liste des chauffeurs")}
  <p>Menu : <strong>Ma Flotte → Chauffeurs</strong>. Vue d'ensemble de tous vos chauffeurs avec leurs informations de contact, véhicule affecté, catégorie, statut et disponibilité.</p>
  <ul class="feat">
    <li><strong>Nom &amp; Code</strong> — identifiant unique du chauffeur</li>
    <li><strong>Véhicule affecté</strong> — plaque du véhicule assigné</li>
    <li><strong>Catégorie</strong> — ECO, CONFORT, PREMIUM…</li>
    <li><strong>Statut</strong> — Approuvé, En attente, Suspendu</li>
    <li><strong>Disponibilité</strong> — En ligne, En course, Hors ligne</li>
  </ul>

  <h3 class="subsec">4.2 — Fiche détail d'un chauffeur</h3>
  ${img("07-driver-detail.png", "Fiche détail d'un chauffeur")}
  <p>Cliquez sur <strong>Voir</strong> pour accéder à la fiche complète d'un chauffeur.</p>
  <ul class="feat">
    <li><strong>Portefeuille mobile</strong> — solde total, montant retirable, montant de service</li>
    <li><strong>Performance</strong> — courses totales, taux d'acceptation, note moyenne</li>
    <li><strong>Position live</strong> — carte de dernière position connue</li>
    <li><strong>Documents KYC</strong> — CNI, permis de conduire, selfie et leurs statuts</li>
  </ul>
  <div class="info-banner"><strong>Recharger un chauffeur</strong> — Depuis la fiche, utilisez « Recharger ce chauffeur » pour créditer son portefeuille depuis votre solde partenaire.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-5" class="sec"><span class="sec-num">5</span> Carte live</h2>
  <p class="sub">Suivez vos chauffeurs en temps réel sur la carte</p>
  ${img("08-live-map.png", "Carte live — positions des chauffeurs")}
  <div class="block-title">Légende de la carte</div>
  <ul class="feat">
    <li><strong style="color:#16a34a">● En ligne</strong> — chauffeur disponible, en attente d'une course</li>
    <li><strong style="color:#2563eb">● En course</strong> — chauffeur en train d'effectuer une livraison ou un transport</li>
    <li><strong style="color:#f97316">● En pause</strong> — chauffeur temporairement indisponible</li>
  </ul>
  <div class="block-title">Statistiques en temps réel</div>
  <ul class="feat">
    <li><strong>EN LIGNE</strong> — nombre total de chauffeurs actifs sur le réseau</li>
    <li><strong>EN COURSE</strong> — chauffeurs assignés à une course active</li>
    <li><strong>COURSES ACTIVES</strong> — rides + livraisons en cours</li>
    <li><strong>ATTENTE MOY.</strong> — temps moyen de matching client/chauffeur</li>
  </ul>
  <div class="info-banner"><strong>Territoire</strong> — Le panneau latéral droit affiche le résumé de votre territoire (ville, chauffeurs actifs, géolocalisés).</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-6" class="sec"><span class="sec-num">6</span> Réservations</h2>
  <p class="sub">Gestion des courses programmées à l'avance</p>
  ${img("09-reservations.png", "Réservations de courses")}
  <div class="block-title">Fonctionnalités</div>
  <ul class="feat">
    <li><strong>Planification</strong> — courses programmées avec date, heure et trajet définis</li>
    <li><strong>Client &amp; trajet</strong> — nom du client, adresses de prise en charge et de destination</li>
    <li><strong>Assignation</strong> — associez un chauffeur et un véhicule à la réservation</li>
    <li><strong>Statuts</strong> — En attente · Confirmée · En cours · Terminée · Annulée</li>
  </ul>
  <div class="info-banner"><strong>Réservations récurrentes</strong> — Créez des courses programmées répétitives (quotidiennes, hebdomadaires) depuis l'onglet « Courses récurrentes ».</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-7" class="sec"><span class="sec-num">7</span> Courses</h2>
  <p class="sub">Historique complet de toutes les courses effectuées</p>
  ${img("10-trips.png", "Historique des courses")}
  <div class="block-title">Filtres disponibles</div>
  <ul class="feat">
    <li><strong>Période</strong> — sélectionnez une plage de dates</li>
    <li><strong>Statut</strong> — En cours · Terminée · Annulée</li>
    <li><strong>Chauffeur</strong> — filtrez par chauffeur spécifique</li>
    <li><strong>Référence</strong> — recherche par numéro de course</li>
  </ul>
  <div class="block-title">Export des données</div>
  <p>Exportez l'historique en <strong>CSV</strong> ou <strong>Excel</strong> depuis le bouton d'export en haut de la liste pour vos analyses et rapports comptables.</p>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-8" class="sec"><span class="sec-num">8</span> Fret</h2>
  <p class="sub">Transport de marchandises avec suivi en temps réel</p>
  ${img("11-freight-list.png", "Offres de fret — liste")}
  <div class="block-title">Présentation du module</div>
  <p>Menu : <strong>Opportunités → Fret</strong>. Acceptez des missions de transport de marchandises. Chaque offre indique le trajet (origine → destination), le type de marchandise, le poids, le volume et le montant proposé.</p>
  <div class="block-title">Actions disponibles</div>
  <ul class="feat">
    <li><strong>Créer une offre</strong> — bouton « + Nouvelle offre » : origine, destination, marchandise, poids (kg), volume (m³)</li>
    <li><strong>Filtrer</strong> — par statut : Disponible · Acceptée · En cours · Terminée · Annulée</li>
    <li><strong>Zones tarifaires</strong> — configurables dans <strong>Fret → Zones</strong> : tarifs par km et par catégorie de poids</li>
    <li><strong>Exporter</strong> — CSV ou Excel</li>
  </ul>
  <div class="warn-banner"><strong>Engagement flotte</strong> — Une offre acceptée engage un véhicule et un chauffeur. Vérifiez la disponibilité avant d'accepter.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-9" class="sec"><span class="sec-num">9</span> Location</h2>
  <p class="sub">Location de véhicules avec chauffeur à la journée, semaine ou mois</p>
  ${img("13-rental-bookings.png", "Offres de location — liste")}
  <div class="block-title">Catégories de location</div>
  <ul class="feat">
    <li><strong>Économique</strong> — véhicule citadin, tarif journalier avantageux</li>
    <li><strong>Confort</strong> — berline ou SUV, pour déplacements professionnels</li>
    <li><strong>Premium</strong> — véhicule haut de gamme, chauffeur expérimenté</li>
  </ul>
  <div class="block-title">Gestion des offres</div>
  <ul class="feat">
    <li><strong>Créer</strong> — bouton « + Nouvelle offre » : véhicule, catégorie, période, tarif</li>
    <li><strong>Statuts</strong> — En attente · Confirmée · En cours · Terminée · Annulée · Refusée</li>
    <li><strong>Actions rapides</strong> — Confirmer ✅ ou Refuser ❌ directement depuis la liste</li>
  </ul>
  <div class="info-banner"><strong>Tarification</strong> — Configurez vos grilles tarifaires (par catégorie et par durée) dans les paramètres de votre compte partenaire.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-10" class="sec"><span class="sec-num">10</span> Performance</h2>
  <p class="sub">Analysez l'activité de votre flotte et de vos chauffeurs</p>
  ${img("15-performance.png", "Tableau de bord performance")}
  <div class="block-title">Indicateurs suivis</div>
  <ul class="feat">
    <li><strong>Nombre de courses</strong> — volume total sur la période</li>
    <li><strong>Chiffre d'affaires</strong> — revenus générés par la flotte</li>
    <li><strong>Note moyenne</strong> — satisfaction client agrégée</li>
    <li><strong>Taux d'acceptation</strong> — pourcentage de courses acceptées vs proposées</li>
    <li><strong>Performance par véhicule</strong> — revenus et courses par véhicule</li>
    <li><strong>Performance par chauffeur</strong> — classement et statistiques individuelles</li>
  </ul>
  <div class="info-banner"><strong>Période</strong> — Filtrez par jour, semaine, mois ou plage personnalisée pour affiner votre analyse.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-11" class="sec"><span class="sec-num">11</span> Portefeuille</h2>
  <p class="sub">Gestion financière de votre compte partenaire</p>
  ${img("16-wallet.png", "Portefeuille partenaire")}
  <div class="block-title">Fonctionnalités financières</div>
  <ul class="feat">
    <li><strong>Solde</strong> — balance disponible et montant retirable</li>
    <li><strong>Grand livre</strong> — historique détaillé de toutes les transactions</li>
    <li><strong>Virements</strong> — demandez un retrait vers votre compte bancaire</li>
    <li><strong>Recharge chauffeurs</strong> — transférez des fonds vers le portefeuille d'un chauffeur</li>
    <li><strong>Rapprochement caisse</strong> — réconciliation des paiements en espèces</li>
    <li><strong>Revenus</strong> — vue synthétique des gains par période</li>
  </ul>
  <div class="warn-banner"><strong>Délai de virement</strong> — Les demandes de retrait sont traitées sous 1 à 3 jours ouvrés. Vérifiez les conditions dans vos paramètres de compte.</div>
  <div class="page-footer"><span class="brand">UpJunoo PRO</span><span>Guide Utilisateur — Portail Partenaire</span></div>
</div></div>

<div class="page"><div class="inner">
  <h2 id="sec-12" class="sec"><span class="sec-num">12</span> Support et assistance</h2>
  <p class="sub">Nous sommes là pour vous accompagner</p>
  <div class="block-title">Canaux de contact</div>
  <ul class="feat">
    <li><strong>Email</strong> — <code>support@upjunoo.com</code> : réponse sous 24h ouvrées</li>
    <li><strong>Chat en direct</strong> — disponible dans le portail, menu <strong>Support → Chat</strong></li>
    <li><strong>Horaires</strong> — Lun–Ven 8h–18h · Sam 9h–13h (heure d'Abidjan)</li>
  </ul>
  <div class="block-title">Ressources utiles</div>
  <ul class="feat">
    <li><strong>FAQ partenaire</strong> — questions fréquentes sur la gestion de flotte</li>
    <li><strong>Tutoriels vidéo</strong> — guides pas-à-pas pour chaque module</li>
    <li><strong>Notes de version</strong> — changelog des dernières mises à jour du portail</li>
  </ul>
  <div class="success-banner"><strong>Onboarding</strong> — Lors de votre première connexion, notre équipe vous accompagne dans la configuration de votre compte, l'ajout de vos véhicules et l'invitation de vos chauffeurs.</div>
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b">
    <strong style="color:#016d71">UpJunoo PRO</strong> — Guide Utilisateur Portail Partenaire · Version 2.0 · Juin 2026<br/>
    © 2026 UpJunoo — Tous droits réservés
  </div>
</div></div>
`;

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Guide Utilisateur — Portail Partenaire UpJunoo PRO</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#e2e8f0;color:#0f172a;line-height:1.5}
.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.12);position:relative;overflow:hidden}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;page-break-after:always}}

/* ── COVER ── */
.cover{background:#016d71;color:#fff;min-height:297mm;padding:48px 52px;position:relative;overflow:hidden;display:flex;flex-direction:column}
.cover::before,.cover::after{content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.06)}
.cover::before{width:440px;height:440px;top:-120px;right:-80px}
.cover::after{width:300px;height:300px;bottom:40px;left:-80px}
.cover-inner{position:relative;z-index:1;flex:1;display:flex;flex-direction:column}
.logo{font-size:26px;font-weight:800;letter-spacing:.5px}.logo span{color:#f8bb10}
.badge-pill{display:inline-block;margin-top:24px;background:#f8bb10;color:#0f172a;font-size:11px;font-weight:700;padding:5px 14px;border-radius:999px;width:fit-content}
.cover h1{margin-top:44px;font-size:36px;font-weight:800;line-height:1.2;max-width:95%}
.cover h1 .gold{color:#f8bb10;display:block;margin-top:6px;font-size:30px}
.cover .lead{margin-top:20px;max-width:520px;font-size:13.5px;opacity:.92;line-height:1.6}
.cover .meta-line{width:48px;height:4px;background:#f8bb10;margin:32px 0 18px}
.cover .meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;font-size:12.5px}
.cover .meta-grid label{display:block;font-size:10px;opacity:.72;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.cover-footer{margin-top:auto;padding-top:36px;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;opacity:.88}
.cover-footer .modules-count{text-align:right}
.cover-footer .modules-count .n{font-size:36px;font-weight:800;line-height:1}
.cover-footer .modules-count .l{opacity:.8;margin-top:2px}

/* ── INNER PAGES ── */
.inner{padding:38px 46px 56px}
h2.section-title{font-size:24px;font-weight:800;color:#016d71;margin-bottom:6px}
h2.section-title .gold{color:#f8bb10}
.sub{color:#64748b;font-size:13px;margin-bottom:24px}
.block-title{display:flex;align-items:center;gap:10px;margin:26px 0 10px;font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:.04em}
.block-title::before{content:'';width:4px;height:20px;background:#016d71;border-radius:2px;flex-shrink:0}

/* ── BANNERS ── */
.info-banner{background:#f0fdfa;border-left:4px solid #016d71;padding:12px 16px;margin:14px 0;font-size:13px;border-radius:0 8px 8px 0}
.info-banner strong{color:#016d71}
.warn-banner{background:#fef3c7;border-left:4px solid #f8bb10;padding:12px 16px;margin:14px 0;font-size:13px;border-radius:0 8px 8px 0}
.warn-banner strong{color:#b45309}
.success-banner{background:#ecfdf5;border-left:4px solid #16a34a;padding:12px 16px;margin:14px 0;font-size:13px;border-radius:0 8px 8px 0}
.success-banner strong{color:#16a34a}

/* ── STATS GRID ── */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0 28px}
.stat-card{background:#fff;border-radius:10px;padding:18px 14px;box-shadow:0 4px 14px rgba(0,0,0,.07);border-top:4px solid #016d71;text-align:center}
.stat-card.gold{border-top-color:#f8bb10}.stat-card.green{border-top-color:#16a34a}.stat-card.blue{border-top-color:#3b82f6}
.stat-card .val{font-size:30px;font-weight:800;color:#0f172a}
.stat-card .lbl{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin-top:5px;letter-spacing:.03em}

/* ── TOC ── */
.toc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;margin:20px 0}
.toc-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;font-size:13px;border:1px solid #e2e8f0;transition:border-color .15s,background .15s}
.toc-item:hover{background:#f0fdfa;border-color:#016d71}
.toc-item .num{width:26px;height:26px;background:#016d71;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.toc-item a{color:#0f172a;text-decoration:none;font-weight:600;flex:1}
.toc-item a:hover{color:#016d71}

/* ── SECTIONS ── */
section{margin-bottom:20px}
section.break{page-break-before:always}
h2.sec{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;color:#016d71;margin-bottom:6px}
h2.sec .sec-num{width:32px;height:32px;background:#016d71;color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}
h3.subsec{font-size:14px;font-weight:700;color:#0f172a;margin:18px 0 8px;padding-left:14px;border-left:3px solid #f8bb10}
p{font-size:13px;color:#374151;margin:8px 0;line-height:1.6}
ul.feat{list-style:none;padding:0;margin:8px 0 12px}
ul.feat li{padding:6px 0 6px 26px;position:relative;font-size:13px;color:#374151}
ul.feat li::before{content:'▸';position:absolute;left:0;color:#016d71;font-weight:700}

/* ── SCREENSHOTS ── */
.shot{margin:14px 0;text-align:center}
.shot img{max-width:100%;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.1)}
.shot figcaption{font-size:11px;color:#64748b;margin-top:6px;font-style:italic}
.placeholder{background:linear-gradient(135deg,#f0fdfa,#ccfbf1);border:2px dashed #016d71;border-radius:10px;padding:36px;text-align:center;margin:14px 0}
.placeholder .ph-icon{font-size:32px}
.placeholder .ph-label{color:#016d71;font-weight:700;margin-top:8px;font-size:13px}
.placeholder .ph-file{color:#64748b;font-size:11px;margin-top:4px}

/* ── STEPS ── */
.steps{counter-reset:s;list-style:none;padding:0;margin:10px 0}
.steps li{position:relative;padding:6px 0 6px 40px;min-height:28px;font-size:13px;color:#374151}
.steps li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:4px;width:26px;height:26px;background:#016d71;color:#fff;border-radius:50%;text-align:center;line-height:26px;font-weight:800;font-size:11px}

code{font-family:'SF Mono',Monaco,monospace;font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#0f172a}
.page-footer{margin-top:32px;padding-top:14px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8}
.page-footer .brand{font-weight:700;color:#016d71}
</style>
</head>
<body>

<!-- ══ PAGE 1 : COUVERTURE ══ -->
<div class="page">
<div class="cover">
<div class="cover-inner">
  <div class="logo">UP<span>JUNOO</span> <span style="font-size:13px;font-weight:600;opacity:.7;margin-left:4px">PRO</span></div>
  <div class="badge-pill">GUIDE UTILISATEUR</div>
  <h1>Portail Partenaire <span class="gold">Manuel d'utilisation complet</span></h1>
  <p class="lead" style="color:#fff;">Gérez votre flotte de véhicules, vos chauffeurs et suivez votre activité en temps réel. Ce guide couvre toutes les fonctionnalités du portail partenaire UpJunoo PRO.</p>
  <div class="meta-line"></div>
  <div class="meta-grid">
    <div><label>Version</label><div>2.0 — Juin 2026</div></div>
    <div><label>Plateforme</label><div>UpJunoo PRO</div></div>
    <div><label>Accès</label><div>pro.upjunoo.com</div></div>
  </div>
  <div class="cover-footer">
    <div><strong>UpJunoo</strong><br/>Support : support@upjunoo.com</div>
    <div class="modules-count">
      <div class="n">12</div>
      <div class="l">modules couverts</div>
    </div>
  </div>
</div>
</div>
</div>

<!-- ══ PAGE 2 : TABLE DES MATIÈRES ══ -->
<div class="page">
<div class="inner">
  <h2 class="section-title">Table des <span class="gold">Matières</span></h2>
  <p class="sub">Vue d'ensemble des fonctionnalités couvertes dans ce guide</p>

  <div class="stats-grid">
    <div class="stat-card green"><div class="val">12</div><div class="lbl">Modules</div></div>
    <div class="stat-card blue"><div class="val">14</div><div class="lbl">Captures d'écran</div></div>
    <div class="stat-card gold"><div class="val">3</div><div class="lbl">Sections flotte</div></div>
    <div class="stat-card"><div class="val">2</div><div class="lbl">Modules Opportunités</div></div>
  </div>

  <div class="block-title">Sommaire des chapitres</div>
  <div class="toc-grid">
    <div class="toc-item"><div class="num">1</div><a href="#sec-1">Connexion au portail</a></div>
    <div class="toc-item"><div class="num">2</div><a href="#sec-2">Tableau de bord</a></div>
    <div class="toc-item"><div class="num">3</div><a href="#sec-3">Gestion de la flotte (véhicules)</a></div>
    <div class="toc-item"><div class="num">4</div><a href="#sec-4">Gestion des chauffeurs</a></div>
    <div class="toc-item"><div class="num">5</div><a href="#sec-5">Carte live</a></div>
    <div class="toc-item"><div class="num">6</div><a href="#sec-6">Réservations</a></div>
    <div class="toc-item"><div class="num">7</div><a href="#sec-7">Courses</a></div>
    <div class="toc-item"><div class="num">8</div><a href="#sec-8">Fret</a></div>
    <div class="toc-item"><div class="num">9</div><a href="#sec-9">Location</a></div>
    <div class="toc-item"><div class="num">10</div><a href="#sec-10">Performance</a></div>
    <div class="toc-item"><div class="num">11</div><a href="#sec-11">Portefeuille</a></div>
    <div class="toc-item"><div class="num">12</div><a href="#sec-12">Support et assistance</a></div>
  </div>

  <div class="block-title">Accès rapide</div>
  <div class="info-banner"><strong>URL du portail</strong> — Connectez-vous sur <code>https://pro.upjunoo.com</code> depuis n'importe quel navigateur moderne (Chrome, Edge, Firefox). Aucune installation requise.</div>
  <div class="info-banner"><strong>Support technique</strong> — En cas de problème : <strong>support@upjunoo.com</strong> · Lun–Ven 8h–18h · Sam 9h–13h</div>
</div>
</div>

<!-- ══ SECTIONS CONTENU ══ -->
${SECTIONS}

</body>
</html>`;

fs.writeFileSync(OUT_HTML, HTML, "utf8");

const present = fs
  .readdirSync(CAPTURES_DIR)
  .filter((f) => f.endsWith(".png")).length
  ? fs.readdirSync(CAPTURES_DIR).filter((f) => f.endsWith(".png")).length
  : 0;

console.log(`✅ Guide HTML généré : ${OUT_HTML}`);
console.log(`   Captures détectées : ${present} fichier(s) PNG`);
console.log(`\nÉtape suivante :`);
console.log(`   node scripts/html-to-pdf.mjs guide-pdf/guide-utilisateur.html guide-pdf/Guide_Utilisateur_UpJunoo.pdf`);
