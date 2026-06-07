#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🌍 NEXUS DYNAMODB GLOBAL TABLE SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS DynamoDB Global Table metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-dynamodb-global.json>');
    process.exit(1);
}

// Replicated Write Capacity Units are more expensive than standard WCUs.
// We use a rough estimate of $1.50 per rWCU per month for massive enterprise scales.
const COST_PER_RWCU_MONTH = 1.50; 

console.log(`\nHunting for 'The Multi-Region Mirage' burning your database capital...\n`);

const dynamoRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(dynamoRaw);

let mirageCount = 0;
let totalWastedMonthly = 0;

data.GlobalTables.forEach(table => {
    table.Replicas.forEach(replica => {
        const reads = replica.Metrics.ConsumedReadCapacityUnits_30d;
        const writes = replica.Metrics.ReplicatedWriteCapacityUnits_30d;
        
        // If a replica is receiving massive replicated writes, but nobody is reading from it
        if (reads < 100 && writes > 50000) {
            mirageCount++;
            
            // Convert to average Provisioned rWCU equivalent for cost math
            const provisioned_rWCU_equivalent = writes / (30 * 24 * 60 * 60); 
            // In reality, DynamoDB bills per million write request units for On-Demand, 
            // or per provisioned capacity. We'll use a simplified FinOps delta calculation.
            
            // To make the math impactful for the script output, let's assume the user is burning
            // $1.50 per provisioned rWCU, and this replica required massive provisioning.
            // A more straightforward metric: if they wrote 500 million times to an empty region...
            const wastedCapital = (writes / 1000000) * 1.50; // $1.50 per million replicated writes

            totalWastedMonthly += wastedCapital;
            
            console.log(`💀 ${DANGER_COLOR}[MULTI-REGION MIRAGE]${RESET} Table: ${table.TableName}`);
            console.log(`   Ghost Region: ${replica.RegionName}`);
            console.log(`   Replicated Writes: ${writes.toLocaleString()}`);
            console.log(`   Actual Reads: ${reads.toLocaleString()}`);
            console.log(`   Action: You have zero customers in ${replica.RegionName}. You are paying AWS to blindly copy data to a ghost town. Delete this replica immediately to save ~$${wastedCapital.toFixed(2)}/mo.\n`);
        }
    });
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Global Tables Analyzed: ${data.GlobalTables.length}`);

if (mirageCount > 0) {
    console.log(`🔥 TOTAL GHOST REPLICAS: ${DANGER_COLOR}${mirageCount}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop pretending you have customers in Tokyo.${RESET}`);
} else {
    console.log(`✅ DATABASE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your Global Tables are actively serving multi-region traffic.${RESET}`);
}
