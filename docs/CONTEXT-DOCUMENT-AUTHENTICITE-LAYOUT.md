# Contexte — Authenticité documents, layout & choix de modèles

> **Document de référence** — à reprendre pour anti-fraude, analyse de mise en page, ou évolution des modèles OCR/vision.  
> Dernière mise à jour : juin 2026 · Projet UpJunoo Pro (`Up_prov2`)

---

## 1. Pipeline actuel (inscription binôme / assistant)

```
Photo(s) uploadées
    ↓
PaddleOCR (VPS uat.upjunoo.com/ocr-api) → texte brut (+ box ignorées côté Next.js)
    ↓
classifyDocumentFromText (onboarding chat) → type + recto/verso
    ↓
rulesParser / extractWithRulesFromOcr → prénom, plaque, marque…
    ↓
Formulaire prérempli (badge « Extrait IA »)
    ↓
Upload API KYC (signed-url à brancher côté front)
    ↓
Modération humaine admin / franchise (approve / reject)
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `deploy/paddleocr-api/app.py` | OCR Paddle — renvoie `lines[].text`, `confidence`, **`box`** |
| `src/app/api/document-extract/paddleOcrClient.ts` | Client OCR — **ne conserve que le texte** (`full_text` / `lines[].text`) |
| `src/app/api/admin/assistant/onboarding/classifyDocument.ts` | Classification par mots-clés OCR |
| `src/app/api/document-extract/rulesParser.ts` | Extraction regex (plaque, marque, MRZ…) |
| `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx` | Application au formulaire |
| `.cursor/rules/document-extraction-ocr.mdc` | Règle Cursor — pipeline OCR inscription |

### Config env (UAT)

```env
DOCUMENT_EXTRACT_PROVIDER=rules   # Paddle + regex (gratuit, déterministe)
PADDLE_OCR_BASE_URL=https://uat.upjunoo.com/ocr-api
LLM_BASE_URL=https://uat.upjunoo.com/llm-api
LLM_MODEL=qwen2.5:7b-instruct-q4_K_M   # assistant chat admin — texte seul
```

---

## 2. Ce que le système fait / ne fait pas

### Fait aujourd’hui

| Capacité | Détail |
|----------|--------|
| Lire du texte sur une image | PaddleOCR |
| Deviner le **type** de document | Mots-clés (`PERMIS DE CONDUIRE`, `CARTE GRISE`, MRZ CNI…) |
| Préremplir le formulaire | Regex sur texte OCR |
| Classer recto / verso | Heuristiques + signaux OCR (permis verso : CNI-, PERMANENT, série `0000…`) |
| `confidence` extraction | = nombre de champs trouvés, **pas** authenticité |
| Barrière métier | **Modération KYC humaine** après upload |

### Ne fait **pas** aujourd’hui

- Détection hologramme, puce, filigrane
- Comparaison au **template visuel** officiel CI
- Distinction papier / plastique / photo d’écran
- Liveness (selfie vs photo CNI)
- Validation checksum MRZ
- Recoupement automatique permis ↔ CNI ↔ carte grise
- Interrogation base étatique (Ministère, ONECI…)
- Analyse de **positionnement** des éléments (layout) — voir §4

### Scénario fraude : feuille de papier

Si quelqu’un écrit « PERMIS DE CONDUIRE », « Nom: … » sur un papier :

1. L’OCR peut lire le texte (surtout imprimé)
2. La classification peut dire « permis »
3. Le formulaire peut se remplir
4. **Aucune alerte « faux document »** n’est émise

Sans mots officiels → souvent « non classé » ou extraction incomplète — ce n’est **pas** une détection anti-fraude volontaire.

**Le badge « Extrait IA »** = champ rempli automatiquement, **≠ document validé**.

---

## 3. Corrections déjà livrées (juin 2026)

| Sujet | Fix |
|-------|-----|
| Verso permis / carte grise non classés | `classifyDocument.ts` — signaux OCR bruités (CNI-, PERMANENT, VIN…) |
| Labels chat recto/verso | `classificationDisplayLabel()` |
| Plaque non extraite (`1234AB56`) | `rulesParser.ts` — formats anciens + libellé immatriculation |
| Formulaire figé (Toyota après nouvelle carte grise) | `applyExtraction(..., { replace: true })` + `key={onboardingId}` sur wizard |
| Mélange 2 cartes grises | Extraction véhicule sur **recto seul** (`wizardFilesForExtraction`) |
| Upload images chauffeur API | **Non branché** — `createDriverWithDocumentsViaV1` stub ; flux API = signed-url + KYC |

---

## 4. Analyse par positionnement (layout)

### État actuel

Paddle renvoie déjà des coordonnées par ligne :

```json
{
  "text": "PERMIS DE CONDUIRE",
  "confidence": 0.97,
  "box": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
}
```

→ Voir `deploy/paddleocr-api/app.py` (`format_ocr_result`).  
→ `paddleOcrClient.ts` **jette les `box`** et ne garde que le texte concaténé.

### Principe layout (non implémenté)

Une carte officielle CI a une géométrie attendue :

| Document | Indices de position |
|----------|---------------------|
| Permis recto | Photo ~gauche, drapeau haut droite, titre haut, champs 1–6 |
| CNI recto | Photo gauche, « CARTE NATIONALE D'IDENTITÉ », bande verticale |
| CNI verso | MRZ en bas, puce gauche |
| Carte grise | Bandeau gris gauche (plaque), « CARTE GRISE » haut droite |
| Papier libre | Pas de photo au bon endroit, texte dispersé |

**Règles possibles** (sans nouveau modèle) : normaliser les `box` par rapport à la taille image ; vérifier que certains libellés sont dans des zones (ex. titre dans le tiers supérieur).

---

## 5. Faut-il un autre modèle ?

| Besoin | PaddleOCR actuel | Qwen 7B VPS | Modèle vision |
|--------|------------------|-------------|---------------|
| Lire le texte | ✅ | ❌ (pas d’image) | ✅ |
| Positions (`box`) | ✅ (non utilisées) | ⚠️ si JSON layout envoyé | ✅ |
| « Vraie carte CI ? » | ❌ | ⚠️ partiel | ✅ mieux |
| Papier avec texte copié | ❌ | ⚠️ moyen | ✅ mieux |

---

## 6. Qwen sur le VPS — peut-il suffire ?

**Non, pas en l’état** pour analyser une photo.

- Modèle actuel : `qwen2.5:7b-instruct-q4_K_M`
- API : `LLM_BASE_URL/api/chat` — **texte uniquement** (assistant admin)
- **Pas** Qwen2-VL / Qwen2.5-VL → ne « voit » pas l’image

**Usage possible** : 2ᵉ passe sur un JSON `{ lines: [{ text, box }], imageSize }` pour scorer « conforme / suspect » — fragile, pas un remplacement KYC.

---

## 7. Recommandation pragmatique (roadmap)

```
Étape 1 — Gratuit, VPS actuel (priorité)
  PaddleOCR texte + box → règles layout CI → score + warnings
  (modifier paddleOcrClient.ts pour exposer les box)

