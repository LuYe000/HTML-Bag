import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Archive,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AppItem, TenantItem } from '../types';
import {
  getStoredTenants,
  TENANTS_UPDATED_EVENT,
} from '../accountTenantStore';
import {
  CustomerAuthRecord,
  loadCompareApps,
  saveCompareApps,
  CompareAppConfigItem,
} from '../appConfigStore';
import {
  getStoredRules,
  RULES_UPDATED_EVENT,
} from '../sharedCompareData';

interface AppCustomerConfigPageProps {
  app: AppItem;
  onBack: () => void;
  onUpdateApp?: (updatedApp: CompareAppConfigItem) => void;
}

// Convert a tenant into a customer auth record format helper
const hexIds = [
  'd969398035ec425d',
  'e1829910ab31e84c',
  'c7219082af1839db',
  'f9301928bc839210',
  'a8291039de48194a',
  'b3920194819bc820',
  'd8391048172ea910',
  'e9102938471bc938',
  'c9182930481fa819',
  'f1029384819bc182',
  'a19283748291bc90',
];

const predefinedTenantMapping: Record<string, { id: string; expire: string }> = {
  '测试租户_08261110': { id: '8f62f3eaa3fb4bbb', expire: '2026-08-17 ~ 2027-08-17' },
  'ly的测试店铺': { id: '7ecc48ec6ec94e3c', expire: '2026-08-13 ~ 2027-08-13' },
  'ly的店铺': { id: '41ebacafe3d84b8a', expire: '2026-08-11 ~ 2027-04-16' },
  '性能测试店铺1': { id: 'e1829910ab31e84c', expire: '2026-08-27 ~ 2027-08-31' },
  '豆浆01': { id: 'c7219082af1839db', expire: '2026-08-26 ~ 2028-08-27' },
  'IFAS-02店铺': { id: 'f9301928bc839210', expire: '2026-08-24 ~ 2027-08-22' },
  'IFAS-01店铺': { id: 'a8291039de48194a', expire: '2026-08-24 ~ 2027-08-31' },
  'summer01-04租户名称': { id: 'b3920194819bc820', expire: '2026-08-24 ~ 2027-08-28' },
  'summer01-03租户名称': { id: 'd8391048172ea910', expire: '2026-08-24 ~ 2027-08-20' },
};

const getTenantMappingList = (): { name: string; id: string; expire: string }[] => {
  const tenants = getStoredTenants();
  const list: { name: string; id: string; expire: string }[] = [];
  const added = new Set<string>();

  // Add predefined typical tenants first
  Object.entries(predefinedTenantMapping).forEach(([name, meta]) => {
    list.push({
      name,
      id: meta.id,
      expire: meta.expire,
    });
    added.add(name);
  });

  // Merge with any dynamic tenants from tenant store
  tenants.forEach((t, idx) => {
    if (!added.has(t.name)) {
      const hexId =
        t.id && t.id.length >= 16
          ? t.id
          : `t${(idx + 10) * 19283748291}a`.padEnd(16, '0').slice(0, 16);
      const createPart = t.createTime ? t.createTime.split(' ')[0] : '2026-08-27';
      const expirePart = t.expireTime ? t.expireTime.split(' ')[0] : '2027-08-31';
      list.push({
        name: t.name,
        id: hexId,
        expire: `${createPart} ~ ${expirePart}`,
      });
      added.add(t.name);
    }
  });

  return list;
};

