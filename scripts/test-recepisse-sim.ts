import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";
import { matchBrandCatalogCode, matchColorCatalogCode } from "../src/features/fleet/lib/catalogMatch";

const simulatedOcr = `RECEPISSE D'IMMATRICULATION DANS LA SERIE WW-CI
REPUBLIQUE DE COTE D'IVOIRE
Numero de la serie WW-CI
2025/31188
Marque Suzuki
Type PF L61
Couleur Rouge
Genre VP
Source d'energie Essence
Numero de serie MA3RF161S1A556314
07-04-2026`;

const classified = classifyDocumentFromText(simulatedOcr);
const extracted = parseVehicleFields(simulatedOcr, "recepisse_ww");
const brandMatch = matchBrandCatalogCode([{ code: "SUZUKI", label: "Suzuki" }], extracted.brand);
const colorMatch = matchColorCatalogCode([{ code: "ROUGE", label: "Rouge" }], extracted.color);

console.log("CLASSIFY:", classified.label, classified.vehicleSubtype);
console.log("EXTRACT:", extracted);
console.log("BRAND MATCH:", brandMatch);
console.log("COLOR MATCH:", colorMatch);
