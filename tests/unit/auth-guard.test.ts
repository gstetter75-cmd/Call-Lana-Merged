import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createSupabaseMock, createQueryMock, createAuthMock } from './setup';

describe('AuthGuard', () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let authMock: ReturnType<typeof createAuthMock>;

  beforeEach(() => {
    const profileData = {
      id: 'test-uid',
      email: 'test@test.de',
      role: 'customer',
      first_name: 'Max',
      last_name: 'Mustermann',
      organizations: null,
    };

    const queryMock = createQueryMock(profileData);
    supabase = createSupabaseMock(queryMock);
    authMock = createAuthMock();

    (window as any).supabaseClient = supabase;
    (window as any).Logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
    (window as any).clanaAuth = authMock;
    (window as any).AuthGuard = undefined;

    // Writable location mock
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

    // Ensure document.body exists with classList
    document.body.classList.add('auth-pending');

    loadBrowserScript('js/auth-guard.js');
  });

  function getGuard(): any {
    return (window as any).AuthGuard;
  }

  // --- ROLES constants ---

  it('ROLES constants are correct', () => {
    const guard = getGuard();
    expect(guard.ROLES).toEqual({
      SUPERADMIN: 'superadmin',
      SALES: 'sales',
      CUSTOMER: 'customer',
    });
  });

  // --- ROLE_PAGES ---

  it('ROLE_PAGES maps roles to allowed pages', () => {
    const guard = getGuard();
    expect(guard.ROLE_PAGES.superadmin).toContain('admin.html');
    expect(guard.ROLE_PAGES.superadmin).toContain('dashboard.html');
    expect(guard.ROLE_PAGES.sales).toContain('sales.html');
    expect(guard.ROLE_PAGES.customer).toContain('dashboard.html');
    expect(guard.ROLE_PAGES.customer).toContain('settings.html');
  });

  // --- isSuperadmin / isSales / isCustomer ---

  it('isSuperadmin returns true for superadmin role', () => {
    expect(getGuard().isSuperadmin({ role: 'superadmin' })).toBe(true);
    expect(getGuard().isSuperadmin({ role: 'customer' })).toBe(false);
  });

  it('isSales returns true for sales role', () => {
    expect(getGuard().isSales({ role: 'sales' })).toBe(true);
    expect(getGuard().isSales({ role: 'customer' })).toBe(false);
  });

  it('isCustomer returns true for customer role', () => {
    expect(getGuard().isCustomer({ role: 'customer' })).toBe(true);
    expect(getGuard().isCustomer({ role: 'superadmin' })).toBe(false);
  });

  // --- getDisplayName ---

  it('getDisplayName with full name', () => {
    const name = getGuard().getDisplayName({ first_name: 'Max', last_name: 'Mustermann' });
    expect(name).toBe('Max Mustermann');
  });

  it('getDisplayName with only first name', () => {
    const name = getGuard().getDisplayName({ first_name: 'Max', last_name: '' });
    expect(name).toBe('Max');
  });

  it('getDisplayName with no profile returns User', () => {
    expect(getGuard().getDisplayName(null)).toBe('User');
  });

  // --- getInitials ---

  it('getInitials with full name', () => {
    const initials = getGuard().getInitials({ first_name: 'Max', last_name: 'Mustermann' });
    expect(initials).toBe('MM');
  });

  it('getInitials with no profile returns ?', () => {
    expect(getGuard().getInitials(null)).toBe('?');
  });

  // --- getHomeUrl ---

  it('getHomeUrl returns correct home for each role', () => {
    const guard = getGuard();
    expect(guard.getHomeUrl('superadmin')).toBe('admin.html');
    expect(guard.getHomeUrl('sales')).toBe('sales.html');
    expect(guard.getHomeUrl('customer')).toBe('dashboard.html');
  });

  it('getHomeUrl defaults to dashboard.html for unknown roles', () => {
    expect(getGuard().getHomeUrl('unknown')).toBe('dashboard.html');
  });

  // --- requireRole ---

  it('requireRole redirects if role not in allowed list', async () => {
    // Profile query returns a customer profile
    const customerProfile = {
      id: 'test-uid',
      email: 'test@test.de',
      role: 'customer',
      first_name: 'Max',
      last_name: 'Mustermann',
      organizations: null,
    };
    supabase._queryMock.single.mockResolvedValue({ data: customerProfile, error: null });

    const result = await getGuard().requireRole(['superadmin']);
    // Customer is not in allowed roles, so should redirect
    expect(result).toBeNull();
    expect((window as any).location.href).toBe('dashboard.html');
  });

  // --- init with profile fetch failure ---

  it('init returns profile with least-privilege fallback when profile fetch fails', async () => {
    // Make getUser return a valid user
    authMock.getUser.mockResolvedValue({
      id: 'test-uid',
      email: 'test@test.de',
      user_metadata: { role: 'superadmin' },
    });

    // Make profile query fail (both primary and fallback)
    supabase._queryMock.single
      .mockResolvedValueOnce({ data: null, error: { message: 'relation not found' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'relation not found' } });

    const profile = await getGuard().init();

    expect(profile).not.toBeNull();
    // Must default to 'customer' (least privilege), NOT the user_metadata role
    expect(profile.role).toBe('customer');
    expect(profile.first_name).toBe('');
    expect(profile.last_name).toBe('');
  });
});
