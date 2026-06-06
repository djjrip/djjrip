#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const VIBE_COLOR = '\x1b[36m';
const DANGER_COLOR = '\x1b[31m';
const SUCCESS_COLOR = '\x1b[32m';
const RESET = '\x1b[0m';

console.log(`${VIBE_COLOR}
===================================================
🎯 NEXUS PG SLOW QUERY SNIPER (Vibe Edition)
===================================================${RESET}`);

const logPath = process.argv[2];

if (!logPath) {
    console.log(`${DANGER_COLOR}Error: Feed me a PostgreSQL slow query log file.${RESET}`);
    console.log('Usage: node index.js <pg-slow-query.log>');
    process.exit(1);
}

const queryStats = new Map();
let totalLines = 0;
let totalTimeWastedMs = 0;

console.log(`\nAnalyzing RDS Telemetry: ${logPath}...\n`);

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
});

// Matches PostgreSQL log format: e.g. "duration: 1250.50 ms  statement: SELECT * FROM users WHERE email = 'foo@bar.com';"
const LOG_REGEX = /duration:\s+([0-9.]+)\s+ms\s+statement:\s+(.*)/i;

rl.on('line', (line) => {
    totalLines++;
    const match = line.match(LOG_REGEX);
    if (match) {
        const durationMs = parseFloat(match[1]);
        let rawQuery = match[2];

        // Normalize the query (strip out specific values to group patterns)
        // e.g. WHERE id = 5 -> WHERE id = $1
        let normalizedQuery = rawQuery.replace(/= \d+/g, '= $X')
                                      .replace(/= '[^']*'/g, '= $X')
                                      .replace(/IN \([^)]+\)/g, 'IN ($X)');

        if (!queryStats.has(normalizedQuery)) {
            queryStats.set(normalizedQuery, { count: 0, totalTime: 0, maxTime: 0 });
        }

        const stats = queryStats.get(normalizedQuery);
        stats.count += 1;
        stats.totalTime += durationMs;
        if (durationMs > stats.maxTime) stats.maxTime = durationMs;
        
        totalTimeWastedMs += durationMs;
    }
});

rl.on('close', () => {
    // Sort by most expensive queries (total time wasted)
    const sortedQueries = [...queryStats.entries()].sort((a, b) => b[1].totalTime - a[1].totalTime);

    console.log(`💀 ${DANGER_COLOR}TOP N+1 ARCHITECTURE FLAWS (Missing Indexes):${RESET}\n`);

    let i = 1;
    for (const [query, stats] of sortedQueries) {
        if (i > 5) break; // Top 5
        console.log(`${VIBE_COLOR}[#${i}] Wasted CPU Time: ${(stats.totalTime / 1000).toFixed(2)}s | Count: ${stats.count}x | Max: ${(stats.maxTime / 1000).toFixed(2)}s${RESET}`);
        console.log(`Query: ${query}\n`);
        i++;
    }

    console.log(`${VIBE_COLOR}===================================================${RESET}`);
    console.log(`Total Slow Queries Analyzed: ${totalLines}`);
    console.log(`🔥 TOTAL COMPUTE TIME WASTED: ${DANGER_COLOR}${(totalTimeWastedMs / 1000).toFixed(2)} seconds${RESET}`);
    
    if (totalTimeWastedMs > 5000) {
         console.log(`\n${VIBE_COLOR}Vibe check failed. Stop scaling your RDS instance and write a damn B-Tree index.${RESET}`);
    } else {
         console.log(`\n${VIBE_COLOR}Vibe check passed. Database is purring.${RESET}`);
    }
});
