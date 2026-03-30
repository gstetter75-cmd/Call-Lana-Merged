// ==========================================
// Referral System: Generate referral links,
// show stats, share via WhatsApp/Email
// Depends on: auth.js, supabase-init.js
// ==========================================

const Referral = {

  async init() {
    const container = document.getElementById('tab-referral');
    if (!container) return;

    try {
      const user = await auth.getUser();
      if (!user) return;

      const userId = user.id;
      const referralLink = 'https://call-lana.de/registrierung.html?ref=' + userId;

      // Placeholder stats (replace with real DB query later)
      const stats = await this._loadStats(userId);

      container.innerHTML = this._renderContent(referralLink, stats);
      this._bindEvents(referralLink);
    } catch (err) {
      if (typeof Logger !== 'undefined') Logger.warn('Referral.init', err);
      container.innerHTML = '<div style="color:var(--tx3);text-align:center;padding:40px;">Fehler beim Laden des Empfehlungsprogramms.</div>';
    }
  },

  async _loadStats(_userId) {
    // Placeholder data — replace with Supabase query when referral table exists
    return { sent: 3, successful: 1 };
  },

  _renderContent(link, stats) {
    var escapedLink = link.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return '' +
      '<div class="sc-section">' +
        '<h2>Freunde werben</h2>' +
        '<p>Teile deinen persoenlichen Empfehlungslink und erhalte Belohnungen fuer jede erfolgreiche Anmeldung.</p>' +

        '<div class="info-box" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
          '<span style="font-size:20px;">🎁</span>' +
          '<span>Fuer jede erfolgreiche Empfehlung erhaeltst du <strong>1 Monat gratis!</strong></span>' +
        '</div>' +

        // Referral link with copy button
        '<label style="margin-bottom:8px;display:block;">Dein Empfehlungslink</label>' +
        '<div style="display:flex;gap:8px;margin-bottom:24px;">' +
          '<input type="text" class="finp" id="referralLinkInput" value="' + escapedLink + '" readonly style="flex:1;font-size:13px;">' +
          '<button class="btn-save" id="copyReferralBtn" style="white-space:nowrap;padding:12px 20px;">Kopieren</button>' +
        '</div>' +

        // Stats
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">' +
          '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:800;color:var(--pu);">' + stats.sent + '</div>' +
            '<div style="font-size:12px;color:var(--tx3);margin-top:4px;">Einladungen versendet</div>' +
          '</div>' +
          '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:800;color:var(--green);">' + stats.successful + '</div>' +
            '<div style="font-size:12px;color:var(--tx3);margin-top:4px;">Erfolgreich geworben</div>' +
          '</div>' +
        '</div>' +

        // Share buttons
        '<label style="margin-bottom:12px;display:block;">Jetzt teilen</label>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button class="btn-save" id="shareWhatsApp" style="background:#25D366;box-shadow:none;padding:10px 20px;font-size:13px;">' +
            '💬 WhatsApp' +
          '</button>' +
          '<button class="btn-secondary" id="shareEmail" style="padding:10px 20px;font-size:13px;">' +
            '✉️ E-Mail' +
          '</button>' +
        '</div>' +
      '</div>';
  },

  _bindEvents(link) {
    var copyBtn = document.getElementById('copyReferralBtn');
    var linkInput = document.getElementById('referralLinkInput');

    if (copyBtn && linkInput) {
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(link).then(function() {
          copyBtn.textContent = 'Kopiert!';
          setTimeout(function() { copyBtn.textContent = 'Kopieren'; }, 2000);
        }).catch(function() {
          // Fallback: select input text
          linkInput.select();
          document.execCommand('copy');
          copyBtn.textContent = 'Kopiert!';
          setTimeout(function() { copyBtn.textContent = 'Kopieren'; }, 2000);
        });
      });
    }

    var whatsAppBtn = document.getElementById('shareWhatsApp');
    if (whatsAppBtn) {
      whatsAppBtn.addEventListener('click', function() {
        var text = 'Hey! Ich nutze Call Lana als KI-Telefonassistentin und bin begeistert. Teste es selbst: ' + link;
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
      });
    }

    var emailBtn = document.getElementById('shareEmail');
    if (emailBtn) {
      emailBtn.addEventListener('click', function() {
        var subject = 'Call Lana — Deine KI-Telefonassistentin';
        var body = 'Hallo!\n\nIch nutze Call Lana als KI-Telefonassistentin und bin begeistert. ' +
          'Nie wieder verpasste Anrufe!\n\nRegistriere dich hier: ' + link + '\n\nViele Gruesse';
        window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });
    }
  }
};

window.Referral = Referral;
