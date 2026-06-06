#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🏴‍☠️ NEXUS SUBDOMAIN TAKEOVER HUNTER (Vibe Edition)
===================================================${RESET}`);

const dnsExportPath = process.argv[2];
const activeResourcesPath = process.argv[3];

if (!dnsExportPath || !activeResourcesPath) {
    console.log(`${DANGER_COLOR}Error: I need your DNS export and your active AWS resources.${RESET}`);
    console.log('Usage: node index.js <cloudflare-dns.csv> <active-aws-resources.json>');
    process.exit(1);
}

console.log(`\nHunting for hijacked infrastructure...\n`);

// Phase 1: Load Active AWS Resources (The Truth)
const activeResourcesRaw = fs.readFileSync(activeResourcesPath, 'utf8');
const activeResources = JSON.parse(activeResourcesRaw);
const activeS3Buckets = new Set(activeResources.s3_buckets);

let totalRecords = 0;
let hijackVectors = 0;

// Phase 2: Cross-reference DNS Records
fs.createReadStream(dnsExportPath)
    .pipe(csv())
    .on('data', (data) => {
        totalRecords++;
        const type = data['Type'];
        const name = data['Name'];
        const content = data['Content']; // What the DNS record points to

        if (type === 'CNAME' && content.includes('s3.amazonaws.com')) {
            // Extract bucket name from S3 endpoint (e.g., my-bucket.s3.amazonaws.com)
            const bucketName = content.split('.s3')[0];
            
            if (!activeS3Buckets.has(bucketName)) {
                hijackVectors++;
                console.log(`💀 ${DANGER_COLOR}[SUBDOMAIN TAKEOVER VECTOR]${RESET}`);
                console.log(`   Vulnerable Subdomain: ${name}`);
                console.log(`   Points to ORPHANED Bucket: ${bucketName}`);
                console.log(`   Action: A Russian bot can literally register '${bucketName}' right now and host malware on your domain.\n`);
            }
        }
    })
    .on('end', () => {
        console.log(`${VIBE_COLOR}===================================================${RESET}`);
        console.log(`Total DNS Records Audited: ${totalRecords}`);
        
        if (hijackVectors > 0) {
             console.log(`🔥 DEVASTATING FAILURE.`);
             console.log(`   Takeover Vectors Found: ${DANGER_COLOR}${hijackVectors}${RESET}`);
             console.log(`\n${VIBE_COLOR}Vibe check failed. You are actively handing hackers your root domain reputation. Delete those CNAMEs immediately.${RESET}`);
        } else {
             console.log(`✅ AUDIT PASSED.`);
             console.log(`\n${VIBE_COLOR}Vibe check complete. Your DNS perimeter is secure.${RESET}`);
        }
    });
