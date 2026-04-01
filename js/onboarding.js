// ==========================================
// Onboarding Checklist for Customer Dashboard
// Depends on: db.js, dashboard-components.js
// ==========================================

if (typeof SafeActions !== 'undefined') {
  SafeActions.register('navigate-page', (id) => {
    if (typeof navigateToPage === 'function') navigateToPage(id);
  });
}

const Onboarding = {
  steps: [
    { key: 'create_assistant', label: 'KI-Assistenten erstellen', desc: 'Erstelle deinen ersten Telefon-Assistenten', icon: '🤖', page: 'assistants' },
    { key: 'assign_number', label: 'Telefonnummer zuweisen', desc: 'Weise deinem Assistenten eine Nummer zu', icon: '📞', page: 'phones' },
    { key: 'configure_greeting', label: 'Begrüßung konfigurieren', desc: 'Passe die Begrüßung deines Assistenten an', icon: '👋', page: 'assistants' },
    { key: 'first_test_call', label: 'Testanruf durchführen', desc: 'Rufe deine Nummer an und teste den Assistenten', icon: '✅', page: 'transactions' },
    { key: 'go_live', label: 'Live schalten', desc: 'Aktiviere deinen Assistenten für echte Anrufe', icon: '🚀', page: 'home' }
  ],

  container: null,
  completedSteps: new Set(),

  async init(userId) {
    this.userId = userId;
    this.container = document.getElementById('onboarding-section');
    if (!this.container) return;

    // Load progress
    const result = await clanaDB.getOnboardingProgress(userId);
    const completed = result.data || [];
    this.completedSteps = new Set(completed.map(c => c.step_key));

    // Auto-detect completed steps
    await this.autoDetect();

    // All steps done — celebrate and hide
    if (this.completedSteps.size >= this.steps.length) {
      if (!sessionStorage.getItem('onboarding_celebrated')) {
        sessionStorage.setItem('onboarding_celebrated', '1');
        this.celebrate();
      }
      this.container.style.display = 'none';
      return;
    }

    this.render();
  },

  async autoDetect() {
    try {
      const result = await clanaDB.getAssistants();
      const assistants = result.data || [];

      // Step 1: Assistant exists
      if (!this.completedSteps.has('create_assistant') && assistants.length > 0) {
        this.completedSteps.add('create_assistant');
        clanaDB.completeOnboardingStep(this.userId, 'create_assistant');
      }

      // Step 2: Assistant has phone number
      if (!this.completedSteps.has('assign_number') && assistants.some(a => a.phone_number)) {
        this.completedSteps.add('assign_number');
        clanaDB.completeOnboardingStep(this.userId, 'assign_number');
      }

      // Step 3: Assistant has greeting configured
      if (!this.completedSteps.has('configure_greeting') && assistants.some(a => a.greeting && a.greeting.trim().length > 0)) {
        this.completedSteps.add('configure_greeting');
        clanaDB.completeOnboardingStep(this.userId, 'configure_greeting');
      }

      // Step 4: At least one call exists
      if (!this.completedSteps.has('first_test_call')) {
        const calls = await supabaseClient
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', await auth.getEffectiveUserId());
        if (calls.count > 0) {
          this.completedSteps.add('first_test_call');
          clanaDB.completeOnboardingStep(this.userId, 'first_test_call');
        }
      }

      // Step 5: Assistant is live (status = active/online)
      if (!this.completedSteps.has('go_live') && assistants.some(a => a.status === 'active' || a.status === 'online')) {
        this.completedSteps.add('go_live');
        clanaDB.completeOnboardingStep(this.userId, 'go_live');
      }
    } catch (err) {
      Logger.error('Onboarding.autoDetect', err);
    }
  },

  render() {
    const total = this.steps.length;
    const done = this.completedSteps.size;
    const pct = Math.round((done / total) * 100);

    this.container.innerHTML = `
      <div class="card" style="margin-bottom:20px;position:relative;">
        <button onclick="document.getElementById('onboarding-section').style.display='none'" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--tx3);cursor:pointer;font-size:16px;" title="Ausblenden">&times;</button>
        <div style="margin-bottom:14px;">
          <h3 style="margin:0 0 4px;font-size:16px;">Willkommen bei Call Lana! 🎉</h3>
          <p style="margin:0;font-size:13px;color:var(--tx3);">Schließe diese Schritte ab, um deinen KI-Assistenten einzurichten.</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:var(--pu);border-radius:4px;transition:width .5s;"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:var(--tx3);">${done}/${total}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${this.steps.map(s => {
            const isDone = this.completedSteps.has(s.key);
            return `<div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;background:${isDone ? 'var(--bg3)' : 'transparent'};cursor:${isDone ? 'default' : 'pointer'};opacity:${isDone ? '0.6' : '1'};" ${!isDone ? `data-action="navigate-page" data-id="${clanaUtils.sanitizeAttr(s.page)}"` : ''}>
              <span style="font-size:20px;">${isDone ? '✅' : s.icon}</span>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;${isDone ? 'text-decoration:line-through;' : ''}">${s.label}</div>
                <div style="font-size:11px;color:var(--tx3);">${s.desc}</div>
              </div>
              ${!isDone ? '<span style="font-size:12px;color:var(--pu);">→</span>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
    this.container.style.display = 'block';
  },

  celebrate() {
    if (typeof Confetti !== 'undefined') Confetti.fire();
    if (typeof Toast !== 'undefined') {
      Toast.success('Geschafft! Dein KI-Assistent ist einsatzbereit. 🎉');
    }
  }
};

window.Onboarding = Onboarding;
