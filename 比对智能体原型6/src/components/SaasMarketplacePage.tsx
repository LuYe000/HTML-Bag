import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  LayoutGrid,
  Settings,
  Building2,
  Share2,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  Bot,
  Search,
  ShoppingCart,
  Sparkles,
  Check,
  ArrowRight,
  UserCheck,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  LogOut,
  Layers,
} from 'lucide-react';
import { MarketCardIllustration } from './MarketCardIllustration';
import { CompareAppWorkspace } from './CompareAppWorkspace';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  getCurrentAccountName,
  getTenantsForAccount,
  CURRENT_ACCOUNT_CHANGED_EVENT,
} from '../accountTenantStore';
import { AppItem } from '../types';
import {
  loadCompareApps,
  getCurrentTenant,
  setCurrentTenant,
  CompareAppConfigItem,
} from '../appConfigStore';

interface MarketCardItem {
  id: string;
  title: string;
  desc: string;
  createDate: string;
  illustrationType: 'pdf_chart' | 'justice_scale' | 'credit_rating';
  industry: string;
  companyType: string;
  businessScene: string;
  authorizedTenants?: string[];
  status?: string;
}

// Preset marketplace catalog
const DEFAULT_MARKETPLACE_CATALOG: MarketCardItem[] = [
  {
    id: 'm-1',
    title: '招商银行募集说明书',
    desc: '招商银行专用债券募集说明书智能核查模版',
    createDate: '2026-06-02',
    illustrationType: 'pdf_chart',
    industry: '金融',
    companyType: '银行',
    businessScene: '经纪业务',
  },
  {
    id: 'm-2',
    title: '生成文案-jeky',
    desc: '辅助基金经理进行市场分析文档写作 与潜在投资人进行沟通基金定位和长远趋势',
    createDate: '2026-04-24',
    illustrationType: 'pdf_chart',
    industry: '金融',
    companyType: '基金',
    businessScene: '经纪业务',
  },
  {
    id: 'm-3',
    title: '写作',
    desc: '基于大模型的投行业务底稿材料智能撰写与格式校验',
    createDate: '2026-04-16',
    illustrationType: 'pdf_chart',
    industry: '金融',
    companyType: '证券',
    businessScene: '经纪业务',
  },
  {
    id: 'm-4',
    title: '通用校对-演示类-样本测...',
    desc: '面向 PPT、PNG 及图片中的文字内容，检测政治敏感、经济负面表述及文字错误；适用于...',
    createDate: '2026-08-05',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '证券',
    businessScene: '经纪业务',
  },
  {
    id: 'm-5',
    title: '审核应用-07301706-i4u',
    desc: '自动测试备注-170614',
    createDate: '2026-07-30',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '证券',
    businessScene: '经纪业务',
  },
  {
    id: 'm-6',
    title: '质押登记合同审核模版',
    desc: '中国人民银行征信中心动产与权利担保统一登记校验',
    createDate: '2026-07-28',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '信托',
    businessScene: '经纪业务',
  },
  {
    id: 'm-7',
    title: '企业征信及评级分析',
    desc: '针对企业信用等级报告与主体评级报告的多维度穿透审查',
    createDate: '2026-07-25',
    illustrationType: 'credit_rating',
    industry: '金融',
    companyType: '银行',
    businessScene: '经纪业务',
  },
  {
    id: 'm-8',
    title: '合规审计多维核查应用',
    desc: '自动检测合同违规条款、法律合规风险点与禁止性红线',
    createDate: '2026-07-22',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '保险',
    businessScene: '经纪业务',
  },
  {
    id: 'm-9',
    title: '保理融资转让核对',
    desc: '核心企业确权通知书与应收账款转让明细表一致性核验',
    createDate: '2026-07-18',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '期货',
    businessScene: '经纪业务',
  },
  {
    id: 'm-10',
    title: '债券承销主协议智能审查',
    desc: '募集说明书与底层信托贷款协议多条款勾稽审查',
    createDate: '2026-07-15',
    illustrationType: 'justice_scale',
    industry: '金融',
    companyType: '证券',
    businessScene: '经纪业务',
  },
];

