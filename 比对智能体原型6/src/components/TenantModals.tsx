import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ChevronDown,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  PackageCheck,
  Layers,
} from 'lucide-react';
import { TenantItem, TenantAccountItem, PackageItem } from '../types';
import { getStoredAccounts } from '../accountTenantStore';
import { getStoredPackages, PACKAGES_UPDATED_EVENT } from '../packageStore';
import {
  loadCompareApps,
  saveCompareApps,
  CustomerAuthRecord,
} from '../appConfigStore';

// ==========================================
// 1. Create or Edit Tenant Modal (Screenshot 2)
// ==========================================
interface CreateOrEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Partial<TenantItem>) => void;
  initialData?: TenantItem | null;
  accounts?: TenantAccountItem[];
}

export const CreateOrEditModal: React.FC<CreateOrEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  accounts: propAccounts,
}) => {
  const [packagesList, setPackagesList] = useState<PackageItem[]>(getStoredPackages);
  const [formData, setFormData] = useState<{
    name: string;
    adminName: string;
    packageType: string;
    expireTime: string;
    status: TenantItem['status'];
    department: string;
    expireReminder: boolean;
    reminderEmails: string[];
  }>({
    name: '',
    adminName: '',
    packageType: '测试',
    expireTime: '2027-08-31 23:59:59',
    status: '正常',
    department: '',
    expireReminder: false,
    reminderEmails: [],
  });

  const [availableAccounts, setAvailableAccounts] = useState<TenantAccountItem[]>([]);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [adminSearchText, setAdminSearchText] = useState('');
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; adminName?: string; packageType?: string }>({});

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const packageDropdownRef = useRef<HTMLDivElement>(null);

  // Sync package list updates from packageStore
  useEffect(() => {
    const handlePackagesUpdate = () => {
      setPackagesList(getStoredPackages());
    };
    window.addEventListener(PACKAGES_UPDATED_EVENT, handlePackagesUpdate);
    return () => {
      window.removeEventListener(PACKAGES_UPDATED_EVENT, handlePackagesUpdate);
    };
  }, []);

  // Load latest accounts
  useEffect(() => {
    if (isOpen) {
      const allAccs = propAccounts || getStoredAccounts();
      setAvailableAccounts(allAccs);
      const pkgs = getStoredPackages();
      setPackagesList(pkgs);
    }
  }, [isOpen, propAccounts]);

  useEffect(() => {
    const pkgs = getStoredPackages();
    const defaultPkgName = pkgs.length > 0 ? pkgs[0].name : '测试';

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        adminName: initialData.adminName || '',
        packageType: initialData.packageType || defaultPkgName,
        expireTime: initialData.expireTime || '2027-08-31 23:59:59',
        status: initialData.status || '正常',
        department: initialData.department || '',
        expireReminder: initialData.expireReminder || false,
        reminderEmails: initialData.reminderEmails || [],
      });
      setAdminSearchText(initialData.adminName || '');
    } else {
      setFormData({
        name: '',
        adminName: '',
        packageType: defaultPkgName,
        expireTime: '2027-08-31 23:59:59',
        status: '正常',
        department: '',
        expireReminder: false,
        reminderEmails: [],
      });
      setAdminSearchText('');
    }
    setShowEmailInput(false);
    setNewEmailInput('');
    setValidationErrors({});
  }, [initialData, isOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (packageDropdownRef.current && !packageDropdownRef.current.contains(e.target as Node)) {
        setPackageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const filteredAccounts = availableAccounts.filter((acc) => {
    if (!adminSearchText.trim()) return true;
    const query = adminSearchText.toLowerCase();
    return (
      acc.username.toLowerCase().includes(query) ||
      acc.nickname.toLowerCase().includes(query) ||
      acc.phone.includes(query)
    );
  });

  const handleSelectAdmin = (acc: TenantAccountItem) => {
    setFormData((prev) => ({ ...prev, adminName: acc.username }));
    setAdminSearchText(acc.username);
    setAdminDropdownOpen(false);
    if (validationErrors.adminName) {
      setValidationErrors((prev) => ({ ...prev, adminName: undefined }));
    }
  };

  const handleAddEmail = () => {
    if (newEmailInput.trim() && newEmailInput.includes('@')) {
      setFormData((prev) => ({
        ...prev,
        reminderEmails: [...prev.reminderEmails, newEmailInput.trim()],
      }));
      setNewEmailInput('');
      setShowEmailInput(false);
    }
  };

  const handleRemoveEmail = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      reminderEmails: prev.reminderEmails.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; adminName?: string; packageType?: string } = {};
    if (!formData.name.trim()) {
      errors.name = '请输入租户名称';
    }
    if (!formData.adminName.trim()) {
      errors.adminName = '请选择租户管理员';
    }
    if (!formData.packageType.trim()) {
      errors.packageType = '请选择当前套餐';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSave(formData);
    onClose();
  };

  // Find currently selected package details
  const selectedPackage = packagesList.find((p) => p.name === formData.packageType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
      <div
        id="create-edit-modal-box"
        className="bg-white rounded-[6px] shadow-2xl w-full max-w-[560px] max-h-[92vh] flex flex-col overflow-hidden border border-[#e5e6eb]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f3f5]">
          <h3 className="text-[16px] font-semibold text-[#1d2129]">
            {initialData ? '编辑租户' : '创建租户'}
          </h3>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded hover:bg-[#f2f3f5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-[13.5px]">
          {/* 1. 租户名称 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>租户名称
            </label>
            <div className="relative">
              <input
                id="tenant-name-input"
                type="text"
                maxLength={64}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: undefined });
                  }
                }}
                placeholder="请输入"
                className={`w-full h-[36px] px-3 pr-14 border rounded-[4px] focus:outline-none text-[#1d2129] text-[13px] transition-colors ${
                  validationErrors.name
                    ? 'border-[#f53f3f] focus:border-[#f53f3f]'
                    : 'border-[#d9d9d9] focus:border-[#2f54eb]'
                }`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#86909c] pointer-events-none select-none">
                {formData.name.length} / 64
              </span>
            </div>
            {validationErrors.name && (
              <p className="text-[12px] text-[#f53f3f] mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* 2. 租户管理员 (Corresponds to Tenant Account Management list) */}
          <div className="relative" ref={adminDropdownRef}>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>租户管理员
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => setAdminDropdownOpen(true)}
            >
              <input
                id="tenant-admin-select-input"
                type="text"
                value={adminSearchText}
                onChange={(e) => {
                  setAdminSearchText(e.target.value);
                  setFormData({ ...formData, adminName: e.target.value });
                  setAdminDropdownOpen(true);
                  if (validationErrors.adminName) {
                    setValidationErrors({ ...validationErrors, adminName: undefined });
                  }
                }}
                onFocus={() => setAdminDropdownOpen(true)}
                placeholder="请输入账户搜索"
                className={`w-full h-[36px] px-3 pr-8 border rounded-[4px] focus:outline-none text-[#1d2129] text-[13px] bg-white cursor-text transition-colors ${
                  validationErrors.adminName
                    ? 'border-[#f53f3f] focus:border-[#f53f3f]'
                    : 'border-[#d9d9d9] focus:border-[#2f54eb]'
                }`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86909c] pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
            </div>
            {validationErrors.adminName && (
              <p className="text-[12px] text-[#f53f3f] mt-1">{validationErrors.adminName}</p>
            )}

            {/* Dropdown list of accounts from Tenant Account Management */}
            {adminDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg max-h-[220px] overflow-y-auto py-1 animate-in fade-in duration-100">
                {filteredAccounts.length === 0 ? (
                  <div className="px-3 py-2.5 text-center text-[#86909c] text-[13px]">
                    未匹配到账户
                  </div>
                ) : (
                  filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectAdmin(acc)}
                      className={`px-3 py-2 text-[13px] flex items-center gap-3 hover:bg-[#f2f3f5] cursor-pointer transition-colors ${
                        formData.adminName === acc.username ? 'bg-[#f2f3f5] text-[#1d2129] font-medium' : 'text-[#1d2129]'
                      }`}
                    >
                      <span>{acc.username}</span>
                      {acc.nickname && (
                        <span className="text-[#86909c] text-[13px]">{acc.nickname}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. 当前套餐 (Corresponds to Package Management list from packageStore) */}
          <div className="relative" ref={packageDropdownRef}>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>当前套餐
            </label>
            <div
              id="tenant-package-select-trigger"
              onClick={() => setPackageDropdownOpen(!packageDropdownOpen)}
              className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] flex items-center justify-between bg-white cursor-pointer text-[13px] hover:border-[#2f54eb] transition-colors"
            >
              <span className={formData.packageType ? 'text-[#1d2129]' : 'text-[#86909c]'}>
                {formData.packageType || '请选择'}
              </span>
              <ChevronDown className="w-4 h-4 text-[#86909c] shrink-0" />
            </div>

            {packageDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg max-h-[220px] overflow-y-auto py-1 animate-in fade-in duration-100">
                {packagesList.length === 0 ? (
                  <div className="px-3 py-2.5 text-center text-[#86909c] text-[13px]">
                    暂无套餐数据
                  </div>
                ) : (
                  packagesList.map((pkg) => {
                    const isSelected = formData.packageType === pkg.name;
                    return (
                      <div
                        key={pkg.id}
                        id={`package-opt-${pkg.id}`}
                        onClick={() => {
                          setFormData({ ...formData, packageType: pkg.name });
                          setPackageDropdownOpen(false);
                          if (validationErrors.packageType) {
                            setValidationErrors({ ...validationErrors, packageType: undefined });
                          }
                        }}
                        className={`px-3 py-2 text-[13px] hover:bg-[#f2f3f5] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#e9f0fe] text-[#2f54eb] font-medium' : 'text-[#1d2129]'
                        }`}
                      >
                        <span>{pkg.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {validationErrors.packageType && (
              <p className="text-[12px] text-[#f53f3f] mt-1">{validationErrors.packageType}</p>
            )}
          </div>

          {/* 4. 套餐到期时间 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>套餐到期时间
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.expireTime}
                onChange={(e) => setFormData({ ...formData, expireTime: e.target.value })}
                placeholder="请选择"
                className="w-full h-[36px] px-3 pr-9 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px]"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86909c] pointer-events-none">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 5. 到期提醒 Toggle Switch */}
          <div className="pt-1">
            <label className="block text-[#1d2129] mb-1.5 font-normal">到期提醒</label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, expireReminder: !formData.expireReminder })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.expireReminder ? 'bg-[#2f54eb]' : 'bg-[#c9cdd4]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    formData.expireReminder ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 6. 提醒邮箱 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">提醒邮箱</label>
            <div className="space-y-2">
              {formData.reminderEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 h-[32px] px-3 border border-[#d9d9d9] rounded-[4px] bg-[#f7f8fa] flex items-center text-[13px] text-[#1d2129]">
                    {email}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="p-1.5 text-[#86909c] hover:text-[#f53f3f] rounded hover:bg-[#feecec] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {showEmailInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="输入提醒邮箱并回车确认"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    className="flex-1 h-[32px] px-3 border border-[#2f54eb] rounded-[4px] text-[13px] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-2.5 h-[32px] bg-[#2f54eb] text-white text-[12px] rounded-[4px] hover:bg-[#1d39c4]"
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailInput(false)}
                    className="px-2 h-[32px] border border-[#d9d9d9] text-[#4e5969] text-[12px] rounded-[4px] hover:bg-[#f2f3f5]"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEmailInput(true)}
                  className="flex items-center gap-1.5 text-[#2f54eb] hover:text-[#1d39c4] text-[13px] cursor-pointer pt-1"
                >
                  <div className="w-4 h-4 rounded-full border border-[#2f54eb] flex items-center justify-center">
                    <Plus className="w-3 h-3 text-[#2f54eb]" />
                  </div>
                  <span>添加提醒邮箱</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[#f2f3f5] bg-[#fafafa]">
          <button
            type="button"
            id="cancel-create-tenant-btn"
            onClick={onClose}
            className="h-[32px] px-4 rounded-[4px] border border-[#d9d9d9] bg-white text-[#4e5969] hover:bg-[#f2f3f5] text-[13px] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            id="submit-create-tenant-btn"
            onClick={handleSubmit}
            className="h-[32px] px-4 rounded-[4px] bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. Create or Edit Account Modal (Screenshot 4)
// ==========================================
interface CreateOrEditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Partial<TenantAccountItem>) => void;
  initialData?: TenantAccountItem | null;
}

export const CreateOrEditAccountModal: React.FC<CreateOrEditAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    phone: '',
    email: '',
    status: '正常' as '正常' | '禁用',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        nickname: initialData.nickname || '',
        password: initialData.password || 'DataGrand@2026',
        phone: initialData.phone || '',
        email: initialData.email || '',
        status: initialData.status || '正常',
      });
    } else {
      setFormData({
        username: '',
        nickname: '',
        password: '',
        phone: '',
        email: '',
        status: '正常',
      });
    }
    setShowPassword(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) return;
    if (!formData.nickname.trim()) return;
    if (!formData.phone.trim()) return;
    if (!formData.email.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
      <div
        id="account-modal-box"
        className="bg-white rounded-[6px] shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden border border-[#e5e6eb]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f3f5]">
          <h3 className="text-[16px] font-semibold text-[#1d2129]">
            {initialData ? '编辑账户' : '新建'}
          </h3>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded hover:bg-[#f2f3f5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form (Screenshot 4) */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-[13.5px]">
          {/* 1. 账户 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>账户
            </label>
            <input
              id="account-username-input"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="请输入"
              className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px]"
            />
          </div>

          {/* 2. 昵称 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>昵称
            </label>
            <input
              id="account-nickname-input"
              type="text"
              required
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="请输入"
              className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px]"
            />
          </div>

          {/* 3. 密码 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>密码
            </label>
            <div className="relative">
              <input
                id="account-password-input"
                type={showPassword ? 'text' : 'password'}
                required={!initialData}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="至少8位，含数字、大小写字母、特殊字符中任意三种"
                className="w-full h-[36px] px-3 pr-9 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px] placeholder:text-[12px] placeholder:text-[#86909c]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86909c] hover:text-[#1d2129] p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#86909c]" />}
              </button>
            </div>
          </div>

          {/* 4. 账户手机 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>账户手机
            </label>
            <input
              id="account-phone-input"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入"
              className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px]"
            />
          </div>

          {/* 5. 账户邮箱 */}
          <div>
            <label className="block text-[#1d2129] mb-1.5 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>账户邮箱
            </label>
            <input
              id="account-email-input"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入"
              className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[#1d2129] text-[13px]"
            />
          </div>

          {/* 6. 账户状态 (Radio buttons) */}
          <div>
            <label className="block text-[#1d2129] mb-2 font-normal">
              <span className="text-[#f53f3f] mr-1">*</span>账户状态
            </label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-[#1d2129]">
                <input
                  type="radio"
                  name="account-status"
                  value="正常"
                  checked={formData.status === '正常'}
                  onChange={() => setFormData({ ...formData, status: '正常' })}
                  className="w-4 h-4 text-[#2f54eb] focus:ring-[#2f54eb]"
                />
                <span>正常</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-[13.5px] text-[#1d2129]">
                <input
                  type="radio"
                  name="account-status"
                  value="禁用"
                  checked={formData.status === '禁用'}
                  onChange={() => setFormData({ ...formData, status: '禁用' })}
                  className="w-4 h-4 text-[#2f54eb] focus:ring-[#2f54eb]"
                />
                <span>禁用</span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[#f2f3f5] bg-[#fafafa]">
          <button
            type="button"
            id="cancel-account-btn"
            onClick={onClose}
            className="h-[32px] px-4 rounded-[4px] border border-[#d9d9d9] bg-white text-[#4e5969] hover:bg-[#f2f3f5] text-[13px] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            id="submit-account-btn"
            onClick={handleSubmit}
            className="h-[32px] px-4 rounded-[4px] bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Reset Password Modal
// ==========================================
interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TenantAccountItem | null;
  onConfirm: (newPassword: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  account,
  onConfirm,
}) => {
  const [newPassword, setNewPassword] = useState('DataGrand@2026');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="bg-white rounded-[6px] shadow-xl w-full max-w-[440px] overflow-hidden border border-[#e5e6eb]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f3f5]">
          <h3 className="text-[15px] font-semibold text-[#1d2129]">重置密码</h3>
          <button onClick={onClose} className="text-[#86909c] hover:text-[#1d2129]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13.5px]">
          <p className="text-[#4e5969]">
            重置账户 <span className="font-semibold text-[#1d2129]">{account.username}</span> 的登录密码：
          </p>

          <div>
            <label className="block text-[#1d2129] mb-1 font-medium">新密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                className="w-full h-[36px] px-3 pr-9 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86909c]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[#f2f3f5] bg-[#fafafa]">
          <button
            onClick={onClose}
            className="h-[32px] px-4 rounded-[4px] border border-[#d9d9d9] text-[#4e5969] hover:bg-[#f2f3f5]"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(newPassword);
              onClose();
            }}
            className="h-[32px] px-4 rounded-[4px] bg-[#2f54eb] text-white hover:bg-[#1d39c4]"
          >
            确认重置
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. View Detail Modal
// ==========================================
interface ViewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantItem | null;
}

export const ViewDetailModal: React.FC<ViewDetailModalProps> = ({
  isOpen,
  onClose,
  tenant,
}) => {
  if (!isOpen || !tenant) return null;

  const allPackages = getStoredPackages();
  const matchedPkg = allPackages.find((p) => p.name === tenant.packageType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="bg-white rounded-[6px] shadow-xl w-full max-w-[500px] overflow-hidden border border-[#e5e6eb]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f3f5]">
          <h3 className="text-[15px] font-semibold text-[#1d2129]">租户详情</h3>
          <button onClick={onClose} className="text-[#86909c] hover:text-[#1d2129]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3.5 text-[13.5px]">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">租户名称：</span>
            <span className="col-span-2 text-[#1d2129] font-medium">{tenant.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">租户管理员：</span>
            <span className="col-span-2 text-[#1d2129]">{tenant.adminName}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">套餐类型：</span>
            <div className="col-span-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#1d2129] font-medium">{tenant.packageType}</span>
                {matchedPkg && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-[#f0f5ff] text-[#2f54eb] rounded border border-[#d6e4ff]">
                    {matchedPkg.modules?.length || 0} 个模块
                  </span>
                )}
              </div>
              {matchedPkg && matchedPkg.modules && matchedPkg.modules.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {matchedPkg.modules.map((m, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-1.5 py-0.5 bg-[#f7f8fa] text-[#4e5969] rounded border border-[#e5e6eb]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">到期时间：</span>
            <span className="col-span-2 text-[#1d2129] font-mono">{tenant.expireTime}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">租户状态：</span>
            <span className="col-span-2">
              <span
                className={`inline-block px-1.5 py-[1px] text-[12px] rounded-[2px] ${
                  tenant.status === '正常'
                    ? 'bg-[#f6ffed] border border-[#b7eb8f] text-[#52c41a]'
                    : 'bg-[#fff1f0] border border-[#ffa39e] text-[#f5222d]'
                }`}
              >
                {tenant.status}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">创建时间：</span>
            <span className="col-span-2 text-[#1d2129] font-mono">{tenant.createTime}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-[#86909c]">归属部门：</span>
            <span className="col-span-2 text-[#1d2129]">{tenant.department || '-'}</span>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-[#f2f3f5] bg-[#fafafa]">
          <button
            onClick={onClose}
            className="h-[32px] px-4 rounded-[4px] bg-[#2f54eb] text-white hover:bg-[#1d39c4] text-[13px]"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. Authorize App Modal
// ==========================================
interface AuthAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantItem | null;
}

export const AuthAppModal: React.FC<AuthAppModalProps> = ({
  isOpen,
  onClose,
  tenant,
}) => {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && tenant) {
      const apps = loadCompareApps();
      setSelectedApps(
        apps
          .filter((app) =>
            (app.authorizedTenants || []).some(
              (auth) =>
                auth.tenantName === tenant.name || auth.tenantId === tenant.id
            )
          )
          .map((app) => app.name)
      );
    }
  }, [isOpen, tenant?.id, tenant?.name]);

  if (!isOpen || !tenant) return null;

  const toggleApp = (appName: string) => {
    if (selectedApps.includes(appName)) {
      setSelectedApps(selectedApps.filter((a) => a !== appName));
    } else {
      setSelectedApps([...selectedApps, appName]);
    }
  };

  const availableAppList = loadCompareApps()
    .filter((app) => app.status !== '未上架')
    .map((app) => app.name);

  const handleSave = () => {
    const apps = loadCompareApps();
    const updated = apps.map((app) => {
      const records = (app.authorizedTenants || []).filter(
        (auth) =>
          auth.tenantName !== tenant.name && auth.tenantId !== tenant.id
      );
      const shouldGrant = selectedApps.includes(app.name);
      if (!shouldGrant) {
        const customer =
          records.length === 0
            ? '无'
            : records.length === 1
            ? records[0].tenantName
            : `${records[0].tenantName}等${records.length}家`;
        return { ...app, authorizedTenants: records, customer };
      }
      const newRecord: CustomerAuthRecord = {
        id: `auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenantName: tenant.name,
        tenantId: tenant.id,
        expireDate: tenant.expireTime ? tenant.expireTime.split(' ')[0] : '',
        rule: '-',
        manageType: '租户管理',
        process: '',
        allowResultEdit: '',
        createTime: new Date().toISOString().split('T')[0],
      };
      const next = [...records, newRecord];
      const customer =
        next.length === 1
          ? next[0].tenantName
          : `${next[0].tenantName}等${next.length}家`;
      return { ...app, authorizedTenants: next, customer };
    });
    saveCompareApps(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="bg-white rounded-[6px] shadow-xl w-full max-w-[520px] overflow-hidden border border-[#e5e6eb]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2f3f5]">
          <h3 className="text-[15px] font-semibold text-[#1d2129]">
            授权应用 - {tenant.name}
          </h3>
          <button onClick={onClose} className="text-[#86909c] hover:text-[#1d2129]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-[13.5px]">
          <p className="text-[#4e5969] text-[13px] mb-2">
            请勾选需要为此租户授权的智能体应用（授权后该租户在SaaS端可见）：
          </p>

          <div className="space-y-2 border border-[#e5e6eb] rounded-[4px] p-3 max-h-[220px] overflow-y-auto">
            {availableAppList.map((app) => {
              const checked = selectedApps.includes(app);
              return (
                <div
                  key={app}
                  onClick={() => toggleApp(app)}
                  className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${
                    checked ? 'bg-[#e9f0fe] text-[#2f54eb]' : 'hover:bg-[#f2f3f5] text-[#1d2129]'
                  }`}
                >
                  <span className="font-medium text-[13px]">{app}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="w-4 h-4 text-[#2f54eb] rounded"
                  />
                </div>
              );
            })}
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 text-[#52c41a] text-[13px] pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>应用授权保存成功！已同步至租户SaaS端。</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[#f2f3f5] bg-[#fafafa]">
          <button
            onClick={onClose}
            className="h-[32px] px-4 rounded-[4px] border border-[#d9d9d9] text-[#4e5969] hover:bg-[#f2f3f5] text-[13px]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="h-[32px] px-4 rounded-[4px] bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px]"
          >
            保存授权
          </button>
        </div>
      </div>
    </div>
  );
};
