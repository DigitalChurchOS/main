// ----------------------------------------------------
// Ecclesia Theme - Cinematic Livestream Controller
// ----------------------------------------------------

(function() {
  // Add cinema-mode dark styling class to body
  document.body.classList.add('cinema-mode');

  // 1. Initialise Lucide icons
  lucide.createIcons();

  // 2. Global UI elements & Toast Notification
  const toast = document.getElementById('toast');
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function requestCustomInput(options) {
    if (window.churchosRequestInput) {
      return window.churchosRequestInput(options);
    }

    return new Promise((resolve) => {
      const layer = document.createElement('div');
      layer.className = 'custom-input-layer';
      layer.style.cssText = 'position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.58);backdrop-filter:blur(10px);';
      layer.innerHTML = `
        <form novalidate style="width:min(420px,100%);display:grid;gap:16px;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:#111827;color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.35);">
          <div>
            <h2 style="margin:0 0 8px;font-size:24px;">${escapeHtml(options.title || 'Input needed')}</h2>
            <p style="margin:0;color:rgba(255,255,255,.72);line-height:1.5;">${escapeHtml(options.message || '')}</p>
          </div>
          <label style="display:grid;gap:7px;font-size:13px;font-weight:800;color:rgba(255,255,255,.72);">
            ${escapeHtml(options.label || 'Response')}
            <input type="${escapeHtml(options.inputType || 'text')}" value="${escapeHtml(options.defaultValue || '')}" style="width:100%;min-height:44px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;padding:10px 12px;outline:none;">
          </label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="submit" style="border:0;border-radius:999px;background:#fff;color:#111827;padding:11px 18px;font-weight:850;">Submit</button>
            <button type="button" data-cancel style="border:1px solid rgba(255,255,255,.2);border-radius:999px;background:transparent;color:#fff;padding:11px 18px;font-weight:850;">Cancel</button>
          </div>
        </form>
      `;
      const form = layer.querySelector('form');
      const input = layer.querySelector('input');
      const cleanup = (value) => {
        layer.remove();
        resolve(value);
      };
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        cleanup(input.value.trim() || null);
      });
      layer.querySelector('[data-cancel]').addEventListener('click', () => cleanup(null));
      document.body.appendChild(layer);
      input.focus();
    });
  }

  // 3. Live Stream State Config
  // Toggle this to test upcoming countdown state vs live video broadcast state
  const isLive = true; 
  const countdownCard = document.getElementById('countdownCard');
  const statePill = document.getElementById('statePill');
  const playerStatus = document.getElementById('playerStatus');
  const playIcon = document.getElementById('playIcon');

  if (isLive) {
    if (countdownCard) countdownCard.style.display = 'none';
  } else {
    // Hide player controls in offline state
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.style.display = 'none';
    const lowerThird = document.querySelector('.lower-third');
    if (lowerThird) lowerThird.style.display = 'none';

    if (countdownCard) countdownCard.style.display = 'block';

    if (statePill) {
      statePill.innerHTML = '<i data-lucide="timer"></i> Upcoming livestream';
      statePill.classList.remove('live-pill');
      statePill.classList.add('eyebrow');
    }
    if (playerStatus) {
      playerStatus.innerHTML = '<i data-lucide="timer"></i> OFFLINE';
      playerStatus.classList.remove('live');
      playerStatus.style.background = 'rgba(255, 255, 255, 0.15)';
    }
    if (playIcon) {
      playIcon.setAttribute('data-lucide', 'timer');
    }
    lucide.createIcons();
  }

  // 4. Live Countdown Timer Logic
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3); // 3 days in the future
  targetDate.setHours(9, 30, 0, 0);

  function updateCountdown() {
    const diff = Math.max(0, targetDate - new Date());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;
    const seconds = Math.floor(diff / 1000) % 60;

    const els = { days, hours, minutes, seconds };
    Object.entries(els).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    });
  }
  updateCountdown();
  const timerInterval = setInterval(updateCountdown, 1000);

  // 5. Interactive Panels Tab Switcher (Chat, Bible, Notes)
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetPanel = document.getElementById(tab.dataset.panel);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // 6. Live Chat Interaction & Mock Responses
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChat');
  const chatList = document.getElementById('chatList');

  function sendChatMessage() {
    if (!chatInput || !chatInput.value.trim() || !chatList) return;
    
    // Add user message
    const userMsg = chatInput.value.trim();
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `<strong>You</strong><p>${userMsg}</p>`;
    chatList.appendChild(item);
    chatList.scrollTop = chatList.scrollHeight;
    chatInput.value = '';
    showToast('Message sent');

    // Trigger mock response after 1.5 seconds
    setTimeout(() => {
      const hostItem = document.createElement('div');
      hostItem.className = 'chat-item host';
      hostItem.innerHTML = `<strong>Grace Online Host</strong><p>Thank you for chatting! We're glad to have you worshipping with us today. Let us know if you need prayer!</p>`;
      chatList.appendChild(hostItem);
      chatList.scrollTop = chatList.scrollHeight;
      lucide.createIcons();
    }, 1500);
  }

  sendChatBtn?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });

  // 7. Interactive Bible scripture engagement
  document.querySelectorAll('.scripture-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scripture-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const ref = btn.dataset.ref;
      const text = btn.dataset.text;

      const bibleRef = document.getElementById('bibleRef');
      const bibleText = document.getElementById('bibleText');
      if (bibleRef && bibleText) {
        bibleRef.innerHTML = `<i data-lucide="book"></i> ${ref}`;
        bibleText.innerHTML = text;
        lucide.createIcons();
      }
      showToast(`Loaded ${ref}`);
    });
  });

  // 8. Sermon Notes Auto-save & Custom Exports
  const notesArea = document.getElementById('notesArea');
  const saveNotesBtn = document.getElementById('saveNotes');
  const emailNotesBtn = document.getElementById('emailNotes');
  const downloadNotesBtn = document.getElementById('downloadNotes');

  // Load persisted notes
  if (notesArea) {
    const persisted = localStorage.getItem('sermon_notes');
    if (persisted) notesArea.value = persisted;

    // Auto-save notes on typing
    notesArea.addEventListener('input', () => {
      localStorage.setItem('sermon_notes', notesArea.value);
    });
  }

  saveNotesBtn?.addEventListener('click', () => {
    if (notesArea) {
      localStorage.setItem('sermon_notes', notesArea.value);
      showToast('Sermon notes saved locally');
    }
  });

  emailNotesBtn?.addEventListener('click', async () => {
    const notes = notesArea ? notesArea.value.trim() : '';
    if (!notes) {
      showToast('Notes pad is empty!');
      return;
    }
    const email = await requestCustomInput({
      title: 'Send Sermon Notes',
      message: 'Enter the email address that should receive your notes.',
      label: 'Email address',
      inputType: 'email',
      defaultValue: localStorage.getItem('user_email') || '',
    });
    if (email === null) return;
    if (!email.trim() || !email.includes('@')) {
      showToast('Invalid email address');
      return;
    }
    localStorage.setItem('user_email', email);
    showToast('Sending notes email...');

    setTimeout(() => {
      showToast(`Sermon notes emailed to ${email}`);
    }, 1200);
  });

  downloadNotesBtn?.addEventListener('click', () => {
    const notes = notesArea ? notesArea.value.trim() : '';
    if (!notes) {
      showToast('Notes pad is empty!');
      return;
    }

    const documentContent = `GRACE CITY CHURCH - SERMON NOTES
-----------------------------------------
Date: ${new Date().toLocaleDateString()}
Speaker: Pastor Daniel Grace
Sermon Series: Spirit and Truth
Scripture Focus: Romans 8:14-17

YOUR PERSONAL SERMON NOTES:
-----------------------------------------
${notes}

-----------------------------------------
Thank you for joining our livestream! Keep growing in the Word.`;

    const blob = new Blob([documentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GraceCityChurch-SermonNotes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sermon Notes downloaded');
  });

  // 9. Language / Audio track interpretation selector
  document.querySelectorAll('input[name="audioLanguage"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      let title = 'English (Original Audio)';
      if (val === 'es') title = 'Español (Interpretación en Español)';
      if (val === 'fr') title = 'Français (Traduction en Français)';

      const activeLabel = document.getElementById('activeAudioTrack');
      if (activeLabel) {
        activeLabel.textContent = `Audio channel: ${title}`;
      }
      showToast(`Audio track switched to: ${title}`);
    });
  });

  // 10. Live Video Player Play/Pause and Mute Controls
  let isPlaying = false;
  let isMuted = false;
  const playBtn = document.getElementById('playBtn');
  const muteBtn = document.getElementById('muteBtn');
  const player = document.querySelector('.cinema-player');

  playBtn?.addEventListener('click', () => {
    if (!isLive) {
      showToast('Livestream is currently offline.');
      return;
    }
    isPlaying = !isPlaying;
    if (playIcon) {
      if (isPlaying) {
        playIcon.setAttribute('data-lucide', 'pause');
        if (player) {
          player.style.backgroundImage = "linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.68)), url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=85')";
        }
        showToast('Worship stream broadcast playing...');
      } else {
        playIcon.setAttribute('data-lucide', 'play');
        if (player) {
          player.style.backgroundImage = "linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.68)), url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=85')";
        }
        showToast('Broadcast paused');
      }
      lucide.createIcons();
    }
  });

  muteBtn?.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
    showToast(isMuted ? 'Stream muted' : 'Stream unmuted');
    lucide.createIcons();
  });

  // 11. Modal Interactive Call-to-actions (Salvation & Prayer)
  const salvationModal = document.getElementById('salvationModal');
  const closeSalvationModal = document.getElementById('closeSalvationModal');
  const salvationForm = document.getElementById('salvationForm');
  const salvationSuccess = document.getElementById('salvationSuccess');

  const prayerModal = document.getElementById('prayerModal');
  const closePrayerModal = document.getElementById('closePrayerModal');
  const prayerForm = document.getElementById('prayerForm');
  const prayerSuccess = document.getElementById('prayerSuccess');

  function openSalvation() {
    if (salvationModal) {
      salvationModal.style.display = 'grid';
      if (salvationForm) salvationForm.style.display = 'block';
      if (salvationSuccess) salvationSuccess.style.display = 'none';
    }
  }

  function openPrayer() {
    if (prayerModal) {
      prayerModal.style.display = 'grid';
      if (prayerForm) prayerForm.style.display = 'block';
      if (prayerSuccess) prayerSuccess.style.display = 'none';
    }
  }

  document.getElementById('salvationActionBtn')?.addEventListener('click', openSalvation);
  document.getElementById('mobileBtnSalvation')?.addEventListener('click', openSalvation);

  document.getElementById('prayerActionBtn')?.addEventListener('click', openPrayer);
  document.getElementById('mobileBtnPrayer')?.addEventListener('click', openPrayer);

  closeSalvationModal?.addEventListener('click', () => {
    if (salvationModal) salvationModal.style.display = 'none';
  });

  closePrayerModal?.addEventListener('click', () => {
    if (prayerModal) prayerModal.style.display = 'none';
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === salvationModal) salvationModal.style.display = 'none';
    if (e.target === prayerModal) prayerModal.style.display = 'none';
  });

  salvationForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('salvationName').value.trim();
    if (!name) return;

    if (salvationForm) salvationForm.style.display = 'none';
    if (salvationSuccess) salvationSuccess.style.display = 'block';
    showToast('Salvation response registered!');

    // Celebration message in chat after 1.2s
    setTimeout(() => {
      if (chatList) {
        const item = document.createElement('div');
        item.className = 'chat-item host';
        item.innerHTML = `<strong>Grace Online Host</strong><p>Praise God! ${name} just made a decision for Christ today! Let's celebrate and welcome them to the family of God! 🎉🙌</p>`;
        chatList.appendChild(item);
        chatList.scrollTop = chatList.scrollHeight;
        lucide.createIcons();
      }
    }, 1200);
  });

  prayerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('prayerName').value.trim();
    const content = document.getElementById('prayerContent').value.trim();
    if (!name || !content) return;

    if (prayerForm) prayerForm.style.display = 'none';
    if (prayerSuccess) prayerSuccess.style.display = 'block';
    showToast('Prayer request submitted!');

    // Show request in chat panel after 1 second
    setTimeout(() => {
      if (chatList) {
        const item = document.createElement('div');
        item.className = 'chat-item host';
        item.innerHTML = `<strong>Prayer Team</strong><p>We are standing in agreement with ${name} for their prayer request: "${content.substring(0, 70)}${content.length > 70 ? '...' : ''}"</p>`;
        chatList.appendChild(item);
        chatList.scrollTop = chatList.scrollHeight;
        lucide.createIcons();
      }
    }, 1000);
  });

  // Giving button triggers (mobile)
  document.getElementById('mobileBtnGiving')?.addEventListener('click', () => {
    if (window.navigateToPage) {
      window.navigateToPage('giving.html');
    } else {
      window.location.href = 'giving.html';
    }
  });

  // Reminder trigger
  document.getElementById('reminderBtn')?.addEventListener('click', async () => {
    const contact = await requestCustomInput({
      title: 'Set Livestream Reminder',
      message: 'Enter a phone number or email for reminder notifications.',
      label: 'Contact',
      defaultValue: localStorage.getItem('user_contact') || '',
    });
    if (contact === null) return;
    if (!contact.trim()) {
      showToast('Please enter contact info.');
      return;
    }
    localStorage.setItem('user_contact', contact);
    showToast(`Reminders set! We will notify you at ${contact} 15m before stream.`);
  });

  // Share link trigger
  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href)
        .then(() => showToast('Livestream share link copied!'))
        .catch(() => showToast('Failed to copy link.'));
    });
  });

  // Cleanup on PJAX route out
  const checkOutlet = setInterval(() => {
    if (!document.getElementById('countdownCard') && !document.getElementById('toast')) {
      document.body.classList.remove('cinema-mode');
      clearInterval(timerInterval);
      clearInterval(checkOutlet);
    }
  }, 1000);

})();
