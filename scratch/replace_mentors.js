const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [target, replacement] of replacements) {
    content = content.split(target).join(replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${path.basename(filePath)}`);
  } else {
    console.log(`No changes made to ${path.basename(filePath)}`);
  }
}

const commonReplacements = [
  // 1. Specific UI elements that were missed or partially modified
  ['Mentor: <strong style="color:var(--success);">${escapeHtml(d.leader)}</strong>', 'Leader: <strong style="color:var(--success);">${escapeHtml(d.leader)}</strong>'],
  ['Assign Mentor', 'Assign Leader'],
  ['salvationMentorsTableBody', 'salvationLeadersTableBody'],

  // 2. Titles / Labels / Option fields
  ['Pastor David (Mentorship)', 'Pastor David (Leadership)'],
  ['Mentors Registry', 'Leaders Registry'],
  ['Discipleship Mentors Registry', 'Discipleship Leaders Registry'],
  ['<th>Mentor Name</th>', '<th>Leader Name</th>'],
  ['Mentor Name', 'Leader Name'],
  ['Follow-Up Mentor:', 'Follow-Up Leader:'],
  ['Career & Youth Mentorship (30 min)', 'Career & Youth Leadership (30 min)'],
  ['New Convert Mentorship Allocation', 'New Convert Leadership Allocation'],
  ['Youth Mentorship (Virtual)', 'Youth Leadership (Virtual)'],

  // 3. HTML tab targets & elements
  ['data-salvation-tab="mentors"', 'data-salvation-tab="leaders"'],
  ['id="salvationMentorsTab"', 'id="salvationLeadersTab"'],
  ['id="salvationMentorsTableBody"', 'id="salvationLeadersTableBody"'],
  ['id=\'salvationMentorsTableBody\'', 'id=\'salvationLeadersTableBody\''],

  // 4. Explanatory and descriptive texts
  ['allocate follow-up discipleship mentors', 'allocate follow-up discipleship leaders'],
  ['assign mentors, and track newcomer assimilation', 'assign leaders, and track newcomer assimilation'],
  ['mentoring, and ministry gatherings', 'leadership, and ministry gatherings'],
  ['Youth services, mentorship, creative teams', 'Youth services, leadership, creative teams'],
  ['waiting for mentor assignment', 'waiting for leader assignment'],
  ['Convert allocated to follow-up mentor', 'Convert allocated to follow-up leader'],

  // 5. Navigation & trigger calls
  ['switchSalvationTab(\'mentors\')', 'switchSalvationTab(\'leaders\')'],
  ['switchSalvationTab("mentors")', 'switchSalvationTab("leaders")'],
  ['allocateSalvationMentor', 'allocateSalvationLeader'],
  ['tab === \'mentors\'', 'tab === \'leaders\''],
  ['tab === "mentors"', 'tab === "leaders"'],

  // 6. JavaScript state property names & values
  ['mentors: []', 'leaders: []'],
  ['window.salvationState.mentors', 'window.salvationState.leaders'],
  ['Awaiting Mentor', 'Awaiting Leader'],
  ['convert.mentor', 'convert.leader'],
  ['d.mentor', 'd.leader'],
  ['x.mentor', 'x.leader'],
  ['convert.mentor =', 'convert.leader ='],
  ['convert.mentor)', 'convert.leader)'],
  ['escapeHtml(d.mentor)', 'escapeHtml(d.leader)'],
  ['escapeHtml(convert.mentor)', 'escapeHtml(convert.leader)'],
  ['mentor: \'Bro. Emmanuel\'', 'leader: \'Bro. Emmanuel\''],
  ['mentor: \'None\'', 'leader: \'None\''],
  ['mentor: "None"', 'leader: "None"'],
  ['mentor: "Bro. Emmanuel"', 'leader: "Bro. Emmanuel"'],
];

const rootDir = path.resolve(__dirname, '..');

// Update dashboard.html
replaceInFile(path.join(rootDir, 'dashboard.html'), commonReplacements);

// Update scratch/consoles.html
replaceInFile(path.join(rootDir, 'scratch', 'consoles.html'), commonReplacements);

// Update scratch/controllers.js
replaceInFile(path.join(rootDir, 'scratch', 'controllers.js'), commonReplacements);

// Update src/tests/bookings.test.ts
replaceInFile(path.join(rootDir, 'src', 'tests', 'bookings.test.ts'), commonReplacements);
