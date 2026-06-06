#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
❄️ NEXUS DATA WAREHOUSE SWEEPER (Vibe Edition)
===================================================${RESET}`);

const costExportPath = process.argv[2];
const queryLogsPath = process.argv[3];
const daysThreshold = parseInt(process.argv[4]);

if (!costExportPath || !queryLogsPath || isNaN(daysThreshold)) {
    console.log(`${DANGER_COLOR}Error: I need your Snowflake/BigQuery costs and your query logs.${RESET}`);
    console.log('Usage: node index.js <table-costs.csv> <query-logs.csv> <staleness-days-threshold>');
    process.exit(1);
}

console.log(`\nHunting for dead tables burning your compute credits...\n`);

const tableLastQueried = new Map();
let totalWastedCapitalMonthly = 0;
let deadTablesCount = 0;

// Phase 1: Load Query Logs (When was the table last read by a human/BI tool?)
fs.createReadStream(queryLogsPath)
    .pipe(csv())
    .on('data', (data) => {
        const tableName = data['TableName'];
        const lastQueriedDate = new Date(data['LastQueried']);
        
        if (!tableLastQueried.has(tableName) || lastQueriedDate > tableLastQueried.get(tableName)) {
            tableLastQueried.set(tableName, lastQueriedDate);
        }
    })
    .on('end', () => {
        const currentDate = new Date('2026-06-06'); // Hardcoded to current date context

        // Phase 2: Cross-reference against monthly refresh/storage costs
        fs.createReadStream(costExportPath)
            .pipe(csv())
            .on('data', (data) => {
                const tableName = data['TableName'];
                const monthlyComputeCost = parseFloat(data['MonthlyComputeCostUSD']);
                
                const lastQueriedDate = tableLastQueried.get(tableName);
                
                if (lastQueriedDate) {
                    const diffTime = Math.abs(currentDate - lastQueriedDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays > daysThreshold && monthlyComputeCost > 0) {
                        deadTablesCount++;
                        totalWastedCapitalMonthly += monthlyComputeCost;
                        console.log(`💀 ${DANGER_COLOR}[DATA HOARDER]${RESET} Table: ${tableName}`);
                        console.log(`   Monthly Cost to Build/Store: $${monthlyComputeCost.toFixed(2)}`);
                        console.log(`   Last Queried: ${diffDays} days ago`);
                        console.log(`   Action: Drop this table or pause the dbt models building it.\n`);
                    }
                }
            })
            .on('end', () => {
                const annualWastedCapital = totalWastedCapitalMonthly * 12;

                console.log(`${VIBE_COLOR}===================================================${RESET}`);
                console.log(`Total Dead Tables Found: ${deadTablesCount}`);
                
                if (deadTablesCount > 0) {
                     console.log(`🔥 ANNUAL WASTED COMPUTE: ${DANGER_COLOR}$${annualWastedCapital.toFixed(2)}${RESET}`);
                     console.log(`\n${VIBE_COLOR}Vibe check failed. You are spending tens of thousands of dollars to build dashboards that literally no one looks at.${RESET}`);
                } else {
                     console.log(`✅ DATA PIPELINES ARE LEAN.`);
                     console.log(`\n${VIBE_COLOR}Vibe check complete. Good job.${RESET}`);
                }
            });
    });
