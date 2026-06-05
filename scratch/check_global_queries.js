const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
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

console.log("Scanning source files for global Prisma calls...");

let foundCalls = 0;

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for occurrences of "prisma."
  let index = 0;
  while ((index = content.indexOf('prisma.', index)) !== -1) {
    const startOfLine = content.lastIndexOf('\n', index);
    const endOfLine = content.indexOf('\n', index);
    const line = content.substring(startOfLine + 1, endOfLine).trim();
    
    // Check if the call is outside a function block
    // We do a simple heuristic: if it's not indented or if it's at the top level
    // (e.g., starts at line position 0 or inside a global setup block)
    // Or we can check if the line contains "await" but is not inside "async function" or "async ("
    const isGlobal = !line.includes('function') && !line.includes('=>') && (
      line.startsWith('prisma.') || 
      line.startsWith('await prisma.') || 
      line.startsWith('const ') && line.includes('prisma.') ||
      line.startsWith('let ') && line.includes('prisma.')
    );
    
    if (isGlobal && !line.startsWith('//') && !line.startsWith('*')) {
      console.log(`Potential Global Prisma Call in ${filePath}:`);
      console.log(`  Line: ${line}`);
      foundCalls++;
    }
    
    index += 7; // Length of "prisma."
  }
});

console.log(`Scan completed. Found ${foundCalls} potential global Prisma calls.`);
