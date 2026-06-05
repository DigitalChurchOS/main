
    // --- 14 ADVANCED MODULES STATE AND LOGIC ---
    window.bibleState = {
      activeTab: 'explorer',
      notes: [],
      plans: []
    };

    window.signageState = {
      activeTab: 'displays',
      devices: [],
      playlists: [],
      logs: [],
      activeSlideIdx: 0
    };

    window.worshipState = {
      activeTab: 'runsheet',
      runsheet: [],
      catalog: [],
      currentLineIdx: 0
    };

    window.financeState = {
      activeTab: 'ledger',
      ledger: [],
      invoices: [],
      expenses: []
    };

    window.formsState = {
      activeTab: 'catalog',
      forms: [],
      inbox: [],
      hooks: []
    };

    window.meetingsState = {
      activeTab: 'rooms',
      rooms: [],
      activeMembers: [],
      micOn: true,
      camOn: true
    };

    window.branchState = {
      activeTab: 'campuses',
      campuses: [],
      splits: [],
      logs: []
    };

    window.outreachState = {
      activeTab: 'campaigns',
      campaigns: [],
      leads: []
    };

    window.salvationState = {
      activeTab: 'wall',
      decisions: [],
      milestones: {},
      leaders: []
    };

    window.wlState = {
      activeTab: 'branding',
      appName: 'Grace City App',
      primaryColor: '#4f46e5',
      bundleId: 'org.gracechurch.app',
      pushHistory: [],
      logs: []
    };

    window.communityState = {
      activeTab: 'forums',
      forums: [],
      notices: [],
      profiles: []
    };

    window.lcState = {
      activeTab: 'chat',
      chats: [],
      activeChatId: null,
      tickets: [],
      slas: []
    };

    window.commState = {
      activeTab: 'newsletters',
      newsletters: [],
      sms: [],
      sequences: []
    };

    window.crmState = {
      activeTab: 'kanban',
      tasks: [],
      analytics: []
    };

    // --- BIBLE MODULE LOGIC ---
    window.switchBibleTab = function(tab) {
      window.bibleState.activeTab = tab;
      document.querySelectorAll('#bibleConsoleContainer .bible-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#bibleConsoleContainer [data-bible-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('bible' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#bibleConsoleContainer [data-bible-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderBibleTab(tab);
    };

    window.bootstrapBible = async function() {
      showToast('Retrieving scripture indexing databases...');
      if (window.bibleState.notes.length === 0) {
        window.bibleState.notes = [
          { id: 'note-1', title: 'The Heart of a Giver', content: 'Scripture outlines: Luke 6:38, Malachi 3:10. Giving should be out of a cheerful heart rather than constraint.' },
          { id: 'note-2', title: 'Faith and Works', content: 'Scripture study: James 2:14-26. True faith is validated by the spiritual works and actions we perform.' }
        ];
      }
      if (window.bibleState.plans.length === 0) {
        window.bibleState.plans = [
          { id: 'plan-1', name: 'New Believer 30-Day Guide', progress: 45, duration: '30 Days', desc: 'A custom roadmap taking converts through foundational scriptures.' },
          { id: 'plan-2', name: 'Annual Bible Reading Marathon', progress: 12, duration: '365 Days', desc: 'Read scripture in chronological order over the course of one year.' }
        ];
      }
      document.getElementById('bibleNoteTitleInput').value = '';
      document.getElementById('bibleNoteContentInput').value = '';
      runBibleSearch();
      window.switchBibleTab(window.bibleState.activeTab);
    };

    window.runBibleSearch = function() {
      const q = document.getElementById('bibleSearchQuery').value.trim().toLowerCase();
      const translation = document.getElementById('bibleTranslationSelect').value;
      const listEl = document.getElementById('bibleVersesList');
      if (!listEl) return;

      const mockVerses = [
        { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
        { ref: 'Genesis 1:1', text: 'In the beginning God created the heaven and the earth.' },
        { ref: 'Luke 6:38', text: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom.' },
        { ref: 'James 2:17', text: 'Even so faith, if it hath not works, is dead, being alone.' },
        { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }
      ];

      const filtered = mockVerses.filter(v => v.ref.toLowerCase().includes(q) || v.text.toLowerCase().includes(q));
      listEl.innerHTML = filtered.map(v => `
        <div style="padding:10px; background:rgba(255,255,255,0.05); border:1px solid #1c1e21; border-radius:4px;">
          <strong style="color:var(--success); font-size:12px;">${v.ref} (${translation})</strong>
          <p style="font-size:12px; margin-top:4px; line-height:1.4;">${escapeHtml(v.text)}</p>
        </div>
      `).join('');
      refreshIcons();
    };

    function renderBibleTab(tab) {
      if (tab === 'plans') {
        const grid = document.getElementById('biblePlansGrid');
        if (grid) {
          grid.innerHTML = window.bibleState.plans.map(p => `
            <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
              <h3>${escapeHtml(p.name)}</h3>
              <p class="muted" style="font-size:11px;">${escapeHtml(p.desc)}</p>
              <div style="font-size:10px; display:flex; justify-content:space-between; margin-top:10px;">
                <span>Plan Length: ${p.duration}</span>
                <span>${p.progress}% Complete</span>
              </div>
              <div style="width:100%; height:6px; background:#1c1e21; border-radius:4px; overflow:hidden;">
                <div style="width:${p.progress}%; height:100%; background:var(--success); border-radius:4px;"></div>
              </div>
              <button class="btn btn-sm" onclick="showToast('Loading plan outline scripture references...')"><i data-lucide="play-circle" style="width:12px;"></i>Resume Reading</button>
            </div>
          `).join('');
        }
      } else if (tab === 'verse') {
        document.getElementById('bibleDailyVerseText').textContent = '"For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end."';
        document.getElementById('bibleDailyVerseRef').textContent = 'JEREMIAH 29:11';
      } else if (tab === 'notes') {
        const listEl = document.getElementById('bibleNotesList');
        if (listEl) {
          listEl.innerHTML = window.bibleState.notes.map(n => `
            <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; cursor:pointer;" onclick="loadBibleStudyNoteContent('${n.id}')">
              <strong>${escapeHtml(n.title)}</strong>
              <p class="muted" style="font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:4px;">${escapeHtml(n.content)}</p>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.loadBibleStudyNoteContent = function(id) {
      const note = window.bibleState.notes.find(n => n.id === id);
      if (!note) return;
      document.getElementById('bibleNoteTitleInput').value = note.title;
      document.getElementById('bibleNoteContentInput').value = note.content;
      document.getElementById('bibleNoteEditorTitle').textContent = 'Modify Study Outline';
      showToast('Outline loaded to editor.');
    };

    window.saveBibleStudyNote = function() {
      const title = document.getElementById('bibleNoteTitleInput').value.trim();
      const content = document.getElementById('bibleNoteContentInput').value.trim();
      if (!title || !content) {
        alert('Title and Content are required to save notes.');
        return;
      }
      const existing = window.bibleState.notes.find(n => n.title.toLowerCase() === title.toLowerCase());
      if (existing) {
        existing.content = content;
        showToast('Study Outline updated successfully.');
      } else {
        window.bibleState.notes.push({ id: 'note-' + Date.now(), title, content });
        showToast('New Study Outline created.');
      }
      bootstrapBible();
    };

    window.copyDailyVerse = function() {
      const ref = document.getElementById('bibleDailyVerseRef').textContent;
      navigator.clipboard.writeText(ref);
      showToast('Verse reference copied to clipboard!');
    };

    // --- SIGNAGE MODULE LOGIC ---
    window.switchSignageTab = function(tab) {
      window.signageState.activeTab = tab;
      document.querySelectorAll('#signageConsoleContainer .signage-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#signageConsoleContainer [data-signage-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('signage' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#signageConsoleContainer [data-signage-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderSignageTab(tab);
    };

    window.bootstrapSignage = async function() {
      showToast('Initializing active display TV monitors...');
      if (window.signageState.devices.length === 0) {
        window.signageState.devices = [
          { name: 'Lobby Central TV-01', location: 'Lobby East Wing', status: 'Online', playlist: 'Sunday Service Welcome Loop' },
          { name: 'Sanctuary Main TV-02', location: 'Sanctuary Altars Left', status: 'Online', playlist: 'Upcoming Announcements Loop' },
          { name: 'Children Arena TV-03', location: 'Toddlers Room Corridor', status: 'Offline', playlist: 'Kids Cartoon Slide' }
        ];
      }
      if (window.signageState.playlists.length === 0) {
        window.signageState.playlists = [
          { name: 'Sunday Service Welcome Loop', duration: 10, slides: ['Welcome to Church!', 'Service starts in 10 minutes.', 'Rejoice with thanksgiving!'] },
          { name: 'Upcoming Announcements Loop', duration: 15, slides: ['Easter Concert: April 5th', 'LMS Class enrollments open', 'Giving campaigns splits ledger updated'] }
        ];
      }
      if (window.signageState.logs.length === 0) {
        window.signageState.logs = [
          { time: '13:02:11', device: 'Lobby Central TV-01', event: 'Heartbeat handshake sync', status: '200 OK' },
          { time: '12:58:30', device: 'Sanctuary Main TV-02', event: 'Slide advanced to: Easter Concert: April 5th', status: '200 OK' }
        ];
      }
      advanceSignageEmulator();
      window.switchSignageTab(window.signageState.activeTab);
    };

    window.advanceSignageEmulator = function() {
      const pl = window.signageState.playlists[0];
      if (!pl) return;
      const idx = window.signageState.activeSlideIdx;
      const slide = pl.slides[idx];
      const frame = document.getElementById('signageTvMockFrame');
      if (frame) {
        frame.innerHTML = `
          <h2 style="font-size:24px; font-weight:800; text-transform:uppercase; color:var(--success);">${escapeHtml(pl.name)}</h2>
          <p style="font-size:18px; margin-top:20px; font-style:italic;">"${escapeHtml(slide)}"</p>
          <span style="position:absolute; bottom:10px; right:10px; font-size:10px; color:#666;">Slide ${idx+1} of ${pl.slides.length}</span>
        `;
      }
      window.signageState.activeSlideIdx = (idx + 1) % pl.slides.length;
    };

    function renderSignageTab(tab) {
      if (tab === 'displays') {
        const listEl = document.getElementById('signageDevicesList');
        if (listEl) {
          listEl.innerHTML = window.signageState.devices.map(d => {
            const isOnline = d.status === 'Online';
            return `
              <div style="padding:12px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${escapeHtml(d.name)}</strong><br/>
                  <span class="muted" style="font-size:10px;">Location: ${escapeHtml(d.location)} | Active Loop: ${escapeHtml(d.playlist)}</span>
                </div>
                <span class="badge ${isOnline ? 'success' : 'danger'}">${escapeHtml(d.status)}</span>
              </div>
            `;
          }).join('');
        }
      } else if (tab === 'playlists') {
        const grid = document.getElementById('signagePlaylistsGrid');
        if (grid) {
          grid.innerHTML = window.signageState.playlists.map(p => `
            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <h3>${escapeHtml(p.name)}</h3>
              <p class="muted" style="font-size:11px;">Default slide intervals: <code>${p.duration} seconds</code></p>
              <div style="margin-top:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;">
                <strong style="font-size:10px;">Active Slides Loops:</strong>
                <ul style="font-size:10px; padding-left:12px; margin-top:4px; display:flex; flex-direction:column; gap:4px;">
                  ${p.slides.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                </ul>
              </div>
              <button class="btn btn-sm" onclick="showToast('Broadcasting loop to active screens...')"><i data-lucide="play" style="width:12px;"></i>Deploy Loop</button>
            </div>
          `).join('');
        }
      } else if (tab === 'logs') {
        const tbody = document.getElementById('signageLogsTableBody');
        if (tbody) {
          tbody.innerHTML = window.signageState.logs.map(l => `
            <tr>
              <td><code>${escapeHtml(l.time)}</code></td>
              <td><strong>${escapeHtml(l.device)}</strong></td>
              <td>${escapeHtml(l.event)}</td>
              <td><span class="badge success">${escapeHtml(l.status)}</span></td>
            </tr>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.triggerSignageSync = function() {
      showToast('Pushing immediate TV loop handshakes...');
      window.signageState.logs.unshift({
        time: new Date().toTimeString().split(' ')[0],
        device: 'All Screen Devices',
        event: 'Manual sync request processed',
        status: '200 OK'
      });
      bootstrapSignage();
    };

    // --- WORSHIP MODULE LOGIC ---
    window.switchWorshipTab = function(tab) {
      window.worshipState.activeTab = tab;
      document.querySelectorAll('#worshipConsoleContainer .worship-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#worshipConsoleContainer [data-worship-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('worship' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#worshipConsoleContainer [data-worship-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderWorshipTab(tab);
    };

    window.bootstrapWorship = async function() {
      showToast('Loading service runsheet and key charts...');
      if (window.worshipState.runsheet.length === 0) {
        window.worshipState.runsheet = [
          { time: '09:00 AM', duration: '10m', item: 'Service Opening & Countdown', key: 'None', leader: 'Bro. Emmanuel', cue: 'TV Display countdown on' },
          { time: '09:10 AM', duration: '15m', item: 'Opening Song: "Oh Lord Our God"', key: 'G Major', leader: 'Sister Faith', cue: 'Guitar starts altars loop' },
          { time: '09:25 AM', duration: '15m', item: 'Worship Anthem: "Way Maker"', key: 'C Major', leader: 'Sister Faith', cue: 'Keyboard solo shift' },
          { time: '09:40 AM', duration: '5m', item: 'Salvation Invitation Call', key: 'None', leader: 'Pastor Davis', cue: 'Soft backdrop keys' }
        ];
      }
      if (window.worshipState.catalog.length === 0) {
        window.worshipState.catalog = [
          { title: 'Oh Lord Our God', key: 'G Major', bpm: 120, lyrics: ['Oh Lord our God, how excellent is Your Name', 'In all the earth, Your glory shines bright', 'We exalt Your Name forevermore!'] },
          { title: 'Way Maker', key: 'C Major', bpm: 68, lyrics: ['Way Maker, Miracle Worker, Promise Keeper', 'Light in the darkness, my God', 'That is who You are!'] }
        ];
      }
      loadWorshipLyricsCues();
      window.switchWorshipTab(window.worshipState.activeTab);
    };

    window.worshipShiftRosterUp = function() {
      if (window.worshipState.runsheet.length > 1) {
        const temp = window.worshipState.runsheet[0];
        window.worshipState.runsheet[0] = window.worshipState.runsheet[1];
        window.worshipState.runsheet[1] = temp;
        showToast('Runsheet timeline sequence updated.');
        bootstrapWorship();
      }
    };

    function renderWorshipTab(tab) {
      if (tab === 'runsheet') {
        const tbody = document.getElementById('worshipRunsheetTableBody');
        if (tbody) {
          tbody.innerHTML = window.worshipState.runsheet.map(r => `
            <tr>
              <td><code>${escapeHtml(r.time)}</code></td>
              <td><code>${escapeHtml(r.duration)}</code></td>
              <td><strong>${escapeHtml(r.item)}</strong></td>
              <td><span class="badge muted">${escapeHtml(r.key)}</span></td>
              <td>${escapeHtml(r.leader)}</td>
              <td><span class="badge success">${escapeHtml(r.cue)}</span></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'catalog') {
        const grid = document.getElementById('worshipSongCatalogGrid');
        if (grid) {
          grid.innerHTML = window.worshipState.catalog.map(c => `
            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <h3>${escapeHtml(c.title)}</h3>
              <div style="display:flex; justify-content:space-between; font-size:11px;">
                <span>Default Key: <strong style="color:var(--success);">${c.key}</strong></span>
                <span>Tempo: <strong>${c.bpm} BPM</strong></span>
              </div>
              <div style="max-height:100px; overflow-y:auto; padding:5px; background:rgba(0,0,0,0.15); border-radius:4px; font-size:10px; font-style:italic;">
                ${c.lyrics.map(l => `<div>${escapeHtml(l)}</div>`).join('')}
              </div>
              <button class="btn btn-sm" onclick="projectWorshipSongLyrics('${escapeHtml(c.title)}')"><i data-lucide="projector" style="width:12px;"></i>Project Lyrics</button>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.projectWorshipSongLyrics = function(title) {
      const song = window.worshipState.catalog.find(c => c.title === title);
      if (!song) return;
      window.worshipState.currentLineIdx = 0;
      window.switchWorshipTab('lyrics');
      loadWorshipLyricsCues();
      showToast('Worship song lyrics loaded to projection desk.');
    };

    function loadWorshipLyricsCues() {
      const song = window.worshipState.catalog[0];
      if (!song) return;
      const box = document.getElementById('worshipLyricsPreviewBox');
      const idx = window.worshipState.currentLineIdx;
      if (box) {
        box.innerHTML = `
          <h4 style="font-size:10px; color:var(--success); margin-bottom:10px;">Lyrics Projection: ${escapeHtml(song.title)}</h4>
          <h2 style="font-size:18px; line-height:1.5;">${escapeHtml(song.lyrics[idx])}</h2>
          <span style="position:absolute; bottom:10px; right:10px; font-size:10px; color:#666;">Verse ${idx+1} of ${song.lyrics.length}</span>
        `;
      }
      const linesEl = document.getElementById('worshipLyricLinesSelector');
      if (linesEl) {
        linesEl.innerHTML = song.lyrics.map((l, idxSelf) => `
          <button style="text-align:left; padding:8px; background:${idxSelf === idx ? 'rgba(0,255,0,0.15)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${idxSelf === idx ? 'var(--success)' : '#1c1e21'}; border-radius:4px; color:#fff; font-size:11px;" onclick="worshipLyricJump(${idxSelf})">
            Verse ${idxSelf+1}: ${escapeHtml(l)}
          </button>
        `).join('');
      }
    }

    window.worshipLyricJump = function(idx) {
      window.worshipState.currentLineIdx = idx;
      loadWorshipLyricsCues();
    };

    window.worshipLyricPrev = function() {
      const song = window.worshipState.catalog[0];
      if (!song) return;
      const idx = window.worshipState.currentLineIdx;
      window.worshipState.currentLineIdx = (idx - 1 + song.lyrics.length) % song.lyrics.length;
      loadWorshipLyricsCues();
    };

    window.worshipLyricNext = function() {
      const song = window.worshipState.catalog[0];
      if (!song) return;
      const idx = window.worshipState.currentLineIdx;
      window.worshipState.currentLineIdx = (idx + 1) % song.lyrics.length;
      loadWorshipLyricsCues();
    };

    // --- FINANCE MODULE LOGIC ---
    window.switchFinanceTab = function(tab) {
      window.financeState.activeTab = tab;
      document.querySelectorAll('#financeConsoleContainer .finance-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#financeConsoleContainer [data-finance-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('finance' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#financeConsoleContainer [data-finance-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderFinanceTab(tab);
    };

    window.bootstrapFinance = async function() {
      showToast('Retrieving branch ledger accounts...');
      if (window.financeState.ledger.length === 0) {
        window.financeState.ledger = [
          { date: '2026-05-31', cat: 'Online Tithe', ref: 'Giving Pipeline: Bro John', acct: 'General Fund', amount: 250, type: 'income' },
          { date: '2026-05-30', cat: 'Utilities Claim', ref: 'Electricity Bill Wing A', acct: 'Operational Account', amount: -120, type: 'expense' },
          { date: '2026-05-28', cat: 'Easter Merch Sales', ref: 'Store checkout invoice', acct: 'Commerce Fund', amount: 480, type: 'income' }
        ];
      }
      if (window.financeState.invoices.length === 0) {
        window.financeState.invoices = [
          { id: 'INV-101', payer: 'Jane Doe', desc: 'Discipleship Study Materials', due: '2026-06-15', amount: 45, status: 'Pending' },
          { id: 'INV-102', payer: 'Peter Obi', desc: 'Easter Merch Preorder', due: '2026-05-25', amount: 120, status: 'Paid' }
        ];
      }
      if (window.financeState.expenses.length === 0) {
        window.financeState.expenses = [
          { payee: 'State Power Co.', cat: 'Utilities', amount: 350, reconciled: true },
          { payee: 'Admin Depot', cat: 'Admin', amount: 85, reconciled: false }
        ];
      }
      loadFinanceLedgerTable();
      window.switchFinanceTab(window.financeState.activeTab);
    };

    window.loadFinanceLedgerTable = function() {
      const filterEl = document.getElementById('financeLedgerFilter');
      const filter = filterEl ? filterEl.value : 'all';
      const tbody = document.getElementById('financeLedgerTableBody');
      if (!tbody) return;

      const filtered = window.financeState.ledger.filter(t => {
        if (filter === 'income') return t.type === 'income';
        if (filter === 'expense') return t.type === 'expense';
        return true;
      });

      tbody.innerHTML = filtered.map(t => {
        const isInc = t.type === 'income';
        return `
          <tr>
            <td><code>${escapeHtml(t.date)}</code></td>
            <td><strong>${escapeHtml(t.cat)}</strong></td>
            <td>${escapeHtml(t.ref)}</td>
            <td><span class="badge muted">${escapeHtml(t.acct)}</span></td>
            <td><strong style="color:${isInc ? 'var(--success)' : 'var(--danger)'};">${isInc ? '+' : ''}${t.amount} USD</strong></td>
          </tr>
        `;
      }).join('');
    };

    function renderFinanceTab(tab) {
      if (tab === 'ledger') {
        const grid = document.getElementById('financeBalancesGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">GENERAL ACCOUNT BALANCE</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">$45,820.00</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">BUILDING TRUST FUNDS</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">$128,500.00</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">COMMERCE NET REVENUES</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">$12,450.00</h2>
            </div>
          `;
        }
      } else if (tab === 'invoices') {
        const tbody = document.getElementById('financeInvoicesTableBody');
        if (tbody) {
          tbody.innerHTML = window.financeState.invoices.map(i => {
            const isPaid = i.status === 'Paid';
            return `
              <tr>
                <td><code>${escapeHtml(i.id)}</code></td>
                <td><strong>${escapeHtml(i.payer)}</strong></td>
                <td>${escapeHtml(i.desc)}</td>
                <td>${escapeHtml(i.due)}</td>
                <td><strong>$${i.amount}</strong></td>
                <td><span class="badge ${isPaid ? 'success' : 'pending'}">${escapeHtml(i.status)}</span></td>
              </tr>
            `;
          }).join('');
        }
      } else if (tab === 'expenses') {
        const tbody = document.getElementById('financeExpensesTableBody');
        if (tbody) {
          tbody.innerHTML = window.financeState.expenses.map(e => `
            <tr>
              <td><strong>${escapeHtml(e.payee)}</strong></td>
              <td><span class="badge muted">${escapeHtml(e.cat)}</span></td>
              <td><strong>$${e.amount}</strong></td>
              <td><span class="badge ${e.reconciled ? 'success' : 'pending'}">${e.reconciled ? 'Reconciled' : 'Pending Verification'}</span></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'reports') {
        const chart = document.getElementById('financeSplitsChart');
        if (chart) {
          chart.innerHTML = `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <strong>Lagos Central Branch splits (40%)</strong>
                <span>$18,328.00 Payout</span>
              </div>
              <div style="width:100%; height:8px; background:#1c1e21; border-radius:4px; overflow:hidden;">
                <div style="width:40%; height:100%; background:var(--success); border-radius:4px;"></div>
              </div>
            </div>
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <strong>Houston regional Hub splits (35%)</strong>
                <span>$16,037.00 Payout</span>
              </div>
              <div style="width:100%; height:8px; background:#1c1e21; border-radius:4px; overflow:hidden;">
                <div style="width:35%; height:100%; background:var(--success); border-radius:4px;"></div>
              </div>
            </div>
          `;
        }
      }
      refreshIcons();
    }

    window.submitFinanceInvoice = function() {
      const payer = document.getElementById('financeInvPayer').value.trim();
      const desc = document.getElementById('financeInvDesc').value.trim();
      const amount = Number(document.getElementById('financeInvAmount').value);

      if (!payer || !desc || !amount) {
        alert('All fields are required to issue manual invoice.');
        return;
      }

      window.financeState.invoices.unshift({
        id: 'INV-' + (100 + window.financeState.invoices.length + 1),
        payer, desc, due: new Date().toISOString().split('T')[0], amount, status: 'Pending'
      });
      showToast('Invoice dispatched successfully.');
      document.getElementById('financeInvPayer').value = '';
      document.getElementById('financeInvDesc').value = '';
      document.getElementById('financeInvAmount').value = '';
      bootstrapFinance();
    };

    window.submitFinanceExpense = function() {
      const payee = document.getElementById('financeExpPayee').value.trim();
      const cat = document.getElementById('financeExpCat').value;
      const amount = Number(document.getElementById('financeExpAmount').value);
      const descInput = document.getElementById('financeExpDescInput');
      const desc = descInput ? descInput.value.trim() : 'Manual expense';

      if (!payee || !amount) {
        alert('Payee and Amount are required.');
        return;
      }

      window.financeState.expenses.unshift({ payee, cat, amount, reconciled: false });
      window.financeState.ledger.unshift({
        date: new Date().toISOString().split('T')[0],
        cat: cat + ' Claim',
        ref: 'Manual expense claim: ' + desc,
        acct: 'Operational Account',
        amount: -amount,
        type: 'expense'
      });

      showToast('Ministry expense claim recorded.');
      document.getElementById('financeExpPayee').value = '';
      document.getElementById('financeExpAmount').value = '';
      if (descInput) descInput.value = '';
      bootstrapFinance();
    };

    // --- FORMS MODULE LOGIC ---
    window.switchFormsTab = function(tab) {
      window.formsState.activeTab = tab;
      document.querySelectorAll('#formsConsoleContainer .forms-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#formsConsoleContainer [data-forms-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('forms' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#formsConsoleContainer [data-forms-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderFormsTab(tab);
    };

    window.bootstrapForms = async function() {
      showToast('Loading custom forms schemas...');
      if (window.formsState.forms.length === 0) {
        window.formsState.forms = [
          { id: 'form-1', name: 'Baptism Intent Request Card', fields: [
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' }
          ], count: 85 },
          { id: 'form-2', name: 'General Member Intake Form', fields: [
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Cell Group Name', key: 'cell', type: 'text' }
          ], count: 240 }
        ];
      }
      if (window.formsState.inbox.length === 0) {
        window.formsState.inbox = [
          { form: 'Baptism Intent Request Card', respondent: 'John Doe', data: '{"name":"John Doe","email":"john@doe.com"}', time: '2026-05-31 10:15', status: 'Pending Review' },
          { form: 'General Member Intake Form', respondent: 'Jane Smith', data: '{"name":"Jane Smith","cell":"Lagos Super Cell A"}', time: '2026-05-30 14:02', status: 'Processed' }
        ];
      }
      if (window.formsState.hooks.length === 0) {
        window.formsState.hooks = [
          { formName: 'Baptism Intent Request Card', action: 'Sync to Ministry CRM Pipelines' }
        ];
      }

      const canvasSelect = document.getElementById('formsCanvasSelect');
      if (canvasSelect) {
        canvasSelect.innerHTML = window.formsState.forms.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
      }
      const hookSelect = document.getElementById('formsHookFormSelect');
      if (hookSelect) {
        hookSelect.innerHTML = window.formsState.forms.map(f => `<option value="${f.name}">${escapeHtml(f.name)}</option>`).join('');
      }

      loadFormCanvasFields();
      window.switchFormsTab(window.formsState.activeTab);
    };

    window.loadFormCanvasFields = function() {
      const select = document.getElementById('formsCanvasSelect');
      if (!select) return;
      const form = window.formsState.forms.find(f => f.id === select.value);
      const listEl = document.getElementById('formsCanvasFieldsList');
      if (!form || !listEl) return;

      listEl.innerHTML = form.fields.map(f => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #1c1e21; border-radius:4px;">
          <div>
            <strong>${escapeHtml(f.label)}</strong>
            <span class="muted" style="font-size:10px; margin-left:10px;">Key: ${escapeHtml(f.key)} | Type: ${escapeHtml(f.type)}</span>
          </div>
          <span class="badge success">Element Locked</span>
        </div>
      `).join('');
      refreshIcons();
    };

    function renderFormsTab(tab) {
      if (tab === 'catalog') {
        const grid = document.getElementById('formsCatalogGrid');
        if (grid) {
          grid.innerHTML = window.formsState.forms.map(f => `
            <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
              <h3>${escapeHtml(f.name)}</h3>
              <p class="muted" style="font-size:11px;">Total submissions: <code>${f.count} respondents</code></p>
              <div style="display:flex; justify-content:space-between; margin-top:10px;">
                <button class="btn btn-sm" onclick="openPublicFormPopup('${f.id}')"><i data-lucide="eye" style="width:12px;"></i>View Live Form</button>
              </div>
            </div>
          `).join('');
        }
      } else if (tab === 'inbox') {
        const tbody = document.getElementById('formsInboxTableBody');
        if (tbody) {
          tbody.innerHTML = window.formsState.inbox.map(i => {
            const isPend = i.status === 'Pending Review';
            return `
              <tr>
                <td><strong>${escapeHtml(i.form)}</strong></td>
                <td>${escapeHtml(i.respondent)}</td>
                <td><code>${escapeHtml(i.data)}</code></td>
                <td>${escapeHtml(i.time)}</td>
                <td><span class="badge ${isPend ? 'pending' : 'success'}">${escapeHtml(i.status)}</span></td>
              </tr>
            `;
          }).join('');
        }
      } else if (tab === 'workflows') {
        const chart = document.getElementById('formsWorkflowsChart');
        if (chart) {
          chart.innerHTML = window.formsState.hooks.map(h => `
            <div style="padding:12px; background:rgba(255,255,255,0.05); border:1px solid #1c1e21; border-radius:4px; display:flex; align-items:center; gap:10px; font-size:12px;">
              <i data-lucide="git-commit" style="color:var(--success);"></i>
              <div>
                <strong>Form: ${escapeHtml(h.formName)}</strong><br/>
                <span class="muted" style="font-size:10px;">Trigger Action: ${escapeHtml(h.action)}</span>
              </div>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.submitFormsField = function() {
      const select = document.getElementById('formsCanvasSelect');
      if (!select) return;
      const form = window.formsState.forms.find(f => f.id === select.value);
      if (!form) return;

      const label = document.getElementById('formsFieldLabel').value.trim();
      const key = document.getElementById('formsFieldKey').value.trim();
      const type = document.getElementById('formsFieldType').value;

      if (!label || !key) {
        alert('Field label and Key name are required.');
        return;
      }

      form.fields.push({ label, key, type });
      showToast('Form field element successfully appended.');
      document.getElementById('formsFieldLabel').value = '';
      document.getElementById('formsFieldKey').value = '';
      loadFormCanvasFields();
    };

    window.submitFormsHook = function() {
      const formName = document.getElementById('formsHookFormSelect').value;
      const actionValue = document.getElementById('formsHookActionSelect').value;
      const actionMap = {
        crm: 'Sync to Ministry CRM Pipelines',
        sms: 'Dispatch Welcome SMS broadcast',
        email: 'Route email notification to Pastor'
      };

      window.formsState.hooks.push({ formName, action: actionMap[actionValue] });
      showToast('Dynamic Automation Sequence successfully established.');
      bootstrapForms();
    };

    window.openCreateFormModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Form Campaign Name</label>
            <input type="text" id="newFormNameInput" class="input" placeholder="e.g. Baptism Intent Request Card" style="width:100%;">
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Define Questionnaire Form',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const name = document.getElementById('newFormNameInput').value.trim();
        if (!name) return;
        window.formsState.forms.push({
          id: 'form-' + Date.now(), name, fields: [{ label: 'Full Name', key: 'name', type: 'text' }], count: 0
        });
        showToast('Form context initialized.');
        bootstrapForms();
      }
    };

    window.openPublicFormPopup = function(formId) {
      const form = window.formsState.forms.find(f => f.id === formId);
      if (!form) return;

      const html = `
        <div style="max-width:440px; padding:15px; border-radius:8px; border:1px solid #1c1e21; background:#070809; color:#fff; text-align:center;">
          <h2 style="font-size:20px; margin-bottom:10px;">${escapeHtml(form.name)}</h2>
          <p class="muted" style="font-size:12px; margin-bottom:20px;">Respond fully to the questionnaire prompts below.</p>
          <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
            ${form.fields.map(field => {
              if (field.type === 'checkbox') {
                return `
                  <div class="field" style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="publicFormField_${field.key}" style="width:auto; margin:0;">
                    <label style="margin:0;">${escapeHtml(field.label)}</label>
                  </div>`;
              }
              return `
                <div class="field">
                  <label style="display:block; margin-bottom:4px;">${escapeHtml(field.label)}</label>
                  <input type="${field.type}" id="publicFormField_${field.key}" class="input" style="width:100%;">
                </div>`;
            }).join('')}
          </div>
        </div>
      `;

      showSystemModal({
        type: 'confirm',
        title: 'Live Preview Form',
        message: html,
        showCancel: true
      }).then(confirm => {
        if (confirm) {
          const payload = {};
          let respondent = 'Anonymous Respondent';
          form.fields.forEach(f => {
            const el = document.getElementById('publicFormField_' + f.key);
            if (el) {
              payload[f.key] = el.type === 'checkbox' ? el.checked : el.value;
              if (f.key === 'name' && el.value) respondent = el.value;
            }
          });

          form.count += 1;
          window.formsState.inbox.unshift({
            form: form.name,
            respondent,
            data: JSON.stringify(payload),
            time: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5),
            status: 'Pending Review'
          });

          const hook = window.formsState.hooks.find(h => h.formName === form.name);
          if (hook) {
            showToast('Workflow triggered: ' + hook.action);
            if (hook.action.includes('CRM') && window.membersState && window.membersState.members) {
              window.membersState.members.unshift({
                id: 'member-' + Date.now(),
                firstName: respondent.split(' ')[0],
                lastName: respondent.split(' ')[1] || 'Guest',
                email: payload.email || 'guest@domain.com',
                phone: '+15550199',
                status: 'Active',
                title: 'New convert'
              });
              showToast('Form contact synced into CRM.');
            }
          }

          showToast('Form response captured successfully!');
          bootstrapForms();
        }
      });
    };

    // --- LIVE MEETINGS MODULE LOGIC ---
    window.switchMeetingsTab = function(tab) {
      window.meetingsState.activeTab = tab;
      document.querySelectorAll('#liveMeetingsConsoleContainer .meetings-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#liveMeetingsConsoleContainer [data-meetings-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('meetings' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#liveMeetingsConsoleContainer [data-meetings-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderMeetingsTab(tab);
    };

    window.bootstrapLiveMeetings = async function() {
      showToast('Accessing secure video channels...');
      if (window.meetingsState.rooms.length === 0) {
        window.meetingsState.rooms = [
          { topic: 'Sunday Cell Leaders Call', slug: 'cell-leaders-call', status: 'Active' },
          { topic: 'Pastoral Counseling Room 1', slug: 'counsel-one', status: 'Empty' }
        ];
      }
      if (window.meetingsState.activeMembers.length === 0) {
        window.meetingsState.activeMembers = [
          { name: 'Sister Faith (Co-Host)', device: 'Desktop App', mic: true, cam: true },
          { name: 'Brother Emmanuel', device: 'iOS Mobile', mic: false, cam: true },
          { name: 'Admin User (You)', device: 'Web browser', mic: window.meetingsState.micOn, cam: window.meetingsState.camOn }
        ];
      }
      loadMeetingsVideoLayout();
      window.switchMeetingsTab(window.meetingsState.activeTab);
    };

    window.loadMeetingsVideoLayout = function() {
      const box = document.getElementById('meetingsVideoLayout');
      if (!box) return;

      const members = window.meetingsState.activeMembers;
      box.innerHTML = members.map(m => `
        <div style="background:#1c1e21; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; overflow:hidden; min-height:100px;">
          ${m.cam ? `
            <div style="width:100%; height:100%; background:linear-gradient(45deg, #111, #333); display:flex; align-items:center; justify-content:center; min-height:90px;">
              <i data-lucide="user" style="width:40px; height:40px; color:#666;"></i>
            </div>` : `
            <div style="width:50px; height:50px; border-radius:50%; background:#4f46e5; display:flex; align-items:center; justify-content:center; font-weight:800;">${m.name.charAt(0)}</div>
          `}
          <div style="position:absolute; bottom:5px; left:5px; background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:2px; font-size:10px; display:flex; align-items:center; gap:6px;">
            <span>${escapeHtml(m.name)}</span>
            <i data-lucide="${m.mic ? 'mic' : 'mic-off'}" style="width:10px; height:10px; color:${m.mic ? 'var(--success)' : 'var(--danger)'};"></i>
          </div>
        </div>
      `).join('');

      const listEl = document.getElementById('meetingsActiveMembersList');
      if (listEl) {
        listEl.innerHTML = members.map(m => `
          <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <div><strong>${escapeHtml(m.name)}</strong><br/><span class="muted" style="font-size:9px;">Device: ${escapeHtml(m.device)}</span></div>
            <div style="display:flex; gap:8px;">
              <i data-lucide="${m.mic ? 'mic' : 'mic-off'}" style="color:${m.mic ? 'var(--success)' : 'var(--danger)'}; width:12px;"></i>
              <i data-lucide="${m.cam ? 'video' : 'video-off'}" style="color:${m.cam ? 'var(--success)' : 'var(--danger)'}; width:12px;"></i>
            </div>
          </div>
        `).join('');
      }
      refreshIcons();
    };

    function renderMeetingsTab(tab) {
      if (tab === 'schedule') {
        const tbody = document.getElementById('meetingsScheduleTableBody');
        if (tbody) {
          tbody.innerHTML = window.meetingsState.rooms.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.topic)}</strong></td>
              <td><code>/rooms/${escapeHtml(r.slug)}</code></td>
              <td><span class="badge ${r.status === 'Active' ? 'success' : 'muted'}">${escapeHtml(r.status)}</span></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'analytics') {
        const grid = document.getElementById('meetingsStatsGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">AVERAGE BITRATE</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">2.4 Mbps</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">PACKET DROP RATE</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">0.02 %</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">PEAK CONCURRENT ROOMS</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">8 Rooms</h2>
            </div>
          `;
        }
      }
      refreshIcons();
    }

    window.toggleMeetingsMic = function() {
      window.meetingsState.micOn = !window.meetingsState.micOn;
      const me = window.meetingsState.activeMembers.find(m => m.name.includes('(You)'));
      if (me) me.mic = window.meetingsState.micOn;
      const icon = document.getElementById('meetingsMicIcon');
      if (icon) {
        icon.setAttribute('data-lucide', window.meetingsState.micOn ? 'mic' : 'mic-off');
      }
      showToast(window.meetingsState.micOn ? 'Microphone enabled' : 'Microphone muted');
      loadMeetingsVideoLayout();
    };

    window.toggleMeetingsCam = function() {
      window.meetingsState.camOn = !window.meetingsState.camOn;
      const me = window.meetingsState.activeMembers.find(m => m.name.includes('(You)'));
      if (me) me.cam = window.meetingsState.camOn;
      const icon = document.getElementById('meetingsCamIcon');
      if (icon) {
        icon.setAttribute('data-lucide', window.meetingsState.camOn ? 'video' : 'video-off');
      }
      showToast(window.meetingsState.camOn ? 'Camera feed enabled' : 'Camera feed suspended');
      loadMeetingsVideoLayout();
    };

    window.leaveMeetingsRoom = function() {
      showToast('Exited secure video channel.', 'danger');
      window.meetingsState.activeMembers = window.meetingsState.activeMembers.filter(m => !m.name.includes('(You)'));
      loadMeetingsVideoLayout();
    };

    window.submitMeetingsSchedule = function() {
      const topic = document.getElementById('meetingsNewTopic').value.trim();
      const slug = document.getElementById('meetingsNewSlug').value.trim();

      if (!topic || !slug) {
        alert('Topic and link Key are required.');
        return;
      }

      window.meetingsState.rooms.push({ topic, slug, status: 'Empty' });
      showToast('Secure Video Room scheduled successfully.');
      document.getElementById('meetingsNewTopic').value = '';
      document.getElementById('meetingsNewSlug').value = '';
      bootstrapLiveMeetings();
    };

    // --- MULTI-CAMPUS MODULE LOGIC ---
    window.switchBranchTab = function(tab) {
      window.branchState.activeTab = tab;
      document.querySelectorAll('#multiBranchConsoleContainer .branch-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#multiBranchConsoleContainer [data-branch-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('branch' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#multiBranchConsoleContainer [data-branch-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderBranchTab(tab);
    };

    window.bootstrapMultiBranch = async function() {
      showToast('Consolidating multi-campus records...');
      if (window.branchState.campuses.length === 0) {
        window.branchState.campuses = [
          { name: 'Lagos Central Campus', location: 'Lagos Mainland', pastor: 'Pastor Bayo', members: 1850, status: 'Active' },
          { name: 'London Grace Center', location: 'London East', pastor: 'Pastor Andrew', members: 420, status: 'Active' },
          { name: 'Houston Harbor Assembly', location: 'Houston Downtown', pastor: 'Pastor Davis', members: 680, status: 'Active' }
        ];
      }
      if (window.branchState.splits.length === 0) {
        window.branchState.splits = [
          { name: 'Lagos Central Campus', ratio: '40%', gross: 45820, regional: 18328, local: 27492 },
          { name: 'Houston Harbor Assembly', ratio: '35%', gross: 45820, regional: 16037, local: 29783 }
        ];
      }
      if (window.branchState.logs.length === 0) {
        window.branchState.logs = [
          { time: '2026-05-31 11:15', branch: 'London Grace Center', author: 'Pastor Andrew', action: 'Uploaded Sunday run-sheet' },
          { time: '2026-05-30 09:20', branch: 'Lagos Central Campus', author: 'Pastor Bayo', action: 'Approved regional splits' }
        ];
      }
      window.switchBranchTab(window.branchState.activeTab);
    };

    function renderBranchTab(tab) {
      if (tab === 'campuses') {
        const grid = document.getElementById('branchCampusesGrid');
        if (grid) {
          grid.innerHTML = window.branchState.campuses.map(c => `
            <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
              <h3>${escapeHtml(c.name)}</h3>
              <p class="muted" style="font-size:11px;">Location: <code>${escapeHtml(c.location)}</code></p>
              <div style="font-size:11px; display:flex; justify-content:space-between; margin-top:8px;">
                <span>Pastor: <strong>${escapeHtml(c.pastor)}</strong></span>
                <span>Members: <strong>${c.members}</strong></span>
              </div>
              <button class="btn btn-sm" onclick="switchActiveTenantScope('${escapeHtml(c.name)}')"><i data-lucide="git-branch" style="width:12px;"></i>Switch Scope</button>
            </div>
          `).join('');
        }
      } else if (tab === 'finance') {
        const tbody = document.getElementById('branchFinanceTableBody');
        if (tbody) {
          tbody.innerHTML = window.branchState.splits.map(s => `
            <tr>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td><code>${escapeHtml(s.ratio)}</code></td>
              <td><strong>$${s.gross}</strong></td>
              <td><strong style="color:var(--success);">$${s.regional}</strong></td>
              <td><strong style="color:var(--success);">$${s.local}</strong></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'logs') {
        const tbody = document.getElementById('branchLogsTableBody');
        if (tbody) {
          tbody.innerHTML = window.branchState.logs.map(l => `
            <tr>
              <td><code>${escapeHtml(l.time)}</code></td>
              <td><strong>${escapeHtml(l.branch)}</strong></td>
              <td>${escapeHtml(l.author)}</td>
              <td>${escapeHtml(l.action)}</td>
            </tr>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.switchActiveTenantScope = function(name) {
      showToast('Switched dashboard workspace scope to: ' + name);
      state.tenant.name = name;
      document.getElementById('tenantName').textContent = name;
      saveState('Tenant context switched to regional campus');
    };

    window.openCreateCampusModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Campus Name</label>
            <input type="text" id="newCampusName" class="input" placeholder="e.g. Manchester Grace Center" style="width:100%;">
          </div>
          <div class="field">
            <label>Pastor In Charge</label>
            <input type="text" id="newCampusPastor" class="input" placeholder="e.g. Pastor Andrew" style="width:100%;">
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Register Regional Campus',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const name = document.getElementById('newCampusName').value.trim();
        const pastor = document.getElementById('newCampusPastor').value.trim();

        if (!name || !pastor) return;

        window.branchState.campuses.push({ name, location: 'Regional Branch', pastor, members: 0, status: 'Active' });
        showToast('Regional branch successfully integrated.');
        bootstrapMultiBranch();
      }
    };

    // --- OUTREACH MODULE LOGIC ---
    window.switchOutreachTab = function(tab) {
      window.outreachState.activeTab = tab;
      document.querySelectorAll('#outreachConsoleContainer .outreach-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#outreachConsoleContainer [data-outreach-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('outreach' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#outreachConsoleContainer [data-outreach-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderOutreachTab(tab);
    };

    window.bootstrapOutreach = async function() {
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
    };

    window.runOutreachFlyerRender = function() {
      const titleElInput = document.getElementById('outreachCardTitleInput');
      const msgElInput = document.getElementById('outreachCardMsgInput');
      const title = titleElInput ? titleElInput.value.trim() : 'Easter Concert';
      const msg = msgElInput ? msgElInput.value.trim() : 'He is Risen! Celebrate hope with us.';

      const titleEl = document.getElementById('outreachFlyerTitle');
      const msgEl = document.getElementById('outreachFlyerMsg');
      if (titleEl) titleEl.textContent = title || 'Easter Concert';
      if (msgEl) msgEl.textContent = msg || 'He is Risen! Celebrate hope with us.';
    };

    function renderOutreachTab(tab) {
      if (tab === 'campaigns') {
        const grid = document.getElementById('outreachCampaignsGrid');
        if (grid) {
          grid.innerHTML = window.outreachState.campaigns.map(c => {
            const percent = Math.round((c.invitees / c.goal) * 100);
            return `
              <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
                <h3>${escapeHtml(c.name)}</h3>
                <div style="font-size:11px; display:flex; justify-content:space-between; margin-top:8px;">
                  <span>Campaign Goal: <strong>${c.goal} leads</strong></span>
                  <span>Progress: <strong>${percent}%</strong></span>
                </div>
                <div style="width:100%; height:6px; background:#1c1e21; border-radius:4px; overflow:hidden;">
                  <div style="width:${percent}%; height:100%; background:var(--success); border-radius:4px;"></div>
                </div>
                <div style="font-size:10px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
                  <span>Total invited: ${c.invitees}</span>
                  <button class="btn btn-sm" onclick="copyOutreachLink('${c.link}')"><i data-lucide="copy" style="width:10px;"></i>Copy Invite Link</button>
                </div>
              </div>
            `;
          }).join('');
        }
      } else if (tab === 'leads') {
        const tbody = document.getElementById('outreachLeadsTableBody');
        if (tbody) {
          tbody.innerHTML = window.outreachState.leads.map(l => `
            <tr>
              <td><strong>${escapeHtml(l.name)}</strong></td>
              <td><code>${escapeHtml(l.email)}</code></td>
              <td><code>${escapeHtml(l.inviter)}</code></td>
              <td>${escapeHtml(l.campaign)}</td>
              <td>${escapeHtml(l.date)}</td>
            </tr>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.copyOutreachLink = function(link) {
      navigator.clipboard.writeText(link);
      showToast('Referral invitation link copied to clipboard!');
    };

    window.openCreateOutreachCampaignModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Campaign Name</label>
            <input type="text" id="newCmpName" class="input" placeholder="e.g. Easter Hope Celebration" style="width:100%;">
          </div>
          <div class="field">
            <label>Conversion Lead Goal</label>
            <input type="number" id="newCmpGoal" class="input" placeholder="e.g. 500" style="width:100%;">
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Define Outreach Campaign',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const name = document.getElementById('newCmpName').value.trim();
        const goal = Number(document.getElementById('newCmpGoal').value);

        if (!name || !goal) return;

        window.outreachState.campaigns.push({
          id: 'cmp-' + Date.now(), name, goal, invitees: 0, link: 'churchos.io/invite/' + name.toLowerCase().replace(/\s+/g, '-')
        });
        showToast('Outreach invitation Campaign initialized.');
        bootstrapOutreach();
      }
    };

    // --- SALVATION MODULE LOGIC ---
    window.switchSalvationTab = function(tab) {
      window.salvationState.activeTab = tab;
      document.querySelectorAll('#salvationConsoleContainer .salvation-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#salvationConsoleContainer [data-salvation-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('salvation' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#salvationConsoleContainer [data-salvation-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderSalvationTab(tab);
    };

    window.bootstrapSalvation = async function() {
      showToast('Resolving new convert decision logs...');
      if (window.salvationState.decisions.length === 0) {
        window.salvationState.decisions = [
          { id: 'dec-1', name: 'Peter Obi', email: 'peter@obi.com', phone: '+2348030000001', leader: 'Bro. Emmanuel', status: 'In Discipleship' },
          { id: 'dec-2', name: 'Sister Faith Convert', email: 'faith@seeker.com', phone: '+15550199', leader: 'None', status: 'Awaiting Leader' }
        ];
      }
      if (window.salvationState.leaders.length === 0) {
        window.salvationState.leaders = [
          { name: 'Bro. Emmanuel', allocated: 1, speed: '12 mins', status: 'Available' },
          { name: 'Sister Faith', allocated: 0, speed: '8 mins', status: 'Available' }
        ];
      }

      const select = document.getElementById('salvationBelieverSelect');
      if (select) {
        select.innerHTML = window.salvationState.decisions.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
      }

      loadSalvationMilestones();
      window.switchSalvationTab(window.salvationState.activeTab);
    };

    window.loadSalvationMilestones = function() {
      const select = document.getElementById('salvationBelieverSelect');
      if (!select) return;
      const believerId = select.value;
      const convert = window.salvationState.decisions.find(d => d.id === believerId);
      const listEl = document.getElementById('salvationMilestonesList');
      if (!convert || !listEl) return;

      const defaultSteps = [
        { label: 'Spiritual Affirmation Confession', done: true },
        { label: 'Welcome Video Call check-off', done: convert.status !== 'Awaiting Leader' },
        { label: 'Foundational LMS Course Enrollment', done: convert.status === 'In Discipleship' },
        { label: 'Accredited Cell Fellowship assigned', done: false }
      ];

      listEl.innerHTML = defaultSteps.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); border:1px solid #1c1e21; border-radius:4px; font-size:11px;">
          <strong>${escapeHtml(s.label)}</strong>
          <span class="badge ${s.done ? 'success' : 'pending'}">${s.done ? 'Completed' : 'Pending'}</span>
        </div>
      `).join('');

      const summary = document.getElementById('salvationBelieverProfileSummary');
      if (summary) {
        summary.innerHTML = `
          <div style="margin-bottom:4px;"><strong>Convert Identity:</strong> ${escapeHtml(convert.name)}</div>
          <div style="margin-bottom:4px;"><strong>Contact Email:</strong> ${escapeHtml(convert.email)}</div>
          <div style="margin-bottom:4px;"><strong>Follow-Up Leader:</strong> ${escapeHtml(convert.leader)}</div>
          <div><strong>Assimilation Status:</strong> <span class="badge success">${escapeHtml(convert.status)}</span></div>
        `;
      }
      refreshIcons();
    };

    function renderSalvationTab(tab) {
      if (tab === 'wall') {
        const grid = document.getElementById('salvationDecisionsGrid');
        if (grid) {
          grid.innerHTML = window.salvationState.decisions.map(d => `
            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <h3>${escapeHtml(d.name)}</h3>
              <p class="muted" style="font-size:11px;">Contact: <code>${escapeHtml(d.phone)}</code></p>
              <div style="font-size:11px; margin-top:8px;">
                Leader: <strong style="color:var(--success);">${escapeHtml(d.leader)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <span class="badge ${d.status === 'Awaiting Leader' ? 'danger' : 'success'}">${escapeHtml(d.status)}</span>
                ${d.leader === 'None' ? `<button class="btn btn-sm" onclick="allocateSalvationLeader('${d.id}')"><i data-lucide="user-plus" style="width:12px;"></i>Assign Leader</button>` : ''}
              </div>
            </div>
          `).join('');
        }
      } else if (tab === 'leaders') {
        const tbody = document.getElementById('salvationLeadersTableBody');
        if (tbody) {
          tbody.innerHTML = window.salvationState.leaders.map(m => `
            <tr>
              <td><strong>${escapeHtml(m.name)}</strong></td>
              <td><code>${m.allocated} converts</code></td>
              <td><strong>${escapeHtml(m.speed)} Response</strong></td>
              <td><span class="badge success">${escapeHtml(m.status)}</span></td>
            </tr>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.allocateSalvationLeader = function(id) {
      const convert = window.salvationState.decisions.find(d => d.id === id);
      if (!convert) return;
      convert.leader = 'Bro. Emmanuel';
      convert.status = 'In Discipleship';
      const m = window.salvationState.leaders.find(x => x.name === 'Bro. Emmanuel');
      if (m) m.allocated += 1;
      showToast('Convert allocated to follow-up leader.');
      bootstrapSalvation();
    };

    window.openIntakeSalvationModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Convert First Name</label>
            <input type="text" id="newDecFirst" class="input" placeholder="e.g. Peter" style="width:100%;">
          </div>
          <div class="field">
            <label>Convert Last Name</label>
            <input type="text" id="newDecLast" class="input" placeholder="e.g. Obi" style="width:100%;">
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input type="text" id="newDecPhone" class="input" placeholder="e.g. +234803" style="width:100%;">
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Log Salvation Decision Call',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const fn = document.getElementById('newDecFirst').value.trim();
        const ln = document.getElementById('newDecLast').value.trim();
        const phone = document.getElementById('newDecPhone').value.trim();

        if (!fn || !ln) return;

        window.salvationState.decisions.unshift({
          id: 'dec-' + Date.now(),
          name: fn + ' ' + ln,
          email: fn.toLowerCase() + '@seeker.com',
          phone: phone || 'None',
          leader: 'None',
          status: 'Awaiting Leader'
        });
        showToast('Salvation decision logged successfully.');
        bootstrapSalvation();
      }
    };

    // --- WHITE-LABEL APP MODULE LOGIC ---
    window.switchWlTab = function(tab) {
      window.wlState.activeTab = tab;
      document.querySelectorAll('#whiteLabelConsoleContainer .wl-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#whiteLabelConsoleContainer [data-wl-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('wl' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#whiteLabelConsoleContainer [data-wl-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderWlTab(tab);
    };

    window.bootstrapWhiteLabel = async function() {
      showToast('Configuring white-label bundle properties...');
      document.getElementById('wlAppName').value = window.wlState.appName;
      document.getElementById('wlAppPrimaryColor').value = window.wlState.primaryColor;
      document.getElementById('wlAppBundleId').value = window.wlState.bundleId;

      if (window.wlState.pushHistory.length === 0) {
        window.wlState.pushHistory = [
          { title: 'Easter Service Loop Alert', body: 'He is Risen! Live concert streaming in 10 mins.', sent: '2026-05-31' }
        ];
      }

      const consoleEl = document.getElementById('wlCompilerConsole');
      if (consoleEl && consoleEl.innerHTML.trim() === '') {
        consoleEl.innerHTML = '<div>[System Info] White-Label Compiler initialized. Ready to compile build...</div>';
      }

      runWlBrandingMockSync();
      window.switchWlTab(window.wlState.activeTab);
    };

    window.saveWlBranding = function() {
      window.wlState.appName = document.getElementById('wlAppName').value.trim();
      window.wlState.primaryColor = document.getElementById('wlAppPrimaryColor').value;
      window.wlState.bundleId = document.getElementById('wlAppBundleId').value.trim();

      showToast('App Branding configurations stored.');
      runWlBrandingMockSync();
    };

    function runWlBrandingMockSync() {
      const name = document.getElementById('wlAppFrameName');
      const logo = document.getElementById('wlAppFrameLogo');
      if (name) name.textContent = window.wlState.appName || 'Grace City App';
      if (logo) {
        logo.textContent = (window.wlState.appName || 'Grace').charAt(0);
        logo.style.background = window.wlState.primaryColor;
      }
    }

    function renderWlTab(tab) {
      if (tab === 'notifications') {
        const listEl = document.getElementById('wlPushHistoryList');
        if (listEl) {
          listEl.innerHTML = window.wlState.pushHistory.map(p => `
            <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; font-size:11px; margin-bottom:8px;">
              <strong>${escapeHtml(p.title)}</strong><br/>
              <span class="muted" style="font-size:10px;">Body: ${escapeHtml(p.body)} | Sent: ${p.sent}</span>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.submitWlPush = function() {
      const title = document.getElementById('wlPushTitle').value.trim();
      const body = document.getElementById('wlPushBody').value.trim();

      if (!title || !body) {
        alert('Push Title and body are required.');
        return;
      }

      window.wlState.pushHistory.unshift({
        title, body, sent: new Date().toISOString().split('T')[0]
      });
      showToast('Mobile push alert broadcasted successfully!');
      document.getElementById('wlPushTitle').value = '';
      document.getElementById('wlPushBody').value = '';
      bootstrapWhiteLabel();
    };

    window.triggerWlCompile = function() {
      const consoleEl = document.getElementById('wlCompilerConsole');
      if (!consoleEl) return;

      consoleEl.innerHTML = '<div>[System Info] Launching White-Label App Compilation Pipeline...</div>';
      showToast('Compiling Xcode and Android gradle archives...');

      const logs = [
        'Checking white-label branding assets manifest...',
        'Compiling app icons vectors layouts...',
        'Syncing accent colors: ' + window.wlState.primaryColor,
        'Running flutter gradle build tool for Android (APK)...',
        'Generating unsigned build output: build/app/outputs/flutter-apk/app-release.apk',
        'Signing APK with tenant certificate keys...',
        'Initiating Xcode archival compilation build...',
        'Xcode build completed successfully. Archive: build/ios/iphoneos/Runner.xcarchive',
        'White-label compilation successfully verified: [SUCCESS 200 OK]'
      ];

      let idx = 0;
      const timer = setInterval(() => {
        if (idx < logs.length) {
          consoleEl.innerHTML += `<div style="margin-top:4px;">[${new Date().toLocaleTimeString()}] ${logs[idx]}</div>`;
          consoleEl.scrollTop = consoleEl.scrollHeight;
          idx++;
        } else {
          clearInterval(timer);
          showToast('App build compilation compiled successfully!', 'success');
        }
      }, 600);
    };

    // --- COMMUNITY MODULE LOGIC ---
    window.switchCommunityTab = function(tab) {
      window.communityState.activeTab = tab;
      document.querySelectorAll('#communityConsoleContainer .community-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#communityConsoleContainer [data-community-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('community' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#communityConsoleContainer [data-community-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderCommunityTab(tab);
    };

    window.bootstrapCommunity = async function() {
      showToast('Retrieving notice boards feeds...');
      if (window.communityState.forums.length === 0) {
        window.communityState.forums = [
          { title: 'The Power of Cheerfulness in Giving', author: 'Bro. Emmanuel', category: 'Devotionals', replies: 12, likes: 45 },
          { title: 'Cell Leaders Strategy Session Q3', author: 'Pastor Bayo', category: 'Church News', replies: 4, likes: 18 }
        ];
      }
      if (window.communityState.notices.length === 0) {
        window.communityState.notices = [
          { title: 'Easter Live Concert Broadcast', date: 'April 5th', desc: 'Join our physical auditorium and live feed worship celebration.', category: 'Events' }
        ];
      }
      if (window.communityState.profiles.length === 0) {
        window.communityState.profiles = [
          { name: 'Brother Emmanuel', role: 'Cell Leader', department: 'Ushering Unit' },
          { name: 'Sister Faith', role: 'Worship Assistant', department: 'Worship Choir' }
        ];
      }
      window.switchCommunityTab(window.communityState.activeTab);
    };

    function renderCommunityTab(tab) {
      if (tab === 'forums') {
        const grid = document.getElementById('communityForumsGrid');
        if (grid) {
          grid.innerHTML = window.communityState.forums.map(f => `
            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <span class="badge muted" style="width:fit-content;">${escapeHtml(f.category)}</span>
              <h3>${escapeHtml(f.title)}</h3>
              <div style="font-size:11px; display:flex; justify-content:space-between; margin-top:8px;">
                <span>By: ${escapeHtml(f.author)}</span>
                <span>${f.replies} comments | ${f.likes} likes</span>
              </div>
              <button class="btn btn-sm" onclick="showToast('Loading discussion replies thread...')"><i data-lucide="messages-square" style="width:12px;"></i>Join Discussion</button>
            </div>
          `).join('');
        }
      } else if (tab === 'notice') {
        const grid = document.getElementById('communityNoticesGrid');
        if (grid) {
          grid.innerHTML = window.communityState.notices.map(n => `
            <div class="panel" style="display:flex; flex-direction:column; gap:10px;">
              <span class="badge success" style="width:fit-content;">${escapeHtml(n.category)}</span>
              <h3>${escapeHtml(n.title)}</h3>
              <p class="muted" style="font-size:11px;">${escapeHtml(n.desc)}</p>
              <div style="font-size:10px; margin-top:10px;">Date Posted: ${n.date}</div>
            </div>
          `).join('');
        }
      } else if (tab === 'profiles') {
        const grid = document.getElementById('communityProfilesGrid');
        if (grid) {
          grid.innerHTML = window.communityState.profiles.map(p => `
            <div class="panel" style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:50%; background:#1c1e21; display:flex; align-items:center; justify-content:center; font-weight:800;">${p.name.charAt(0)}</div>
              <div>
                <strong>${escapeHtml(p.name)}</strong><br/>
                <span class="muted" style="font-size:10px;">${escapeHtml(p.role)} | ${escapeHtml(p.department)}</span>
              </div>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.openCreateForumThreadModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Discussion Topic</label>
            <input type="text" id="newThreadTitle" class="input" placeholder="e.g. Prayer Wall Request Protocols" style="width:100%;">
          </div>
          <div class="field">
            <label>Category</label>
            <select id="newThreadCat" class="select" style="width:100%;">
              <option value="Spiritual Revelations">Spiritual Revelations</option>
              <option value="Church News">Church News</option>
              <option value="General Questions">General Questions</option>
            </select>
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Post Discussion Thread',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const title = document.getElementById('newThreadTitle').value.trim();
        const category = document.getElementById('newThreadCat').value;

        if (!title) return;

        window.communityState.forums.unshift({
          title, author: 'Admin User (You)', category, replies: 0, likes: 0
        });
        showToast('Discussion Thread published.');
        bootstrapCommunity();
      }
    };

    window.openCreateLobbyNoticeModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Notice Heading</label>
            <input type="text" id="newNoticeTitle" class="input" placeholder="e.g. Sunday School Altars Renovations" style="width:100%;">
          </div>
          <div class="field">
            <label>Notice Flyer Description</label>
            <textarea id="newNoticeDesc" class="textarea" rows="3" placeholder="Description of notice..." style="width:100%;"></textarea>
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Publish Lobby Notice',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const title = document.getElementById('newNoticeTitle').value.trim();
        const desc = document.getElementById('newNoticeDesc').value.trim();

        if (!title || !desc) return;

        window.communityState.notices.unshift({
          title, desc, date: new Date().toLocaleDateString(), category: 'Announcements'
        });
        showToast('Lobby Board Notice published.');
        bootstrapCommunity();
      }
    };

    // --- LIVE CHAT MODULE LOGIC ---
    window.switchLcTab = function(tab) {
      window.lcState.activeTab = tab;
      document.querySelectorAll('#liveChatConsoleContainer .lc-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#liveChatConsoleContainer [data-lc-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('lc' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#liveChatConsoleContainer [data-lc-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderLcTab(tab);
    };

    window.bootstrapLiveChat = async function() {
      showToast('Syncing pastoral care ticket boards...');
      if (window.lcState.chats.length === 0) {
        window.lcState.chats = [
          { id: 'chat-1', name: 'Peter Obi seeker', email: 'peter@obi.com', messages: [
            { sender: 'Peter Obi', text: 'I made a decision call today. I need prayer for my family.' },
            { sender: 'System Coordinator', text: 'Pastor Bayo has been assigned to your ticket care. Welcome!' }
          ] },
          { id: 'chat-2', name: 'Sister Faith seeker', email: 'faith@seeker.com', messages: [
            { sender: 'Sister Faith seeker', text: 'How do I register for LMS discipleship courses?' }
          ] }
        ];
      }
      if (window.lcState.tickets.length === 0) {
        window.lcState.tickets = [
          { title: 'New Convert Leadership Allocation', category: 'Counselling', status: 'open' },
          { title: 'Lobby Central Air Conditioning claim', category: 'Admin Support', status: 'progress' }
        ];
      }
      if (window.lcState.activeChatId === null) {
        window.lcState.activeChatId = window.lcState.chats[0].id;
      }

      loadLcChatsList();
      window.switchLcTab(window.lcState.activeTab);
    };

    window.checkLcChatComposerSubmit = function(e) {
      if (e.key === 'Enter') submitLcChatReply();
    };

    window.submitLcChatReply = function() {
      const input = document.getElementById('lcChatComposerInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const chat = window.lcState.chats.find(c => c.id === window.lcState.activeChatId);
      if (!chat) return;

      chat.messages.push({ sender: 'Admin User (You)', text });
      input.value = '';
      showToast('Comfort reply dispatched to convert.');
      loadLcChatsList();
    };

    window.loadLcChatsList = function() {
      const queue = document.getElementById('lcChatsQueueList');
      if (!queue) return;

      queue.innerHTML = window.lcState.chats.map(c => {
        const isActive = c.id === window.lcState.activeChatId;
        return `
          <button style="text-align:left; padding:8px; background:${isActive ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${isActive ? 'var(--success)' : '#1c1e21'}; border-radius:4px; color:#fff;" onclick="selectLcChat('${c.id}')">
            <strong>${escapeHtml(c.name)}</strong>
            <p class="muted" style="font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${escapeHtml(c.messages[c.messages.length-1].text)}</p>
          </button>
        `;
      }).join('');

      const active = window.lcState.chats.find(c => c.id === window.lcState.activeChatId);
      const header = document.getElementById('lcActiveChatHeader');
      const box = document.getElementById('lcChatsMessagesList');
      const drawer = document.getElementById('lcMemberContextDrawer');

      if (active) {
        if (header) header.textContent = 'Care chat with ' + active.name;
        if (box) {
          box.innerHTML = active.messages.map(m => {
            const isMe = m.sender.includes('(You)');
            return `
              <div style="align-self:${isMe ? 'flex-end' : 'flex-start'}; max-width:80%; padding:10px; background:${isMe ? 'rgba(0,255,0,0.1)' : '#1c1e21'}; border-radius:6px; border:1px solid ${isMe ? 'var(--success)' : '#333'}; margin-bottom:8px;">
                <strong style="font-size:10px; color:${isMe ? 'var(--success)' : '#aaa'};">${m.sender}</strong>
                <p style="font-size:12px; margin-top:3px; line-height:1.4;">${escapeHtml(m.text)}</p>
              </div>
            `;
          }).join('');
          box.scrollTop = box.scrollHeight;
        }

        if (drawer) {
          drawer.innerHTML = `
            <div style="margin-bottom:4px;"><strong>Respondent Email:</strong> ${escapeHtml(active.email)}</div>
            <div style="margin-bottom:4px;"><strong>Pastoral Ticket context:</strong> <span class="badge success">Active Chat</span></div>
            <div style="margin-bottom:4px;"><strong>Giving Ledger context:</strong> <span class="badge success">$250.00 Tithe verified</span></div>
            <div><strong>LMS Discipleship progress:</strong> <span class="badge success">45% Completed</span></div>
          `;
        }
      }
      refreshIcons();
    };

    window.selectLcChat = function(id) {
      window.lcState.activeChatId = id;
      loadLcChatsList();
    };

    function renderLcTab(tab) {
      if (tab === 'tickets') {
        const board = document.getElementById('lcTicketsBoard');
        if (board) {
          const colOpen = window.lcState.tickets.filter(t => t.status === 'open');
          const colProgress = window.lcState.tickets.filter(t => t.status === 'progress');

          board.innerHTML = `
            <div class="panel">
              <h3 style="border-bottom:1px solid #1c1e21; padding-bottom:8px;">Open Tickets (${colOpen.length})</h3>
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                ${colOpen.map(t => `
                  <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; cursor:pointer;" onclick="advanceLcTicket('${escapeHtml(t.title)}')">
                    <strong>${escapeHtml(t.title)}</strong><br/>
                    <span class="badge muted" style="margin-top:6px;">${escapeHtml(t.category)}</span>
                  </div>`).join('')}
              </div>
            </div>
            <div class="panel">
              <h3 style="border-bottom:1px solid #1c1e21; padding-bottom:8px;">In Progress (${colProgress.length})</h3>
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                ${colProgress.map(t => `
                  <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px;">
                    <strong>${escapeHtml(t.title)}</strong><br/>
                    <span class="badge success" style="margin-top:6px;">${escapeHtml(t.category)}</span>
                  </div>`).join('')}
              </div>
            </div>
            <div class="panel">
              <h3 style="border-bottom:1px solid #1c1e21; padding-bottom:8px;">Resolved (0)</h3>
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                <p class="muted" style="font-size:11px;">No tickets resolved yet this cycle.</p>
              </div>
            </div>
          `;
        }
      } else if (tab === 'sla') {
        const grid = document.getElementById('lcSlaStatsGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">AVERAGE RESPONSE SPEED</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">8 mins</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">TICKET CONVERSION SLA</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">92.4 %</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">ACTIVE CARE AGENTS</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">4 Pastors</h2>
            </div>
          `;
        }
      }
      refreshIcons();
    }

    window.advanceLcTicket = function(title) {
      const ticket = window.lcState.tickets.find(t => t.title === title);
      if (!ticket) return;
      ticket.status = 'progress';
      showToast('Pastoral Care Ticket advanced to In Progress.');
      bootstrapLiveChat();
    };

    // --- COMMUNICATION MODULE LOGIC ---
    window.switchCommTab = function(tab) {
      window.commState.activeTab = tab;
      document.querySelectorAll('#communicationConsoleContainer .comm-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#communicationConsoleContainer [data-comm-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('comm' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#communicationConsoleContainer [data-comm-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderCommTab(tab);
    };

    window.bootstrapCommunication = async function() {
      showToast('Reconciling SMS notification sequences...');
      if (window.commState.newsletters.length === 0) {
        window.commState.newsletters = [
          { title: 'Easter Live Concert Newsletter Alert', target: 'All Members', status: 'Dispatched', open: '68%' },
          { title: 'Annual giving ledger and Splits statements', target: 'Lobby splits', status: 'Draft', open: '0%' }
        ];
      }
      if (window.commState.sms.length === 0) {
        window.commState.sms = [
          { target: 'All Members', snippet: 'Mid-Week communion service starts by 6pm. Join us!', count: 2850 }
        ];
      }
      if (window.commState.sequences.length === 0) {
        window.commState.sequences = [
          { trigger: 'New Converts salvation logged', seq: 'Day 1: Welcome Email -> Day 3: Pastor Call SLA -> Day 5: LMS Discipleship enrollment' }
        ];
      }
      loadCommNewsletterPreview();
      window.switchCommTab(window.commState.activeTab);
    };

    function loadCommNewsletterPreview() {
      const preview = document.getElementById('commNewsletterPreviewCanvas');
      if (!preview) return;

      preview.innerHTML = `
        <div style="border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:10px;">
          <h2 style="font-size:16px; margin:0; color:#333;">Easter Hope Celebration</h2>
          <span style="font-size:10px; color:#666;">From: pastor@gracechurch.org | Target Group: All Members</span>
        </div>
        <p style="line-height:1.4; color:#333;">Dear Grace City family,</p>
        <p style="line-height:1.4; color:#333;">Celebrate hope and resurrection with us this Sunday physically or live on our livestream feed! Bring your thanksgiving offerings and testimonies.</p>
        <div style="margin-top:20px; border-top:1px solid #ddd; padding-top:8px; font-size:10px; color:#888; text-align:center;">Unsubscribe from SMS/Email alerts</div>
      `;
    }

    function renderCommTab(tab) {
      if (tab === 'newsletters') {
        const tbody = document.getElementById('commNewslettersTableBody');
        if (tbody) {
          tbody.innerHTML = window.commState.newsletters.map(n => `
            <tr>
              <td><strong>${escapeHtml(n.title)}</strong></td>
              <td><span class="badge muted">${escapeHtml(n.target)}</span></td>
              <td><span class="badge success">${escapeHtml(n.status)}</span></td>
              <td><strong style="color:var(--success);">${escapeHtml(n.open)}</strong></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'sms') {
        const tbody = document.getElementById('commSmsTableBody');
        if (tbody) {
          tbody.innerHTML = window.commState.sms.map(s => `
            <tr>
              <td><span class="badge muted">${escapeHtml(s.target)}</span></td>
              <td>${escapeHtml(s.snippet)}</td>
              <td><strong>${s.count} SMS</strong></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'sequences') {
        const chart = document.getElementById('commSequencesChart');
        if (chart) {
          chart.innerHTML = window.commState.sequences.map(s => `
            <div style="padding:12px; background:rgba(255,255,255,0.05); border:1px solid #1c1e21; border-radius:4px; margin-bottom:8px;">
              <strong>Trigger: ${escapeHtml(s.trigger)}</strong><br/>
              <span style="color:var(--success); font-weight:800; font-size:10px;">Flow Cascade: ${escapeHtml(s.seq)}</span>
            </div>
          `).join('');
        }
      }
      refreshIcons();
    }

    window.submitCommSms = function() {
      const target = document.getElementById('commSmsTargetGroup').value;
      const snippet = document.getElementById('commSmsBody').value.trim();

      if (!snippet) {
        alert('SMS alert body is required.');
        return;
      }

      window.commState.sms.unshift({
        target, snippet, count: target === 'All Members' ? 2850 : 120
      });
      showToast('SMS message queued for global broadcast.');
      document.getElementById('commSmsBody').value = '';
      bootstrapCommunication();
    };

    window.submitCommSequence = function() {
      const trigger = document.getElementById('commNewSeqTrigger').value;
      const seq = document.getElementById('commNewSeqName').value.trim();

      if (!seq) {
        alert('Cascade Sequence name is required.');
        return;
      }

      window.commState.sequences.push({ trigger, seq });
      showToast('Automated notification sequence flow published.');
      document.getElementById('commNewSeqName').value = '';
      bootstrapCommunication();
    };

    window.openCreateNewsletterModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Newsletter Title</label>
            <input type="text" id="newNewsTitle" class="input" placeholder="e.g. Annual giving ledger and Splits statements" style="width:100%;">
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Compile Email Newsletter',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const title = document.getElementById('newNewsTitle').value.trim();
        if (!title) return;

        window.commState.newsletters.push({
          title, target: 'All Members', status: 'Draft', open: '0%'
        });
        showToast('Email newsletter template created.');
        bootstrapCommunication();
      }
    };

    // --- CRM MODULE LOGIC ---
    window.switchCrmTab = function(tab) {
      window.crmState.activeTab = tab;
      document.querySelectorAll('#crmConsoleContainer .crm-tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('#crmConsoleContainer [data-crm-tab]').forEach(btn => btn.classList.remove('active'));
      const activePanel = document.getElementById('crm' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
      if (activePanel) activePanel.classList.remove('hidden');
      const activeBtn = document.querySelector('#crmConsoleContainer [data-crm-tab="' + tab + '"]');
      if (activeBtn) activeBtn.classList.add('active');
      renderCrmTab(tab);
    };

    window.bootstrapCrm = async function() {
      showToast('Rendering Kanban assimilation card flows...');
      if (window.crmState.tasks.length === 0) {
        window.crmState.tasks = [
          { title: 'Call Peter Obi Convert', agent: 'Bro. Emmanuel', due: '2026-06-01', priority: 'High', reconciled: false },
          { title: 'Deliver Welcome Pack to John Doe', agent: 'Sister Faith', due: '2026-05-31', priority: 'Medium', reconciled: true }
        ];
      }
      loadCrmKanbanBoard();
      window.switchCrmTab(window.crmState.activeTab);
    };

    window.loadCrmKanbanBoard = function() {
      const board = document.getElementById('crmKanbanBoard');
      if (!board) return;

      const members = window.membersState ? window.membersState.members : [];
      const columns = {
        'New Visitor': members.filter(m => m.title === 'New Visitor'),
        'First Follow-up': members.filter(m => m.title === 'New convert'),
        'Cell Connected': members.filter(m => m.title === 'Cell Member'),
        'Integrated Leader': members.filter(m => m.title === 'Cell Leader')
      };

      board.innerHTML = Object.keys(columns).map(colName => {
        const list = columns[colName];
        return `
          <div class="panel" style="min-height:350px;">
            <h3 style="border-bottom:1px solid #1c1e21; padding-bottom:8px; margin-bottom:12px;">${colName} (${list.length})</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${list.map(m => `
                <div style="padding:10px; background:rgba(255,255,255,0.03); border:1px solid #1c1e21; border-radius:4px; cursor:pointer;" onclick="advanceCrmKanbanCard('${m.id}', '${colName}')">
                  <strong>${escapeHtml(m.firstName)} ${escapeHtml(m.lastName)}</strong><br/>
                  <span style="font-size:9px; color:#aaa;">${escapeHtml(m.email)}</span>
                </div>
              `).join('')}
              ${list.length === 0 ? '<p class="muted" style="font-size:10px; text-align:center; padding:20px;">No cards in stage</p>' : ''}
            </div>
          </div>
        `;
      }).join('');
      refreshIcons();
    };

    window.advanceCrmKanbanCard = function(memberId, colName) {
      if (!window.membersState) return;
      const m = window.membersState.members.find(x => x.id === memberId);
      if (!m) return;

      const nextMap = {
        'New Visitor': 'New convert',
        'First Follow-up': 'Cell Member',
        'Cell Connected': 'Cell Leader',
        'Integrated Leader': 'New Visitor'
      };

      m.title = nextMap[colName];
      showToast('Kanban card advanced successfully.');
      loadCrmKanbanBoard();
    };

    function renderCrmTab(tab) {
      if (tab === 'tasks') {
        const tbody = document.getElementById('crmTasksTableBody');
        if (tbody) {
          tbody.innerHTML = window.crmState.tasks.map(t => `
            <tr>
              <td><strong>${escapeHtml(t.title)}</strong></td>
              <td>${escapeHtml(t.agent)}</td>
              <td>${escapeHtml(t.due)}</td>
              <td><span class="badge ${t.priority === 'High' ? 'danger' : 'muted'}">${escapeHtml(t.priority)}</span></td>
              <td><span class="badge ${t.reconciled ? 'success' : 'pending'}">${t.reconciled ? 'Resolved' : 'Pending'}</span></td>
            </tr>
          `).join('');
        }
      } else if (tab === 'analytics') {
        const grid = document.getElementById('crmStatsGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">RETENTION SPEED SLA</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">3 Days</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">RETENTION SCALE RATE</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">84.2 %</h2>
            </div>
            <div class="panel" style="text-align:center;">
              <h4 class="muted" style="font-size:10px;">CONVERSION RETENTION DIGEST</h4>
              <h2 style="font-size:24px; font-weight:800; color:var(--success); margin-top:5px;">120 Converts</h2>
            </div>
          `;
        }
      }
      refreshIcons();
    }

    window.openCreateCrmTaskModal = async function() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
          <div class="field">
            <label>Task Description</label>
            <input type="text" id="newCrmTaskTitle" class="input" placeholder="e.g. Call Peter Obi Convert" style="width:100%;">
          </div>
          <div class="field">
            <label>Priority</label>
            <select id="newCrmTaskPriority" class="select" style="width:100%;">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      `;

      const confirm = await showSystemModal({
        type: 'confirm',
        title: 'Register CRM Care Task',
        message: html,
        showCancel: true
      });

      if (confirm) {
        const title = document.getElementById('newCrmTaskTitle').value.trim();
        const priority = document.getElementById('newCrmTaskPriority').value;

        if (!title) return;

        window.crmState.tasks.unshift({
          title, agent: 'Bro. Emmanuel', due: new Date().toISOString().split('T')[0], priority, reconciled: false
        });
        showToast('CRM follow-up task registered.');
        bootstrapCrm();
      }
    };
