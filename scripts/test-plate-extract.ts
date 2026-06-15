import { extractWithRulesFromOcr } from "../src/app/api/document-extract/rulesParser";

const samples: Record<string, string> = {
  toyota: `CARTE GRISE
Numero d immatriculation
1234AB56
Marque
TOYOTA
Type commercial
COROLLA XLI
Couleur
ORANGE
Date de 1ere mise en circulation
03-10-2006`,
  suzuki: `CARTE GRISE
Numero d immatriculation
AA-544-VQ-01
Marque
SUZUKI
Type commercial
S-PRESSO
Couleur
ROUGE
01-10-2025`,
  inline: `CARTE GRISE
Numero d immatriculation 1234AB56
MARQUE TOYOTA`,
};

for (const [name, text] of Object.entries(samples)) {
  const r = extractWithRulesFromOcr("registration", text);
  console.log(name, JSON.stringify(r.vehicle));
}
