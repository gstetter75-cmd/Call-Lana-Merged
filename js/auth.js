// Auth Helper Functions
// Depends on: supabase-init.js (supabaseClient), logger.js (Logger)
const auth = {
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: userData }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      Logger.error('auth.signUp', error);
      return { success: false, error: error.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' };
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
      Logger.error('auth.signIn', error);
      return { success: false, error: error.message || 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.' };
    }
  },

  async signOut() {
    this._userPromise = null;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('auth.signOut', error);
      return { success: false, error: error.message || 'Abmeldung fehlgeschlagen.' };
    }
  },

  _userPromise: null,

  async getUser() {
    if (this._userPromise) return this._userPromise;
    this._userPromise = supabaseClient.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) throw error;
        return user;
      })
      .catch(err => {
        this._userPromise = null;
        Logger.error('auth.getUser', err);
        return null;
      });
    return this._userPromise;
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      Logger.error('auth.getSession', error);
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
      Logger.error('auth.updateProfile', error);
      return { success: false, error: error.message || 'Profil konnte nicht aktualisiert werden.' };
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
      Logger.error('auth.resetPassword', error);
      return { success: false, error: error.message || 'Passwort-Zurücksetzung fehlgeschlagen.' };
    }
  }
};

window.clanaAuth = auth;
