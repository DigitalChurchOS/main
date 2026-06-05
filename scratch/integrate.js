const fs = require('fs');
const path = require('path');

const htmlPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\dashboard.html';
const consolesPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\consoles.html';
const controllersPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\controllers.js';

let html = fs.readFileSync(htmlPath, 'utf8');
const consolesHtml = fs.readFileSync(consolesPath, 'utf8');
const controllersJs = fs.readFileSync(controllersPath, 'utf8');

console.log('Original dashboard.html length:', html.length);

// 1. Entitlements Inject
const targetEntitlement = "funnels: { paid: true, live: true }";
const replacementEntitlement = `funnels: { paid: true, live: true },
        bible: { paid: true, live: true },
        signage: { paid: true, live: true },
        worship: { paid: true, live: true },
        finance: { paid: true, live: true },
        forms: { paid: true, live: true },
        liveMeetings: { paid: true, live: true },
        multiBranch: { paid: true, live: true },
        outreach: { paid: true, live: true },
        salvation: { paid: true, live: true },
        whiteLabel: { paid: true, live: true },
        community: { paid: true, live: true },
        liveChat: { paid: true, live: true },
        communication: { paid: true, live: true },
        crm: { paid: true, live: true }`;

html = html.replace(targetEntitlement, replacementEntitlement);

// 2. DOM selectors Inject in renderPreview()
const targetSelectors = "const funnelsConsole = document.getElementById('funnelsConsoleContainer');";
const replacementSelectors = `const funnelsConsole = document.getElementById('funnelsConsoleContainer');
      const bibleConsole = document.getElementById('bibleConsoleContainer');
      const signageConsole = document.getElementById('signageConsoleContainer');
      const worshipConsole = document.getElementById('worshipConsoleContainer');
      const financeConsole = document.getElementById('financeConsoleContainer');
      const formsConsole = document.getElementById('formsConsoleContainer');
      const liveMeetingsConsole = document.getElementById('liveMeetingsConsoleContainer');
      const multiBranchConsole = document.getElementById('multiBranchConsoleContainer');
      const outreachConsole = document.getElementById('outreachConsoleContainer');
      const salvationConsole = document.getElementById('salvationConsoleContainer');
      const whiteLabelConsole = document.getElementById('whiteLabelConsoleContainer');
      const communityConsole = document.getElementById('communityConsoleContainer');
      const liveChatConsole = document.getElementById('liveChatConsoleContainer');
      const communicationConsole = document.getElementById('communicationConsoleContainer');
      const crmConsole = document.getElementById('crmConsoleContainer');`;

html = html.replace(targetSelectors, replacementSelectors);

// 3. Hide rules inside hideAllConsoles()
const targetHide = "if (funnelsConsole) funnelsConsole.classList.add('hidden');";
const replacementHide = `if (funnelsConsole) funnelsConsole.classList.add('hidden');
        if (bibleConsole) bibleConsole.classList.add('hidden');
        if (signageConsole) signageConsole.classList.add('hidden');
        if (worshipConsole) worshipConsole.classList.add('hidden');
        if (financeConsole) financeConsole.classList.add('hidden');
        if (formsConsole) formsConsole.classList.add('hidden');
        if (liveMeetingsConsole) liveMeetingsConsole.classList.add('hidden');
        if (multiBranchConsole) multiBranchConsole.classList.add('hidden');
        if (outreachConsole) outreachConsole.classList.add('hidden');
        if (salvationConsole) salvationConsole.classList.add('hidden');
        if (whiteLabelConsole) whiteLabelConsole.classList.add('hidden');
        if (communityConsole) communityConsole.classList.add('hidden');
        if (liveChatConsole) liveChatConsole.classList.add('hidden');
        if (communicationConsole) communicationConsole.classList.add('hidden');
        if (crmConsole) crmConsole.classList.add('hidden');`;

html = html.replace(targetHide, replacementHide);

