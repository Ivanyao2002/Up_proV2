#!/usr/bin/env node

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nom du projet
const projectName = process.argv[2];

if (!projectName) {
  console.log("❌ Tu dois préciser un nom de projet");
  process.exit(1);
}

// Chemins
const templatePath = path.join(__dirname, "../templates/react-vite");
const targetPath = path.join(process.cwd(), projectName);

console.log("📦 Création du projet...");

// 1. Copier le template
fs.copySync(templatePath, targetPath);

// 2. Modifier package.json
const packageJsonPath = path.join(targetPath, "package.json");
const packageJson = fs.readJsonSync(packageJsonPath);

packageJson.name = projectName;

fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

// 3. Installer dépendances
console.log("📥 Installation des dépendances...");

execSync("npm install", {
  cwd: targetPath,
  stdio: "inherit",
});

console.log("✅ Projet créé avec succès !");
console.log(`👉 cd ${projectName}`);
console.log("👉 npm run dev");
