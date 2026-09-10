import React, { useState, useEffect } from 'react';
import { Bot, ChevronDown, Store, User, Lock, Settings, LogOut } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  getCurrentAccountName,
  getTenantsForAccount,
  getStoredTenants,
  TENANTS_UPDATED_EVENT,
  ACCOUNTS_UPDATED_EVENT,
  CURRENT_ACCOUNT_CHANGED_EVENT,
} from '../accountTenantStore';

export interface PlatformItem {
  id: string;
  name: string;
  expireDate: string;
  role: string;
}

interface PlatformSwitchPageProps {
  onEnterPlatform: (platformName: string) => void;
  onGoToAdmin?: () => void;
}

export const PlatformSwitchPage: React.FC<PlatformSwitchPageProps> = ({
  onEnterPlatform,
  onGoToAdmin,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>(() => getCurrentAccountName());
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);

  const refreshData = () => {
    const accName = getCurrentAccountName();
    setCurrentAccount(accName);

    // Query all tenants mapped to this tenant account (1-to-many relationship)
    const userTenants = getTenantsForAccount(accName);
    if (userTenants.length > 0) {
      const items: PlatformItem[] = userTenants.map((t) => ({
        id: t.id,
        name: t.name,
        expireDate: t.expireTime ? t.expireTime.split(' ')[0] : '2027-06-01',
        role: '主管',
      }));
      setPlatforms(items);
    } else {
      // Fallback: If this account doesn't have a specific tenant assigned yet, default to all active tenants or luyeye
      const allTenants = getStoredTenants();
      if (allTenants.length > 0) {
        setPlatforms(
          allTenants.slice(0, 3).map((t) => ({
            id: t.id,
            name: t.name,
            expireDate: t.expireTime ? t.expireTime.split(' ')[0] : '2027-06-01',
            role: '主管',
          }))
        );
      } else {
        setPlatforms([
          {
            id: 'plat-1',
            name: 'luyeye',
            expireDate: '2027-06-01',
            role: '主管',
          },
        ]);
      }
    }
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener(TENANTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(ACCOUNTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(CURRENT_ACCOUNT_CHANGED_EVENT, handleUpdate);

    return () => {
      window.removeEventListener(TENANTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(ACCOUNTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(CURRENT_ACCOUNT_CHANGED_EVENT, handleUpdate);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#fafbfc] font-sans antialiased text-[#1d2129] select-none">
      {/* Top Header */}
      <header className="h-[52px] bg-white border-b border-[#edf0f5] px-6 flex items-center justify-between shrink-0">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center">
            {/* 达观AI智能体平台 logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-[#6366f1]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="url(#sparkle-gradient)"
                stroke="none"
              />
              <defs>
                <linearGradient id="sparkle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#2f54eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[15px] font-bold text-[#1d2129] tracking-tight">
            达观AI智能体平台
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-1.5 text-[#4e5969] hover:text-[#165dff] hover:bg-[#f2f3f5] rounded-[4px] transition-colors cursor-pointer"
            title="智能助理"
          >
            <Bot className="w-5 h-5 text-[#4e5969]" />
          </button>

          {/* User Profile */}
          <div className="relative">
            <div
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 cursor-pointer group py-1 px-1.5 rounded hover:bg-[#f2f3f5] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#f2f3f5] border border-[#e5e6eb] flex items-center justify-center text-[#86909c]">
                <User className="w-4 h-4 text-[#4e5969]" />
              </div>
              <span className="text-[13px] font-medium text-[#1d2129]">{currentAccount}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86909c] group-hover:text-[#1d2129] transition-colors" />
            </div>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-xl border border-[#e5e6eb] py-1 z-50 text-[13px] text-[#4e5969] animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[#f2f3f5]">
                    <p className="font-medium text-[#1d2129]">{currentAccount}</p>
                    <p className="text-xs text-[#86909c]">达观AI智能体平台</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#f7f8fa] flex items-center gap-2 cursor-pointer text-[#4e5969] transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#86909c]" />
                    <span>修改密码</span>
                  </button>
                  {onGoToAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onGoToAdmin();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#e8f3ff] text-[#165dff] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#165dff]" />
                      <span>切换至 Admin 管理端</span>
                    </button>
                  )}
                  <div className="border-t border-[#f2f3f5] my-1" />
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-3 py-2 hover:bg-[#f7f8fa] flex items-center gap-2 cursor-pointer text-[#4e5969] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#86909c]" />
                    <span>退出登录</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto px-8 py-7 max-w-7xl w-full mx-auto">
        <h2 className="text-[14px] font-semibold text-[#1d2129] mb-4">
          我的平台({platforms.length})
        </h2>

        {/* Platform Cards List */}
        {platforms.length === 0 ? (
          <div className="bg-white border border-[#e5e6eb] rounded-lg p-12 text-center">
            <Store className="w-12 h-12 text-[#c9cdd4] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#1d2129] mb-1">
              暂无已关联的平台
            </p>
            <p className="text-xs text-[#86909c] mb-4">
              请前往 Admin 端【租户管理】创建租户并将租户管理员指定为「{currentAccount}」
            </p>
            {onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="px-4 py-2 bg-[#165dff] hover:bg-[#0e42d2] text-white text-xs rounded transition-colors cursor-pointer"
              >
                前往 Admin 端租户管理
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="w-full bg-white border border-[#e5e6eb] rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Platform Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-7 h-7 rounded bg-[#f0f4ff] text-[#4f73f7] flex items-center justify-center">
                      <Store className="w-4 h-4 text-[#4f73f7]" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#1d2129] tracking-tight">
                      {platform.name}
                    </h3>
                  </div>

                  {/* Platform Meta Info */}
                  <div className="space-y-1.5 text-[12.5px] text-[#86909c] mb-6">
                    <div className="flex items-center">
                      <span>有效期至：</span>
                      <span className="text-[#4e5969] ml-1">{platform.expireDate}</span>
                    </div>
                    <div className="flex items-center">
                      <span>访问身份：</span>
                      <span className="text-[#4e5969] ml-1">{platform.role}</span>
                    </div>
                  </div>
                </div>

                {/* Enter Button */}
                <button
                  type="button"
                  onClick={() => onEnterPlatform(platform.name)}
                  className="w-full h-[36px] bg-[#4f73f7] hover:bg-[#3b61eb] active:bg-[#2f54eb] text-white text-[13.5px] font-medium rounded-[4px] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                >
                  进入平台
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
