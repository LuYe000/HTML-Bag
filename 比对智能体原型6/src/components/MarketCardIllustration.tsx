import React from 'react';

interface IllustrationProps {
  type: 'pdf_chart' | 'justice_scale' | 'credit_rating';
}

export const MarketCardIllustration: React.FC<IllustrationProps> = ({ type }) => {
  if (type === 'pdf_chart') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#ebf3ff] via-[#e3edff] to-[#d6e4ff] relative overflow-hidden flex items-center justify-center p-3 select-none">
        {/* Background ambient lighting */}
        <div className="absolute w-36 h-36 rounded-full bg-white/60 blur-xl -top-6 -left-6" />
        <div className="absolute w-28 h-28 rounded-full bg-[#3b82f6]/20 blur-lg -bottom-4 -right-4" />

        {/* 3D Glass Document Card */}
        <div className="relative w-[130px] h-[92px] bg-white/90 backdrop-blur-sm rounded-[8px] shadow-[0_8px_20px_rgba(59,130,246,0.18)] border border-white flex flex-col p-2.5 transform -rotate-1 group-hover:scale-105 transition-transform duration-300">
          {/* Document Header with PDF Tag */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-black tracking-wider text-[#2f54eb] italic drop-shadow-sm">
              PDF
            </span>
            <div className="w-5 h-1.5 bg-[#e0ebff] rounded-full" />
          </div>

          {/* Mini Chart Graph inside Doc */}
          <div className="w-full flex-1 bg-gradient-to-b from-[#f4f8ff] to-[#eaf2ff] rounded-[4px] p-1.5 relative flex flex-col justify-end overflow-hidden border border-[#dce8ff]">
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-2 h-[1px] bg-[#dbe8ff]" />
            <div className="absolute inset-x-0 top-5 h-[1px] bg-[#dbe8ff]" />

            {/* Blue Trend Line */}
            <svg className="w-full h-7 absolute bottom-1 left-0 right-0" viewBox="0 0 100 35" preserveAspectRatio="none">
              <path
                d="M0,28 Q25,8 50,18 T100,5"
                fill="none"
                stroke="#2f54eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="18" r="2.5" fill="#2f54eb" />
              <circle cx="100" cy="5" r="2.5" fill="#1677ff" />
            </svg>
          </div>

          {/* Folded Top Corner aesthetic */}
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-gradient-to-bl from-[#b8d5ff] to-[#79aeff] rounded-bl-[4px]" />
        </div>

        {/* 3D Fountain Pen */}
        <div className="absolute bottom-2 left-6 transform -rotate-45 drop-shadow-[0_6px_10px_rgba(30,58,138,0.3)]">
          {/* Pen body */}
          <div className="w-4 h-18 bg-gradient-to-r from-[#1d39c4] via-[#2f54eb] to-[#1e40af] rounded-t-full relative shadow-inner">
            {/* Silver Clip */}
            <div className="absolute top-1 right-0.5 w-1 h-8 bg-gradient-to-b from-white via-slate-200 to-slate-400 rounded-full shadow" />
            {/* Silver Ring */}
            <div className="absolute bottom-3 inset-x-0 h-1 bg-gradient-to-r from-slate-100 via-white to-slate-300" />
          </div>
          {/* Nib */}
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-slate-300 -mt-[1px] mx-auto filter drop-shadow" />
        </div>
      </div>
    );
  }

  if (type === 'justice_scale') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#ebf3ff] via-[#e3edff] to-[#d6e4ff] relative overflow-hidden flex items-center justify-center p-3 select-none">
        {/* Ambient lighting */}
        <div className="absolute w-36 h-36 rounded-full bg-white/60 blur-xl -top-6 -right-6" />
        <div className="absolute w-28 h-28 rounded-full bg-[#1677ff]/15 blur-lg -bottom-4 -left-4" />

        {/* Background "监管文件" Card */}
        <div className="absolute left-6 top-3 w-[100px] h-[78px] bg-white/95 rounded-[6px] shadow-[0_4px_16px_rgba(22,119,255,0.12)] border border-white p-2 flex flex-col transform -rotate-3">
          <div className="text-[10px] font-bold text-[#1d2129] mb-1 tracking-tight text-center bg-[#f0f5ff] py-0.5 rounded text-[#2f54eb]">
            监管文件
          </div>
          <div className="space-y-1 mt-0.5">
            <div className="h-1 bg-[#e5eefc] rounded-full w-full" />
            <div className="h-1 bg-[#e5eefc] rounded-full w-4/5" />
            <div className="h-1 bg-[#e5eefc] rounded-full w-3/5" />
          </div>
          <div className="mt-auto grid grid-cols-3 gap-0.5 pt-1 border-t border-[#f0f4ff]">
            <div className="h-2 bg-[#dce8ff] rounded-[1px]" />
            <div className="h-2 bg-[#dce8ff] rounded-[1px]" />
            <div className="h-2 bg-[#dce8ff] rounded-[1px]" />
          </div>
        </div>

        {/* 3D Justice Scale (⚖️) */}
        <div className="relative z-10 w-[110px] h-[86px] flex flex-col items-center justify-end -mr-10 -mb-1">
          {/* Scales top crossbeam */}
          <div className="relative w-20 h-1.5 bg-gradient-to-r from-[#2f54eb] via-[#597ef7] to-[#2f54eb] rounded-full shadow-md">
            {/* Center Finial */}
            <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#85a5ff] to-[#2f54eb] shadow" />

            {/* Left Pan */}
            <div className="absolute left-1 top-1 flex flex-col items-center">
              <div className="w-[1px] h-5 bg-[#85a5ff]" />
              <div className="w-6 h-2 bg-gradient-to-b from-[#2f54eb] to-[#1d39c4] rounded-b-full shadow-md border-t border-[#85a5ff]/40" />
            </div>

            {/* Right Pan */}
            <div className="absolute right-1 top-1 flex flex-col items-center">
              <div className="w-[1px] h-6 bg-[#85a5ff]" />
              <div className="w-6 h-2 bg-gradient-to-b from-[#2f54eb] to-[#1d39c4] rounded-b-full shadow-md border-t border-[#85a5ff]/40" />
            </div>
          </div>

          {/* Central Pillar */}
          <div className="w-1.5 h-11 bg-gradient-to-b from-[#597ef7] via-[#2f54eb] to-[#1d39c4] shadow-sm -mt-0.5" />

          {/* 3D Base Pedestal */}
          <div className="w-12 h-3.5 bg-gradient-to-b from-[#d6e4ff] via-[#85a5ff] to-[#2f54eb] rounded-t-lg shadow-lg border-t border-white/60 flex items-center justify-center">
            <div className="w-8 h-1 bg-[#1d39c4]/30 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // credit_rating / folder with siren
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#e8f1ff] via-[#e2edff] to-[#d8e7ff] relative overflow-hidden flex items-center justify-center p-3 select-none">
      <div className="absolute w-36 h-36 rounded-full bg-white/60 blur-xl -top-6 -left-6" />
      <div className="absolute w-28 h-28 rounded-full bg-[#165dff]/15 blur-lg -bottom-4 -right-4" />

      {/* 3D Translucent Blue Folder with Document */}
      <div className="relative w-[130px] h-[92px] flex items-center justify-center">
        {/* Document sticking out */}
        <div className="absolute -top-1.5 w-[85px] h-[75px] bg-white rounded-[6px] shadow-[0_4px_12px_rgba(22,93,255,0.14)] border border-white p-1.5 flex flex-col z-0">
          <div className="text-[9px] font-bold text-[#1d2129] text-center bg-[#f0f5ff] py-0.5 rounded text-[#2f54eb] mb-1">
            信用评级
          </div>
          <div className="space-y-1 mt-0.5">
            <div className="h-1 bg-[#e5eefc] rounded-full w-full" />
            <div className="h-1 bg-[#e5eefc] rounded-full w-4/5" />
            <div className="h-1 bg-[#e5eefc] rounded-full w-3/5" />
          </div>
          <div className="mt-auto grid grid-cols-2 gap-1 pt-1 border-t border-[#f0f4ff]">
            <div className="h-2 bg-[#dce8ff] rounded-[1px]" />
            <div className="h-2 bg-[#dce8ff] rounded-[1px]" />
          </div>
        </div>

        {/* Translucent Glass Front Folder Pocket */}
        <div className="absolute inset-x-1 bottom-0 h-[64px] bg-gradient-to-tr from-[#3884ff]/80 via-[#69a0ff]/60 to-[#a3c9ff]/70 backdrop-blur-md rounded-[8px] border border-white/60 shadow-[0_8px_20px_rgba(22,93,255,0.22)] z-10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        </div>

        {/* 3D Glowing Blue Siren / Alarm Light on lower left */}
        <div className="absolute -bottom-1 -left-2 z-20 flex flex-col items-center">
          {/* Blue Glass Dome */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#79b8ff] via-[#2f7bf7] to-[#165dff] shadow-[0_4px_12px_rgba(22,93,255,0.4)] border border-white/70 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1 left-2 w-2.5 h-1.5 rounded-full bg-white/80 blur-[0.5px]" />
            <div className="w-3.5 h-3.5 rounded-full bg-white/40 blur-[1px]" />
          </div>
          {/* Siren Base */}
          <div className="w-9 h-2 bg-gradient-to-b from-[#1d39c4] to-[#0c2482] rounded-b-md -mt-1 shadow" />
        </div>
      </div>
    </div>
  );
};