Étape 2 — Optionnel, même VPS
  Qwen 7B texte → analyse JSON layout (assistant, pas juge final)

Étape 3 — Si GPU ou cloud
  Qwen2-VL-2B local OU prestataire KYC (Onfido, Sumsub…) OU Gemini vision (OpenRouter)

Étape 4 — Toujours
  Modération humaine KYC (déjà en place)
```

**Ne pas** remplacer Paddle par Qwen 7B instruct pour l’OCR ou l’authenticité.

---

## 8. Modèles Hugging Face / alternatives (gratuits)

### Vision locale (lourd sur VPS CPU)

| Modèle | Usage | Contrainte |
|--------|-------|------------|
| [Qwen2-VL-2B-Instruct](https://huggingface.co/Qwen/Qwen2-VL-2B-Instruct) | Image → « carte vs papier » | ~6–8 Go RAM/VRAM, lent CPU |
| [Qwen2.5-VL-3B-Instruct](https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct) | Idem, un peu mieux | Idem |
| [InternVL2-2B](https://huggingface.co/OpenGVLab/InternVL2-2B) | Multimodal léger | GPU recommandé |

### Layout / structure (même écosystème Paddle)

| Outil | Usage |
|-------|--------|
| **PaddleOCR PP-Structure** | Zones titre / tableau / logo |
| **Florence-2-base** (`microsoft/Florence-2-base`) | Détection régions |
| Modèles HF « ID card detection » | Rectangle carte (générique, pas CI) |

Aucun modèle HF gratuit ne connaît nativement le **permis / CNI / carte grise ivoiriens** — fine-tuning ou règles + layout nécessaires.

### Cloud (déjà dans le code)

- `DOCUMENT_EXTRACT_PROVIDER=openrouter` + Gemini Flash (vision) — `openrouterClient.ts`
- Utile extraction ; anti-fraude seul insuffisant sans prompts + règles strictes

---

## 9. API upload documents (rappel Swagger live)

- **0 route** `multipart/form-data` sur l’API v1
- Flux documenté : `POST /v1/uploads/signed-url` → PUT fichier → `POST /v1/kyc/documents`
- Front binôme : upload KYC **non branché** (`partnerDrivers.v1.service.ts` stub)

---

## 10. Scripts de debug utiles

| Script | Usage |
|--------|--------|
| `scripts/simulate-classify.ts` | Test classification sans image |
| `scripts/ocr-permis-p2.ts` | OCR réel + classification permis verso |
| `scripts/test-plate-extract.ts` | Test extraction plaque carte grise |
| `scripts/ocr-carte-grise-mix.ts` | OCR recto + verso mélangés |
| `scripts/probe-driver-upload-swagger.mjs` | Audit Swagger upload chauffeur |

---

## 11. Pistes d’implémentation (quand on reprend)

1. **`paddleOcrClient.ts`** — type `OcrLine { text, confidence?, box? }` ; ne plus perdre les coordonnées
2. **`documentLayoutScore.ts`** (nouveau) — règles par `DocumentKind` + `side`
3. **Onboarding + ExtractionStep** — afficher warning si `layoutScore < seuil` (ne pas bloquer soumission sans décision produit)
4. **Option VL** — service séparé sur VPS GPU ou appel OpenRouter ponctuel
5. **Cohérence cross-doc** — même nom CNI / permis ; alerte seulement
6. **Backend** — statut KYC `pending_review` + motif rejet structuré

---

## 12. Résumé une phrase

Aujourd’hui le système **lit et classe du texte**, il ne **certifie pas** un document ; la **modération humaine** est la vraie barrière ; le **meilleur prochain pas gratuit** est d’**exploiter les `box` Paddle** pour un score de layout, pas de remplacer Paddle par le Qwen texte du VPS.

---

## 13. Documents alternatifs à la carte grise (CI)

En Côte d’Ivoire, plusieurs pièces peuvent remplacer ou compléter la **carte grise** pour identifier un véhicule. Le formulaire binôme a besoin surtout de :

| Champ formulaire | Priorité |
|------------------|----------|
| Plaque | Haute |
| Marque | Haute |
| Modèle / type commercial | Haute |
| Année (1ʳᵉ mise en circulation) | Haute |
| Couleur | Moyenne |
| Places | Basse (souvent saisie manuelle) |

### Documents observés (exemples terrain)

| Document | Signaux OCR classification | Plaque | Marque | Modèle | Année | Couleur |
|----------|---------------------------|--------|--------|--------|-------|---------|
| **Carte grise** | `CARTE GRISE` | ✓ `AA-544-VQ-01` | ✓ | ✓ type commercial | ✓ | ✓ |
| **Vignette moto** | `VIGNETTE MOTO`, `DGI` | ✓ `ABO202508052` | ✓ KAPANOU | ✗ (Type NA) | ✓ date mise en cc. | ✗ |
| **Récépissé WW-CI** | `RECEPISSE`, `SERIE WW-CI` | ✓ série WW `205181188` | ✓ (manuscrit) | ✓ type PF61 | ✗ | ✓ Rouge |
| **Assurance auto** | `ATTESTATION D'ASSURANCE` | ✓ `AB746BJ` | ✓ SUZUKI | ✓ DZIRE | ✗ | ✗ |
| **Contrôle technique** | `CERTIFICAT DE CONTRÔLE TECHNIQUE` | ✓ `AA-460-EE` | ✓ SUZUKI | type CZF63 | ✓ mise en circ. | ✗ |
| **Autorisation provisoire** | `AUTORISATION PROVISOIRE DE CIRCULER` | ✓ `AB-920-BH` | ✓ SUZUKI | ✓ DZIRE | ✗ | ✓ Rouge |

