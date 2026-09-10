import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PackageItem } from '../types';
import { AVAILABLE_MODULES } from '../packageStore';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PackageItem>) => void;
  initialData?: PackageItem | null;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [status, setStatus] = useState<'正常' | '禁用'>('正常');
  const [errors, setErrors] = useState<{ name?: string; modules?: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setSelectedModules(initialData.modules || []);
        setStatus(initialData.status || '正常');
      } else {
        setName('');
        setDescription('');
        setSelectedModules([]);
        setStatus('正常');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleToggleModule = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; modules?: string } = {};
    if (!name.trim()) {
      newErrors.name = '请输入套餐名称';
    }
    if (selectedModules.length === 0) {
      newErrors.modules = '请至少选择一个模块权限';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      modules: selectedModules,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div
        id="package-modal"
        className="bg-white rounded-lg shadow-xl w-[580px] max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header matching Screenshot 2 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
          <h3 className="text-[16px] font-semibold text-[#1d2129]">
            {initialData ? '编辑套餐' : '新建'}
          </h3>
          <button
            id="close-package-modal-btn"
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body matching Screenshot 2 */}
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
          {/* 套餐名称 * */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-normal text-[#1d2129]">
              套餐名称 <span className="text-[#f53f3f]">*</span>
            </label>
            <input
              id="package-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="请输入"
              className={`w-full px-3 py-2 text-[13px] border rounded-[4px] outline-none transition-colors ${
                errors.name
                  ? 'border-[#f53f3f] focus:border-[#f53f3f]'
                  : 'border-[#d9d9d9] hover:border-[#2f54eb] focus:border-[#2f54eb]'
              }`}
            />
            {errors.name && <p className="text-[12px] text-[#f53f3f]">{errors.name}</p>}
          </div>

          {/* 套餐描述 */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-normal text-[#1d2129]">套餐描述</label>
            <textarea
              id="package-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入"
              rows={3}
              className="w-full px-3 py-2 text-[13px] border border-[#d9d9d9] rounded-[4px] outline-none hover:border-[#2f54eb] focus:border-[#2f54eb] transition-colors resize-y"
            />
          </div>

          {/* 模块权限 * (含 比对智能体) */}
          <div className="space-y-2">
            <label className="block text-[13px] font-normal text-[#1d2129]">
              模块权限 <span className="text-[#f53f3f]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 py-1">
              {AVAILABLE_MODULES.map((mod) => {
                const checked = selectedModules.includes(mod);
                return (
                  <label
                    key={mod}
                    className="flex items-center gap-1.5 cursor-pointer text-[13px] text-[#1d2129] select-none hover:text-[#2f54eb]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        handleToggleModule(mod);
                        if (errors.modules) setErrors({ ...errors, modules: undefined });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#2f54eb] focus:ring-0 cursor-pointer accent-[#2f54eb]"
                    />
                    <span className="truncate" title={mod}>
                      {mod}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.modules && <p className="text-[12px] text-[#f53f3f]">{errors.modules}</p>}
          </div>

          {/* 套餐状态 * */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[13px] font-normal text-[#1d2129]">
              套餐状态 <span className="text-[#f53f3f]">*</span>
            </label>
            <div className="flex items-center gap-6 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#1d2129] select-none">
                <input
                  type="radio"
                  name="packageStatus"
                  value="正常"
                  checked={status === '正常'}
                  onChange={() => setStatus('正常')}
                  className="w-4 h-4 text-[#2f54eb] focus:ring-0 cursor-pointer accent-[#2f54eb]"
                />
                <span>正常</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#1d2129] select-none">
                <input
                  type="radio"
                  name="packageStatus"
                  value="禁用"
                  checked={status === '禁用'}
                  onChange={() => setStatus('禁用')}
                  className="w-4 h-4 text-[#2f54eb] focus:ring-0 cursor-pointer accent-[#2f54eb]"
                />
                <span>禁用</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer with Cancel & Confirm */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#f0f0f0] bg-white">
          <button
            type="button"
            id="package-cancel-btn"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] border border-[#d9d9d9] text-[#4e5969] rounded-[4px] hover:bg-[#f2f3f5] hover:text-[#1d2129] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            id="package-confirm-btn"
            onClick={handleSubmit}
            className="px-4 py-1.5 text-[13px] bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-medium rounded-[4px] transition-colors cursor-pointer shadow-sm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
