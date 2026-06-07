#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
👻 NEXUS S3 MULTIPART HOARDER HUNTER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS S3 Multipart Uploads JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-s3-multipart.json>');
    process.exit(1);
}

// S3 Standard Storage Cost
const COST_PER_GB_MONTH = 0.023;

console.log(`\nHunting for 'Invisible Data Trash' hiding in your buckets...\n`);

const s3Raw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(s3Raw);

let invisibleTrashCount = 0;
let totalWastedGB = 0;

const NOW = new Date('2026-06-07T00:00:00Z');

data.Uploads.forEach(upload => {
    const initiatedDate = new Date(upload.Initiated);
    const ageInDays = (NOW - initiatedDate) / (1000 * 60 * 60 * 24);
    
    // If the upload was initiated more than 7 days ago, it is an abandoned, broken upload
    if (ageInDays > 7) {
        invisibleTrashCount++;
        totalWastedGB += upload.StoredBytes / (1024 * 1024 * 1024);
        
        console.log(`💀 ${DANGER_COLOR}[INVISIBLE TRASH]${RESET} Bucket: ${upload.Bucket}`);
        console.log(`   File Key: ${upload.Key}`);
        console.log(`   Initiated: ${upload.Initiated} (${Math.floor(ageInDays)} days ago)`);
        console.log(`   Hidden Size: ${(upload.StoredBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        console.log(`   Action: This is a broken upload taking up space but invisible to the UI. Abort it immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Multipart Uploads Analyzed: ${data.Uploads.length}`);

if (invisibleTrashCount > 0) {
    const totalWastedMonthly = totalWastedGB * COST_PER_GB_MONTH;

    console.log(`🔥 TOTAL INVISIBLE BROKEN FILES: ${DANGER_COLOR}${invisibleTrashCount}${RESET}`);
    console.log(`🔥 TOTAL HIDDEN STORAGE: ${DANGER_COLOR}${totalWastedGB.toFixed(2)} GB${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. You must implement a bucket lifecycle policy to 'AbortIncompleteMultipartUpload'.${RESET}`);
} else {
    console.log(`✅ S3 HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No invisible data trash detected.${RESET}`);
}
