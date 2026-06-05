const fs = require('fs');
const path = require('path');

const htmlPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\dashboard.html';
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Original dashboard.html length:', html.length);

// 1. Move ai-media module to Outreach category
const targetAiMediaModule = `{ key: 'ai-media', name: 'AI Media Studio', icon: 'sparkles', category: 'Media', desc: 'Repurpose sermons into AI clips, text transcript summaries, and dispatch AI assistant drafts.', settings: [] }`;
const replacementAiMediaModule = `{ key: 'ai-media', name: 'AI Media Studio', icon: 'sparkles', category: 'Outreach', desc: 'Repurpose sermons into AI clips, text transcript summaries, and dispatch AI assistant drafts.', settings: [] }`;

if (html.includes(targetAiMediaModule)) {
  html = html.replace(targetAiMediaModule, replacementAiMediaModule);
  console.log('AI Media Studio module successfully moved to Outreach category.');
} else {
  // alternative replace with standard single quotes
  const altAiMediaModule = `{ key: 'ai-media', name: 'AI Media Studio', icon: 'sparkles', category: 'Media', desc: 'Repurpose sermons into AI clips, text transcript summaries, and dispatch AI assistant drafts.', settings: [] }`;
  html = html.replace(altAiMediaModule, replacementAiMediaModule);
  console.log('AI Media Studio module successfully moved (fallback).');
}

// 2. Remove Outreach custom navigation buttons
const targetOutreachNav = `                  <button class="cms-nav-item" data-outreach-tab="leads" onclick="switchOutreachTab('leads')">
                    <i data-lucide="users"></i><span>Outreach Leads</span>
                  </button>
                  <button class="cms-nav-item" data-outreach-tab="aiContent" onclick="switchOutreachTab('aiContent')">
                    <i data-lucide="sparkles"></i><span>AI Content Creator</span>
                  </button>
                  <button class="cms-nav-item" data-outreach-tab="promotions" onclick="switchOutreachTab('promotions')">
                    <i data-lucide="share-2"></i><span>Social Promotions</span>
                  </button>
                </div>`;

const replacementOutreachNav = `                  <button class="cms-nav-item" data-outreach-tab="leads" onclick="switchOutreachTab('leads')">
                    <i data-lucide="users"></i><span>Outreach Leads</span>
                  </button>
                </div>`;

if (html.includes(targetOutreachNav)) {
  html = html.replace(targetOutreachNav, replacementOutreachNav);
  console.log('Custom Outreach navigation buttons successfully reverted.');
}

// 3. Remove outreachAiContentTab and outreachPromotionsTab HTML panels
const aiTabStart = '                <!-- AI Content Creator Tab -->';
const promotionsTabEnd = '              </div>\n            </div>\n          </div>\n\n          <!-- SALVATION CONSOLE CONTAINER -->';

const startIndex = html.indexOf(aiTabStart);
const endIndex = html.indexOf(promotionsTabEnd);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  html = html.slice(0, startIndex) + '              </div>\n            </div>\n          </div>\n\n          <!-- SALVATION CONSOLE CONTAINER -->' + html.slice(endIndex + promotionsTabEnd.length);
  console.log('Outreach custom HTML panels successfully deleted.');
}

// 4. Revert outreachState to only campaigns and leads
const targetOutreachState = `    window.outreachState = {
      activeTab: 'campaigns',
      campaigns: [],
      leads: [],
      promotions: []
    };`;

const replacementOutreachState = `    window.outreachState = {
      activeTab: 'campaigns',
      campaigns: [],
      leads: []
    };`;

if (html.includes(targetOutreachState)) {
  html = html.replace(targetOutreachState, replacementOutreachState);
  console.log('outreachState reverted.');
}

