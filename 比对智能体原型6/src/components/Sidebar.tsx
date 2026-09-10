import React, { useState } from 'react';
import {
  User,
  Settings,
  Sparkles,
  Search,
  FolderKanban,
  Scale,
  FileSearch,
  GitCompare,
  ShieldCheck,
  Bot,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
}

interface SubMenuItem {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  children?: SubMenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'tenant_group',
    name: '租户管理',
    icon: User,
    hasSubmenu: true,
    children: [
      { id: 'tenant_list', name: '租户管理' },
      { id: 'tenant_account', name: '租户账户管理' },
    ],
  },
  {
    id: 'settings_group',
    name: '系统设置',
    icon: Settings,
    hasSubmenu: true,
    children: [
      { id: 'sys_log', name: '操作日志' },
      { id: 'sys_scene', name: '场景管理' },
      { id: 'sys_dept', name: '部门管理' },
      { id: 'sys_staff', name: '员工管理' },
      { id: 'sys_module', name: '模块管理' },
      { id: 'sys_menu', name: '菜单管理' },
      { id: 'sys_role', name: '角色管理' },
      { id: 'package_mgmt', name: '套餐管理' },
      { id: 'sys_dict', name: '字典配置' },
      { id: 'sys_material', name: '素材中心' },
    ],
  },
  { id: 'gen_agent', name: '生成智能体', icon: Sparkles, hasSubmenu: true },
  { id: 'audit_agent', name: '审核智能体', icon: Search, hasSubmenu: true },
  { id: 'project_audit', name: '项目审核', icon: FolderKanban, hasSubmenu: true },
  { id: 'debt_agent', name: '债承智能体', icon: Scale, hasSubmenu: true },
  {
    id: 'compare_agent',
    name: '比对智能体',
    icon: GitCompare,
    hasSubmenu: true,
    children: [
      { id: 'compare_app', name: '应用管理' },
      { id: 'compare_rule', name: '规则管理' },
      { id: 'compare_layout', name: '版面管理' },
    ],
  },
  { id: 'cd_agent', name: '中登查重智能体', icon: FileSearch, hasSubmenu: true },
  { id: 'tools', name: '通用工具', icon: ShieldCheck, hasSubmenu: true },
  { id: 'claw', name: '达观Claw', icon: Bot, hasSubmenu: true },
];

