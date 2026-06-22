"""
read-pdf.py — Extrait le texte d'un PDF (texte natif ou image-based via OCR)
Usage: python scripts/read-pdf.py <chemin-vers-pdf>

Dépendances:
  pip install pymupdf          # extraction texte natif
  pip install pymupdf[ocr]     # OCR (optionnel, nécessite Tesseract installé)
"""

import sys
import os
import fitz  # PyMuPDF

def extract_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    pages_text = []

    for page_num, page in enumerate(doc, start=1):
        # Tentative extraction texte natif
        text = page.get_text("text").strip()

        if text:
            pages_text.append(f"=== Page {page_num} ===\n{text}")
        else:
            # Fallback : extraction via dict (blocs)
            blocks = page.get_text("dict").get("blocks", [])
            lines = []
            for block in blocks:
                if block.get("type") == 0:  # type 0 = texte
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            txt = span.get("text", "").strip()
                            if txt:
                                lines.append(txt)
            if lines:
                pages_text.append(f"=== Page {page_num} ===\n" + "\n".join(lines))
            else:
                pages_text.append(f"=== Page {page_num} === [IMAGE - pas de texte extractible]")

    doc.close()
    return "\n\n".join(pages_text)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/read-pdf.py <chemin-vers-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Fichier introuvable: {pdf_path}")
        sys.exit(1)

    print(f"Lecture de: {pdf_path}")
    text = extract_text(pdf_path)

    out_path = os.path.splitext(pdf_path)[0] + ".txt"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"\n✅ Texte extrait ({len(text)} caractères)")
    print(f"📄 Sauvegardé dans: {out_path}")
    print("\n--- APERÇU (2000 premiers caractères) ---")
    print(text[:2000])


if __name__ == "__main__":
    main()
