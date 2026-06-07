#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🕰️ NEXUS RDS PI SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS RDS cluster JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-rds.json>');
    process.exit(1);
}

// AWS RDS PI charges ~$1.50 per vCPU per month for 24-month retention
// Note: 7-day retention is FREE
const COST_PER_VCPU_MONTH = 1.50;

console.log(`\nHunting for 'The Time Traveler's Tax' burning your database capital...\n`);

const rdsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(rdsRaw);

let timeTravelersCount = 0;
let totalWastedMonthly = 0;

data.DBInstances.forEach(db => {
    if (db.PerformanceInsightsEnabled && db.PerformanceInsightsRetentionPeriod > 7) {
        timeTravelersCount++;
        
        // Assume VCPU counts based on standard instance classes (simplified)
        // A real script would map the instance class to exact vCPUs using AWS Pricing API
        let vCPU = 2; // Default fallback
        if (db.DBInstanceClass.includes('4xlarge')) vCPU = 16;
        if (db.DBInstanceClass.includes('8xlarge')) vCPU = 32;
        if (db.DBInstanceClass.includes('16xlarge')) vCPU = 64;
        
        const wasteCost = vCPU * COST_PER_VCPU_MONTH;
        totalWastedMonthly += wasteCost;
        
        console.log(`💀 ${DANGER_COLOR}[TIME TRAVELER'S TAX]${RESET} Database: ${db.DBInstanceIdentifier}`);
        console.log(`   Instance Class: ${db.DBInstanceClass} (Est. ${vCPU} vCPUs)`);
        console.log(`   PI Retention Period: ${db.PerformanceInsightsRetentionPeriod} days`);
        console.log(`   Action: You are paying $${wasteCost.toFixed(2)}/mo to store ancient performance logs nobody reads. Revert to the FREE 7-day tier immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Databases Analyzed: ${data.DBInstances.length}`);

if (timeTravelersCount > 0) {
    console.log(`🔥 TOTAL OVER-RETAINED DATABASES: ${DANGER_COLOR}${timeTravelersCount}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying for metrics from 2 years ago.${RESET}`);
} else {
    console.log(`✅ DATABASE METRICS HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your RDS metrics are on the free tier.${RESET}`);
}
