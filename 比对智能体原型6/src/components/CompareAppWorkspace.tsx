import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Bot,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Upload,
  Sparkles,
  Archive,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Calendar,
  ArrowUpDown,
  Copy,
} from 'lucide-react';
import { AppItem } from '../types';
import {
  MaterialSelectModal,
  MaterialFileItem,
  INITIAL_MATERIALS,
} from './MaterialSelectModal';
import { TaskComparisonDetail } from './TaskComparisonDetail';
import {
  RuleItem,
  getStoredRules,
  saveStoredRules,
  RULES_UPDATED_EVENT,
  normalizeAuditType,
} from '../sharedCompareData';
import {
  loadCompareApps,
  getCurrentTenant,
} from '../appConfigStore';
import { CreateRulePage } from './CreateRulePage';

export type TaskCompareStatus =
  | '排队中'
  | '比对中'
  | '比对成功'
  | '比对失败'
  | '解析中'
  | '解析成功'
  | '解析失败'
  | '文件检查失败'
  | '已复核';

export interface TaskItem {
  id: string;
  name: string;
  status: TaskCompareStatus;
  createTime: string;
  creator: string;
  finishTime: string;
  sourceFile?: string;
  ruleName?: string;
  targetFile?: string;
  targetFiles?: string[];
  targetFileSimilarities?: Record<string, number>;
  diffCount?: number;
}

const normalizeTaskStatus = (status: string): TaskCompareStatus => {
  if (status === '比对完成') return '比对成功';
  if (status === 'AI审核完成') return '已复核';
  if (status === '文件分类完成') return '解析成功';
  if (status === '处理中') return '比对中';
  if (status === '审核失败') return '比对失败';
  return status as TaskCompareStatus;
};

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 't-1',
    name: '1',
    status: '比对成功',
    createTime: '2026-08-27 15:36:55',
    creator: 'luyye',
    finishTime: '2026-08-27 15:37:10',
    sourceFile: '测1.docx',
    ruleName: '版本迭代比对-默认规则',
    targetFile: '测2.docx',
    diffCount: 6,
  },
  {
    id: 't-2',
    name: '2.1',
    status: '已复核',
    createTime: '2026-08-05 14:29:07',
    creator: 'luyye',
    finishTime: '2026-08-05 14:44:18',
    sourceFile: '公司债券受托管理协议_V1.2.docx',
    ruleName: '版本迭代比对-默认规则',
    targetFile: '公司债券受托管理协议_V2.0.docx',
    diffCount: 28,
  },
  {
    id: 't-3',
    name: '22',
    status: '比对成功',
    createTime: '2026-08-27 14:15:20',
    creator: 'luyye',
    finishTime: '2026-08-27 14:16:05',
    sourceFile: '测1.docx',
    ruleName: '版本迭代比对-默认规则',
    targetFile: '测2.docx',
    diffCount: 6,
  },
  {
    id: 't-4',
    name: '多文件合同签署版本比对',
    status: '比对成功',
    createTime: '2026-09-04 14:20:10',
    creator: 'admin',
    finishTime: '2026-09-04 14:23:05',
    sourceFile: '采购框架协议_基准版.docx',
    ruleName: '版本迭代比对-默认规则',
    targetFile: '采购框架协议_签署稿_甲公司.docx',
    targetFiles: [
      '采购框架协议_签署稿_甲公司.docx',
      '采购框架协议_签署稿_乙公司.docx',
      '采购框架协议_签署稿_丙公司.docx',
      '采购框架协议_签署稿_丁公司.docx',
    ],
    targetFileSimilarities: {
      '采购框架协议_签署稿_甲公司.docx': 99.4,
      '采购框架协议_签署稿_乙公司.docx': 99.1,
      '采购框架协议_签署稿_丙公司.docx': 98.7,
      '采购框架协议_签署稿_丁公司.docx': 98.2,
    },
    diffCount: 8,
  },
];

interface CompareAppWorkspaceProps {
  app: AppItem;
  onBack: () => void;
}

