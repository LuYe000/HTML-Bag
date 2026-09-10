import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}) => {
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) {
        setSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push(2);
      pages.push(3);
      pages.push(4);
      pages.push(5);
      pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span
            key={`dots-${index}`}
            className="w-7 h-7 flex items-center justify-center text-[12px] text-[#86909c]"
          >
            ···
          </span>
        );
      }

      const pageNum = page as number;
      const isActive = pageNum === currentPage;

      return (
        <button
          key={pageNum}
          id={`pagination-page-${pageNum}`}
          onClick={() => onPageChange(pageNum)}
          className={`w-7 h-7 text-[13px] rounded-[3px] flex items-center justify-center transition-colors cursor-pointer ${
            isActive
              ? 'bg-[#2f54eb] text-white font-medium shadow-sm'
              : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5]'
          }`}
        >
          {pageNum}
        </button>
      );
    });
  };

  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  return (
    <div
      id="table-pagination-container"
      className="flex items-center justify-end gap-3 px-6 py-4 select-none text-[13px] text-[#4e5969]"
    >
      {/* Items count summary */}
      <span className="text-[#86909c]">
        第 {startItem}-{endItem} 条/共 {totalCount} 条
      </span>

      {/* Prev button */}
      <button
        id="pagination-prev-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`w-7 h-7 flex items-center justify-center rounded-[3px] transition-colors ${
          currentPage <= 1
            ? 'text-[#c9cdd4] cursor-not-allowed'
            : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5] cursor-pointer'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">{renderPageNumbers()}</div>

      {/* Next button */}
      <button
        id="pagination-next-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`w-7 h-7 flex items-center justify-center rounded-[3px] transition-colors ${
          currentPage >= totalPages
            ? 'text-[#c9cdd4] cursor-not-allowed'
            : 'text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5] cursor-pointer'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Page size selector dropdown */}
      <div className="relative ml-1" ref={sizeRef}>
        <button
          id="page-size-selector-btn"
          onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
          className="h-[28px] px-2 border border-[#d9d9d9] rounded-[3px] bg-white text-[12.5px] flex items-center gap-1 hover:border-[#2f54eb] text-[#4e5969] cursor-pointer"
        >
          <span>{pageSize} 条/页</span>
          <ChevronDown className="w-3 h-3 text-[#86909c]" />
        </button>

        {sizeDropdownOpen && (
          <div
            id="page-size-options-panel"
            className="absolute right-0 bottom-full mb-1 w-[90px] bg-white border border-[#e5e6eb] rounded-[3px] shadow-lg py-1 z-40 text-[12.5px]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onPageSizeChange(size);
                  setSizeDropdownOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1 hover:bg-[#f2f3f5] transition-colors ${
                  pageSize === size ? 'text-[#2f54eb] font-medium bg-[#f0f5ff]' : 'text-[#1d2129]'
                }`}
              >
                {size} 条/页
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
