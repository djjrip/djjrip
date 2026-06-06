#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🏎️ NEXUS EBS IOPS SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS EBS volumes JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-volumes.json>');
    process.exit(1);
}

// AWS io2 Provisioned IOPS approximate cost: $0.065 per IOPS-month
const COST_PER_IOPS_MONTH = 0.065;

console.log(`\nHunting for overprovisioned SSD IOPS burning your AWS credits...\n`);

const volumesRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(volumesRaw);

let io2Volumes = 0;
let totalWastedIops = 0;

data.Volumes.forEach(volume => {
    // gp3 includes 3,000 IOPS for free. io1/io2 charges heavily for every provisioned IOPS.
    if (volume.VolumeType === 'io1' || volume.VolumeType === 'io2') {
        const provisionedIops = volume.Iops;
        
        // If they provisioned less than 3000 IOPS on an io2 volume, they are literally
        // paying a massive premium for performance they could get FOR FREE on gp3.
        // Even if they provisioned 10,000 IOPS, they likely don't need it.
        if (provisionedIops > 0) {
            io2Volumes++;
            totalWastedIops += provisionedIops;
            
            const monthlyWaste = provisionedIops * COST_PER_IOPS_MONTH;
            
            console.log(`💀 ${DANGER_COLOR}[IOPS HOARDER]${RESET} Volume ID: ${volume.VolumeId}`);
            console.log(`   Type: ${volume.VolumeType} | Provisioned IOPS: ${provisionedIops.toLocaleString()}`);
            console.log(`   Action: You are paying $${monthlyWaste.toFixed(2)}/mo just in IOPS fees. Downgrade this to gp3 immediately.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Volumes Analyzed: ${data.Volumes.length}`);

if (io2Volumes > 0) {
    const monthlyWastedCapital = totalWastedIops * COST_PER_IOPS_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL WASTED PROVISIONED IOPS: ${DANGER_COLOR}${totalWastedIops.toLocaleString()}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop provisioning 20,000 IOPS for a dev database that gets 5 queries a day.${RESET}`);
} else {
    console.log(`✅ IOPS PROVISIONING IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Good job using gp3.${RESET}`);
}
