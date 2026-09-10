import React, { useState, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  PlusCircle,
  Calendar,
  Archive,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Check,
} from 'lucide-react';

export interface MaterialFileItem {
  id: string;
  name: string;
  size: string;
  createTime: string;
  creator: string;
  type: 'excel' | 'pdf' | 'word' | 'image' | 'other';
  group?: string;
}

export const INITIAL_MATERIALS: MaterialFileItem[] = [
  {
    id: 'mat-1',
    name: '04基准数据.xlsx',
    size: '10.4 KB',
    createTime: '2026-08-27 17:13:14',
    creator: 'luyye',
    type: 'excel',
    group: '默认分组',
  },
  {
    id: 'mat-2',
    name: '04基准数据_发票号.xlsx',
    size: '10.5 KB',
    createTime: '2026-08-27 17:13:12',
    creator: 'luyye',
    type: 'excel',
    group: '默认分组',
  },
  {
    id: 'mat-3',
    name: '财产要素-发票1.xlsx',
    size: '17.0 KB',
    createTime: '2026-08-27 17:13:07',
    creator: 'luyye',
    type: 'excel',
    group: '默认分组',
  },
  {
    id: 'mat-4',
    name: '1.pdf',
    size: '1.1 MB',
    createTime: '2026-08-27 17:12:13',
    creator: 'luyye',
    type: 'pdf',
    group: '默认分组',
  },
  {
    id: 'mat-5',
    name: '募集说明书_修正版_错误注入.docx',
    size: '1.0 MB',
    createTime: '2026-08-05 14:22:12',
    creator: 'luyye',
    type: 'word',
    group: '默认分组',
  },
  {
    id: 'mat-6',
    name: '1+金圆投资公司债 修正版_副本_逻辑校验规则错误注入版.docx',
    size: '673.8 KB',
    createTime: '2026-07-09 15:15:11',
    creator: 'luyye',
    type: 'word',
    group: '默认分组',
  },
  {
    id: 'mat-7',
    name: '1+金圆投资公司债 修正版_副本_基础纠错注入版.docx',
    size: '676.8 KB',
    createTime: '2026-07-09 15:13:10',
    creator: 'luyye',
    type: 'word',
    group: '默认分组',
  },
  {
    id: 'mat-8',
    name: '募集说明书_错误注入版.docx',
    size: '1.0 MB',
    createTime: '2026-07-08 17:22:11',
    creator: 'luyye',
    type: 'word',
    group: '默认分组',
  },
  {
    id: 'mat-9',
    name: '募集说明书_含错误_v4.docx',
    size: '879.1 KB',
    createTime: '2026-07-01 11:02:22',
    creator: 'luyye',
    type: 'word',
    group: '默认分组',
  },
];

interface MaterialSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFiles: MaterialFileItem[]) => void;
  initiallySelectedIds?: string[];
}

