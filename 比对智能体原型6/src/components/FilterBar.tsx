import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Search, ChevronDown, RotateCcw } from 'lucide-react';
import { FilterParams, PackageItem } from '../types';
import { STATUS_OPTIONS } from '../mockData';
import { getStoredPackages, PACKAGES_UPDATED_EVENT } from '../packageStore';

interface FilterBarProps {
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
  onResetFilters: () => void;
  onCreateTenant: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onCreateTenant,
}) => {
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [packagesList, setPackagesList] = useState<PackageItem[]>(getStoredPackages);

  const packageRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (packageRef.current && !packageRef.current.contains(e.target as Node)) {
        setPackageDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const handlePackagesUpdate = () => {
      setPackagesList(getStoredPackages());
    };
    window.addEventListener(PACKAGES_UPDATED_EVENT, handlePackagesUpdate);
    return () => {
      window.removeEventListener(PACKAGES_UPDATED_EVENT, handlePackagesUpdate);
    };
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, name: e.target.value });
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, adminName: e.target.value });
  };

  const handleSelectPackage = (val: string) => {
    onFilterChange({ ...filters, packageType: val });
    setPackageDropdownOpen(false);
  };

  const handleSelectStatus = (val: string) => {
    onFilterChange({ ...filters, status: val });
    setStatusDropdownOpen(false);
  };

  // Build package options: '全部' + list of packages from store
  const packageNames: string[] = Array.from(new Set(packagesList.map((p) => p.name)));
  const packageOptions: { label: string; value: string }[] = [
    { label: '全部', value: '' },
    ...packageNames.map((name) => ({
      label: name,
      value: name,
    })),
  ];

  const currentPackageLabel =
    packageOptions.find((opt) => opt.value === filters.packageType)?.label ||
    (filters.packageType ? filters.packageType : '全部');
  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === filters.status)?.label || '全部';

  return (
    <div
      id="filter-toolbar"
      className="flex flex-wrap items-center justify-between gap-3 pt-5 pb-4 px-6"
    >
      {/* Left Action Button: + 创建租户 */}
      <button
        id="create-tenant-btn"
        onClick={onCreateTenant}
        className="h-[34px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:translate-y-px"
      >
        <PlusCircle className="w-4 h-4" />
        <span>创建租户</span>
      </button>

      {/* Right Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search: 租户名称 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#86909c]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="filter-tenant-name-input"
            type="text"
            value={filters.name}
            onChange={handleNameChange}
            placeholder="租户名称"
            className="w-[124px] md:w-[130px] h-[32px] pl-7 pr-2.5 text-[13px] border border-[#d9d9d9] rounded-[4px] bg-white placeholder-[#86909c] text-[#1d2129] focus:outline-none focus:border-[#2f54eb] transition-colors"
          />
        </div>

        {/* Search: 租户管理员 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#86909c]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="filter-admin-name-input"
            type="text"
            value={filters.adminName}
            onChange={handleAdminChange}
            placeholder="租户管理员"
            className="w-[124px] md:w-[130px] h-[32px] pl-7 pr-2.5 text-[13px] border border-[#d9d9d9] rounded-[4px] bg-white placeholder-[#86909c] text-[#1d2129] focus:outline-none focus:border-[#2f54eb] transition-colors"
          />
        </div>

        {/* Dropdown: 套餐名称 : 全部 */}
        <div className="relative" ref={packageRef}>
          <button
            id="filter-package-dropdown-btn"
            onClick={() => setPackageDropdownOpen(!packageDropdownOpen)}
            className="h-[32px] px-2.5 border border-[#d9d9d9] rounded-[4px] bg-white text-[13px] flex items-center gap-2 hover:border-[#2f54eb] transition-colors cursor-pointer text-[#1d2129] min-w-[110px] justify-between"
          >
            <span className="text-[#86909c] whitespace-nowrap">套餐名称 :</span>
            <span className="text-[#1d2129] whitespace-nowrap">{currentPackageLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#86909c] shrink-0" />
          </button>

          {packageDropdownOpen && (
            <div
              id="package-options-panel"
              className="absolute left-0 mt-1 w-full min-w-[140px] max-h-[220px] overflow-y-auto bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-40 text-[13px]"
            >
              {packageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectPackage(opt.value)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f2f3f5] transition-colors ${
                    filters.packageType === opt.value
                      ? 'text-[#2f54eb] font-medium bg-[#f0f5ff]'
                      : 'text-[#1d2129]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown: 租户状态 : 全部 */}
        <div className="relative" ref={statusRef}>
          <button
            id="filter-status-dropdown-btn"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="h-[32px] px-2.5 border border-[#d9d9d9] rounded-[4px] bg-white text-[13px] flex items-center gap-2 hover:border-[#2f54eb] transition-colors cursor-pointer text-[#1d2129] min-w-[110px] justify-between"
          >
            <span className="text-[#86909c] whitespace-nowrap">租户状态 :</span>
            <span className="text-[#1d2129] whitespace-nowrap">{currentStatusLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#86909c] shrink-0" />
          </button>

          {statusDropdownOpen && (
            <div
              id="status-options-panel"
              className="absolute left-0 mt-1 w-full min-w-[120px] bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-40 text-[13px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectStatus(opt.value)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f2f3f5] transition-colors ${
                    filters.status === opt.value
                      ? 'text-[#2f54eb] font-medium bg-[#f0f5ff]'
                      : 'text-[#1d2129]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Filter Button */}
        <button
          id="reset-filter-btn"
          onClick={onResetFilters}
          title="重置筛选条件"
          className="h-[32px] w-[32px] border border-[#d9d9d9] rounded-[4px] bg-white hover:border-[#2f54eb] text-[#4e5969] hover:text-[#2f54eb] flex items-center justify-center transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
