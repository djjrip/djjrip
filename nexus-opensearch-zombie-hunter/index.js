#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🧟 NEXUS OPENSEARCH ZOMBIE HUNTER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS OpenSearch metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-opensearch.json>');
    process.exit(1);
}

// OpenSearch costs vary by instance type. We use a rough monthly estimate for common production types.
const INSTANCE_COSTS_MONTHLY = {
    't3.medium.search': 50,
    'm6g.large.search': 150,
    'r6g.xlarge.search': 350,
    'r6g.4xlarge.search': 1400
};

// Thresholds for "Zombie" status
const MAX_SEARCH_RATE = 5; // Searches per minute
const MAX_INDEXING_RATE = 5; // Writes per minute

console.log(`\nHunting for 'Zombie Clusters' burning your database capital...\n`);

const openSearchRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(openSearchRaw);

let zombieCount = 0;
let totalWastedMonthly = 0;

data.Domains.forEach(domain => {
    const searchRate = domain.Metrics.SearchRate30Days;
    const indexingRate = domain.Metrics.IndexingRate30Days;
    
    // Check if the cluster is basically dead (almost no searches, almost no indexing)
    if (searchRate < MAX_SEARCH_RATE && indexingRate < MAX_INDEXING_RATE) {
        zombieCount++;
        
        const nodeType = domain.InstanceType;
        const nodeCount = domain.InstanceCount;
        const costPerNode = INSTANCE_COSTS_MONTHLY[nodeType] || 200; // default fallback
        
        const wastedMonthlyCost = nodeCount * costPerNode;
        totalWastedMonthly += wastedMonthlyCost;
        
        console.log(`💀 ${DANGER_COLOR}[ZOMBIE CLUSTER]${RESET} Domain: ${domain.DomainName}`);
        console.log(`   Nodes: ${nodeCount}x ${nodeType}`);
        console.log(`   Peak Usage (30d): ${searchRate} searches/min | ${indexingRate} writes/min`);
        console.log(`   Action: This cluster is completely abandoned but still running. Terminate the domain immediately to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total OpenSearch Domains Analyzed: ${data.Domains.length}`);

if (zombieCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL ZOMBIE CLUSTERS: ${DANGER_COLOR}${zombieCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying AWS to run massive ElasticSearch clusters for deprecated applications.${RESET}`);
} else {
    console.log(`✅ SEARCH HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. All OpenSearch clusters are actively queried.${RESET}`);
}
