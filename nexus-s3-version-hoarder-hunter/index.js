#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🗑️ NEXUS S3 VERSION HOARDER HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS S3 bucket analysis JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-s3-buckets.json>');
    process.exit(1);
}

// AWS S3 Standard Storage cost is ~$0.023 per GB per month
const COST_PER_GB_MONTH = 0.023;

console.log(`\nHunting for 'Invisible Trash' (Noncurrent S3 Versions) burning your AWS storage capital...\n`);

const bucketsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(bucketsRaw);

let hoarderCount = 0;
let totalWastedMonthly = 0;

data.Buckets.forEach(bucket => {
    // A Hoarder bucket has Versioning Enabled, holds massive Noncurrent Bytes, and has NO Lifecycle rule to delete them
    if (bucket.VersioningEnabled && bucket.NoncurrentVersionBytes > 0 && !bucket.HasNoncurrentLifecycleRule) {
        hoarderCount++;
        
        const noncurrentGb = bucket.NoncurrentVersionBytes / (1024 * 1024 * 1024);
        const wastedMonthly = noncurrentGb * COST_PER_GB_MONTH;
        totalWastedMonthly += wastedMonthly;
        
        console.log(`💀 ${DANGER_COLOR}[VERSION HOARDER]${RESET} Bucket: ${bucket.Name}`);
        console.log(`   Invisible Trash: ${noncurrentGb.toFixed(2)} GB of deleted/overwritten files.`);
        console.log(`   Action: You are paying $${wastedMonthly.toFixed(2)}/mo to store files you already deleted. Add a Lifecycle Rule.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total S3 Buckets Analyzed: ${data.Buckets.length}`);

if (hoarderCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL HOARDER BUCKETS: ${DANGER_COLOR}${hoarderCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying for invisible trash. Implement S3 Lifecycle policies.${RESET}`);
} else {
    console.log(`✅ S3 STORAGE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No invisible trash found.${RESET}`);
}
