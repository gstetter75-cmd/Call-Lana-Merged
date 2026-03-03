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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
    }
  },

  async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
  }
};

window.clanaAuth = auth;
window.clanaDB = db;
window.clanaUtils = utils;