// Available customer tenant switch list
const TENANT_OPTIONS = [
  { name: 'VIP客户', label: 'VIP客户（已授权3个应用）', code: 'vip' },
  { name: '性能测试店铺1', label: '性能测试店铺1', code: 'perf' },
  { name: '豆浆01', label: '豆浆01', code: 'doujiang' },
  { name: 'IFAS-01店铺', label: 'IFAS-01店铺', code: 'ifas01' },
  { name: '演示店铺', label: '演示店铺', code: 'demo' },
  { name: '测试租户_08261110', label: '测试租户_08261110', code: 'test0826' },
];

interface SaasMarketplacePageProps {
  onSwitchPlatform?: () => void;
}

export const SaasMarketplacePage: React.FC<SaasMarketplacePageProps> = ({
  onSwitchPlatform,
}) => {
  // Current active tenant in SaaS mode
  const resolveTenantFallback = () => {
    const saved = getCurrentTenant();
    if (saved && saved !== 'VIP客户') return saved;
    return (
      getTenantsForAccount(getCurrentAccountName())[0]?.name || 'luyeye'
    );
  };
  const [currentTenantName, setCurrentTenantState] = useState<string>(() =>
    resolveTenantFallback()
  );
  const [currentAccountName, setCurrentAccountState] = useState<string>(() => getCurrentAccountName());

  // Store apps loaded from admin config
  const [adminApps, setAdminApps] = useState<CompareAppConfigItem[]>(() => loadCompareApps());

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Listen to cross-store updates (when admin configures apps or changes tenant or account)
  useEffect(() => {
    const handleAppsUpdate = () => {
      setAdminApps(loadCompareApps());
    };
    const handleTenantUpdate = () => {
      setCurrentTenantState(resolveTenantFallback());
    };
    const handleAccountUpdate = () => {
      setCurrentAccountState(getCurrentAccountName());
    };

    window.addEventListener('daguan_apps_updated', handleAppsUpdate);
    window.addEventListener('daguan_tenant_changed', handleTenantUpdate);
    window.addEventListener(CURRENT_ACCOUNT_CHANGED_EVENT, handleAccountUpdate);
    return () => {
      window.removeEventListener('daguan_apps_updated', handleAppsUpdate);
      window.removeEventListener('daguan_tenant_changed', handleTenantUpdate);
      window.removeEventListener(CURRENT_ACCOUNT_CHANGED_EVENT, handleAccountUpdate);
    };
  }, []);

  // Switch active tenant
  const handleSelectTenant = (tenantName: string) => {
    setCurrentTenant(tenantName);
    setCurrentTenantState(tenantName);
    setToastMsg(`已切换当前租户为「${tenantName}」`);
  };

  // Sidebar state - defaulting to 'my_apps' per the user's latest request
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('my_apps');

  // Search keyword state
  const [searchKeyword, setSearchKeyword] = useState('');

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  // Filter states
  const [selectedIndustry, setSelectedIndustry] = useState('金融');
  const [selectedCompanyType, setSelectedCompanyType] = useState('全部');
  const [selectedBusinessScene, setSelectedBusinessScene] = useState('全部');

  // Cart interaction state
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedAppWorkspace, setSelectedAppWorkspace] = useState<AppItem | null>(null);

  const openAppWorkspace = (card: MarketCardItem) => {
    const originalApp = adminApps.find((a) => a.id === card.id || a.name === card.title);
    const isAuthorized =
      originalApp?.authorizedTenants?.some(
        (r) =>
          r.tenantName === currentTenantName ||
          r.tenantId === currentTenantName ||
          (currentTenantName.includes('VIP') && r.tenantName?.includes('VIP')) ||
          (currentTenantName.includes('luy') && r.tenantName?.includes('luy'))
      ) ?? false;

    if (!isAuthorized && activeNav === 'marketplace') {
      setToastMsg(`当前应用「${card.title}」未向租户「${currentTenantName}」授权，请联系管理员在 Admin 端授权`);
      return;
    }

    setSelectedAppWorkspace({
      id: card.id,
      name: card.title,
      desc: card.desc,
      status: (originalApp?.status as any) || '已上架',
      category: '文档比对',
      auditMode: originalApp?.auditMode || ['全文审核'],
      createDate: card.createDate,
      customer: currentTenantName,
    });
  };

  const toggleCart = (id: string, title: string) => {
    if (cartItems.includes(id)) {
      setCartItems(cartItems.filter((item) => item !== id));
      setToastMsg(`已从清单移除「${title}」`);
    } else {
      setCartItems([...cartItems, id]);
      setToastMsg(`已将「${title}」加入我的应用清单`);
    }
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Filter options exactly matching the screenshot
  const industryOptions = ['金融', '产业'];
  const companyTypeOptions = ['全部', '证券', '银行', '基金', '保险', '信托', '期货'];
  const businessSceneOptions = ['全部', '应付账款', '再保理', '债承业务', '经纪业务', '合规业务'];

  // 1. Dynamic "My Apps" Calculation strictly based on Admin-Side Configuration for currentTenant
  const dynamicMyApps = useMemo<MarketCardItem[]>(() => {
    return adminApps
      .filter((app) => {
        // Must be published/available
        if (app.status === '未上架') return false;

        // Strictly check if authorized to the current customer tenant by Admin
        const authorized = app.authorizedTenants || [];
        const isDirectlyAuthorized = authorized.some(
          (r) =>
            r.tenantName === currentTenantName ||
            r.tenantId === currentTenantName ||
            (currentTenantName.includes('VIP') && r.tenantName?.includes('VIP')) ||
            (currentTenantName.includes('luy') && r.tenantName?.includes('luy'))
        );

        return isDirectlyAuthorized;
      })
      .map((app) => ({
        id: app.id,
        title: app.name,
        desc: app.desc && app.desc !== '-' ? app.desc : '面向业务场景的智能体比对与合规核验应用',
        createDate: app.createDate,
        illustrationType:
          app.illustrationType ||
          (app.name.includes('供应链') || app.name.includes('征信')
            ? 'credit_rating'
            : app.name.includes('募集') || app.name.includes('审核') || app.name.includes('比对')
            ? 'justice_scale'
            : 'pdf_chart'),
        industry: app.industry || '金融',
        companyType: app.companyType || '证券',
        businessScene: app.businessScene || '合规业务',
        authorizedTenants: (app.authorizedTenants || []).map((t) => t.tenantName),
        status: app.status,
      }));
  }, [adminApps, currentTenantName]);

  // 2. Full Marketplace Catalog
  const fullMarketplace = useMemo<MarketCardItem[]>(() => {
    // Combine preset catalog with published admin apps
    const map = new Map<string, MarketCardItem>();
    DEFAULT_MARKETPLACE_CATALOG.forEach((item) => map.set(item.title, item));
    adminApps.forEach((app) => {
      if (app.status !== '未上架' && !map.has(app.name)) {
        map.set(app.name, {
          id: app.id,
          title: app.name,
          desc: app.desc || '-',
          createDate: app.createDate,
          illustrationType: app.illustrationType || 'pdf_chart',
          industry: app.industry || '金融',
          companyType: app.companyType || '证券',
          businessScene: app.businessScene || '合规业务',
        });
      }
    });
    return Array.from(map.values());
  }, [adminApps]);

  // Current dataset based on navigation tab
  const currentDataset = activeNav === 'my_apps' ? dynamicMyApps : fullMarketplace;

  // Filter logic
  const filteredCards = useMemo(() => {
    return currentDataset.filter((item) => {
      if (selectedIndustry && selectedIndustry !== item.industry) return false;
      if (selectedCompanyType !== '全部' && item.companyType !== selectedCompanyType) return false;
      if (selectedBusinessScene !== '全部' && item.businessScene !== selectedBusinessScene) return false;
      if (
        searchKeyword.trim() &&
        !item.title.toLowerCase().includes(searchKeyword.trim().toLowerCase()) &&
        !item.desc.toLowerCase().includes(searchKeyword.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [currentDataset, selectedIndustry, selectedCompanyType, selectedBusinessScene, searchKeyword]);

  // Group cards by business scene for "我的应用" view
  const complianceCards = filteredCards.filter((c) => c.businessScene === '合规业务');
  const brokerageCards = filteredCards.filter((c) => c.businessScene === '经纪业务');
  const debtCards = filteredCards.filter((c) => c.businessScene === '债承业务');
  const otherCards = filteredCards.filter(
    (c) => c.businessScene !== '合规业务' && c.businessScene !== '经纪业务' && c.businessScene !== '债承业务'
  );

  if (selectedAppWorkspace) {
    return (
      <CompareAppWorkspace
        app={selectedAppWorkspace}
        onBack={() => setSelectedAppWorkspace(null)}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans antialiased text-[#1d2129] select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1d2129]/90 text-white text-[13px] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#52c41a]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Left Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-[64px]' : 'w-[200px]'
        } h-screen bg-[#f7f8fa] border-r border-[#e5e6eb] flex flex-col transition-all duration-200 shrink-0 z-20 select-none`}
      >
        {/* Brand / Logo Area */}
        <div className="h-[56px] px-4 flex items-center gap-2.5 border-b border-[#e5e6eb]/60 shrink-0 overflow-hidden">
          <div className="w-6 h-6 rounded-[5px] bg-gradient-to-br from-[#4080ff] via-[#597ef7] to-[#722ed1] flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-[15px] tracking-tight text-[#1d2129] whitespace-nowrap">
              达观AI智能体平台
            </span>
          )}
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {/* 1. 应用市场 */}
          <button
            onClick={() => setActiveNav('marketplace')}
            className={`w-full h-[40px] px-3 rounded-[4px] flex items-center gap-2.5 text-[14px] transition-colors cursor-pointer ${
              activeNav === 'marketplace'
                ? 'bg-[#e8f3ff] text-[#165dff] font-medium'
                : 'text-[#4e5969] hover:bg-[#f2f3f5]'
            }`}
          >
            <Store
              className={`w-4 h-4 shrink-0 ${
                activeNav === 'marketplace' ? 'text-[#165dff]' : 'text-[#4e5969]'
              }`}
            />
            {!sidebarCollapsed && <span className="truncate">应用市场</span>}
          </button>

          {/* 2. 我的应用 (Active) */}
          <button
            onClick={() => setActiveNav('my_apps')}
            className={`w-full h-[40px] px-3 rounded-[4px] flex items-center gap-2.5 text-[14px] transition-colors cursor-pointer ${
              activeNav === 'my_apps'
                ? 'bg-[#e8f3ff] text-[#165dff] font-medium'
                : 'text-[#4e5969] hover:bg-[#f2f3f5]'
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 shrink-0 ${
                activeNav === 'my_apps' ? 'text-[#165dff]' : 'text-[#4e5969]'
              }`}
            />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between flex-1 truncate">
                <span className="truncate">我的应用</span>
                <span className="ml-1 px-1.5 py-0.2 bg-[#165dff]/10 text-[#165dff] text-[11px] font-semibold rounded-full">
                  {dynamicMyApps.length}
                </span>
              </div>
            )}
          </button>

          {/* 3. 系统设置（原型中暂不开放页面） */}
          <button
            type="button"
            className="w-full h-[40px] px-3 rounded-[4px] flex items-center justify-between text-[14px] text-[#4e5969]"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-[#4e5969] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">系统设置</span>}
            </div>
            {!sidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />}
          </button>

          {/* 4. 平台 (Expandable) */}
          <button
            onClick={() => setActiveNav('platform')}
            className="w-full h-[40px] px-3 rounded-[4px] flex items-center justify-between text-[14px] text-[#4e5969] hover:bg-[#f2f3f5] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#4e5969] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">平台</span>}
            </div>
            {!sidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />}
          </button>

          {/* 5. 开放平台 (Expandable) */}
          <button
            onClick={() => setActiveNav('open_platform')}
            className="w-full h-[40px] px-3 rounded-[4px] flex items-center justify-between text-[14px] text-[#4e5969] hover:bg-[#f2f3f5] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-[#4e5969] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">开放平台</span>}
            </div>
            {!sidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />}
          </button>
        </div>

        {/* Sidebar Bottom Collapse Button */}
        <div className="p-3 border-t border-[#e5e6eb]/60 shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-[4px] hover:bg-[#e5e6eb] text-[#86909c] transition-colors cursor-pointer"
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <ChevronsLeft
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Top Header Bar */}
        <header className="h-[56px] px-6 border-b border-[#e5e6eb] flex items-center justify-between bg-white shrink-0 z-10 select-none">
          {/* Left: Back button & Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {}}
              className="w-7 h-7 rounded-full border border-[#e5e6eb] flex items-center justify-center text-[#4e5969] hover:border-[#165dff] hover:text-[#165dff] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-medium text-[#1d2129]">
              {activeNav === 'my_apps' ? '我的应用' : '应用市场'}
            </span>
          </div>

          {/* Right: Bot Icon + User Profile */}
          <div className="flex items-center gap-4">
            {/* Bot / Robot Icon */}
            <button
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
                  <span className="text-[12px] font-medium text-[#4e5969]">
                    {currentAccountName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-medium text-[#1d2129] leading-tight">{currentAccountName}</span>
                  <span className="text-[10px] text-[#86909c] leading-tight">{currentTenantName}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#86909c] group-hover:text-[#1d2129] transition-colors ml-0.5" />
              </div>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl border border-[#e5e6eb] py-1 z-50 text-[13px] text-[#4e5969] animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-[#f2f3f5]">
                      <p className="font-medium text-[#1d2129]">{currentAccountName}</p>
                      <p className="text-xs text-[#86909c] truncate">当前租户：{currentTenantName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onSwitchPlatform) {
                          onSwitchPlatform();
                        } else {
                          window.location.hash = '#platform';
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#f7f8fa] flex items-center gap-2 cursor-pointer text-[#4e5969] transition-colors"
                    >
                      <Store className="w-3.5 h-3.5 text-[#86909c]" />
                      <span>切换平台</span>
                    </button>

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

                    <div className="border-t border-[#f2f3f5] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        window.location.hash = '#admin';
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#e8f3ff] text-[#165dff] flex items-center gap-2 cursor-pointer font-medium transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#165dff]" />
                      <span>切换至 Admin 管理端</span>
                    </button>
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

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto bg-[#fafbfc]">
          {/* Marketplace View: Has Hero Banner */}
          {activeNav === 'marketplace' && (
            <div className="relative w-full bg-gradient-to-b from-[#eaf2ff] via-[#f0f5ff] to-[#fafbfc] pt-10 pb-8 px-6 flex flex-col items-center select-none overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] bg-gradient-to-r from-blue-300/20 via-indigo-300/20 to-purple-300/20 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-center gap-1.5 mb-2.5">
                <h1 className="text-[28px] md:text-[32px] font-bold text-[#1d2129] tracking-tight text-center">
                  找到适合你业务的智能审核应用
                </h1>
                <span className="text-[24px] md:text-[28px] transform -translate-y-1">✨</span>
              </div>

              <p className="text-[14px] text-[#86909c] mb-7 text-center">
                汇聚多业务场景审核应用，开箱即用，让审核更快、更准、更合规
              </p>

              <div className="w-full max-w-[700px] relative">
                <div className="w-full h-[46px] bg-white rounded-full border border-[#e5e6eb] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#b4c8ff] focus-within:border-[#165dff] focus-within:shadow-[0_2px_12px_rgba(22,93,255,0.12)] transition-all flex items-center px-4">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="输入应用名称搜索..."
                    className="flex-1 h-full bg-transparent border-none outline-none text-[14px] text-[#1d2129] placeholder:text-[#a5abb6] pl-2"
                  />
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1 text-[#4e5969] hover:text-[#165dff] transition-colors pr-1 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#86909c]" />
                    <span className="text-[13px] text-[#4e5969]">搜索</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar & Content Area */}
          <div className={`max-w-[1600px] mx-auto px-8 ${activeNav === 'my_apps' ? 'pt-6 pb-12' : 'py-5'}`}>
            {/* Top Row in "我的应用": Filters on Left, Search Box on Top Right */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
              {/* Filter Tags Group */}
              <div className="space-y-3.5 text-[13px] flex-1">
                {/* Row 1: 行业类型 */}
                <div className="flex items-center gap-3">
                  <span className="text-[#86909c] w-[70px] shrink-0">行业类型：</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {industryOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedIndustry(opt)}
                        className={`h-[28px] px-3.5 rounded-[4px] text-[13px] transition-all cursor-pointer ${
                          selectedIndustry === opt
                            ? 'bg-[#e8f3ff] text-[#165dff] border border-[#165dff] font-medium'
                            : 'bg-white text-[#4e5969] border border-[#e5e6eb] hover:border-[#b4c8ff]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: 公司类型 */}
                <div className="flex items-center gap-3">
                  <span className="text-[#86909c] w-[70px] shrink-0">公司类型：</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {companyTypeOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedCompanyType(opt)}
                        className={`h-[28px] px-3.5 rounded-[4px] text-[13px] transition-all cursor-pointer ${
                          selectedCompanyType === opt
                            ? 'bg-[#e8f3ff] text-[#165dff] border border-[#165dff] font-medium'
                            : 'bg-white text-[#4e5969] border border-[#e5e6eb] hover:border-[#b4c8ff]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: 业务场景 */}
                <div className="flex items-center gap-3">
                  <span className="text-[#86909c] w-[70px] shrink-0">业务场景：</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {businessSceneOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedBusinessScene(opt)}
                        className={`h-[28px] px-3.5 rounded-[4px] text-[13px] transition-all cursor-pointer ${
                          selectedBusinessScene === opt
                            ? 'bg-[#e8f3ff] text-[#165dff] border border-[#165dff] font-medium'
                            : 'bg-white text-[#4e5969] border border-[#e5e6eb] hover:border-[#b4c8ff]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Search Box (Specifically shown in "我的应用" per screenshot) */}
              {activeNav === 'my_apps' && (
                <div className="shrink-0 self-start">
                  <div className="w-[240px] h-[32px] bg-white rounded-[4px] border border-[#e5e6eb] px-3 flex items-center justify-between hover:border-[#b4c8ff] focus-within:border-[#165dff] focus-within:shadow-sm transition-all">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="应用名称"
                      className="w-full h-full bg-transparent border-none outline-none text-[13px] text-[#1d2129] placeholder:text-[#86909c]"
                    />
                    <Search className="w-4 h-4 text-[#86909c] shrink-0" />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Rendering for "我的应用" */}
            {activeNav === 'my_apps' ? (
              <div className="space-y-8">
                {/* 1. 合规业务 Section */}
                {(selectedBusinessScene === '全部' || selectedBusinessScene === '合规业务') &&
                  complianceCards.length > 0 && (
                    <div>
                      {/* Section Title */}
                      <div className="flex items-center gap-2 mb-4 pt-2">
                        <div className="w-[3.5px] h-[16px] bg-[#165dff] rounded-[1px]" />
                        <h2 className="text-[16px] font-bold text-[#1d2129]">合规业务</h2>
                        <span className="text-[12px] text-[#86909c] font-normal">
                          ({complianceCards.length})
                        </span>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
                        {complianceCards.map((card) => (
                          <div
                            key={card.id}
                            onClick={() => openAppWorkspace(card)}
                            className="bg-white border border-[#e5e6eb] rounded-[8px] overflow-hidden flex flex-col hover:shadow-md hover:border-[#b4c8ff] transition-all duration-200 group cursor-pointer"
                          >
                            {/* Card Cover Illustration */}
                            <div className="h-[140px] w-full overflow-hidden shrink-0 border-b border-[#f2f3f5]">
                              <MarketCardIllustration type={card.illustrationType} />
                            </div>

                            {/* Card Content Body */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h3
                                  className="text-[14px] font-bold text-[#1d2129] mb-1.5 truncate group-hover:text-[#165dff] transition-colors"
                                  title={card.title}
                                >
                                  {card.title}
                                </h3>
                                <p
                                  className="text-[12px] text-[#86909c] line-clamp-2 h-[34px] leading-[17px]"
                                  title={card.desc}
                                >
                                  {card.desc}
                                </p>
                              </div>

                              {/* Card Footer: Creation Date & Circle Enter Arrow */}
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#f7f8fa]">
                                <span className="text-[11px] text-[#86909c]">
                                  {card.createDate}创建
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAppWorkspace(card);
                                  }}
                                  className="w-6 h-6 rounded-full border border-[#1d2129] flex items-center justify-center text-[#1d2129] hover:bg-[#165dff] hover:border-[#165dff] hover:text-white transition-colors cursor-pointer"
                                  title="进入应用"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. 经纪业务 Section */}
                {(selectedBusinessScene === '全部' || selectedBusinessScene === '经纪业务') &&
                  brokerageCards.length > 0 && (
                    <div>
                      {/* Section Title */}
                      <div className="flex items-center gap-2 mb-4 pt-2">
                        <div className="w-[3.5px] h-[16px] bg-[#165dff] rounded-[1px]" />
                        <h2 className="text-[16px] font-bold text-[#1d2129]">经纪业务</h2>
                        <span className="text-[12px] text-[#86909c] font-normal">
                          ({brokerageCards.length})
                        </span>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
                        {brokerageCards.map((card) => (
                          <div
                            key={card.id}
                            onClick={() => openAppWorkspace(card)}
                            className="bg-white border border-[#e5e6eb] rounded-[8px] overflow-hidden flex flex-col hover:shadow-md hover:border-[#b4c8ff] transition-all duration-200 group cursor-pointer"
                          >
                            {/* Card Cover Illustration */}
                            <div className="h-[140px] w-full overflow-hidden shrink-0 border-b border-[#f2f3f5]">
                              <MarketCardIllustration type={card.illustrationType} />
                            </div>

                            {/* Card Content Body */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h3
                                  className="text-[14px] font-bold text-[#1d2129] mb-1.5 truncate group-hover:text-[#165dff] transition-colors"
                                  title={card.title}
                                >
                                  {card.title}
                                </h3>
                                <p
                                  className="text-[12px] text-[#86909c] line-clamp-2 h-[34px] leading-[17px]"
                                  title={card.desc}
                                >
                                  {card.desc}
                                </p>
                              </div>

                              {/* Card Footer: Creation Date & Circle Enter Arrow */}
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#f7f8fa]">
                                <span className="text-[11px] text-[#86909c]">
                                  {card.createDate}创建
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAppWorkspace(card);
                                  }}
                                  className="w-6 h-6 rounded-full border border-[#1d2129] flex items-center justify-center text-[#1d2129] hover:bg-[#165dff] hover:border-[#165dff] hover:text-white transition-colors cursor-pointer"
                                  title="进入应用"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 3. 债承业务 Section */}
                {(selectedBusinessScene === '全部' || selectedBusinessScene === '债承业务') &&
                  debtCards.length > 0 && (
                    <div>
                      {/* Section Title */}
                      <div className="flex items-center gap-2 mb-4 pt-2">
                        <div className="w-[3.5px] h-[16px] bg-[#165dff] rounded-[1px]" />
                        <h2 className="text-[16px] font-bold text-[#1d2129]">债承业务</h2>
                        <span className="text-[12px] text-[#86909c] font-normal">
                          ({debtCards.length})
                        </span>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
                        {debtCards.map((card) => (
                          <div
                            key={card.id}
                            onClick={() => openAppWorkspace(card)}
                            className="bg-white border border-[#e5e6eb] rounded-[8px] overflow-hidden flex flex-col hover:shadow-md hover:border-[#b4c8ff] transition-all duration-200 group cursor-pointer"
                          >
                            <div className="h-[140px] w-full overflow-hidden shrink-0 border-b border-[#f2f3f5]">
                              <MarketCardIllustration type={card.illustrationType} />
                            </div>
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h3
                                  className="text-[14px] font-bold text-[#1d2129] mb-1.5 truncate group-hover:text-[#165dff] transition-colors"
                                  title={card.title}
                                >
                                  {card.title}
                                </h3>
                                <p
                                  className="text-[12px] text-[#86909c] line-clamp-2 h-[34px] leading-[17px]"
                                  title={card.desc}
                                >
                                  {card.desc}
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#f7f8fa]">
                                <span className="text-[11px] text-[#86909c]">
                                  {card.createDate}创建
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAppWorkspace(card);
                                  }}
                                  className="w-6 h-6 rounded-full border border-[#1d2129] flex items-center justify-center text-[#1d2129] hover:bg-[#165dff] hover:border-[#165dff] hover:text-white transition-colors cursor-pointer"
                                  title="进入应用"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. Other Filtered Cards if any */}
                {otherCards.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pt-2">
                      <div className="w-[3.5px] h-[16px] bg-[#165dff] rounded-[1px]" />
                      <h2 className="text-[16px] font-bold text-[#1d2129]">{otherCards[0].businessScene}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
                      {otherCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => openAppWorkspace(card)}
                          className="bg-white border border-[#e5e6eb] rounded-[8px] overflow-hidden flex flex-col hover:shadow-md hover:border-[#b4c8ff] transition-all duration-200 group cursor-pointer"
                        >
                          <div className="h-[140px] w-full overflow-hidden shrink-0 border-b border-[#f2f3f5]">
                            <MarketCardIllustration type={card.illustrationType} />
                          </div>
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-[14px] font-bold text-[#1d2129] mb-1.5 truncate group-hover:text-[#165dff]">
                                {card.title}
                              </h3>
                              <p className="text-[12px] text-[#86909c] line-clamp-2 h-[34px] leading-[17px]">
                                {card.desc}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#f7f8fa]">
                              <span className="text-[11px] text-[#86909c]">
                                {card.createDate}创建
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAppWorkspace(card);
                                }}
                                className="w-6 h-6 rounded-full border border-[#1d2129] flex items-center justify-center text-[#1d2129] hover:bg-[#165dff] hover:border-[#165dff] hover:text-white transition-colors cursor-pointer"
                                title="进入应用"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State if no apps configured for this tenant under current filter */}
                {filteredCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-[#f2f3f5]">
                    <div className="w-20 h-20 bg-[#f2f3f5] rounded-full flex items-center justify-center text-[#86909c] mb-3">
                      <LayoutGrid className="w-9 h-9" />
                    </div>
                    <p className="text-[14px] text-[#1d2129] font-medium mb-1">
                      当前客户「{currentTenantName}」暂无已授权的智能体应用
                    </p>
                    <p className="text-[12.5px] text-[#86909c] mb-4">
                      请前往 Admin 管理端的「比对智能体应用管理」为该客户进行授权配置
                    </p>
                    <button
                      onClick={() => {
                        window.location.hash = '#admin';
                      }}
                      className="px-4 py-2 bg-[#2f54eb] text-white text-[13px] rounded-[4px] hover:bg-[#1d39c4] transition-colors cursor-pointer"
                    >
                      前往 Admin 进行客户配置
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Marketplace View (5-Column Grid with Shopping Cart) */
              <div>
                <div className="flex items-center gap-2 mb-4 pt-2">
                  <div className="w-[3.5px] h-[16px] bg-[#165dff] rounded-[1px]" />
                  <h2 className="text-[16px] font-bold text-[#1d2129]">全部应用市场</h2>
                  <span className="text-[12px] text-[#86909c]">({filteredCards.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5 pb-12">
                  {filteredCards.map((card) => {
                    const isInCart = cartItems.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        className="bg-white border border-[#e5e6eb] rounded-[8px] overflow-hidden flex flex-col hover:shadow-md hover:border-[#b4c8ff] transition-all duration-200 group"
                      >
                        <div className="h-[140px] w-full overflow-hidden shrink-0 border-b border-[#f2f3f5]">
                          <MarketCardIllustration type={card.illustrationType} />
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3
                              className="text-[14px] font-bold text-[#1d2129] mb-1.5 truncate group-hover:text-[#165dff] transition-colors"
                              title={card.title}
                            >
                              {card.title}
                            </h3>
                            <p
                              className="text-[12px] text-[#86909c] line-clamp-2 h-[34px] leading-[17px]"
                              title={card.desc}
                            >
                              {card.desc}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#f7f8fa]">
                            <span className="text-[11px] text-[#86909c]">
                              {card.createDate}创建
                            </span>
                            <button
                              onClick={() => toggleCart(card.id, card.title)}
                              className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
                                isInCart
                                  ? 'bg-[#e8f3ff] text-[#165dff]'
                                  : 'text-[#4e5969] hover:bg-[#f2f3f5] hover:text-[#165dff]'
                              }`}
                              title={isInCart ? '已在应用清单中' : '加入应用清单'}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
