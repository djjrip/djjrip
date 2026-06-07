#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧟 NEXUS REDIS ZOMBIE HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS ElastiCache JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-elasticache-metrics.json>');
    process.exit(1);
}

console.log(`\nHunting for 'Zombie Caches' burning your AWS memory capital...\n`);

const cacheRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(cacheRaw);

let zombieCount = 0;
let totalWastedMonthly = 0;

data.Clusters.forEach(cluster => {
    // If the cluster has had 0 active connections over the last 30 days, it is a Zombie
    if (cluster.MaxConnections30Days === 0) {
        zombieCount++;
        totalWastedMonthly += cluster.MonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[ZOMBIE CACHE]${RESET} Cluster: ${cluster.ClusterId}`);
        console.log(`   Engine: ${cluster.Engine} | Instance Type: ${cluster.NodeType}`);
        console.log(`   Action: This cache has had ZERO connections in 30 days. You are paying $${cluster.MonthlyCost.toFixed(2)}/mo for empty RAM. Terminate it.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total ElastiCache Clusters Analyzed: ${data.Clusters.length}`);

if (zombieCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL ZOMBIE CACHES: ${DANGER_COLOR}${zombieCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying for expensive RAM that nobody is connecting to.${RESET}`);
} else {
    console.log(`✅ CACHE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your caches are actively utilized.${RESET}`);
}
