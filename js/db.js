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
        .select('*')
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
        .select('*, notes(*)')
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
        .select('*')
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
  },

  // ====== CRM: Customers ======

  async getCustomers(filters = {}) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabaseClient
        .from('customers')
        .select('*, customer_tag_assignments(tag_id, customer_tags(name, color))')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getCustomers', error);
      return { success: false, error: error.message || 'Fehler beim Laden der Kunden.' };
    }
  },

  async getCustomer(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customers')
        .select('*, customer_tag_assignments(tag_id, customer_tags(name, color))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.getCustomer', error);
      return { success: false, error: error.message || 'Fehler beim Laden des Kunden.' };
    }
  },

  async createCustomer(data) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!data.company_name) throw new Error('Firmenname ist erforderlich');

      const { data: customer, error } = await supabaseClient
        .from('customers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: customer };
    } catch (error) {
      Logger.error('db.createCustomer', error);
      return { success: false, error: error.message || 'Fehler beim Erstellen.' };
    }
  },

  async updateCustomer(id, updates) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.updateCustomer', error);
      return { success: false, error: error.message || 'Fehler beim Aktualisieren.' };
    }
  },

  async deleteCustomer(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.deleteCustomer', error);
      return { success: false, error: error.message || 'Fehler beim Löschen.' };
    }
  },

  async convertLeadToCustomer(leadId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already converted
      const { data: existing } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (existing) return { success: true, data: existing, alreadyExists: true };

      // Get lead data
      const { data: lead, error: leadErr } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadErr) throw leadErr;

      // Create customer from lead
      const { data: customer, error: custErr } = await supabaseClient
        .from('customers')
        .insert([{
          lead_id: lead.id,
          assigned_to: lead.assigned_to,
          organization_id: lead.organization_id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          industry: lead.industry,
          notes: lead.notes,
          plan: 'starter',
          status: 'active'
        }])
        .select()
        .single();

      if (custErr) throw custErr;

      // Update lead status to won
      await supabaseClient
        .from('leads')
        .update({ status: 'won' })
        .eq('id', leadId);

      // Log activity
      await supabaseClient.from('customer_activities').insert([{
        customer_id: customer.id,
        actor_id: user.id,
        type: 'created',
        title: 'Kunde erstellt aus Lead',
        details: `Lead "${lead.company_name}" wurde konvertiert`
      }]);

      return { success: true, data: customer };
    } catch (error) {
      Logger.error('db.convertLeadToCustomer', error);
      return { success: false, error: error.message || 'Fehler bei der Konvertierung.' };
    }
  },

  // ====== CRM: Call Protocols ======

  async getCallProtocols(customerId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('call_protocols')
        .select('*')
        .eq('customer_id', customerId)
        .order('called_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getCallProtocols', error);
      return { success: false, error: error.message || 'Fehler beim Laden.' };
    }
  },

  async createCallProtocol(data) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      data.caller_id = user.id;

      const { data: protocol, error } = await supabaseClient
        .from('call_protocols')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Update customer last_contact_at
      await supabaseClient
        .from('customers')
        .update({ last_contact_at: data.called_at || new Date().toISOString() })
        .eq('id', data.customer_id);

      // Log activity
      const dirLabel = data.direction === 'inbound' ? 'Eingehender' : 'Ausgehender';
      await supabaseClient.from('customer_activities').insert([{
        customer_id: data.customer_id,
        actor_id: user.id,
        type: 'call',
        title: `${dirLabel} Anruf protokolliert`,
        details: data.notes || data.subject || ''
      }]);

      return { success: true, data: protocol };
    } catch (error) {
      Logger.error('db.createCallProtocol', error);
      return { success: false, error: error.message || 'Fehler beim Speichern.' };
    }
  },

  async deleteCallProtocol(id) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('call_protocols')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.deleteCallProtocol', error);
      return { success: false, error: error.message || 'Fehler beim Löschen.' };
    }
  },

  // ====== CRM: Customer Tags ======

  async getCustomerTags() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customer_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getCustomerTags', error);
      return { success: false, error: error.message || 'Fehler beim Laden.' };
    }
  },

  async createCustomerTag(name, color) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customer_tags')
        .insert([{ name, color: color || '#7c3aed' }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('db.createCustomerTag', error);
      return { success: false, error: error.message || 'Fehler beim Erstellen.' };
    }
  },

  async assignCustomerTag(customerId, tagId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('customer_tag_assignments')
        .insert([{ customer_id: customerId, tag_id: tagId }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.assignCustomerTag', error);
      return { success: false, error: error.message || 'Fehler.' };
    }
  },

  async removeCustomerTag(customerId, tagId) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabaseClient
        .from('customer_tag_assignments')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('db.removeCustomerTag', error);
      return { success: false, error: error.message || 'Fehler.' };
    }
  },

  // ====== CRM: Customer Activities ======

  async getCustomerActivities(customerId, limit = 50) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customer_activities')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getCustomerActivities', error);
      return { success: false, error: error.message || 'Fehler beim Laden.' };
    }
  },

  async logCustomerActivity(customerId, type, title, details) {
    try {
      const user = await auth.getUser();
      if (!user) return { success: false };

      await supabaseClient.from('customer_activities').insert([{
        customer_id: customerId,
        actor_id: user.id,
        type,
        title,
        details
      }]);
      return { success: true };
    } catch (error) {
      Logger.error('db.logCustomerActivity', error);
      return { success: false };
    }
  },

  // ====== CRM: Bulk Import ======

  // ====== Lead Scoring ======

  calculateLeadScore(lead) {
    let score = 0;
    const factors = {};

    // Industry (max 20)
    const highValueIndustries = ['handwerk', 'immobilien', 'recht', 'gesundheit'];
    const medValueIndustries = ['auto', 'dienstleistung', 'it'];
    if (highValueIndustries.includes(lead.industry)) { score += 20; factors.industry = 20; }
    else if (medValueIndustries.includes(lead.industry)) { score += 15; factors.industry = 15; }
    else if (lead.industry) { score += 10; factors.industry = 10; }

    // Value (max 30)
    const val = Number(lead.value) || 0;
    if (val >= 5000) { score += 30; factors.value = 30; }
    else if (val >= 2000) { score += 20; factors.value = 20; }
    else if (val >= 500) { score += 10; factors.value = 10; }

    // Completeness (max 20)
    let complete = 0;
    if (lead.email) complete += 5;
    if (lead.phone) complete += 5;
    if (lead.contact_name) complete += 5;
    if (lead.industry) complete += 5;
    score += complete;
    factors.completeness = complete;

    // Activity / Recency (max 30)
    if (lead.updated_at) {
      const daysSince = (Date.now() - new Date(lead.updated_at).getTime()) / 86400000;
      if (daysSince < 3) { score += 30; factors.recency = 30; }
      else if (daysSince < 7) { score += 25; factors.recency = 25; }
      else if (daysSince < 14) { score += 15; factors.recency = 15; }
      else if (daysSince < 30) { score += 5; factors.recency = 5; }
    }

    return { score: Math.min(score, 100), factors };
  },

  async updateLeadScore(leadId, lead) {
    try {
      const { score, factors } = this.calculateLeadScore(lead);
      await supabaseClient.from('leads').update({ score, score_factors: factors }).eq('id', leadId);
      return { success: true, score };
    } catch (error) {
      Logger.error('db.updateLeadScore', error);
      return { success: false };
    }
  },

  // ====== Email Templates ======

  async getEmailTemplates() {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabaseClient.from('email_templates').select('*').order('category');
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getEmailTemplates', error);
      return { success: false, error: error.message };
    }
  },

  // ====== Onboarding ======

  async getOnboardingProgress(userId) {
    try {
      const { data, error } = await supabaseClient.from('onboarding_progress').select('step_key, completed_at').eq('user_id', userId);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('db.getOnboardingProgress', error);
      return { success: true, data: [] };
    }
  },

  async completeOnboardingStep(userId, stepKey) {
    try {
      await supabaseClient.from('onboarding_progress').upsert({ user_id: userId, step_key: stepKey, completed_at: new Date().toISOString() }, { onConflict: 'user_id,step_key' });
      return { success: true };
    } catch (error) {
      Logger.error('db.completeOnboardingStep', error);
      return { success: false };
    }
  },

  // ====== Duplicate Detection ======

  async checkDuplicate(email) {
    try {
      if (!email) return { success: true, duplicates: [] };
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [leads, customers] = await Promise.all([
        supabaseClient.from('leads').select('id, company_name, status').eq('email', email).limit(3),
        supabaseClient.from('customers').select('id, company_name, status').eq('email', email).limit(3)
      ]);

      const duplicates = [];
      (leads.data || []).forEach(l => duplicates.push({ type: 'lead', ...l }));
      (customers.data || []).forEach(c => duplicates.push({ type: 'customer', ...c }));

      return { success: true, duplicates };
    } catch (error) {
      Logger.error('db.checkDuplicate', error);
      return { success: true, duplicates: [] };
    }
  },

  // ====== Realtime Subscriptions ======

  subscribeTable(table, callback) {
    return supabaseClient
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload);
      })
      .subscribe();
  },

  // ====== CRM: Bulk Import ======

  async bulkCreateCustomers(customers) {
    try {
      const user = await auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabaseClient
        .from('customers')
        .insert(customers)
        .select();

      if (error) throw error;
      return { success: true, data: data || [], count: (data || []).length };
    } catch (error) {
      Logger.error('db.bulkCreateCustomers', error);
      return { success: false, error: error.message || 'Fehler beim Import.' };
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
  },

  safeTelHref(phone) {
    const clean = (phone || '').replace(/[^+\d\s\-()]/g, '');
    return clean ? 'tel:' + clean : '#';
  },

  safeMailHref(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'mailto:' + email : '#';
  }
};

window.clanaDB = db;
window.clanaUtils = utils;
