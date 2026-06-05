const fs = require('fs');
const path = require('path');

const logPath = process.argv[2];
if (!logPath || !fs.existsSync(logPath)) {
  console.error('Log file does not exist:', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const userInputs = lines
  .filter(line => line.trim())
  .map((line, idx) => {
    try {
      return { line: JSON.parse(line), idx };
    } catch (e) {
      return null;
    }
  })
  .filter(x => x && x.line.type === 'USER_INPUT');

console.log(`Found ${userInputs.length} user inputs.`);
userInputs.slice(-5).forEach(x => {
  console.log(`[Step ${x.line.step_index}] At ${x.line.created_at || ''}:`);
  console.log(x.line.content);
  console.log('-'.repeat(40));
});
