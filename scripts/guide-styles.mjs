/** Styles partagés — même charte que RAPPORT_JOUR_*.html */
export const GUIDE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', sans-serif;
  background: #e2e8f0;
  color: #0f172a;
  line-height: 1.45;
}
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 12px auto;
  background: #fff;
  position: relative;
  page-break-after: always;
  padding: 48px 52px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.page:last-child { page-break-after: auto; }
@media print {
  body { background: #fff; }
  .page { margin: 0; box-shadow: none; }
}
.header {
  background: #016d71;
  color: #fff;
  margin: -48px -52px 32px -52px;
  padding: 32px 52px;
}
.header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.header .meta { font-size: 13px; opacity: 0.9; }
.section { margin-bottom: 24px; }
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #016d71;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #016d71;
}
.subsection-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 18px 0 10px;
}
.summary-box {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 22px;
  font-size: 12px;
}
.summary-box h4 { color: #0f766e; font-size: 13px; margin-bottom: 8px; }
.summary-box ul { margin-left: 18px; }
.summary-box li { margin-bottom: 5px; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.stat-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-top: 4px solid #016d71;
}
.stat-card h3 { font-size: 26px; font-weight: 800; color: #016d71; }
.stat-card p { font-size: 11px; color: #64748b; margin-top: 4px; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 14px;
}
th {
  background: #f1f5f9;
  font-weight: 600;
  text-align: left;
  padding: 9px 8px;
  border-bottom: 2px solid #cbd5e1;
}
td {
  padding: 9px 8px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: #dbeafe;
  color: #1e40af;
}
.capture-block {
  margin-bottom: 22px;
  page-break-inside: avoid;
}
.capture-block h3 {
  font-size: 13px;
  font-weight: 700;
  color: #016d71;
  margin-bottom: 6px;
}
.capture-path {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 8px;
  font-family: 'SF Mono', monospace;
}
.capture-img {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: block;
}
.capture-missing {
  background: #fef2f2;
  border: 1px dashed #fca5a5;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: #991b1b;
  font-size: 12px;
}
.usage-list {
  margin: 8px 0 12px 18px;
  font-size: 12px;
}
.usage-list li { margin-bottom: 4px; }
.toc-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dotted #cbd5e1;
  font-size: 12px;
}
.toc-group {
  font-weight: 700;
  color: #016d71;
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 13px;
}
.footer {
  margin-top: 36px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}
.alert-box {
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 18px;
  font-size: 12px;
}
`;
