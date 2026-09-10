import React, { useState, useRef, useEffect } from 'react';
import { History, User, ChevronDown, ChevronLeft, ChevronRight, LogOut, Shield, Key, Store } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface HeaderProps {
  currentTitle?: string;
  parentTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTitle = '租户管理',
  parentTitle = '租户管理',
  breadcrumbs,
  onBack,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="top-header"
      className="h-[52px] bg-white border-b border-[#edf0f5] px-6 flex items-center justify-between shrink-0 select-none"
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13.5px]">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-5 h-5 rounded-full border border-[#86909c] hover:border-[#1d2129] flex items-center justify-center text-[#86909c] hover:text-[#1d2129] transition-colors cursor-pointer mr-0.5"
            title="返回"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.2] -ml-[1px]" />
          </button>
        ) : (
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[#86909c]">
            <History className="w-3.5 h-3.5" />
          </div>
        )}

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-2">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-[#c9cdd4] text-[12px] font-normal">&gt;</span>
                  )}
                  {item.onClick && !isLast ? (
                    <span
                      onClick={item.onClick}
                      className="text-[#4e5969] hover:text-[#2f54eb] cursor-pointer transition-colors"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'text-[#1d2129] font-medium'
                          : 'text-[#86909c]'
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#86909c]">
            <span className="hover:text-[#1d2129] cursor-pointer transition-colors">
              {parentTitle}
            </span>
            <span className="text-[#c9cdd4] text-[12px] font-normal">&gt;</span>
            <span className="text-[#1d2129] font-medium">{currentTitle}</span>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="user-profile-menu-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[#f2f3f5] transition-colors cursor-pointer text-[#1d2129]"
        >
          <div className="w-7 h-7 rounded-full bg-[#f2f3f5] border border-[#e5e6eb] flex items-center justify-center text-[#86909c]">
            <User className="w-4 h-4" />
          </div>
          <span className="text-[13.5px] text-[#1d2129] font-normal">admin</span>
          <ChevronDown className="w-3 h-3 text-[#86909c]" />
        </button>

        {dropdownOpen && (
          <div
            id="user-dropdown-panel"
            className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-[#e5e6eb] py-1 z-50 text-[13px] text-[#4e5969]"
          >
            <div className="px-3 py-2 border-b border-[#f2f3f5]">
              <p className="font-medium text-[#1d2129]">超级管理员</p>
              <p className="text-xs text-[#86909c]">admin@example.com</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                window.location.hash = '#saas';
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#e8f3ff] text-[#165dff] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Store className="w-3.5 h-3.5 text-[#165dff]" />
              <span>切换至 SaaS 端</span>
            </button>
            <div className="border-t border-[#f2f3f5] my-1" />
            <button
              onClick={() => setDropdownOpen(false)}
              className="w-full text-left px-3 py-2 hover:bg-[#f7f8fa] flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#86909c]" />
              <span>权限中心</span>
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                setIsPasswordModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#f7f8fa] flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-[#86909c]" />
              <span>修改密码</span>
            </button>
            <div className="border-t border-[#f2f3f5] my-1" />
            <button
              onClick={() => setDropdownOpen(false)}
              className="w-full text-left px-3 py-2 hover:bg-[#fff0f0] text-red-600 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
};
