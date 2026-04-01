import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks, createQueryMock } from './setup';

describe('dbProfiles', () => {
  let mocks: ReturnType<typeof setupGlobalMocks>;

  beforeEach(() => {
    mocks = setupGlobalMocks();
    loadBrowserScript('js/db/profiles.js');
  });

  // ====== getProfile ======

  describe('getProfile', () => {
    it('returns profile data on success', async () => {
      const profile = { id: 'test-uid', first_name: 'Max', last_name: 'Muster' };
      const qm = createQueryMock(profile);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(profile);
      expect(mocks.supabase.from).toHaveBeenCalledWith('profiles');
      expect(qm.select).toHaveBeenCalledWith('*, organizations(name, plan)');
      expect(qm.eq).toHaveBeenCalledWith('id', 'test-uid');
      expect(qm.single).toHaveBeenCalled();
    });

    it('returns profile for a specific userId', async () => {
      const profile = { id: 'other-uid', first_name: 'Other' };
      const qm = createQueryMock(profile);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getProfile('other-uid');

      expect(result.success).toBe(true);
      expect(qm.eq).toHaveBeenCalledWith('id', 'other-uid');
    });

    it('returns error when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbProfiles.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error on supabase query failure', async () => {
      const qm = createQueryMock(null, { message: 'DB error' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getProfile();

      expect(result.success).toBe(false);
    });
  });

  // ====== updateProfile ======

  describe('updateProfile', () => {
    it('updates own profile successfully', async () => {
      const updated = { id: 'test-uid', first_name: 'Updated' };
      const qm = createQueryMock(updated);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.updateProfile('test-uid', { first_name: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
      expect(mocks.supabase.from).toHaveBeenCalledWith('profiles');
      expect(qm.update).toHaveBeenCalledWith({ first_name: 'Updated' });
      expect(qm.eq).toHaveBeenCalledWith('id', 'test-uid');
    });

    it('allows superadmin to update other profiles', async () => {
      mocks.auth.getUser.mockResolvedValue({
        id: 'admin-uid',
        email: 'admin@test.de',
        user_metadata: { role: 'superadmin' },
      });
      const qm = createQueryMock({ id: 'other-uid', first_name: 'Changed' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.updateProfile('other-uid', { first_name: 'Changed' });

      expect(result.success).toBe(true);
    });

    it('rejects non-superadmin updating another profile', async () => {
      const result = await (window as any).dbProfiles.updateProfile('other-uid', { first_name: 'Nope' });

      expect(result.success).toBe(false);
    });

    it('returns error when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbProfiles.updateProfile('test-uid', {});

      expect(result.success).toBe(false);
    });
  });

  // ====== getAllProfiles ======

  describe('getAllProfiles', () => {
    it('returns all profiles on success', async () => {
      const profiles = [{ id: '1' }, { id: '2' }];
      const qm = createQueryMock(profiles);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getAllProfiles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(profiles);
      expect(mocks.supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('applies role filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbProfiles.getAllProfiles({ role: 'sales' });

      expect(qm.eq).toHaveBeenCalledWith('role', 'sales');
    });

    it('applies organization_id filter', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbProfiles.getAllProfiles({ organization_id: 'org-1' });

      expect(qm.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    });

    it('applies pagination via range', async () => {
      const qm = createQueryMock([]);
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbProfiles.getAllProfiles({ page: 1, pageSize: 50 });

      expect(qm.range).toHaveBeenCalledWith(50, 99);
    });

    it('returns error when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbProfiles.getAllProfiles();

      expect(result.success).toBe(false);
    });
  });

  // ====== Organizations ======

  describe('getOrganizations', () => {
    it('returns organizations on success', async () => {
      const orgs = [{ id: 'org-1', name: 'Org A' }];
      const qm = createQueryMock(orgs);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getOrganizations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(orgs);
      expect(mocks.supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('returns error when not authenticated', async () => {
      mocks.auth.getUser.mockResolvedValue(null);

      const result = await (window as any).dbProfiles.getOrganizations();

      expect(result.success).toBe(false);
    });
  });

  describe('getOrganization', () => {
    it('returns single organization on success', async () => {
      const org = { id: 'org-1', name: 'Org A', organization_members: [] };
      const qm = createQueryMock(org);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getOrganization('org-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(org);
      expect(qm.eq).toHaveBeenCalledWith('id', 'org-1');
      expect(qm.single).toHaveBeenCalled();
    });

    it('returns error on failure', async () => {
      const qm = createQueryMock(null, { message: 'Not found' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.getOrganization('bad-id');

      expect(result.success).toBe(false);
    });
  });

  describe('createOrganization', () => {
    it('creates organization on success', async () => {
      const org = { id: 'org-new', name: 'New Org' };
      const qm = createQueryMock(org);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.createOrganization({ name: 'New Org' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(org);
      expect(qm.insert).toHaveBeenCalledWith([{ name: 'New Org' }]);
    });

    it('returns error on failure', async () => {
      const qm = createQueryMock(null, { message: 'Duplicate' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.createOrganization({ name: 'Dup' });

      expect(result.success).toBe(false);
    });
  });

  describe('updateOrganization', () => {
    it('updates organization on success', async () => {
      const org = { id: 'org-1', name: 'Updated' };
      const qm = createQueryMock(org);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.updateOrganization('org-1', { name: 'Updated' });

      expect(result.success).toBe(true);
      expect(qm.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(qm.eq).toHaveBeenCalledWith('id', 'org-1');
    });

    it('returns error on failure', async () => {
      const qm = createQueryMock(null, { message: 'Error' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.updateOrganization('org-1', {});

      expect(result.success).toBe(false);
    });
  });

  // ====== Organization Members ======

  describe('addOrgMember', () => {
    it('adds member on success', async () => {
      const member = { organization_id: 'org-1', user_id: 'u-1', role_in_org: 'member' };
      const qm = createQueryMock(member);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.addOrgMember('org-1', 'u-1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('organization_members');
      expect(qm.insert).toHaveBeenCalledWith([{ organization_id: 'org-1', user_id: 'u-1', role_in_org: 'member' }]);
    });

    it('uses custom role', async () => {
      const qm = createQueryMock({});
      mocks.supabase.from.mockReturnValue(qm);

      await (window as any).dbProfiles.addOrgMember('org-1', 'u-1', 'admin');

      expect(qm.insert).toHaveBeenCalledWith([{ organization_id: 'org-1', user_id: 'u-1', role_in_org: 'admin' }]);
    });

    it('returns error on failure', async () => {
      const qm = createQueryMock(null, { message: 'Conflict' });
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.addOrgMember('org-1', 'u-1');

      expect(result.success).toBe(false);
    });
  });

  describe('removeOrgMember', () => {
    it('removes member on success', async () => {
      const qm = createQueryMock(null);
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.removeOrgMember('org-1', 'u-1');

      expect(result.success).toBe(true);
      expect(mocks.supabase.from).toHaveBeenCalledWith('organization_members');
      expect(qm.delete).toHaveBeenCalled();
      expect(qm.eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(qm.eq).toHaveBeenCalledWith('user_id', 'u-1');
    });

    it('returns error on failure', async () => {
      const qm = createQueryMock(null, { message: 'Error' });
      // Make the thenable reject to simulate error
      qm.then = (resolve: any, reject: any) => {
        if (reject) return reject({ message: 'Error' });
        return resolve({ data: null, error: { message: 'Error' } });
      };
      mocks.supabase.from.mockReturnValue(qm);

      const result = await (window as any).dbProfiles.removeOrgMember('org-1', 'u-1');

      expect(result.success).toBe(false);
    });
  });
});
