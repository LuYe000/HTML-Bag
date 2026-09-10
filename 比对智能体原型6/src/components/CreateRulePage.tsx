import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, HelpCircle, X, Info, Search } from 'lucide-react';
import { RuleItem } from './CompareRuleManagement';
import { LayoutTypeItem } from './CompareLayoutManagement';
import { INITIAL_SHARED_RULES, INITIAL_SHARED_LAYOUT_TYPES } from '../sharedCompareData';
import { loadCompareApps } from '../appConfigStore';

interface CreateRulePageProps {
  initialRule?: RuleItem | null;
  allAppNames?: string[];
  rulesList?: RuleItem[];
  layoutTypesList?: LayoutTypeItem[];
  readOnly?: boolean;
  onBack: () => void;
  onSuccess: (rule: RuleItem) => void;
}

export const CreateRulePage: React.FC<CreateRulePageProps> = ({
  initialRule,
  allAppNames = [],
  rulesList = INITIAL_SHARED_RULES,
  layoutTypesList = INITIAL_SHARED_LAYOUT_TYPES,
  readOnly = false,
  onBack,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Derive rule options from Rule Management List
  const availableRuleOptions = useMemo(() => {
    const list = rulesList.map((r) => r.name).filter(Boolean);
    const unique = Array.from(new Set(list));
    return [...unique, '不导入（新建空白规则）'];
  }, [rulesList]);

  // Derive template and compare doc options from Layout Management List
  const availableLayoutOptions = useMemo(() => {
    const list = layoutTypesList.map((l) => l.name).filter(Boolean);
    return Array.from(new Set(list));
  }, [layoutTypesList]);

  // Section 1: 基本信息
  const [ruleName, setRuleName] = useState(initialRule?.name || '');
  const [ruleDesc, setRuleDesc] = useState(initialRule?.desc || '');

  // 严格对标「应用管理」页面的应用列表
  const [appsFromStore, setAppsFromStore] = useState<string[]>(() => {
    try {
      const storeApps = loadCompareApps();
      if (storeApps && storeApps.length > 0) {
        return storeApps.map((a) => a.name);
      }
    } catch {
      // fallback
    }
    return [];
  });

  // 监听应用管理页面的更新事件（新增/修改/删除应用时实时同步）
  useEffect(() => {
    const handleAppsUpdate = () => {
      try {
        const storeApps = loadCompareApps();
        if (storeApps && storeApps.length > 0) {
          setAppsFromStore(storeApps.map((a) => a.name));
        }
      } catch (e) {
        console.error('Failed to sync compare apps in CreateRulePage', e);
      }
    };
    window.addEventListener('daguan_apps_updated', handleAppsUpdate);
    return () => {
      window.removeEventListener('daguan_apps_updated', handleAppsUpdate);
    };
  }, []);

  const availableAppOptions = useMemo(() => {
    let currentStoreApps: string[] = [];
    try {
      currentStoreApps = loadCompareApps().map((a) => a.name);
    } catch {
      currentStoreApps = [];
    }

    const baseList = appsFromStore.length > 0 ? appsFromStore : currentStoreApps;
    // 如果编辑历史规则携带的应用不在当前列表，也保全展示
    const extra = initialRule?.appName && !baseList.includes(initialRule.appName)
      ? [initialRule.appName]
      : [];

    return Array.from(new Set([...baseList, ...extra])).filter(Boolean);
  }, [appsFromStore, initialRule]);

  const [associatedApp, setAssociatedApp] = useState(
    initialRule?.appName || availableAppOptions[0] || '比对'
  );
  const [associatedAppOpen, setAssociatedAppOpen] = useState(false);
  const [associatedAppSearch, setAssociatedAppSearch] = useState('');
  const associatedAppRef = useRef<HTMLDivElement>(null);

  const [importRule, setImportRule] = useState('');
  const [importRuleOpen, setImportRuleOpen] = useState(false);
  const [importRuleSearch, setImportRuleSearch] = useState('');
  const importRuleRef = useRef<HTMLDivElement>(null);

  const filteredAppOptions = useMemo(() => {
    if (!associatedAppSearch.trim()) return availableAppOptions;
    return availableAppOptions.filter((app) =>
      app.toLowerCase().includes(associatedAppSearch.trim().toLowerCase())
    );
  }, [availableAppOptions, associatedAppSearch]);

  // Section 2: 版面类型配置 (模版文件 和 比对文件 来源于版面管理列表)
  const [templateDocType, setTemplateDocType] = useState(
    initialRule?.templateLayout || ''
  );
  const [templateDocTypeOpen, setTemplateDocTypeOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const templateDocRef = useRef<HTMLDivElement>(null);

  const [compareDocType, setCompareDocType] = useState(
    initialRule?.compareLayout || ''
  );
  const [compareDocTypeOpen, setCompareDocTypeOpen] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const compareDocRef = useRef<HTMLDivElement>(null);

  // Filtered dropdown lists based on optional search
  const filteredImportRules = useMemo(() => {
    if (!importRuleSearch.trim()) return availableRuleOptions;
    return availableRuleOptions.filter((r) =>
      r.toLowerCase().includes(importRuleSearch.trim().toLowerCase())
    );
  }, [availableRuleOptions, importRuleSearch]);

  const filteredTemplateDocs = useMemo(() => {
    if (!templateSearch.trim()) return availableLayoutOptions;
    return availableLayoutOptions.filter((l) =>
      l.toLowerCase().includes(templateSearch.trim().toLowerCase())
    );
  }, [availableLayoutOptions, templateSearch]);

  const filteredCompareDocs = useMemo(() => {
    if (!compareSearch.trim()) return availableLayoutOptions;
    return availableLayoutOptions.filter((l) =>
      l.toLowerCase().includes(compareSearch.trim().toLowerCase())
    );
  }, [availableLayoutOptions, compareSearch]);

  // Section 3: 比对配置项
  const [compareType, setCompareType] = useState<string>(
    initialRule?.auditType === '不同文件比对' ? '不同文件比对' : '相同文件比对'
  );
  const [compareStrategy, setCompareStrategy] = useState<string>('全文比对');
  const [tableCompare, setTableCompare] = useState<boolean>(true);
  const [filterConfigs, setFilterConfigs] = useState<{ [key: string]: boolean }>({
    customChars: false,
    customSimilarWords: false,
    allPunctuations: false,
    headerFooter: false,
    tableOfContents: false,
    seals: false,
  });
  const [compareEnhance, setCompareEnhance] = useState<boolean>(true);

  // Modals & Tooltip Helpers
  const [showPunctuationModal, setShowPunctuationModal] = useState(false);
  const [showCompareConfigHelp, setShowCompareConfigHelp] = useState(false);

  // Step 2 Form States (Rule Configuration points)
  const [auditPoints, setAuditPoints] = useState([
    {
      id: 1,
      name: '甲方与乙方名称核对',
      extractField: '主体名称',
      logic: '精确匹配',
      level: '阻断',
    },
    {
      id: 2,
      name: '合同签署日期有效性校验',
      extractField: '签署日期',
      logic: '日期范围核对',
      level: '告警',
    },
    {
      id: 3,
      name: '交易金额大写与小写一致性',
      extractField: '金额',
      logic: '数值一致性校验',
      level: '阻断',
    },
  ]);

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        associatedAppRef.current &&
        !associatedAppRef.current.contains(e.target as Node)
      ) {
        setAssociatedAppOpen(false);
      }
      if (
        importRuleRef.current &&
        !importRuleRef.current.contains(e.target as Node)
      ) {
        setImportRuleOpen(false);
      }
      if (
        templateDocRef.current &&
        !templateDocRef.current.contains(e.target as Node)
      ) {
        setTemplateDocTypeOpen(false);
      }
      if (
        compareDocRef.current &&
        !compareDocRef.current.contains(e.target as Node)
      ) {
        setCompareDocTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFilterConfig = (key: string) => {
    setFilterConfigs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFinish = () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

    const nextId = initialRule
      ? initialRule.id
      : String(Math.max(...rulesList.map((r) => Number(r.id) || 0), 0) + 1);

    const newRule: RuleItem = {
      id: nextId,
      name: ruleName.trim(),
      desc: ruleDesc.trim(),
      appName: associatedApp.trim() || availableAppOptions[0] || '比对',
      auditType: compareType,
      auditPointsCount: initialRule ? initialRule.auditPointsCount : 0,
      templateLayout: templateDocType,
      compareLayout: compareDocType,
      creator: initialRule ? initialRule.creator : 'admin',
      updateTime: timeStr,
    };

    onSuccess(newRule);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans text-[#1d2129] relative overflow-hidden select-none">
      {/* Main Form Content Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {currentStep === 1 ? (
          /* STEP 1: New Form matching exact screenshot layout */
          <div className="max-w-[1020px] mx-auto w-full space-y-8 pb-20">
            {/* 1. 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-[3.5px] h-[15px] bg-[#2f54eb] rounded-full" />
                <h3 className="text-[15px] font-semibold text-[#1d2129]">
                  基本信息
                </h3>
              </div>

              <div className="space-y-4 pl-3">
                {/* Row 1: 规则名称 + 导入规则 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* * 规则名称： */}
                  <div className="flex items-center gap-2">
                    <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[80px] text-right">
                      <span className="text-[#f53f3f] mr-0.5">*</span>规则名称：
                    </label>
                    <div className="flex-1">
                      <input
                        type="text"
                        maxLength={50}
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="仅支持常见中英文字符和常见符号，最长 50 个字符"
                        className="w-full h-[36px] px-3 border border-[#d9d9d9] hover:border-[#b0b4be] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] placeholder:text-[#a5abb6] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 导入规则： */}
                  <div className="flex items-center gap-2">
                    <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[80px] text-right">
                      导入规则：
                    </label>
                    <div ref={importRuleRef} className="relative flex-1">
                      <div
                        onClick={() => setImportRuleOpen(!importRuleOpen)}
                        className={`w-full h-[36px] px-3 border rounded-[4px] flex items-center justify-between text-[13px] bg-white cursor-pointer transition-colors ${
                          importRuleOpen
                            ? 'border-[#2f54eb] shadow-[0_0_0_2px_rgba(47,84,235,0.1)]'
                            : 'border-[#d9d9d9] hover:border-[#b0b4be]'
                        }`}
                      >
                        <span
                          className={
                            importRule ? 'text-[#1d2129]' : 'text-[#a5abb6]'
                          }
                        >
                          {importRule || '请选择导入规则'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#86909c] transition-transform ${
                            importRuleOpen ? 'rotate-180 text-[#2f54eb]' : ''
                          }`}
                        />
                      </div>

                      {importRuleOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[260px] overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-[#f0f1f4]">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={importRuleSearch}
                                onChange={(e) => setImportRuleSearch(e.target.value)}
                                placeholder="搜索规则名称..."
                                className="w-full h-[28px] pl-7 pr-2 border border-[#e5e6eb] rounded-[3px] text-[12px] text-[#1d2129] placeholder:text-[#a5abb6] focus:border-[#2f54eb] outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto py-1">
                            {filteredImportRules.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[12px] text-[#86909c]">
                                无匹配规则
                              </div>
                            ) : (
                              filteredImportRules.map((item) => (
                                <div
                                  key={item}
                                  onClick={() => {
                                    setImportRule(
                                      item === '不导入（新建空白规则）' ? '' : item
                                    );
                                    if (item !== '不导入（新建空白规则）') {
                                      setRuleDesc(`导入自【${item}】的默认比对逻辑策略`);
                                    }
                                    setImportRuleOpen(false);
                                    setImportRuleSearch('');
                                  }}
                                  className={`px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                                    importRule === item
                                      ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                                      : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                                  }`}
                                >
                                  <span className="truncate">{item}</span>
                                  {importRule === item && (
                                    <Check className="w-3.5 h-3.5 text-[#2f54eb] shrink-0" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: 规则说明 + 关联应用 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[80px] text-right">
                      规则说明：
                    </label>
                    <div className="flex-1">
                      <input
                        type="text"
                        maxLength={50}
                        value={ruleDesc}
                        onChange={(e) => setRuleDesc(e.target.value)}
                        placeholder="仅支持常见中英文字符和常见符号，最长 50 个字符"
                        className="w-full h-[36px] px-3 border border-[#d9d9d9] hover:border-[#b0b4be] focus:border-[#2f54eb] rounded-[4px] text-[13px] text-[#1d2129] placeholder:text-[#a5abb6] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 关联应用 * */}
                  <div className="flex items-center gap-2">
                    <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[80px] text-right">
                      <span className="text-[#f53f3f] mr-0.5">*</span>关联应用：
                    </label>
                    <div ref={associatedAppRef} className="relative flex-1">
                      <div
                        onClick={() => setAssociatedAppOpen(!associatedAppOpen)}
                        className={`w-full h-[36px] px-3 border rounded-[4px] flex items-center justify-between text-[13px] bg-white cursor-pointer transition-colors ${
                          associatedAppOpen
                            ? 'border-[#2f54eb] shadow-[0_0_0_2px_rgba(47,84,235,0.1)]'
                            : 'border-[#d9d9d9] hover:border-[#b0b4be]'
                        }`}
                      >
                        <span
                          className={
                            associatedApp ? 'text-[#1d2129]' : 'text-[#a5abb6]'
                          }
                        >
                          {associatedApp || '请选择关联应用'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#86909c] transition-transform ${
                            associatedAppOpen ? 'rotate-180 text-[#2f54eb]' : ''
                          }`}
                        />
                      </div>

                      {associatedAppOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[260px] overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-[#f0f1f4]">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={associatedAppSearch}
                                onChange={(e) => setAssociatedAppSearch(e.target.value)}
                                placeholder="搜索关联应用..."
                                className="w-full h-[28px] pl-7 pr-2 border border-[#e5e6eb] rounded-[3px] text-[12px] text-[#1d2129] placeholder:text-[#a5abb6] focus:border-[#2f54eb] outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto py-1">
                            {filteredAppOptions.length === 0 ? (
                              <div className="px-3 py-3 text-center text-[12px] text-[#86909c]">
                                无匹配应用
                              </div>
                            ) : (
                              filteredAppOptions.map((app) => (
                                <div
                                  key={app}
                                  onClick={() => {
                                    setAssociatedApp(app);
                                    setAssociatedAppOpen(false);
                                    setAssociatedAppSearch('');
                                  }}
                                  className={`px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                                    associatedApp === app
                                      ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                                      : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                                  }`}
                                >
                                  <span className="truncate">{app}</span>
                                  {associatedApp === app && (
                                    <Check className="w-3.5 h-3.5 text-[#2f54eb] shrink-0" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 版面类型配置 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-[3.5px] h-[15px] bg-[#2f54eb] rounded-full" />
                <h3 className="text-[15px] font-semibold text-[#1d2129]">
                  版面类型配置
                </h3>
              </div>

              {/* Slate Gray Container Box */}
              <div className="bg-[#f7f8fa] border border-[#f0f1f4] rounded-[6px] p-5">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* * 模板文件： */}
                  <div ref={templateDocRef} className="relative flex-1 w-full">
                    <div
                      onClick={() =>
                        setTemplateDocTypeOpen(!templateDocTypeOpen)
                      }
                      className={`w-full h-[38px] px-3 border rounded-[4px] flex items-center justify-between text-[13.5px] bg-white cursor-pointer transition-colors ${
                        templateDocTypeOpen
                          ? 'border-[#2f54eb] shadow-[0_0_0_2px_rgba(47,84,235,0.1)]'
                          : 'border-[#d9d9d9] hover:border-[#b0b4be]'
                      }`}
                    >
                      <div className="flex items-center gap-1 overflow-hidden">
                        <span className="text-[#f53f3f]">*</span>
                        <span className="text-[#4e5969]">模板文件：</span>
                        <span
                          className={
                            templateDocType ? 'text-[#1d2129]' : 'text-[#86909c]'
                          }
                        >
                          {templateDocType || '请选择版面类型'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#86909c] shrink-0 transition-transform ${
                          templateDocTypeOpen ? 'rotate-180 text-[#2f54eb]' : ''
                        }`}
                      />
                    </div>

                    {templateDocTypeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[260px] overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-[#f0f1f4]">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={templateSearch}
                              onChange={(e) => setTemplateSearch(e.target.value)}
                              placeholder="搜索版面类型..."
                              className="w-full h-[28px] pl-7 pr-2 border border-[#e5e6eb] rounded-[3px] text-[12px] text-[#1d2129] placeholder:text-[#a5abb6] focus:border-[#2f54eb] outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto py-1">
                          {filteredTemplateDocs.length === 0 ? (
                            <div className="px-3 py-3 text-center text-[12px] text-[#86909c]">
                              无匹配版面类型
                            </div>
                          ) : (
                            filteredTemplateDocs.map((item) => (
                              <div
                                key={item}
                                onClick={() => {
                                  setTemplateDocType(item);
                                  setTemplateDocTypeOpen(false);
                                  setTemplateSearch('');
                                }}
                                className={`px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                                  templateDocType === item
                                    ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                                    : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                                }`}
                              >
                                <span className="truncate">{item}</span>
                                {templateDocType === item && (
                                  <Check className="w-3.5 h-3.5 text-[#2f54eb] shrink-0" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VS Round Badge */}
                  <div className="shrink-0 w-[30px] h-[30px] rounded-full bg-[#e8edff] border border-[#cfdcfd] text-[#2f54eb] text-[12px] font-bold flex items-center justify-center shadow-xs">
                    VS
                  </div>

                  {/* * 比对文件： */}
                  <div ref={compareDocRef} className="relative flex-1 w-full">
                    <div
                      onClick={() => setCompareDocTypeOpen(!compareDocTypeOpen)}
                      className={`w-full h-[38px] px-3 border rounded-[4px] flex items-center justify-between text-[13.5px] bg-white cursor-pointer transition-colors ${
                        compareDocTypeOpen
                          ? 'border-[#2f54eb] shadow-[0_0_0_2px_rgba(47,84,235,0.1)]'
                          : 'border-[#d9d9d9] hover:border-[#b0b4be]'
                      }`}
                    >
                      <div className="flex items-center gap-1 overflow-hidden">
                        <span className="text-[#f53f3f]">*</span>
                        <span className="text-[#4e5969]">比对文件：</span>
                        <span
                          className={
                            compareDocType ? 'text-[#1d2129]' : 'text-[#86909c]'
                          }
                        >
                          {compareDocType || '请选择比对文件'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#86909c] shrink-0 transition-transform ${
                          compareDocTypeOpen ? 'rotate-180 text-[#2f54eb]' : ''
                        }`}
                      />
                    </div>

                    {compareDocTypeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 max-h-[260px] overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-[#f0f1f4]">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={compareSearch}
                              onChange={(e) => setCompareSearch(e.target.value)}
                              placeholder="搜索版面类型..."
                              className="w-full h-[28px] pl-7 pr-2 border border-[#e5e6eb] rounded-[3px] text-[12px] text-[#1d2129] placeholder:text-[#a5abb6] focus:border-[#2f54eb] outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto py-1">
                          {filteredCompareDocs.length === 0 ? (
                            <div className="px-3 py-3 text-center text-[12px] text-[#86909c]">
                              无匹配版面类型
                            </div>
                          ) : (
                            filteredCompareDocs.map((item) => (
                              <div
                                key={item}
                                onClick={() => {
                                  setCompareDocType(item);
                                  setCompareDocTypeOpen(false);
                                  setCompareSearch('');
                                }}
                                className={`px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center justify-between ${
                                  compareDocType === item
                                    ? 'bg-[#f0f4ff] text-[#2f54eb] font-medium'
                                    : 'hover:bg-[#f7f8fa] text-[#1d2129]'
                                }`}
                              >
                                <span className="truncate">{item}</span>
                                {compareDocType === item && (
                                  <Check className="w-3.5 h-3.5 text-[#2f54eb] shrink-0" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 比对配置项 */}
            <div className="space-y-5">
              <div className="flex items-center gap-1.5">
                <div className="w-[3.5px] h-[15px] bg-[#2f54eb] rounded-full" />
                <h3 className="text-[15px] font-semibold text-[#1d2129]">
                  比对配置项
                </h3>
                <div className="relative">
                  <HelpCircle
                    onClick={() =>
                      setShowCompareConfigHelp(!showCompareConfigHelp)
                    }
                    className="w-4 h-4 text-[#86909c] hover:text-[#2f54eb] cursor-pointer transition-colors"
                  />
                  {showCompareConfigHelp && (
                    <div className="absolute left-6 -top-2 w-[280px] bg-[#1d2129] text-white text-[12px] p-2.5 rounded shadow-lg z-30 leading-relaxed animate-in fade-in">
                      配置文档比对算法的精细度、段落忽略规则、表格单元格提取以及标点符号过滤等高级参数。
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 pl-3 text-[13.5px] text-[#1d2129]">
                {/* * 比对类型： (只区分两种：相同文件比对 / 不同文件比对) */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[90px] text-right">
                    <span className="text-[#f53f3f] mr-0.5">*</span>比对类型：
                  </label>
                  <div className="flex flex-wrap items-center gap-6">
                    {[
                      { type: '相同文件比对', desc: '适用于同类/版本间文档比对（如合同修改前后比对、版本迭代等）' },
                      { type: '不同文件比对', desc: '适用于不同文档交叉核验（如主附协议、登记证明与协议比对等）' },
                    ].map((item) => (
                      <label
                        key={item.type}
                        className="flex items-center gap-2 cursor-pointer select-none group"
                        title={item.desc}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            compareType === item.type
                              ? 'border-[#2f54eb] bg-white'
                              : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                          }`}
                        >
                          {compareType === item.type && (
                            <div className="w-2 h-2 rounded-full bg-[#2f54eb]" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="compareType"
                          value={item.type}
                          checked={compareType === item.type}
                          onChange={() => setCompareType(item.type)}
                          className="hidden"
                        />
                        <span className="text-[13px] font-medium text-[#1d2129]">
                          {item.type}
                        </span>
                        <span className="text-[12px] text-[#86909c] hidden sm:inline">
                          ({item.type === '相同文件比对' ? '同文档版本比对' : '跨文档交叉核验'})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* * 比对策略： */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[90px] text-right">
                    <span className="text-[#f53f3f] mr-0.5">*</span>比对策略：
                  </label>
                  <div className="flex flex-wrap items-center gap-5">
                    {[
                      '全文比对',
                      '逐页比对',
                      '忽略段落顺序差异（全文）',
                      '忽略段落顺序差异（章节内）',
                      '忽略页面顺序差异',
                    ].map((st) => (
                      <label
                        key={st}
                        className="flex items-center gap-2 cursor-pointer select-none group"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            compareStrategy === st
                              ? 'border-[#2f54eb] bg-white'
                              : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                          }`}
                        >
                          {compareStrategy === st && (
                            <div className="w-2 h-2 rounded-full bg-[#2f54eb]" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="compareStrategy"
                          value={st}
                          checked={compareStrategy === st}
                          onChange={() => setCompareStrategy(st)}
                          className="hidden"
                        />
                        <span className="text-[13px] text-[#1d2129]">{st}</span>
                        {st === '全文比对' && (
                          <span className="text-[11.5px] text-[#86909c] whitespace-nowrap">
                            （跨页合并，按文本顺序比对）
                          </span>
                        )}
                        {st === '逐页比对' && (
                          <span className="text-[11.5px] text-[#86909c] whitespace-nowrap">
                            （跨页段落不合并，页码一一对应比对）
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 开启表格比对： */}
                <div className="flex items-center gap-3">
                  <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[90px] text-right">
                    开启表格比对：
                  </label>
                  <button
                    type="button"
                    onClick={() => setTableCompare(!tableCompare)}
                    className={`relative inline-flex h-[20px] w-[38px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      tableCompare ? 'bg-[#14c9c9]' : 'bg-[#c9cdd4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        tableCompare ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 过滤配置： */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[90px] text-right">
                    过滤配置：
                  </label>
                  <div className="flex flex-wrap items-center gap-5">
                    {/* 自定义字符 */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          filterConfigs.customChars
                            ? 'border-[#2f54eb] bg-[#2f54eb]'
                            : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                        }`}
                      >
                        {filterConfigs.customChars && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filterConfigs.customChars}
                        onChange={() => toggleFilterConfig('customChars')}
                        className="hidden"
                      />
                      <span className="text-[13px] text-[#1d2129]">
                        自定义字符
                      </span>
                    </label>

                    {/* 自定义形近词 */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          filterConfigs.customSimilarWords
                            ? 'border-[#2f54eb] bg-[#2f54eb]'
                            : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                        }`}
                      >
                        {filterConfigs.customSimilarWords && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filterConfigs.customSimilarWords}
                        onChange={() => toggleFilterConfig('customSimilarWords')}
                        className="hidden"
                      />
                      <span className="text-[13px] text-[#1d2129]">
                        自定义形近词
                      </span>
                    </label>

                    {/* 全部标点符号 查看 */}
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <div
                          className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                            filterConfigs.allPunctuations
                              ? 'border-[#2f54eb] bg-[#2f54eb]'
                              : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                          }`}
                        >
                          {filterConfigs.allPunctuations && (
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={filterConfigs.allPunctuations}
                          onChange={() =>
                            toggleFilterConfig('allPunctuations')
                          }
                          className="hidden"
                        />
                        <span className="text-[13px] text-[#1d2129]">
                          全部标点符号
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPunctuationModal(true)}
                        className="text-[13px] text-[#2f54eb] hover:underline cursor-pointer"
                      >
                        查看
                      </button>
                    </div>

                    {/* 页眉页脚 */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          filterConfigs.headerFooter
                            ? 'border-[#2f54eb] bg-[#2f54eb]'
                            : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                        }`}
                      >
                        {filterConfigs.headerFooter && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filterConfigs.headerFooter}
                        onChange={() => toggleFilterConfig('headerFooter')}
                        className="hidden"
                      />
                      <span className="text-[13px] text-[#1d2129]">
                        页眉页脚
                      </span>
                    </label>

                    {/* 目录 */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          filterConfigs.tableOfContents
                            ? 'border-[#2f54eb] bg-[#2f54eb]'
                            : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                        }`}
                      >
                        {filterConfigs.tableOfContents && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filterConfigs.tableOfContents}
                        onChange={() => toggleFilterConfig('tableOfContents')}
                        className="hidden"
                      />
                      <span className="text-[13px] text-[#1d2129]">目录</span>
                    </label>

                    {/* 印章 */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          filterConfigs.seals
                            ? 'border-[#2f54eb] bg-[#2f54eb]'
                            : 'border-[#d9d9d9] group-hover:border-[#b0b4be] bg-white'
                        }`}
                      >
                        {filterConfigs.seals && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={filterConfigs.seals}
                        onChange={() => toggleFilterConfig('seals')}
                        className="hidden"
                      />
                      <span className="text-[13px] text-[#1d2129]">印章</span>
                    </label>
                  </div>
                </div>

                {/* 开启比对增强： */}
                <div className="flex items-center gap-3">
                  <label className="text-[13.5px] text-[#1d2129] shrink-0 w-[90px] text-right">
                    开启比对增强：
                  </label>
                  <button
                    type="button"
                    onClick={() => setCompareEnhance(!compareEnhance)}
                    className={`relative inline-flex h-[20px] w-[38px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      compareEnhance ? 'bg-[#14c9c9]' : 'bg-[#c9cdd4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        compareEnhance ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: 规则配置 (Rule points table) */
          <div className="max-w-[840px] mx-auto w-full space-y-6 pt-2 pb-20">
            <div className="bg-[#f7f8fa] p-4 rounded-[6px] border border-[#f2f3f5] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[#1d2129] mb-1">
                  审核规则点配置 ({ruleName || '未命名规则'})
                </h3>
                <p className="text-[13px] text-[#86909c]">
                  模板版面：{templateDocType || '未指定'} | 比对文件：{compareDocType} | 策略：{compareStrategy}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuditPoints((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      name: `自定义比对项 ${prev.length + 1}`,
                      extractField: '关键字段',
                      logic: '一致性核对',
                      level: '告警',
                    },
                  ]);
                }}
                className="h-[30px] px-3 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[4px] transition-colors cursor-pointer"
              >
                + 添加比对点
              </button>
            </div>

            {/* Points Table */}
            <div className="border border-[#e5e6eb] rounded-[6px] overflow-hidden">
              <div className="grid grid-cols-12 bg-[#fafbfc] px-4 py-2.5 text-[13px] font-medium text-[#1d2129] border-b border-[#e5e6eb]">
                <div className="col-span-1">序号</div>
                <div className="col-span-4">审核点名称</div>
                <div className="col-span-3">抽取字段</div>
                <div className="col-span-2">校验规则</div>
                <div className="col-span-2 text-right">操作</div>
              </div>
              <div className="divide-y divide-[#f2f3f5]">
                {auditPoints.map((pt, idx) => (
                  <div
                    key={pt.id}
                    className="grid grid-cols-12 px-4 py-3 text-[13px] text-[#4e5969] items-center hover:bg-[#fcfcfd]"
                  >
                    <div className="col-span-1 text-[#86909c]">{idx + 1}</div>
                    <div className="col-span-4 font-normal text-[#1d2129]">
                      {pt.name}
                    </div>
                    <div className="col-span-3 text-[#1d2129]">
                      <span className="px-2 py-0.5 bg-[#f2f3f5] rounded text-[12px]">
                        {pt.extractField}
                      </span>
                    </div>
                    <div className="col-span-2 text-[#4e5969]">{pt.logic}</div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setAuditPoints((prev) =>
                            prev.filter((p) => p.id !== pt.id)
                          )
                        }
                        className="text-[#f53f3f] hover:underline text-[12.5px] cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Action Bar */}
      <div className="shrink-0 bg-white border-t border-[#f2f3f5] py-3.5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-[32px] px-5 border border-[#d9d9d9] hover:bg-[#f7f8fa] text-[13.5px] text-[#1d2129] rounded-[4px] transition-colors cursor-pointer font-normal"
        >
          返回
        </button>

        {readOnly ? (
          <button
            type="button"
            onClick={onBack}
            className="h-[32px] px-6 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-medium shadow-sm"
          >
            关闭
          </button>
        ) : (
          <button
            type="button"
            disabled={!ruleName.trim()}
            onClick={handleFinish}
            className="h-[32px] px-6 bg-[#2f54eb] hover:bg-[#1d39c4] disabled:bg-[#a0b4ff] disabled:cursor-not-allowed text-white text-[13.5px] rounded-[4px] transition-colors cursor-pointer font-medium shadow-sm"
          >
            保存
          </button>
        )}
      </div>

      {/* Punctuation Modal */}
      {showPunctuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[460px] p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f4]">
              <h4 className="text-[15px] font-semibold text-[#1d2129]">
                标点符号过滤列表
              </h4>
              <button
                onClick={() => setShowPunctuationModal(false)}
                className="text-[#86909c] hover:text-[#1d2129] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 text-[13px] text-[#4e5969] space-y-3">
              <p>勾选全部标点符号后，比对过程中将自动过滤以下中英文符号差异：</p>
              <div className="p-3 bg-[#f7f8fa] rounded-[4px] text-[13.5px] leading-loose font-mono text-[#1d2129] break-all border border-[#eaedf1]">
                ， 。 、 ； ： ？ ！ “ ” ‘ ’ （ ） 【 】 《 》 — … · , . ; : ? ! " ' ( ) [ ] {'<'} {'>'} - _ / \
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPunctuationModal(false)}
                className="h-[30px] px-4 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[4px]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
