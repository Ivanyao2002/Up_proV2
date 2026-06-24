# OCR Inscription Chauffeur — Guide d'intégration Front (App mobile + Back-office)

> Le chauffeur prend en photo son **permis**, sa **carte grise**, son **attestation d'assurance** ou sa **CNI**.
> L'API extrait automatiquement les champs (nom, n° permis, immatriculation, marque, modèle, couleur, dates…)
> et renvoie un objet **`prefill`** prêt à injecter dans le formulaire d'inscription.

⚠️ **L'OCR pré-remplit, il ne valide PAS.** Les champs renvoyés doivent rester **éditables** : le chauffeur
vérifie/corrige avant de soumettre. La validation KYC reste la revue humaine au back-office.

---

## 1. Routes

Base URL prod : **`https://api.upjunoo-dev.tech/v1`**

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/kyc/ocr/extract` | ❌ **PUBLIC** | Extrait les champs d'un document |
| `GET` | `/v1/kyc/ocr/document-types` | ❌ **PUBLIC** | Liste des types de docs + champs (pour construire l'UI) |

✅ **Aucun header d'authentification requis** — l'OCR est appelable pendant l'inscription, avant que le chauffeur ait un token.
(Si tu envoies un `Authorization: Bearer <token>`, il est accepté mais pas obligatoire.)

🔎 Visible dans Swagger : `https://api.upjunoo-dev.tech/docs` → tag **« 06 - Profils chauffeur »** (filtrer « ocr »).

---

## 2. Requête — `POST /v1/kyc/ocr/extract`

`Content-Type: application/json`. Corps :

| Champ | Requis | Détail |
|---|---|---|
| `documentTypeCode` | ✅ | `DRIVER_LICENSE` \| `VEHICLE_REGISTRATION` \| `INSURANCE` \| `ID_CARD` |
| `imageBase64` | ⚠️ une source | Image en **base64** ou **data URL** (le plus simple en mobile) |
| `imageUrl` | ⚠️ une source | URL https publique de l'image |
| `uploadId` | ⚠️ une source | `uploadId`/`storageRef` d'un fichier déjà envoyé sur le bucket KYC |
| `contentType` | optionnel | Type MIME si `imageBase64` est brut (sinon détecté automatiquement) |

➡️ Fournir **exactement une** des trois sources image (`imageBase64`, `imageUrl` ou `uploadId`).

### Formats d'image acceptés
**Tous les formats photo courants** : JPEG, PNG, WebP, GIF, **HEIC/HEIF (iPhone)**, AVIF, BMP, TIFF.
Le type est détecté automatiquement par le contenu (pas besoin d'un `contentType` exact).
- Taille max : **8 Mo**.
- **PDF non supporté** → envoyer une photo ou une capture d'écran.

### Exemple minimal
```json
{
  "documentTypeCode": "DRIVER_LICENSE",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

---

## 3. Réponse

```jsonc
{
  "status": "ok",
  "generatedAt": "2026-06-17T16:00:00.000Z",
  "ocr": {
    "documentTypeCode": "VEHICLE_REGISTRATION",
    "documentLabel": "Carte grise",
    "model": "google/gemini-2.5-flash",
    "fallbackUsed": false,
    "quality": "good",                 // "good" | "partial" | "unreadable"
    "fields": {                        // 1 entrée par champ : { value, confidence 0..1 }
      "plateNumber": { "value": "1234 AB 01", "confidence": 0.96 },
      "brand":       { "value": "Toyota",     "confidence": 0.97 },
      "model":       { "value": "Corolla",    "confidence": 0.90 },
      "color":       { "value": "Gris",       "confidence": 0.82 },
      "manufactureYear": { "value": 2018,     "confidence": 0.85 }
      // ... + vin, firstRegistrationDate, seatsCount, ownerName
    },
    "matches": {                       // carte grise UNIQUEMENT : texte → ids référentiel
      "brand": { "id": "uuid-brand", "code": "TOYOTA", "label": "Toyota" },
      "model": { "id": "uuid-model", "code": "COROLLA", "label": "Corolla" },
      "color": { "id": "uuid-color", "code": "GRIS", "label": "Gris" }
    },
    "prefill": {                       // 👉 objet PLAT à injecter dans le formulaire
      "plateNumber": "1234 AB 01",
      "vin": "JTDBR32E830012345",
      "manufactureYear": 2018,
      "seatsCount": 5,
      "brandId": "uuid-brand", "brandCode": "TOYOTA", "brandLabel": "Toyota",
      "modelId": "uuid-model", "modelLabel": "Corolla",
      "colorId": "uuid-color", "colorLabel": "Gris"
    },
    "warnings": []
  }
}
```

### Le champ clé : `ocr.prefill`
C'est un **objet plat prêt à étaler** dans le state de ton formulaire. Tu n'as aucun mapping à écrire.
Une valeur `null` = champ non lu (laisser vide / à saisir). Selon `documentTypeCode` :

| documentTypeCode | Clés de `prefill` |
|---|---|
| `DRIVER_LICENSE` | `firstName`, `lastName`, `licenseNumber`, `licenseCategories` (array), `licenseExpiry`, `dateOfBirth` |
| `VEHICLE_REGISTRATION` | `plateNumber`, `vin`, `manufactureYear`, `seatsCount`, `brandId`, `brandCode`, `brandLabel`, `modelId`, `modelLabel`, `colorId`, `colorLabel` |
| `INSURANCE` | `policyNumber`, `insurerName`, `plateNumber`, `validFrom`, `validTo` |
| `ID_CARD` | `firstName`, `lastName`, `idNumber`, `dateOfBirth`, `nationality`, `idExpiry` |

> Pour la **carte grise**, `brandId`/`modelId`/`colorId` sont déjà résolus vers le référentiel `ref_vehicle_*`
> (donc directement réutilisables dans `POST /v1/vehicles`). Ils valent `null` si la marque/modèle/couleur
> n'est pas au catalogue → laisser l'utilisateur choisir dans le sélecteur.

### À gérer côté UI
- `quality === "unreadable"` → photo illisible : **redemander une nouvelle photo**, ne pas pré-remplir.
- `confidence` bas sur un champ (< ~0.6) → le signaler visuellement (champ à vérifier).
- Toujours laisser les champs **éditables** ; soumettre les valeurs **confirmées par l'utilisateur**.

---

## 4. Intégration — App mobile (Expo / React Native)

Le plus simple : prendre la photo en base64 et l'envoyer.

```ts
import * as ImagePicker from 'expo-image-picker';

const API = 'https://api.upjunoo-dev.tech/v1';

async function scanDocument(documentTypeCode: string) {
  // 1) Prendre/choisir la photo en base64
  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    quality: 0.7,            // compresse → requête plus légère et plus rapide
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];

  // 2) Appeler l'OCR (PAS de header Authorization nécessaire)
  const res = await fetch(`${API}/kyc/ocr/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentTypeCode,
      imageBase64: `data:image/jpeg;base64,${asset.base64}`,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    // json.error.code ∈ { OCR_IMAGE_TOO_LARGE, OCR_RATE_LIMITED, OCR_DISABLED, ... }
    throw new Error(json?.error?.message ?? 'OCR indisponible');
  }
  return json.ocr; // { quality, fields, prefill, warnings, ... }
}

// 3) Pré-remplir le formulaire
const ocr = await scanDocument('DRIVER_LICENSE');
if (ocr && ocr.quality !== 'unreadable') {
  setForm((f) => ({ ...f, ...ocr.prefill })); // 👈 étaler prefill, c'est tout
} else {
  alert('Photo illisible, reprenez la photo du document.');
}
```

> Astuce : si tu uploades déjà le document sur le bucket KYC (`POST /v1/uploads/signed-url`),
> tu peux passer `{ documentTypeCode, uploadId }` au lieu de `imageBase64` — l'API ira lire l'image.

---

## 5. Intégration — Back-office (Web / React)

```ts
const API = 'https://api.upjunoo-dev.tech/v1';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string); // "data:image/...;base64,..."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractFromFile(file: File, documentTypeCode: string) {
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch(`${API}/kyc/ocr/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentTypeCode, imageBase64: dataUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'OCR error');
  return json.ocr;
}

