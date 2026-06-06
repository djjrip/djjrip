#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🚀 NEXUS AWS BILLING SHREDDER (Vibe Edition)
===================================================${RESET}`);

const results = [];
let totalSpend = 0;
let wastedCapital = 0;

const filePath = process.argv[2];

if (!filePath) {
    console.log(`${DANGER_COLOR}Error: Feed me an AWS Cost Explorer CSV file.${RESET}`);
    console.log('Usage: node index.js <path-to-aws-bill.csv>');
    process.exit(1);
}

console.log(`\nShredding billing telemetry from: ${filePath}...\n`);

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
        const service = data['Service'] || data['product/ProductName'];
        const cost = parseFloat(data['UnblendedCost'] || data['lineItem/UnblendedCost'] || 0);
        const description = data['ItemDescription'] || data['lineItem/LineItemDescription'] || '';

        if (cost > 0) {
            totalSpend += cost;

            // HEURISTIC 1: Idle Elastic IPs
            if (service.includes('EC2') && description.includes('Elastic IP') && description.includes('not attached')) {
                wastedCapital += cost;
                console.log(`💀 ${DANGER_COLOR}[ZOMBIE FOUND]${RESET} Unattached Elastic IP bleeding capital: $${cost.toFixed(2)}`);
            }

            // HEURISTIC 2: NAT Gateway Data Processing Bloat
            if (service.includes('EC2') && description.includes('NAT Gateway') && description.includes('DataProcessing-Bytes')) {
                const potentialSavings = cost * 0.8; // Assume 80% is avoidable with VPC endpoints
                wastedCapital += potentialSavings;
                console.log(`⚠️  ${DANGER_COLOR}[ARCHITECTURE FLAW]${RESET} NAT Gateway processing tax. Inject VPC Endpoints to recover ~$${potentialSavings.toFixed(2)}`);
            }

            // HEURISTIC 3: Uncompressed CloudFront Egress
            if (service.includes('CloudFront') && description.includes('DataTransfer-Out')) {
                 const potentialSavings = cost * 0.4; // Assume 40% bloat from lack of Brotli
                 wastedCapital += potentialSavings;
                 console.log(`⚠️  ${DANGER_COLOR}[PAYLOAD BLOAT]${RESET} Heavy edge egress. Enforcing Brotli compression recovers ~$${potentialSavings.toFixed(2)}`);
            }
            
            // HEURISTIC 4: Ancient EBS Snapshots
            if (service.includes('EC2') && description.includes('EBS:SnapshotUsage')) {
                const potentialSavings = cost * 0.6; // Most snapshots are retained too long
                wastedCapital += potentialSavings;
                console.log(`💀 ${DANGER_COLOR}[DIGITAL HOARDING]${RESET} Bloated EBS Snapshots. Implement 14-day lifecycle policy to recover ~$${potentialSavings.toFixed(2)}`);
            }
        }
    })
    .on('end', () => {
        console.log(`\n${VIBE_COLOR}===================================================${RESET}`);
        console.log(`📊 TOTAL AWS SPEND ANALYZED: $${totalSpend.toFixed(2)}`);
        console.log(`🔥 ESTIMATED WASTED CAPITAL: ${SUCCESS_COLOR}$${wastedCapital.toFixed(2)}${RESET}`);
        console.log(`\n${VIBE_COLOR}Vibe check complete. Go patch your infrastructure.${RESET}`);
    });
