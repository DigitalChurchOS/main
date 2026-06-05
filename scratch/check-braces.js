const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../apps/tenant-dashboard/public/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Find the style block between line 11 and 3028
const lines = html.split('\n');
const cssLines = lines.slice(10, 3028); // 1-indexed lines 11 to 3028
const css = cssLines.join('\n');

let openBraces = 0;
let openBrackets = 0;
let openParens = 0;
const errors = [];

for (let i = 0; i < css.length; i++) {
  const char = css[i];
  if (char === '{') openBraces++;
  else if (char === '}') {
    openBraces--;
    if (openBraces < 0) {
      errors.push(`Extra closing brace '}' at position ${i}`);
      openBraces = 0;
    }
  }
  else if (char === '[') openBrackets++;
  else if (char === ']') {
    openBrackets--;
    if (openBrackets < 0) {
      errors.push(`Extra closing bracket ']' at position ${i}`);
      openBrackets = 0;
    }
  }
  else if (char === '(') openParens++;
  else if (char === ')') {
    openParens--;
    if (openParens < 0) {
      errors.push(`Extra closing paren ')' at position ${i}`);
      openParens = 0;
    }
  }
}

console.log("CSS Brace Check Results:");
console.log(`Unclosed braces '{': ${openBraces}`);
console.log(`Unclosed brackets '[': ${openBrackets}`);
console.log(`Unclosed parens '(': ${openParens}`);
if (errors.length > 0) {
  console.log("Errors found:", errors.slice(0, 10));
} else {
  console.log("No brace matching errors found.");
}