export const CompareAppWorkspace: React.FC<CompareAppWorkspaceProps> = ({
  app,
  onBack,
}) => {
  // Navigation active tab: 'tasks' (任务管理) | 'rules' (规则配置)
  const [activeNav, setActiveNav] = useState<'tasks' | 'rules'>('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Task list state (saved per app ID in localStorage)
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(`daguan_tasks_${app.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaultRuleName = getStoredRules()[0]?.name;
        return parsed.map((t: TaskItem) => ({
          ...t,
          status: normalizeTaskStatus(t.status),
          ruleName: t.ruleName || defaultRuleName,
        }));
      }
    } catch (e) {
      console.error(e);
    }
    const defaultRuleName = getStoredRules()[0]?.name;
    return DEFAULT_TASKS.map((t) => ({
      ...t,
      status: normalizeTaskStatus(t.status),
      ruleName: t.ruleName || defaultRuleName,
    }));
  });

  const saveTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(`daguan_tasks_${app.id}`, JSON.stringify(newTasks));
    } catch (e) {
      console.error(e);
    }
  };

  // Current active SaaS tenant (e.g. VIP客户)
  const currentTenant = getCurrentTenant();

  // Helper to find customer authorization record configured by Admin for this customer & app
  const getEffectiveAuthRecord = () => {
    const allApps = loadCompareApps();
    const foundApp = allApps.find((a) => a.id === app.id || a.name === app.name);
    const authTenants = (foundApp as any)?.authorizedTenants || [];
    let authRecord = Array.isArray(authTenants)
      ? authTenants.find(
          (t: any) =>
            t &&
            (t.tenantName === currentTenant ||
              t.tenantId === currentTenant ||
              (currentTenant.includes('VIP') && t.tenantName?.includes('VIP')) ||
              (currentTenant.includes('luy') && t.tenantName?.includes('luy')))
        )
      : undefined;

    if (!authRecord) {
      for (const a of allApps) {
        const tList = (a as any)?.authorizedTenants || [];
        const matched = Array.isArray(tList)
          ? tList.find(
              (t: any) =>
                t &&
                (t.tenantName === currentTenant ||
                  (currentTenant.includes('VIP') && t.tenantName?.includes('VIP')) ||
                  (currentTenant.includes('luy') && t.tenantName?.includes('luy')))
            )
          : null;
        if (matched) {
          authRecord = matched;
          break;
        }
      }
    }
    return authRecord;
  };

  const [currentAuth, setCurrentAuth] = useState(getEffectiveAuthRecord);
  const isPlatformManaged = currentAuth?.manageType === '平台管理';

  // Helper to load rules for this app & tenant (strictly synced from Admin customer config & rule management)
  const loadRulesForCurrentContext = (): RuleItem[] => {
    const masterRules = getStoredRules();
    const authRecord = getEffectiveAuthRecord();
    const isPlatform = authRecord?.manageType === '平台管理';

    const configuredRuleName =
      authRecord?.rule && authRecord.rule !== '-' ? authRecord.rule : null;

    const result: RuleItem[] = [];
    const addedIds = new Set<string>();
    const addedNames = new Set<string>();

    // If '租户管理' (Tenant Management), load tenant's custom saved rules
    if (!isPlatform) {
      let localSaved: RuleItem[] = [];
      try {
        const raw = localStorage.getItem(`daguan_customer_rules_${currentTenant}_${app.id}`);
        if (raw) {
          localSaved = JSON.parse(raw);
        }
      } catch (e) {
        console.error(e);
      }

      localSaved.forEach((r) => {
        if (!addedIds.has(r.id) && !addedNames.has(r.name)) {
          result.push({
            ...r,
            auditType: normalizeAuditType(r.auditType),
          });
          addedIds.add(r.id);
          addedNames.add(r.name);
        }
      });
    }

    // Load Admin-configured rule for this customer (e.g. "中登&查重" chosen in Admin)
    if (configuredRuleName) {
      const matched = masterRules.find(
        (r) => r.name === configuredRuleName && r.appName === app.name
      );
      if (matched && !addedIds.has(matched.id) && !addedNames.has(matched.name)) {
        result.push({
          ...matched,
          auditType: normalizeAuditType(matched.auditType),
        });
        addedIds.add(matched.id);
        addedNames.add(matched.name);
      }
    }

    // Default fallback only if empty
    if (result.length === 0) {
      const defaultRule =
        masterRules.find((r) => r.appName === app.name) || masterRules[0];
      if (defaultRule) {
        result.push({
          ...defaultRule,
          auditType: normalizeAuditType(defaultRule.auditType),
        });
      }
    }

    return result;
  };

  const [rules, setRules] = useState<RuleItem[]>(loadRulesForCurrentContext);

  // Sync rules and auth status when updated from Admin (AppCustomerConfigPage or CompareRuleManagement)
  useEffect(() => {
    const handleSync = () => {
      setCurrentAuth(getEffectiveAuthRecord());
      setRules(loadRulesForCurrentContext());
    };
    window.addEventListener(RULES_UPDATED_EVENT, handleSync);
    window.addEventListener('daguan_apps_updated', handleSync);
    window.addEventListener('daguan_tenant_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(RULES_UPDATED_EVENT, handleSync);
      window.removeEventListener('daguan_apps_updated', handleSync);
      window.removeEventListener('daguan_tenant_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [app.id, app.name, currentTenant]);

  const saveCustomerRules = (updatedRules: RuleItem[]) => {
    setRules(updatedRules);
    try {
      localStorage.setItem(
        `daguan_customer_rules_${currentTenant}_${app.id}`,
        JSON.stringify(updatedRules)
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Rules filter states (Matching Image 2)
  const [ruleSearchKeyword, setRuleSearchKeyword] = useState('');
  const [ruleCreatorFilter, setRuleCreatorFilter] = useState('全部');
  const [ruleStartDate, setRuleStartDate] = useState('');
  const [ruleEndDate, setRuleEndDate] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [ruleSortDirection, setRuleSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ruleCurrentPage, setRuleCurrentPage] = useState(1);
  const [rulePageSize, setRulePageSize] = useState(10);
  const [rulePageSizeDropdownOpen, setRulePageSizeDropdownOpen] = useState(false);
  const rulePageSizeRef = useRef<HTMLDivElement>(null);

  // Create / Edit rule view
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);

  // Derived creator options
  const ruleCreatorOptions = useMemo(() => {
    const creators = Array.from(new Set(rules.map((r) => r.creator).filter(Boolean)));
    return ['全部', ...creators];
  }, [rules]);

  // Filtered and sorted rules
  const filteredRules = useMemo(() => {
    return rules
      .filter((r) => {
        if (ruleSearchKeyword.trim()) {
          const kw = ruleSearchKeyword.trim().toLowerCase();
          const matchName = r.name?.toLowerCase().includes(kw);
          const matchType = r.auditType?.toLowerCase().includes(kw);
          const matchCreator = r.creator?.toLowerCase().includes(kw);
          const matchDesc = r.desc?.toLowerCase().includes(kw);
          if (!matchName && !matchType && !matchCreator && !matchDesc) {
            return false;
          }
        }
        if (ruleCreatorFilter !== '全部' && r.creator !== ruleCreatorFilter) {
          return false;
        }
        if (ruleStartDate) {
          const itemDate = (r.createTime || r.updateTime).slice(0, 10);
          if (itemDate < ruleStartDate) return false;
        }
        if (ruleEndDate) {
          const itemDate = (r.createTime || r.updateTime).slice(0, 10);
          if (itemDate > ruleEndDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.updateTime || a.createTime || '';
        const timeB = b.updateTime || b.createTime || '';
        if (ruleSortDirection === 'asc') {
          return timeA.localeCompare(timeB);
        } else {
          return timeB.localeCompare(timeA);
        }
      });
  }, [
    rules,
    ruleSearchKeyword,
    ruleCreatorFilter,
    ruleStartDate,
    ruleEndDate,
    ruleSortDirection,
  ]);

  const totalRules = filteredRules.length;
  const totalRulePages = Math.max(1, Math.ceil(totalRules / rulePageSize));
  const ruleStartIndex = (ruleCurrentPage - 1) * rulePageSize;
  const ruleEndIndex = Math.min(ruleStartIndex + rulePageSize, totalRules);
  const currentRules = filteredRules.slice(ruleStartIndex, ruleEndIndex);

  const isAllRulesSelected =
    currentRules.length > 0 && currentRules.every((r) => selectedRuleIds.has(r.id));

  const handleToggleSelectAllRules = () => {
    if (isAllRulesSelected) {
      const newSet = new Set(selectedRuleIds);
      currentRules.forEach((r) => newSet.delete(r.id));
      setSelectedRuleIds(newSet);
    } else {
      const newSet = new Set(selectedRuleIds);
      currentRules.forEach((r) => newSet.add(r.id));
      setSelectedRuleIds(newSet);
    }
  };

  const handleToggleSelectRule = (id: string) => {
    const newSet = new Set(selectedRuleIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRuleIds(newSet);
  };

  const handleBatchDeleteRules = () => {
    if (selectedRuleIds.size === 0) return;
    const count = selectedRuleIds.size;
    const updated = rules.filter((r) => !selectedRuleIds.has(r.id));
    saveCustomerRules(updated);
    setSelectedRuleIds(new Set());
    showToast(`已成功批量删除 ${count} 条规则`);
  };

  const handleDeleteSingleRule = (rule: RuleItem) => {
    const updated = rules.filter((r) => r.id !== rule.id);
    saveCustomerRules(updated);
    const newSelected = new Set(selectedRuleIds);
    newSelected.delete(rule.id);
    setSelectedRuleIds(newSelected);
    showToast(`已删除规则「${rule.name}」`);
  };

  const handleDuplicateRule = (rule: RuleItem) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newRule: RuleItem = {
      ...rule,
      id: `${Date.now()}`,
      name: `${rule.name}(副本)`,
      createTime: nowStr,
      updateTime: nowStr,
      creator: 'luyye',
    };
    const updated = [newRule, ...rules];
    saveCustomerRules(updated);
    showToast(`已成功复制规则「${newRule.name}」`);
  };

  const handleSaveCreatedRule = (savedRule: RuleItem) => {
    let updated: RuleItem[];
    if (editingRule) {
      updated = rules.map((r) => (r.id === savedRule.id ? savedRule : r));
      showToast(`已更新规则「${savedRule.name}」`);
    } else {
      updated = [savedRule, ...rules];
      showToast(`已创建规则「${savedRule.name}」`);
    }
    saveCustomerRules(updated);
    setIsCreatingRule(false);
    setEditingRule(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        rulePageSizeRef.current &&
        !rulePageSizeRef.current.contains(e.target as Node)
      ) {
        setRulePageSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters
  const [taskNameFilter, setTaskNameFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [reviewTab, setReviewTab] = useState<'全部' | '待复核' | '已复核'>('全部');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeSlotForModal, setActiveSlotForModal] = useState<'template' | 'compare'>('template');
  const [templateFile, setTemplateFile] = useState<MaterialFileItem | null>(null);
  const [compareFiles, setCompareFiles] = useState<MaterialFileItem[]>([]);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isDraggingCompare, setIsDraggingCompare] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form data for creating/editing task
  const [taskFormName, setTaskFormName] = useState('');
  const [taskFormRuleName, setTaskFormRuleName] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (
        taskNameFilter.trim() &&
        !t.name.toLowerCase().includes(taskNameFilter.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        creatorFilter.trim() &&
        !t.creator.toLowerCase().includes(creatorFilter.trim().toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== '全部' && t.status !== statusFilter) {
        return false;
      }
      if (reviewTab === '待复核' && t.status !== '比对成功' && t.status !== '解析成功') {
        return false;
      }
      if (reviewTab === '已复核' && t.status !== '已复核') {
        return false;
      }
      return true;
    });
  }, [tasks, taskNameFilter, creatorFilter, statusFilter, reviewTab]);

  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const renderTaskStatusBadge = (status: TaskCompareStatus) => {
    const base =
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[12px] border font-medium';
    const meta: Record<
      TaskCompareStatus,
      { label: string; bg: string; color: string; border: string; kind: 'spin' | 'success' | 'danger' | 'warn' | 'plain' }
    > = {
      排队中: { label: '排队中', bg: '#f7f8fa', color: '#86909c', border: '#e5e6eb', kind: 'plain' },
      比对中: { label: '比对中', bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff', kind: 'spin' },
      比对成功: { label: '比对成功', bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f', kind: 'success' },
      比对失败: { label: '比对失败', bg: '#fff1f0', color: '#f5222d', border: '#ffa39e', kind: 'danger' },
      解析中: { label: '解析中', bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff', kind: 'spin' },
      解析成功: { label: '解析成功', bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f', kind: 'success' },
      解析失败: { label: '解析失败', bg: '#fff1f0', color: '#f5222d', border: '#ffa39e', kind: 'danger' },
      文件检查失败: { label: '文件检查失败', bg: '#fff1f0', color: '#f5222d', border: '#ffa39e', kind: 'danger' },
      已复核: { label: '已复核', bg: '#e6fffb', color: '#00b42a', border: '#87e8de', kind: 'success' },
    };
    const m = meta[status];
    return (
      <span className={`${base}`} style={{ background: m.bg, color: m.color, borderColor: m.border }}>
        {m.kind === 'spin' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
        {m.kind === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
        {m.kind === 'danger' && <AlertCircle className="w-3.5 h-3.5" />}
        {m.label}
      </span>
    );
  };

  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const compareFileInputRef = useRef<HTMLInputElement>(null);

  const handleResetFilters = () => {
    setTaskNameFilter('');
    setCreatorFilter('');
    setStatusFilter('全部');
    setReviewTab('全部');
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setTaskFormName('');
    setTaskFormRuleName(rules[0]?.name || getStoredRules()[0]?.name || '');
    setTemplateFile(null);
    setCompareFiles([]);
    setIsCreateModalOpen(true);
  };

  const handleOpenMaterialModalForSlot = (slot: 'template' | 'compare') => {
    setActiveSlotForModal(slot);
    setIsMaterialModalOpen(true);
  };

  const handleMaterialConfirmed = (files: MaterialFileItem[]) => {
    if (files.length > 0) {
      if (activeSlotForModal === 'template') {
        setTemplateFile(files[0]);
        setCompareFiles((prev) => [
          ...prev,
          ...files.slice(1).filter(
            (file) => !prev.some((existing) => existing.id === file.id)
          ),
        ]);
      } else {
        setCompareFiles((prev) => {
          const next = [...prev];
          files.forEach((file) => {
            if (!next.some((existing) => existing.id === file.id)) {
              next.push(file);
            }
          });
          return next;
        });
      }
    }
  };

  // Helper to parse dropped or uploaded local file
  const processLocalFile = (file: File, slot: 'template' | 'compare') => {
    let fileType: MaterialFileItem['type'] = 'other';
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) fileType = 'excel';
    else if (file.name.endsWith('.pdf')) fileType = 'pdf';
    else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) fileType = 'word';
    else if (file.type.startsWith('image/')) fileType = 'image';

    let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    if (file.size > 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newMaterial: MaterialFileItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      size: sizeStr,
      createTime: timeStr,
      creator: 'luyye',
      type: fileType,
      group: '默认分组',
    };

    if (slot === 'template') {
      setTemplateFile(newMaterial);
    } else {
      setCompareFiles((prev) =>
        prev.some((item) => item.name === newMaterial.name)
          ? prev
          : [...prev, newMaterial]
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormName.trim()) {
      showToast('请输入任务名称');
      return;
    }
    if (compareFiles.length === 0) {
      showToast('请至少上传一份比对文档');
      return;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const createTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const sourceDoc = templateFile?.name || '基准原文件.docx';
    const baseTaskName = taskFormName.trim();
    const targetNames = compareFiles.map((file) => file.name);
    const newTaskId = `task-${Date.now()}`;
    const targetFileSimilarities = Object.fromEntries(
      targetNames.map((name, index) => [
        name,
        Number((99.4 - index * 0.35).toFixed(2)),
      ])
    );
    const newTask: TaskItem = {
      id: newTaskId,
      name: baseTaskName,
      status: '排队中',
      createTime: createTimeStr,
      creator: 'luyye',
      finishTime: '-',
      sourceFile: sourceDoc,
      ruleName: taskFormRuleName || rules[0]?.name || '版本迭代比对-默认规则',
      targetFile: targetNames[0],
      targetFiles: targetNames,
      targetFileSimilarities,
      diffCount: Math.floor(Math.random() * 10) + 6,
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setIsCreateModalOpen(false);
    showToast(
      compareFiles.length > 1
        ? `已发起一对多比对，共关联 ${compareFiles.length} 份比对文档`
        : `比对任务「${baseTaskName}」已发起`
    );

    // Step 2: Simulate queue -> comparing -> compare success
    setTimeout(() => {
      setTasks((prevTasks) => {
        const updated = prevTasks.map((t) =>
          t.id === newTaskId ? { ...t, status: '比对中' as const } : t
        );
        try {
          localStorage.setItem(
            `daguan_tasks_${app.id}`,
            JSON.stringify(updated)
          );
        } catch (err) {
          console.error(err);
        }
        return updated;
      });
    }, 1200);

    setTimeout(() => {
      const finishNow = new Date();
      const finishTimeStr = `${finishNow.getFullYear()}-${pad(
        finishNow.getMonth() + 1
      )}-${pad(finishNow.getDate())} ${pad(finishNow.getHours())}:${pad(
        finishNow.getMinutes()
      )}:${pad(finishNow.getSeconds())}`;

      setTasks((prevTasks) => {
        const nextTasks = prevTasks.map((t) =>
          t.id === newTaskId
            ? {
                ...t,
                status: '比对成功' as const,
                finishTime: finishTimeStr,
              }
            : t
        );
        try {
          localStorage.setItem(
            `daguan_tasks_${app.id}`,
            JSON.stringify(nextTasks)
          );
        } catch (err) {
          console.error(err);
        }
        return nextTasks;
      });

      showToast(
        compareFiles.length > 1
          ? `任务「${baseTaskName}」多文件比对成功`
          : `任务「${baseTaskName}」比对成功`
      );
    }, 2800);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !taskFormName.trim()) return;

    const updated = tasks.map((t) =>
      t.id === editingTask.id ? { ...t, name: taskFormName.trim() } : t
    );
    saveTasks(updated);
    setEditingTask(null);
    showToast('任务已更新');
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    setDeletingTask(null);
    showToast('任务已删除');
  };

  const handleRetryTask = (task: TaskItem) => {
    if (task.status === '排队中' || task.status === '比对中' || task.status === '解析中') {
      showToast('任务正在处理中，请稍候再重试');
      return;
    }
    showToast(`任务「${task.name}」已重新进入队列`);
    const updateTask = (partial: Partial<TaskItem>) => {
      setTasks((prevTasks) => {
        const updated = prevTasks.map((t) =>
          t.id === task.id ? { ...t, ...partial } : t
        );
        try {
          localStorage.setItem(
            `daguan_tasks_${app.id}`,
            JSON.stringify(updated)
          );
        } catch (err) {
          console.error(err);
        }
        return updated;
      });
      setViewingTask((current) =>
        current && current.id === task.id ? { ...current, ...partial } : current
      );
    };
    updateTask({ status: '排队中', finishTime: '-' });
    setTimeout(() => {
      updateTask({ status: '比对中' });
    }, 900);
    setTimeout(() => {
      const finishNow = new Date();
      const finishTimeStr = `${finishNow.getFullYear()}-${String(
        finishNow.getMonth() + 1
      ).padStart(2, '0')}-${String(finishNow.getDate()).padStart(2, '0')} ${String(
        finishNow.getHours()
      ).padStart(2, '0')}:${String(finishNow.getMinutes()).padStart(2, '0')}:${String(
        finishNow.getSeconds()
      ).padStart(2, '0')}`;
      updateTask({ status: '比对成功', finishTime: finishTimeStr });
      showToast(`任务「${task.name}」重新比对成功`);
    }, 2400);
  };

  const handleRetryFromDetail = (taskId: string) => {
    const targetTask =
      viewingTask && viewingTask.id === taskId
        ? viewingTask
        : tasks.find((t) => t.id === taskId);
    if (targetTask) {
      handleRetryTask(targetTask);
    }
  };

  const handleMarkTaskReviewed = (taskId: string) => {
    setViewingTask((v) =>
      v && v.id === taskId ? { ...v, status: '已复核' as TaskCompareStatus } : v
    );
    setTasks((prevTasks) => {
      const updated = prevTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: '已复核' as TaskCompareStatus }
          : t
      );
      try {
        localStorage.setItem(
          `daguan_tasks_${app.id}`,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
    showToast('任务已标记为已复核');
  };

  // Navigation helpers for viewing detail
  const viewingTaskIndex = viewingTask
    ? tasks.findIndex((t) => t.id === viewingTask.id)
    : -1;
  const hasPrevTask = viewingTaskIndex > 0;
  const hasNextTask =
    viewingTaskIndex >= 0 && viewingTaskIndex < tasks.length - 1;

  const handlePrevTask = () => {
    if (hasPrevTask) {
      setViewingTask(tasks[viewingTaskIndex - 1]);
    }
  };

  const handleNextTask = () => {
    if (hasNextTask) {
      setViewingTask(tasks[viewingTaskIndex + 1]);
    }
  };

  if (viewingTask) {
    return (
      <TaskComparisonDetail
        task={viewingTask}
        onMarkReviewed={handleMarkTaskReviewed}
        onRetryTask={handleRetryFromDetail}
        onBack={() => setViewingTask(null)}
        onPrevTask={handlePrevTask}
        onNextTask={handleNextTask}
        hasPrevTask={hasPrevTask}
        hasNextTask={hasNextTask}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-[#f5f6f8] font-sans antialiased text-[#1d2129]">
      {/* Toast message */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[#1d2129]/90 text-white px-4 py-2 rounded shadow-lg text-[13px] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#52c41a]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Left Workspace Sidebar */}
      <div
        className={`${
          isSidebarCollapsed ? 'w-[56px]' : 'w-[190px]'
        } h-screen bg-[#f7f8fa] border-r border-[#e5e6eb] flex flex-col justify-between transition-all duration-200 shrink-0 select-none`}
      >
        {/* Top: Back arrow button & Actual App Name */}
        <div>
          <div className="p-3 border-b border-[#e5e6eb] flex items-center gap-2.5 min-h-[50px]">
            <button
              id="workspace-back-btn"
              onClick={onBack}
              title="返回应用列表"
              className="w-6 h-6 rounded-full border border-[#86909c] hover:border-[#2f54eb] bg-transparent hover:bg-[#f0f5ff] text-[#4e5969] hover:text-[#2f54eb] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {!isSidebarCollapsed && (
              <span
                className="font-bold text-[14px] text-[#1d2129] leading-tight line-clamp-2"
                title={app.name}
              >
                {app.name}
              </span>
            )}
          </div>

          {/* Navigation Menu */}
          <div className="p-2 space-y-1">
            <button
              id="nav-task-management"
              onClick={() => setActiveNav('tasks')}
              className={`w-full h-[36px] px-3 rounded-[4px] flex items-center gap-2.5 text-[13px] transition-colors cursor-pointer ${
                activeNav === 'tasks'
                  ? 'bg-[#e9f0fe] text-[#2f54eb] font-medium'
                  : 'text-[#4e5969] hover:bg-[#eaedf1] hover:text-[#1d2129]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>任务管理</span>}
            </button>

            <button
              id="nav-rule-management"
              onClick={() => setActiveNav('rules')}
              className={`w-full h-[36px] px-3 rounded-[4px] flex items-center gap-2.5 text-[13px] transition-colors cursor-pointer ${
                activeNav === 'rules'
                  ? 'bg-[#e9f0fe] text-[#2f54eb] font-medium'
                  : 'text-[#4e5969] hover:bg-[#eaedf1] hover:text-[#1d2129]'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>规则配置</span>}
            </button>
          </div>
        </div>

        {/* Bottom: Collapse Button */}
        <div className="p-3 border-t border-[#e5e6eb] flex items-center">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-[#86909c] hover:text-[#1d2129] p-1 flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
            title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1 text-[12px]">
                <ChevronsLeft className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Top Header Bar */}
        <div className="h-[46px] px-6 border-b border-[#e5e6eb] flex items-center justify-between bg-white shrink-0">
          {/* Left: Section Name */}
          <div className="text-[13.5px] text-[#4e5969]">
            {activeNav === 'tasks' ? '任务管理' : '规则配置'}
          </div>

          {/* Right: Bot Icon & User Profile */}
          <div className="flex items-center gap-4">
            <button
              className="p-1 text-[#4e5969] hover:text-[#2f54eb] hover:bg-[#f2f3f5] rounded transition-colors cursor-pointer"
              title="AI 助手"
            >
              <Bot className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#f2f3f5] border border-[#e5e6eb] flex items-center justify-center text-[#86909c] text-xs">
                <span className="scale-75">👤</span>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[12px] font-medium text-[#1d2129] group-hover:text-[#2f54eb]">
                  luyye
                </span>
                <span className="text-[10px] text-[#86909c] mt-0.5">luyeye</span>
              </div>
              <ChevronDown className="w-3 h-3 text-[#86909c] group-hover:text-[#2f54eb]" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        {activeNav === 'tasks' ? (
          <div className="flex-1 p-5 overflow-y-auto bg-white flex flex-col justify-between">
            <div>
              {/* Action Bar & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {/* Left: Create Task Button */}
                <button
                  id="create-task-btn"
                  onClick={handleOpenCreateModal}
                  className="h-[32px] px-3 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[3px] flex items-center gap-1 transition-colors cursor-pointer font-normal shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建任务</span>
                </button>

                {/* Right: Filters */}
                <div className="flex items-center gap-2">
                  {/* Task Name Search */}
                  <div className="relative">
                    <input
                      id="search-task-name-input"
                      type="text"
                      value={taskNameFilter}
                      onChange={(e) => {
                        setTaskNameFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="任务名称"
                      className="w-[180px] h-[32px] pl-7 pr-2.5 text-[12.5px] border border-[#d9d9d9] rounded-[3px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Creator Search */}
                  <div className="relative">
                    <input
                      id="search-creator-input"
                      type="text"
                      value={creatorFilter}
                      onChange={(e) => {
                        setCreatorFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="创建人"
                      className="w-[180px] h-[32px] pl-7 pr-2.5 text-[12.5px] border border-[#d9d9d9] rounded-[3px] focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      id="task-status-select"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-[32px] pl-3 pr-7 text-[12.5px] border border-[#d9d9d9] rounded-[3px] bg-white appearance-none focus:outline-none focus:border-[#2f54eb] text-[#1d2129] cursor-pointer"
                    >
                      <option value="全部">任务状态：全部</option>
                      <option value="排队中">排队中</option>
                      <option value="比对中">比对中</option>
                      <option value="比对成功">比对成功</option>
                      <option value="比对失败">比对失败</option>
                      <option value="解析中">解析中</option>
                      <option value="解析成功">解析成功</option>
                      <option value="解析失败">解析失败</option>
                      <option value="文件检查失败">文件检查失败</option>
                      <option value="已复核">已复核</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleResetFilters}
                    title="重置筛选"
                    className="w-[32px] h-[32px] border border-[#d9d9d9] rounded-[3px] bg-white hover:bg-[#f7f8fa] flex items-center justify-center text-[#4e5969] transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 全部 / 待复核 / 已复核 页签 */}
              <div className="flex items-center gap-1 mb-3">
                {([
                  ['全部', tasks.length],
                  ['待复核', tasks.filter((t) => t.status === '比对成功' || t.status === '解析成功').length],
                  ['已复核', tasks.filter((t) => t.status === '已复核').length],
                ] as [string, number][]).map(([tab, count]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setReviewTab(tab as typeof reviewTab);
                      setCurrentPage(1);
                    }}
                    className={`h-[32px] px-4 rounded-t-[4px] border border-b-0 text-[13px] transition-colors cursor-pointer ${
                      reviewTab === tab
                        ? 'bg-white text-[#2f54eb] font-medium border-[#e5e6eb]'
                        : 'bg-[#f7f8fa] text-[#4e5969] border-transparent hover:bg-[#eef1f6]'
                    }`}
                  >
                    {tab}
                    <span className="ml-1.5 text-[11.5px] opacity-70">{count}</span>
                  </button>
                ))}
              </div>

              {/* Task Table */}
              <div className="border border-[#e5e6eb] rounded-[3px] overflow-hidden">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#f7f8fa] border-b border-[#e5e6eb] text-[#1d2129] font-medium h-[40px]">
                      <th className="px-4 py-2 font-medium">任务名称</th>
                      <th className="px-4 py-2 font-medium">模板文件</th>
                      <th className="px-4 py-2 font-medium">比对文件</th>
                      <th className="px-4 py-2 font-medium">任务状态</th>
                      <th className="px-4 py-2 font-medium">创建时间</th>
                      <th className="px-4 py-2 font-medium">创建人</th>
                      <th className="px-4 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e6eb]">
                    {currentTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-[#86909c] text-[13px]"
                        >
                          暂无匹配的任务数据
                        </td>
                      </tr>
                    ) : (
                      currentTasks.map((t) => {
                        const canRetry =
                          t.status === '比对失败' ||
                          t.status === '解析失败' ||
                          t.status === '文件检查失败';
                        const canViewDetail =
                          t.status === '比对成功' ||
                          t.status === '解析成功' ||
                          t.status === '已复核';

                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-[#f9fafc] transition-colors h-[48px]"
                          >
                            {/* Task Name */}
                            <td className="px-4 py-2">
                              <button
                                onClick={() => setViewingTask(t)}
                                className="text-[#2f54eb] hover:underline font-normal cursor-pointer text-left"
                              >
                                {t.name}
                              </button>
                            </td>

                            {/* Template File */}
                            <td className="px-4 py-2 truncate max-w-[260px]">
                              <button
                                onClick={() => setViewingTask(t)}
                                className="text-[#2f54eb] hover:underline font-normal cursor-pointer truncate max-w-full inline-block"
                                title={t.sourceFile}
                              >
                                {t.sourceFile || '-'}
                              </button>
                            </td>

                            {/* Compare Files */}
                            <td className="px-4 py-2 text-[#1d2129]">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[240px]" title={t.targetFile}>
                                  {t.targetFile || '-'}
                                </span>
                                {t.targetFiles && t.targetFiles.length > 1 && (
                                  <span className="shrink-0 inline-flex items-center justify-center min-w-[30px] px-1.5 py-0.5 rounded-full bg-[#f0f5ff] text-[#2f54eb] border border-[#adc6ff] text-[11px] font-medium">
                                    +{t.targetFiles.length - 1}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Task Status Badge */}
                            <td className="px-4 py-2">
                              {renderTaskStatusBadge(t.status)}
                            </td>

                            {/* Create Time */}
                            <td className="px-4 py-2 text-[#1d2129]">
                              {t.createTime}
                            </td>

                            {/* Creator */}
                            <td className="px-4 py-2 text-[#1d2129]">
                              {t.creator}
                            </td>

                            {/* Operations */}
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2.5">
                                {canRetry && (
                                  <button
                                    onClick={() => handleRetryTask(t)}
                                    className="text-[#2f54eb] hover:underline cursor-pointer"
                                  >
                                    重新比对
                                  </button>
                                )}

                                {!canViewDetail ? (
                                  <span className="text-[#c9cdd4] cursor-not-allowed">
                                    详情
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setViewingTask(t)}
                                    className="text-[#2f54eb] hover:underline cursor-pointer"
                                  >
                                    详情
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setEditingTask(t);
                                    setTaskFormName(t.name);
                                  }}
                                  className="text-[#2f54eb] hover:underline cursor-pointer"
                                >
                                  编辑
                                </button>

                                <button
                                  onClick={() => setDeletingTask(t)}
                                  className="text-[#2f54eb] hover:underline cursor-pointer"
                                >
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Pagination */}
            <div className="pt-4 flex items-center justify-end gap-3 text-[13px] text-[#4e5969]">
              <span>
                第 {totalTasks > 0 ? `${startIndex + 1}-${endIndex}` : '0-0'} 条/共{' '}
                {totalTasks} 条
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 border border-[#e5e6eb] rounded flex items-center justify-center hover:bg-[#f2f3f5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded text-[12.5px] cursor-pointer font-medium ${
                        isActive
                          ? 'bg-[#2f54eb] text-white'
                          : 'border border-[#e5e6eb] hover:bg-[#f2f3f5] text-[#1d2129]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 border border-[#e5e6eb] rounded flex items-center justify-center hover:bg-[#f2f3f5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-[#e5e6eb] rounded px-2 py-1 flex items-center gap-1 text-[12px] bg-white">
                <span>10 条/页</span>
                <ChevronDown className="w-3 h-3 text-[#86909c]" />
              </div>
            </div>
          </div>
        ) : isCreatingRule ? (
          /* Create / Edit Rule View */
          <div className="flex-1 overflow-y-auto bg-white flex flex-col">
            <CreateRulePage
              initialRule={editingRule}
              allAppNames={[app.name]}
              rulesList={rules}
              readOnly={isPlatformManaged}
              onBack={() => {
                setIsCreatingRule(false);
                setEditingRule(null);
              }}
              onSuccess={handleSaveCreatedRule}
            />
          </div>
        ) : (
          /* Rules Management Table View (Matching Image 2) */
          <div className="flex-1 p-5 overflow-y-auto bg-white flex flex-col justify-between">
            <div>
              {/* Action Bar & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {/* Left: + 新建规则 Button (Only for 租户管理) */}
                <div>
                  {!isPlatformManaged && (
                    <button
                      id="create-rule-btn"
                      onClick={() => {
                        setEditingRule(null);
                        setIsCreatingRule(true);
                      }}
                      className="h-[32px] px-3.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[13px] rounded-[3px] flex items-center gap-1.5 transition-colors cursor-pointer font-normal shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新建规则</span>
                    </button>
                  )}
                </div>

                {/* Right: Filters */}
                <div className="flex items-center gap-2.5">
                  {/* Keyword Search */}
                  <div className="relative">
                    <input
                      id="search-rule-keyword-input"
                      type="text"
                      value={ruleSearchKeyword}
                      onChange={(e) => {
                        setRuleSearchKeyword(e.target.value);
                        setRuleCurrentPage(1);
                      }}
                      placeholder="请输入关键词"
                      className="w-[180px] h-[32px] pl-7 pr-2.5 text-[12.5px] border border-[#d9d9d9] rounded-[3px] bg-white focus:outline-none focus:border-[#2f54eb] placeholder-[#86909c]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Creator Dropdown */}
                  <div className="relative">
                    <select
                      id="rule-creator-select"
                      value={ruleCreatorFilter}
                      onChange={(e) => {
                        setRuleCreatorFilter(e.target.value);
                        setRuleCurrentPage(1);
                      }}
                      className="h-[32px] pl-3 pr-7 text-[12.5px] border border-[#d9d9d9] rounded-[3px] bg-white appearance-none focus:outline-none focus:border-[#2f54eb] text-[#1d2129] cursor-pointer"
                    >
                      {ruleCreatorOptions.map((c) => (
                        <option key={c} value={c}>
                          创建人： {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#86909c] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Date Range Picker */}
                  <div className="flex items-center h-[32px] px-2.5 border border-[#d9d9d9] rounded-[3px] bg-white text-[12.5px] text-[#4e5969] gap-1.5">
                    <span className="text-[#86909c] shrink-0 text-[12px]">创建时间：</span>
                    <input
                      type="date"
                      value={ruleStartDate}
                      onChange={(e) => {
                        setRuleStartDate(e.target.value);
                        setRuleCurrentPage(1);
                      }}
                      className="text-[12px] text-[#1d2129] focus:outline-none bg-transparent w-[110px] cursor-pointer"
                      placeholder="开始日期"
                    />
                    <span className="text-[#86909c]">→</span>
                    <input
                      type="date"
                      value={ruleEndDate}
                      onChange={(e) => {
                        setRuleEndDate(e.target.value);
                        setRuleCurrentPage(1);
                      }}
                      className="text-[12px] text-[#1d2129] focus:outline-none bg-transparent w-[110px] cursor-pointer"
                      placeholder="结束日期"
                    />
                    <Calendar className="w-3.5 h-3.5 text-[#86909c] shrink-0 ml-0.5" />
                  </div>

                  {/* Batch Delete Trash Icon (Only if not platform managed) */}
                  {!isPlatformManaged && (
                    <button
                      id="batch-delete-rules-btn"
                      onClick={handleBatchDeleteRules}
                      disabled={selectedRuleIds.size === 0}
                      title={
                        selectedRuleIds.size > 0
                          ? `批量删除已选中的 ${selectedRuleIds.size} 条规则`
                          : '请勾选需要删除的规则'
                      }
                      className={`w-[32px] h-[32px] border rounded-[3px] flex items-center justify-center transition-colors cursor-pointer ${
                        selectedRuleIds.size > 0
                          ? 'border-[#ffccc7] bg-[#fff1f0] text-[#ff4d4f] hover:bg-[#ff4d4f] hover:text-white'
                          : 'border-[#d9d9d9] bg-white text-[#86909c] hover:bg-[#f7f8fa]'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rules Table (Matching Image 2) */}
              <div className="border border-[#e5e6eb] rounded-[3px] overflow-hidden">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#f7f8fa] border-b border-[#e5e6eb] text-[#1d2129] font-medium h-[40px]">
                      <th className="w-[44px] px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isAllRulesSelected}
                          onChange={handleToggleSelectAllRules}
                          className="rounded text-[#2f54eb] cursor-pointer"
                        />
                      </th>
                      <th className="w-[60px] px-3 py-2 font-medium">序号</th>
                      <th className="px-4 py-2 font-medium">规则名称</th>
                      <th className="px-4 py-2 font-medium">比对类型</th>
                      <th className="px-4 py-2 font-medium">创建时间</th>
                      <th
                        onClick={() =>
                          setRuleSortDirection((prev) =>
                            prev === 'asc' ? 'desc' : 'asc'
                          )
                        }
                        className="px-4 py-2 font-medium cursor-pointer select-none group"
                        title="点击按更新时间排序"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>更新时间</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#86909c] group-hover:text-[#2f54eb]" />
                        </div>
                      </th>
                      <th className="px-4 py-2 font-medium">创建人</th>
                      <th className="w-[140px] px-4 py-2 font-medium text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e6eb]">
                    {currentRules.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-[#86909c] text-[13px]"
                        >
                          暂无匹配的规则配置数据
                        </td>
                      </tr>
                    ) : (
                      currentRules.map((ruleItem, idx) => {
                        const rowNum = ruleStartIndex + idx + 1;
                        const isChecked = selectedRuleIds.has(ruleItem.id);

                        return (
                          <tr
                            key={ruleItem.id}
                            className={`hover:bg-[#f9fafc] transition-colors h-[48px] ${
                              isChecked ? 'bg-[#f0f5ff]/40' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="w-[44px] px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectRule(ruleItem.id)}
                                className="rounded text-[#2f54eb] cursor-pointer"
                              />
                            </td>

                            {/* 序号 */}
                            <td className="w-[60px] px-3 py-2 text-[#86909c]">
                              {rowNum}
                            </td>

                            {/* 规则名称 */}
                            <td className="px-4 py-2">
                              <button
                                onClick={() => {
                                  setEditingRule(ruleItem);
                                  setIsCreatingRule(true);
                                }}
                                className="text-[#2f54eb] hover:underline font-normal cursor-pointer text-left"
                              >
                                {ruleItem.name}
                              </button>
                            </td>

                            {/* 比对类型 */}
                            <td className="px-4 py-2 text-[#4e5969]">
                              <span
                                className={`inline-block px-2 py-0.5 text-[12px] rounded-[3px] font-normal leading-tight whitespace-nowrap border ${
                                  ruleItem.auditType === '不同文件比对'
                                    ? 'bg-[#e6fcf8] text-[#00b42a] border-[#a3f0db]'
                                    : 'bg-[#f0f5ff] text-[#2f54eb] border-[#adc6ff]'
                                }`}
                              >
                                {ruleItem.auditType || '相同文件比对'}
                              </span>
                            </td>

                            {/* 创建时间 */}
                            <td className="px-4 py-2 text-[#4e5969]">
                              {ruleItem.createTime || ruleItem.updateTime}
                            </td>

                            {/* 更新时间 */}
                            <td className="px-4 py-2 text-[#4e5969]">
                              {ruleItem.updateTime}
                            </td>

                            {/* 创建人 */}
                            <td className="px-4 py-2 text-[#4e5969]">
                              {ruleItem.creator || 'admin'}
                            </td>

                            {/* 操作 */}
                            <td className="px-4 py-2">
                              {isPlatformManaged ? (
                                <button
                                  onClick={() => {
                                    setEditingRule(ruleItem);
                                    setIsCreatingRule(true);
                                  }}
                                  className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
                                >
                                  查看
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 text-[13px]">
                                  <button
                                    onClick={() => {
                                      setEditingRule(ruleItem);
                                      setIsCreatingRule(true);
                                    }}
                                    className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateRule(ruleItem)}
                                    className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
                                  >
                                    复制
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSingleRule(ruleItem)}
                                    className="text-[#2f54eb] hover:underline cursor-pointer font-normal"
                                  >
                                    删除
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Pagination */}
            <div className="pt-4 flex items-center justify-end gap-3 text-[13px] text-[#4e5969]">
              <span>
                第 {totalRules > 0 ? `${ruleStartIndex + 1}-${ruleEndIndex}` : '0-0'} 条/共{' '}
                {totalRules} 条
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={ruleCurrentPage <= 1}
                  onClick={() => setRuleCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 border border-[#e5e6eb] rounded flex items-center justify-center hover:bg-[#f2f3f5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalRulePages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = page === ruleCurrentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setRuleCurrentPage(page)}
                      className={`w-7 h-7 rounded text-[12.5px] cursor-pointer font-medium ${
                        isActive
                          ? 'bg-[#2f54eb] text-white'
                          : 'border border-[#e5e6eb] hover:bg-[#f2f3f5] text-[#1d2129]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  disabled={ruleCurrentPage >= totalRulePages}
                  onClick={() =>
                    setRuleCurrentPage((p) => Math.min(totalRulePages, p + 1))
                  }
                  className="w-7 h-7 border border-[#e5e6eb] rounded flex items-center justify-center hover:bg-[#f2f3f5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Page size dropdown */}
              <div className="relative" ref={rulePageSizeRef}>
                <button
                  type="button"
                  onClick={() => setRulePageSizeDropdownOpen((prev) => !prev)}
                  className="border border-[#e5e6eb] rounded px-2 py-1 flex items-center gap-1 text-[12px] bg-white hover:border-[#2f54eb] cursor-pointer"
                >
                  <span>{rulePageSize} 条/页</span>
                  <ChevronDown className="w-3 h-3 text-[#86909c]" />
                </button>

                {rulePageSizeDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-1 bg-white border border-[#e5e6eb] rounded shadow-lg py-1 z-30 min-w-[90px]">
                    {[10, 20, 50].map((size) => (
                      <div
                        key={size}
                        onClick={() => {
                          setRulePageSize(size);
                          setRuleCurrentPage(1);
                          setRulePageSizeDropdownOpen(false);
                        }}
                        className={`px-3 py-1 text-[12px] cursor-pointer hover:bg-[#f2f3f5] ${
                          rulePageSize === size
                            ? 'text-[#2f54eb] font-medium bg-[#f0f5ff]'
                            : 'text-[#1d2129]'
                        }`}
                      >
                        {size} 条/页
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal - 新建 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[6px] shadow-2xl w-full max-w-[780px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e6eb]">
            <div className="px-5 py-3.5 border-b border-[#f2f3f5] flex items-center justify-between">
              <h3 className="font-semibold text-[15px] text-[#1d2129]">新建</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#86909c] hover:text-[#1d2129] p-1 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[13px] font-normal text-[#1d2129] mb-1.5">
                  任务名称<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskFormName}
                  onChange={(e) => setTaskFormName(e.target.value)}
                  placeholder="请输入"
                  className="w-full h-[34px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[13px] text-[#1d2129] placeholder-[#86909c]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[13px] font-normal text-[#1d2129] mb-1.5">
                  比对规则<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  value={taskFormRuleName}
                  onChange={(e) => setTaskFormRuleName(e.target.value)}
                  className="w-full h-[34px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb] text-[13px] text-[#1d2129] bg-white cursor-pointer"
                >
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.name}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual Upload Area: 模版文档 & 比对文档 */}
              <div className="pt-1">
                <label className="block text-[13px] font-normal text-[#1d2129] mb-2">
                  上传文件<span className="text-red-500 ml-0.5">*</span>
                </label>

                {/* Hidden inputs for direct file upload */}
                <input
                  type="file"
                  ref={templateFileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processLocalFile(e.target.files[0], 'template');
                    }
                  }}
                />
                <input
                  type="file"
                  ref={compareFileInputRef}
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      (Array.from(e.target.files) as File[]).forEach((file) =>
                        processLocalFile(file, 'compare')
                      );
                      e.target.value = '';
                    }
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: 模版文档 */}
                  <div>
                    <div className="text-[13.5px] font-medium text-[#1d2129] mb-2">
                      模版文档
                    </div>

                    {templateFile ? (
                      <div className="border border-[#d9e5fc] bg-[#f7faff] rounded-[6px] p-4 flex flex-col justify-between min-h-[220px]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-[6px] bg-[#e6f0ff] flex items-center justify-center shrink-0">
                            {templateFile.type === 'excel' ? (
                              <FileSpreadsheet className="w-6 h-6 text-[#107c41]" />
                            ) : (
                              <FileText className="w-6 h-6 text-[#2f54eb]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[#1d2129] truncate" title={templateFile.name}>
                              {templateFile.name}
                            </p>
                            <p className="text-[11.5px] text-[#86909c] mt-0.5">
                              大小：{templateFile.size}
                            </p>
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] rounded-[3px] text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>已就绪</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#e5edfa] flex items-center justify-between text-[12px]">
                          <button
                            type="button"
                            onClick={() => handleOpenMaterialModalForSlot('template')}
                            className="text-[#2f54eb] hover:underline cursor-pointer"
                          >
                            从素材库更换
                          </button>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => templateFileInputRef.current?.click()}
                              className="text-[#2f54eb] hover:underline cursor-pointer"
                            >
                              本地更换
                            </button>
                            <button
                              type="button"
                              onClick={() => setTemplateFile(null)}
                              className="text-[#f5222d] hover:underline cursor-pointer"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingTemplate(true);
                        }}
                        onDragLeave={() => setIsDraggingTemplate(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingTemplate(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processLocalFile(e.dataTransfer.files[0], 'template');
                          }
                        }}
                        onClick={() => handleOpenMaterialModalForSlot('template')}
                        className={`border border-dashed rounded-[6px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
                          isDraggingTemplate
                            ? 'border-[#2f54eb] bg-[#f0f5ff]'
                            : 'border-[#bfd4ff] bg-white hover:border-[#2f54eb] hover:bg-[#fcfdff]'
                        }`}
                      >
                        {/* Folder Upload Graphic */}
                        <div className="w-16 h-14 mb-2.5 relative flex items-center justify-center">
                          <div className="w-14 h-11 bg-gradient-to-b from-[#8eb8ff] to-[#3872e0] rounded-[6px] relative shadow-sm flex items-center justify-center">
                            <div className="absolute -top-1 left-1.5 w-6 h-2 bg-[#70a4fc] rounded-t-[3px]"></div>
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-[1px]">
                              <Upload className="w-4 h-4 text-white stroke-[2.5]" />
                            </div>
                          </div>
                        </div>

                        <p className="text-[13px] text-[#1d2129] font-normal">
                          点击或将文件拖拽到这里上传
                        </p>
                        <p className="text-[11px] text-[#86909c] mt-2 leading-relaxed max-w-[280px]">
                          可支持 .pdf, .doc, .docx, .txt, .jpg, .jpeg, .png, .tiff, .tif, .bmp, .xls, .xlsx, .et, .wps, .ppt, .pptx, .rtf, .dps, .ofd, .html 等多种格式文件
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: 比对文档 */}
                  <div>
                    <div className="text-[13.5px] font-medium text-[#1d2129] mb-2">
                      比对文档
                    </div>

                    {compareFiles.length > 0 ? (
                      <div className="border border-[#d9e5fc] bg-[#f7faff] rounded-[6px] p-3.5 flex flex-col min-h-[220px]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#4e5969]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#52c41a]" />
                            <span>已选择 {compareFiles.length} 份比对文档</span>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <button
                              type="button"
                              onClick={() => handleOpenMaterialModalForSlot('compare')}
                              className="text-[#2f54eb] hover:underline cursor-pointer"
                            >
                              从素材库添加
                            </button>
                            <button
                              type="button"
                              onClick={() => compareFileInputRef.current?.click()}
                              className="text-[#2f54eb] hover:underline cursor-pointer"
                            >
                              本地批量添加
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {compareFiles.map((file, index) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2.5 bg-white border border-[#e5edfa] rounded-[4px] px-2.5 py-2"
                            >
                              <div className="w-7 h-7 rounded-[4px] bg-[#e6f0ff] flex items-center justify-center shrink-0">
                                {file.type === 'excel' ? (
                                  <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
                                ) : (
                                  <FileText className="w-4 h-4 text-[#2f54eb]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-[12.5px] font-medium text-[#1d2129] truncate"
                                  title={file.name}
                                >
                                  {index + 1}. {file.name}
                                </p>
                                <p className="text-[11px] text-[#86909c] mt-0.5">
                                  大小：{file.size}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setCompareFiles((prev) =>
                                    prev.filter((item) => item.id !== file.id)
                                  )
                                }
                                className="text-[#f5222d] hover:underline cursor-pointer text-[11.5px] shrink-0"
                              >
                                删除
                              </button>
                            </div>
                          ))}
                        </div>

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingCompare(true);
                          }}
                          onDragLeave={() => setIsDraggingCompare(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingCompare(false);
                            if (e.dataTransfer.files) {
                              (
                                Array.from(e.dataTransfer.files) as File[]
                              ).forEach((file) => processLocalFile(file, 'compare'));
                            }
                          }}
                          onClick={() => compareFileInputRef.current?.click()}
                          className={`mt-3 border border-dashed rounded-[4px] py-2.5 flex items-center justify-center gap-1.5 text-[12px] cursor-pointer transition-colors ${
                            isDraggingCompare
                              ? 'border-[#2f54eb] bg-[#f0f5ff] text-[#2f54eb]'
                              : 'border-[#bfd4ff] text-[#4e5969] hover:text-[#2f54eb] hover:border-[#2f54eb]'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>拖入或点击添加更多比对文档</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingCompare(true);
                        }}
                        onDragLeave={() => setIsDraggingCompare(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingCompare(false);
                          if (e.dataTransfer.files) {
                            (
                              Array.from(e.dataTransfer.files) as File[]
                            ).forEach((file) => processLocalFile(file, 'compare'));
                          }
                        }}
                        onClick={() => handleOpenMaterialModalForSlot('compare')}
                        className={`border border-dashed rounded-[6px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
                          isDraggingCompare
                            ? 'border-[#2f54eb] bg-[#f0f5ff]'
                            : 'border-[#bfd4ff] bg-white hover:border-[#2f54eb] hover:bg-[#fcfdff]'
                        }`}
                      >
                        {/* Folder Upload Graphic */}
                        <div className="w-16 h-14 mb-2.5 relative flex items-center justify-center">
                          <div className="w-14 h-11 bg-gradient-to-b from-[#8eb8ff] to-[#3872e0] rounded-[6px] relative shadow-sm flex items-center justify-center">
                            <div className="absolute -top-1 left-1.5 w-6 h-2 bg-[#70a4fc] rounded-t-[3px]"></div>
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-[1px]">
                              <Upload className="w-4 h-4 text-white stroke-[2.5]" />
                            </div>
                          </div>
                        </div>

                        <p className="text-[13px] text-[#1d2129] font-normal">
                          点击或将文件拖拽到这里上传
                        </p>
                        <p className="text-[11px] text-[#86909c] mt-2 leading-relaxed max-w-[280px]">
                          支持一次选择多份文档进行批量比对
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f3f5] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 border border-[#d9d9d9] bg-white rounded-[4px] text-[13px] text-[#1d2129] hover:bg-[#f7f8fa] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2f54eb] hover:bg-[#1d39c4] text-white rounded-[4px] text-[13px] cursor-pointer font-normal"
                >
                  确定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Select Modal */}
      <MaterialSelectModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onConfirm={handleMaterialConfirmed}
        initiallySelectedIds={
          activeSlotForModal === 'template'
            ? templateFile ? [templateFile.id] : []
            : compareFiles.map((file) => file.id)
        }
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#e5e6eb]">
            <div className="px-5 py-3.5 border-b border-[#e5e6eb] flex items-center justify-between">
              <h3 className="font-semibold text-[15px] text-[#1d2129]">编辑任务</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-[#86909c] hover:text-[#1d2129] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block font-medium text-[#1d2129] mb-1.5">
                  <span className="text-red-500 mr-1">*</span>任务名称
                </label>
                <input
                  type="text"
                  required
                  value={taskFormName}
                  onChange={(e) => setTaskFormName(e.target.value)}
                  className="w-full h-[36px] px-3 border border-[#d9d9d9] rounded-[4px] focus:outline-none focus:border-[#2f54eb]"
                />
              </div>

              <div className="pt-3 border-t border-[#f2f3f5] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-[#d9d9d9] rounded-[4px] text-[#4e5969] hover:bg-[#f7f8fa] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2f54eb] hover:bg-[#1d39c4] text-white rounded-[4px] cursor-pointer font-medium"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 border border-[#e5e6eb] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#fff1f0] text-[#f5222d] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-[15px] text-[#1d2129]">
                确认删除任务
              </h4>
            </div>
            <p className="text-[13px] text-[#4e5969] mb-5">
              确定要删除任务「{deletingTask.name}」吗？此操作不可恢复。
            </p>
            <div className="flex items-center justify-end gap-2 text-[13px]">
              <button
                onClick={() => setDeletingTask(null)}
                className="px-3.5 py-1.5 border border-[#d9d9d9] rounded hover:bg-[#f7f8fa] text-[#4e5969] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteTask(deletingTask.id)}
                className="px-3.5 py-1.5 bg-[#f5222d] hover:bg-[#cf1322] text-white rounded cursor-pointer font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
