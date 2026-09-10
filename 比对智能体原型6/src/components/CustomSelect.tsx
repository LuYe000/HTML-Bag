import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | Option)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  preferredPlacement?: 'auto' | 'bottom' | 'top';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Box */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full h-[36px] px-3.5 flex items-center justify-between border rounded-md text-[13.5px] transition-all cursor-pointer bg-white ${
          disabled
            ? 'bg-[#f7f8fa] text-[#86909c] cursor-not-allowed border-[#e5e6eb]'
            : isOpen
            ? 'border-[#2f54eb] ring-2 ring-[#2f54eb]/15 text-[#1d2129]'
            : 'border-[#e5e6eb] hover:border-[#c9cdd4] text-[#1d2129]'
        }`}
      >
        <span
          className={`truncate select-none ${
            selectedOption
              ? disabled
                ? 'text-[#86909c]'
                : 'text-[#1d2129]'
              : 'text-[#86909c]'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#86909c] transition-transform duration-150 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#2f54eb]' : ''
          }`}
        />
      </button>

      {/* Floating Options Panel (Opens downwards below trigger) */}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white border border-[#e5e6eb] rounded-lg py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-[#86909c] text-center">
              暂无选项
            </div>
          ) : (
            normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-3.5 py-2.5 mx-1 rounded-md text-[13.5px] cursor-pointer transition-colors flex items-center justify-between select-none ${
                    isSelected
                      ? 'bg-[#f2f3f5] text-[#1d2129] font-medium'
                      : 'text-[#1d2129] hover:bg-[#f7f8fa]'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
