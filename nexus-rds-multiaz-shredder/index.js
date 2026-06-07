#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🐘 NEXUS RDS MULTI-AZ SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS RDS instances JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-rds-instances.json>');
    process.exit(1);
}

console.log(`\nHunting for 'High-Availability Paranoia' (Multi-AZ Dev DBs) burning your AWS database capital...\n`);

const rdsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(rdsRaw);

let paranoiaCount = 0;
let totalWastedMonthly = 0;

const nonProdKeywords = ['dev', 'test', 'staging', 'qa', 'sandbox'];

data.DBInstances.forEach(db => {
    const isNonProd = nonProdKeywords.some(keyword => db.DBInstanceIdentifier.toLowerCase().includes(keyword));
    
    // If it's a non-prod database but Multi-AZ is turned on, they are paying double for no reason
    if (isNonProd && db.MultiAZ) {
        paranoiaCount++;
        
        // Multi-AZ essentially doubles the instance cost
        const wastedMonthly = db.MonthlyInstanceCost / 2;
        totalWastedMonthly += wastedMonthly;
        
        console.log(`💀 ${DANGER_COLOR}[HA PARANOIA]${RESET} Database: ${db.DBInstanceIdentifier}`);
        console.log(`   Environment: Non-Production | Multi-AZ: TRUE`);
        console.log(`   Action: You are paying $${wastedMonthly.toFixed(2)}/mo extra for zero-downtime failover on a test database. Turn off Multi-AZ.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total RDS Instances Analyzed: ${data.DBInstances.length}`);

if (paranoiaCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL OVER-PROVISIONED DEV DBs: ${DANGER_COLOR}${paranoiaCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. You do not need zero-downtime failover for a sandbox environment.${RESET}`);
} else {
    console.log(`✅ DATABASE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your dev databases are appropriately mortal.${RESET}`);
}
