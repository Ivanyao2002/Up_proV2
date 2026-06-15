import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";
import { matchModelCatalogCode } from "../src/features/fleet/lib/catalogMatch";

const noisyOcr = `REPUBLIQUE DE COTE D'IVOIRE
MINISTERE DES TRANSPORTS ET DES AFFAIRES MARITIMES
AUTORISATION PROVISOIRE DE CIRCULER
N 00002541
Proprietaire ALLA AHOU GISELE ODILE
Marque SUZUKI
Genre VOITURE PARTICULIERE
Immatriculation AB-597-AG
INFORMATIONS SUR LE VEHICULE
Vendu par le concessionnaire CFAO MOBILITY CI
Marque SUZUKI
Modele DZRE
Couleur Bleu
Place assise 5
Numero de chassis MA3ZFDFSHTA280365
Numero de chrono ABJ26CN4567
23-02-2026
23-05-2026`;

const classified = classifyDocumentFromText(noisyOcr);
const extracted = parseVehicleFields(noisyOcr, "autorisation_provisoire");
const modelMatch = matchModelCatalogCode(
  [
    { code: "DZIRE", label: "DZIRE" },
    { code: "SWIFT", label: "SWIFT" },
  ],
  extracted.model
);

console.log("CLASSIFY:", classified.label, classified.vehicleSubtype);
console.log("EXTRACT:", extracted);
console.log("MODEL MATCH:", modelMatch);
