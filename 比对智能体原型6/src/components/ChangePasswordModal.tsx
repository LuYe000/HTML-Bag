import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!oldPassword.trim()) {
      setErrorMsg('请输入原密码');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMsg('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('两次输入的新密码不一致');
      return;
    }

    setToastMsg('密码修改成功');
    setTimeout(() => {
      setToastMsg('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
      <div className="relative w-full max-w-[420px] bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f2f3f5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f0f5ff] text-[#2f54eb] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#1d2129]">修改密码</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#86909c] hover:text-[#1d2129] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="mt-3 p-2.5 bg-[#e8ffea] border border-[#aff0b5] text-[#00b42a] text-[13px] rounded flex items-center justify-center animate-in fade-in">
            {toastMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="text-xs text-[#f53f3f] bg-[#ffece8] border border-[#ffccc7] px-3 py-2 rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#4e5969] mb-1.5">
              <span className="text-[#f53f3f] mr-1">*</span>原密码
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className="w-full h-[34px] px-3 pr-9 border border-[#d9d9d9] focus:border-[#2f54eb] focus:shadow-[0_0_0_2px_rgba(47,84,235,0.1)] rounded-[4px] text-[13px] text-[#1d2129] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-2.5 top-2 text-[#86909c] hover:text-[#1d2129] cursor-pointer"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4e5969] mb-1.5">
              <span className="text-[#f53f3f] mr-1">*</span>新密码
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（不少于6位）"
                className="w-full h-[34px] px-3 pr-9 border border-[#d9d9d9] focus:border-[#2f54eb] focus:shadow-[0_0_0_2px_rgba(47,84,235,0.1)] rounded-[4px] text-[13px] text-[#1d2129] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2 text-[#86909c] hover:text-[#1d2129] cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4e5969] mb-1.5">
              <span className="text-[#f53f3f] mr-1">*</span>确认新密码
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full h-[34px] px-3 pr-9 border border-[#d9d9d9] focus:border-[#2f54eb] focus:shadow-[0_0_0_2px_rgba(47,84,235,0.1)] rounded-[4px] text-[13px] text-[#1d2129] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-2 text-[#86909c] hover:text-[#1d2129] cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f2f3f5]">
            <button
              type="button"
              onClick={onClose}
              className="h-[32px] px-4 border border-[#d9d9d9] hover:border-[#adc6ff] bg-white hover:bg-[#fafbfc] text-[#1d2129] text-[13px] rounded-[4px] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="h-[32px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer shadow-sm"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
