#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
📦 NEXUS ECR IMAGE HOARDER HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS ECR Repository metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-ecr-repositories.json>');
    process.exit(1);
}

// ECR storage costs $0.10 per GB per month
const COST_PER_GB_MONTH = 0.10;

// Threshold for "hoarding" - 100 images
const SAFE_IMAGE_COUNT_THRESHOLD = 100;

console.log(`\nHunting for 'Digital Landfills' burning your AWS storage capital...\n`);

const ecrRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(ecrRaw);

let hoarderCount = 0;
let totalWastedMonthly = 0;

data.Repositories.forEach(repo => {
    // If the repo doesn't have a Lifecycle Policy and has tons of images, it's a Digital Landfill
    if (!repo.HasLifecyclePolicy && repo.ImageCount > SAFE_IMAGE_COUNT_THRESHOLD) {
        hoarderCount++;
        
        // Assume anything over the threshold is waste
        const wasteImageCount = repo.ImageCount - SAFE_IMAGE_COUNT_THRESHOLD;
        const wasteStorageGB = wasteImageCount * repo.AverageImageSizeGB;
        
        const wastedMonthlyCost = wasteStorageGB * COST_PER_GB_MONTH;
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[DIGITAL LANDFILL]${RESET} Repository: ${repo.RepositoryName}`);
        console.log(`   Total Images: ${repo.ImageCount} | Avg Size: ${repo.AverageImageSizeGB} GB`);
        console.log(`   Action: You are hoarding ${wasteImageCount} outdated Docker images without a Lifecycle Policy. Enable a 30-day expiration policy immediately to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total ECR Repositories Analyzed: ${data.Repositories.length}`);

if (hoarderCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL DIGITAL LANDFILLS: ${DANGER_COLOR}${hoarderCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to store 3-year-old Docker images from failed deployments.${RESET}`);
} else {
    console.log(`✅ CONTAINER REGISTRY HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your Lifecycle Policies are strictly enforced.${RESET}`);
}