const DISABLED_ADMIN_MENUS = new Set([
  'gen_agent',
  'audit_agent',
  'project_audit',
  'debt_agent',
  'cd_agent',
  'tools',
  'claw',
]);

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeMenu,
  onSelectMenu,
}) => {
  const [tenantExpanded, setTenantExpanded] = useState(
    activeMenu === 'tenant' || activeMenu === 'tenant_list' || activeMenu === 'tenant_account'
  );
  const [settingsExpanded, setSettingsExpanded] = useState(
    activeMenu.startsWith('sys_') || activeMenu === 'package_mgmt' || activeMenu === 'settings_group'
  );
  const [compareExpanded, setCompareExpanded] = useState(
    activeMenu.startsWith('compare_') || true
  );

  return (
    <aside
      id="sidebar"
      className={`h-screen flex flex-col justify-between transition-all duration-200 select-none border-r border-[#e8ecf3] bg-[#f5f7fc] text-[#333333] ${
        collapsed ? 'w-[68px]' : 'w-[218px]'
      } shrink-0`}
    >
      {/* Top Logo and App Name */}
      <div className="flex items-center h-[56px] px-4 gap-2.5 overflow-hidden">
        {/* Custom 4-pointed sparkle gradient icon */}
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path
              d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
              fill="url(#sparkle-gradient)"
            />
            <defs>
              <linearGradient id="sparkle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4f46e5" />
                <stop offset="0.5" stopColor="#3b82f6" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {!collapsed && (
          <span className="font-semibold text-[15px] tracking-tight text-[#1a1d24] whitespace-nowrap overflow-hidden text-ellipsis">
            达观AI智能体平台
          </span>
        )}
      </div>

      {/* Navigation Menus */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isTenant = item.id === 'tenant_group';
          const isSettings = item.id === 'settings_group';
          const isCompare = item.id === 'compare_agent';

          if (isTenant) {
            const isGroupActive =
              activeMenu === 'tenant' ||
              activeMenu === 'tenant_list' ||
              activeMenu === 'tenant_account';
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  id={`menu-item-${item.id}`}
                  onClick={() => {
                    setTenantExpanded(!tenantExpanded);
                    if (
                      activeMenu !== 'tenant' &&
                      activeMenu !== 'tenant_list' &&
                      activeMenu !== 'tenant_account'
                    ) {
                      onSelectMenu('tenant_list');
                    }
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[14px] transition-colors cursor-pointer group ${
                    isGroupActive
                      ? 'text-[#2f54eb] font-medium'
                      : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Icon
                      className={`w-[17px] h-[17px] shrink-0 ${
                        isGroupActive ? 'text-[#2f54eb]' : 'text-[#64748b] group-hover:text-[#1d2129]'
                      }`}
                    />
                    {!collapsed && (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis text-[13.5px]">
                        {item.name}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setTenantExpanded(!tenantExpanded);
                      }}
                      className="p-0.5"
                    >
                      {tenantExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#2f54eb] stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu for Tenant Management */}
                {!collapsed && tenantExpanded && item.children && (
                  <div className="pl-6 space-y-0.5 py-0.5">
                    {item.children.map((sub) => {
                      const isSubActive =
                        (sub.id === 'tenant_list' && (activeMenu === 'tenant_list' || activeMenu === 'tenant')) ||
                        (sub.id === 'tenant_account' && activeMenu === 'tenant_account');
                      return (
                        <button
                          key={sub.id}
                          id={`submenu-item-${sub.id}`}
                          onClick={() => onSelectMenu(sub.id)}
                          className={`w-full flex items-center px-3 py-2 rounded-[5px] text-[13px] transition-colors cursor-pointer ${
                            isSubActive
                              ? 'bg-[#e9f0fe] text-[#2f54eb] font-medium'
                              : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129]'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (isSettings) {
            const isGroupActive =
              activeMenu === 'package_mgmt' ||
              (item.children && item.children.some((c) => c.id === activeMenu));
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  id={`menu-item-${item.id}`}
                  onClick={() => {
                    setSettingsExpanded(!settingsExpanded);
                    if (!item.children?.some((c) => c.id === activeMenu)) {
                      onSelectMenu('package_mgmt');
                    }
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[14px] transition-colors cursor-pointer group ${
                    isGroupActive
                      ? 'text-[#2f54eb] font-medium'
                      : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Icon
                      className={`w-[17px] h-[17px] shrink-0 ${
                        isGroupActive ? 'text-[#2f54eb]' : 'text-[#64748b] group-hover:text-[#1d2129]'
                      }`}
                    />
                    {!collapsed && (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis text-[13.5px]">
                        {item.name}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsExpanded(!settingsExpanded);
                      }}
                      className="p-0.5"
                    >
                      {settingsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#2f54eb] stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu for System Settings */}
                {!collapsed && settingsExpanded && item.children && (
                  <div className="pl-6 space-y-0.5 py-0.5">
                    {item.children.map((sub) => {
                      const isAllowed = sub.id === 'package_mgmt';
                      const isSubActive =
                        isAllowed &&
                        (activeMenu === sub.id ||
                          (sub.id === 'package_mgmt' && activeMenu === 'settings'));
                      return (
                        <button
                          key={sub.id}
                          id={`submenu-item-${sub.id}`}
                          onClick={() => {
                            if (isAllowed) {
                              onSelectMenu('package_mgmt');
                            }
                          }}
                          disabled={!isAllowed}
                          aria-disabled={!isAllowed}
                          className={`w-full flex items-center px-3 py-2 rounded-[5px] text-[13px] transition-colors ${
                            isSubActive
                              ? 'bg-[#e9f0fe] text-[#2f54eb] font-medium'
                              : isAllowed
                              ? 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129] cursor-pointer'
                              : 'text-[#c9cdd4] cursor-default'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (isCompare) {
            const isParentActive =
              activeMenu === item.id || (item.children && item.children.some((c) => c.id === activeMenu));
            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  id={`menu-item-${item.id}`}
                  onClick={() => {
                    setCompareExpanded(!compareExpanded);
                    if (!item.children?.some((c) => c.id === activeMenu)) {
                      onSelectMenu(item.children![0].id);
                    }
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[14px] transition-colors cursor-pointer group ${
                    isParentActive
                      ? 'text-[#2f54eb] font-medium'
                      : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Icon
                      className={`w-[17px] h-[17px] shrink-0 ${
                        isParentActive ? 'text-[#2f54eb]' : 'text-[#64748b] group-hover:text-[#1d2129]'
                      }`}
                    />
                    {!collapsed && (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis text-[13.5px]">
                        {item.name}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompareExpanded(!compareExpanded);
                      }}
                      className="p-0.5"
                    >
                      {!compareExpanded ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#86909c]" />
                      ) : (
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isParentActive ? 'text-[#2f54eb]' : 'text-[#86909c]'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-menu items for 比对智能体 */}
                {!collapsed && compareExpanded && item.children && (
                  <div className="pl-6 space-y-0.5 py-0.5">
                    {item.children.map((sub) => {
                      const isSubActive = activeMenu === sub.id;
                      return (
                        <button
                          key={sub.id}
                          id={`submenu-item-${sub.id}`}
                          onClick={() => onSelectMenu(sub.id)}
                          className={`w-full flex items-center px-3 py-2 rounded-[5px] text-[13px] transition-colors cursor-pointer ${
                            isSubActive
                              ? 'bg-[#2f54eb] text-white font-medium shadow-[0_1px_2px_rgba(47,84,235,0.2)]'
                              : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129]'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Other menu items are not part of this admin prototype scope.
          const isDisabled = DISABLED_ADMIN_MENUS.has(item.id);
          return (
            <button
              key={item.id}
              id={`menu-item-${item.id}`}
              onClick={() => {
                if (!isDisabled) {
                  onSelectMenu(item.id);
                }
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              title={collapsed ? item.name : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[14px] transition-colors ${
                isDisabled
                  ? 'text-[#c9cdd4] cursor-not-allowed'
                  : 'text-[#4e5969] hover:bg-[#ebf0f7] hover:text-[#1d2129] cursor-pointer group'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Icon
                  className={`w-[17px] h-[17px] shrink-0 ${
                    isDisabled ? 'text-[#c9cdd4]' : 'text-[#64748b] group-hover:text-[#1d2129]'
                  }`}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis text-[13.5px]">
                    {item.name}
                  </span>
                )}
              </div>

              {!collapsed && item.children && item.children.length > 0 && (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#86909c]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Collapse Button */}
      <div className="p-3 border-t border-[#e8ecf3] flex items-center">
        <button
          id="collapse-sidebar-btn"
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-[#e2e8f0] text-[#86909c] hover:text-[#1d2129] transition-colors cursor-pointer"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
