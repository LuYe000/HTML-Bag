import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TenantManagement } from './components/TenantManagement';
import { TenantAccountManagement } from './components/TenantAccountManagement';
import { CompareAppManagement } from './components/CompareAppManagement';
import { CompareRuleManagement } from './components/CompareRuleManagement';
import { CompareLayoutManagement } from './components/CompareLayoutManagement';
import { PackageManagement } from './components/PackageManagement';
import { SaasMarketplacePage } from './components/SaasMarketplacePage';
import { PlatformSwitchPage } from './components/PlatformSwitchPage';
import { setCurrentTenant } from './appConfigStore';
import { AppItem } from './types';

const ENABLED_ADMIN_MENUS = new Set([
  'tenant',
  'tenant_list',
  'tenant_account',
  'package_mgmt',
  'compare_app',
  'compare_rule',
  'compare_layout',
]);

export default function App() {
  // Routing mode based on URL: 'admin' vs 'saas' vs 'platform_switch'
  const [appMode, setAppMode] = useState<'admin' | 'saas' | 'platform_switch'>(() => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('platform') || pathname.includes('/platform')) {
      return 'platform_switch';
    }
    if (hash.includes('saas') || pathname.includes('/saas')) {
      return 'saas';
    }
    return 'admin';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (hash.includes('platform') || pathname.includes('/platform')) {
        setAppMode('platform_switch');
      } else if (hash.includes('saas') || pathname.includes('/saas')) {
        setAppMode('saas');
      } else {
        setAppMode('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Default to compare_app (比对智能体 -> 应用管理) as requested
  const [activeMenu, setActiveMenu] = useState('compare_app');
  const [configuringApp, setConfiguringApp] = useState<AppItem | null>(null);

  useEffect(() => {
    if (!ENABLED_ADMIN_MENUS.has(activeMenu)) {
      setActiveMenu('compare_app');
    }
  }, [activeMenu]);

  // Determine current breadcrumbs
  const getBreadcrumbConfig = () => {
    if (activeMenu === 'package_mgmt') {
      return {
        breadcrumbs: [
          { label: '系统设置' },
          { label: '套餐管理' },
        ],
      };
    }
    if (activeMenu === 'tenant_list' || activeMenu === 'tenant') {
      return {
        breadcrumbs: [
          { label: '租户管理' },
          { label: '租户管理' },
        ],
      };
    }
    if (activeMenu === 'tenant_account') {
      return {
        breadcrumbs: [
          { label: '租户管理' },
          { label: '租户账户管理' },
        ],
      };
    }
    if (activeMenu === 'compare_app') {
      if (configuringApp) {
        return {
          breadcrumbs: [
            { label: '比对智能体', onClick: () => setConfiguringApp(null) },
            { label: '应用管理', onClick: () => setConfiguringApp(null) },
            { label: '客户配置' },
          ],
          onBack: () => setConfiguringApp(null),
        };
      }
      return {
        breadcrumbs: [
          { label: '比对智能体' },
          { label: '应用管理' },
        ],
      };
    }
    if (activeMenu === 'compare_rule') {
      return {
        breadcrumbs: [
          { label: '比对智能体' },
          { label: '规则管理' },
        ],
      };
    }
    if (activeMenu === 'compare_layout') {
      return {
        breadcrumbs: [
          { label: '比对智能体' },
          { label: '版面管理' },
        ],
      };
    }
    return {
      breadcrumbs: [
        { label: '智能体平台' },
      ],
    };
  };

  const breadcrumbConfig = getBreadcrumbConfig();

  // If in Platform Switch mode (Screenshot 2)
  if (appMode === 'platform_switch') {
    return (
      <PlatformSwitchPage
        onEnterPlatform={(platformName) => {
          setCurrentTenant(platformName);
          setAppMode('saas');
          window.location.hash = '#saas';
        }}
        onGoToAdmin={() => {
          setAppMode('admin');
          window.location.hash = '#admin';
        }}
      />
    );
  }

  // If in SaaS mode, render the SaaS Marketplace Page
  if (appMode === 'saas') {
    return (
      <SaasMarketplacePage
        onSwitchPlatform={() => {
          setAppMode('platform_switch');
          window.location.hash = '#platform';
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans antialiased text-[#1d2129]">
      {/* Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeMenu={activeMenu}
        onSelectMenu={(menu) => {
          setActiveMenu(menu);
          setConfiguringApp(null);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Top Header with Breadcrumb and User Profile */}
        <Header
          breadcrumbs={breadcrumbConfig.breadcrumbs}
          onBack={breadcrumbConfig.onBack}
        />

        {/* Content based on Active Menu */}
        {activeMenu === 'package_mgmt' ? (
          <PackageManagement />
        ) : activeMenu === 'tenant_list' || activeMenu === 'tenant' ? (
          <TenantManagement />
        ) : activeMenu === 'tenant_account' ? (
          <TenantAccountManagement />
        ) : activeMenu === 'compare_app' ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <CompareAppManagement
              configuringApp={configuringApp}
              onConfiguringAppChange={setConfiguringApp}
            />
          </div>
        ) : activeMenu === 'compare_rule' ? (
          <div className="flex-1 overflow-y-auto bg-white flex flex-col">
            <CompareRuleManagement />
          </div>
        ) : activeMenu === 'compare_layout' ? (
          <div className="flex-1 overflow-y-auto bg-white flex flex-col">
            <CompareLayoutManagement />
          </div>
        ) : (
          <div className="flex-1 bg-white" />
        )}
      </div>
    </div>
  );
}
