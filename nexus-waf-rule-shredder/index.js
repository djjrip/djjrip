#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🛡️ NEXUS WAF RULE SHREDDER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS WAF WebACL metrics JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-waf-metrics.json>');
    process.exit(1);
}

// AWS WAF Pricing: $5.00 per WebACL/month + $1.00 per Rule/month
const COST_PER_WEBACL_MONTH = 5.00;
const COST_PER_RULE_MONTH = 1.00;

console.log(`\nHunting for 'Phantom Firewalls' burning your security capital...\n`);

const wafRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(wafRaw);

let phantomFirewallsCount = 0;
let totalWastedRules = 0;
let totalWastedMonthly = 0;

data.WebACLs.forEach(acl => {
    const totalRequests = acl.Metrics.AllowedRequests_30d + acl.Metrics.BlockedRequests_30d;
    
    // If a WebACL has processed 0 requests over 30 days
    if (totalRequests === 0) {
        phantomFirewallsCount++;
        totalWastedRules += acl.RuleCount;
        
        const aclCost = COST_PER_WEBACL_MONTH + (acl.RuleCount * COST_PER_RULE_MONTH);
        totalWastedMonthly += aclCost;
        
        console.log(`💀 ${DANGER_COLOR}[PHANTOM FIREWALL]${RESET} WebACL: ${acl.Name}`);
        console.log(`   Attached Rules: ${acl.RuleCount}`);
        console.log(`   Requests Inspected (30d): 0`);
        console.log(`   Action: You are paying $${aclCost.toFixed(2)}/mo for a highly complex firewall attached to a deprecated resource receiving zero traffic. Delete it immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total WebACLs Analyzed: ${data.WebACLs.length}`);

if (phantomFirewallsCount > 0) {
    console.log(`🔥 TOTAL PHANTOM FIREWALLS: ${DANGER_COLOR}${phantomFirewallsCount}${RESET}`);
    console.log(`🔥 TOTAL WASTED RULES: ${DANGER_COLOR}${totalWastedRules}${RESET}`);
    console.log(`🔥 WASTED MONTHLY CAPITAL: ${DANGER_COLOR}$${totalWastedMonthly.toFixed(2)}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. Stop paying for security guards to watch empty parking lots.${RESET}`);
} else {
    console.log(`✅ SECURITY HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your firewalls are actively inspecting traffic.${RESET}`);
}
