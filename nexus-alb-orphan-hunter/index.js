#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🌉 NEXUS ALB ORPHAN HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Application Load Balancers JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-albs.json>');
    process.exit(1);
}

// AWS Application Load Balancer base cost is ~$0.0225/hr = ~$16.20/month
const COST_PER_ALB_MONTH = 16.20;

console.log(`\nHunting for 'Bridges to Nowhere' (Empty Load Balancers) burning your AWS credits...\n`);

const albsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(albsRaw);

let orphanCount = 0;

data.LoadBalancers.forEach(alb => {
    // If the ALB has 0 healthy targets, it is routing traffic to a dead backend
    if (alb.HealthyTargetCount === 0) {
        orphanCount++;
        
        console.log(`💀 ${DANGER_COLOR}[ORPHAN ALB]${RESET} Load Balancer: ${alb.LoadBalancerName}`);
        console.log(`   State: ${alb.State.Code} | Healthy Targets: ${alb.HealthyTargetCount}`);
        console.log(`   Action: You are paying $${COST_PER_ALB_MONTH.toFixed(2)}/mo for a load balancer that routes traffic to nowhere. Delete it.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Load Balancers Analyzed: ${data.LoadBalancers.length}`);

if (orphanCount > 0) {
    const monthlyWastedCapital = orphanCount * COST_PER_ALB_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL EMPTY LOAD BALANCERS: ${DANGER_COLOR}${orphanCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Clean up your Kubernetes ingress finalizers.${RESET}`);
} else {
    console.log(`✅ INGRESS HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Good job maintaining your ingress controllers.${RESET}`);
}
