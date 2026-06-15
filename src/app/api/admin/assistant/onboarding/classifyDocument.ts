export type DocumentSlotKey =
  | "cni.recto"
  | "cni.verso"
  | "license.recto"
  | "license.verso"
  | "registration.recto"
  | "registration.verso"
  | "selfie"
  | "insurance"
  | "technicalInspection";

export type DocumentKind =
  | "cni"
  | "license"
  | "registration"
  | "selfie"
  | "insurance"
  | "technical";

export interface ClassificationResult {
  kind: DocumentKind | "unknown";
  side: "recto" | "verso" | null;
  slot: DocumentSlotKey | null;
  label: string;
  confidence: "high" | "medium" | "low";
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase();
}

function scoreKeywords(text: string, keywords: string[], weight = 1): number {
  const n = normalize(text);
  return keywords.reduce(
    (acc, kw) => (n.includes(normalize(kw)) ? acc + weight : acc),
    0
  );
}

/** MRZ carte d'identité ivoirienne (verso). */
function hasCniMrz(text: string): boolean {
  const n = normalize(text);
  return (
    /IDCIV[A-Z0-9<]{4,}/.test(n) ||
    /IDCIVCI/.test(n) ||
    (n.includes("<<") && /\d{6}[MF]\d{6}/.test(n))
  );
}

/** Recto CNI ivoirien. */
function isCniRecto(text: string): boolean {
  const n = normalize(text);
  return (
    n.includes("CARTE NATIONALE D'IDENTITE") ||
    n.includes("CARTE NATIONALE D IDENTITE") ||
    (n.includes("CARTE NATIONALE") && n.includes("IDENTITE")) ||
    (n.includes("NATIONALITE") && n.includes("IVOIRIENNE") && n.includes("NOM"))
  );
}

/** Verso CNI ivoirien (puce, NNI, MRZ, office état civil). */
function isCniVerso(text: string): boolean {
  const n = normalize(text);
  if (hasCniMrz(text)) return true;
  const versoSignals = [
    n.includes("NNI"),
    n.includes("ETAT CIVIL"),
    n.includes("OFFICE NATIONAL"),
    n.includes("DATE D'EMISSION") || n.includes("DATE D EMISSION"),
    n.includes("LIEU D'EMISSION") || n.includes("LIEU D EMISSION"),
    n.includes("SIGNATURE DE L'AUTORITE") || n.includes("SIGNATURE DE L AUTORITE"),
    n.includes("DIRECTEUR GENERAL"),
  ];
  return versoSignals.filter(Boolean).length >= 2;
}

/** Recto permis ivoirien. */
function isLicenseRecto(text: string): boolean {
  const n = normalize(text);
  return (
    n.includes("PERMIS DE CONDUIRE") ||
    n.includes("PERMIS DE CONDUITE") ||
    (n.includes("MINISTERE DES TRANSPORTS") &&
      (n.includes("NOM") || n.includes("PRENOM")) &&
      (n.includes("PERMIS") || n.includes("DELIVRANCE")))
  );
}

/** VIN / châssis — verso carte grise CI (pas MRZ CNI ni n° CNI permis). */
function hasVinOrChassis(text: string): boolean {
  if (hasCniMrz(text)) return false;
  const n = normalize(text);
  if (
    n.includes("NUMERO DU VIN") ||
    n.includes("NUMERO DE CHASSIS") ||
    n.includes("VIN/CHASSIS") ||
    (n.includes("VIN") && n.includes("CHASSIS"))
  ) {
    return true;
  }
  if (n.includes("CHASSIS") && /[A-HJ-NPR-Z0-9]{11,17}/.test(n)) return true;
  if (/WDB[A-HJ-NPR-Z0-9]{14}/.test(n)) return true;
  return false;
}

/** Référence CNI sur verso permis (ex. CNI-C0112495086) — pas une carte d'identité. */
function hasPermisLinkedCniRef(text: string): boolean {
  const n = normalize(text);
  if (n.includes("CARTE NATIONALE")) return false;
  return /\bCNI[\s\-]*[A-Z0-9]{6,}/.test(n);
}

