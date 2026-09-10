import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { AppItem } from '../types';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (app: Omit<AppItem, 'id' | 'createDate'>) => void;
}

const CATEGORY_OPTIONS = ['文档比对'];

const BUSINESS_CATEGORIES = ['合规业务'];

const COMPANY_TYPES = ['证券', '银行', '基金', '保险', '信托', '期货'];

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('文档比对');
  const [businessCategory, setBusinessCategory] = useState('合规业务');
  const [desc, setDesc] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [iconName, setIconName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入应用名称');
      return;
    }

    onSubmit({
      name: name.trim(),
      category,
      auditMode: ['非全文审核'],
      businessCategory,
      desc: desc.trim() || '-',
      companyType: companyType || undefined,
      status: '内测中',
      icon: iconName || undefined,
    });

    // Reset
    setName('');
    setCategory('文档比对');
    setBusinessCategory('合规业务');
    setDesc('');
    setCompanyType('');
    setIconName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 overflow-y-auto">
      <div
        id="create-app-modal"
        className="relative w-full max-w-[540px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#f2f3f5]">
          <h2 className="text-[17px] font-semibold text-[#1d2129]">新建</h2>
          <button
            id="close-create-app-modal-btn"
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] transition-colors p-1 rounded hover:bg-[#f2f3f5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 text-[13.5px]">
          {/* 应用名称 * */}
          <div className="space-y-1.5">
            <label className="block text-[#1d2129] font-medium">
              应用名称<span className="text-[#f53f3f] ml-0.5">*</span>
            </label>
            <input
              id="app-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="请输入"
              className={`w-full h-[36px] px-3.5 border rounded-md text-[13.5px] text-[#1d2129] placeholder-[#86909c] focus:outline-none transition-colors ${
                error ? 'border-[#f53f3f] focus:border-[#f53f3f]' : 'border-[#e5e6eb] focus:border-[#2f54eb] focus:ring-2 focus:ring-[#2f54eb]/15'
              }`}
            />
            {error && <p className="text-[#f53f3f] text-xs mt-1">{error}</p>}
          </div>

          {/* 应用类别 * */}
          <div className="space-y-1.5">
            <label className="block text-[#1d2129] font-medium">
              应用类别<span className="text-[#f53f3f] ml-0.5">*</span>
            </label>
            <CustomSelect
              id="app-category-select"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              placeholder="请选择"
            />
          </div>

          {/* 业务分类 */}
          <div className="space-y-1.5">
            <label className="block text-[#1d2129] font-medium">业务分类</label>
            <CustomSelect
              id="app-business-category-select"
              value={businessCategory}
              onChange={setBusinessCategory}
              options={BUSINESS_CATEGORIES}
              placeholder="请选择"
            />
          </div>

          {/* 应用说明 */}
          <div className="space-y-1.5">
            <label className="block text-[#1d2129] font-medium">应用说明</label>
            <textarea
              id="app-desc-textarea"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="请输入"
              className="w-full px-3.5 py-2 border border-[#e5e6eb] rounded-md text-[13.5px] text-[#1d2129] placeholder-[#86909c] focus:outline-none focus:border-[#2f54eb] focus:ring-2 focus:ring-[#2f54eb]/15 resize-y min-h-[76px]"
            />
          </div>

          {/* 公司类型 */}
          <div className="space-y-1.5">
            <label className="block text-[#1d2129] font-medium">公司类型</label>
            <CustomSelect
              id="app-company-type-select"
              value={companyType}
              onChange={setCompanyType}
              options={COMPANY_TYPES}
              placeholder="请选择"
            />
          </div>

          {/* 应用图标 */}
          <div className="space-y-1.5 pb-1">
            <label className="block text-[#1d2129] font-medium">应用图标</label>
            <div className="flex items-center gap-3">
              <label className="h-[34px] px-4 border border-[#e5e6eb] bg-white hover:bg-[#f7f8fa] text-[13px] text-[#1d2129] rounded-md flex items-center justify-center cursor-pointer transition-colors">
                <span>{iconName ? '已选择图标' : '上传图标'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setIconName(e.target.files[0].name);
                    }
                  }}
                />
              </label>
              {iconName && (
                <span className="text-xs text-[#86909c] truncate max-w-[240px]">
                  {iconName}
                </span>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 pb-1 border-t border-[#f2f3f5] mt-6">
            <button
              id="cancel-create-app-btn"
              type="button"
              onClick={onClose}
              className="h-[34px] px-5 border border-[#e5e6eb] bg-white hover:bg-[#f7f8fa] text-[13.5px] text-[#1d2129] rounded-[4px] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              id="submit-create-app-btn"
              type="submit"
              className="h-[34px] px-5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer shadow-sm font-medium"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
