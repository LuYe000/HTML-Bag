import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ChevronDown, RefreshCw } from 'lucide-react';
import { PackageItem, PackageFilterParams } from '../types';
import {
  getStoredPackages,
  addStoredPackage,
  updateStoredPackage,
  deleteStoredPackage,
  PACKAGES_UPDATED_EVENT,
} from '../packageStore';
import { PackageModal } from './PackageModal';
import { Pagination } from './Pagination';

export const PackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>(getStoredPackages);
  const [filters, setFilters] = useState<PackageFilterParams>({
    name: '',
    status: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentEditPkg, setCurrentEditPkg] = useState<PackageItem | null>(null);

  // Status dropdown open state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPackages(getStoredPackages());
    };
    window.addEventListener(PACKAGES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PACKAGES_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Filtered dataset
  const filteredPackages = useMemo(() => {
    return packages.filter((item) => {
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [packages, filters]);

  // Current page records
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPackages.slice(start, start + pageSize);
  }, [filteredPackages, currentPage, pageSize]);

  const handleCreate = () => {
    setCurrentEditPkg(null);
    setModalOpen(true);
  };

  const handleEdit = (pkg: PackageItem) => {
    setCurrentEditPkg(pkg);
    setModalOpen(true);
  };

  const handleToggleStatus = (pkg: PackageItem) => {
    const nextStatus = pkg.status === '正常' ? '禁用' : '正常';
    updateStoredPackage(pkg.id, { status: nextStatus });
    setPackages(getStoredPackages());
  };

  const handleDelete = (pkg: PackageItem) => {
    if (window.confirm(`确定要删除套餐「${pkg.name}」吗？`)) {
      deleteStoredPackage(pkg.id);
      setPackages(getStoredPackages());
    }
  };

  const handleSave = (data: Partial<PackageItem>) => {
    if (currentEditPkg) {
      updateStoredPackage(currentEditPkg.id, data);
    } else {
      addStoredPackage(data as Omit<PackageItem, 'id'>);
    }
    setPackages(getStoredPackages());
  };

  const handleReset = () => {
    setFilters({ name: '', status: '' });
    setCurrentPage(1);
    setPackages(getStoredPackages());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Top Action & Filter Bar matching Screenshot 1 */}
      <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 border-b border-[#f2f3f5]">
        {/* Left Action Button */}
        <div>
          <button
            id="create-package-btn"
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] font-medium rounded-[4px] shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>创建套餐</span>
          </button>
        </div>

        {/* Right Search & Filter Inputs */}
        <div className="flex items-center gap-2.5">
          {/* 套餐名称搜索 */}
          <div className="relative w-[180px]">
            <input
              id="package-filter-name"
              type="text"
              placeholder="套餐名称"
              value={filters.name}
              onChange={(e) => {
                setFilters({ ...filters, name: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-7 pr-2.5 py-1.5 text-[13px] border border-[#d9d9d9] rounded-[4px] outline-none hover:border-[#2f54eb] focus:border-[#2f54eb] text-[#1d2129] placeholder-[#86909c]"
            />
            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 套餐状态下拉 */}
          <div className="relative">
            <button
              id="package-filter-status-btn"
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex items-center justify-between w-[130px] px-2.5 py-1.5 text-[13px] border border-[#d9d9d9] rounded-[4px] bg-white text-[#1d2129] hover:border-[#2f54eb] transition-colors cursor-pointer"
            >
              <span className="text-[#86909c]">
                套餐状态:{' '}
                <span className="text-[#1d2129]">{filters.status ? filters.status : '全部'}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
            </button>

            {statusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-[130px] bg-white border border-[#e8ecf3] rounded-[4px] shadow-lg py-1 z-30 text-[13px]">
                  {['全部', '正常', '禁用'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setFilters({ ...filters, status: st === '全部' ? '' : st });
                        setStatusDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#f2f3f5] cursor-pointer ${
                        (st === '全部' && !filters.status) || filters.status === st
                          ? 'text-[#2f54eb] font-medium bg-[#f0f5ff]'
                          : 'text-[#1d2129]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh / Reset Icon Button */}
          <button
            id="package-refresh-btn"
            onClick={handleReset}
            title="刷新 / 重置"
            className="p-1.5 text-[#86909c] hover:text-[#1d2129] border border-[#d9d9d9] hover:border-[#86909c] rounded-[4px] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Package Table List */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f2f3f5] bg-[#fafafa] text-[#86909c] text-[13px] font-normal">
              <th className="py-3 px-4 font-normal w-[90px]">套餐 ID</th>
              <th className="py-3 px-4 font-normal w-[180px]">套餐名称</th>
              <th className="py-3 px-4 font-normal w-[240px]">套餐描述</th>
              <th className="py-3 px-4 font-normal">模块权限</th>
              <th className="py-3 px-4 font-normal w-[110px]">套餐状态</th>
              <th className="py-3 px-4 font-normal w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f3f5] text-[13px] text-[#1d2129]">
            {paginatedPackages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#86909c]">
                  暂无匹配套餐数据
                </td>
              </tr>
            ) : (
              paginatedPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-[#f9fafc] transition-colors">
                  {/* 套餐 ID */}
                  <td className="py-3.5 px-4 text-[#4e5969]">{pkg.id}</td>

                  {/* 套餐名称 */}
                  <td className="py-3.5 px-4 font-normal text-[#1d2129]">{pkg.name}</td>

                  {/* 套餐描述 */}
                  <td className="py-3.5 px-4 text-[#4e5969] max-w-[240px] truncate" title={pkg.description}>
                    {pkg.description || '-'}
                  </td>

                  {/* 模块权限 */}
                  <td className="py-3.5 px-4 text-[#4e5969] max-w-[360px] truncate" title={pkg.modules?.join('、')}>
                    {pkg.modules && pkg.modules.length > 0 ? pkg.modules.join('、') : '-'}
                  </td>

                  {/* 套餐状态 */}
                  <td className="py-3.5 px-4">
                    {pkg.status === '正常' ? (
                      <span className="inline-block px-1.5 py-0.5 text-[12px] text-[#52c41a] bg-[#f6ffed] border border-[#b7eb8f] rounded-[3px]">
                        正常
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 text-[12px] text-[#ff4d4f] bg-[#fff2f0] border border-[#ffccc7] rounded-[3px]">
                        禁用
                      </span>
                    )}
                  </td>

                  {/* 操作 */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        id={`edit-pkg-${pkg.id}`}
                        onClick={() => handleEdit(pkg)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer"
                      >
                        编辑
                      </button>

                      <button
                        id={`toggle-pkg-status-${pkg.id}`}
                        onClick={() => handleToggleStatus(pkg)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer"
                      >
                        {pkg.status === '正常' ? '禁用' : '启用'}
                      </button>

                      <button
                        id={`delete-pkg-${pkg.id}`}
                        onClick={() => handleDelete(pkg)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination matching Screenshot 1 */}
      <div className="border-t border-[#f2f3f5] bg-white">
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredPackages.length}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <PackageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={currentEditPkg}
      />
    </div>
  );
};
