const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../apps/tenant-dashboard/public/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
if (!scriptMatch) {
  console.error("Could not find script tag");
  process.exit(1);
}
const js = scriptMatch[1];
const lines = js.split('\n');

console.log("Searching for loops...");

// We want to find loop constructs (for, while, do)
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('while') || line.includes('for (') || line.includes('do {') || line.includes('do\n{')) {
        console.log(`Line ${i + 11439}: ${line.trim()}`);
        // print next 3 lines
        for (let j = 1; j <= 4; j++) {
            if (i + j < lines.length) {
                console.log(`  +${j}: ${lines[i+j]}`);
            }
        }
    }
}
