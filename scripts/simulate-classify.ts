import {
  assignSlots,
  classifyDocumentFromText,
} from "../src/app/api/admin/assistant/onboarding/classifyDocument";

const cases: Record<string, string> = {
  "permis_p2 (OCR Paddle reel)": `7.CaresDae de alde
ToDaefepraon
05-05-2017
PERMANENT
CNI-C0112495085
05-05-2017
PERMANENT
05-05-2017
05-05-2022
05-05-2017
05-05-2022
05-05-2017
5-05-2022
00001439375`,
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
  "permis_p2 (OCR pauvre - categories)": `MINISTERE DES TRANSPORTS
A PERMANENT
B PERMANENT
C 05-05-2022
Signature et cachet de l autorite`,
  "permis_p2 (OCR tres pauvre)": `MINISTERE DES TRANSPORTS
00001439375
Signature et cachet de l autorite`,
  "permis_p1 recto": `PERMIS DE CONDUIRE
REPUBLIQUE DE COTE D'IVOIRE
Nom N'DJA
Prenoms BROU ANDREA`,
  "carte_grise recto": `CARTE GRISE
REPUBLIQUE DE COTE D'IVOIRE
Numero d immatriculation AA-544-VQ-01
Marque SUZUKI`,
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
  "cni verso": `NNI 11854850560
IDCIVCI0027454<<040<<<<<<<<<<<<<<<
AKOSSI<<HABIB<WILFRIED`,
};

console.log("=== classifyDocumentFromText ===\n");
for (const [name, text] of Object.entries(cases)) {
  const r = classifyDocumentFromText(text);
  console.log(`${name} => ${r.kind} / ${r.side} / ${r.label} (${r.confidence})`);
}

console.log("\n=== assignSlots (binome complet simule) ===\n");
const files = [
  classifyDocumentFromText(cases["carte_grise recto"]!),
  classifyDocumentFromText(cases["permis_p1 recto"]!),
  classifyDocumentFromText(`CARTE NATIONALE D IDENTITE\nAKOSSI HABIB`),
  classifyDocumentFromText(cases["cni verso"]!),
  classifyDocumentFromText(cases["carte_grise_2 (OCR ideal)"]!),
  classifyDocumentFromText(cases["permis_p2 (OCR Paddle reel)"]!),
];
const names = [
  "carte_grise.png",
  "permis_p1.png",
  "id_part1.png",
  "id_part2.png",
  "carte_grise_2.png",
  "permis_p2.png",
];
const assignments = assignSlots(
  files.map((classification, index) => ({ index, classification }))
);
for (const a of assignments) {
  console.log(`${names[a.index]} → ${a.label} [${a.slot}]`);
}
