import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  ChevronDown,
  Power,
  MoreVertical,
  ArrowDownToLine,
  Archive,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppIllustration } from './AppIllustration';
import { CreateAppModal } from './CreateAppModal';
import {
  ViewAppModal,
  EditAppModal,
} from './AppActionModals';
import { AppCustomerConfigPage } from './AppCustomerConfigPage';
import { AppItem, AppStatus } from '../types';
import {
  loadCompareApps,
  saveCompareApps,
  INITIAL_COMPARE_APPS,
  CompareAppConfigItem,
} from '../appConfigStore';

interface CompareAppManagementProps {
  configuringApp?: AppItem | null;
  onConfiguringAppChange?: (app: AppItem | null) => void;
}

export const CompareAppManagement: React.FC<CompareAppManagementProps> = ({
  configuringApp: controlledConfiguringApp,
  onConfiguringAppChange,
}) => {
  const [apps, setApps] = useState<AppItem[]>(() => {
    const storeApps = loadCompareApps();
    if (storeApps && storeApps.length > 0) {
      return storeApps;
    }
    return INITIAL_COMPARE_APPS;
  });
  const [modalOpen, setModalOpen] = useState(false);

  // Sync when storage event fires
  useEffect(() => {
    const handleStorageUpdate = () => {
      const storeApps = loadCompareApps();
      if (storeApps && storeApps.length > 0) {
        setApps(storeApps);
      }
    };
    window.addEventListener('daguan_apps_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('daguan_apps_updated', handleStorageUpdate);
    };
  }, []);

  // Active popover menu on a card: { id, type, placement }
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    type: 'more' | 'status';
    placement: 'bottom' | 'top';
  } | null>(null);

  const handleToggleMenu = (
    e: React.MouseEvent,
    appId: string,
    type: 'more' | 'status'
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === appId && activeMenu.type === type) {
      setActiveMenu(null);
    } else {
      const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const spaceBelow = window.innerHeight - btnRect.bottom;
      // Default downwards; flip upwards only if less than 120px available below
      const placement = spaceBelow < 120 ? 'top' : 'bottom';
      setActiveMenu({ id: appId, type, placement });
    }
  };

  // Modals for Actions
  const [viewingApp, setViewingApp] = useState<AppItem | null>(null);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [deletingApp, setDeletingApp] = useState<AppItem | null>(null);
  const [internalConfiguringApp, setInternalConfiguringApp] = useState<AppItem | null>(null);

  const configuringApp =
    controlledConfiguringApp !== undefined
      ? controlledConfiguringApp
      : internalConfiguringApp;

  const setConfiguringApp = (app: AppItem | null) => {
    if (onConfiguringAppChange) {
      onConfiguringAppChange(app);
    } else {
      setInternalConfiguringApp(app);
    }
  };

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [customerFilter, setCustomerFilter] = useState('全部');

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.card-action-menu-container')) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeMenu]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (keyword && !app.name.toLowerCase().includes(keyword.toLowerCase())) {
        return false;
      }
      if (statusFilter !== '全部' && app.status !== statusFilter) {
        return false;
      }
      if (customerFilter !== '全部' && app.customer !== customerFilter) {
        return false;
      }
      return true;
    });
  }, [apps, keyword, statusFilter, customerFilter]);

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('全部');
    setCustomerFilter('全部');
  };

  const handleCreateApp = (newAppData: Omit<AppItem, 'id' | 'createDate'>) => {
    const newApp: CompareAppConfigItem = {
      ...newAppData,
      id: `app-${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      customer: '全部',
      authorizedTenants: [],
    };
    const updated = [newApp, ...apps];
    setApps(updated);
    saveCompareApps(updated as CompareAppConfigItem[]);
    setToastMsg(`应用「${newApp.name}」已创建`);
  };

  const handleChangeStatus = (appId: string, newStatus: AppStatus) => {
    const updated = apps.map((app) =>
      app.id === appId ? { ...app, status: newStatus } : app
    );
    setApps(updated);
    saveCompareApps(updated as CompareAppConfigItem[]);
    setActiveMenu(null);
    const labelMap: Record<AppStatus, string> = {
      已上架: '已上架正式版',
      内测中: '已发布内测版',
      未上架: '已成功下架',
    };
    setToastMsg(labelMap[newStatus] || `状态已更新为 ${newStatus}`);
  };

  const handleSaveEdit = (updatedApp: AppItem) => {
    const updated = apps.map((app) =>
      app.id === updatedApp.id ? { ...app, ...updatedApp } : app
    );
    setApps(updated);
    saveCompareApps(updated as CompareAppConfigItem[]);
    setToastMsg(`应用「${updatedApp.name}」修改成功`);
  };

  const handleConfirmDelete = (app: AppItem) => {
    const updated = apps.filter((a) => a.id !== app.id);
    setApps(updated);
    saveCompareApps(updated as CompareAppConfigItem[]);
    setDeletingApp(null);
    setToastMsg(`应用「${app.name}」已删除`);
  };

  const handleSaveCustomerConfig = (appId: string, customers: string[]) => {
    const updated = apps.map((app) =>
      app.id === appId
        ? {
            ...app,
            customer: customers.includes('全部') ? '全部' : customers[0] || '全部',
          }
        : app
    );
    setApps(updated);
    saveCompareApps(updated as CompareAppConfigItem[]);
    setToastMsg('客户配置已保存');
  };

  if (configuringApp) {
    return (
      <AppCustomerConfigPage
        app={configuringApp}
        onBack={() => setConfiguringApp(null)}
      />
    );
  }

  return (
    <div className="p-6 bg-white min-h-full flex flex-col relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1d2129] text-white text-[13.5px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#52c41a]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Left: Create Button */}
        <button
          id="create-new-app-btn"
          onClick={() => setModalOpen(true)}
          className="h-[34px] px-3.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm font-normal"
        >
          <PlusCircle className="w-4 h-4 stroke-[2]" />
          <span>新建应用</span>
        </button>

        {/* Right: Search & Filters */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              id="app-search-input"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="应用名称"
              className="w-[180px] h-[34px] pl-8 pr-3 text-[13px] border border-[#e5e6eb] rounded-[4px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c] text-[#1d2129]"
            />
            <Search className="w-4 h-4 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[34px] pl-3 pr-8 text-[13px] border border-[#e5e6eb] rounded-[4px] bg-white appearance-none focus:outline-none focus:border-[#2f54eb] text-[#1d2129] cursor-pointer"
            >
              <option value="全部">应用状态 : 全部</option>
              <option value="已上架">应用状态 : 已上架</option>
              <option value="内测中">应用状态 : 内测中</option>
              <option value="未上架">应用状态 : 未上架</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Customer Filter */}
          <div className="relative">
            <select
              id="customer-filter-select"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="h-[34px] pl-3 pr-8 text-[13px] border border-[#e5e6eb] rounded-[4px] bg-white appearance-none focus:outline-none focus:border-[#2f54eb] text-[#1d2129] cursor-pointer"
            >
              <option value="全部">客户 : 全部</option>
              <option value="国泰君安">客户 : 国泰君安</option>
              <option value="中信证券">客户 : 中信证券</option>
              <option value="华泰证券">客户 : 华泰证券</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset button */}
          <button
            id="reset-app-filters-btn"
            onClick={handleResetFilters}
            title="清空筛选"
            className="w-[34px] h-[34px] border border-[#e5e6eb] rounded-[4px] bg-white hover:bg-[#f7f8fa] flex items-center justify-center text-[#4e5969] transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-[#86909c] text-[13.5px]">
          <p>暂无符合条件的应用</p>
          <button
            onClick={handleResetFilters}
            className="mt-3 px-3 py-1.5 text-xs text-[#2f54eb] hover:underline cursor-pointer"
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredApps.map((app) => {
            const isOnline = app.status === '已上架';
            const isBeta = app.status === '内测中';
            const isOffline = app.status === '未上架';

            const isMoreOpen =
              activeMenu?.id === app.id && activeMenu.type === 'more';
            const isStatusOpen =
              activeMenu?.id === app.id && activeMenu.type === 'status';
            const menuPlacement = activeMenu?.placement || 'bottom';

            return (
              <div
                key={app.id}
                id={`app-card-${app.id}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.card-action-menu-container')) {
                    return;
                  }
                  setViewingApp(app);
                }}
                className={`bg-white rounded-lg border border-[#e5e6eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all flex flex-col group cursor-pointer relative ${
                  isMoreOpen || isStatusOpen ? 'z-30' : 'z-0'
                }`}
              >
                {/* Banner & Status Badge */}
                <div className="relative rounded-t-lg overflow-hidden">
                  <AppIllustration />
                  {/* Status Badge */}
                  <div
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[11px] rounded-[3px] font-medium leading-none select-none text-white ${
                      isOnline
                        ? 'bg-[#2f54eb]'
                        : isBeta
                        ? 'bg-[#b37feb]'
                        : 'bg-[#8c8c8c]'
                    }`}
                  >
                    {app.status}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3
                      title={app.name}
                      className="text-[14px] font-semibold text-[#1d2129] truncate leading-tight group-hover:text-[#2f54eb] transition-colors"
                    >
                      {app.name}
                    </h3>
                    <p className="text-[12px] text-[#86909c] mt-1.5 truncate h-4">
                      {app.desc}
                    </p>
                  </div>

                  {/* Footer Meta & Actions */}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#f7f8fa]">
                    <span className="text-[11.5px] text-[#2f54eb]/80 font-normal">
                      {app.createDate}创建
                    </span>

                    <div className="flex items-center gap-2 relative card-action-menu-container">
                      {/* Status Action Switch Button */}
                      <div className="relative">
                        {isOffline ? (
                          <button
                            title="发布/上架"
                            onClick={(e) => handleToggleMenu(e, app.id, 'status')}
                            className={`p-1 rounded transition-colors flex items-center justify-center ${
                              isStatusOpen
                                ? 'text-[#2f54eb] bg-[#f0f5ff]'
                                : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5]'
                            }`}
                          >
                            <div className={`w-4 h-4 border ${isStatusOpen ? 'border-[#2f54eb]' : 'border-current'} rounded-[3px] flex items-center justify-center p-[2px]`}>
                              <ArrowDownToLine className="w-3 h-3 stroke-[2.2]" />
                            </div>
                          </button>
                        ) : (
                          <button
                            title={isOnline ? '下架/内测设置' : '上架/下架设置'}
                            onClick={(e) => handleToggleMenu(e, app.id, 'status')}
                            className={`p-1 rounded transition-colors flex items-center justify-center ${
                              isStatusOpen
                                ? 'text-[#2f54eb] bg-[#f0f5ff]'
                                : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5]'
                            }`}
                          >
                            <Power className="w-4 h-4 stroke-[2]" />
                          </button>
                        )}

                        {/* Status Dropdown Popover (图 2, 图 3, 图 4) */}
                        {isStatusOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-0 z-50 bg-white border border-[#e5e6eb] rounded-lg py-1.5 min-w-[108px] animate-in fade-in zoom-in-95 duration-100 ${
                              menuPlacement === 'top'
                                ? 'bottom-full mb-1.5 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]'
                                : 'top-full mt-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)]'
                            }`}
                          >
                            {/* 未上架状态 -> 发布内测版, 上架正式版 (图 2) */}
                            {isOffline && (
                              <>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '内测中')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  发布内测版
                                </div>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '已上架')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  上架正式版
                                </div>
                              </>
                            )}

                            {/* 已上架状态 -> 发布内测版, 下架 (图 3) */}
                            {isOnline && (
                              <>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '内测中')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  发布内测版
                                </div>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '未上架')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  下架
                                </div>
                              </>
                            )}

                            {/* 内测中状态 -> 上架正式版, 下架 (图 4) */}
                            {isBeta && (
                              <>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '已上架')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  上架正式版
                                </div>
                                <div
                                  onClick={() => handleChangeStatus(app.id, '未上架')}
                                  className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                                >
                                  下架
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Three Dots More Menu (图 1) */}
                      <div className="relative">
                        <button
                          title="更多操作"
                          onClick={(e) => handleToggleMenu(e, app.id, 'more')}
                          className={`p-1 rounded transition-colors ${
                            isMoreOpen
                              ? 'text-[#2f54eb] bg-[#f0f5ff]'
                              : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5]'
                          }`}
                        >
                          <MoreVertical className={`w-4 h-4 ${isMoreOpen ? 'text-[#2f54eb]' : ''}`} />
                        </button>

                        {/* Three Dots Popover (图 1: 客户配置, 编辑, 查看) */}
                        {isMoreOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-0 z-50 bg-white border border-[#e5e6eb] rounded-lg py-1.5 min-w-[100px] animate-in fade-in zoom-in-95 duration-100 ${
                              menuPlacement === 'top'
                                ? 'bottom-full mb-1.5 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]'
                                : 'top-full mt-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)]'
                            }`}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(null);
                                setConfiguringApp(app);
                              }}
                              className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                            >
                              客户配置
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(null);
                                setEditingApp(app);
                              }}
                              className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                            >
                              编辑
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(null);
                                setViewingApp(app);
                              }}
                              className="px-3.5 py-2 text-[13.5px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer whitespace-nowrap transition-colors"
                            >
                              查看
                            </div>
                            {isOffline && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(null);
                                  setDeletingApp(app);
                                }}
                                className="px-3.5 py-2 text-[13.5px] text-[#f53f3f] hover:bg-[#ffece8] cursor-pointer whitespace-nowrap transition-colors border-t border-[#f2f3f5]"
                              >
                                删除
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateAppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateApp}
      />

      {/* View Detail Modal */}
      <ViewAppModal
        app={viewingApp}
        isOpen={!!viewingApp}
        onClose={() => setViewingApp(null)}
      />

      {/* Edit App Modal */}
      <EditAppModal
        app={editingApp}
        isOpen={!!editingApp}
        onClose={() => setEditingApp(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="relative w-full max-w-[420px] bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#ffece8] text-[#f53f3f] flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#1d2129] leading-snug">
                  确定删除应用「{deletingApp.name}」吗？
                </h3>
                <p className="text-[13px] text-[#86909c] mt-2 leading-relaxed">
                  删除后该应用的相关规则配置及客户授权数据将被彻底清除，此操作不可恢复。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                className="h-[32px] px-4 border border-[#d9d9d9] hover:border-[#adc6ff] bg-white hover:bg-[#fafbfc] text-[#1d2129] text-[13px] rounded-[4px] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingApp)}
                className="h-[32px] px-4 bg-[#f53f3f] hover:bg-[#d92c2c] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer shadow-sm"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
