#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
💸 NEXUS REVENUE LEAK HUNTER (Vibe Edition)
===================================================${RESET}`);

const internalDbPath = process.argv[2];
const paymentProcessorPath = process.argv[3];

if (!internalDbPath || !paymentProcessorPath) {
    console.log(`${DANGER_COLOR}Error: I need two files to reconcile.${RESET}`);
    console.log('Usage: node index.js <internal-db-export.csv> <stripe-export.csv>');
    process.exit(1);
}

const internalTransactions = new Map();
let totalLeakedRevenue = 0;

console.log(`\nReconciling Truth: [DB: ${internalDbPath}] vs [Gateway: ${paymentProcessorPath}]...\n`);

// Phase 1: Load Internal Truth
fs.createReadStream(internalDbPath)
    .pipe(csv())
    .on('data', (data) => {
        const id = data['TransactionID'];
        const amount = parseFloat(data['Amount']);
        const status = data['Status'];
        
        if (status === 'SUCCESS' && amount > 0) {
            internalTransactions.set(id, amount);
        }
    })
    .on('end', () => {
        // Phase 2: Reconcile against Payment Gateway
        fs.createReadStream(paymentProcessorPath)
            .pipe(csv())
            .on('data', (data) => {
                const id = data['TransactionID'];
                const amount = parseFloat(data['Amount']);
                const status = data['Status'];

                if (internalTransactions.has(id)) {
                    if (status === 'PAID') {
                        // All good, remove from map
                        internalTransactions.delete(id);
                    } else if (status === 'FAILED') {
                         console.log(`💀 ${DANGER_COLOR}[REVENUE LEAK]${RESET} DB says paid, Gateway says FAILED! ID: ${id} | Lost: $${amount.toFixed(2)}`);
                         totalLeakedRevenue += amount;
                         internalTransactions.delete(id);
                    }
                }
            })
            .on('end', () => {
                // Anything left in the map is a total ghost transaction
                internalTransactions.forEach((amount, id) => {
                    console.log(`👻 ${DANGER_COLOR}[GHOST TRANSACTION]${RESET} DB says paid, Gateway has NO RECORD! ID: ${id} | Lost: $${amount.toFixed(2)}`);
                    totalLeakedRevenue += amount;
                });

                console.log(`\n${VIBE_COLOR}===================================================${RESET}`);
                if (totalLeakedRevenue > 0) {
                     console.log(`🔥 TOTAL REVENUE LEAKAGE FOUND: ${DANGER_COLOR}$${totalLeakedRevenue.toFixed(2)}${RESET}`);
                     console.log(`\n${VIBE_COLOR}Vibe check complete. Go fire whoever wrote your webhook handlers.${RESET}`);
                } else {
                     console.log(`✅ TOTAL REVENUE LEAKAGE: ${SUCCESS_COLOR}$0.00${RESET}`);
                     console.log(`\n${VIBE_COLOR}Vibe check complete. Your ledger is solid.${RESET}`);
                }
            });
    });
