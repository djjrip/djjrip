#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🦇 NEXUS EGRESS VAMPIRE HUNTER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Data Transfer metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-data-transfer.json>');
    process.exit(1);
}

// AWS Data Transfer Out to Internet costs ~$0.09 per GB
const EGRESS_COST_PER_GB = 0.09;

// AWS PrivateLink (VPC Endpoints) Data Processing costs ~$0.01 per GB
const PRIVATELINK_COST_PER_GB = 0.01;

console.log(`\nHunting for 'Egress Vampires' draining your bandwidth capital...\n`);

const egressRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(egressRaw);

let vampireCount = 0;
let totalWastedMonthly = 0;

data.DataTransferOut.forEach(flow => {
    const usageGB = flow.Usage_GB_30d;
    
    // If a specific traffic flow to a 3rd party SaaS is sending massive data over the public internet
    if (usageGB > 5000 && flow.TargetType === "PublicInternet" && flow.KnownSaaSDestination) {
        vampireCount++;
        
        const currentCost = usageGB * EGRESS_COST_PER_GB;
        const privateLinkCost = usageGB * PRIVATELINK_COST_PER_GB;
        const wastedCapital = currentCost - privateLinkCost;
        
        totalWastedMonthly += wastedCapital;
        
        console.log(`💀 ${DANGER_COLOR}[EGRESS VAMPIRE]${RESET} Destination: ${flow.DestinationName}`);
        console.log(`   Traffic Volume (30d): ${usageGB.toLocaleString()} GB`);
        console.log(`   Current Cost (Public Internet): $${currentCost.toFixed(2)}`);
        console.log(`   Optimized Cost (PrivateLink): $${privateLinkCost.toFixed(2)}`);
        console.log(`   Action: You are paying an 800% premium to send logs over the public internet. Cut over to an AWS PrivateLink VPC Endpoint immediately to save $${wastedCapital.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Traffic Flows Analyzed: ${data.DataTransferOut.length}`);

if (vampireCount > 0) {
    console.log(`🔥 TOTAL EGRESS VAMPIRES: ${DANGER_COLOR}${vampireCount}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying the AWS public internet tax.${RESET}`);
} else {
    console.log(`✅ NETWORK EGRESS HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your heavy traffic is routed through PrivateLink.${RESET}`);
}
