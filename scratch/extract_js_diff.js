const { execSync } = require('child_process');

try {
    const diffText = execSync('git diff apps/tenant-dashboard/public/index.html', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const lines = diffText.split('\n');
    
    let inJs = false;
    const jsChanges = [];
    
    for (let line of lines) {
        if (line.startsWith('@@')) {
            const match = line.match(/@@ -\d+,\d+ \+(\d+),/);
            if (match) {
                const newStart = parseInt(match[1]);
                if (newStart > 11000) {
                    inJs = true;
                } else {
                    inJs = false;
                }
            }
        }
        if (inJs) {
            if (line.startsWith('+') || line.startsWith('-')) {
                if (!line.startsWith('+++') && !line.startsWith('---')) {
                    jsChanges.push(line);
                }
            }
        }
    }
    
    console.log(`JS changes found: ${jsChanges.length}`);
    jsChanges.slice(600).forEach(l => console.log(l));
} catch (e) {
    console.error("Error executing git diff:", e.message);
}