/** Grille validité / expiration (plusieurs PERMANENT + dates JJ-MM-AAAA). */
function hasPermisValidityGrid(text: string): boolean {
  const n = normalize(text);
  const permanentCount = (n.match(/PERMANENT/g) || []).length;
  const dateCount = (n.match(/\d{2}-\d{2}-\d{4}/g) || []).length;
  if (permanentCount >= 2 && dateCount >= 2) return true;
  if (permanentCount >= 1 && dateCount >= 4) return true;
  return false;
}

/** Numéro de série verso permis CI (ex. 00001439375). */
function hasPermisSerialNumber(text: string): boolean {
  const n = normalize(text);
  return /\b0{3,}\d{7,}\b/.test(n);
}

/** Tableau catégories A–E (verso permis CI). */
function hasLicenseCategoryTable(text: string): boolean {
  const n = normalize(text);
  const hasCategories = n.includes("CATEGORIE") || n.includes("CATEGORIES");
  const hasValidity =
    n.includes("VALIDITE") ||
    n.includes("EXPIRATION") ||
    n.includes("PERMANENT");
  const categoryRows = ["A", "B", "C", "D", "E"].filter(
    (letter) =>
      new RegExp(`\\b${letter}\\b`).test(n) &&
      (n.includes("PERMANENT") || n.includes("VALIDITE") || n.includes("EXPIRATION"))
  );
  if (hasCategories && hasValidity) return true;
  if (categoryRows.length >= 2) return true;
  if (/\b7[\.\s]/.test(n) && (/\b8[\.\s]/.test(n) || /\b9[\.\s]/.test(n) || hasCategories)) {
    return true;
  }
  if (/\b7[\.\s]/.test(n) && n.includes("PERMANENT")) return true;
  if (
    n.includes("MINISTERE DES TRANSPORTS") &&
    categoryRows.length >= 1 &&
    hasValidity
  ) {
    return true;
  }
  if (hasPermisValidityGrid(text) && (hasPermisLinkedCniRef(text) || hasPermisSerialNumber(text))) {
    return true;
  }
  return false;
}

/**
 * Verso permis ivoirien — contient souvent « Document d'identité » + ref CNI,
 * ce qui ne doit pas être confondu avec une carte d'identité.
 */
function isLicenseVerso(text: string): boolean {
  const n = normalize(text);
  const strong = [
    n.includes("GROUPE SANGUIN"),
    n.includes("STRICTEMENT PERSONNELLE"),
    n.includes("EMPREINTE"),
    hasLicenseCategoryTable(text),
    hasPermisLinkedCniRef(text) && n.includes("PERMANENT"),
    hasPermisValidityGrid(text) && !hasVinOrChassis(text) && !n.includes("CARTE GRISE"),
    hasPermisSerialNumber(text) &&
      n.includes("PERMANENT") &&
      !hasVinOrChassis(text) &&
      !n.includes("CARTE GRISE"),
    n.includes("DOCUMENT D'IDENTITE") &&
      !n.includes("CARTE NATIONALE") &&
      (n.includes("VALIDITE") || n.includes("CATEGORIE") || n.includes("GROUPE SANGUIN")),
    n.includes("MINISTERE DES TRANSPORTS") &&
      (hasLicenseCategoryTable(text) ||
        n.includes("VALIDITE") ||
        n.includes("CATEGORIE") ||
        n.includes("GROUPE SANGUIN")),
  ];
  return strong.filter(Boolean).length >= 1;
}

/** Recto carte grise ivoirienne. */
function isRegistrationRecto(text: string): boolean {
  const n = normalize(text);
  return (
    n.includes("CARTE GRISE") ||
    (n.includes("IMMATRICULATION") &&
      n.includes("MINISTERE DES TRANSPORTS") &&
      !hasVinOrChassis(text)) ||
    n.includes("CERTIFICAT D'IMMATRICULATION")
  );
}

