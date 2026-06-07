#!/usr/bin/env node

const fs = require('fs');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🦷 NEXUS ECS TASK HOARDER HUNTER
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your AWS ECS Task Definitions JSON export.${RESET}`);
    console.log('Usage: node index.js <aws-ecs-tasks.json>');
    process.exit(1);
}

console.log(`\nHunting for 'Digital Plaque' clogging your AWS Control Plane...\n`);

const ecsRaw = fs.readFileSync(exportPath, 'utf8');
const data = JSON.parse(ecsRaw);

let plaqueCount = 0;
let totalInactiveRevisions = 0;

Object.keys(data.TaskFamilies).forEach(family => {
    const active = data.TaskFamilies[family].ACTIVE;
    const inactive = data.TaskFamilies[family].INACTIVE;
    
    // If a task family has thousands of dead revisions clogging the control plane
    if (inactive > 500) {
        plaqueCount++;
        totalInactiveRevisions += inactive;
        
        console.log(`💀 ${DANGER_COLOR}[DIGITAL PLAQUE]${RESET} Task Family: ${family}`);
        console.log(`   Active Revisions: ${active}`);
        console.log(`   Inactive/Dead Revisions: ${inactive}`);
        console.log(`   Action: You are hoarding ${inactive} dead deployments. This is bloating your AWS API responses and slowing down Terraform. Execute a bulk delete script immediately.\n`);
    }
});

console.log(`${VIBE_COLOR}===================================================${RESET}`);
console.log(`Total Task Families Analyzed: ${Object.keys(data.TaskFamilies).length}`);

if (plaqueCount > 0) {
    console.log(`🔥 TOTAL CLOGGED TASK FAMILIES: ${DANGER_COLOR}${plaqueCount}${RESET}`);
    console.log(`🔥 TOTAL DEAD REVISIONS (DIGITAL PLAQUE): ${DANGER_COLOR}${totalInactiveRevisions.toLocaleString()}${RESET}`);
    console.log(`\n${VIBE_COLOR}Vibe check failed. You are throttling your own infrastructure deployment speed.${RESET}`);
} else {
    console.log(`✅ CONTROL PLANE HYGIENE IS TIGHT.`);
    console.log(`\n${VIBE_COLOR}Vibe check complete. Your ECS Task Definitions are clean.${RESET}`);
}
