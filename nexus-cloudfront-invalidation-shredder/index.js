#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🌪️ NEXUS CLOUDFRONT INVALIDATION SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS CloudFront invalidation metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-cloudfront-invalidations.json>');
    process.exit(1);
}

// AWS CloudFront charges $0.005 per path invalidated over 1,000 paths per month.
// A wildcard /* counts as 1 path. 10,000 explicit files counts as 10,000 paths.
const COST_PER_PATH = 0.005;

console.log(`\nHunting for 'The Loop of Death' in your CI/CD pipelines...\n`);

const cloudfrontRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(cloudfrontRaw);

let loopOfDeathCount = 0;
let totalWastedPaths = 0;

data.InvalidationBatches.forEach(batch => {
    const pathCount = batch.Paths.Quantity;
    const isWildcard = batch.Paths.Items.some(item => item.includes('*'));
    
    // If a single invalidation request submits thousands of individual files instead of a wildcard
    if (pathCount > 100 && !isWildcard) {
        loopOfDeathCount++;
        totalWastedPaths += pathCount;
        
        const batchCost = pathCount * COST_PER_PATH;
        
        console.log(`💀 ${DANGER_COLOR}[LOOP OF DEATH]${RESET} Invalidation ID: ${batch.Id}`);
        console.log(`   Distribution ID: ${batch.DistributionId}`);
        console.log(`   Paths Requested: ${pathCount} explicit files`);
        console.log(`   Action: Your CI/CD pipeline is looping through individual files instead of using a wildcard (/*). You just paid $${batchCost.toFixed(2)} for a cache clear that should have cost $0.00.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Invalidation Batches Analyzed: ${data.InvalidationBatches.length}`);

if (loopOfDeathCount > 0) {
    const totalWastedCost = totalWastedPaths * COST_PER_PATH;
    // Assuming this happens 10 times a day for a month
    const projectedMonthlyWaste = totalWastedCost * 10 * 30;

    console.log(`🔥 TOTAL LOOPS OF DEATH: ${DANGER_COLOR}${loopOfDeathCount}${RESET}`);
    console.log(`🔥 WASTED CAPITAL (THIS BATCH): ${DANGER_COLOR}$${totalWastedCost.toFixed(2)}${RESET}`);
    console.log(`🔥 PROJECTED MONTHLY CI/CD WASTE: ${DANGER_COLOR}$${projectedMonthlyWaste.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Fix your GitHub Actions to use wildcard cache invalidations.${RESET}`);
} else {
    console.log(`✅ CDN HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your CI/CD is executing wildcard invalidations efficiently.${RESET}`);
}