// Usage : <input type="file" accept="image/*" onChange={...} />
const ocr = await extractFromFile(file, 'VEHICLE_REGISTRATION');
form.setValues({ ...form.values, ...ocr.prefill });
```

---

## 6. Construire l'UI dynamiquement (optionnel) — `GET /v1/kyc/ocr/document-types`

Renvoie les types supportés et les champs extraits par type (utile pour générer labels/écrans) :

```jsonc
{
  "status": "ok",
  "documentTypes": [
    {
      "code": "DRIVER_LICENSE",
      "label": "Permis de conduire",
      "description": "Permis de conduire (recto). Source de l'identité du chauffeur.",
      "fields": [
        { "key": "lastName", "label": "Nom", "type": "string" },
        { "key": "firstName", "label": "Prénoms", "type": "string" },
        { "key": "licenseNumber", "label": "Numéro du permis", "type": "string" },
        { "key": "expiryDate", "label": "Date d'expiration", "type": "date" }
      ]
    }
    // ... VEHICLE_REGISTRATION, INSURANCE, ID_CARD
  ]
}
```

---

## 7. Codes d'erreur

| HTTP | `error.code` | Cause / action |
|---|---|---|
| 400 | `OCR_DOCUMENT_TYPE_INVALID` | `documentTypeCode` manquant ou inconnu |
| 400 | `OCR_IMAGE_REQUIRED` | Aucune des 3 sources image fournie |
| 400 | `OCR_IMAGE_INVALID` | base64 / data URL invalide |
| 413 | `OCR_IMAGE_TOO_LARGE` | Image > 8 Mo → compresser (baisser `quality`) |
| 415 | `OCR_PDF_UNSUPPORTED` | PDF reçu → envoyer une photo/capture |
| 429 | `OCR_RATE_LIMITED` | Trop de requêtes (rate-limit par IP) → réessayer après un court délai |
| 502 | `OCR_PROVIDER_ERROR` / `OCR_PARSE_FAILED` | Échec côté modèle → réessayer |
| 503 | `OCR_DISABLED` / `OCR_NOT_CONFIGURED` | OCR coupé côté serveur → **retomber sur la saisie manuelle** |

Format d'erreur standard :
```json
{ "status": "error", "error": { "code": "OCR_IMAGE_TOO_LARGE", "message": "Image trop lourde (max 8 Mo)..." } }
```

---

## 8. Bonnes pratiques

- 📸 **Compresser** la photo côté front (`quality: 0.6–0.8`) : plus rapide, moins cher, et ça suffit pour l'OCR.
- ⏳ L'extraction prend **2–8 s** : afficher un loader pendant l'appel.
- 🔁 Si `quality === "unreadable"`, proposer **reprendre la photo** plutôt que pré-remplir du vide.
- ✏️ **Toujours éditable** : pré-remplir ≠ valider. L'utilisateur confirme.
- 🛡️ Endpoint public **rate-limité** : ne pas appeler en boucle, un appel par document scanné.
- 🚗 Carte grise : si `prefill.brandId` est `null`, la marque n'est pas au catalogue → afficher le sélecteur classique.
