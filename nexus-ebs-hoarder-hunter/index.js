#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
💾 NEXUS EBS HOARDER HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS EBS volume export JSON.${RESET}`);
    console.log('Usage: node index.js <aws-ebs-volumes.json>');
    process.exit(1);
}

// AWS EBS gp3 approximate cost per GB/month
const COST_PER_GB_MONTH = 0.08;

console.log(`\nHunting for unattached SSDs burning your AWS credits...\n`);

const volumesRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(volumesRaw);

let unattachedVolumes = 0;
let totalWastedGB = 0;

data.Volumes.forEach(volume => {
    // If state is 'available', it means it is NOT attached to any EC2 instance
    if (volume.State === 'available') {
        unattachedVolumes++;
        totalWastedGB += volume.Size;
        
        const monthlyWaste = volume.Size * COST_PER_GB_MONTH;
        
        console.log(`💀 ${DANGER_COLOR}[ORPHANED VOLUME]${RESET} ID: ${volume.VolumeId}`);
        console.log(`   Size: ${volume.Size} GB (${volume.VolumeType}) | Created: ${volume.CreateTime}`);
        console.log(`   Action: This SSD is plugged into nothing. Delete it to save $${monthlyWaste.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Volumes Analyzed: ${data.Volumes.length}`);

if (unattachedVolumes > 0) {
    const monthlyWastedCapital = totalWastedGB * COST_PER_GB_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL UNATTACHED STORAGE: ${DANGER_COLOR}${totalWastedGB} GB${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop leaving 500GB SSDs on the floor when you delete your EC2 instances.${RESET}`);
} else {
    console.log(`✅ EBS ALLOCATION IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. No orphaned volumes found.${RESET}`);
}
