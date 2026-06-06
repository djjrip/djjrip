#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧊 NEXUS K8S POD RIGHTSIZER (Vibe Edition)
===================================================${RESET}`);

const metricsPath = process.argv[2];
const costPerGBMonth = parseFloat(process.argv[3]);

if (!metricsPath || isNaN(costPerGBMonth)) {
    console.log(`${DANGER_COLOR}Error: I need your K8s metrics export and the cluster cost per GB of RAM.${RESET}`);
    console.log('Usage: node index.js <k8s-metrics.json> <cost-per-gb-month>');
    process.exit(1);
}

console.log(`\nAnalyzing EKS/GKE Cluster Telemetry...\n`);

const metricsRaw = fs.readFileSync(metricsPath, 'utf8');
const metrics = JSON.parse(metricsRaw);

let totalWastedRAM = 0; // in GB
let bloatedPods = 0;

metrics.pods.forEach(pod => {
    // Convert all metrics to GB for calculation
    const requestedRAM = pod.memory_requested_mb / 1024;
    const peakUsedRAM = pod.memory_peak_used_mb / 1024;
    
    // Calculate bloat
    const bloat = requestedRAM - peakUsedRAM;
    
    // If a pod is requesting > 1GB more than its peak usage, it's bloated
    if (bloat > 1.0) {
        bloatedPods++;
        totalWastedRAM += bloat;
        console.log(`💀 ${DANGER_COLOR}[COMPUTE HOARDER]${RESET} Pod: ${pod.name}`);
        console.log(`   Requested: ${requestedRAM.toFixed(2)} GB | Peak Used: ${peakUsedRAM.toFixed(2)} GB`);
        console.log(`   Action: Downsize request by at least ${bloat.toFixed(2)} GB.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Pods Analyzed: ${metrics.pods.length}`);

if (bloatedPods > 0) {
    const monthlyWastedCapital = totalWastedRAM * costPerGBMonth;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL WASTED RAM: ${DANGER_COLOR}${totalWastedRAM.toFixed(2)} GB${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop over-provisioning 'just to be safe' and fix your manifests.${RESET}`);
} else {
    console.log(`✅ COMPUTE ALLOCATION IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your cluster is efficient.${RESET}`);
}
