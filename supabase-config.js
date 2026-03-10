// Supabase Configuration
const SUPABASE_URL = 'https://odcyprmamhlsadsaoqfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3lwcm1hbWhsc2Fkc2FvcWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDg1NjAsImV4cCI6MjA4Njk4NDU2MH0.UgoqTRBn_tqq-avoX2NYy6PVW0xwCyUD0TI_Hr2ccqU';

// HIER IST DIE ÄNDERUNG: Wir nennen es jetzt "supabaseClient"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Helper Functions
const auth = {
  async signUp(email, password, userData) {
    try {
      // Ab hier nutzen wir überall supabaseClient
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: userData }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Anmeldung fehlgeschlagen. Bitte pruefen Sie Ihre Zugangsdaten.' };
    }
  },

  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
    }
  },

  async getUser() {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  async updateProfile(updates) {
    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        data: updates
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Profil konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.' };
    }
  },

  async resetPassword(email) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Passwort-Zuruecksetzung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
    }
  }
};

// Database Helper Functions
const db = {
  async saveCall(callData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('calls')
        .insert([{
          user_id: user.id,
          phone_number: callData.phoneNumber,
          duration: callData.duration,
          status: callData.status,
          transcript: callData.transcript,
          created_at: callData.timestamp || new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Save call error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getCalls(limit = 50) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get calls error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getStats(startDate, endDate) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const totalCalls = data.length;
      const totalDuration = data.reduce((sum, call) => sum + (call.duration || 0), 0);
      const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      const statuses = data.reduce((acc, call) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        stats: { totalCalls, totalDuration, avgDuration, statuses }
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async saveSettings(settings) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('user_settings')
        .upsert([{
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Save settings error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getSettings() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return { success: true, data: data?.settings || {} };
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Assistants CRUD ======

  async getAssistants() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('assistants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get assistants error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getAssistant(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('assistants')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get assistant error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createAssistant(assistantData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('assistants')
        .insert([{ user_id: user.id, ...assistantData }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create assistant error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateAssistant(id, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('assistants')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update assistant error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteAssistant(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('assistants')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete assistant error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Profiles CRUD ======

  async getProfile(userId) {
    try {
      const user = userId || (await auth.getUser())?.id;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*, organizations(name, plan)')
        .eq('id', user)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateProfile(userId, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (user.id !== userId && user.user_metadata?.role !== 'superadmin') {
        throw new Error('Unauthorized: can only update own profile');
      }

      const { data, error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getAllProfiles(filters = {}) {
    try {
      let query = supabaseClient
        .from('profiles')
        .select('*, organizations(name, plan)')
        .order('created_at', { ascending: false });

      if (filters.role) query = query.eq('role', filters.role);
      if (filters.organization_id) query = query.eq('organization_id', filters.organization_id);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get all profiles error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Organizations CRUD ======

  async getOrganizations() {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*, profiles!organizations_owner_id_fkey(first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get organizations error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getOrganization(id) {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*, organization_members(*, profiles(first_name, last_name, email, role))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get organization error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createOrganization(orgData) {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create organization error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateOrganization(id, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update organization error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Organization Members ======

  async addOrgMember(orgId, userId, roleInOrg = 'member') {
    try {
      const { data, error } = await supabaseClient
        .from('organization_members')
        .insert([{ organization_id: orgId, user_id: userId, role_in_org: roleInOrg }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Add org member error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async removeOrgMember(orgId, userId) {
    try {
      const { error } = await supabaseClient
        .from('organization_members')
        .delete()
        .eq('organization_id', orgId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Remove org member error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== CRM: Leads ======

  async getLeads(filters = {}) {
    try {
      let query = supabaseClient
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get leads error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getLead(id) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(first_name, last_name, email), notes(*, profiles!notes_author_id_fkey(first_name, last_name))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get lead error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createLead(leadData) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create lead error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateLead(id, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update lead error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteLead(id) {
    try {
      const { error } = await supabaseClient
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete lead error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== CRM: Tasks ======

  async getTasks(filters = {}) {
    try {
      let query = supabaseClient
        .from('tasks')
        .select('*, profiles!tasks_assigned_to_fkey(first_name, last_name), leads(company_name)')
        .order('due_date', { ascending: true });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get tasks error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createTask(taskData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{ created_by: user.id, ...taskData }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateTask(id, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update task error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteTask(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== CRM: Notes ======

  async createNote(noteData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('notes')
        .insert([{ author_id: user.id, ...noteData }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Create note error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteNote(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete note error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Availability ======

  async getAvailability(userId, startDate, endDate) {
    try {
      let query = supabaseClient
        .from('availability')
        .select('*, profiles!availability_user_id_fkey(first_name, last_name)')
        .order('date', { ascending: true });

      if (userId) query = query.eq('user_id', userId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get availability error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async setAvailability(availabilityData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('availability')
        .insert([{ user_id: user.id, ...availabilityData }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Set availability error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteAvailability(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete availability error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Messaging / Chat ======

  async getConversations() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('conversations')
        .select('*, conversation_participants(user_id, profiles(first_name, last_name, role)), messages(content, created_at, sender_id)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get conversations error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getMessages(conversationId, limit = 100) {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(first_name, last_name, role)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createConversation(participantIds, subject, type = 'direct') {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: conv, error: convError } = await supabaseClient
        .from('conversations')
        .insert([{ created_by: user.id, subject, type }])
        .select()
        .single();

      if (convError) throw convError;

      const allParticipants = [...new Set([user.id, ...participantIds])];
      const { error: partError } = await supabaseClient
        .from('conversation_participants')
        .insert(allParticipants.map(uid => ({
          conversation_id: conv.id,
          user_id: uid
        })));

      if (partError) throw partError;
      return { success: true, data: conv };
    } catch (error) {
      console.error('Create conversation error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async sendMessage(conversationId, content) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('messages')
        .insert([{ conversation_id: conversationId, sender_id: user.id, content }])
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabaseClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, data };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async markConversationRead(conversationId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Mark read error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Contact Form → Lead ======

  async submitContactForm(formData) {
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim().length < 2) throw new Error('Name is required');
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) throw new Error('Valid email is required');

      // Client-side rate limit
      const lastSubmit = parseInt(sessionStorage.getItem('lastContactSubmit') || '0');
      if (Date.now() - lastSubmit < 30000) throw new Error('Please wait before submitting again');
      sessionStorage.setItem('lastContactSubmit', Date.now().toString());

      // Save as lead (no auth required for public form)
      const { data, error } = await supabaseClient
        .from('leads')
        .insert([{
          company_name: formData.company || formData.name || 'Unbekannt',
          contact_name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          source: 'website',
          notes: formData.message || '',
          status: 'new'
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Contact form error:', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  }
};

// Utility Functions
const utils = {
  async isAuthenticated() {
    const session = await auth.getSession();
    return !!session;
  },

  async requireAuth(redirectUrl = 'login.html') {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  },

  sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^[+]?[\d\s()-]{6,20}$/.test(phone);
  }
};

window.clanaAuth = auth;
window.clanaDB = db;
window.clanaUtils = utils;