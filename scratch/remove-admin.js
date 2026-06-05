const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'apps', 'marketplace', 'frontend', 'index.html');

if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// 1. Remove Super Admin Review button in sidebar
const buttonBefore = content.length;
content = content.replace(/<button class="nav-btn" data-view="admin">[\s\S]*?<\/button>\s*/, '');
console.log(`Removed sidebar button: ${buttonBefore - content.length} chars`);

// 2. Remove Review Queue button in hero actions
const heroBefore = content.length;
content = content.replace(/<button class="btn ghost" onclick="switchView\('admin'\)">[\s\S]*?<\/button>\s*/, '');
console.log(`Removed hero action button: ${heroBefore - content.length} chars`);

// 3. Remove Super Admin section block
const sectionBefore = content.length;
content = content.replace(/<!-- Super Admin Governance View -->\s*<section id="adminView"[\s\S]*?<\/section>\s*/, '');
console.log(`Removed admin view section: ${sectionBefore - content.length} chars`);

// 4. Remove admin stats in JS
const statsBefore = content.length;
content = content.replace(/admin: \[\s*\["Pending Reviews",[\s\S]*?\],[\s\n]*?/, '');
console.log(`Removed admin stats list: ${statsBefore - content.length} chars`);

// 5. Remove switchView("admin") block
const switchBefore = content.length;
content = content.replace(/\s*else if \(view === "admin"\) \{[\s\S]*?loadAdminData\(\);\s*\}/, '');
console.log(`Removed switchView admin check: ${switchBefore - content.length} chars`);

// 6. Remove loadAdminData function
const loadAdminBefore = content.length;
content = content.replace(/async function loadAdminData\(\) \{[\s\S]*?lucide\.createIcons\(\);\s*\}/, '');
console.log(`Removed loadAdminData function: ${loadAdminBefore - content.length} chars`);

// 7. Remove openReviewModal function
const openReviewBefore = content.length;
content = content.replace(/function openReviewModal\(submissionId, assetName\) \{[\s\S]*?lucide\.createIcons\(\);\s*\}/, '');
console.log(`Removed openReviewModal function: ${openReviewBefore - content.length} chars`);

// 8. Remove submitReview function
const submitReviewBefore = content.length;
content = content.replace(/async function submitReview\(submissionId\) \{[\s\S]*?\}\s*/, '');
console.log(`Removed submitReview function: ${submitReviewBefore - content.length} chars`);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully wrote changes back to file.');
