import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";

const cases: Record<string, string> = {
  "permis_p2 (OCR ideal)": `7. Categories
8. Date de validite
9. Date d expiration
A PERMANENT
B PERMANENT
10. Document d identite
CNI - C0112495086
11. Groupe Sanguin
AB+
Cette carte est strictement personnelle
Ministre des Transports`,
  "permis_p2 (OCR pauvre)": `MINISTERE DES TRANSPORTS
00001439375
Signature et cachet de l autorite`,
  "carte_grise_2 (OCR ideal)": `Numero du VIN/Chassis
WDB670353DN149672
Societe de credit
NSIA BANQUE
Type technique
670353
Signature et cachet de l autorite
Ministre des Transports`,
  "carte_grise_2 (avec immat)": `Numero d immatriculation precedent
Numero du VIN/Chassis
WDB670353DN149672
Ministere des Transports`,
};

for (const [name, text] of Object.entries(cases)) {
  const r = classifyDocumentFromText(text);
  console.log(name, "=>", r.kind, r.side, r.label, r.confidence);
}
