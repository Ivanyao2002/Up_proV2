import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('Usage: node scripts/read-pdf.mjs <path-to-pdf>');
  process.exit(1);
}

const absPath = resolve(pdfPath);
console.log(`Reading PDF: ${absPath}`);

// Extract text from PDF by parsing raw content
const buffer = readFileSync(absPath);
const str = buffer.toString('latin1');

// Extract all text streams from the PDF
const texts = [];
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
const textRegex = /\(([^)\\]|\\.)*\)/g;
const tjRegex = /\[((?:[^[\]]*(?:\([^)]*\))*[^[\]]*)*)\]\s*TJ/g;

// Method 1: BT...ET blocks (standard text extraction)
const btEtRegex = /BT([\s\S]*?)ET/g;
let btMatch;
while ((btMatch = btEtRegex.exec(str)) !== null) {
  const block = btMatch[1];
  // Extract Tj / TJ operators
  const tjMatches = block.match(/\(([^)\\]|\\.)*\)\s*Tj/g);
  if (tjMatches) {
    for (const t of tjMatches) {
      const inner = t.match(/\(([^)]*)\)/);
      if (inner && inner[1].trim()) {
        texts.push(inner[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\(/g, '(').replace(/\\\)/g, ')'));
      }
    }
  }
  // Extract TJ arrays
  const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g);
  if (tjArrayMatches) {
    for (const t of tjArrayMatches) {
      const parts = t.match(/\(([^)]*)\)/g);
      if (parts) {
        const combined = parts.map(p => p.slice(1, -1)).join('').trim();
        if (combined) texts.push(combined.replace(/\\\(/g, '(').replace(/\\\)/g, ')'));
      }
    }
  }
}

const output = texts
  .filter(t => t.trim().length > 1)
  .join('\n')
  .replace(/\r/g, '')
  .replace(/\n{3,}/g, '\n\n');

if (output.trim().length < 100) {
  console.warn('⚠️  Raw extraction yielded little text. PDF may be image-based or encoded.');
  console.log('\n--- RAW SAMPLE (first 3000 chars) ---');
  console.log(str.slice(0, 3000).replace(/[^\x20-\x7E\n\r]/g, '.'));
} else {
  const outPath = absPath.replace(/\.pdf$/i, '.txt');
  writeFileSync(outPath, output, 'utf-8');
  console.log(`\n✅ Extracted ${texts.length} text blocks`);
  console.log(`📄 Output saved to: ${outPath}`);
  console.log('\n--- PREVIEW (first 2000 chars) ---');
  console.log(output.slice(0, 2000));
}
