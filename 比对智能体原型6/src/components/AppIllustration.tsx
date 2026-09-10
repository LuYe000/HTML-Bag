import React from 'react';

export const AppIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-[126px] bg-gradient-to-b from-[#eaf2ff] via-[#f1f6ff] to-[#e4eefd] overflow-hidden flex items-center justify-center select-none ${className}`}>
      {/* Background soft lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent pointer-events-none" />

      <svg
        viewBox="0 0 280 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%] object-contain drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f5ff" />
          </linearGradient>
          <linearGradient id="pieGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="pieGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#1e3a8a" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 3D Paper Sheet */}
        <g filter="url(#shadow3d)" transform="translate(45, 18)">
          {/* Back Paper */}
          <rect
            x="0"
            y="0"
            width="88"
            height="100"
            rx="6"
            fill="url(#sheetGrad)"
            stroke="#dbeafe"
            strokeWidth="1.5"
          />

          {/* Badge: ¥ 财务报表 */}
          <rect x="8" y="10" width="62" height="15" rx="3.5" fill="#2563eb" />
          <text
            x="39"
            y="21"
            fill="#ffffff"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ¥ 财务报表
          </text>

          {/* Document Content Lines / Bars */}
          <rect x="8" y="32" width="14" height="42" rx="3" fill="url(#barGrad1)" />
          <rect x="26" y="44" width="14" height="30" rx="3" fill="url(#barGrad2)" />
          <rect x="44" y="24" width="14" height="50" rx="3" fill="url(#barGrad1)" />
          <rect x="62" y="38" width="14" height="36" rx="3" fill="url(#barGrad2)" />

          {/* Bottom baseline */}
          <rect x="8" y="82" width="68" height="4" rx="2" fill="#bfdbfe" />
        </g>

        {/* 3D Pie Chart Right Side */}
        <g filter="url(#shadow3d)" transform="translate(160, 52)">
          {/* Bottom Shadow / 3D Extrusion */}
          <path
            d="M 45 42 L 45 52 A 38 20 0 0 1 5 36 L 5 26 Z"
            fill="#1e40af"
          />
          <path
            d="M 50 38 L 50 48 A 38 20 0 0 1 25 54 L 25 44 Z"
            fill="#1d4ed8"
          />

          {/* Sliced 3D Pie Top Surface */}
          <ellipse cx="40" cy="30" rx="36" ry="18" fill="url(#pieGrad1)" />

          {/* Raised 3D Wedge */}
          <path
            d="M 40 30 L 72 26 A 36 18 0 0 0 40 12 Z"
            fill="#93c5fd"
          />
          <path
            d="M 40 30 L 12 36 A 36 18 0 0 0 40 48 L 40 30 Z"
            fill="url(#pieGrad2)"
          />

          {/* Floating small cylinder/disk */}
          <ellipse cx="15" cy="58" rx="14" ry="7" fill="#60a5fa" />
          <path d="M 1 58 L 1 63 A 14 7 0 0 0 29 63 L 29 58 Z" fill="#2563eb" />
          <ellipse cx="15" cy="58" rx="14" ry="7" fill="#93c5fd" />
        </g>
      </svg>
    </div>
  );
};