export const AppCustomerConfigPage: React.FC<AppCustomerConfigPageProps> = ({
  app,
  onBack,
  onUpdateApp,
}) => {
  const [tenantsList, setTenantsList] = useState<TenantItem[]>(getStoredTenants);

  // Sync tenant updates from accountTenantStore
  useEffect(() => {
    const handleTenantsUpdate = () => {
      setTenantsList(getStoredTenants());
    };
    window.addEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
    return () => {
      window.removeEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
    };
  }, []);
  // Load current app's authorized tenants from store
  const [records, setRecords] = useState<CustomerAuthRecord[]>(() => {
    const allApps = loadCompareApps();
    const found = allApps.find((a) => a.id === app.id || a.name === app.name);
    if (found && found.authorizedTenants) {
      return found.authorizedTenants;
    }
    return [
      {
        id: 'auth-luyeye-1',
        tenantName: 'luyeye',
        tenantId: '0',
        expireDate: '2026-08-27 ~ 2027-06-01',
        rule: '版本迭代比对-默认规则',
        manageType: '租户管理',
        process: '',
        allowResultEdit: '',
        createTime: '2026-08-27',
      },
      {
        id: 'auth-perf-2',
        tenantName: '性能测试店铺1',
        tenantId: '1',
        expireDate: '2026-08-27 ~ 2027-08-31',
        rule: '模板基准校验比对-默认规则',
        manageType: '租户管理',
        process: '',
        allowResultEdit: '',
        createTime: '2026-08-27',
      },
    ];
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync back to store whenever records change
  const syncToStore = (newRecords: CustomerAuthRecord[]) => {
    setRecords(newRecords);
    const allApps = loadCompareApps();
    let updatedAppItem: CompareAppConfigItem | null = null;
    const updatedApps = allApps.map((item) => {
      if (item.id === app.id || item.name === app.name) {
        const customerSummary =
          newRecords.length === 0
            ? '无'
            : newRecords.length === 1
            ? newRecords[0].tenantName
            : `${newRecords[0].tenantName}等${newRecords.length}家`;
        updatedAppItem = {
          ...item,
          customer: customerSummary,
          authorizedTenants: newRecords,
        };
        return updatedAppItem;
      }
      return item;
    });

    // If app wasn't already in compare apps, add it
    if (!updatedAppItem) {
      const customerSummary =
        newRecords.length === 0
          ? '无'
          : newRecords.length === 1
          ? newRecords[0].tenantName
          : `${newRecords[0].tenantName}等${newRecords.length}家`;
      const newItem: CompareAppConfigItem = {
        ...app,
        customer: customerSummary,
        industry: app.industry || '金融',
        companyType: app.companyType || '证券',
        businessScene: app.businessCategory || '合规业务',
        illustrationType: 'justice_scale',
        authorizedTenants: newRecords,
      };
      updatedApps.push(newItem);
      updatedAppItem = newItem;
    }

    saveCompareApps(updatedApps);
    if (onUpdateApp && updatedAppItem) {
      onUpdateApp(updatedAppItem);
    }
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [configuringRecord, setConfiguringRecord] = useState<CustomerAuthRecord | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (
        searchKeyword.trim() &&
        !r.tenantName.toLowerCase().includes(searchKeyword.trim().toLowerCase()) &&
        !r.tenantId.toLowerCase().includes(searchKeyword.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [records, searchKeyword]);

  // Paginated records
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handleAddTenants = (tenantNames: string[]) => {
    const available = getTenantMappingList();
    const existingMap = new Map<string, CustomerAuthRecord>(records.map((r) => [r.tenantName, r]));

    // Generate the updated records list preserving existing items, adding new ones
    const updated: CustomerAuthRecord[] = [];

    tenantNames.forEach((name) => {
      if (existingMap.has(name)) {
        updated.push(existingMap.get(name)!);
      } else {
        const found = available.find((t) => t.name === name);
        updated.push({
          id: `auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tenantName: name,
          tenantId: found ? found.id : `t${Math.random().toString(36).substring(2, 14)}`,
          expireDate: found ? found.expire : '2026-08-27 ~ 2027-01-29',
          rule: '-',
          manageType: '',
          process: '',
          allowResultEdit: '',
          createTime: new Date().toISOString().split('T')[0],
        });
      }
    });

    syncToStore(updated);
    setToastMsg(
      tenantNames.length > 0
        ? `已更新客户授权列表（当前已授权 ${tenantNames.length} 个客户）`
        : '已清空客户授权列表'
    );
    setIsAddModalOpen(false);
  };

  const handleSaveConfig = (updated: CustomerAuthRecord) => {
    const updatedList = records.map((r) => (r.id === updated.id ? updated : r));
    syncToStore(updatedList);
    setToastMsg(`已保存「${updated.tenantName}」的规则配置`);
    setConfiguringRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    const updated = records.filter((r) => r.id !== id);
    syncToStore(updated);
    setToastMsg(`已取消「${target?.tenantName || '客户'}」的授权`);
    setIsDeleteConfirmOpen(null);
  };

  const pageTitle = `${app.name}应用客户配置`;

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans text-[#1d2129] relative overflow-hidden select-none">
      {/* Main Title & Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shrink-0">
        {/* Left: Page Title */}
        <h1 className="text-[14.5px] font-semibold text-[#1d2129] select-none">
          {pageTitle}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* 新增客户授权 */}
          <button
            id="add-customer-auth-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="text-[13.5px] text-[#2f54eb] hover:text-[#1d39c4] transition-colors font-normal flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>新增客户授权</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <input
              id="tenant-name-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="租户名称"
              className="w-[200px] h-[32px] pl-8 pr-3 text-[13px] border border-[#e5e6eb] rounded-[4px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c] text-[#1d2129]"
            />
            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset / Box icon */}
          <button
            onClick={() => setSearchKeyword('')}
            title="清空过滤条件"
            className="w-[32px] h-[32px] border border-[#e5e6eb] rounded-[4px] bg-white hover:bg-[#f7f8fa] flex items-center justify-center text-[#4e5969] transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Table & Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Table Header */}
        <div className="bg-[#f7f8fa] border-y border-[#f2f3f5] px-6 py-2.5 shrink-0">
          <div className="grid grid-cols-12 gap-2 text-[13px] font-semibold text-[#1d2129] items-center">
            <div className="col-span-2">租户名称</div>
            <div className="col-span-2">租户 ID</div>
            <div className="col-span-2">有效期</div>
            <div className="col-span-2">规则</div>
            <div className="col-span-2">管理方式</div>
            <div className="col-span-2 text-right pr-2">操作</div>
          </div>
        </div>

        {/* Rows or Empty State */}
        {currentRecords.length > 0 ? (
          <div className="divide-y divide-[#f2f3f5] flex-1">
            {currentRecords.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 px-6 py-3.5 text-[13px] text-[#4e5969] hover:bg-[#fafbfc] transition-colors items-center"
              >
                <div className="col-span-2 text-[#1d2129] truncate font-normal">
                  {item.tenantName}
                </div>
                <div className="col-span-2 text-[#4e5969] font-mono text-[12.5px] truncate">
                  {item.tenantId}
                </div>
                <div className="col-span-2 text-[#4e5969] truncate">
                  {item.expireDate}
                </div>
                <div className="col-span-2 text-[#4e5969] truncate">
                  {item.rule || '-'}
                </div>
                <div className="col-span-2 text-[#4e5969] truncate">
                  {item.manageType || ''}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3 text-right pr-2">
                  <button
                    onClick={() => setConfiguringRecord(item)}
                    className="text-[#2f54eb] hover:text-[#1d39c4] text-[13px] font-normal cursor-pointer transition-colors"
                  >
                    配置
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(item.id)}
                    className="text-[#2f54eb] hover:text-[#1d39c4] text-[13px] font-normal cursor-pointer transition-colors"
                  >
                    取消授权
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-200">
            {/* 3D-styled SVG Box & Paper Plane */}
            <div className="w-36 h-32 relative flex items-center justify-center mb-2">
              <svg
                width="140"
                height="110"
                viewBox="0 0 140 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-90"
              >
                <circle cx="28" cy="62" r="5" fill="#e5e6eb" />
                <circle cx="118" cy="48" r="4" fill="#e5e6eb" />

                <g transform="translate(100, 16) rotate(-15)">
                  <path d="M0 8L22 0L8 22L7 12L0 8Z" fill="#d2d7e2" />
                  <path d="M7 12L22 0L8 22L7 12Z" fill="#b9c2d3" />
                  <path
                    d="M-10 18 C-18 20, -28 14, -34 18"
                    stroke="#c9cdd4"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    fill="none"
                  />
                </g>

                <g transform="translate(24, 30)">
                  <ellipse cx="46" cy="64" rx="42" ry="7" fill="#f2f3f5" />
                  <path d="M20 18L46 6L72 18L46 28L20 18Z" fill="#e0e3eb" />
                  <path d="M20 18L46 28V60L20 48V18Z" fill="#f0f2f5" />
                  <path d="M46 28L72 18V48L46 60V28Z" fill="#e4e7ed" />
                  <path d="M20 18L5 12L28 6L46 28L20 18Z" fill="#f4f6fa" />
                  <path d="M72 18L88 10L66 5L46 28L72 18Z" fill="#dadee6" />
                  <path d="M32 23L46 17L60 23L46 30L32 23Z" fill="#ccd2de" />
                </g>
              </svg>
            </div>

            <p className="text-[14px] text-[#1d2129] font-medium mt-3 mb-1.5">
              暂未找到符合筛选条件的数据
            </p>
            <p className="text-[13px] text-[#86909c] flex items-center gap-1.5">
              <span>你可以尝试</span>
              <button
                onClick={() => setSearchKeyword('')}
                className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
              >
                刷新
              </button>
              <span>或</span>
              <button
                onClick={() => setSearchKeyword('')}
                className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
              >
                清空过滤条件
              </button>
            </p>
          </div>
        )}

        {/* Bottom Pagination Bar (Matches Screenshot 2) */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-end px-6 py-4 bg-white border-t border-[#f2f3f5] gap-4 text-[13px] text-[#4e5969] shrink-0">
            <span>
              第 {startIndex + 1}-{endIndex} 条/共 {totalItems} 条
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded border border-[#e5e6eb] text-[#86909c] hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button className="w-7 h-7 flex items-center justify-center rounded bg-[#2f54eb] text-white text-[13px] font-medium">
                {currentPage}
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 flex items-center justify-center rounded border border-[#e5e6eb] text-[#86909c] hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page Size Select */}
            <div className="relative">
              <button
                onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                className="h-[28px] px-2.5 border border-[#e5e6eb] rounded flex items-center gap-1.5 text-[13px] text-[#1d2129] bg-white hover:border-[#c9cdd4] transition-colors cursor-pointer"
              >
                <span>{pageSize} 条/页</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
              </button>

              {pageSizeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setPageSizeDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-1 w-28 bg-white border border-[#e5e6eb] rounded shadow-lg z-30 py-1 text-[13px]">
                    {[10, 20, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                          setPageSizeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#f2f3f5] transition-colors ${
                          pageSize === size
                            ? 'text-[#2f54eb] font-medium bg-[#f0f4ff]'
                            : 'text-[#4e5969]'
                        }`}
                      >
                        {size} 条/页
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Tenant Auth Modal (Matches Screenshot 1) */}
      {isAddModalOpen && (
        <AddTenantAuthDialog
          isOpen={isAddModalOpen}
          existingAuthorized={records.map((r) => r.tenantName)}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleAddTenants}
        />
      )}

      {/* Configure Record Modal (When clicking '配置') */}
      {configuringRecord && (
        <ConfigureRecordDialog
          record={configuringRecord}
          appName={app.name}
          onClose={() => setConfiguringRecord(null)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Delete / Cancel Auth Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-[380px] bg-white rounded-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#f53f3f] mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-[16px] font-semibold text-[#1d2129]">确认取消授权？</h3>
            </div>
            <p className="text-[13.5px] text-[#4e5969] leading-relaxed mb-5">
              取消后该客户租户将无法继续使用该应用，确认要取消授权吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="h-[32px] px-4 border border-[#e5e6eb] hover:bg-[#f7f8fa] text-[13px] text-[#4e5969] rounded-[4px] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteRecord(isDeleteConfirmOpen)}
                className="h-[32px] px-4 bg-[#f53f3f] hover:bg-[#cf1322] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer font-medium"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// Dialog 1: Add Tenant Auth (Matches Screenshot 2)
// ==========================================
interface AddTenantAuthDialogProps {
  isOpen: boolean;
  existingAuthorized: string[];
  onClose: () => void;
  onConfirm: (selectedNames: string[]) => void;
}

const AddTenantAuthDialog: React.FC<AddTenantAuthDialogProps> = ({
  isOpen,
  existingAuthorized,
  onClose,
  onConfirm,
}) => {
  const [tenantsList, setTenantsList] = useState<TenantItem[]>(getStoredTenants);

  // Sync tenant updates from accountTenantStore
  useEffect(() => {
    const handleTenantsUpdate = () => {
      setTenantsList(getStoredTenants());
    };
    window.addEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
    return () => {
      window.removeEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
    };
  }, []);

  // Candidate list dynamically sourced from the Tenant Management store + Predefined
  const allTenantsList = useMemo(() => {
    const mapping = getTenantMappingList();
    return mapping.map((m) => m.name);
  }, [tenantsList]);

  // Pre-populate with existingAuthorized from the table list
  const [selectedTenants, setSelectedTenants] = useState<string[]>(existingAuthorized);
  const [filterText, setFilterText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTenants(existingAuthorized);
      setFilterText('');
      setIsDropdownOpen(false);
    }
  }, [isOpen, existingAuthorized]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTenants = useMemo(() => {
    if (!filterText.trim()) return allTenantsList;
    return allTenantsList.filter((name) =>
      name.toLowerCase().includes(filterText.trim().toLowerCase())
    );
  }, [allTenantsList, filterText]);

  const handleToggleTenant = (name: string) => {
    if (selectedTenants.includes(name)) {
      setSelectedTenants(selectedTenants.filter((n) => n !== name));
    } else {
      setSelectedTenants([...selectedTenants, name]);
    }
  };

  const handleRemoveTenant = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTenants(selectedTenants.filter((n) => n !== name));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="relative w-full max-w-[500px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold text-[#1d2129]">
            新增客户授权
          </h2>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 flex flex-col space-y-2">
          <label className="block text-[13.5px] text-[#1d2129] font-normal">
            选择客户
          </label>

          {/* Tagged Multi-Select Input Container (Matches Screenshot 2) */}
          <div ref={containerRef} className="relative">
            <div
              onClick={() => setIsDropdownOpen(true)}
              className="min-h-[36px] w-full px-2.5 py-1.5 border border-[#d9d9d9] focus-within:border-[#2f54eb] focus-within:shadow-[0_0_0_2px_rgba(47,84,235,0.1)] rounded-[4px] bg-white flex flex-wrap items-center gap-1.5 pr-8 cursor-text transition-all"
            >
              {selectedTenants.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f2f3f5] border border-[#e5e6eb] text-[#1d2129] text-[12.5px] rounded-[3px] select-none"
                >
                  <span className="max-w-[150px] truncate">{name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTenant(name, e)}
                    className="text-[#86909c] hover:text-[#1d2129] cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={selectedTenants.length === 0 ? '请选择租户客户' : ''}
                className="flex-1 min-w-[50px] h-[24px] bg-transparent text-[13px] text-[#1d2129] focus:outline-none placeholder-[#86909c]"
              />

              <div className="absolute right-2.5 top-2.5 flex items-center text-[#86909c] pointer-events-none">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Options list (Matches Screenshot 1 / 2) */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-[220px] overflow-y-auto bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 text-[13px] z-50 animate-in fade-in duration-100">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((name) => {
                    const isSelected = selectedTenants.includes(name);
                    return (
                      <div
                        key={name}
                        onClick={() => handleToggleTenant(name)}
                        className={`px-3.5 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#f0f5ff] text-[#2f54eb] font-medium'
                            : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                        }`}
                      >
                        <span className="truncate">{name}</span>
                        {isSelected && (
                          <span className="text-xs text-[#2f54eb] font-normal">已选</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-4 text-center text-xs text-[#86909c]">
                    未匹配到相关客户
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer (Matches Screenshot 2: 取消 + 确定) */}
        <div className="flex items-center justify-end px-6 pt-5 pb-5 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-[32px] px-4 border border-[#d9d9d9] hover:border-[#adc6ff] bg-white hover:bg-[#fafbfc] text-[#1d2129] text-[13px] rounded-[4px] transition-colors cursor-pointer font-normal"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedTenants)}
            className="h-[32px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer font-normal shadow-sm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Dialog 2: Configure Record (Screenshot 1)
// ==========================================
interface ConfigureRecordDialogProps {
  record: CustomerAuthRecord;
  appName: string;
  onClose: () => void;
  onSave: (updated: CustomerAuthRecord) => void;
}

const ConfigureRecordDialog: React.FC<ConfigureRecordDialogProps> = ({
  record,
  appName,
  onClose,
  onSave,
}) => {
  const [storedRules, setStoredRules] = useState(getStoredRules);
  const [rule, setRule] = useState(
    record.rule && record.rule !== '-' ? record.rule : ''
  );
  const [manageType, setManageType] = useState<'租户管理' | '平台管理'>(
    record.manageType === '平台管理' ? '平台管理' : '租户管理'
  );
  const [ruleDropdownOpen, setRuleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isConfigured = Boolean(record.rule && record.rule !== '-');

  // Sync rules dynamically if they change in Rule Management
  useEffect(() => {
    const handleRulesUpdate = () => {
      setStoredRules(getStoredRules());
    };
    window.addEventListener(RULES_UPDATED_EVENT, handleRulesUpdate);
    return () => window.removeEventListener(RULES_UPDATED_EVENT, handleRulesUpdate);
  }, []);

  // List of rule names directly matching Rule Management page
  const availableRules = useMemo(() => {
    return Array.from(
      new Set(
        storedRules
          .filter((r) => r.appName === appName)
          .map((r) => r.name)
          .filter(Boolean)
      )
    );
  }, [storedRules, appName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setRuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfigured) {
      onClose();
      return;
    }
    onSave({
      ...record,
      rule: rule || '-',
      manageType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
      <div className="relative w-full max-w-[440px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-[16px] font-semibold text-[#1d2129]">
            客户配置
          </h2>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 -mr-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-[13.5px]">
          {/* Customer section */}
          <div>
            <div className="text-[13.5px] text-[#1d2129] font-normal mb-1.5">
              客户
            </div>
            <div className="text-[14px] text-[#1d2129] font-medium leading-relaxed">
              {record.tenantName || '测试租户_08261110'}
            </div>
          </div>

          {/* Rule configuration section */}
          <div className="pt-2">
            {/* Title with blue vertical pill */}
            <div className="flex items-center gap-1.5 mb-3.5">
              <div className="w-[3px] h-[14px] bg-[#2f54eb] rounded-full" />
              <span className="text-[14px] font-semibold text-[#1d2129]">
                规则配置
              </span>
            </div>

            {/* Select Rule */}
            <div className="mb-4">
              <label className="block text-[13.5px] text-[#1d2129] font-normal mb-1.5">
                选择规则 <span className="text-[#f53f3f]">*</span>
              </label>

              <div ref={dropdownRef} className="relative">
                <div
                  onClick={() => {
                    if (!isConfigured) {
                      setRuleDropdownOpen(!ruleDropdownOpen);
                    }
                  }}
                  className={`w-full h-[34px] px-3 border rounded-[4px] flex items-center justify-between text-[13.5px] transition-colors ${
                    isConfigured
                      ? 'border-[#d9d9d9] bg-[#f5f5f5] cursor-not-allowed'
                      : ruleDropdownOpen
                      ? 'border-[#2f54eb] shadow-[0_0_0_2px_rgba(47,84,235,0.1)] bg-white cursor-pointer'
                      : 'border-[#d9d9d9] hover:border-[#c9cdd4] bg-white cursor-pointer'
                  }`}
                >
                  <span
                    className={
                      isConfigured
                        ? 'text-[#a9aeb8]'
                        : rule
                        ? 'text-[#1d2129]'
                        : 'text-[#86909c]'
                    }
                  >
                    {rule || '请选择规则'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isConfigured
                        ? 'text-[#c9cdd4]'
                        : ruleDropdownOpen
                        ? 'rotate-180 text-[#2f54eb]'
                        : 'text-[#86909c]'
                    }`}
                  />
                </div>

                {!isConfigured && ruleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[220px] overflow-y-auto">
                    {availableRules.map((r) => (
                      <div
                        key={r}
                        onClick={() => {
                          setRule(r);
                          setRuleDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-[13.5px] cursor-pointer transition-colors flex items-center justify-between ${
                          rule === r
                            ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                            : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                        }`}
                      >
                        <span>{r}</span>
                        {rule === r && (
                          <span className="text-xs text-[#2f54eb]">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Management Type Radio Group */}
            <div>
              <label className="block text-[13.5px] text-[#1d2129] font-normal mb-2.5">
                管理方式 <span className="text-[#f53f3f]">*</span>
              </label>

              <div
                className={`flex items-center gap-6 text-[13.5px] ${
                  isConfigured ? 'text-[#a9aeb8]' : 'text-[#1d2129]'
                }`}
              >
                {/* 租户管理 Radio */}
                <label
                  className={`flex items-center gap-2 select-none ${
                    isConfigured ? 'cursor-not-allowed' : 'cursor-pointer group'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      manageType === '租户管理'
                        ? isConfigured
                          ? 'border-[#d9d9d9] bg-[#f5f5f5]'
                          : 'border-[#2f54eb] bg-white'
                        : isConfigured
                        ? 'border-[#d9d9d9] bg-[#f5f5f5]'
                        : 'border-[#d9d9d9] group-hover:border-[#c9cdd4] bg-white'
                    }`}
                  >
                    {manageType === '租户管理' && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConfigured ? 'bg-[#c9cdd4]' : 'bg-[#2f54eb]'
                        }`}
                      />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="manageType"
                    value="租户管理"
                    checked={manageType === '租户管理'}
                    onChange={() => setManageType('租户管理')}
                    disabled={isConfigured}
                    className="hidden"
                  />
                  <span>租户管理</span>
                </label>

                {/* 平台管理 Radio */}
                <label
                  className={`flex items-center gap-2 select-none ${
                    isConfigured ? 'cursor-not-allowed' : 'cursor-pointer group'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      manageType === '平台管理'
                        ? isConfigured
                          ? 'border-[#d9d9d9] bg-[#f5f5f5]'
                          : 'border-[#2f54eb] bg-white'
                        : isConfigured
                        ? 'border-[#d9d9d9] bg-[#f5f5f5]'
                        : 'border-[#d9d9d9] group-hover:border-[#c9cdd4] bg-white'
                    }`}
                  >
                    {manageType === '平台管理' && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConfigured ? 'bg-[#c9cdd4]' : 'bg-[#2f54eb]'
                        }`}
                      />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="manageType"
                    value="平台管理"
                    checked={manageType === '平台管理'}
                    onChange={() => setManageType('平台管理')}
                    disabled={isConfigured}
                    className="hidden"
                  />
                  <span>平台管理</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action buttons on bottom right (Screenshot 1) */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="h-[32px] px-4 border border-[#d9d9d9] hover:bg-[#f7f8fa] text-[13.5px] text-[#1d2129] rounded-[4px] transition-colors cursor-pointer font-normal"
            >
              取消
            </button>
            <button
              type="submit"
              className="h-[32px] px-5 bg-[#4e75ff] hover:bg-[#3860f8] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-normal shadow-sm"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
