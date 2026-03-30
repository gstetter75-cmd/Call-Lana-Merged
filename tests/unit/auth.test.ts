import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createSupabaseMock, createLoggerMock } from './setup';

describe('auth module', () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let logger: ReturnType<typeof createLoggerMock>;
  let authStateCallback: ((event: string, session: any) => void) | null;

  beforeEach(() => {
    // Reset captured callback
    authStateCallback = null;

    // Create mocks BEFORE loading the script (auth.js calls onAuthStateChange at load time)
    supabase = createSupabaseMock();
    logger = createLoggerMock();

    // Capture the onAuthStateChange callback when auth.js registers it
    supabase.auth.onAuthStateChange = vi.fn((cb: any) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (window as any).supabaseClient = supabase;
    (window as any).Logger = logger;
    (window as any).ImpersonationManager = undefined;
    (window as any).auth = undefined;
    (window as any).clanaAuth = undefined;

    // Provide a writable location mock
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        href: 'http://localhost:8080/dashboard.html',
        pathname: '/dashboard.html',
        origin: 'http://localhost:8080',
      },
      writable: true,
      configurable: true,
    });

    loadBrowserScript('js/auth.js');
  });

  function getAuth(): any {
    return (window as any).clanaAuth;
  }

  // --- signUp ---

  it('signUp success returns { success: true, data }', async () => {
    const result = await getAuth().signUp('a@b.de', 'pw123', { firstName: 'Max' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.user.id).toBe('test-uid');
  });

  it('signUp calls supabaseClient.auth.signUp with correct args', async () => {
    const userData = { firstName: 'Max' };
    await getAuth().signUp('a@b.de', 'pw123', userData);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.de',
      password: 'pw123',
      options: { data: userData },
    });
  });

  it('signUp failure returns { success: false, error: message }', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email taken' },
    });
    const result = await getAuth().signUp('a@b.de', 'pw123', {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email taken');
  });

  // --- signIn ---

  it('signIn success returns { success: true, data }', async () => {
    const result = await getAuth().signIn('a@b.de', 'pw123');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('signIn failure logs auth event login_failed', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    await getAuth().signIn('a@b.de', 'wrong');
    // _logAuthEvent fires insert on audit_logs
    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
  });

  // --- signOut ---

  it('signOut success clears _userPromise', async () => {
    const auth = getAuth();
    // Seed a cached user promise
    auth._userPromise = Promise.resolve({ id: 'test-uid' });
    await auth.signOut();
    expect(auth._userPromise).toBeNull();
  });

  // --- getUser ---

  it('getUser caches promise (second call does not call supabase again)', async () => {
    const auth = getAuth();
    await auth.getUser();
    await auth.getUser();
    // supabase.auth.getUser should only be called once due to caching
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('getUser resets cache on error', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'expired' },
    });
    const auth = getAuth();
    const result = await auth.getUser();
    expect(result).toBeNull();
    // Cache should be cleared so next call creates a new promise
    expect(auth._userPromise).toBeNull();
  });

  // --- getSession ---

  it('getSession returns session or null', async () => {
    const session = await getAuth().getSession();
    expect(session).toEqual({ access_token: 'tok' });
  });

  // --- updateProfile ---

  it('updateProfile calls supabaseClient.auth.updateUser', async () => {
    await getAuth().updateProfile({ firstName: 'Neu' });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { firstName: 'Neu' },
    });
  });

  // --- resetPassword ---

  it('resetPassword calls resetPasswordForEmail with redirectTo', async () => {
    await getAuth().resetPassword('a@b.de');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.de', {
      redirectTo: 'http://localhost:8080/reset-password.html',
    });
  });

  // --- getEffectiveUserId ---

  it('getEffectiveUserId returns own ID when no ImpersonationManager', async () => {
    const id = await getAuth().getEffectiveUserId();
    expect(id).toBe('test-uid');
  });

  // --- Auth state change callbacks ---

  it('Auth state change SIGNED_OUT redirects from protected pages', () => {
    expect(authStateCallback).toBeTruthy();
    // Current page is dashboard.html (protected)
    (window as any).location.pathname = '/dashboard.html';
    authStateCallback!('SIGNED_OUT', null);
    expect((window as any).location.href).toBe('login.html');
  });

  it('Auth state change SIGNED_OUT does NOT redirect from public pages', () => {
    expect(authStateCallback).toBeTruthy();
    (window as any).location.pathname = '/login.html';
    (window as any).location.href = 'http://localhost:8080/login.html';
    authStateCallback!('SIGNED_OUT', null);
    // href should NOT have been changed to login.html redirect
    expect((window as any).location.href).toBe('http://localhost:8080/login.html');
  });

  it('Auth state change TOKEN_REFRESHED clears user cache', () => {
    expect(authStateCallback).toBeTruthy();
    const auth = getAuth();
    auth._userPromise = Promise.resolve({ id: 'test-uid' });
    authStateCallback!('TOKEN_REFRESHED', {});
    expect(auth._userPromise).toBeNull();
  });
});
