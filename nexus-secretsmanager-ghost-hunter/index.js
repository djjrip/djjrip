#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🔐 NEXUS SECRETS MANAGER GHOST HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Secrets Manager JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-secrets.json>');
    process.exit(1);
}

// AWS Secrets Manager costs $0.40 per secret per month
const COST_PER_SECRET_MONTH = 0.40;
const GHOST_THRESHOLD_DAYS = 90;

console.log(`\nHunting for 'Ghost Secrets' burning your AWS security capital...\n`);

const secretsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(secretsRaw);

let ghostCount = 0;
let totalWastedMonthly = 0;

const now = new Date();

data.SecretList.forEach(secret => {
    const lastAccessed = new Date(secret.LastAccessedDate);
    
    // Calculate days since last access. If never accessed, assume it's a ghost from the creation date.
    let targetDate = secret.LastAccessedDate ? lastAccessed : new Date(secret.CreatedDate);
    const diffTime = Math.abs(now - targetDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > GHOST_THRESHOLD_DAYS) {
        ghostCount++;
        totalWastedMonthly += COST_PER_SECRET_MONTH;
        
        console.log(`💀 ${DANGER_COLOR}[GHOST SECRET]${RESET} Secret Name: ${secret.Name}`);
        console.log(`   ARN: ${secret.ARN}`);
        console.log(`   Last Accessed: ${secret.LastAccessedDate ? secret.LastAccessedDate : 'NEVER'} (${diffDays} days ago)`);
        console.log(`   Action: You are paying AWS to securely store digital trash. Delete this forgotten secret to save $0.40/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Secrets Analyzed: ${data.SecretList.length}`);

if (ghostCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL GHOST SECRETS: ${DANGER_COLOR}${ghostCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to guard API keys for microservices you deleted in 2022.${RESET}`);
} else {
    console.log(`✅ SECURITY HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. All your secrets are actively accessed.${RESET}`);
}
