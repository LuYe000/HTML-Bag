import { AppItem, AppStatus } from './types';

export interface CustomerAuthRecord {
  id: string;
  tenantName: string;
  tenantId: string;
  expireDate: string; // e.g. "2026-08-27 ~ 2027-01-29"
  rule: string;
  manageType: string;
  process: string;
  allowResultEdit: string;
  createTime: string;
}

export interface CompareAppConfigItem extends AppItem {
  industry?: string;
  companyType?: string;
  businessScene?: string;
  illustrationType?: 'pdf_chart' | 'justice_scale' | 'credit_rating';
  authorizedTenants: CustomerAuthRecord[];
}

// Initial default configured apps in Admin (aligned with 应用管理)
export const INITIAL_COMPARE_APPS: CompareAppConfigItem[] = [
  {
    id: 'app-comp-1',
    name: '比对',
    desc: '通用文档智能比对与合规穿透核验应用',
    status: '已上架',
    category: '文档比对',
    auditMode: ['全文审核'],
    createDate: '2026-08-27',
    customer: 'luyeye、性能测试店铺1、豆浆01',
    industry: '金融',
    companyType: '证券',
    businessCategory: '合规业务',
    businessScene: '合规业务',
    illustrationType: 'justice_scale',
    authorizedTenants: [
      {
        id: 'auth-luyeye-default',
        tenantName: 'luyeye',
        tenantId: '0',
        expireDate: '2026-08-27 ~ 2027-06-01',
        rule: '版本迭代比对-默认规则',
        manageType: '平台管理',
        process: '',
        allowResultEdit: '',
        createTime: '2026-08-27',
      },
      {
        id: 'auth-901',
        tenantName: '性能测试店铺1',
        tenantId: '1',
        expireDate: '2026-08-27 ~ 2027-01-29',
        rule: '版本迭代比对-默认规则',
        manageType: '租户管理',
        process: '',
        allowResultEdit: '',
        createTime: '2026-08-27',
      },
      {
        id: 'auth-902',
        tenantName: '豆浆01',
        tenantId: '2',
        expireDate: '2026-08-27 ~ 2027-01-29',
        rule: '模板基准校验比对-默认规则',
        manageType: '租户管理',
        process: '',
        allowResultEdit: '',
        createTime: '2026-08-27',
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'daguan_compare_apps_config_v9';
const CURRENT_TENANT_KEY = 'daguan_saas_current_tenant_v1';

// Load from LocalStorage or fall back
export function loadCompareApps(): CompareAppConfigItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load apps config from localStorage', e);
  }
  return INITIAL_COMPARE_APPS;
}

// Save to LocalStorage
export function saveCompareApps(apps: CompareAppConfigItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
    // Trigger storage event across tabs/views
    window.dispatchEvent(new Event('daguan_apps_updated'));
  } catch (e) {
    console.error('Failed to save apps config to localStorage', e);
  }
}

// Get/Set current SaaS tenant
export function getCurrentTenant(): string {
  try {
    return localStorage.getItem(CURRENT_TENANT_KEY) || 'luyeye';
  } catch {
    return 'luyeye';
  }
}

export function setCurrentTenant(tenantName: string) {
  try {
    localStorage.setItem(CURRENT_TENANT_KEY, tenantName);
    window.dispatchEvent(new Event('daguan_tenant_changed'));
  } catch (e) {
    console.error('Failed to set current tenant', e);
  }
}
