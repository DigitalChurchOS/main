const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'dashboard.html');
const content = fs.readFileSync(htmlPath, 'utf8');

// Find all script blocks
const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  const scriptContent = match[1];
  count++;
  try {
    new vm.Script(scriptContent, { filename: `script_${count}.js` });
    console.log(`Script block ${count} is syntactically valid.`);
  } catch (err) {
    console.error(`Syntax error in script block ${count}:`, err);
    process.exit(1);
  }
}
console.log('All script blocks checked.');