### État actuel du code

- Extraction véhicule : **uniquement** `documentType === "registration"` → `parseVehicleFromOcr` (carte grise).
- Slots wizard : `registration` (carte grise), `insurance`, `technicalInspection` — **assurance / visite technique uploadées mais pas d’extracteur**.
- Classification onboarding : ne connaît que `registration` = carte grise ; les alternatives → **`non classé`** ou mauvais slot.
- `mergeExtractionResults` : un seul flux `registration` ; pas de fusion multi-sources véhicule.

### Plan d’implémentation proposé

#### Phase A — Taxonomie & classification

1. Ajouter `VehicleIdentitySubtype` :
   - `carte_grise` | `vignette` | `recepisse_ww` | `assurance` | `visite_technique` | `autorisation_provisoire`
2. Étendre `classifyDocument.ts` avec détecteurs par titre OCR.
3. `assignSlots` : tout subtype véhicule → slot `registration.recto` (ou slot unique « pièce véhicule ») + conserver assurance / visite en pièces complémentaires si déjà uploadées.

#### Phase B — Extracteurs par type (`rulesParser.ts` ou `vehicleDocumentParsers.ts`)

Un parseur par subtype, chacun renvoie `ExtractedVehicleFields` :

```typescript
extractVehicleFromSubtype(subtype, ocrText) → { plate, brand, model, year, color, warnings }
```

