import React, { useState, useMemo, useEffect } from 'react';
import { FilterBar } from './FilterBar';
import { TenantTable } from './TenantTable';
import { Pagination } from './Pagination';
import {
  CreateOrEditModal,
  ViewDetailModal,
  AuthAppModal,
} from './TenantModals';
import {
  getStoredTenants,
  addStoredTenant,
  updateStoredTenant,
  deleteStoredTenant,
  TENANTS_UPDATED_EVENT,
  getStoredAccounts,
  ACCOUNTS_UPDATED_EVENT,
} from '../accountTenantStore';
import { TenantItem, FilterParams, TenantAccountItem } from '../types';

export const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantItem[]>(getStoredTenants);
  const [accounts, setAccounts] = useState<TenantAccountItem[]>(getStoredAccounts);

  // Filter state
  const [filters, setFilters] = useState<FilterParams>({
    name: '',
    adminName: '',
    packageType: '',
    status: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [currentEditTenant, setCurrentEditTenant] = useState<TenantItem | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentViewTenant, setCurrentViewTenant] = useState<TenantItem | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentAuthTenant, setCurrentAuthTenant] = useState<TenantItem | null>(null);

  // Storage synchronization
  useEffect(() => {
    const handleTenantsUpdate = () => {
      setTenants(getStoredTenants());
    };
    const handleAccountsUpdate = () => {
      setAccounts(getStoredAccounts());
    };
    window.addEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
    window.addEventListener(ACCOUNTS_UPDATED_EVENT, handleAccountsUpdate);
    return () => {
      window.removeEventListener(TENANTS_UPDATED_EVENT, handleTenantsUpdate);
      window.removeEventListener(ACCOUNTS_UPDATED_EVENT, handleAccountsUpdate);
    };
  }, []);

  // Filtered dataset
  const filteredTenants = useMemo(() => {
    return tenants.filter((item) => {
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (
        filters.adminName &&
        !item.adminName.toLowerCase().includes(filters.adminName.toLowerCase())
      ) {
        return false;
      }
      if (filters.packageType && item.packageType !== filters.packageType) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [tenants, filters]);

  // Current page records
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  // Handlers
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      adminName: '',
      packageType: '',
      status: '',
    });
    setCurrentPage(1);
    setTenants(getStoredTenants());
  };

  const handleCreateTenantClick = () => {
    setCurrentEditTenant(null);
    setCreateEditModalOpen(true);
  };

  const handleEditTenant = (tenant: TenantItem) => {
    setCurrentEditTenant(tenant);
    setCreateEditModalOpen(true);
  };

  const handleViewTenant = (tenant: TenantItem) => {
    setCurrentViewTenant(tenant);
    setViewModalOpen(true);
  };

  const handleAuthorizeApp = (tenant: TenantItem) => {
    setCurrentAuthTenant(tenant);
    setAuthModalOpen(true);
  };

  const handleToggleStatus = (tenant: TenantItem) => {
    const nextStatus = tenant.status === '正常' ? '禁用' : '正常';
    updateStoredTenant(tenant.id, { status: nextStatus });
    setTenants(getStoredTenants());
  };

  const handleDeleteTenant = (tenant: TenantItem) => {
    deleteStoredTenant(tenant.id);
    setTenants(getStoredTenants());
  };

  const handleSaveTenant = (data: Partial<TenantItem>) => {
    if (currentEditTenant) {
      updateStoredTenant(currentEditTenant.id, data);
    } else {
      addStoredTenant(data);
    }
    setTenants(getStoredTenants());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Action & Filter Toolbar (Screenshot 1) */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onCreateTenant={handleCreateTenantClick}
      />

      {/* Tenant Table Content */}
      <div className="flex-1 overflow-y-auto">
        <TenantTable
          tenants={paginatedTenants}
          onEdit={handleEditTenant}
          onView={handleViewTenant}
          onAuthorize={handleAuthorizeApp}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteTenant}
        />
      </div>

      {/* Bottom Pagination */}
      <div className="border-t border-[#f2f3f5] bg-white">
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredTenants.length}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Create / Edit Tenant Modal (Screenshot 2) */}
      <CreateOrEditModal
        isOpen={createEditModalOpen}
        onClose={() => setCreateEditModalOpen(false)}
        onSave={handleSaveTenant}
        initialData={currentEditTenant}
        accounts={accounts}
      />

      {/* View Detail Modal */}
      <ViewDetailModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        tenant={currentViewTenant}
      />

      {/* Authorize App Modal */}
      <AuthAppModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        tenant={currentAuthTenant}
      />
    </div>
  );
};