// 4. Routing Switches
const targetRouting = `      } else if (module.key === 'funnels' && currentView === 'modules') {
        if (funnelsConsole) {
          funnelsConsole.classList.remove('hidden');
          bootstrapFunnels();
        }
      }`;

const replacementRouting = `      } else if (module.key === 'funnels' && currentView === 'modules') {
        if (funnelsConsole) {
          funnelsConsole.classList.remove('hidden');
          bootstrapFunnels();
        }
      } else if (module.key === 'bible' && currentView === 'modules') {
        if (bibleConsole) {
          bibleConsole.classList.remove('hidden');
          bootstrapBible();
        }
      } else if (module.key === 'signage' && currentView === 'modules') {
        if (signageConsole) {
          signageConsole.classList.remove('hidden');
          bootstrapSignage();
        }
      } else if (module.key === 'worship' && currentView === 'modules') {
        if (worshipConsole) {
          worshipConsole.classList.remove('hidden');
          bootstrapWorship();
        }
      } else if (module.key === 'finance' && currentView === 'modules') {
        if (financeConsole) {
          financeConsole.classList.remove('hidden');
          bootstrapFinance();
        }
      } else if (module.key === 'forms' && currentView === 'modules') {
        if (formsConsole) {
          formsConsole.classList.remove('hidden');
          bootstrapForms();
        }
      } else if (module.key === 'liveMeetings' && currentView === 'modules') {
        if (liveMeetingsConsole) {
          liveMeetingsConsole.classList.remove('hidden');
          bootstrapLiveMeetings();
        }
      } else if (module.key === 'multiBranch' && currentView === 'modules') {
        if (multiBranchConsole) {
          multiBranchConsole.classList.remove('hidden');
          bootstrapMultiBranch();
        }
      } else if (module.key === 'outreach' && currentView === 'modules') {
        if (outreachConsole) {
          outreachConsole.classList.remove('hidden');
          bootstrapOutreach();
        }
      } else if (module.key === 'salvation' && currentView === 'modules') {
        if (salvationConsole) {
          salvationConsole.classList.remove('hidden');
          bootstrapSalvation();
        }
      } else if (module.key === 'whiteLabel' && currentView === 'modules') {
        if (whiteLabelConsole) {
          whiteLabelConsole.classList.remove('hidden');
          bootstrapWhiteLabel();
        }
      } else if (module.key === 'community' && currentView === 'modules') {
        if (communityConsole) {
          communityConsole.classList.remove('hidden');
          bootstrapCommunity();
        }
      } else if (module.key === 'liveChat' && currentView === 'modules') {
        if (liveChatConsole) {
          liveChatConsole.classList.remove('hidden');
          bootstrapLiveChat();
        }
      } else if (module.key === 'communication' && currentView === 'modules') {
        if (communicationConsole) {
          communicationConsole.classList.remove('hidden');
          bootstrapCommunication();
        }
      } else if (module.key === 'crm' && currentView === 'modules') {
        if (crmConsole) {
          crmConsole.classList.remove('hidden');
          bootstrapCrm();
        }
      }`;

html = html.replace(targetRouting, replacementRouting);

// 5. HTML Console Containers Injection
const targetHtmlInjection = '<!-- FUNNELS CONSOLE CONTAINER -->\n          <div id="funnelsConsoleContainer" class="hidden">';
const replacementHtmlInjection = consolesHtml + '\n          <!-- FUNNELS CONSOLE CONTAINER -->\n          <div id="funnelsConsoleContainer" class="hidden">';
html = html.replace(targetHtmlInjection, replacementHtmlInjection);

// 6. JavaScript State and Loaders Injection
const targetJsInjection = '    window.bootstrapFunnels = async function() {';
const replacementJsInjection = controllersJs + '\n    window.bootstrapFunnels = async function() {';
html = html.replace(targetJsInjection, replacementJsInjection);

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('Successfully injected 14 modules!');
console.log('New dashboard.html length:', html.length);
