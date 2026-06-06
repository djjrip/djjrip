#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
👻 NEXUS IAM GHOST HUNTER (Vibe Edition)
===================================================${RESET}`);

const iamReportPath = process.argv[2];

if (!iamReportPath) {
    console.log(`${DANGER_COLOR}Error: Feed me an AWS IAM Credential Report CSV.${RESET}`);
    console.log('Usage: node index.js <iam-credential-report.csv>');
    process.exit(1);
}

let ghostsFound = 0;
let mfaViolations = 0;

console.log(`\nScanning IAM Report: ${iamReportPath}...\n`);

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const now = new Date();

fs.createReadStream(iamReportPath)
    .pipe(csv())
    .on('data', (data) => {
        const user = data['user'];
        const mfaActive = data['mfa_active'] === 'true';
        const passwordLastUsed = data['password_last_used'];
        const accessKey1LastUsed = data['access_key_1_last_used_date'];
        const accessKey2LastUsed = data['access_key_2_last_used_date'];

        // Ignore root account for general MFA check (should be checked separately)
        if (user === '<root_account>') return;

        // Check MFA
        if (!mfaActive) {
            mfaViolations++;
            console.log(`❌ ${DANGER_COLOR}[COMPLIANCE BREACH]${RESET} User <${user}> has no MFA. Instant SOC2 failure.`);
        }

        // Check for Ghost Principals (No activity in 90 days)
        let isGhost = false;
        
        const checkStale = (dateStr) => {
            if (!dateStr || dateStr === 'N/A' || dateStr === 'no_information') return false;
            const lastUsed = new Date(dateStr);
            return (now - lastUsed) > NINETY_DAYS_MS;
        };

        if (checkStale(passwordLastUsed) || checkStale(accessKey1LastUsed) || checkStale(accessKey2LastUsed)) {
            isGhost = true;
            ghostsFound++;
            console.log(`👻 ${DANGER_COLOR}[GHOST PRINCIPAL]${RESET} User/Key <${user}> abandoned for >90 days. Ripe for account takeover.`);
        }
    })
    .on('end', () => {
        console.log(`\n${VIBE_COLOR}===================================================${RESET}`);
        if (ghostsFound > 0 || mfaViolations > 0) {
             console.log(`🔥 AUDIT FAILED.`);
             console.log(`   Ghost Principals (Stale >90 days): ${DANGER_COLOR}${ghostsFound}${RESET}`);
             console.log(`   MFA Violations: ${DANGER_COLOR}${mfaViolations}${RESET}`);
             console.log(`\n${VIBE_COLOR}Vibe check complete. Good luck passing your SOC2 audit with this mess.${RESET}`);
        } else {
             console.log(`✅ AUDIT PASSED.`);
             console.log(`\n${VIBE_COLOR}Vibe check complete. Your IAM posture is actually locked down.${RESET}`);
        }
    });
