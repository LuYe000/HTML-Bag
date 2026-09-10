import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  ArrowUpDown,
  FileCode2,
  AlertCircle,
} from 'lucide-react';
import { INITIAL_SHARED_LAYOUT_TYPES } from '../sharedCompareData';

export interface LayoutTypeItem {
  id: string;
  name: string;
  strategy: string;
  strategyIconColor?: string;
  desc: string;
  params?: string;
  createTime: string;
  creator: string;
  isSystem?: boolean;
}

const DEFAULT_JSON_PARAMS = `{
  "business": "layout_parser",
  "element_detect_strategy": {
    "equation": "yolo",
    "footnote": "yolo",
    "graph": "yolo",
    "graph_caption": "yolo",
    "header_footer": "gcn",
    "ocr": "dg",
    "paragraph": "yolo",
    "signet": "close",
    "table": "yolo",
    "table_caption": "yolo",
    "title": "yolo",
    "toc": "gcn",
    "watermark": "close"
  },
  "exclusive_conf": {
    "archive_level": 0,
    "filter_edges": [
      0,
      1,
      0
    ]
  }
}`;

const PRESET_PARAMS_TEMPLATES: Record<string, string> = {
  '通用默认版面参数': DEFAULT_JSON_PARAMS,
  'OCR文字增强提取参数': `{
  "business": "ocr_enhancement",
  "element_detect_strategy": {
    "ocr": "high_precision",
    "paragraph": "yolo_v5",
    "header_footer": "gcn_strict",
    "signet": "auto_detect",
    "table": "ocr_grid",
    "watermark": "filter_all"
  },
  "exclusive_conf": {
    "archive_level": 1,
    "filter_edges": [1, 1, 1]
  }
}`,
  '多栏研报专用解析参数': `{
  "business": "multi_column_report",
  "element_detect_strategy": {
    "column_split": "auto_adaptive",
    "paragraph": "yolo_multi_col",
    "header_footer": "gcn",
    "graph": "yolo",
    "graph_caption": "yolo",
    "table": "yolo_v2",
    "toc": "gcn_deep"
  },
  "exclusive_conf": {
    "archive_level": 0,
    "filter_edges": [0, 1, 0]
  }
}`,
  '连续合同跨页表格参数': `{
  "business": "contract_cross_page_table",
  "element_detect_strategy": {
    "table": "yolo_cross_page",
    "table_merge": "enabled",
    "header_footer": "gcn",
    "signet": "seal_detect_v2",
    "ocr": "dg"
  },
  "exclusive_conf": {
    "archive_level": 0,
    "filter_edges": [0, 0, 0]
  }
}`,
};

const INITIAL_LAYOUT_TYPES: LayoutTypeItem[] = INITIAL_SHARED_LAYOUT_TYPES;

const PARSING_STRATEGIES = [
  '强制PDF解析',
  '自动后缀判断',
];

