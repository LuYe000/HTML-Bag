import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, RotateCcw } from 'lucide-react';
import { TenantAccountItem, AccountFilterParams } from '../types';
import {
  getStoredAccounts,
  addStoredAccount,
  updateStoredAccount,
  deleteStoredAccount,
  ACCOUNTS_UPDATED_EVENT,
} from '../accountTenantStore';
import {
  CreateOrEditAccountModal,
  ResetPasswordModal,
} from './TenantModals';
import { Pagination } from './Pagination';

export const TenantAccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<TenantAccountItem[]>(getStoredAccounts);
  const [filters, setFilters] = useState<AccountFilterParams>({
    username: '',
    nickname: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEditAccount, setCurrentEditAccount] = useState<TenantAccountItem | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [currentResetAccount, setCurrentResetAccount] = useState<TenantAccountItem | null>(null);

  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<TenantAccountItem | null>(null);

  // Listen for storage events
  useEffect(() => {
    const handleUpdate = () => {
      setAccounts(getStoredAccounts());
    };
    window.addEventListener(ACCOUNTS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(ACCOUNTS_UPDATED_EVENT, handleUpdate);
  }, []);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (filters.username && !acc.username.toLowerCase().includes(filters.username.toLowerCase())) {
        return false;
      }
      if (filters.nickname && !acc.nickname.toLowerCase().includes(filters.nickname.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [accounts, filters]);

  // Paginated accounts
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // Handlers
  const handleCreateClick = () => {
    setCurrentEditAccount(null);
    setModalOpen(true);
  };

  const handleEditClick = (acc: TenantAccountItem) => {
    setCurrentEditAccount(acc);
    setModalOpen(true);
  };

  const handleResetPasswordClick = (acc: TenantAccountItem) => {
    setCurrentResetAccount(acc);
    setResetModalOpen(true);
  };

  const handleDeleteClick = (acc: TenantAccountItem) => {
    setDeleteConfirmAccount(acc);
  };

  const confirmDelete = () => {
    if (deleteConfirmAccount) {
      deleteStoredAccount(deleteConfirmAccount.id);
      setAccounts(getStoredAccounts());
      setDeleteConfirmAccount(null);
    }
  };

  const handleSaveAccount = (accountData: Partial<TenantAccountItem>) => {
    if (currentEditAccount) {
      updateStoredAccount(currentEditAccount.id, accountData);
    } else {
      addStoredAccount({
        username: accountData.username || '',
        nickname: accountData.nickname || '',
        phone: accountData.phone || '',
        email: accountData.email || '',
        status: accountData.status || '正常',
        password: accountData.password,
      });
    }
    setAccounts(getStoredAccounts());
  };

  const handleConfirmResetPassword = (newPassword: string) => {
    if (currentResetAccount) {
      updateStoredAccount(currentResetAccount.id, { password: newPassword });
      setAccounts(getStoredAccounts());
    }
  };

  const handleRefresh = () => {
    setFilters({ username: '', nickname: '' });
    setCurrentPage(1);
    setAccounts(getStoredAccounts());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Action and Filter Bar (Screenshot 3) */}
      <div
        id="account-filter-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 pt-5 pb-4 px-6"
      >
        {/* Left Action Button: + 新建账户 */}
        <button
          id="create-account-btn"
          onClick={handleCreateClick}
          className="h-[34px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:translate-y-px"
        >
          <Plus className="w-4 h-4" />
          <span>新建账户</span>
        </button>

        {/* Right Search Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search: 账户 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#86909c]">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id="filter-account-username-input"
              type="text"
              value={filters.username}
              onChange={(e) => {
                setFilters({ ...filters, username: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="账户"
              className="w-[140px] md:w-[150px] h-[32px] pl-7 pr-2.5 text-[13px] border border-[#d9d9d9] rounded-[4px] bg-white placeholder-[#86909c] text-[#1d2129] focus:outline-none focus:border-[#2f54eb] transition-colors"
            />
          </div>

          {/* Search: 昵称 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#86909c]">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              id="filter-account-nickname-input"
              type="text"
              value={filters.nickname}
              onChange={(e) => {
                setFilters({ ...filters, nickname: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="昵称"
              className="w-[140px] md:w-[150px] h-[32px] pl-7 pr-2.5 text-[13px] border border-[#d9d9d9] rounded-[4px] bg-white placeholder-[#86909c] text-[#1d2129] focus:outline-none focus:border-[#2f54eb] transition-colors"
            />
          </div>

          {/* Refresh / Action Button */}
          <button
            id="refresh-account-btn"
            onClick={handleRefresh}
            title="刷新"
            className="h-[32px] w-[32px] flex items-center justify-center border border-[#d9d9d9] rounded-[4px] bg-white text-[#4e5969] hover:text-[#2f54eb] hover:border-[#2f54eb] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Account Table Content */}
      <div className="flex-1 overflow-y-auto px-6">
        <table className="w-full border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-[#f0f0f0] text-[#1f2329] font-medium select-none">
              <th className="py-3.5 pr-4 pl-0 font-medium whitespace-nowrap">账户</th>
              <th className="py-3.5 px-4 font-medium whitespace-nowrap">昵称</th>
              <th className="py-3.5 px-4 font-medium whitespace-nowrap">账户手机号</th>
              <th className="py-3.5 px-4 font-medium whitespace-nowrap">账户邮箱</th>
              <th className="py-3.5 px-4 font-medium whitespace-nowrap">账户状态</th>
              <th className="py-3.5 pl-4 pr-0 font-medium whitespace-nowrap text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f3f5] text-[#1d2129]">
            {paginatedAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#86909c]">
                  暂无匹配账户数据
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((item) => (
                <tr
                  key={item.id}
                  id={`account-row-${item.id}`}
                  className="hover:bg-[#fafbfc] transition-colors group"
                >
                  {/* 账户 */}
                  <td className="py-3.5 pr-4 pl-0 text-[#1d2129] font-normal whitespace-nowrap max-w-[280px] truncate" title={item.username}>
                    {item.username}
                  </td>

                  {/* 昵称 */}
                  <td className="py-3.5 px-4 text-[#1d2129] whitespace-nowrap">
                    {item.nickname}
                  </td>

                  {/* 账户手机号 */}
                  <td className="py-3.5 px-4 text-[#1d2129] font-mono text-[13px] whitespace-nowrap">
                    {item.phone}
                  </td>

                  {/* 账户邮箱 */}
                  <td className="py-3.5 px-4 text-[#1d2129] text-[13px] whitespace-nowrap">
                    {item.email}
                  </td>

                  {/* 账户状态 */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.status === '正常' ? (
                      <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#f6ffed] border border-[#b7eb8f] text-[#52c41a]">
                        正常
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#fff1f0] border border-[#ffa39e] text-[#f5222d]">
                        禁用
                      </span>
                    )}
                  </td>

                  {/* 操作 */}
                  <td className="py-3.5 pl-4 pr-0 whitespace-nowrap">
                    <div className="flex items-center gap-3 text-[13.5px]">
                      <button
                        id={`action-edit-acc-${item.id}`}
                        onClick={() => handleEditClick(item)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        id={`action-reset-acc-${item.id}`}
                        onClick={() => handleResetPasswordClick(item)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
                      >
                        重置密码
                      </button>
                      <button
                        id={`action-delete-acc-${item.id}`}
                        onClick={() => handleDeleteClick(item)}
                        className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
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

      {/* Bottom Pagination */}
      <div className="border-t border-[#f2f3f5] bg-white">
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredAccounts.length}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Create / Edit Account Modal (Screenshot 4) */}
      <CreateOrEditAccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAccount}
        initialData={currentEditAccount}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        account={currentResetAccount}
        onConfirm={handleConfirmResetPassword}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[6px] shadow-xl w-full max-w-[400px] overflow-hidden border border-[#e5e6eb] p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-[#1d2129]">确认删除账户</h3>
            <p className="text-[#4e5969] text-[13.5px]">
              确定要删除账户 <span className="font-semibold text-[#1d2129]">{deleteConfirmAccount.username}</span> 吗？此操作不可撤销。
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmAccount(null)}
                className="h-[32px] px-4 rounded-[4px] border border-[#d9d9d9] text-[#4e5969] hover:bg-[#f2f3f5] text-[13px]"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="h-[32px] px-4 rounded-[4px] bg-[#f5222d] text-white hover:bg-[#cf1322] text-[13px]"
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
