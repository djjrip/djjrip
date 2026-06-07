#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🚇 NEXUS VPC ENDPOINT SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS VPC Endpoints metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-vpc-endpoints.json>');
    process.exit(1);
}

// Interface VPC Endpoints cost ~$7.30 per month, per ENI (which usually means per AZ)
const COST_PER_ENDPOINT_MONTH = 7.30;

console.log(`\nHunting for 'Tunnels to Nowhere' burning your AWS networking capital...\n`);

const endpointRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(endpointRaw);

let hoarderCount = 0;
let totalWastedMonthly = 0;

data.Endpoints.forEach(endpoint => {
    // Only looking at Interface endpoints (Gateway endpoints to S3/DynamoDB are free)
    if (endpoint.VpcEndpointType === 'Interface') {
        // If the endpoint has had ZERO bytes processed over 30 days, it's a Tunnel to Nowhere
        if (endpoint.BytesProcessed30Days === 0) {
            hoarderCount++;
            
            // AWS bills per subnet/AZ the endpoint is deployed in
            const subnetCount = endpoint.SubnetIds.length;
            const wastedMonthlyCost = subnetCount * COST_PER_ENDPOINT_MONTH;
            
            totalWastedMonthly += wastedMonthlyCost;
            
            console.log(`💀 ${DANGER_COLOR}[TUNNEL TO NOWHERE]${RESET} Endpoint: ${endpoint.VpcEndpointId}`);
            console.log(`   Service: ${endpoint.ServiceName} | Subnets: ${subnetCount}`);
            console.log(`   Action: You are paying $${wastedMonthlyCost.toFixed(2)}/mo for an idle secure tunnel that transfers ZERO bytes. Delete it.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total VPC Endpoints Analyzed: ${data.Endpoints.length}`);

if (hoarderCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL TUNNELS TO NOWHERE: ${DANGER_COLOR}${hoarderCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop copy-pasting Terraform endpoint blocks into environments that don't need them.${RESET}`);
} else {
    console.log(`✅ NETWORK HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your private links are actively utilized.${RESET}`);
}
