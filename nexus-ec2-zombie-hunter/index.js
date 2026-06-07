#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧟 NEXUS EC2 ZOMBIE HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS EC2 metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-ec2-metrics.json>');
    process.exit(1);
}

console.log(`\nHunting for 'Zombie Servers' burning your AWS compute capital...\n`);

const zombiesRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(zombiesRaw);

let zombieCount = 0;
let totalWastedMonthly = 0;

data.Instances.forEach(instance => {
    // A Zombie is an instance that has been running for weeks but has < 1% CPU utilization
    if (instance.State === 'running' && instance.AverageCpuUtilization < 1.0) {
        zombieCount++;
        totalWastedMonthly += instance.MonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[ZOMBIE INSTANCE]${RESET} ID: ${instance.InstanceId} | Type: ${instance.InstanceType}`);
        console.log(`   CPU Utilization: ${instance.AverageCpuUtilization}%`);
        console.log(`   Action: You are paying $${instance.MonthlyCost.toFixed(2)}/mo for a server that does absolutely nothing. Terminate it.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Instances Analyzed: ${data.Instances.length}`);

if (zombieCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL ZOMBIE SERVERS: ${DANGER_COLOR}${zombieCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop leaving massive servers running over the weekend.${RESET}`);
} else {
    console.log(`✅ COMPUTE INFRASTRUCTURE IS LEAN.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No zombies found.${RESET}`);
}