export const CompareLayoutManagement: React.FC = () => {
  const [data, setData] = useState<LayoutTypeItem[]>(INITIAL_LAYOUT_TYPES);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('全部');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown states
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LayoutTypeItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const creatorRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (creatorRef.current && !creatorRef.current.contains(e.target as Node)) {
        setCreatorDropdownOpen(false);
      }
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setDatePickerOpen(false);
      }
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setPageSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distinct creators
  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      if (d.creator && d.creator !== '-') set.add(d.creator);
    });
    return ['全部', ...Array.from(set)];
  }, [data]);

  // Filtered & Sorted items
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Keyword filter
        if (searchKeyword.trim()) {
          const kw = searchKeyword.trim().toLowerCase();
          const matchName = item.name.toLowerCase().includes(kw);
          const matchDesc = item.desc.toLowerCase().includes(kw);
          const matchCreator = item.creator.toLowerCase().includes(kw);
          const matchStrategy = item.strategy.toLowerCase().includes(kw);
          const matchId = item.id.includes(kw);
          if (
            !matchName &&
            !matchDesc &&
            !matchCreator &&
            !matchStrategy &&
            !matchId
          ) {
            return false;
          }
        }

        // Creator filter
        if (selectedCreator !== '全部') {
          if (item.creator !== selectedCreator) {
            return false;
          }
        }

        // Date range filter
        if (startDate) {
          const itemDate = item.createTime.split(' ')[0];
          if (itemDate < startDate) return false;
        }
        if (endDate) {
          const itemDate = item.createTime.split(' ')[0];
          if (itemDate > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createTime).getTime();
        const timeB = new Date(b.createTime).getTime();
        if (timeA !== timeB) {
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        const numA = Number(a.id.replace(/\D/g, '')) || 0;
        const numB = Number(b.id.replace(/\D/g, '')) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      });
  }, [data, searchKeyword, selectedCreator, startDate, endDate, sortOrder]);

  // Paginated items
  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Generate page numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  }, [totalPages, currentPage]);

  // Create or Update
  const handleSaveItem = (item: LayoutTypeItem) => {
    if (editingItem) {
      setData((prev) => prev.map((d) => (d.id === item.id ? item : d)));
      showToast('版面类型已更新');
    } else {
      setData((prev) => [item, ...prev]);
      showToast('版面类型创建成功');
    }
    setIsCreateModalOpen(false);
    setEditingItem(null);
  };

  // Delete
  const handleDeleteItem = (id: string) => {
    setData((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirmId(null);
    showToast('版面类型已删除');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans text-[#1d2129] relative overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1d2129]/90 text-white text-[13px] px-4 py-2 rounded shadow-lg transition-all animate-in fade-in zoom-in-95 flex items-center gap-2">
          <Check className="w-4 h-4 text-[#00b42a]" />
          {toastMsg}
        </div>
      )}

      {/* Top Action & Filter Toolbar */}
      <div className="px-6 py-4 border-b border-[#f2f3f5] flex flex-wrap items-center justify-between gap-4">
        {/* Left: + 新建类型 Button */}
        <div>
          <button
            id="create-layout-type-btn"
            onClick={() => {
              setEditingItem(null);
              setIsCreateModalOpen(true);
            }}
            className="h-[32px] px-3.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>新建类型</span>
          </button>
        </div>

        {/* Right: Search & Filters (Matching existing SaaS style) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyword Search */}
          <div className="relative w-[210px]">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="请输入关键词"
              className="w-full h-[32px] pl-8 pr-7 border border-[#d9d9d9] hover:border-[#b0b4be] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] placeholder:text-[#86909c] outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchKeyword && (
              <X
                onClick={() => setSearchKeyword('')}
                className="w-3.5 h-3.5 text-[#86909c] hover:text-[#1d2129] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              />
            )}
          </div>

          {/* 创建人 Dropdown */}
          <div ref={creatorRef} className="relative">
            <div
              onClick={() => setCreatorDropdownOpen(!creatorDropdownOpen)}
              className={`h-[32px] px-3 border rounded-[4px] flex items-center gap-2 text-[13px] bg-white cursor-pointer transition-colors ${
                creatorDropdownOpen
                  ? 'border-[#2f54eb]'
                  : 'border-[#d9d9d9] hover:border-[#b0b4be]'
              }`}
            >
              <span className="text-[#86909c]">创建人：</span>
              <span className="text-[#1d2129]">{selectedCreator}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#86909c] transition-transform ${
                  creatorDropdownOpen ? 'rotate-180 text-[#2f54eb]' : ''
                }`}
              />
            </div>

            {creatorDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 min-w-[140px] max-h-[220px] overflow-y-auto">
                {creatorOptions.map((c) => (
                  <div
                    key={c}
                    onClick={() => {
                      setSelectedCreator(c);
                      setCreatorDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                      selectedCreator === c
                        ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                        : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCreator === c && (
                      <Check className="w-3.5 h-3.5 text-[#2f54eb]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 创建时间 Date Range Picker */}
          <div ref={datePickerRef} className="relative">
            <div
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className={`h-[32px] px-3 border rounded-[4px] flex items-center gap-2 text-[13px] bg-white cursor-pointer transition-colors ${
                datePickerOpen
                  ? 'border-[#2f54eb]'
                  : 'border-[#d9d9d9] hover:border-[#b0b4be]'
              }`}
            >
              <span className="text-[#86909c]">创建时间：</span>
              <span
                className={
                  startDate || endDate ? 'text-[#1d2129]' : 'text-[#86909c]'
                }
              >
                {startDate || '开始日期'} → {endDate || '结束日期'}
              </span>
              <Calendar className="w-3.5 h-3.5 text-[#86909c]" />
            </div>

            {datePickerOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e6eb] rounded-[6px] shadow-lg p-3.5 z-30 w-[280px]">
                <div className="text-[13px] font-medium text-[#1d2129] mb-2.5">
                  选择创建时间范围
                </div>
                <div className="space-y-2 text-[13px]">
                  <div>
                    <label className="text-[12px] text-[#86909c] block mb-1">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-[30px] px-2 border border-[#d9d9d9] rounded text-[12.5px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] text-[#86909c] block mb-1">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-[30px] px-2 border border-[#d9d9d9] rounded text-[12.5px] outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#f2f3f5]">
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[12px] text-[#86909c] hover:text-[#1d2129] cursor-pointer"
                  >
                    重置
                  </button>
                  <button
                    onClick={() => setDatePickerOpen(false)}
                    className="h-[26px] px-3 bg-[#2f54eb] text-white text-[12px] rounded-[3px] cursor-pointer"
                  >
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fafbfc] border-b border-[#e5e6eb] text-[13px] text-[#1d2129] font-medium h-[44px]">
              <th className="w-[80px] px-3">序号</th>
              <th className="w-[260px] px-3">类型名称</th>
              <th className="w-[180px] px-3">解析策略</th>
              <th className="px-3 min-w-[200px]">类型描述</th>
              <th className="w-[190px] px-3">
                <div
                  onClick={() =>
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                  }
                  className="inline-flex items-center gap-1.5 cursor-pointer hover:text-[#2f54eb] transition-colors"
                >
                  <span>创建时间</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#86909c]" />
                </div>
              </th>
              <th className="w-[130px] px-3">创建人</th>
              <th className="w-[100px] px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f3f5] text-[13px] text-[#4e5969]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-[#86909c]">
                  <div className="flex flex-col items-center justify-center">
                    <FileCode2 className="w-10 h-10 text-[#c9cdd4] mb-2 stroke-[1.2]" />
                    <p>暂无符合条件的版面管理数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const pageOffset = (currentPage - 1) * pageSize + index;
                const serialNumber =
                  sortOrder === 'desc'
                    ? totalCount - pageOffset
                    : pageOffset + 1;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#f7f8fa] transition-colors h-[48px]"
                  >
                    {/* 序号 */}
                    <td className="px-3 text-[#1d2129] font-normal font-mono">
                      {serialNumber}
                    </td>

                    {/* 类型名称 */}
                    <td className="px-3 text-[#1d2129] font-normal">
                      <span
                        className="hover:text-[#2f54eb] cursor-pointer transition-colors"
                        onClick={() => {
                          setEditingItem(item);
                          setIsCreateModalOpen(true);
                        }}
                      >
                        {item.name}
                      </span>
                    </td>

                    {/* 解析策略 */}
                    <td className="px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#f2eafa] text-[#722ed1] text-[12px] font-normal border border-[#ebd7fb]">
                        {/* Purple Strategy Badge Icon */}
                        <span className="w-3.5 h-3.5 rounded-[2px] bg-[#722ed1] text-white text-[9px] flex items-center justify-center font-bold font-mono">
                          A
                        </span>
                        <span>{item.strategy}</span>
                      </div>
                    </td>

                    {/* 类型描述 */}
                    <td className="px-3 text-[#86909c] truncate max-w-[300px]">
                      {item.desc || '-'}
                    </td>

                    {/* 创建时间 */}
                    <td className="px-3 text-[#4e5969] font-mono text-[12.5px]">
                      {item.createTime}
                    </td>

                    {/* 创建人 */}
                    <td className="px-3 text-[#4e5969]">{item.creator}</td>

                    {/* 操作 */}
                    <td className="px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2.5 text-[#2f54eb]">
                        {item.isSystem ? (
                          <button
                            title="系统内置重置同步"
                            onClick={() => showToast('已同步最新系统解析引擎')}
                            className="p-1 hover:bg-[#f0f4ff] rounded text-[#2f54eb] transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            title="编辑"
                            onClick={() => {
                              setEditingItem(item);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1 hover:bg-[#f0f4ff] rounded text-[#2f54eb] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="删除"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 hover:bg-[#fff0f0] rounded text-[#f53f3f] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Toolbar */}
      <div className="shrink-0 h-[52px] px-6 border-t border-[#f2f3f5] bg-white flex items-center justify-between text-[13px] text-[#4e5969]">
        {/* Left Total Count */}
        <div className="flex items-center gap-3">
          <span>共 {totalCount} 条数据</span>
        </div>

        {/* Right Pagination Controls (Exact page indicators 1, ..., 46, 47, 48, 49, 50) */}
        <div className="flex items-center gap-2">
          {/* Prev button */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#86909c]" />
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="text-[#86909c] px-1 text-[12px]">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`min-w-[28px] h-7 px-2 flex items-center justify-center text-[13px] rounded border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#2f54eb] bg-[#2f54eb] text-white font-medium shadow-xs'
                    : 'border-[#d9d9d9] hover:bg-[#f7f8fa] text-[#1d2129]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[#86909c]" />
          </button>

          {/* Page Size Select */}
          <div ref={pageSizeRef} className="relative ml-2">
            <div
              onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
              className="h-[28px] px-2.5 border border-[#d9d9d9] hover:border-[#b0b4be] rounded flex items-center gap-1.5 text-[12.5px] bg-white cursor-pointer transition-colors"
            >
              <span>{pageSize} 条/页</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#86909c]" />
            </div>

            {pageSizeDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-1 bg-white border border-[#e5e6eb] rounded shadow-lg py-1 z-30 min-w-[100px]">
                {[10, 20, 50, 100].map((size) => (
                  <div
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setPageSizeDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-[12.5px] cursor-pointer transition-colors ${
                      pageSize === size
                        ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                        : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                    }`}
                  >
                    {size} 条/页
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Layout Type Modal */}
      {isCreateModalOpen && (
        <LayoutEditModal
          item={editingItem}
          existingTypes={data}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[400px] w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fff2f0] flex items-center justify-center text-[#f53f3f] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#1d2129]">
                  确认删除版面类型
                </h3>
                <p className="text-[13px] text-[#86909c] mt-1.5 leading-relaxed">
                  删除后该版面类型将无法在比对规则中引用，此操作不可撤销。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="h-[32px] px-4 border border-[#d9d9d9] hover:bg-[#f7f8fa] text-[13px] text-[#1d2129] rounded-[4px] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="h-[32px] px-4 bg-[#f53f3f] hover:bg-[#d03030] text-white text-[13px] rounded-[4px] cursor-pointer font-normal shadow-sm"
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

// ==========================================
// Modal: Create or Edit Layout Type (Matching Screenshot)
// ==========================================
interface LayoutEditModalProps {
  item: LayoutTypeItem | null;
  existingTypes: LayoutTypeItem[];
  onClose: () => void;
  onSave: (saved: LayoutTypeItem) => void;
}

const LayoutEditModal: React.FC<LayoutEditModalProps> = ({
  item,
  existingTypes,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(item?.name || '');
  const [strategy, setStrategy] = useState(item?.strategy || '自动后缀判断');
  const [strategyInput, setStrategyInput] = useState(item?.strategy || '自动后缀判断');
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false);
  const [desc, setDesc] = useState(item?.desc || '');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [jsonCode, setJsonCode] = useState(item?.params || DEFAULT_JSON_PARAMS);
  const [showDocModal, setShowDocModal] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const strategyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (strategyRef.current && !strategyRef.current.contains(e.target as Node)) {
        setStrategyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isTypingStrategy, setIsTypingStrategy] = useState(false);

  const filteredStrategies = useMemo(() => {
    if (!isTypingStrategy || !strategyInput.trim()) return PARSING_STRATEGIES;
    const match = PARSING_STRATEGIES.filter((s) =>
      s.toLowerCase().includes(strategyInput.trim().toLowerCase())
    );
    return match.length > 0 ? match : PARSING_STRATEGIES;
  }, [strategyInput, isTypingStrategy]);

  const importSources = useMemo(() => {
    return existingTypes.map((typeItem) => ({
      name: typeItem.name,
      params:
        typeItem.params ||
        PRESET_PARAMS_TEMPLATES[typeItem.name] ||
        DEFAULT_JSON_PARAMS,
    }));
  }, [existingTypes]);

  // Handle Preset Import
  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const source = importSources.find((item) => item.name === presetName);
    if (source) {
      setJsonCode(source.params);
      setJsonError(null);
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonCode(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch {
      setJsonError('JSON 格式有误，请检查语法');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate JSON
    try {
      JSON.parse(jsonCode);
    } catch {
      setJsonError('JSON 语法错误，请修改后再提交');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

    onSave({
      id: item ? item.id : `layout-${Date.now()}`,
      name: name.trim(),
      strategy: strategy || '自动后缀判断',
      desc: desc.trim(),
      params: jsonCode,
      creator: item ? item.creator : '管理员',
      createTime: item ? item.createTime : timeStr,
      isSystem: item?.isSystem,
    });
  };

  const codeLines = useMemo(() => jsonCode.split('\n'), [jsonCode]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
        <div className="relative w-full max-w-[840px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f2f3f5] shrink-0">
            <h2 className="text-[16px] font-semibold text-[#1d2129]">
              {item ? '编辑类型' : '新增类型'}
            </h2>
            <button
              onClick={onClose}
              className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto pt-5 pb-2 pr-1 space-y-6 text-[13.5px]"
          >
            {/* Section 1: 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-[3px] h-[14px] bg-[#2f54eb] rounded-full inline-block"></span>
                <span className="font-bold text-[14px] text-[#1d2129]">
                  基本信息
                </span>
              </div>

              {/* Row 1: 类型名称 & 解析策略 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* 类型名称 */}
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-[#1d2129] font-normal text-[13px] w-[75px] text-right">
                    <span className="text-[#f53f3f] mr-1">*</span>类型名称：
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="仅支持常见中英文字符和常见符号，最长 50 个..."
                    className="flex-1 h-[34px] px-3 border border-[#d9d9d9] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] placeholder:text-[#86909c] outline-none transition-colors"
                  />
                </div>

                {/* 解析策略 */}
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-[#1d2129] font-normal text-[13px] w-[75px] text-right">
                    <span className="text-[#f53f3f] mr-1">*</span>解析策略：
                  </label>
                  <div ref={strategyRef} className="relative flex-1">
                    <div
                      onClick={() => {
                        setStrategyDropdownOpen(true);
                        setIsTypingStrategy(false);
                      }}
                      className={`relative flex items-center h-[34px] px-3 border rounded-[4px] bg-white transition-all cursor-text ${
                        strategyDropdownOpen
                          ? 'border-[#2f54eb] ring-1 ring-[#2f54eb]/30 shadow-xs'
                          : 'border-[#d9d9d9] hover:border-[#b0b4be]'
                      }`}
                    >
                      <input
                        type="text"
                        value={strategyDropdownOpen && isTypingStrategy ? strategyInput : strategy}
                        onChange={(e) => {
                          setIsTypingStrategy(true);
                          setStrategyInput(e.target.value);
                          if (!strategyDropdownOpen) setStrategyDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setStrategyDropdownOpen(true);
                          setIsTypingStrategy(false);
                        }}
                        placeholder="请选择解析策略"
                        className="w-full h-full pr-6 text-[13px] text-[#1d2129] outline-none bg-transparent placeholder:text-[#86909c]"
                      />
                      <Search className="w-4 h-4 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Dropdown Options */}
                    {strategyDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e6eb] rounded-[6px] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                        {PARSING_STRATEGIES.map((s) => {
                          const isSelected = strategy === s;
                          return (
                            <div
                              key={s}
                              onClick={() => {
                                setStrategy(s);
                                setStrategyInput(s);
                                setIsTypingStrategy(false);
                                setStrategyDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-[13px] cursor-pointer transition-colors mx-1.5 rounded-[4px] ${
                                isSelected
                                  ? 'bg-[#f0f5ff] text-[#1d2129] font-medium'
                                  : 'hover:bg-[#f7f8fa] text-[#1d2129] font-normal'
                              }`}
                            >
                              {s}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: 类型描述 */}
              <div className="flex items-start gap-2">
                <label className="shrink-0 text-[#1d2129] font-normal text-[13px] w-[75px] text-right pt-2">
                  类型描述：
                </label>
                <div className="w-full md:w-[calc(50%-10px)]">
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="仅支持常见中英文字符和常见符号，最长 50 个字符"
                    rows={2}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-[#d9d9d9] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] placeholder:text-[#86909c] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: 解析参数 */}
            <div className="space-y-3.5 pt-2 border-t border-[#f2f3f5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-[3px] h-[14px] bg-[#2f54eb] rounded-full inline-block"></span>
                  <span className="font-bold text-[14px] text-[#1d2129]">
                    解析参数
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocModal(true)}
                  className="text-[#2f54eb] hover:text-[#1d39c4] text-[13px] cursor-pointer hover:underline transition-colors"
                >
                  说明文档
                </button>
              </div>

              {/* 导入参数 */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-[#1d2129] font-normal text-[13px] w-[75px] text-right">
                  导入参数：
                </label>
                <div className="relative w-full md:w-[350px]">
                  <select
                    value={selectedPreset}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full h-[34px] pl-3 pr-8 border border-[#d9d9d9] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="">请选择导入的参数</option>
                    {importSources.map((source) => (
                      <option key={source.name} value={source.name}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* JSON Code Editor (IDE Style with gutter, line numbers, highlights) */}
              <div className="mt-2 border border-[#2f54eb]/60 rounded-[4px] bg-[#ffffff] overflow-hidden shadow-xs">
                {jsonError && (
                  <div className="bg-[#fff2f0] border-b border-[#ffccc7] text-[#f53f3f] px-3 py-1.5 text-[12px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="relative flex min-h-[300px] max-h-[360px] overflow-auto font-mono text-[13px] leading-[22px]">
                  {/* Left Gutter: Line Numbers */}
                  <div className="w-[50px] shrink-0 bg-[#fafafa] border-r border-[#e8e8e8] py-2 text-right pr-3 select-none text-[#8c8c8c]">
                    {codeLines.map((line, idx) => {
                      const hasBlock =
                        line.includes('{') || line.includes('[');
                      return (
                        <div
                          key={idx}
                          className="h-[22px] flex items-center justify-end gap-1 text-[12px]"
                        >
                          <span className="font-mono text-[#8c8c8c]">
                            {idx + 1}
                          </span>
                          {hasBlock ? (
                            <span className="text-[10px] text-[#8c8c8c] leading-none">
                              ▾
                            </span>
                          ) : (
                            <span className="w-[10px]"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Active highlight top strip banner */}
                  <div className="flex-1 relative bg-white py-2 pl-3 pr-4">
                    {/* Synchronized editable textarea */}
                    <textarea
                      value={jsonCode}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full min-h-[280px] bg-transparent text-[#1d2129] font-mono text-[13px] leading-[22px] outline-none resize-none border-none p-0 whitespace-pre"
                      style={{ tabSize: 2 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f2f3f5] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-[32px] px-4 border border-[#d9d9d9] hover:bg-[#f7f8fa] text-[13.5px] text-[#1d2129] rounded-[4px] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="h-[32px] px-5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-normal shadow-sm"
              >
                确定
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 说明文档 Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
          <div className="relative w-full max-w-[620px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f3f5]">
              <h3 className="text-[15px] font-semibold text-[#1d2129] flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#2f54eb]" />
                解析参数说明文档
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-[#86909c] hover:text-[#1d2129] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-[13px] text-[#4e5969]">
              <div className="bg-[#f0f4ff] p-3 rounded text-[#1d39c4] text-[12.5px] leading-relaxed">
                版面解析参数通过 JSON
                格式向底层解析引擎（LayoutParser/GCN/YOLO）下发各元素的识别策略与过滤规则。
              </div>

              <div>
                <h4 className="font-semibold text-[#1d2129] mb-1.5">
                  1. business (业务模式)
                </h4>
                <p className="text-[#86909c]">
                  <code>"layout_parser"</code>：通用版面解析；
                  <code>"ocr_enhancement"</code>：高精OCR纯文本增强；
                  <code>"multi_column_report"</code>：研报多栏排版。
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#1d2129] mb-1.5">
                  2. element_detect_strategy (元素探测策略)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[#86909c]">
                  <li>
                    <code>equation</code>: 公式识别模型（<code>"yolo"</code> /{' '}
                    <code>"close"</code>）
                  </li>
                  <li>
                    <code>footnote</code>: 脚注探测（<code>"yolo"</code>）
                  </li>
                  <li>
                    <code>header_footer</code>: 页眉页脚识别（
                    <code>"gcn"</code> / <code>"gcn_strict"</code>）
                  </li>
                  <li>
                    <code>ocr</code>: OCR 引擎（<code>"dg"</code> /{' '}
                    <code>"high_precision"</code>）
                  </li>
                  <li>
                    <code>signet</code>: 印章过滤与提取（<code>"yolo"</code> /{' '}
                    <code>"close"</code> / <code>"auto_detect"</code>）
                  </li>
                  <li>
                    <code>table</code>: 表格识别模式（<code>"yolo"</code> /{' '}
                    <code>"yolo_cross_page"</code>）
                  </li>
                  <li>
                    <code>toc</code>: 目录定位策略（<code>"gcn"</code>）
                  </li>
                  <li>
                    <code>watermark</code>: 水印去除策略（<code>"close"</code> /{' '}
                    <code>"filter_all"</code>）
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[#1d2129] mb-1.5">
                  3. exclusive_conf (排他过滤配置)
                </h4>
                <p className="text-[#86909c]">
                  <code>filter_edges</code>: [左, 上, 右,
                  下]边缘噪点与装订线过滤开关（0为关闭，1为开启）。
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#f2f3f5]">
              <button
                onClick={() => setShowDocModal(false)}
                className="h-[30px] px-4 bg-[#2f54eb] text-white text-[13px] rounded cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
