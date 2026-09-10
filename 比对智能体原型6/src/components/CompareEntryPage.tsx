import React from 'react';
import { AppWindow, Sliders, LayoutTemplate, Plus, ArrowRight } from 'lucide-react';

interface EntryPageProps {
  type: 'app' | 'rule' | 'layout';
  onNavigate?: (type: 'app' | 'rule' | 'layout') => void;
}

const CONFIG = {
  app: {
    title: '应用管理',
    desc: '管理比对智能体相关的业务应用、接入配置以及应用授权信息。',
    icon: AppWindow,
    btnText: '创建比对应用',
    features: [
      { name: '文本比对应用', desc: '支持多版本合同、政策公文及条款内容智能比对与高亮查重' },
      { name: '表格与版面比对', desc: '跨页跨表复杂版面数据对其比对与差异分析' },
      { name: 'API 接口集成', desc: '提供开放的标准 RESTful 比对与结果抽取接口' },
    ],
  },
  rule: {
    title: '规则配置',
    desc: '自定义比对规则、相似度阈值、忽略项与专业行业敏感校验模板。',
    icon: Sliders,
    btnText: '添加比对规则',
    features: [
      { name: '段落级比对规则', desc: '针对段落顺序调换、字词增删改与语义同义替换识别' },
      { name: '格式过滤规则', desc: '忽略特定标点符号、空格空白与页眉页脚干扰' },
      { name: '打分与权重配置', desc: '定制不同维度字段差异对最终风险评分的影响权重' },
    ],
  },
  layout: {
    title: '版面管理',
    desc: '管理复杂版面解析模型、页眉页脚模板及多模态文档结构识别配置。',
    icon: LayoutTemplate,
    btnText: '新建版面模板',
    features: [
      { name: '版面元素识别', desc: '正文、标题、印章、批注及手写签名的区域划分' },
      { name: '跨页表格合并', desc: '多页连续表格自动对齐拼接与结构解析' },
      { name: '文档模板匹配', desc: '常见业务合同及申报材料固定格式模版绑定' },
    ],
  },
};

export const CompareEntryPage: React.FC<EntryPageProps> = ({ type }) => {
  const info = CONFIG[type];
  const Icon = info.icon;

  return (
    <div className="p-6 max-w-5xl">
      {/* Overview Card */}
      <div className="bg-white rounded-lg border border-[#e5e6eb] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#e9f0fe] text-[#2f54eb] flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-[#1d2129]">{info.title}</h2>
                <span className="px-2 py-0.5 text-xs rounded bg-[#f0f5ff] text-[#2f54eb] font-normal border border-[#d6e4ff]">
                  功能入口
                </span>
              </div>
              <p className="text-[13.5px] text-[#86909c] mt-1">{info.desc}</p>
            </div>
          </div>

          <button
            id={`create-${type}-btn`}
            className="h-[34px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{info.btnText}</span>
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {info.features.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-[#e5e6eb] p-5 hover:border-[#2f54eb] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[14px] text-[#1d2129] group-hover:text-[#2f54eb] transition-colors">
                {f.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-[#86909c] group-hover:text-[#2f54eb] transition-colors" />
            </div>
            <p className="text-[13px] text-[#86909c] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
