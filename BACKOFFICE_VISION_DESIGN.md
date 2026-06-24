# UpJunoo Pro — Vision back-office (niveau Mobbin / Dribbble / Behance)

Document de direction pour designers, Stitch, Figma et développement front.  
Objectif : un back-office **parmi les meilleurs dashboards** du marché — **beau, épuré, intelligent**, jamais surchargé, **100 % charte UpJunoo**, animations **subtiles et agréables**.

---

## 1. Ambition produit

| On veut | On ne veut pas |
|---------|----------------|
| Sensation **produit premium** (Stripe, Linear, Raycast, Revolut Business) | Template admin Bootstrap / Metronic |
| Inspiration **apps réelles** (Mobbin) + **craft visuel** (Dribbble/Behance ciblés) | Copie 1:1 d’un shot Dribbble hors contexte |
| **Peu d’éléments**, chacun utile | 12 KPI identiques, 3 sidebars, 8 couleurs |
| Données **lisibles en 3 secondes** | Murs de tableaux sans hiérarchie |
| **Animations discrètes** (confiance, fluidité) | Parallax, confettis, tout qui bouge |
| Charte **navy + teal** UpJunoo partout | Palette différente par rôle |

---

## 2. Références à étudier (Mobbin)

Chercher ces **patterns**, pas ces logos :

| Pattern | Apps à benchmarker sur Mobbin |
|---------|-------------------------------|
| Dashboard ops | Linear, Stripe Dashboard, Vercel, Raycast |
| Fleet / dispatch | Uber Fleet, Bolt Business, Onfleet |
| Finance / wallet | Revolut Business, Wise, Mercury |
| Tables & bulk | Notion databases, Airtable, Retool |
| Maps live | Uber, Bolt driver ops, Onfleet |
| KYC / onboarding ops | Stripe Identity, Wise business verify |
| Settings / RBAC | Linear settings, Vercel teams |

**Méthode :** 1 collection Mobbin « UpJunoo refs » → 3 écrans par pattern → noter **espacement, typo, densité**, pas les couleurs (on garde UpJunoo).

---

## 3. Références Dribbble / Behance (filtre qualité)

Ne pas viser les shots « glassmorphism violet IA ». Viser :

- **Dashboard fintech** minimal, data-first  
- **Mobility / logistics** B2B  
- **SaaS analytics** avec une seule couleur d’accent  

Mots-clés recherche : `fleet dashboard`, `operations dashboard`, `fintech admin`, `ride hailing admin`, `logistics saas ui`.

**Règle :** si le shot n’a pas de **vraie donnée métier** (montants, statuts, noms), il est décoratif — ne pas le copier.

---

## 4. Charte UpJunoo (non négociable)

| Token | Hex | Usage |
|-------|-----|--------|
| Navy | `#405189` | Hero, titres forts, série graphique principale |
| Teal | `#0AB39C` | CTA, actif, en ligne, tendance positive |
| Canvas | `#F3F3F9` | Fond app (légèrement chaud, pas gris froid) |
| Surface | `#FFFFFF` | Cartes |
| Texte | `#212529` / `#878A99` | Corps / secondaire |

**Interdit :** violet, dégradés arc-en-ciel, vert lime hors teal, sidebar sombre par rôle.

---

## 5. Principes UI — épuré mais riche

### Hiérarchie (règle 1-3-1)
- **1** héros par page (chiffre ou carte navy pleine largeur)  
- **3** blocs secondaires max sous le héros (graphique + 2 métriques, ou 3 KPI **différents** en taille/forme)  
- **1** zone détail (table ou carte) en bas  

### Densité
- Padding généreux : **24–32px** dans les cartes  
- Gap grille : **16–20px**  
- Tables : **52px** ligne, pas de bordures verticales  
- Jamais plus de **5 colonnes** visibles sans scroll horizontal raisonné  

### Typo (Poppins)
- Chiffre roi : **40–48px**, tabular nums, `-0.03em` letter-spacing  
- Titre page : **22px** + fil d’Ariane discret  
- Labels : **11–12px** uppercase espacé, **avec parcimonie**  

### Profondeur
- Cartes : ombre douce + bordure `1px #E9EBEC` à 50 % opacité  
- Hero : dégradé navy `#2f3d66 → #405189`, **grain 2 %**, halo teal flou en coin (pas de flat)  
- Pas de néomorphisme, pas de glass excessif  

---