Règles spécifiques à prévoir :

- **Vignette** : `IMMATRICULATION`, `Marque`, `Date mise en cc.`, plaques moto `ABO…`
- **Récépissé WW** : `Numéro de la série WW-CI`, `Marque`, `Type`, `Couleur` — **OCR manuscrit difficile** → warning + fallback LLM vision optionnel
- **Assurance** : `Immatriculation ou Numéro de Châssis`, `Marque`, `Modèle`
- **Visite technique** : `IMMATRICULATION`, `MARQUE`, `TYPE`, `MISE EN CIRC.`
- **Autorisation provisoire** : `Immatriculation`, `Marque`, `Modèle`, `Couleur`, `Numéro de chassis`

Réutiliser `extractPlate`, `extractBrandFromOcr`, `valueAfterLabel` avec libellés adaptés.

#### Phase C — Fusion multi-documents

Étendre `mergeExtractionResults` ou `runFullExtraction` :

```
Pour chaque image classée « identité véhicule » :
  OCR → extractVehicleFromSubtype → résultat partiel

Fusion avec priorité (si plusieurs docs) :
  1. carte_grise
  2. autorisation_provisoire
  3. recepisse_ww
  4. visite_technique
  5. vignette
  6. assurance (plaque/marque/modèle seulement)

Règle : ne pas écraser un champ déjà rempli par une source plus prioritaire.
```

Si l’utilisateur n’envoie **que** une assurance → remplir ce qui est possible + warning « carte grise ou équivalent recommandé ».

#### Phase D — UI / produit

- `DocumentsStep` : libellé **« Carte grise ou document équivalent »** + liste des pièces acceptées.
- Résumé chat : `assurance.png → Assurance (identité véhicule)` au lieu de `non classé`.
- Badge « Extrait IA » + warning si source = assurance seule (pas d’année).
- Backend : confirmer avec l’API quels `documentTypeCode` catalogue acceptent ces pièces (`REGISTRATION_CARD`, `INSURANCE`, etc.).

#### Phase E — Tests

- Images de référence dans `scripts/` (vignette, récépissé, assurance, visite, autorisation).
- OCR Paddle réel + assert champs extraits.
- Cas mixte : carte grise absente, assurance + visite technique présentes.

### Risques / limites

| Risque | Mitigation |
|--------|------------|
| Récépissé **manuscrit** | OCR Paddle faible → mode `paddle`+OpenRouter ou saisie manuelle |
| Plaques formats différents (WW, moto, sans tirets) | Étendre `PLATE_PATTERNS` |
| Modèle absent (vignette `Type: NA`) | Laisser vide + warning |
| Conflit plaque entre 2 docs | Priorité + alerte modération KYC |
| Fraude (papier imitant titre) | Layout score (§4) + modération humaine |

### Fichiers à toucher (ordre)

1. `classifyDocument.ts` — subtypes véhicule
2. `vehicleDocumentParsers.ts` (nouveau) — extracteurs
3. `rulesParser.ts` ou `extractProviders.ts` — routage par subtype
4. `mergeExtractionResults.ts` — fusion priorisée
5. `documentExtraction.types.ts` — types `VehicleIdentitySubtype`
6. `DocumentsStep.tsx` + `AdminAssistantPanel.tsx` — libellés
7. `docs/CONTEXT-DOCUMENT-AUTHENTICITE-LAYOUT.md` — ce §13
