#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
☸️ NEXUS EKS CLUSTER SWEEPER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS EKS Clusters JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-eks-clusters.json>');
    process.exit(1);
}

// AWS EKS Control Plane base cost is $0.10/hour, which is ~$73.00/month per cluster
const COST_PER_CONTROL_PLANE_MONTH = 73.00;

console.log(`\nHunting for 'Control Plane Hoarders' burning your AWS Kubernetes capital...\n`);

const eksRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(eksRaw);

let hoarderCount = 0;

data.Clusters.forEach(cluster => {
    // If a cluster has 0 active worker nodes, it is literally just a control plane sitting there doing nothing
    if (cluster.ActiveWorkerNodes === 0) {
        hoarderCount++;
        
        console.log(`💀 ${DANGER_COLOR}[EMPTY CONTROL PLANE]${RESET} Cluster: ${cluster.Name}`);
        console.log(`   Status: ${cluster.Status} | Active Nodes: 0`);
        console.log(`   Action: You are paying $73.00/mo just for the Kubernetes API to exist with no workers. Delete the cluster.\n`);
    } 
    // Flag dev clusters that should just be namespaces
    else if (cluster.Tags && cluster.Tags.Environment === 'personal-dev') {
        hoarderCount++;
        
        console.log(`💀 ${DANGER_COLOR}[CONTROL PLANE HOARDER]${RESET} Cluster: ${cluster.Name}`);
        console.log(`   Status: ${cluster.Status} | Tag: personal-dev`);
        console.log(`   Action: You are paying $73.00/mo for a personal developer cluster. Use Kubernetes Namespaces instead.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total EKS Clusters Analyzed: ${data.Clusters.length}`);

if (hoarderCount > 0) {
    const monthlyWastedCapital = hoarderCount * COST_PER_CONTROL_PLANE_MONTH;
    const annualWastedCapital = monthlyWastedCapital * 12;

    console.log(`🔥 TOTAL WASTEFUL CLUSTERS: ${DANGER_COLOR}${hoarderCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop creating a new EKS cluster for every developer. Use Namespaces.${RESET}`);
} else {
    console.log(`✅ KUBERNETES HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your control planes are lean.${RESET}`);
}