## 6. Animations subtiles (spec implémentation)

Philosophie : l’utilisateur **sent** la qualité sans **remarquer** l’animation.

| Élément | Animation | Durée | Easing |
|---------|-----------|-------|--------|
| Entrée page | Fade + translateY **8px** → 0 | 400ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Cartes (stagger) | Idem, délai **+50ms** par carte | 400ms | idem |
| Hero chiffre | Count-up optionnel (800ms) | 800ms | ease-out |
| Sidebar nav hover | Fond **150ms** | 150ms | ease |
| Nav actif | Barre teal **scaleY** 0→1 | 200ms | ease-out |
| Bouton primary | Scale **0.98** au clic | 100ms | ease |
| Ligne table hover | Fond **120ms** | 120ms | ease |
| Statut « En ligne » | Pulse anneau teal **2s** infinite | 2s | ease-in-out |
| Graphique barres | Hauteur 0→valeur au mount | 600ms | ease-out, stagger 40ms |
| Modal / drawer | Overlay fade 200ms + panel slide **16px** | 280ms | ease-out |
| Toast succès | Slide in right + auto dismiss | 300ms | ease |
| Skeleton loading | Shimmer horizontal discret | 1.2s | linear infinite |

**Accessibilité :** respecter `prefers-reduced-motion: reduce` → désactiver translate, pulse, count-up.

**Interdit :** bounce excessif, rotation, particules, loaders fullscreen > 400ms sans contenu.

---

## 7. UX — bien pensé

### Navigation
- Sidebar **blanche**, groupes **OPÉRATIONS / RÉSEAU / FLOTTE / FINANCE** (max 7 groupes admin)  
- Recherche globale **⌘K** dans le header  
- Filtre **ville / franchise / période** persistant en header  

### Feedback
- Chaque action destructive → **modal** confirmation texte clair  
- Bulk actions → barre contextuelle **sticky** teal léger, pas popup  
- Empty states : illustration **ligne fine** + 1 phrase + 1 CTA  

### Pages détail
- Layout **3 zones** : résumé header sticky | contenu onglets | panneau latéral (carte, chat, paiement)  
- Timeline verticale pour statuts course / KYC  

### Zones & cartes
- Éditeur carte : toolbar flottante, polygone teal, surface km² live  
- Pas de carte « placeholder gris » — style map désaturée réaliste  

---

## 8. Shell unique (Admin / Partenaire / Franchise)

Même structure, même beauté. Seuls changent :
- Items de menu (périmètre)  
- Badge scope : `Administrateur` | `Partenaire` | `Franchise`  
- Données affichées (scope)  

---

## 9. Livrables alignés sur cette vision

| Fichier | Rôle |
|---------|------|
| `mockup/` + `css/motion.css` | Référence interactive animations |
| `DESIGN_SYSTEM_UPJUNOO.md` | Tokens techniques |
| `PROMPT_STITCH_UPJUNOO.md` | Génération Stitch premium |
| Ce document | Vision & benchmark |

---

## 10. Prompt Stitch condensé (vision + Mobbin)

```
Back-office UpJunoo Pro — quality tier: top 1% SaaS dashboards.

INSPIRATION: Study patterns from Mobbin — Linear, Stripe Dashboard, Revolut Business, Uber Fleet (layout density, table craft, hero hierarchy) — NOT their colors.

VISUAL: UpJunoo only — navy #405189, teal #0AB39C, canvas #F3F3F9, Poppins. Light white sidebar. One navy hero per page. Max 3 secondary blocks. Editorial whitespace. Soft shadows. Subtle grain on hero. French labels. FCFA. Real Ivorian place names.

CRAFT: Human-designed, NOT AI slop — no 6 identical KPI cards, no purple gradients, no stock photos.

MOTION (subtle): page fade-up 8px 400ms, card stagger 50ms, nav hover 150ms, online status soft pulse, bar chart grow 600ms, respect reduced-motion.

UX: breadcrumbs, ⌘K search, sticky bulk bar, 3-column detail pages, timeline for trips, zone map editor. Calm, premium, enjoyable to use daily.
```

---

## 11. Prochaine étape recommandée

1. Ouvrir `mockup/admin-dashboard.html` (version animée)  
2. Valider le ressenti avec l’équipe  
3. Stitch LOT 0 + LOT 3 avec le prompt §10  
4. Implémenter en Vue 3 + tokens CSS variables + `@vueuse/motion` ou CSS transitions
