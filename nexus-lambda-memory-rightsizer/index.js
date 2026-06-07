#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
⚡ NEXUS LAMBDA MEMORY RIGHTSIZER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Lambda Metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-lambda-metrics.json>');
    process.exit(1);
}

// AWS Lambda base cost per GB-second: ~$0.0000166667
const COST_PER_GB_SECOND = 0.0000166667;

console.log(`\nHunting for 'Serverless Memory Gluttons' burning your AWS compute capital...\n`);

const lambdaRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(lambdaRaw);

let gluttonCount = 0;
let totalWastedMonthly = 0;

data.Functions.forEach(lambda => {
    // If the provisioned memory is > 3x the max used memory, they are setting money on fire
    const memoryUtilizationRatio = lambda.MaxMemoryUsedMB / lambda.ProvisionedMemoryMB;
    
    if (memoryUtilizationRatio < 0.33) {
        gluttonCount++;
        
        // Calculate the wasted gigabyte-seconds per month
        const optimalMemoryMB = lambda.MaxMemoryUsedMB * 1.5; // Give it a 50% buffer
        const wastedMemoryMB = lambda.ProvisionedMemoryMB - optimalMemoryMB;
        const wastedGB = wastedMemoryMB / 1024;
        
        const monthlyInvocations = lambda.MonthlyInvocations;
        const avgDurationSeconds = lambda.AverageDurationMS / 1000;
        
        const wastedMonthlyCost = wastedGB * avgDurationSeconds * monthlyInvocations * COST_PER_GB_SECOND;
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[MEMORY GLUTTON]${RESET} Function: ${lambda.FunctionName}`);
        console.log(`   Provisioned: ${lambda.ProvisionedMemoryMB}MB | Actual Peak Usage: ${lambda.MaxMemoryUsedMB}MB`);
        console.log(`   Action: You are paying for ${(wastedMemoryMB).toFixed(0)}MB of RAM that this function has literally never used. Downsize it to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Lambda Functions Analyzed: ${data.Functions.length}`);

if (gluttonCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL OVER-PROVISIONED LAMBDAS: ${DANGER_COLOR}${gluttonCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop moving the memory slider to maximum. Profile your code.${RESET}`);
} else {
    console.log(`✅ SERVERLESS HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your serverless functions are appropriately starved.${RESET}`);
}
