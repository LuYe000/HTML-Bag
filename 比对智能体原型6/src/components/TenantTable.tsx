import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { TenantItem } from '../types';

interface TenantTableProps {
  tenants: TenantItem[];
  onEdit: (tenant: TenantItem) => void;
  onView: (tenant: TenantItem) => void;
  onAuthorize: (tenant: TenantItem) => void;
  onDelete?: (tenant: TenantItem) => void;
  onToggleStatus?: (tenant: TenantItem) => void;
}

export const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  onEdit,
  onView,
  onAuthorize,
  onDelete,
  onToggleStatus,
}) => {
  const [activeMoreMenuId, setActiveMoreMenuId] = useState<string | null>(null);

  const getStatusBadge = (status: TenantItem['status']) => {
    switch (status) {
      case '正常':
        return (
          <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#f6ffed] border border-[#b7eb8f] text-[#52c41a]">
            正常
          </span>
        );
      case '禁用':
        return (
          <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#fff1f0] border border-[#ffa39e] text-[#f5222d]">
            禁用
          </span>
        );
      case '已过期':
        return (
          <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#fafafa] border border-[#d9d9d9] text-[#8c8c8c]">
            已过期
          </span>
        );
      default:
        return (
          <span className="inline-block px-1.5 py-[1px] text-[12px] font-normal rounded-[2px] bg-[#f6ffed] border border-[#b7eb8f] text-[#52c41a]">
            正常
          </span>
        );
    }
  };

  return (
    <div className="w-full overflow-x-auto px-6">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-[#f0f0f0] text-[#1f2329] font-medium select-none">
            <th className="py-3.5 pr-4 pl-0 font-medium whitespace-nowrap">租户名称</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">租户管理员</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">套餐类型</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">到期时间</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">租户状态</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">创建时间</th>
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">归属部门</th>
            <th className="py-3.5 pl-4 pr-0 font-medium whitespace-nowrap text-left">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f2f3f5] text-[#1d2129]">
          {tenants.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-[#86909c]">
                暂无匹配租户数据
              </td>
            </tr>
          ) : (
            tenants.map((item) => (
              <tr
                key={item.id}
                id={`tenant-row-${item.id}`}
                className="hover:bg-[#fafbfc] transition-colors group"
              >
                {/* 租户名称 */}
                <td className="py-3.5 pr-4 pl-0 text-[#1d2129] font-normal whitespace-nowrap">
                  {item.name}
                </td>

                {/* 租户管理员 */}
                <td className="py-3.5 px-4 text-[#1d2129] whitespace-nowrap">
                  {item.adminName}
                </td>

                {/* 套餐类型 */}
                <td className="py-3.5 px-4 text-[#1d2129] whitespace-nowrap">
                  {item.packageType}
                </td>

                {/* 到期时间 */}
                <td className="py-3.5 px-4 text-[#1d2129] font-mono text-[13px] whitespace-nowrap">
                  {item.expireTime}
                </td>

                {/* 租户状态 */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>

                {/* 创建时间 */}
                <td className="py-3.5 px-4 text-[#1d2129] font-mono text-[13px] whitespace-nowrap">
                  {item.createTime}
                </td>

                {/* 归属部门 */}
                <td className="py-3.5 px-4 text-[#1d2129] whitespace-nowrap">
                  {item.department || ''}
                </td>

                {/* 操作 */}
                <td className="py-3.5 pl-4 pr-0 whitespace-nowrap relative">
                  <div className="flex items-center gap-3 text-[13.5px]">
                    <button
                      id={`action-edit-${item.id}`}
                      onClick={() => onEdit(item)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      id={`action-view-${item.id}`}
                      onClick={() => onView(item)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
                    >
                      查看
                    </button>
                    <button
                      id={`action-auth-${item.id}`}
                      onClick={() => onAuthorize(item)}
                      className="text-[#2f54eb] hover:text-[#1d39c4] hover:underline cursor-pointer transition-colors"
                    >
                      授权应用
                    </button>

                    {/* More actions button */}
                    <div className="relative inline-block">
                      <button
                        id={`action-more-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMoreMenuId(activeMoreMenuId === item.id ? null : item.id);
                        }}
                        className="text-[#2f54eb] hover:text-[#1d39c4] cursor-pointer px-1 py-0.5 rounded hover:bg-[#edf2fe] flex items-center transition-colors"
                        title="更多操作"
                      >
                        <span className="tracking-widest font-bold text-[14px] leading-none">···</span>
                      </button>

                      {activeMoreMenuId === item.id && (
                        <div
                          id={`more-menu-panel-${item.id}`}
                          onMouseLeave={() => setActiveMoreMenuId(null)}
                          className="absolute right-0 top-full mt-1 w-28 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 text-[13px] text-[#4e5969]"
                        >
                          <button
                            onClick={() => {
                              onToggleStatus?.(item);
                              setActiveMoreMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#f2f3f5] transition-colors"
                          >
                            {item.status === '正常' ? '禁用租户' : '启用租户'}
                          </button>
                          <button
                            onClick={() => {
                              onDelete?.(item);
                              setActiveMoreMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#fff0f0] text-red-600 transition-colors"
                          >
                            删除租户
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
