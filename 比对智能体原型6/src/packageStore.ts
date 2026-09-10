import { PackageItem } from './types';

export const AVAILABLE_MODULES = [
  '基础saas应用',
  '店铺应用',
  '开放平台',
  '企微管理',
  '债承智能体',
  '结构化文档',
  '审核智能体',
  '中登查重智能体',
  '比对智能体',
  'manage_edit-08141009',
];

export const INITIAL_PACKAGES: PackageItem[] = [
  {
    id: '1',
    name: '测试',
    description: '测试',
    modules: ['基础saas应用', '店铺应用', '开放平台', '企微管理', '债承智能体', '结构化文档', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-10 10:00:00',
  },
  {
    id: '2',
    name: '测试套餐1',
    description: '测试套餐测试套餐测试套餐测试套餐',
    modules: ['基础saas应用', '店铺应用', '开放平台', '债承智能体', '结构化文档', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-01 09:30:00',
  },
  {
    id: '3',
    name: 'test',
    description: 'test',
    modules: ['基础saas应用', '店铺应用', '开放平台', '企微管理', '债承智能体', '结构化文档', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-12 14:00:00',
  },
  {
    id: '4',
    name: '审核套餐',
    description: '111',
    modules: ['基础saas应用', '店铺应用', '开放平台', '企微管理', '债承智能体', '结构化文档', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-05 11:20:00',
  },
  {
    id: '5',
    name: 'test2',
    description: 'test2',
    modules: ['基础saas应用', '店铺应用', '开放平台', '企微管理', '债承智能体', '结构化文档', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-13 16:45:00',
  },
  {
    id: '6',
    name: '套餐类型-模块服务',
    description: '套餐类型-模块服务',
    modules: ['债承智能体', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-11 15:30:00',
  },
  {
    id: '7',
    name: '测试套餐删除功能',
    description: '用户套餐',
    modules: ['基础saas应用', '审核智能体'],
    status: '正常',
    createTime: '2026-08-08 17:00:00',
  },
  {
    id: '8',
    name: '内测套餐',
    description: '内测套餐',
    modules: ['基础saas应用', '开放平台', '结构化文档', '审核智能体'],
    status: '正常',
    createTime: '2026-08-06 13:10:00',
  },
  {
    id: '9',
    name: '尽调助手',
    description: '尽调助手',
    modules: ['基础saas应用', '店铺应用', '开放平台', '债承智能体', '结构化文档', '审核智能体'],
    status: '正常',
    createTime: '2026-08-04 10:15:00',
  },
  {
    id: '10',
    name: '合作渠道套餐',
    description: '合作渠道套餐',
    modules: ['基础saas应用', '店铺应用', '开放平台', '结构化文档'],
    status: '正常',
    createTime: '2026-08-07 14:50:00',
  },
  {
    id: '11',
    name: '智能比对专属套餐',
    description: '包含比对智能体、审核智能体与基础服务',
    modules: ['基础saas应用', '比对智能体', '审核智能体', '中登查重智能体'],
    status: '正常',
    createTime: '2026-08-14 09:00:00',
  },
];

const PACKAGES_STORAGE_KEY = 'daguan_packages_list_v2';
export const PACKAGES_UPDATED_EVENT = 'daguan_packages_updated';

export function getStoredPackages(): PackageItem[] {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_PACKAGES;
}

export function saveStoredPackages(items: PackageItem[]): void {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(PACKAGES_UPDATED_EVENT));
  } catch {
    // fallback
  }
}

export function addStoredPackage(item: Omit<PackageItem, 'id'> & { id?: string }): PackageItem {
  const current = getStoredPackages();
  const nextId = item.id || String(Math.max(...current.map((p) => Number(p.id) || 0), 0) + 1);
  const newPkg: PackageItem = {
    id: nextId,
    name: item.name || '',
    description: item.description || '',
    modules: item.modules || [],
    status: item.status || '正常',
    createTime: item.createTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  const updated = [newPkg, ...current];
  saveStoredPackages(updated);
  return newPkg;
}

export function updateStoredPackage(id: string, updates: Partial<PackageItem>): void {
  const current = getStoredPackages();
  const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveStoredPackages(updated);
}

export function deleteStoredPackage(id: string): void {
  const current = getStoredPackages();
  const updated = current.filter((p) => p.id !== id);
  saveStoredPackages(updated);
}
