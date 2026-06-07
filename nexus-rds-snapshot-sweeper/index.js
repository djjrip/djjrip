#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
📸 NEXUS RDS SNAPSHOT SWEEPER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];
const daysThreshold = parseInt(process.argv[3]);

if (!exportPath || isNaN(daysThreshold)) {
    console.log(`${DANGER_COLOR}Error: I need your AWS RDS Snapshots JSON export and a staleness threshold in days.${RESET}`);
    console.log('Usage: node index.js <aws-rds-snapshots.json> <staleness-days>');
    process.exit(1);
}

// AWS RDS Snapshot approximate storage cost: $0.095 per GB-month
const COST_PER_GB_MONTH = 0.095;

console.log(`\nHunting for 'Final Snapshots' burning your AWS credits...\n`);

const snapshotsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(snapshotsRaw);

const currentDate = new Date('2026-06-07'); // Hardcoded to current context

let staleSnapshots = 0;
let totalWastedGB = 0;

data.DBSnapshots.forEach(snapshot => {
    // We are looking for manual snapshots (which includes final snapshots)
    if (snapshot.SnapshotType === 'manual') {
        const createDate = new Date(snapshot.SnapshotCreateTime);
        const diffTime = Math.abs(currentDate - createDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > daysThreshold) {
            staleSnapshots++;
            totalWastedGB += snapshot.AllocatedStorage;
            
            const monthlyWaste = snapshot.AllocatedStorage * COST_PER_GB_MONTH;
            
            console.log(`💀 ${DANGER_COLOR}[SNAPSHOT HOARDER]${RESET} Snapshot ID: ${snapshot.DBSnapshotIdentifier}`);
            console.log(`   Size: ${snapshot.AllocatedStorage} GB | Created: ${diffDays} days ago`);
            console.log(`   Action: You are paying $${monthlyWaste.toFixed(2)}/mo to store a dead database backup. Delete it immediately.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Snapshots Analyzed: ${data.DBSnapshots.length}`);

if (staleSnapshots > 0) {
    const monthlyWastedCapital = totalWastedGB * COST_PER_GB_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL WASTED STORAGE: ${DANGER_COLOR}${totalWastedGB.toLocaleString()} GB${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop hoarding 'final snapshots' of staging databases from 4 years ago.${RESET}`);
} else {
    console.log(`✅ RDS SNAPSHOT HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Good job.${RESET}`);
}
