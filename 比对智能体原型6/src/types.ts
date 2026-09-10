export type TenantStatus = '正常' | '禁用' | '已过期';

export interface TenantItem {
  id: string;
  name: string;
  adminName: string;
  packageType: string;
  expireTime: string;
  status: TenantStatus;
  createTime: string;
  department?: string;
  expireReminder?: boolean;
  reminderEmails?: string[];
}

export interface FilterParams {
  name: string;
  adminName: string;
  packageType: string;
  status: string;
}

export interface TenantAccountItem {
  id: string;
  username: string;
  nickname: string;
  phone: string;
  email: string;
  status: '正常' | '禁用';
  createTime?: string;
  password?: string;
}

export interface AccountFilterParams {
  username: string;
  nickname: string;
}

export type PackageStatus = '正常' | '禁用';

export interface PackageItem {
  id: string;
  name: string;
  description: string;
  modules: string[];
  status: PackageStatus;
  createTime?: string;
}

export interface PackageFilterParams {
  name: string;
  status: string;
}

export type AppStatus = '已上架' | '内测中' | '未上架';

export interface AppItem {
  id: string;
  name: string;
  desc: string;
  status: AppStatus;
  category: string;
  auditMode: string[];
  businessCategory?: string;
  companyType?: string;
  icon?: string;
  createDate: string;
  customer?: string;
}


