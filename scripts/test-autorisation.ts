import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";

const ocr = `AUTORISATION PROVISOIRE DE CIRCULER
MINISTERE DES TRANSPORTS ET DES AFFAIRES MARITIMES
Proprietaire KOUAME FRANCK HUBERSON
Marque SUZUKI
Genre VOITURE PARTICULIERE
Immatriculation AB-920-BH
Couleur Rouge
Modele DZIRE
Place assise 5
02-04-2026
02-07-2026`;

const classified = classifyDocumentFromText(ocr);
const extracted = parseVehicleFields(ocr, "autorisation_provisoire");

console.log("CLASSIFY:", classified.label, classified.vehicleSubtype);
console.log("EXTRACT:", extracted);
