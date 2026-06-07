#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧛 NEXUS NAT DATA TRANSFER HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS NAT Gateway metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-nat-metrics.json>');
    process.exit(1);
}

// AWS charges ~$0.045 per GB of data processed through a NAT Gateway
const COST_PER_GB_PROCESSED = 0.045;
// Flag any NAT gateway processing more than 1,000 GB (1TB) a month
const HIGH_TRANSFER_THRESHOLD_GB = 1000;

console.log(`\nHunting for 'Data Vampires' draining your AWS network capital...\n`);

const natRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(natRaw);

let vampireCount = 0;
let totalWastedMonthly = 0;

data.NatGateways.forEach(nat => {
    const dataProcessedGB = nat.MonthlyDataProcessedBytes / (1024 * 1024 * 1024);
    
    // If the NAT is processing massive amounts of data, it's likely internal AWS traffic (like S3) that should use a free VPC endpoint
    if (dataProcessedGB > HIGH_TRANSFER_THRESHOLD_GB) {
        vampireCount++;
        
        const wastedMonthlyCost = dataProcessedGB * COST_PER_GB_PROCESSED;
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[DATA VAMPIRE]${RESET} NAT Gateway: ${nat.NatGatewayId}`);
        console.log(`   VPC: ${nat.VpcId} | Monthly Data Processed: ${dataProcessedGB.toFixed(2)} GB`);
        console.log(`   Action: You are paying $${wastedMonthlyCost.toFixed(2)}/mo just in NAT data processing fees. If this traffic is going to S3 or DynamoDB, create a FREE Gateway VPC Endpoint immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total NAT Gateways Analyzed: ${data.NatGateways.length}`);

if (vampireCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL DATA VAMPIRES: ${DANGER_COLOR}${vampireCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to route traffic between your own AWS services.${RESET}`);
} else {
    console.log(`✅ NETWORK HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your NAT traffic is optimized.${RESET}`);
}