/** Verso carte grise ivoirienne (VIN, crédit, type technique, code-barres). */
function isRegistrationVerso(text: string): boolean {
  if (isRegistrationRecto(text) || hasCniMrz(text) || hasLicenseCategoryTable(text)) {
    return false;
  }
  const n = normalize(text);
  const signals = [
    hasVinOrChassis(text),
    n.includes("SOCIETE DE CREDIT"),
    n.includes("TYPE TECHNIQUE"),
    n.includes("NUMERO DE MOTEUR"),
    n.includes("IMMATRICULATION PRECEDENT") ||
      n.includes("IMMATRICULATION PRECEDENTE"),
    (n.includes("CODE BARRE") || n.includes("CODEBARRE")) &&
      n.includes("MINISTERE DES TRANSPORTS"),
    n.includes("MINISTERE DES TRANSPORTS") &&
      hasVinOrChassis(text),
  ];
  return signals.filter(Boolean).length >= 1;
}

function isVersoHeuristic(text: string): boolean {
  const n = normalize(text);
  return (
    hasCniMrz(text) ||
    n.includes("<<") ||
    n.includes("CODE BARRE") ||
    n.includes("CODEBARRE") ||
    n.includes("DOMICILE") ||
    n.includes("ADRESSE") ||
    n.includes("RESIDENCE") ||
    n.includes("EMPREINTE") ||
    n.includes("GROUPE SANGUIN") ||
    hasVinOrChassis(text) ||
    n.includes("SOCIETE DE CREDIT") ||
    n.includes("TYPE TECHNIQUE") ||
    n.includes("SIGNATURE DE L'AUTORITE") ||
    n.includes("SIGNATURE DE L AUTORITE") ||
    n.includes("SIGNATURE ET CACHET")
  );
}

export function classificationDisplayLabel(
  kind: DocumentKind,
  side: "recto" | "verso" | null
): string {
  const base: Record<DocumentKind, string> = {
    cni: "Carte d'identité",
    license: "Permis de conduire",
    registration: "Carte grise",
    selfie: "Photo selfie",
    insurance: "Assurance",
    technical: "Visite technique",
  };
  const name = base[kind];
  if (side === "recto") return `${name} recto`;
  if (side === "verso") return `${name} verso`;
  return name;
}

function result(
  kind: DocumentKind,
  side: "recto" | "verso" | null,
  confidence: ClassificationResult["confidence"]
): ClassificationResult {
  return {
    kind,
    side,
    slot: null,
    label: classificationDisplayLabel(kind, side),
    confidence,
  };
}

