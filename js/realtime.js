// ==========================================
// Realtime: Supabase subscriptions for live dashboard updates
// Depends on: supabase-init.js, auth.js
// ==========================================

const RealtimeManager = {

  _channels: [],
  _userId: null,

  _sanitize(str) {
    return typeof clanaUtils !== 'undefined' ? clanaUtils.sanitizeHtml(str) : str;
  },

  // ==========================================
  // INIT — Subscribe to all relevant tables
  // ==========================================

  async init() {
    this.destroy(); // clean up previous subscriptions

    try {
      const user = await auth.getUser();
      if (!user) return;
      this._userId = user.id;
    } catch (e) {
      return;
    }

    this._subscribeCalls();
    this._subscribeAppointments();
    this._subscribeLeads();
    this._subscribeMessages();
    this._subscribeTasks();
  },

  // ==========================================
  // CALLS — Live new call updates
  // ==========================================

  _subscribeCalls() {
    const channel = supabaseClient
      .channel('realtime-calls')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls'
      }, (payload) => {
        if (payload.new && payload.new.user_id === this._userId) {
          this._onNewCall(payload.new);
        }
      })
      .subscribe();

    this._channels.push(channel);
  },

  _onNewCall(call) {
    // Refresh metric cards
    if (typeof HomeWidgets !== 'undefined') {
      HomeWidgets.loadMetricCards();
      HomeWidgets.loadRecentCalls();
    }

    // Show toast notification (sanitized)
    const phone = this._sanitize(call.phone_number || 'Unbekannt');
    const status = call.status || '';
    if (typeof showToast !== 'undefined') {
      showToast('Neuer Anruf: ' + phone + (status === 'missed' ? ' (verpasst)' : ''));
    }

    // Update call count badge in sidebar if visible
    const badge = document.getElementById('allCallsCount');
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      badge.textContent = (current + 1) + ' Anrufe';
    }
  },

  // ==========================================
  // APPOINTMENTS — Live appointment changes
  // ==========================================

  _subscribeAppointments() {
    const channel = supabaseClient
      .channel('realtime-appointments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        // Only react to own appointments
        if (payload.new && payload.new.user_id && payload.new.user_id !== this._userId) return;
        this._onAppointmentChange(payload);
      })
      .subscribe();

    this._channels.push(channel);
  },

  _onAppointmentChange(payload) {
    // Refresh today's appointments widget on home
    if (typeof HomeWidgets !== 'undefined') {
      HomeWidgets.loadTodayAppointments();
    }

    // Refresh appointments page if currently visible
    const apptPage = document.getElementById('page-appointments');
    if (apptPage && apptPage.classList.contains('active') && typeof AppointmentsPage !== 'undefined') {
      AppointmentsPage.loadAppointments();
    }

    // Toast for new appointments (sanitized)
    if (payload.eventType === 'INSERT' && payload.new) {
      const name = this._sanitize(payload.new.customer_name || payload.new.name || 'Neuer Termin');
      if (typeof showToast !== 'undefined') {
        showToast('Neuer Termin: ' + name);
      }
    }
  },

  // ==========================================
  // LEADS — Live new lead updates
  // ==========================================

  _subscribeLeads() {
    const channel = supabaseClient
      .channel('realtime-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        if (!payload.new) return;
        const name = this._sanitize(payload.new.company_name || 'Neuer Lead');
        if (typeof showToast !== 'undefined') showToast('Neuer Lead: ' + name);
      })
      .subscribe();
    this._channels.push(channel);
  },

  // ==========================================
  // MESSAGES — Live message updates
  // ==========================================

  _subscribeMessages() {
    const channel = supabaseClient
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (!payload.new || payload.new.sender_id === this._userId) return;
        if (typeof showToast !== 'undefined') showToast('Neue Nachricht eingegangen');
        // Update unread badge if exists
        const badge = document.getElementById('msg-unread-badge');
        if (badge) {
          const count = parseInt(badge.textContent) || 0;
          badge.textContent = count + 1;
          badge.style.display = 'inline-flex';
        }
      })
      .subscribe();
    this._channels.push(channel);
  },

  // ==========================================
  // TASKS — Live task updates
  // ==========================================

  _subscribeTasks() {
    const channel = supabaseClient
      .channel('realtime-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (!payload.new) return;
        // Only react to tasks assigned to me or created by me
        if (payload.new.assigned_to !== this._userId && payload.new.created_by !== this._userId) return;
        if (payload.eventType === 'INSERT') {
          const title = this._sanitize(payload.new.title || 'Neue Aufgabe');
          if (typeof showToast !== 'undefined') showToast('Neue Aufgabe: ' + title);
        }
      })
      .subscribe();
    this._channels.push(channel);
  },

  // ==========================================
  // CLEANUP
  // ==========================================

  destroy() {
    this._channels.forEach(ch => {
      try { supabaseClient.removeChannel(ch); } catch (e) { /* ignore */ }
    });
    this._channels = [];
  }
};

window.RealtimeManager = RealtimeManager;
