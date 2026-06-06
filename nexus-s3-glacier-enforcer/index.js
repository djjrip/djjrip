#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧊 NEXUS S3 GLACIER ENFORCER (Vibe Edition)
===================================================${RESET}`);

const inventoryPath = process.argv[2];
const daysThreshold = parseInt(process.argv[3]);

if (!inventoryPath || isNaN(daysThreshold)) {
    console.log(`${DANGER_COLOR}Error: I need your S3 inventory export and a staleness threshold.${RESET}`);
    console.log('Usage: node index.js <s3-inventory.csv> <staleness-days>');
    process.exit(1);
}

// AWS Cost Constants (approximate per GB/month)
const COST_STANDARD = 0.023; 
const COST_GLACIER_DEEP = 0.00099;

console.log(`\nHunting for digital hoarding in S3 STANDARD storage...\n`);

let totalWastedCapitalMonthly = 0;
let staleObjectsCount = 0;
let totalStaleBytes = 0;

const currentDate = new Date('2026-06-06'); // Hardcoded to current date context

fs.createReadStream(inventoryPath)
    .pipe(csv())
    .on('data', (data) => {
        const bucket = data['Bucket'];
        const key = data['Key'];
        const sizeBytes = parseInt(data['Size']);
        const lastModifiedDate = new Date(data['LastModifiedDate']);
        const storageClass = data['StorageClass'];
        
        if (storageClass === 'STANDARD') {
            const diffTime = Math.abs(currentDate - lastModifiedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays > daysThreshold) {
                staleObjectsCount++;
                totalStaleBytes += sizeBytes;
                
                const sizeGB = sizeBytes / (1024 * 1024 * 1024);
                const standardCost = sizeGB * COST_STANDARD;
                const glacierCost = sizeGB * COST_GLACIER_DEEP;
                const savings = standardCost - glacierCost;
                
                totalWastedCapitalMonthly += savings;
                
                // Only log extremely large files for brevity
                if (sizeGB > 50) {
                    console.log(`💀 ${DANGER_COLOR}[DIGITAL HOARDER]${RESET} Object: s3://${bucket}/${key}`);
                    console.log(`   Size: ${sizeGB.toFixed(2)} GB | Last Modified: ${diffDays} days ago`);
                    console.log(`   Action: Wasting $${savings.toFixed(2)}/mo. Transition to GLACIER_DEEP_ARCHIVE immediately.\n`);
                }
            }
        }
    })
    .on('end', () => {
        const totalStaleGB = totalStaleBytes / (1024 * 1024 * 1024);
        const annualWastedCapital = totalWastedCapitalMonthly * 12;

        console.log(`${VIBE_COLOR}===================================================${RESET}`);
        console.log(`Total Stale Objects Found: ${staleObjectsCount} (${totalStaleGB.toFixed(2)} GB)`);
        
        if (totalWastedCapitalMonthly > 100) {
             console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
             console.log(`\n${VIBE_COLOR}Vibe check failed. You are paying premium rates to store 5-year-old application logs. Set up a bucket lifecycle policy.${RESET}`);
        } else {
             console.log(`✅ S3 LIFECYCLES ARE TIGHT.`);
             console.log(`\n${VIBE_COLOR}Vibe check complete. Good job.${RESET}`);
        }
    });
