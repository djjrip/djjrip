#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🪑 NEXUS SAAS SEAT SWEEPER (Vibe Edition)
===================================================${RESET}`);

const hrExportPath = process.argv[2];
const saasExportPath = process.argv[3];
const seatCost = parseFloat(process.argv[4]);

if (!hrExportPath || !saasExportPath || isNaN(seatCost)) {
    console.log(`${DANGER_COLOR}Error: I need the HR roster, the SaaS billing export, and the cost per seat.${RESET}`);
    console.log('Usage: node index.js <hr-active-employees.csv> <saas-billing-export.csv> <monthly-cost-per-seat>');
    process.exit(1);
}

const activeEmployees = new Set();
let wastedSeats = 0;

console.log(`\nReconciling active payroll against SaaS billing...\n`);

// Phase 1: Load HR Truth (Active Employees)
fs.createReadStream(hrExportPath)
    .pipe(csv())
    .on('data', (data) => {
        const email = data['Email'] || data['email'];
        const status = data['Status'] || data['status'];
        
        if (status === 'ACTIVE' && email) {
            activeEmployees.add(email.toLowerCase());
        }
    })
    .on('end', () => {
        // Phase 2: Cross-reference against SaaS billing export (e.g., Jira, DataDog, GitHub)
        fs.createReadStream(saasExportPath)
            .pipe(csv())
            .on('data', (data) => {
                const saasEmail = (data['Email'] || data['email']).toLowerCase();
                const lastActive = data['LastActive'] || data['last_active'];

                if (!activeEmployees.has(saasEmail)) {
                    wastedSeats++;
                    console.log(`💀 ${DANGER_COLOR}[GHOST SEAT FOUND]${RESET} Ex-employee <${saasEmail}> is still burning a $${seatCost} seat. Last Active: ${lastActive}`);
                }
            })
            .on('end', () => {
                const wastedCapitalMonthly = wastedSeats * seatCost;
                const wastedCapitalAnnual = wastedCapitalMonthly * 12;

                console.log(`\n${VIBE_COLOR}===================================================${RESET}`);
                console.log(`Total Ghost Seats Found: ${wastedSeats}`);
                
                if (wastedSeats > 0) {
                     console.log(`🔥 ANNUAL WASTED CAPITAL: ${DANGER_COLOR}$${wastedCapitalAnnual.toFixed(2)}${RESET}`);
                     console.log(`\n${VIBE_COLOR}Vibe check failed. You are paying thousands of dollars for people who don't even work here anymore.${RESET}`);
                } else {
                     console.log(`✅ SAAS SPEND IS TIGHT.`);
                     console.log(`\n${VIBE_COLOR}Vibe check complete. Good job offboarding.${RESET}`);
                }
            });
    });
