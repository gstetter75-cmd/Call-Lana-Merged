// Database Helper Functions
// Depends on: supabase-init.js (supabaseClient), auth.js (auth), logger.js (Logger)
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
      Logger.error('db.saveCall', error);
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
      Logger.error('db.getCalls', error);
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
      Logger.error('db.getStats', error);
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
      Logger.error('db.saveSettings', error);
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
      Logger.error('db.getSettings', error);
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
      Logger.error('db.getAssistants', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getAllAssistants() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('assistants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getAllAssistants', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten.' };
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
      Logger.error('db.getAssistant', error);
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
      Logger.error('db.createAssistant', error);
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
      Logger.error('db.updateAssistant', error);
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
      Logger.error('db.deleteAssistant', error);
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
      Logger.error('db.getProfile', error);
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
      Logger.error('db.updateProfile', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getAllProfiles(filters = {}) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      Logger.error('db.getAllProfiles', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Organizations CRUD ======

  async getOrganizations() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*, profiles!organizations_owner_id_fkey(first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getOrganizations', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getOrganization(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('organizations')
        .select('*, organization_members(*, profiles(first_name, last_name, email, role))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.getOrganization', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createOrganization(orgData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.createOrganization', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateOrganization(id, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.updateOrganization', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Organization Members ======

  async addOrgMember(orgId, userId, roleInOrg = 'member') {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('organization_members')
        .insert([{ organization_id: orgId, user_id: userId, role_in_org: roleInOrg }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.addOrgMember', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async removeOrgMember(orgId, userId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('organization_members')
        .delete()
        .eq('organization_id', orgId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.removeOrgMember', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== CRM: Leads ======

  async getLeads(filters = {}) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      Logger.error('db.getLeads', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getLead(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(first_name, last_name, email), notes(*, profiles!notes_author_id_fkey(first_name, last_name))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.getLead', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async createLead(leadData) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.createLead', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateLead(id, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.updateLead', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async deleteLead(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.deleteLead', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== CRM: Tasks ======

  async getTasks(filters = {}) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      Logger.error('db.getTasks', error);
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
      Logger.error('db.createTask', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async updateTask(id, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.updateTask', error);
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
      Logger.error('db.deleteTask', error);
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
      Logger.error('db.createNote', error);
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
      Logger.error('db.deleteNote', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Availability ======

  async getAvailability(userId, startDate, endDate) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      Logger.error('db.getAvailability', error);
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
      Logger.error('db.setAvailability', error);
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
      Logger.error('db.deleteAvailability', error);
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
      Logger.error('db.getConversations', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  async getMessages(conversationId, limit = 100) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(first_name, last_name, role)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getMessages', error);
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
      Logger.error('db.createConversation', error);
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
      Logger.error('db.sendMessage', error);
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
      Logger.error('db.markConversationRead', error);
      return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
    }
  },

  // ====== Contact Form -> Lead ======

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
      Logger.error('db.submitContactForm', error);
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

window.clanaDB = db;
window.clanaUtils = utils;