export const MaterialSelectModal: React.FC<MaterialSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initiallySelectedIds = [],
}) => {
  const [materials, setMaterials] = useState<MaterialFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('daguan_material_files');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MATERIALS;
  });

  const saveMaterials = (newMaterials: MaterialFileItem[]) => {
    setMaterials(newMaterials);
    try {
      localStorage.setItem('daguan_material_files', JSON.stringify(newMaterials));
    } catch (e) {
      console.error(e);
    }
  };

  const [activeTab, setActiveTab] = useState<'doc' | 'image'>('doc');
  const [selectedGroup, setSelectedGroup] = useState<string>('全部文档');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelectedIds);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 2500);
  };

  // Local file upload handler
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newItems: MaterialFileItem[] = Array.from(files).map((f: File, idx: number) => {
      let fileType: MaterialFileItem['type'] = 'other';
      if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) fileType = 'excel';
      else if (f.name.endsWith('.pdf')) fileType = 'pdf';
      else if (f.name.endsWith('.docx') || f.name.endsWith('.doc')) fileType = 'word';
      else if (f.type.startsWith('image/')) fileType = 'image';

      // Format size
      let sizeStr = `${(f.size / 1024).toFixed(1)} KB`;
      if (f.size > 1024 * 1024) {
        sizeStr = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      return {
        id: `upload-${Date.now()}-${idx}`,
        name: f.name,
        size: sizeStr,
        createTime: timeStr,
        creator: 'luyye',
        type: fileType,
        group: '默认分组',
      };
    });

    const updated = [...newItems, ...materials];
    saveMaterials(updated);

    // Auto select newly uploaded items
    const newIds = newItems.map((item) => item.id);
    setSelectedIds((prev) => [...new Set([...prev, ...newIds])]);
    showToast(`成功上传并勾选 ${newItems.length} 个文档`);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter((item) => {
    if (activeTab === 'image' && item.type !== 'image') return false;
    if (activeTab === 'doc' && item.type === 'image') return false;

    if (searchKeyword.trim() && !item.name.toLowerCase().includes(searchKeyword.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const allFilteredSelected =
    filteredMaterials.length > 0 &&
    filteredMaterials.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredMaterials.map((m) => m.id));
      setSelectedIds(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedIds);
      filteredMaterials.forEach((m) => newSelected.add(m.id));
      setSelectedIds(Array.from(newSelected));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirm = () => {
    const chosen = materials.filter((m) => selectedIds.includes(m.id));
    onConfirm(chosen);
    onClose();
  };

  const totalCount = materials.filter((m) => m.type !== 'image').length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      {/* Hidden file input for uploading real files from computer */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleLocalFileUpload}
      />

      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[940px] h-[640px] flex flex-col overflow-hidden border border-[#e5e6eb] animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Toast popup */}
        {uploadToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1d2129] text-white px-4 py-2 rounded text-[13px] shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-[#52c41a]" />
            <span>{uploadToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#e5e6eb] flex items-center justify-between shrink-0 bg-white">
          <h3 className="font-semibold text-[16px] text-[#1d2129]">选择素材</h3>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-[180px] border-r border-[#e5e6eb] bg-white flex flex-col justify-between p-3 shrink-0 select-none">
            <div>
              {/* Tabs: 文档 | 图片 */}
              <div className="flex border-b border-[#f2f3f5] mb-3 pb-1">
                <button
                  onClick={() => setActiveTab('doc')}
                  className={`pb-1 px-2 text-[13.5px] font-medium transition-colors relative cursor-pointer ${
                    activeTab === 'doc'
                      ? 'text-[#2f54eb]'
                      : 'text-[#4e5969] hover:text-[#1d2129]'
                  }`}
                >
                  文档
                  {activeTab === 'doc' && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#2f54eb]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`pb-1 px-2 text-[13.5px] font-medium transition-colors relative cursor-pointer ${
                    activeTab === 'image'
                      ? 'text-[#2f54eb]'
                      : 'text-[#4e5969] hover:text-[#1d2129]'
                  }`}
                >
                  图片
                  {activeTab === 'image' && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#2f54eb]" />
                  )}
                </button>
              </div>

              {/* Tree Menu */}
              <div className="space-y-1 text-[13px]">
                <div
                  onClick={() => setSelectedGroup('全部文档')}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    selectedGroup === '全部文档'
                      ? 'bg-[#f0f5ff] text-[#2f54eb] font-medium'
                      : 'text-[#1d2129] hover:bg-[#f7f8fa]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#86909c]">▼</span>
                    <span>全部文档</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#86909c]">
                    <span>{totalCount}</span>
                    <PlusCircle className="w-3.5 h-3.5 text-[#2f54eb]" />
                  </div>
                </div>

                <div
                  onClick={() => setSelectedGroup('默认分组')}
                  className={`flex items-center justify-between px-2 py-1.5 pl-6 rounded cursor-pointer transition-colors ${
                    selectedGroup === '默认分组'
                      ? 'bg-[#f0f5ff] text-[#2f54eb] font-medium'
                      : 'text-[#4e5969] hover:bg-[#f7f8fa]'
                  }`}
                >
                  <span>默认分组</span>
                  <div className="flex items-center gap-1 text-[12px] text-[#86909c]">
                    <span>{totalCount}</span>
                    <PlusCircle className="w-3.5 h-3.5 text-[#2f54eb]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom link: 前往素材中心 */}
            <div className="pt-3 border-t border-[#f2f3f5]">
              <button
                type="button"
                onClick={() => showToast('已在素材选择模式中')}
                className="text-[12.5px] text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>前往素材中心</span>
              </button>
            </div>
          </div>

          {/* Right Main Material Table Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
              {/* Upload Document Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-[32px] px-3.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[3px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>上传文档</span>
              </button>

              {/* Filters */}
              <div className="flex items-center gap-2">
                {/* Date range filter */}
                <div className="h-[32px] px-2.5 border border-[#d9d9d9] rounded-[3px] text-[12px] text-[#86909c] flex items-center gap-2 bg-white">
                  <span>上传时间：</span>
                  <input
                    type="text"
                    placeholder="开始日期"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[65px] text-[12px] text-[#1d2129] focus:outline-none placeholder-[#bfbfbf]"
                  />
                  <span>→</span>
                  <input
                    type="text"
                    placeholder="结束日期"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[65px] text-[12px] text-[#1d2129] focus:outline-none placeholder-[#bfbfbf]"
                  />
                  <Calendar className="w-3.5 h-3.5 text-[#86909c]" />
                </div>

                {/* Name Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="名称"
                    className="w-[140px] h-[32px] pl-7 pr-2.5 text-[12.5px] border border-[#d9d9d9] rounded-[3px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  title="重置"
                  className="w-[32px] h-[32px] border border-[#d9d9d9] rounded-[3px] bg-white hover:bg-[#f7f8fa] flex items-center justify-center text-[#4e5969] cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Table */}
            <div className="flex-1 border border-[#e5e6eb] rounded-[3px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead className="sticky top-0 bg-[#f7f8fa] z-10">
                  <tr className="border-b border-[#e5e6eb] text-[#1d2129] font-medium h-[38px]">
                    <th className="w-[40px] px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="rounded text-[#2f54eb] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">文档</th>
                    <th className="w-[100px] px-3 py-2 font-medium">大小</th>
                    <th className="w-[160px] px-3 py-2 font-medium">上传时间</th>
                    <th className="w-[90px] px-3 py-2 font-medium">上传者</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f3f5]">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#86909c]">
                        暂无匹配文档，可点击左上方「+ 上传文档」从本地上传
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((file) => {
                      const isChecked = selectedIds.includes(file.id);
                      return (
                        <tr
                          key={file.id}
                          onClick={() => toggleItem(file.id)}
                          className={`hover:bg-[#f9fafc] cursor-pointer transition-colors h-[42px] ${
                            isChecked ? 'bg-[#f0f5ff]/40' : ''
                          }`}
                        >
                          <td
                            className="px-3 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItem(file.id)}
                              className="rounded text-[#2f54eb] w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 max-w-[360px]">
                              {file.type === 'excel' ? (
                                <FileSpreadsheet className="w-4 h-4 text-[#107c41] shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#2f54eb] shrink-0" />
                              )}
                              <span
                                className="truncate text-[#1d2129]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#4e5969] text-[12.5px]">
                            {file.size}
                          </td>
                          <td className="px-3 py-2 text-[#4e5969] text-[12.5px]">
                            {file.createTime}
                          </td>
                          <td className="px-3 py-2 text-[#4e5969] text-[12.5px]">
                            {file.creator}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#e5e6eb] flex items-center justify-between shrink-0 bg-[#fafafa]">
          <div className="text-[13px] text-[#4e5969]">
            已勾选 <span className="font-semibold text-[#2f54eb]">{selectedIds.length}</span> 个文件
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#d9d9d9] bg-white rounded-[4px] text-[13px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white rounded-[4px] text-[13px] cursor-pointer font-medium"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
