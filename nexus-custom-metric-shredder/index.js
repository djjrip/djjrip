#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
📉 NEXUS CUSTOM METRIC SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS CloudWatch Metrics cardinality export.${RESET}`);
    console.log('Usage: node index.js <cw-metrics-export.json>');
    process.exit(1);
}

// AWS CloudWatch Custom Metrics cost $0.30 per metric per month
const COST_PER_CUSTOM_METRIC = 0.30;

console.log(`\nHunting for 'The Cardinality Trap' burning your monitoring capital...\n`);

const metricsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(metricsRaw);

let trapCount = 0;
let totalWastedMonthly = 0;

data.Namespaces.forEach(ns => {
    // Flag any namespace that has more than 10,000 unique metrics
    if (ns.UniqueMetricCount > 10000) {
        trapCount++;
        
        const wasteCost = ns.UniqueMetricCount * COST_PER_CUSTOM_METRIC;
        totalWastedMonthly += wasteCost;
        
        console.log(`💀 ${DANGER_COLOR}[CARDINALITY TRAP]${RESET} Namespace: ${ns.NamespaceName}`);
        console.log(`   Unique Metrics: ${ns.UniqueMetricCount.toLocaleString()}`);
        console.log(`   Top Dimension Key: ${ns.HighestCardinalityDimension}`);
        console.log(`   Cost Penalty: $${wasteCost.toLocaleString()}/mo`);
        console.log(`   Action: A developer accidentally put a highly unique ID (like a UUID) in a metric name or dimension. You are paying a massive premium for unqueryable trash. Fix the logging code immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Namespaces Analyzed: ${data.Namespaces.length}`);

if (trapCount > 0) {
    console.log(`🔥 TOTAL CARDINALITY TRAPS: ${DANGER_COLOR}${trapCount}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop treating CloudWatch metrics like a database.${RESET}`);
} else {
    console.log(`✅ CLOUDWATCH METRIC HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your monitoring costs are sane.${RESET}`);
}
