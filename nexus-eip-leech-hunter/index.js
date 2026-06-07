#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧛 NEXUS EIP LEECH HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Elastic IPs JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-eips.json>');
    process.exit(1);
}

// AWS charges ~$0.005/hour for an unassociated Elastic IP, which is ~$3.60/month.
const COST_PER_EIP_MONTH = 3.60;

console.log(`\nHunting for 'Lost Keys' (Unassociated Elastic IPs) burning your AWS credits...\n`);

const eipsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(eipsRaw);

let leechCount = 0;

data.Addresses.forEach(eip => {
    // An Elastic IP is unassociated if it lacks an AssociationId or InstanceId
    if (!eip.AssociationId) {
        leechCount++;
        
        console.log(`💀 ${DANGER_COLOR}[EIP LEECH]${RESET} Allocation ID: ${eip.AllocationId} | IP: ${eip.PublicIp}`);
        console.log(`   Action: You are paying $${COST_PER_EIP_MONTH.toFixed(2)}/mo for an IP address that isn't connected to anything. Release it.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Elastic IPs Analyzed: ${data.Addresses.length}`);

if (leechCount > 0) {
    const monthlyWastedCapital = leechCount * COST_PER_EIP_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL UNASSOCIATED EIPs: ${DANGER_COLOR}${leechCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop holding onto public IP addresses like a digital hoarder.${RESET}`);
} else {
    console.log(`✅ EIP HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Good job releasing your IPs.${RESET}`);
}
