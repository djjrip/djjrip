#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🕵️ NEXUS CLOUDTRAIL DUPLICATION HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS CloudTrail JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-cloudtrail-trails.json>');
    process.exit(1);
}

// Data events cost $0.10 per 100,000 events ($0.000001 per event)
const COST_PER_DATA_EVENT = 0.000001;

console.log(`\nHunting for 'Echo Chambers' burning your AWS logging capital...\n`);

const trailRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(trailRaw);

let duplicationCount = 0;
let totalWastedMonthly = 0;

// Map to track which S3 buckets are being logged by which trails
const s3DataEventMap = {};

data.Trails.forEach(trail => {
    trail.DataEventResources.forEach(resource => {
        if (!s3DataEventMap[resource.Arn]) {
            s3DataEventMap[resource.Arn] = [];
        }
        s3DataEventMap[resource.Arn].push({
            TrailName: trail.TrailName,
            MonthlyEvents: resource.MonthlyEvents
        });
    });
});

Object.keys(s3DataEventMap).forEach(bucketArn => {
    const loggers = s3DataEventMap[bucketArn];
    
    // If more than one trail is logging data events for the EXACT same bucket, we have an Echo Chamber
    if (loggers.length > 1) {
        duplicationCount++;
        
        // AWS charges for EVERY trail logging the event. We assume 1 trail is the "truth", the rest are waste.
        let wasteEvents = 0;
        const trailNames = [];
        
        // Sort by events descending, keep the first one as primary, rest as waste
        loggers.sort((a, b) => b.MonthlyEvents - a.MonthlyEvents);
        
        for (let i = 1; i < loggers.length; i++) {
            wasteEvents += loggers[i].MonthlyEvents;
            trailNames.push(loggers[i].TrailName);
        }
        
        const wastedMonthlyCost = wasteEvents * COST_PER_DATA_EVENT;
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[ECHO CHAMBER]${RESET} Resource: ${bucketArn}`);
        console.log(`   Logged by multiple trails: ${loggers.map(l => l.TrailName).join(', ')}`);
        console.log(`   Action: You are logging the exact same S3 data events multiple times. Remove the duplicate event selectors from [${trailNames.join(', ')}] to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Trails Analyzed: ${data.Trails.length}`);
console.log(`Total S3 Resources Analyzed: ${Object.keys(s3DataEventMap).length}`);

if (duplicationCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL DUPLICATED RESOURCES: ${DANGER_COLOR}${duplicationCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to copy and paste the same security logs into different buckets.${RESET}`);
} else {
    console.log(`✅ LOGGING HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your CloudTrail event selectors are perfectly distinct.${RESET}`);
}
