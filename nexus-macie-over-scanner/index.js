#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🕵️ NEXUS MACIE OVER-SCANNER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Macie Job configuration JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-macie-jobs.json>');
    process.exit(1);
}

// AWS Macie costs $1.00 per GB for the first 500GB, then drops to $0.50/GB, then $0.10/GB
// We will use a blended average of roughly $0.50 per GB for massive datasets to calculate waste.
const MACIE_COST_PER_GB = 0.50; 

// Keywords indicating "Machine Data" rather than "Human Data" (PII)
const GARBAGE_BUCKET_KEYWORDS = ['logs', 'cloudtrail', 'vpc-flow', 'archive', 'backups', 'system-metrics', 'cache'];

console.log(`\nHunting for 'Machine Learning Gluttons' burning your security capital on system logs...\n`);

const macieRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(macieRaw);

let overscanCount = 0;
let totalWasted = 0;

data.MacieJobs.forEach(job => {
    if (job.Status === 'ACTIVE' || job.Status === 'RUNNING') {
        const bucketName = job.TargetBucketName.toLowerCase();
        
        // Check if the bucket name contains any of the garbage keywords
        const isGarbageBucket = GARBAGE_BUCKET_KEYWORDS.some(keyword => bucketName.includes(keyword));
        
        if (isGarbageBucket && job.BucketSizeGB > 100) { // Only flag if it's a massive bucket
            overscanCount++;
            
            const wastedCost = job.BucketSizeGB * MACIE_COST_PER_GB;
            totalWasted += wastedCost;
            
            console.log(`💀 ${DANGER_COLOR}[ML GLUTTON]${RESET} Macie Job: ${job.JobId}`);
            console.log(`   Target Bucket: ${job.TargetBucketName} | Size: ${job.BucketSizeGB} GB`);
            console.log(`   Job Type: ${job.JobType}`);
            console.log(`   Action: You are using advanced AI to scan system logs for Social Security Numbers. Exclude this bucket from Macie immediately to save ~$${wastedCost.toFixed(2)} per full scan.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Macie Jobs Analyzed: ${data.MacieJobs.length}`);

if (overscanCount > 0) {
    console.log(`🔥 TOTAL ML GLUTTONS: ${DANGER_COLOR}${overscanCount}${RESET}`);
    console.log(`🔥 WASTED CAPITAL PER SCAN CYCLE: ${DANGER_COLOR}$${totalWasted.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop letting Security Teams use wildcard (*) bucket policies for expensive AI scanners.${RESET}`);
} else {
    console.log(`✅ DATA DISCOVERY HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. You are only scanning actual PII targets.${RESET}`);
}
