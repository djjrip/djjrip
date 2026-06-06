#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🦇 NEXUS NPM VAMPIRE HUNTER (Vibe Edition)
===================================================${RESET}`);

const targetDir = process.argv[2] || process.cwd();
const packageJsonPath = path.join(targetDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
    console.log(`${DANGER_COLOR}Error: No package.json found in ${targetDir}.${RESET}`);
    process.exit(1);
}

console.log(`\nHunting for dead dependencies sucking your build time...\n`);

const pkg = require(packageJsonPath);
const dependencies = Object.keys(pkg.dependencies || {});
const devDependencies = Object.keys(pkg.devDependencies || {});
const allDeps = [...dependencies, ...devDependencies];

if (allDeps.length === 0) {
    console.log(`✅ No dependencies found. You are writing pure JS like a god.`);
    process.exit(0);
}

// Recursively find all .js / .ts / .jsx / .tsx files
function getAllCodeFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllCodeFiles(filePath, fileList);
        } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const codeFiles = getAllCodeFiles(targetDir);
let combinedCode = '';
for (const file of codeFiles) {
    combinedCode += fs.readFileSync(file, 'utf8') + '\n';
}

let vampiresFound = 0;

console.log(`Scanning ${codeFiles.length} files against ${allDeps.length} installed packages...\n`);

for (const dep of allDeps) {
    // Basic heuristics for import / require
    const requireRegex = new RegExp(`require\\(['"\`]${dep}['"\`]\\)`);
    const importRegex = new RegExp(`from ['"\`]${dep}['"\`]`);
    const dynamicImportRegex = new RegExp(`import\\(['"\`]${dep}['"\`]\\)`);

    if (!requireRegex.test(combinedCode) && !importRegex.test(combinedCode) && !dynamicImportRegex.test(combinedCode)) {
        vampiresFound++;
        console.log(`💀 ${DANGER_COLOR}[VAMPIRE DEPENDENCY]${RESET} Package: ${dep}`);
        console.log(`   Action: You are downloading this package on every CI/CD run, but NEVER importing it. \`npm uninstall ${dep}\` immediately.\n`);
    }
}

console.log(`${VIBE_COLOR}===================================================${RESET}`);
if (vampiresFound > 0) {
    console.log(`🔥 DEVASTATING FAILURE.`);
    console.log(`   Dead Packages Found: ${DANGER_COLOR}${vampiresFound}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop complaining about slow Docker builds until you delete this dead weight.${RESET}`);
} else {
    console.log(`✅ DEPENDENCY GRAPH IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No vampires found.${RESET}`);
}
