#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🗝️ NEXUS KMS GHOST HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS KMS Keys JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-kms-keys.json>');
    process.exit(1);
}

// AWS Customer Managed KMS Keys cost $1.00 per month
const COST_PER_KEY_MONTH = 1.00;

console.log(`\nHunting for 'Ghost Keys' burning your AWS security capital...\n`);

const kmsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(kmsRaw);

let ghostCount = 0;
let totalWastedMonthly = 0;

data.Keys.forEach(key => {
    // If a key has had 0 cryptographic operations in the last 90 days, it's a Ghost Key
    if (key.CryptographicOperations90Days === 0 && key.KeyState === "Enabled") {
        ghostCount++;
        totalWastedMonthly += COST_PER_KEY_MONTH;
        
        console.log(`💀 ${DANGER_COLOR}[GHOST KEY]${RESET} Key ID: ${key.KeyId}`);
        console.log(`   Alias: ${key.Alias} | State: ${key.KeyState}`);
        console.log(`   Action: This padlock secures nothing. It has not been used in 90 days. Schedule it for deletion to save $1.00/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total KMS Keys Analyzed: ${data.Keys.length}`);

if (ghostCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL GHOST KEYS: ${DANGER_COLOR}${ghostCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying for digital padlocks on doors that were destroyed years ago.${RESET}`);
} else {
    console.log(`✅ SECURITY HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. All your keys are actively guarding infrastructure.${RESET}`);
}
