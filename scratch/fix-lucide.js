const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const filesToFix = [
  path.join(root, 'apps', 'marketplace', 'frontend', 'index.html'),
  path.join(root, 'apps', 'marketplace', 'developer', 'index.html')
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace window.lucide.replace()
    content = content.replace(/window\.lucide\.replace\(\)/g, 'window.lucide.createIcons()');
    
    // Replace lucide.replace()
    content = content.replace(/lucide\.replace\(\)/g, 'lucide.createIcons()');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Successfully updated Lucide calls in: ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
});
