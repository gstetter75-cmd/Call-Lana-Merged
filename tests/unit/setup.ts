// Shared test setup — Supabase mock, Logger mock, global helpers
import { vi, beforeEach } from 'vitest';

// ====== Supabase Query Builder Mock ======

export function createQueryMock(resolveData: any = null, resolveError: any = null) {
  const mock: any = {
    _resolveData: resolveData,
    _resolveError: resolveError,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: resolveData, error: resolveError })
    ),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: resolveData, error: resolveError })
    ),
    then: vi.fn().mockImplementation((cb: any) =>
      cb({ data: Array.isArray(resolveData) ? resolveData : resolveData ? [resolveData] : [], error: resolveError })
    ),
  };

  // Make chainable methods return promise-like for awaiting without .single()
  const originalSelect = mock.select;
  mock.select = vi.fn((...args: any[]) => {
    originalSelect(...args);
    return mock;
  });

  // Allow await on the mock itself
  mock[Symbol.for('nodejs.util.promisify.custom')] = () =>
    Promise.resolve({ data: resolveData, error: resolveError });

  // Make it thenable
  mock.then = (resolve: any, reject: any) => {
    const result = { data: Array.isArray(resolveData) ? resolveData : resolveData ? [resolveData] : [], error: resolveError };
    if (resolveError && reject) return reject(resolveError);
    return resolve ? resolve(result) : result;
  };

  return mock;
}

// ====== Supabase Client Mock ======

export function createSupabaseMock(queryMock?: ReturnType<typeof createQueryMock>) {
  const defaultQuery = queryMock || createQueryMock();

  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockReturnValue(defaultQuery),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid' }, session: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid', email: 'test@test.de' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid' } }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn().mockReturnValue(channelMock),
    _queryMock: defaultQuery,
  };
}

// ====== Logger Mock ======

export function createLoggerMock() {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
}

// ====== Auth Mock ======

export function createAuthMock(userId = 'test-uid') {
  return {
    _userPromise: null,
    getUser: vi.fn().mockResolvedValue({ id: userId, email: 'test@test.de', user_metadata: { role: 'customer' } }),
    getSession: vi.fn().mockResolvedValue({ access_token: 'tok' }),
    getEffectiveUserId: vi.fn().mockResolvedValue(userId),
    signUp: vi.fn().mockResolvedValue({ success: true, data: { user: { id: userId } } }),
    signIn: vi.fn().mockResolvedValue({ success: true, data: { user: { id: userId } } }),
    signOut: vi.fn().mockResolvedValue({ success: true }),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
    resetPassword: vi.fn().mockResolvedValue({ success: true }),
    _logAuthEvent: vi.fn(),
    _sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  };
}

// ====== Install all mocks on window ======

export function setupGlobalMocks(options: {
  supabase?: ReturnType<typeof createSupabaseMock>;
  logger?: ReturnType<typeof createLoggerMock>;
  auth?: ReturnType<typeof createAuthMock>;
} = {}) {
  const supabase = options.supabase || createSupabaseMock();
  const logger = options.logger || createLoggerMock();
  const authMock = options.auth || createAuthMock();

  (window as any).supabaseClient = supabase;
  (window as any).Logger = logger;
  (window as any).auth = authMock;
  (window as any).clanaAuth = authMock;
  // Do NOT overwrite window.location — it breaks localStorage in jsdom.
  // Tests that need specific hostnames should use Object.defineProperty on window.location.

  return { supabase, logger, auth: authMock };
}
