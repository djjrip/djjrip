#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🗄️ NEXUS DYNAMODB CAPACITY RIGHTSIZER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS DynamoDB Tables JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-dynamodb-tables.json>');
    process.exit(1);
}

// Monthly cost for 1 Provisioned RCU is ~$0.09, 1 WCU is ~$0.47
const COST_PER_RCU_MONTH = 0.09;
const COST_PER_WCU_MONTH = 0.47;

console.log(`\nHunting for 'Capacity Hoarders' burning your AWS database capital...\n`);

const dynamoRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(dynamoRaw);

let hoarderCount = 0;
let totalWastedMonthly = 0;

data.Tables.forEach(table => {
    // Only analyze Provisioned tables
    if (table.BillingMode === 'PROVISIONED') {
        const provisionedRCU = table.ProvisionedReadCapacityUnits;
        const provisionedWCU = table.ProvisionedWriteCapacityUnits;
        const maxConsumedRCU = table.MaxConsumedReadCapacityUnits;
        const maxConsumedWCU = table.MaxConsumedWriteCapacityUnits;
        
        // If they are consuming less than 10% of what they provisioned, they are setting money on fire
        const rcuUtilization = maxConsumedRCU / provisionedRCU;
        const wcuUtilization = maxConsumedWCU / provisionedWCU;
        
        if (rcuUtilization < 0.10 && wcuUtilization < 0.10) {
            hoarderCount++;
            
            const wastedRCU = provisionedRCU - maxConsumedRCU;
            const wastedWCU = provisionedWCU - maxConsumedWCU;
            
            const wastedMonthlyCost = (wastedRCU * COST_PER_RCU_MONTH) + (wastedWCU * COST_PER_WCU_MONTH);
            totalWastedMonthly += wastedMonthlyCost;
            
            console.log(`💀 ${DANGER_COLOR}[CAPACITY HOARDER]${RESET} Table: ${table.TableName}`);
            console.log(`   Provisioned: ${provisionedWCU} WCU / ${provisionedRCU} RCU | Actual Peak: ${maxConsumedWCU} WCU / ${maxConsumedRCU} RCU`);
            console.log(`   Action: You are paying for capacity you never use. Switch to On-Demand billing or Auto-Scaling to save $${wastedMonthlyCost.toFixed(2)}/mo.\n`);
        }
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total DynamoDB Tables Analyzed: ${data.Tables.length}`);

if (hoarderCount > 0) {
    const annualWastedCapital = totalWastedMonthly * 12;

    console.log(`🔥 TOTAL OVER-PROVISIONED TABLES: ${DANGER_COLOR}${hoarderCount}${RESET}`);
    console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop guessing your database capacity. Use On-Demand.${RESET}`);
} else {
    console.log(`✅ DATABASE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your tables are appropriately scaled.${RESET}`);
}