// 5. Revert bootstrapOutreach
const targetBootstrapOutreach = `    window.bootstrapOutreach = async function() {
      showToast('Syncing dynamic invitation metrics...');
      if (window.outreachState.campaigns.length === 0) {
        window.outreachState.campaigns = [
          { id: 'cmp-1', name: 'Easter Hope Celebration', goal: 500, invitees: 240, link: 'churchos.io/invite/easter' },
          { id: 'cmp-2', name: 'Youth Impact Webinar', goal: 200, invitees: 85, link: 'churchos.io/invite/youth' }
        ];
      }
      if (window.outreachState.leads.length === 0) {
        window.outreachState.leads = [
          { name: 'Peter Obi', email: 'peter@obi.com', inviter: 'Admin (You)', campaign: 'Easter Hope Celebration', date: '2026-05-31' },
          { name: 'Sister Faith Convert', email: 'faith@seeker.com', inviter: 'Sister Faith', campaign: 'Easter Hope Celebration', date: '2026-05-30' }
        ];
      }
      if (window.outreachState.promotions.length === 0) {
        window.outreachState.promotions = [
          { id: 'prm-1', title: 'Easter Concert Promotion', audience: 'Local Area (5-mile radius)', budget: 35, impressions: 14200, clicks: 842, status: 'Active' },
          { id: 'prm-2', title: 'Youth Impact Seminar Promo', audience: 'College Students & Young Adults', budget: 15, impressions: 5800, clicks: 231, status: 'Active' }
        ];
      }
      runOutreachFlyerRender();
      window.switchOutreachTab(window.outreachState.activeTab);
    };`;

const replacementBootstrapOutreach = `    window.bootstrapOutreach = async function() {
      showToast('Syncing dynamic invitation metrics...');
      if (window.outreachState.campaigns.length === 0) {
        window.outreachState.campaigns = [
          { id: 'cmp-1', name: 'Easter Hope Celebration', goal: 500, invitees: 240, link: 'churchos.io/invite/easter' },
          { id: 'cmp-2', name: 'Youth Impact Webinar', goal: 200, invitees: 85, link: 'churchos.io/invite/youth' }
        ];
      }
      if (window.outreachState.leads.length === 0) {
        window.outreachState.leads = [
          { name: 'Peter Obi', email: 'peter@obi.com', inviter: 'Admin (You)', campaign: 'Easter Hope Celebration', date: '2026-05-31' },
          { name: 'Sister Faith Convert', email: 'faith@seeker.com', inviter: 'Sister Faith', campaign: 'Easter Hope Celebration', date: '2026-05-30' }
        ];
      }
      runOutreachFlyerRender();
      window.switchOutreachTab(window.outreachState.activeTab);
    };`;

if (html.includes(targetBootstrapOutreach)) {
  html = html.replace(targetBootstrapOutreach, replacementBootstrapOutreach);
  console.log('bootstrapOutreach successfully reverted.');
}

