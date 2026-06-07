#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🩺 NEXUS ROUTE 53 HEALTH CHECK SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Route 53 Health Checks JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-route53-health-checks.json>');
    process.exit(1);
}

// AWS Route 53 Health Check base cost is ~$0.75/month (up to $2.00+ with HTTPS/Fast routing)
const COST_PER_HEALTHCHECK_MONTH = 0.75;

console.log(`\nHunting for 'Dangling Pingers' burning your AWS networking capital...\n`);

const checksRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(checksRaw);

let danglingCount = 0;

data.HealthChecks.forEach(check => {
    // A dangling health check is one that has been in a FAILURE state for a long time
    // because the underlying infrastructure (ALB/EC2) was deleted, but the check was forgotten.
    if (check.Status === 'FAILURE' && check.ConsecutiveFailureCount > 1000) {
        danglingCount++;
        
        console.log(`💀 ${DANGER_COLOR}[DANGLING HEALTH CHECK]${RESET} ID: ${check.Id}`);
        console.log(`   Target: ${check.TargetDomainName || check.TargetIpAddress}`);
        console.log(`   Failures: ${check.ConsecutiveFailureCount} consecutive pings to nowhere.`);
        console.log(`   Action: You are paying $${COST_PER_HEALTHCHECK_MONTH.toFixed(2)}/mo to ping a server that doesn't exist. Delete it.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Health Checks Analyzed: ${data.HealthChecks.length}`);

if (danglingCount > 0) {
    const monthlyWastedCapital = danglingCount * COST_PER_HEALTHCHECK_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL DANGLING HEALTH CHECKS: ${DANGER_COLOR}${danglingCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to knock on an empty door.${RESET}`);
} else {
    console.log(`✅ ROUTE 53 HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No dangling pingers found.${RESET}`);
}
