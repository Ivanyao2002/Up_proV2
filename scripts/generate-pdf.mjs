import { exec } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

const htmlPath = resolve("RAPPORT_JOUR_2026-06-11.html");
const pdfPath = resolve("RAPPORT_JOUR_2026-06-11.pdf");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const args = [
  `"${chromePath}"`,
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  `--print-to-pdf="${pdfPath}"`,
  "--print-to-pdf-no-header",
  `"file:///${htmlPath.replace(/\\/g, "/")}"`,
].join(" ");

console.log("Generating PDF...");
console.log(args);

const child = exec(args, { timeout: 30000 }, (err, stdout, stderr) => {
  if (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
  console.log("PDF generated:", pdfPath);
});

child.stdout?.on("data", (d) => console.log(d));
child.stderr?.on("data", (d) => console.error(d));
