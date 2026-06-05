const fs = require('fs');

function extractModules(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      const code = match[1];
      if (code.includes('modules =') || code.includes('renderSidebarModules')) {
        // Extract the modules array definition
        const arrayStart = code.indexOf('const modules = [');
        if (arrayStart === -1) continue;
        
        // Find matching bracket
        let bracketCount = 1;
        let index = arrayStart + 'const modules = ['.length;
        let arrayContent = '[\n';
        
        while (bracketCount > 0 && index < code.length) {
          const char = code[index];
          if (char === '[') bracketCount++;
          else if (char === ']') bracketCount--;
          arrayContent += char;
          index++;
        }
        
        // Safely parse or evaluate the array
        const modules = eval(arrayContent);
        return modules;
      }
    }
  } catch (err) {
    console.error(`Error reading/parsing ${filePath}:`, err);
  }
  return null;
}

const currentModules = extractModules('dashboard.html');
const backupModules = extractModules('dashboard.html.bak');

if (!currentModules) {
  console.error("Could not extract modules from dashboard.html");
} else {
  console.log(`dashboard.html has ${currentModules.length} modules.`);
}

if (!backupModules) {
  console.error("Could not extract modules from dashboard.html.bak");
} else {
  console.log(`dashboard.html.bak has ${backupModules.length} modules.`);
}

if (currentModules && backupModules) {
  const currentKeys = currentModules.map(m => m.key);
  const backupKeys = backupModules.map(m => m.key);
  
  const missingInCurrent = backupKeys.filter(k => !currentKeys.includes(k));
  const addedInCurrent = currentKeys.filter(k => !backupKeys.includes(k));
  
  console.log("\nMissing in dashboard.html (but present in backup):", missingInCurrent);
  console.log("Added in dashboard.html (but missing in backup):", addedInCurrent);
  
  // Compare categories
  console.log("\nComparing categories:");
  backupModules.forEach(bm => {
    const cm = currentModules.find(m => m.key === bm.key);
    if (cm) {
      if (bm.category !== cm.category) {
        console.log(`Module '${bm.key}': category changed from '${bm.category}' to '${cm.category}'`);
      }
    }
  });
}
