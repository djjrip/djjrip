#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🤖 NEXUS LLM TOKEN SHREDDER (Vibe Edition)
===================================================${RESET}`);

const exportPath = process.argv[2];

if (!exportPath) {
    console.log(`${DANGER_COLOR}Error: I need your LLM gateway log export (Helicone/Langfuse).${RESET}`);
    console.log('Usage: node index.js <llm-gateway-export.csv>');
    process.exit(1);
}

console.log(`\nHunting for RAG context bloat and token hoarding...\n`);

// OpenAI GPT-4o-mini baseline costs for dramatic effect ($0.15/1M input tokens)
const COST_PER_1M_PROMPT_TOKENS = 0.15; 

let totalWastedTokens = 0;
let bloatedCalls = 0;
let totalCalls = 0;

fs.createReadStream(exportPath)
    .pipe(csv())
    .on('data', (data) => {
        totalCalls++;
        const endpoint = data['Endpoint'];
        const promptTokens = parseInt(data['PromptTokens']);
        const completionTokens = parseInt(data['CompletionTokens']);
        const latencyMs = parseInt(data['LatencyMs']);
        
        // Vibe check: If you feed an LLM > 50,000 tokens just to get a 'yes' or 'no' (< 10 tokens back)
        // You are a bad engineer and you are burning money.
        if (promptTokens > 10000 && completionTokens < 50) {
            bloatedCalls++;
            totalWastedTokens += promptTokens;
            
            console.log(`💀 ${DANGER_COLOR}[CONTEXT WINDOW ABUSE]${RESET} Endpoint: ${endpoint}`);
            console.log(`   Prompt: ${promptTokens.toLocaleString()} tokens | Output: ${completionTokens} tokens`);
            console.log(`   Latency Penalty: ${(latencyMs/1000).toFixed(2)}s`);
            console.log(`   Action: You dumped an entire codebase into the context window for a boolean response. Write a regex or fix your RAG pipeline.\n`);
        }
    })
    .on('end', () => {
        console.log(`${VIBE_COLOR}===================================================${RESET}`);
        console.log(`Total API Calls Analyzed: ${totalCalls}`);
        
        if (bloatedCalls > 0) {
            const wastedCost = (totalWastedTokens / 1000000) * COST_PER_1M_PROMPT_TOKENS;
            // Extrapolate to 10M calls a month for a scaling startup
            const projectedAnnualWaste = (wastedCost * 100000) * 12;

             console.log(`🔥 TOKENS WASTED IN THIS BATCH: ${DANGER_COLOR}${totalWastedTokens.toLocaleString()}${RESET}`);
             console.log(`🔥 EXTRAPOLATED ANNUAL WASTE: ${DANGER_COLOR}$${projectedAnnualWaste.toFixed(2)}${RESET}`);
             console.log(`\n${VIBE_COLOR}Vibe check failed. You are treating the LLM context window like a trash can.${RESET}`);
        } else {
             console.log(`✅ RAG PIPELINE IS TIGHT.`);
             console.log(`\n${VIBE_COLOR}Vibe check complete. Good job parsing your chunks.${RESET}`);
        }
    });
