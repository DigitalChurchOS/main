const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'generated') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log("Scanning src/routes and src/services for global Prisma calls...");

let foundCalls = 0;

const pathsToScan = ['src/routes', 'src/services'];
pathsToScan.forEach(scanPath => {
  walkDir(scanPath, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      
      // Let's find any prisma. call
      if (trimmed.includes('prisma.')) {
        // A global prisma call:
        // 1. Starts at column 0 (no leading whitespace in line) or close to it, and not inside function
        // 2. Or is a global await/assignment
        // We'll print anything that has NO indentation (starts with 'prisma' or 'await prisma' or 'const ... prisma')
        // OR let's print lines starting with prisma., await prisma. directly at root levels.
        const isSuspicious = line.startsWith('prisma.') || 
                            line.startsWith('await prisma.') ||
                            (line.startsWith('const ') && line.includes('prisma.') && !line.includes('=>') && !line.includes('function') && !line.includes('class '));
        
        if (isSuspicious) {
          console.log(`Potential Global Prisma Call in ${filePath}:${i+1}:`);
          console.log(`  Line: ${trimmed}`);
          foundCalls++;
        }
      }
    });
  });
});

console.log(`Scan completed. Found ${foundCalls} potential global Prisma calls.`);
