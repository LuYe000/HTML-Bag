import { TenantAccountItem, TenantItem } from './types';
import { INITIAL_ACCOUNTS, INITIAL_TENANTS } from './mockData';

const ACCOUNTS_STORAGE_KEY = 'daguan_tenant_accounts_v2';
const TENANTS_STORAGE_KEY = 'daguan_tenants_list_v2';

export const ACCOUNTS_UPDATED_EVENT = 'daguan_accounts_updated';
export const TENANTS_UPDATED_EVENT = 'daguan_tenants_updated';

export const getStoredAccounts = (): TenantAccountItem[] => {
  try {
    const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (data) {
      const parsed: TenantAccountItem[] = JSON.parse(data);
      // Ensure 'luyye' account is guaranteed to be in the account list
      if (!parsed.some((a) => a.username.toLowerCase() === 'luyye')) {
        const luyyeAccount: TenantAccountItem = {
          id: 'acc-0',
          username: 'luyye',
          nickname: 'luyye',
          phone: '13888888888',
          email: 'luyye@datagrand.com',
          status: '正常',
          createTime: '2026-08-27 10:00:00',
        };
        const merged = [luyyeAccount, ...parsed];
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading accounts from localStorage', e);
  }
  return INITIAL_ACCOUNTS;
};

export const saveStoredAccounts = (accounts: TenantAccountItem[]) => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent(ACCOUNTS_UPDATED_EVENT, { detail: accounts }));
  } catch (e) {
    console.error('Error saving accounts to localStorage', e);
  }
};

export const addStoredAccount = (account: Omit<TenantAccountItem, 'id' | 'createTime'>): TenantAccountItem => {
  const accounts = getStoredAccounts();
  const now = new Date();
  const createTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newAcc: TenantAccountItem = {
    id: `acc-${Date.now()}`,
    ...account,
    createTime,
  };
  const updated = [newAcc, ...accounts];
  saveStoredAccounts(updated);
  return newAcc;
};

export const updateStoredAccount = (id: string, updates: Partial<TenantAccountItem>) => {
  const accounts = getStoredAccounts();
  const updated = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc));
  saveStoredAccounts(updated);
};

export const deleteStoredAccount = (id: string) => {
  const accounts = getStoredAccounts();
  const updated = accounts.filter((acc) => acc.id !== id);
  saveStoredAccounts(updated);
};

export const CURRENT_ACCOUNT_KEY = 'daguan_current_tenant_account_v1';
export const CURRENT_ACCOUNT_CHANGED_EVENT = 'daguan_current_account_changed';

export const getCurrentAccountName = (): string => {
  try {
    return localStorage.getItem(CURRENT_ACCOUNT_KEY) || 'luyye';
  } catch {
    return 'luyye';
  }
};

export const setCurrentAccountName = (username: string) => {
  try {
    localStorage.setItem(CURRENT_ACCOUNT_KEY, username);
    window.dispatchEvent(new CustomEvent(CURRENT_ACCOUNT_CHANGED_EVENT, { detail: username }));
  } catch (e) {
    console.error('Error saving current account', e);
  }
};

export const getTenantsForAccount = (accountUsername: string): TenantItem[] => {
  const tenants = getStoredTenants();
  const trimmed = accountUsername.trim().toLowerCase();
  const matched = tenants.filter((t) => {
    const admin = (t.adminName || '').trim().toLowerCase();
    return admin === trimmed;
  });

  // If no direct exact match found (e.g. fresh custom account or demo), match loosely or fallback gracefully
  if (matched.length === 0) {
    return tenants.filter((t) => {
      const admin = (t.adminName || '').trim().toLowerCase();
      return admin.includes(trimmed) || trimmed.includes(admin);
    });
  }
  return matched;
};

export const getStoredTenants = (): TenantItem[] => {
  try {
    const data = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (data) {
      const parsed: TenantItem[] = JSON.parse(data);
      if (!parsed.some((t) => t.name.toLowerCase() === 'luyeye')) {
        const luyeyeTenant: TenantItem = {
          id: '0',
          name: 'luyeye',
          adminName: 'luyye',
          packageType: '测试',
          expireTime: '2027-06-01 23:59:59',
          status: '正常',
          createTime: '2026-08-27 10:05:00',
          department: '智能体业务部',
        };
        const merged = [luyeyeTenant, ...parsed];
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading tenants from localStorage', e);
  }
  return INITIAL_TENANTS;
};

export const saveStoredTenants = (tenants: TenantItem[]) => {
  try {
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    window.dispatchEvent(new CustomEvent(TENANTS_UPDATED_EVENT, { detail: tenants }));
  } catch (e) {
    console.error('Error saving tenants to localStorage', e);
  }
};

export const addStoredTenant = (tenant: Partial<TenantItem>): TenantItem => {
  const tenants = getStoredTenants();
  const now = new Date();
  const createTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newTenant: TenantItem = {
    id: String(Date.now()),
    name: tenant.name || '新建租户',
    adminName: tenant.adminName || 'admin',
    packageType: tenant.packageType || '测试',
    expireTime: tenant.expireTime || '2027-08-31 23:59:59',
    status: tenant.status || '正常',
    createTime,
    department: tenant.department || '',
    expireReminder: tenant.expireReminder || false,
    reminderEmails: tenant.reminderEmails || [],
  };
  const updated = [newTenant, ...tenants];
  saveStoredTenants(updated);
  return newTenant;
};

export const updateStoredTenant = (id: string, updates: Partial<TenantItem>) => {
  const tenants = getStoredTenants();
  const updated = tenants.map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveStoredTenants(updated);
};

export const deleteStoredTenant = (id: string) => {
  const tenants = getStoredTenants();
  const updated = tenants.filter((t) => t.id !== id);
  saveStoredTenants(updated);
};