// 6. Delete JS Controllers for AI drafts and Social ad campaigns inside Outreach logic block
const targetOutreachJsControllers = `    window.generateOutreachAiContent = function() {
      const topic = document.getElementById('outreachAiTopic').value.trim();
      const tone = document.getElementById('outreachAiTone').value;
      const channel = document.getElementById('outreachAiChannel').value;

      if (!topic) {
        showToast('Please specify an event topic or theme.');
        return;
      }

      const outputBox = document.getElementById('outreachAiOutput');
      const progressDiv = document.getElementById('outreachAiTokenProgress');
      const progressCount = document.getElementById('outreachAiTokenCount');
      const progressBar = document.getElementById('outreachAiTokenBar');

      outputBox.textContent = '';
      progressDiv.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressCount.textContent = '0 words generated';

      const copyTemplates = {
        "Instagram Post Caption": {
          "Inspiring & Spiritual": "🙌 CRITICAL BREAKTHROUGH: Join us for \\\\\\"" + topic + "\\\\\\"! 🌟\\\\\\\\n\\\\\\\\nExpect a profound shift as we gather in worship and divine alignment. God is doing a new thing, and your name is written in His plans for this season. Bring your family, your friends, and an expectant heart.\\\\\\\\n\\\\\\\\n📍 Main Auditorium & Online\\\\\\\\n⏰ Sunday at 9AM & 11:30AM\\\\\\\\n🔗 Tap the link in our bio to RSVP! #Faith #Worship #Outreach #NextChurch",
          "Warm & Welcoming": "🏡 You belong here! We are so thrilled to welcome you to our upcoming event: \\\\\\"" + topic + "\\\\\\"! ❤️\\\\\\\\n\\\\\\\\nNo matter where you are on your spiritual journey, there is a seat reserved just for you at our table. Come experience authentic community, fresh coffee, and life-giving worship.\\\\\\\\n\\\\\\\\n📍 123 Church Way | Online Stream\\\\\\\\n📅 Save the date and RSVP at the link in our bio! #WelcomeHome #Community #ChurchFamily",
          "Energetic & Contemporary": "⚡️ NEXT-LEVEL ENGAGEMENT: Get ready for \\\\\\"" + topic + "\\\\\\"! 🚀\\\\\\\\n\\\\\\\\nWe are breaking boundaries, bringing high-energy worship, and diving deep into life-changing truth. This isn't just another Sunday—it's a movement.\\\\\\\\n\\\\\\\\n🔥 Creative team opener\\\\\\\\n🎤 Guest speaker panel\\\\\\\\n🍔 Outdoor food trucks post-service\\\\\\\\n\\\\\\\\n👉 Tag 3 friends who need to be there! Link in bio to register. #NextGen #Youth #VibrantWorship",
          "Traditional & Formal": "⛪️ The Leadership Council cordially invites you to the special congregation event: \\\\\\"" + topic + "\\\\\\".\\\\\\\\n\\\\\\\\nJoin us as we reflect on our heritage, lift our voices in sacred choral liturgy, and receive a timely word from our senior leadership.\\\\\\\\n\\\\\\\\n📅 Sunday worship service begins promptly at 10:00 AM.\\\\\\\\n📁 Register formal attendance via the link in our biography."
        },
        "WhatsApp Group Broadcast": {
          "Inspiring & Spiritual": "*🌟 POWERFUL OUTREACH INVITATION: " + topic + " 🌟*\\\\\\\\n\\\\\\\\nBrethren, God is preparing a table before us this Sunday! We invite you to join us for our corporate fellowship: *" + topic + "*.\\\\\\\\n\\\\\\\\nLet us press into His presence together. Who are you inviting? Share this link and let's reach souls:\\\\\\\\n👉 _churchos.io/invite/admin_\\\\\\\\n\\\\\\\\n_\\\\\\"For where two or three are gathered together in my name, there am I in the midst of them.\\\\\\_ See you there!",
          "Warm & Welcoming": "*❤️ Welcome Home! Join us for " + topic + " ❤️*\\\\\\\\n\\\\\\\\nHello family! We have a special service lined up this week. We are hosting *" + topic + "* and we want you to be a part of it.\\\\\\\\n\\\\\\\\n☕️ Fresh refreshments at 8:30 AM\\\\\\\\n👶 Secure kids check-in active\\\\\\\\n\\\\\\\\nUse your referral link to invite your neighbors:\\\\\\\\n👉 _churchos.io/invite/admin_",
          "Energetic & Contemporary": "*🔥 BIG SUNDAY ALERT: " + topic + " 🔥*\\\\\\\\n\\\\\\\\nHey squad! Don't miss out on this week's special service: *" + topic + "*!\\\\\\\\n\\\\\\\\nWe've got an incredible visual production, guest artist tracks, and a raw panel talk you don't want to miss.\\\\\\\\n\\\\\\\\nShare the hype link now:\\\\\\\\n👉 _churchos.io/invite/admin_\\\\\\\\n#NextChurch",
          "Traditional & Formal": "*⛪️ Special Invitation: " + topic + " ⛪️*\\\\\\\\n\\\\\\\\nDear members,\\\\\\\\n\\\\\\\\nYou are formally invited to attend this week's corporate service focused on *" + topic + "*.\\\\\\\\n\\\\\\\\nWe anticipate a sacred time of communion, scripture study, and community fellowship.\\\\\\\\n\\\\\\\\nDetails & RSVP:\\\\\\\\n👉 _churchos.io/invite/admin_"
        },
        "SMS Quick Invite": {
          "Inspiring & Spiritual": "Hey! God has a word for you at \\\\\\"" + topic + "\\\\\\" this Sunday 9AM. Come expect a breakthrough! RSVP here: churchos.io/invite/admin",
          "Warm & Welcoming": "Hi! We'd love for you to join us this Sunday at Next Church for \\\\\\"" + topic + "\\\\\\" at 9AM. Safe kids area & great coffee! RSVP: churchos.io/invite/admin",
          "Energetic & Contemporary": "Sunday is going to be HUGE! Join the creative team at \\\\\\"" + topic + "\\\\\\" this Sun 9AM. Music, community, food trucks. Sign up: churchos.io/invite/admin",
          "Traditional & Formal": "You are cordially invited to Next Church this Sunday, 10AM, for our liturgical service: \\\\\\"" + topic + "\\\\\\". RSVP: churchos.io/invite/admin"
        },
        "Email Campaign Newsletter": {
          "Inspiring & Spiritual": "Subject: A Divine Appointment Awaits: " + topic + " 🙌\\\\\\\\n\\\\\\\\nDear Partner,\\\\\\\\n\\\\\\\\nWe believe that God orchestrates special moments in time to pour out His Spirit. This Sunday, we are gathering for a targeted focus on: \\\\\\"" + topic + "\\\\\\".\\\\\\\\n\\\\\\\\nCome prepared to experience:\\\\\\\\n- Deep intercessory prayer and worship overlays\\\\\\\\n- Scriptural illumination from senior ministers\\\\\\\\n- Soul-stirring community connection\\\\\\\\n\\\\\\\\n\\\\\\"Sing unto the Lord a new song, and his praise from the end of the earth...\\\\\\"\\\\\\\\n\\\\\\\\nRSVP today: churchos.io/invite/admin",
          "Warm & Welcoming": "Subject: Save your seat at the table: " + topic + " ❤️\\\\\\\\n\\\\\\\\nHello Friend,\\\\\\\\n\\\\\\\\nAt Next Church, our mission is simple: Love God, love people, and make disciples. This week, we are creating a special environment for: \\\\\\"" + topic + "\\\\\\".\\\\\\\\n\\\\\\\\nWhether you are a lifelong believer or just exploring faith, we want to walk alongside you. We have outstanding children check-in systems and a warm atmosphere.\\\\\\\\n\\\\\\\\nWhen: Sunday at 9:00 AM\\\\\\\\nWhere: 123 Church Way & Online Streams\\\\\\\\n\\\\\\\\nRSVP today: churchos.io/invite/admin",
          "Energetic & Contemporary": "Subject: Get Ready: \\\\\\"" + topic + "\\\\\\" is live this Sunday! ⚡️\\\\\\\\n\\\\\\\\nHey NextGen,\\\\\\\\n\\\\\\\\nAre you ready for something fresh? We are dropping a brand-new Sunday experience: \\\\\\"" + topic + "\\\\\\".\\\\\\\\n\\\\\\\\nExpect high-impact visuals, powerful soundscapes, and an authentic, unfiltered look at scripture. Plus, join us for our post-service block party!\\\\\\\\n\\\\\\\\nGet your passes and invite your friends:\\\\\\\\nchurchos.io/invite/admin\\\\\\\\n\\\\\\\\nSee you there!",
          "Traditional & Formal": "Subject: Formal Invitation: Liturgical Focus on " + topic + " ⛪️\\\\\\\\n\\\\\\\\nDear Members of the Congregation,\\\\\\\\n\\\\\\\\nWe extend a formal invitation for your attendance at our upcoming Sunday morning corporate liturgy, centered on: \\\\\\"" + topic + "\\\\\\".\\\\\\\\n\\\\\\\\nService Schedule:\\\\\\\\n- 09:30 AM: Choral Preludes\\\\\\\\n- 10:00 AM: Call to Worship & Liturgical Scriptural reading\\\\\\\\n- 11:30 AM: Formal reception & staff greetings\\\\\\\\n\\\\\\\\nKindly register your attendance: churchos.io/invite/admin"
        }
      };

      const selectedCopy = copyTemplates[channel][tone];
      
      let currentLength = 0;
      const interval = setInterval(() => {
        currentLength += Math.floor(Math.random() * 15) + 5;
        if (currentLength >= selectedCopy.length) {
          currentLength = selectedCopy.length;
          outputBox.textContent = selectedCopy;
          progressBar.style.width = \'100%\';
          progressCount.textContent = \'Completed (250 words generated)\';
          clearInterval(interval);
          showToast(\'AI content successfully generated!\');
        } else {
          outputBox.textContent = selectedCopy.slice(0, currentLength) + \' ▌\';
          const percent = Math.round((currentLength / selectedCopy.length) * 100);
          progressBar.style.width = percent + \'%\';
          progressCount.textContent = \'Generating... \' + Math.round(percent * 2.5) + \' / 250 words\';
        }
      }, 50);
    };

    window.copyOutreachAiCopy = function() {
      const output = document.getElementById(\'outreachAiOutput\').textContent;
      if (output && output !== \'Your generated copy will appear here...\') {
        navigator.clipboard.writeText(output);
        showToast(\'AI Generated copy copied to clipboard!\');
      } else {
        showToast(\'Nothing to copy.\');
      }
    };

    window.submitSocialPromoAd = function() {
      const title = document.getElementById(\'outreachPromoTitle\').value.trim();
      const audience = document.getElementById(\'outreachPromoAudience\').value;
      const budget = document.getElementById(\'outreachPromoBudget\').value;
      
      if (!title) {
        showToast(\'Please specify a campaign title.\');
        return;
      }

      window.outreachState.promotions.unshift({
        id: \'prm-\' + (window.outreachState.promotions.length + 1),
        title: title,
        audience: audience,
        budget: parseInt(budget),
        impressions: 0,
        clicks: 0,
        status: \'Active\'
      });

      showToast(\'Social promotion ad published live successfully!\');
      document.getElementById(\'outreachPromoTitle\').value = \'\';
      switchOutreachTab(\'promotions\');
    };

    function renderOutreachTab(tab) {
      if (tab === \'promotions\') {
        const tbody = document.getElementById(\'outreachPromosTableBody\');
        if (tbody) {
          tbody.innerHTML = window.outreachState.promotions.map(p => {
            const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : \'0.0\';
            return \\\`
              <tr>
                <td><strong>\\\${escapeHtml(p.title)}</strong></td>
                <td><span style="font-size:11px;">\\\${escapeHtml(p.audience)}</span></td>
                <td><code>\\\$\${p.budget}/day</code></td>
                <td><code>\\\${p.impressions.toLocaleString()}</code></td>
                <td><code>\\\${p.clicks.toLocaleString()} (\\\${ctr}%)</code></td>
                <td><span class="badge success">\\\${escapeHtml(p.status)}</span></td>
              </tr>
            \\\`;
          }).join(\'\');
        }
      } else if (tab === \'campaigns\') {`;

const replacementOutreachJsControllers = `    function renderOutreachTab(tab) {
      if (tab === 'campaigns') {`;

if (html.includes(targetOutreachJsControllers)) {
  html = html.replace(targetOutreachJsControllers, replacementOutreachJsControllers);
  console.log('Outreach custom JS functions successfully deleted.');
} else {
  // fallback for possible spacing difference
  const altOutreachJsControllers = `    window.generateOutreachAiContent = function() {`;
  const endControllerIndex = html.indexOf(`function renderOutreachTab(tab) {`);
  const startControllerIndex = html.indexOf(altOutreachJsControllers);
  if (startControllerIndex !== -1 && endControllerIndex !== -1 && startControllerIndex < endControllerIndex) {
    html = html.slice(0, startControllerIndex) + html.slice(endControllerIndex);
    console.log('Outreach custom JS functions deleted via slice.');
  }
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Reverted custom outreach panel and categorized AI Media Studio under Outreach!');
console.log('New dashboard.html length:', html.length);