export function classifyDocumentFromText(ocrText: string): ClassificationResult {
  const text = ocrText.trim();
  if (!text) {
    return {
      kind: "unknown",
      side: null,
      slot: null,
      label: "Document non lisible",
      confidence: "low",
    };
  }

  if (isRegistrationRecto(text)) {
    return result("registration", "recto", "high");
  }

  if (isLicenseRecto(text)) {
    return result("license", "recto", "high");
  }

  if (isLicenseVerso(text)) {
    return result("license", "verso", "high");
  }

  if (isRegistrationVerso(text)) {
    return result("registration", "verso", "high");
  }

  if (isCniRecto(text)) {
    return result("cni", "recto", "high");
  }

  if (isCniVerso(text)) {
    return result("cni", "verso", "high");
  }

  const scores = {
    license: scoreKeywords(text, [
      "PERMIS DE CONDUIRE",
      "PERMIS DE CONDUITE",
      "DRIVING LICENCE",
      "NUMERO DU PERMIS",
      "NUMERO DU PERMIS DE CONDUIRE",
    ]) +
      scoreKeywords(text, ["CATEGORIE", "CATEGORIES", "GROUPE SANGUIN"], 2) +
      (hasPermisLinkedCniRef(text) ? 4 : 0) +
      (hasPermisValidityGrid(text) ? 3 : 0) +
      (hasPermisSerialNumber(text) && normalize(text).includes("PERMANENT") ? 2 : 0),
    registration: scoreKeywords(text, [
      "CARTE GRISE",
      "IMMATRICULATION",
      "CERTIFICAT D'IMMATRICULATION",
      "NUMERO DE CHASSIS",
      "NUMERO DU VIN",
      "VIN",
      "CHASSIS",
      "SOCIETE DE CREDIT",
      "TYPE TECHNIQUE",
      "NUMERO DE MOTEUR",
      "CODE BARRE",
      "GENRE",
      "PTAC",
      "MARQUE",
      "CYLINDREE",
    ]),
    cni: scoreKeywords(text, [
      "CARTE NATIONALE",
      "CARTE D'IDENTITE",
      "PIECE D'IDENTITE",
      "NATIONALITE",
      "IVOIRIENNE",
      "NNI",
    ]) +
      (hasCniMrz(text) ? 4 : 0),
    insurance: scoreKeywords(text, [
      "ASSURANCE",
      "ATTESTATION D'ASSURANCE",
      "POLICE D'ASSURANCE",
    ]),
    technical: scoreKeywords(text, [
      "VISITE TECHNIQUE",
      "CONTROLE TECHNIQUE",
    ]),
  };

  // « CNI » seul sur verso permis (réf. document lié) — pénaliser classification CNI
  const n = normalize(text);
  if (
    n.includes("CNI") &&
    !n.includes("CARTE NATIONALE") &&
    (n.includes("VALIDITE") || n.includes("CATEGORIE") || n.includes("GROUPE SANGUIN"))
  ) {
    scores.cni = Math.max(0, scores.cni - 3);
    scores.license += 2;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKind, topScore] = ranked[0] ?? ["unknown", 0];
  const secondScore = ranked[1]?.[1] ?? 0;

  if (topScore === 0 || (topScore <= secondScore && secondScore > 0)) {
    return {
      kind: "unknown",
      side: null,
      slot: null,
      label: "Type de document non reconnu",
      confidence: "low",
    };
  }

  const kind = topKind as DocumentKind;
  let side: "recto" | "verso" | null =
    kind === "selfie"
      ? null
      : isVersoHeuristic(text)
        ? "verso"
        : "recto";

  if (kind === "registration" && isRegistrationVerso(text)) {
    side = "verso";
  }
  if (kind === "license" && isLicenseVerso(text)) {
    side = "verso";
  }

  return result(kind, side, topScore >= 2 ? "high" : "medium");
}

export function assignSlots(
  items: Array<{ index: number; classification: ClassificationResult }>
): Array<{ index: number; slot: DocumentSlotKey; label: string }> {
  const used = new Set<DocumentSlotKey>();
  const out: Array<{ index: number; slot: DocumentSlotKey; label: string }> = [];

  const preferSlot = (
    kind: DocumentKind,
    side: "recto" | "verso" | null
  ): DocumentSlotKey | null => {
    if (kind === "selfie") return used.has("selfie") ? null : "selfie";
    if (kind === "insurance") return used.has("insurance") ? null : "insurance";
    if (kind === "technical")
      return used.has("technicalInspection") ? null : "technicalInspection";

    const recto = `${kind}.recto` as DocumentSlotKey;
    const verso = `${kind}.verso` as DocumentSlotKey;

    if (side === "verso" && !used.has(verso)) return verso;
    if (side === "recto" && !used.has(recto)) return recto;
    // 2e image du même type : recto déjà pris → verso (ex. carte grise verso)
    if (side === "recto" && used.has(recto) && !used.has(verso)) return verso;
    if (!used.has(recto)) return recto;
    if (!used.has(verso)) return verso;
    return null;
  };

  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.classification.confidence] - order[b.classification.confidence];
  });

  for (const item of sorted) {
    const { kind, side } = item.classification;
    if (kind === "unknown") continue;
    const slot = preferSlot(kind, side);
    if (!slot || used.has(slot)) continue;
    used.add(slot);
    const assignedSide = slot.endsWith(".verso")
      ? "verso"
      : slot.endsWith(".recto")
        ? "recto"
        : side;
    out.push({
      index: item.index,
      slot,
      label: classificationDisplayLabel(kind, assignedSide),
    });
  }

  return out.sort((a, b) => a.index - b.index);
}
