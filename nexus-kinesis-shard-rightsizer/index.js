#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🐘 NEXUS KINESIS SHARD RIGHTSIZER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS Kinesis metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-kinesis-metrics.json>');
    process.exit(1);
}

// AWS Kinesis Data Streams cost ~$0.015 per Shard Hour
// 1 Shard = 730 hours/month * $0.015 = ~$10.95/month
const COST_PER_SHARD_MONTH = 10.95;

// 1 Shard provides 1,000 records/sec or 1 MB/sec ingress
const MAX_RECORDS_PER_SEC_PER_SHARD = 1000;

console.log(`\nHunting for 'The Black Friday Hangover' in your streaming pipelines...\n`);

const kinesisRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(kinesisRaw);

let bloatedStreamsCount = 0;
let totalWastedShards = 0;

data.Streams.forEach(stream => {
    const provisionedShards = stream.OpenShardCount;
    // Assume metrics represent the peak traffic over the last 30 days
    const peakIncomingRecordsPerSec = stream.Metrics.PeakIncomingRecordsPerSec_30d;
    
    // Calculate how many shards they ACTUALLY need
    // Add a 50% safety buffer for spikes
    const requiredShards = Math.ceil(peakIncomingRecordsPerSec / MAX_RECORDS_PER_SEC_PER_SHARD) * 1.5;
    const safeRequiredShards = Math.max(1, Math.ceil(requiredShards)); // Always need at least 1
    
    const wastedShards = provisionedShards - safeRequiredShards;
    
    // If they have provisioned massively more shards than they need
    if (wastedShards > 50) {
        bloatedStreamsCount++;
        totalWastedShards += wastedShards;
        
        console.log(`💀 ${DANGER_COLOR}[BLACK FRIDAY HANGOVER]${RESET} Stream: ${stream.StreamName}`);
        console.log(`   Provisioned Shards: ${provisionedShards}`);
        console.log(`   Peak Ingress: ${peakIncomingRecordsPerSec.toLocaleString()} records/sec`);
        console.log(`   Actually Required Shards (with 50% buffer): ${safeRequiredShards}`);
        console.log(`   Action: You are paying for ${wastedShards} empty shards. Merge your shards down to ${safeRequiredShards} immediately to stop burning capital.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Kinesis Streams Analyzed: ${data.Streams.length}`);

if (bloatedStreamsCount > 0) {
    const totalWastedMonthly = totalWastedShards * COST_PER_SHARD_MONTH;

    console.log(`🔥 TOTAL OVER-PROVISIONED STREAMS: ${DANGER_COLOR}${bloatedStreamsCount}${RESET}`);
    console.log(`🔥 TOTAL EMPTY SHARDS: ${DANGER_COLOR}${totalWastedShards}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Kinesis does not auto-scale down for you. You have to do it yourself.${RESET}`);
} else {
    console.log(`✅ DATA STREAM HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your streaming pipelines are rightsized.${RESET}`);
}
