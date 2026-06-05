const fs = require('fs');

function findConsoleContainers(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const containerRegex = /id="([a-zA-Z0-9_-]+ConsoleContainer)"/g;
    const ids = [];
    let match;
    while ((match = containerRegex.exec(html)) !== null) {
      ids.push(match[1]);
    }
    return ids;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

const currentConsoles = findConsoleContainers('dashboard.html');
const backupConsoles = findConsoleContainers('dashboard.html.bak');

console.log(`dashboard.html has ${currentConsoles.length} console containers:`);
console.log(currentConsoles);

console.log(`\ndashboard.html.bak has ${backupConsoles.length} console containers:`);
console.log(backupConsoles);

const missingInCurrent = backupConsoles.filter(c => !currentConsoles.includes(c));
console.log("\nConsole containers missing in current:", missingInCurrent);
