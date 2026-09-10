import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Check,
} from 'lucide-react';
import { CreateRulePage } from './CreateRulePage';
import { loadCompareApps } from '../appConfigStore';
import {
  INITIAL_SHARED_RULES,
  getStoredRules,
  saveStoredRules,
  RULES_UPDATED_EVENT,
  RuleItem,
} from '../sharedCompareData';

export type { RuleItem };

export const CompareRuleManagement: React.FC = () => {
  const [rules, setRules] = useState<RuleItem[]>(getStoredRules);
  const rulesRef = useRef(rules);
  const [searchName, setSearchName] = useState('');
  const [selectedAppFilter, setSelectedAppFilter] = useState('全部');
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const appDropdownRef = useRef<HTMLDivElement>(null);
  const [adminAppNames, setAdminAppNames] = useState<string[]>(() =>
    Array.from(new Set(loadCompareApps().map((app) => app.name).filter(Boolean)))
  );

  useEffect(() => {
    const syncAdminApps = () => {
      setAdminAppNames(
        Array.from(new Set(loadCompareApps().map((app) => app.name).filter(Boolean)))
      );
    };
    window.addEventListener('daguan_apps_updated', syncAdminApps);
    return () => window.removeEventListener('daguan_apps_updated', syncAdminApps);
  }, []);

  // Sync when rules update in other components
  useEffect(() => {
    const handleRulesUpdate = () => {
      setRules(getStoredRules());
    };
    window.addEventListener(RULES_UPDATED_EVENT, handleRulesUpdate);
    return () => window.removeEventListener(RULES_UPDATED_EVENT, handleRulesUpdate);
  }, []);

  const updateAndSaveRules = (updater: (prev: RuleItem[]) => RuleItem[]) => {
    const next = updater(rulesRef.current);
    rulesRef.current = next;
    saveStoredRules(next);
    setRules(next);
  };

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Modals & Sub-pages
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        appDropdownRef.current &&
        !appDropdownRef.current.contains(e.target as Node)
      ) {
        setAppDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options
  const appOptions = ['全部', ...adminAppNames];

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules
      .filter((r) => {
        if (
          searchName.trim() &&
          !r.name.toLowerCase().includes(searchName.trim().toLowerCase()) &&
          !r.id.includes(searchName.trim())
        ) {
          return false;
        }
        if (selectedAppFilter !== '全部' && r.appName !== selectedAppFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aNum = Number(a.id) || 0;
        const bNum = Number(b.id) || 0;
        return bNum - aNum;
      });
  }, [rules, searchName, selectedAppFilter]);

  // Paginated rules
  const totalItems = filteredRules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentRules = filteredRules.slice(startIndex, endIndex);

  // Actions
  const handleResetFilters = () => {
    setSearchName('');
    setSelectedAppFilter('全部');
    setCurrentPage(1);
  };

  const handleCopyRule = (rule: RuleItem) => {
    const newId = String(Math.max(...rules.map((r) => Number(r.id) || 0), 0) + 1);
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

    const newRule: RuleItem = {
      ...rule,
      id: newId,
      name: `${rule.name}(副本)`,
      updateTime: timeStr,
    };
    updateAndSaveRules((prev) => [newRule, ...prev]);
    showToast(`规则「${rule.name}」已成功复制`);
  };

  const handleDeleteRule = (id: string) => {
    updateAndSaveRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirmId(null);
    showToast('规则已删除');
  };

  const handleSaveRule = (saved: RuleItem) => {
    if (editingRule) {
      updateAndSaveRules((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setEditingRule(null);
      showToast('规则已更新');
    } else {
      updateAndSaveRules((prev) => [saved, ...prev]);
      setIsCreatePageOpen(false);
      showToast('规则创建成功');
    }
  };

  if (isCreatePageOpen || editingRule) {
    return (
      <CreateRulePage
        initialRule={editingRule}
        rulesList={rules}
        allAppNames={appOptions.filter((a) => a !== '全部')}
        onBack={() => {
          setIsCreatePageOpen(false);
          setEditingRule(null);
        }}
        onSuccess={handleSaveRule}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans text-[#1d2129] relative overflow-hidden select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1d2129] text-white text-[13px] px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#00b42a]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action & Filter Toolbar (Screenshot 2) */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shrink-0">
        {/* Left: Create Rule Button */}
        <button
          id="create-rule-btn"
          onClick={() => setIsCreatePageOpen(true)}
          className="h-[32px] px-3.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>创建规则</span>
        </button>

        {/* Right: Search, Filter & Reset */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="规则名称"
              className="w-[200px] h-[32px] pl-8 pr-3 text-[13px] border border-[#e5e6eb] rounded-[4px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c] text-[#1d2129]"
            />
            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* App Select Filter */}
          <div ref={appDropdownRef} className="relative">
            <button
              onClick={() => setAppDropdownOpen(!appDropdownOpen)}
              className="h-[32px] px-3 border border-[#e5e6eb] rounded-[4px] bg-white flex items-center gap-2 text-[13px] text-[#4e5969] hover:border-[#c9cdd4] transition-colors cursor-pointer"
            >
              <span>关联应用：</span>
              <span className="text-[#1d2129] font-normal">
                {selectedAppFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
            </button>

            {appDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[220px] overflow-y-auto text-[13px]">
                {appOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setSelectedAppFilter(opt);
                      setAppDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 cursor-pointer transition-colors ${
                      selectedAppFilter === opt
                        ? 'text-[#2f54eb] font-medium bg-[#f0f4ff]'
                        : 'text-[#1d2129] hover:bg-[#f7f8fa]'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetFilters}
            title="清空过滤条件"
            className="w-[32px] h-[32px] border border-[#e5e6eb] rounded-[4px] bg-white hover:bg-[#f7f8fa] flex items-center justify-center text-[#4e5969] transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-x-auto overflow-y-auto">
        <div className="min-w-[1100px] flex-1 flex flex-col">
          {/* Table Header */}
          <div className="bg-[#f7f8fa] border-y border-[#f2f3f5] px-6 py-2.5 shrink-0 flex items-center text-[13px] font-semibold text-[#1d2129]">
            <div className="w-[70px] shrink-0">ID</div>
            <div className="flex-1 min-w-[220px] pr-4">规则名称</div>
            <div className="w-[200px] shrink-0 pr-4">关联应用</div>
            <div className="w-[120px] shrink-0">创建人</div>
            <div className="w-[180px] shrink-0">更新时间</div>
            <div className="w-[140px] shrink-0 text-left pl-2">操作</div>
          </div>

          {/* Table Rows */}
          {currentRules.length > 0 ? (
            <div className="divide-y divide-[#f2f3f5] flex-1">
              {currentRules.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center px-6 py-3 text-[13px] text-[#4e5969] hover:bg-[#fafbfc] transition-colors"
                >
                  {/* ID */}
                  <div className="w-[70px] shrink-0 text-[#1d2129] font-normal">
                    {item.id}
                  </div>

                  {/* 规则名称 (Matching user screenshot: Name + 暂无描述 subtitle) */}
                  <div className="flex-1 min-w-[220px] pr-4 flex flex-col justify-center">
                    <span
                      onClick={() => setEditingRule(item)}
                      className="text-[#2f54eb] hover:underline cursor-pointer font-normal text-[13.5px] truncate inline-block"
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* 关联应用 */}
                  <div className="w-[200px] shrink-0 pr-4 text-[#1d2129] truncate">
                    {item.appName}
                  </div>

                  {/* 创建人 */}
                  <div className="w-[120px] shrink-0 text-[#4e5969] truncate">
                    {item.creator}
                  </div>

                  {/* 更新时间 */}
                  <div className="w-[180px] shrink-0 text-[#86909c] font-mono text-[12.5px] truncate">
                    {item.updateTime}
                  </div>

                  {/* 操作 */}
                  <div className="w-[140px] shrink-0 flex items-center gap-3 text-left pl-2 text-[13px]">
                    <button
                      onClick={() => setEditingRule(item)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleCopyRule(item)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer transition-colors"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <p className="text-[14px] text-[#1d2129] font-medium mb-1.5">
                暂未找到符合条件的规则
              </p>
              <button
                onClick={handleResetFilters}
                className="text-[#2f54eb] text-[13px] hover:underline cursor-pointer"
              >
                清空过滤条件
              </button>
            </div>
          )}
        </div>

        {/* Bottom Pagination Bar (Matches Screenshot 2) */}
        {filteredRules.length > 0 && (
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

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-[13px] font-normal transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#2f54eb] text-white'
                        : 'text-[#4e5969] hover:bg-[#f7f8fa]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-[380px] bg-white rounded-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#f53f3f] mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-[16px] font-semibold text-[#1d2129]">
                确认删除规则？
              </h3>
            </div>
            <p className="text-[13.5px] text-[#4e5969] leading-relaxed mb-5">
              删除后规则将无法恢复，关联该规则的应用可能受到影响，确认要删除吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="h-[32px] px-4 border border-[#e5e6eb] hover:bg-[#f7f8fa] text-[13px] text-[#4e5969] rounded-[4px] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteRule(deleteConfirmId)}
                className="h-[32px] px-4 bg-[#f53f3f] hover:bg-[#cf1322] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
