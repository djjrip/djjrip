#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🛜 NEXUS NAT GATEWAY SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS NAT Gateways JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-nat-gateways.json>');
    process.exit(1);
}

// AWS NAT Gateway base cost (approx $0.045/hour = $32.40/month per gateway just to exist, not including data)
const COST_PER_NAT_MONTH = 32.40;

console.log(`\nHunting for 'High Availability' dev environments burning AWS capital...\n`);

const natsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(natsRaw);

const vpcNatMap = {};

// Group NAT Gateways by VPC
data.NatGateways.forEach(nat => {
    // Only care about active ones
    if (nat.State !== 'available') return;
    
    // Find the 'Environment' tag to determine if it's production
    let environment = 'unknown';
    if (nat.Tags) {
        const envTag = nat.Tags.find(t => t.Key.toLowerCase() === 'environment' || t.Key.toLowerCase() === 'env');
        if (envTag) environment = envTag.Value.toLowerCase();
    }
    
    if (!vpcNatMap[nat.VpcId]) {
        vpcNatMap[nat.VpcId] = { environment, count: 0, nats: [] };
    }
    
    vpcNatMap[nat.VpcId].count++;
    vpcNatMap[nat.VpcId].nats.push(nat.NatGatewayId);
});

let redundantNats = 0;

for (const [vpcId, info] of Object.entries(vpcNatMap)) {
    // If it's a dev, staging, or testing environment, and they have > 1 NAT Gateway
    if (['dev', 'development', 'staging', 'test', 'qa'].includes(info.environment) && info.count > 1) {
        const wasteCount = info.count - 1; // You only need 1 NAT for non-prod
        redundantNats += wasteCount;
        const wastedMonthly = wasteCount * COST_PER_NAT_MONTH;
        
        console.log(`💀 ${DANGER_COLOR}[REDUNDANT INFRASTRUCTURE]${RESET} VPC: ${vpcId} (${info.environment})`);
        console.log(`   Gateways Provisioned: ${info.count} | Required for non-prod: 1`);
        console.log(`   Action: You are paying $${wastedMonthly.toFixed(2)}/mo base cost for High Availability in a dev environment. Consolidate to a single NAT.\n`);
    }
}

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total VPCs Analyzed: ${Object.keys(vpcNatMap).length}`);

if (redundantNats > 0) {
    const annualWastedCapital = (redundantNats * COST_PER_NAT_MONTH) * 12;

    console.log(`🔥 TOTAL REDUNDANT NAT GATEWAYS: ${DANGER_COLOR}${redundantNats}${RESET}`);
    console.log(`🔥 ANNUAL WASTED BASE CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop copy-pasting your Production Terraform into Staging.${RESET}`);
} else {
    console.log(`✅ VPC ARCHITECTURE IS LEAN.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Good job saving the startup money.${RESET}`);
}
