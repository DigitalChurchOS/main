const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
let ok = true;

for (const file of files) {
  const resolved = path.resolve(process.cwd(), file);
  if (!fs.existsSync(resolved)) {
    console.error(`Missing ${file}`);
    ok = false;
  } else {
    console.log(`Found ${file}`);
  }
}

if (!ok) {
  process.exit(1);
}
