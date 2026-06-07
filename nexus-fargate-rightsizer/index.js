#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🐳 NEXUS FARGATE RIGHTSIZER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Fargate Service metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-fargate-metrics.json>');
    process.exit(1);
}

// Fargate costs in us-east-1 (per hour):
// vCPU: $0.04048
// GB Memory: $0.004445
const COST_PER_VCPU_MONTH = 0.04048 * 24 * 30; // ~$29.14
const COST_PER_GB_MONTH = 0.004445 * 24 * 30;  // ~$3.20

// Thresholds for "gluttony"
const MAX_UTILIZATION_THRESHOLD = 15; // If max usage never exceeds 15% over 30 days

console.log(`\nHunting for 'Serverless Gluttons' burning your container compute capital...\n`);

const fargateRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(fargateRaw);

let gluttonCount = 0;
let totalWastedMonthly = 0;

data.Services.forEach(service => {
    const memUsage = service.Metrics.MaxMemoryUtilization30Days;
    const cpuUsage = service.Metrics.MaxCpuUtilization30Days;
    
    // Check if both memory and CPU max utilization are under 15%
    if (memUsage < MAX_UTILIZATION_THRESHOLD && cpuUsage < MAX_UTILIZATION_THRESHOLD) {
        gluttonCount++;
        
        const provisionedCpu = service.Provisioned_vCPU;
        const provisionedMem = service.Provisioned_MemoryGB;
        const taskCount = service.RunningTaskCount;
        
        // Calculate current cost
        const currentCost = taskCount * ((provisionedCpu * COST_PER_VCPU_MONTH) + (provisionedMem * COST_PER_GB_MONTH));
        
        // Recommend minimum viable Fargate size (0.25 vCPU, 0.5 GB) based on utilization
        const optimalCpu = Math.max(0.25, provisionedCpu * (MAX_UTILIZATION_THRESHOLD / 100));
        const optimalMem = Math.max(0.5, provisionedMem * (MAX_UTILIZATION_THRESHOLD / 100));
        
        const optimalCost = taskCount * ((optimalCpu * COST_PER_VCPU_MONTH) + (optimalMem * COST_PER_GB_MONTH));
        const wastedMonthlyCost = currentCost - optimalCost;
        
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[SERVERLESS GLUTTON]${RESET} Service: ${service.ServiceName}`);
        console.log(`   Cluster: ${service.ClusterName} | Tasks: ${taskCount}`);
        console.log(`   Provisioned: ${provisionedCpu} vCPU, ${provisionedMem} GB RAM per task`);
        console.log(`   Peak Usage (30d): CPU ${cpuUsage}%, Mem ${memUsage}%`);
        console.log(`   Action: You are paying for capacity you never use. Downsize to ${optimalCpu} vCPU and ${optimalMem} GB RAM to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Fargate Services Analyzed: ${data.Services.length}`);

if (gluttonCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL SERVERLESS GLUTTONS: ${DANGER_COLOR}${gluttonCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop letting developers provision 8GB of RAM just because they are afraid of OOM errors.${RESET}`);
} else {
    console.log(`✅ CONTAINER HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your Fargate fleet is perfectly sized.${RESET}`);
}
