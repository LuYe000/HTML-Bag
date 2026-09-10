import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { AppItem } from '../types';

const CATEGORY_OPTIONS = ['文档比对'];
const BUSINESS_CATEGORIES = ['合规业务'];
const COMPANY_TYPES = ['证券', '银行', '基金', '保险', '信托', '期货'];
const ALL_CUSTOMERS = ['国泰君安', '中信证券', '华泰证券', '招商证券', '海通证券', '申万宏源', '广发证券'];

interface AppFormFieldValues {
  name: string;
  category: string;
  businessCategory: string;
  desc: string;
  companyType: string;
  iconName: string;
}

interface AppFormFieldsProps {
  values: AppFormFieldValues;
  disabled?: boolean;
  categoryDisabled?: boolean;
  error?: string;
  onNameChange?: (value: string) => void;
  onBusinessCategoryChange?: (value: string) => void;
  onDescChange?: (value: string) => void;
  onCompanyTypeChange?: (value: string) => void;
  onIconChange?: (name: string) => void;
}

const AppFormFields: React.FC<AppFormFieldsProps> = ({
  values,
  disabled = false,
  categoryDisabled = false,
  error,
  onNameChange,
  onBusinessCategoryChange,
  onDescChange,
  onCompanyTypeChange,
  onIconChange,
}) => {
  const inputClass = `w-full h-[36px] px-3.5 border rounded-md text-[13.5px] focus:outline-none transition-colors ${
    disabled
      ? 'bg-[#f7f8fa] border-[#e5e6eb] text-[#86909c] cursor-not-allowed'
      : 'text-[#1d2129] placeholder-[#86909c] border-[#e5e6eb] focus:border-[#2f54eb] focus:ring-2 focus:ring-[#2f54eb]/15'
  }`;

  return (
    <div className="space-y-4 text-[13.5px]">
      <div className="space-y-1.5">
        <label className="block text-[#1d2129] font-medium">
          应用名称<span className="text-[#f53f3f] ml-0.5">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          disabled={disabled}
          onChange={(e) => onNameChange?.(e.target.value)}
          placeholder="请输入"
          className={`${inputClass} ${
            error && !disabled ? 'border-[#f53f3f] focus:border-[#f53f3f]' : ''
          }`}
        />
        {error && !disabled && (
          <p className="text-[#f53f3f] text-xs mt-1">{error}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[#1d2129] font-medium">
          应用类别<span className="text-[#f53f3f] ml-0.5">*</span>
        </label>
        <CustomSelect
          value={values.category}
          disabled={disabled || categoryDisabled}
          onChange={() => {}}
          options={CATEGORY_OPTIONS}
          placeholder="请选择"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[#1d2129] font-medium">业务分类</label>
        <CustomSelect
          value={values.businessCategory}
          disabled={disabled}
          onChange={(value) => onBusinessCategoryChange?.(value)}
          options={BUSINESS_CATEGORIES}
          placeholder="请选择"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[#1d2129] font-medium">应用说明</label>
        <textarea
          rows={3}
          value={values.desc}
          disabled={disabled}
          onChange={(e) => onDescChange?.(e.target.value)}
          placeholder="请输入"
          className={`w-full px-3.5 py-2 border rounded-md text-[13.5px] resize-y min-h-[76px] focus:outline-none transition-colors ${
            disabled
              ? 'bg-[#f7f8fa] border-[#e5e6eb] text-[#86909c] cursor-not-allowed'
              : 'text-[#1d2129] placeholder-[#86909c] border-[#e5e6eb] focus:border-[#2f54eb] focus:ring-2 focus:ring-[#2f54eb]/15'
          }`}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[#1d2129] font-medium">公司类型</label>
        <CustomSelect
          value={values.companyType}
          disabled={disabled}
          onChange={(value) => onCompanyTypeChange?.(value)}
          options={COMPANY_TYPES}
          placeholder="请选择"
        />
      </div>

      <div className="space-y-1.5 pb-1">
        <label className="block text-[#1d2129] font-medium">应用图标</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = () => {
                  if (input.files && input.files[0]) {
                    onIconChange?.(input.files[0].name);
                  }
                };
                input.click();
              }
            }}
            className={`h-[34px] px-4 border rounded-md text-[13px] flex items-center justify-center transition-colors ${
              disabled
                ? 'bg-[#f7f8fa] border-[#e5e6eb] text-[#86909c] cursor-not-allowed'
                : 'bg-white hover:bg-[#f7f8fa] border-[#e5e6eb] text-[#1d2129] cursor-pointer'
            }`}
          >
            {values.iconName ? '已选择图标' : '上传图标'}
          </button>
          {values.iconName && (
            <span className="text-xs text-[#86909c] truncate max-w-[240px]">
              {values.iconName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 查看详情弹窗 ---
interface ViewAppModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewAppModal: React.FC<ViewAppModalProps> = ({ app, isOpen, onClose }) => {
  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="relative w-full max-w-[500px] bg-white rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#f2f3f5]">
          <h2 className="text-[17px] font-semibold text-[#1d2129]">应用详情</h2>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <AppFormFields
            disabled
            values={{
              name: app.name,
              category: app.category || '文档比对',
              businessCategory: '合规业务',
              desc: app.desc === '-' ? '' : app.desc,
              companyType: app.companyType || '',
              iconName: app.icon || '',
            }}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-[#f2f3f5]">
          <button
            onClick={onClose}
            className="h-[34px] px-5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 编辑应用弹窗 ---
interface EditAppModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedApp: AppItem) => void;
}

export const EditAppModal: React.FC<EditAppModalProps> = ({ app, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('文档比对');
  const [businessCategory, setBusinessCategory] = useState('合规业务');
  const [desc, setDesc] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [iconName, setIconName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (app) {
      setName(app.name);
      setCategory(app.category || '文档比对');
      setBusinessCategory('合规业务');
      setDesc(app.desc === '-' ? '' : app.desc);
      setCompanyType(app.companyType || '');
      setIconName(app.icon || '');
      setError('');
    }
  }, [app, isOpen]);

  if (!isOpen || !app) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入应用名称');
      return;
    }
    onSave({
      ...app,
      name: name.trim(),
      category,
      businessCategory: businessCategory || '合规业务',
      companyType: companyType || undefined,
      desc: desc.trim() || '-',
      icon: iconName || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 overflow-y-auto">
      <div className="relative w-full max-w-[540px] bg-white rounded-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#f2f3f5]">
          <h2 className="text-[17px] font-semibold text-[#1d2129]">编辑应用</h2>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 text-[13.5px]">
          <AppFormFields
            categoryDisabled
            error={error}
            values={{
              name,
              category,
              businessCategory,
              desc,
              companyType,
              iconName,
            }}
            onNameChange={(value) => {
              setName(value);
              if (error) setError('');
            }}
            onBusinessCategoryChange={setBusinessCategory}
            onDescChange={setDesc}
            onCompanyTypeChange={setCompanyType}
            onIconChange={setIconName}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f2f3f5] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] px-5 border border-[#e5e6eb] bg-white hover:bg-[#f7f8fa] text-[13.5px] text-[#4e5969] rounded-[4px] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="h-[34px] px-5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 客户配置弹窗 ---
interface CustomerConfigModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appId: string, assignedCustomers: string[]) => void;
}

export const CustomerConfigModal: React.FC<CustomerConfigModalProps> = ({
  app,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [isAll, setIsAll] = useState(true);

  useEffect(() => {
    if (app) {
      if (app.customer === '全部' || !app.customer) {
        setIsAll(true);
        setSelected(ALL_CUSTOMERS);
      } else {
        setIsAll(false);
        setSelected([app.customer]);
      }
    }
  }, [app, isOpen]);

  if (!isOpen || !app) return null;

  const toggleCustomer = (cust: string) => {
    if (isAll) {
      setIsAll(false);
      setSelected([cust]);
      return;
    }
    if (selected.includes(cust)) {
      const next = selected.filter((c) => c !== cust);
      setSelected(next);
      if (next.length === 0) setIsAll(false);
    } else {
      const next = [...selected, cust];
      setSelected(next);
      if (next.length === ALL_CUSTOMERS.length) setIsAll(true);
    }
  };

  const handleToggleAll = () => {
    if (isAll) {
      setIsAll(false);
      setSelected([]);
    } else {
      setIsAll(true);
      setSelected(ALL_CUSTOMERS);
    }
  };

  const handleSubmit = () => {
    onSave(app.id, isAll ? ['全部'] : selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="relative w-full max-w-[500px] bg-white rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#f2f3f5]">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1d2129]">客户配置</h2>
            <p className="text-xs text-[#86909c] mt-0.5">为「{app.name}」授权可使用的客户范围</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={handleToggleAll}
              className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                isAll
                  ? 'bg-[#2f54eb] border-[#2f54eb] text-white'
                  : 'border-[#c9cdd4] bg-white hover:border-[#2f54eb]'
              }`}
            >
              {isAll && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="text-[13.5px] font-medium text-[#1d2129]">全选 (全部客户可见)</span>
          </label>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#f2f3f5]">
            {ALL_CUSTOMERS.map((cust) => {
              const checked = isAll || selected.includes(cust);
              return (
                <label
                  key={cust}
                  onClick={() => toggleCustomer(cust)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f7f8fa] cursor-pointer select-none transition-colors border border-transparent hover:border-[#e5e6eb]"
                >
                  <div
                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                      checked
                        ? 'bg-[#2f54eb] border-[#2f54eb] text-white'
                        : 'border-[#c9cdd4] bg-white hover:border-[#2f54eb]'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[13px] text-[#1d2129]">{cust}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f2f3f5]">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-5 border border-[#e5e6eb] bg-white hover:bg-[#f7f8fa] text-[13.5px] text-[#4e5969] rounded-[4px] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-[34px] px-5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-medium"
          >
            确认配置
          </button>
        </div>
      </div>
    </div>
  );
};
