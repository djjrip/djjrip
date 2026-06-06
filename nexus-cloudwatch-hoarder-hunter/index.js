#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
☁️ NEXUS CLOUDWATCH HOARDER HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS CloudWatch describe-log-groups JSON.${RESET}`);
    console.log('Usage: node index.js <aws-log-groups.json>');
    process.exit(1);
}

// AWS CloudWatch Logs approximate storage cost per GB/month
const COST_PER_GB_MONTH = 0.03;

console.log(`\nHunting for 'Never Expire' log groups burning your AWS credits...\n`);

const logsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(logsRaw);

let hoarderGroups = 0;
let totalWastedGB = 0;

data.logGroups.forEach(group => {
    // If retentionInDays is undefined, it means "Never Expire"
    const isHoarder = !group.retentionInDays || group.retentionInDays > 30;
    const sizeGB = group.storedBytes / (1024 * 1024 * 1024);

    if (isHoarder && sizeGB > 10) { // Only flag if it's over 10GB to reduce noise
        hoarderGroups++;
        totalWastedGB += sizeGB;
        
        const monthlyWaste = sizeGB * COST_PER_GB_MONTH;
        const retentionStr = group.retentionInDays ? `${group.retentionInDays} Days` : 'NEVER EXPIRE';
        
        console.log(`💀 ${DANGER_COLOR}[LOG HOARDER]${RESET} Group: ${group.logGroupName}`);
        console.log(`   Size: ${sizeGB.toFixed(2)} GB | Retention: ${retentionStr}`);
        console.log(`   Action: You are paying $${monthlyWaste.toFixed(2)}/mo to store old logs forever. Set a 14-day retention policy.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Log Groups Analyzed: ${data.logGroups.length}`);

if (hoarderGroups > 0) {
    const monthlyWastedCapital = totalWastedGB * COST_PER_GB_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL HOARDED LOGS: ${DANGER_COLOR}${totalWastedGB.toFixed(2)} GB${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. You do not need HTTP 200 access logs from three years ago.${RESET}`);
} else {
    console.log(`✅ LOG RETENTION IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No massive 'Never Expire' log groups found.${RESET}`);
}
