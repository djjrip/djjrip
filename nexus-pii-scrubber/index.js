#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🛡️ NEXUS AI PII SCRUBBER (Vibe Edition)
===================================================${RESET}`);

const trainingDataPath = process.argv[2];

if (!trainingDataPath) {
    console.log(`${DANGER_COLOR}Error: Feed me a JSONL file of AI training data.${RESET}`);
    console.log('Usage: node index.js <training-data.jsonl>');
    process.exit(1);
}

const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;
const CC_REGEX = /\b(?:\d[ -]*?){13,16}\b/;

let totalLines = 0;
let piiViolations = 0;

console.log(`\nScanning AI Training Payload: ${trainingDataPath}...\n`);

const rl = readline.createInterface({
    input: fs.createReadStream(trainingDataPath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    totalLines++;
    try {
        const payload = JSON.parse(line);
        // Deep search the payload text
        const textToScan = JSON.stringify(payload);
        
        const hasSSN = SSN_REGEX.test(textToScan);
        const hasCC = CC_REGEX.test(textToScan);

        if (hasSSN || hasCC) {
            piiViolations++;
            console.log(`❌ ${DANGER_COLOR}[TOXIC DATA DETECTED]${RESET} Line ${totalLines} contains leaked PII (SSN or Credit Card). Drop this payload immediately.`);
        }
    } catch (e) {
        console.log(`⚠️  [MALFORMED JSON] Line ${totalLines} is broken.`);
    }
});

rl.on('close', () => {
    console.log(`\n${VIBE_COLOR}===================================================${RESET}`);
    console.log(`Total Payloads Scanned: ${totalLines}`);
    
    if (piiViolations > 0) {
         console.log(`🔥 AUDIT FAILED. PII Violations Found: ${DANGER_COLOR}${piiViolations}${RESET}`);
         console.log(`\n${VIBE_COLOR}Vibe check complete. Do NOT push this dataset to your LLM.${RESET}`);
    } else {
         console.log(`✅ AUDIT PASSED.`);
         console.log(`\n${VIBE_COLOR}Vibe check complete. Dataset is sanitized.${RESET}`);
    }
});
