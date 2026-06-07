#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧟 NEXUS API GATEWAY CACHE SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS API Gateway Stage metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-api-gateway-metrics.json>');
    process.exit(1);
}

console.log(`\nHunting for 'Cache Zombies' burning your networking capital...\n`);

const apiRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(apiRaw);

let zombieCount = 0;
let totalWastedMonthly = 0;

data.APIStages.forEach(stage => {
    if (stage.MethodSettings && stage.MethodSettings.CachingEnabled) {
        const totalCacheHits = stage.Metrics.CacheHitCount_30d;
        const totalCacheMisses = stage.Metrics.CacheMissCount_30d;
        const totalRequests = totalCacheHits + totalCacheMisses;
        
        // If a provisioned cache hasn't processed any requests in 30 days
        if (totalRequests === 0) {
            zombieCount++;
            const costPerMonth = stage.MethodSettings.EstimatedMonthlyCost;
            totalWastedMonthly += costPerMonth;
            
            console.log(`💀 ${DANGER_COLOR}[CACHE ZOMBIE]${RESET} API: ${stage.ApiName} | Stage: ${stage.StageName}`);
            console.log(`   Cache Size: ${stage.MethodSettings.CacheClusterSize} GB`);
            console.log(`   Cache Hits (30d): 0`);
            console.log(`   Cache Misses (30d): 0`);
            console.log(`   Action: You are paying $${costPerMonth.toFixed(2)}/mo for an in-memory cache sitting in front of a dead endpoint. Disable caching immediately.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total API Stages Analyzed: ${data.APIStages.length}`);

if (zombieCount > 0) {
    console.log(`🔥 TOTAL CACHE ZOMBIES: ${DANGER_COLOR}${zombieCount}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying rent on empty memory banks.${RESET}`);
} else {
    console.log(`✅ API CACHE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your provisioned caches are actively serving traffic.${RESET}`);
}
