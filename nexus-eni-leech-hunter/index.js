#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🕸️ NEXUS ENI LEECH HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Network Interfaces JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-enis.json>');
    process.exit(1);
}

console.log(`\nHunting for 'Network Leeches' holding your IP addresses hostage...\n`);

const eniRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(eniRaw);

let leechCount = 0;

data.NetworkInterfaces.forEach(eni => {
    // If an ENI is "available", it means it is completely detached from any EC2 instance, ECS container, or Lambda function.
    // However, it still holds onto its Private IP Address, permanently removing it from the subnet's available pool.
    if (eni.Status === 'available') {
        leechCount++;
        
        console.log(`💀 ${DANGER_COLOR}[NETWORK LEECH]${RESET} ENI: ${eni.NetworkInterfaceId}`);
        console.log(`   VPC: ${eni.VpcId} | Subnet: ${eni.SubnetId}`);
        console.log(`   Hostage IP: ${eni.PrivateIpAddress} | Description: ${eni.Description || 'None'}`);
        console.log(`   Action: This virtual network card is detached but is blocking an IP address from being used by new containers. Delete it immediately to prevent subnet exhaustion.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Network Interfaces Analyzed: ${data.NetworkInterfaces.length}`);

if (leechCount > 0) {
    console.log(`🔥 TOTAL NETWORK LEECHES: ${DANGER_COLOR}${leechCount}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop letting failed Terraform deployments leave garbage network cards in your VPC.${RESET}`);
} else {
    console.log(`✅ NETWORK HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. All your IP addresses are actively utilized.${RESET}`);
}
