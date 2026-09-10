import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Download,
  FileText,
  Search,
  Menu,
  Minus,
  Plus,
} from 'lucide-react';

export interface DiffItemData {
  id: string;
  type: '修改' | '新增' | '删除';
  standardPrefix?: string;
  standardHighlight: string;
  standardSuffix?: string;
  comparePrefix?: string;
  compareHighlight: string;
  compareSuffix?: string;
  standardFullDisplay: React.ReactNode;
  compareFullDisplay: React.ReactNode;
  domIdSource: string;
  domIdTarget: string;
  ignored?: boolean;
}

interface DocTocItem {
  id: string;
  domId: string;
  label: string;
  content?: string;
}

const SOURCE_DOC_TOC: DocTocItem[] = [
  { id: 'src-toc-1', domId: 'src-block-1', label: '1. 30日内付款' },
  { id: 'src-toc-2', domId: 'src-block-2', label: '2. 你好' },
  { id: 'src-toc-3', domId: 'src-block-3', label: '3. 账' },
  {
    id: 'src-toc-4',
    domId: 'src-block-4',
    label: '4. 你好，天气晴朗。《平凡的世界》',
  },
  {
    id: 'src-toc-table',
    domId: 'src-table-block',
    label: '5. 表格（日期/星期/名称/金额）',
    content: '2026-8-8 星期五 招商 建行 23456778¥ 367920475¥',
  },
];

const TARGET_DOC_TOC: DocTocItem[] = [
  { id: 'tgt-toc-1', domId: 'tgt-block-1', label: '1. 一个月内付款' },
  { id: 'tgt-toc-2', domId: 'tgt-block-2', label: '2. 你好' },
  { id: 'tgt-toc-3', domId: 'tgt-block-3', label: '3. 帐' },
  {
    id: 'tgt-toc-4',
    domId: 'tgt-block-4',
    label: '4. 你好,天气晴朗.<平凡的世界>',
  },
  {
    id: 'tgt-toc-table',
    domId: 'tgt-table-block',
    label: '5. 表格（日期/星期/名称/金额）',
    content: '2026-8-7 星期四 建行 招商 23776778¥ 368820475¥',
  },
];

const SOURCE_DOC_AI_TOC: DocTocItem[] = [
  { id: 'src-ai-1', domId: 'src-block-1', label: '一、付款期限条款：30日内付款' },
  { id: 'src-ai-2', domId: 'src-block-2', label: '二、正文内容：你好' },
  { id: 'src-ai-3', domId: 'src-block-3', label: '三、用字规范：账' },
  {
    id: 'src-ai-4',
    domId: 'src-block-4',
    label: '四、标点及书名号：你好，天气晴朗。《平凡的世界》',
  },
  {
    id: 'src-ai-5',
    domId: 'src-table-block',
    label: '五、财务信息表：日期、星期、名称、金额',
  },
];

const TARGET_DOC_AI_TOC: DocTocItem[] = [
  { id: 'tgt-ai-1', domId: 'tgt-block-1', label: '一、付款期限条款：一个月内付款' },
  { id: 'tgt-ai-2', domId: 'tgt-block-2', label: '二、正文内容：你好' },
  { id: 'tgt-ai-3', domId: 'tgt-block-3', label: '三、用字规范：帐' },
  {
    id: 'tgt-ai-4',
    domId: 'tgt-block-4',
    label: '四、标点及尖括号：你好,天气晴朗.<平凡的世界>',
  },
  {
    id: 'tgt-ai-5',
    domId: 'tgt-table-block',
    label: '五、财务信息表：日期、星期、名称、金额',
  },
];

interface DocCatalogPanelProps {
  originalItems: DocTocItem[];
  aiItems: DocTocItem[];
  mode: 'catalog' | 'search';
  onModeChange: (mode: 'catalog' | 'search') => void;
  onJump: (domId: string) => void;
}

const DocCatalogPanel: React.FC<DocCatalogPanelProps> = ({
  originalItems,
  aiItems,
  mode,
  onModeChange,
  onJump,
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'ai'>('original');
  const [keyword, setKeyword] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  const currentItems =
    mode === 'catalog'
      ? activeTab === 'ai'
        ? aiItems
        : originalItems
      : originalItems;

  const matchItem = (item: DocTocItem, query: string) => {
    const haystack = `${item.label} ${item.content || ''}`;
    return caseSensitive
      ? haystack.includes(query)
      : haystack.toLowerCase().includes(query.toLowerCase());
  };

  const searchMatches = committedQuery.trim()
    ? currentItems.filter((item) => matchItem(item, committedQuery.trim()))
    : [];

  return (
    <div className="relative h-full w-[200px] shrink-0 bg-white flex flex-col border-r border-[#e5e6eb]">
      {/* 目录导航 / 文档搜索 */}
      <div className="flex items-stretch h-[38px] bg-[#f7f9fc] border-b border-[#e5e6eb] shrink-0">
        <button
          type="button"
          onClick={() => onModeChange('catalog')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[12.5px] border-r border-[#e5e6eb] transition-colors ${
            mode === 'catalog'
              ? 'bg-white text-[#2f54eb] font-medium'
              : 'text-[#4e5969] hover:bg-[#f2f3f5]'
          }`}
        >
          <Menu className="w-3.5 h-3.5" />
          目录导航
        </button>
        <button
          type="button"
          onClick={() => onModeChange('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[12.5px] transition-colors ${
            mode === 'search'
              ? 'bg-white text-[#2f54eb] font-medium'
              : 'text-[#4e5969] hover:bg-[#f2f3f5]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          文档搜索
        </button>
      </div>

      {mode === 'catalog' ? (
        <>
          {/* 原始目录 / AI 目录 */}
          <div className="flex items-center px-3 gap-4 h-[36px] border-b border-[#f2f3f5] shrink-0 bg-[#fafbfc]">
            {(['original', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-full text-[12.5px] border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-[#2f54eb] text-[#2f54eb] font-medium'
                    : 'border-transparent text-[#4e5969] hover:text-[#1d2129]'
                }`}
              >
                {tab === 'original' ? '原始目录' : 'AI 目录'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onJump(item.domId)}
                  className="w-full text-left px-4 py-2 text-[12.5px] text-[#4e5969] hover:bg-[#f0f5ff] hover:text-[#2f54eb] cursor-pointer leading-relaxed"
                >
                  {item.label}
                </button>
              ))
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="px-3 pt-3 pb-2 border-b border-[#f2f3f5] shrink-0 space-y-2">
            <label className="flex items-center gap-1.5 text-[12px] text-[#4e5969] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#2f54eb]"
              />
              区分大小写
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#86909c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCommittedQuery('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCommittedQuery(keyword.trim());
                  }
                }}
                placeholder="按 Enter 键检索"
                className="w-full h-[30px] pl-8 pr-3 border border-[#e5e6eb] rounded-[4px] text-[12.5px] focus:outline-none focus:border-[#2f54eb] placeholder-[#a5abb6]"
              />
            </div>
            <p className="text-[12px] text-[#86909c]">
              共找到 {searchMatches.length} 条结果
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {searchMatches.length > 0 ? (
              searchMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onJump(item.domId)}
                  className="w-full text-left px-3 py-2 text-[12.5px] text-[#4e5969] hover:bg-[#f0f5ff] hover:text-[#2f54eb] cursor-pointer leading-relaxed border-b border-[#f7f8fa]"
                >
                  <span className="block font-medium text-[#1d2129]">
                    {item.label}
                  </span>
                  {item.content && (
                    <span className="block mt-0.5 text-[11px] text-[#86909c] line-clamp-1">
                      {item.content}
                    </span>
                  )}
                </button>
              ))
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

type DocPanelMode = 'catalog' | 'search';

interface DocPanelState {
  open: boolean;
  mode: DocPanelMode;
}

export interface TaskDetailProps {
  task: {
    id: string;
    name: string;
    status: string;
    createTime: string;
    creator: string;
    finishTime: string;
    sourceFile?: string;
    ruleName?: string;
    targetFile?: string;
    targetFiles?: string[];
    targetFileSimilarities?: Record<string, number>;
    diffCount?: number;
  };
  onBack: () => void;
  onMarkReviewed?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
  onPrevTask?: () => void;
  onNextTask?: () => void;
  hasPrevTask?: boolean;
  hasNextTask?: boolean;
}

export const TaskComparisonDetail: React.FC<TaskDetailProps> = ({
  task,
  onBack,
  onMarkReviewed,
  onRetryTask,
  onPrevTask,
  onNextTask,
  hasPrevTask = false,
  hasNextTask = true,
}) => {
  // Top bar controls
  const [isAudited, setIsAudited] = useState(task.status === '已复核');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'none' | 'generating' | 'ready'>('none');
  const [commentStatus, setCommentStatus] = useState<'none' | 'generating' | 'ready'>('none');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isDiffSidebarCollapsed, setIsDiffSidebarCollapsed] = useState(false);
  const [tocPanels, setTocPanels] = useState<{
    left: DocPanelState;
    right: DocPanelState;
  }>({
    left: { open: false, mode: 'catalog' },
    right: { open: false, mode: 'catalog' },
  });

  const toggleDocPanel = (
    side: 'left' | 'right',
    mode: DocPanelMode
  ) => {
    setTocPanels((prev) => {
      const current = prev[side];
      if (current.open && current.mode === mode) {
        return { ...prev, [side]: { ...current, open: false } };
      }
      return { ...prev, [side]: { open: true, mode } };
    });
  };

  // Zoom & Page state
  const [leftZoom, setLeftZoom] = useState(100);
  const [rightZoom, setRightZoom] = useState(100);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const totalPages = 1;

  // Right sidebar filter state
  const [diffFilter, setDiffFilter] = useState('全部差异');
  const [diffDropdownOpen, setDiffDropdownOpen] = useState(false);
  const [activeTargetIndex, setActiveTargetIndex] = useState(0);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  useEffect(() => {
    setActiveTargetIndex(0);
    setDocDropdownOpen(false);
  }, [task.id]);

  useEffect(() => {
    setIsAudited(task.status === '已复核');
  }, [task.id, task.status]);

  useEffect(() => {
    if (!downloadMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.download-menu-anchor')) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [downloadMenuOpen]);

  // Active selected diff item
  const [activeDiffId, setActiveDiffId] = useState<string>('diff-1');

  // Container refs for connector positioning and scrolling
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef<boolean>(false);
  const [scrollSyncEnabled] = useState(true);

  useEffect(() => {
    const fitDocumentToPane = (
      ref: React.RefObject<HTMLDivElement | null>,
      setZoom: React.Dispatch<React.SetStateAction<number>>
    ) => {
      const container = ref.current;
      if (!container) return;
      const availableWidth = container.clientWidth - 96;
      const nextScale = Math.min(2, Math.max(0.5, availableWidth / 580));
      setZoom(Math.round(nextScale * 100));
    };
    fitDocumentToPane(leftScrollRef, setLeftZoom);
    fitDocumentToPane(rightScrollRef, setRightZoom);
  }, [tocPanels.left.open, tocPanels.right.open]);

  // Connector line coordinates
  const [connectorCoords, setConnectorCoords] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    visible: boolean;
  }>({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });

  // 表格行中的多组差异拆成独立条目，一个元素对应一个卡片
  const [diffItems, setDiffItems] = useState<DiffItemData[]>([
    {
      id: 'diff-1',
      type: '修改',
      standardHighlight: '30日',
      compareHighlight: '一个月',
      standardFullDisplay: <span className="text-[#fa8c16]">30日</span>,
      compareFullDisplay: <span className="text-[#fa8c16]">一个月</span>,
      domIdSource: 'src-diff-1',
      domIdTarget: 'tgt-diff-1',
    },
    {
      id: 'diff-2',
      type: '修改',
      standardHighlight: '账',
      compareHighlight: '帐',
      standardFullDisplay: <span className="text-[#fa8c16]">账</span>,
      compareFullDisplay: <span className="text-[#fa8c16]">帐</span>,
      domIdSource: 'src-diff-2',
      domIdTarget: 'tgt-diff-2',
    },
    {
      id: 'diff-3',
      type: '修改',
      standardHighlight: '》',
      compareHighlight: '>',
      standardFullDisplay: <span className="text-[#fa8c16]">》</span>,
      compareFullDisplay: <span className="text-[#fa8c16]">&gt;</span>,
      domIdSource: 'src-diff-3',
      domIdTarget: 'tgt-diff-3',
    },
    {
      id: 'diff-4',
      type: '修改',
      standardHighlight: '。《',
      compareHighlight: '. <',
      standardFullDisplay: <span className="text-[#fa8c16]">。《</span>,
      compareFullDisplay: <span className="text-[#fa8c16]">. &lt;</span>,
      domIdSource: 'src-diff-4',
      domIdTarget: 'tgt-diff-4',
    },
    {
      id: 'diff-5',
      type: '修改',
      standardHighlight: '8',
      compareHighlight: '7',
      standardFullDisplay: (
        <span>
          2026-8-<span className="text-[#fa8c16]">8</span>
        </span>
      ),
      compareFullDisplay: (
        <span>
          2026-8-<span className="text-[#fa8c16]">7</span>
        </span>
      ),
      domIdSource: 'src-diff-5',
      domIdTarget: 'tgt-diff-5',
    },
    {
      id: 'diff-6',
      type: '修改',
      standardHighlight: '五',
      compareHighlight: '四',
      standardFullDisplay: (
        <span>
          星期<span className="text-[#fa8c16]">五</span>
        </span>
      ),
      compareFullDisplay: (
        <span>
          星期<span className="text-[#fa8c16]">四</span>
        </span>
      ),
      domIdSource: 'src-diff-6',
      domIdTarget: 'tgt-diff-6',
    },
    {
      id: 'diff-7',
      type: '修改',
      standardHighlight: '招商',
      compareHighlight: '建行',
      standardFullDisplay: (
        <span>
          <span className="text-[#fa8c16]">招商</span>
        </span>
      ),
      compareFullDisplay: (
        <span>
          <span className="text-[#fa8c16]">建行</span>
        </span>
      ),
      domIdSource: 'src-diff-7',
      domIdTarget: 'tgt-diff-7',
    },
    {
      id: 'diff-8',
      type: '修改',
      standardHighlight: '建行',
      compareHighlight: '招商',
      standardFullDisplay: (
        <span>
          <span className="text-[#fa8c16]">建行</span>
        </span>
      ),
      compareFullDisplay: (
        <span>
          <span className="text-[#fa8c16]">招商</span>
        </span>
      ),
      domIdSource: 'src-diff-8',
      domIdTarget: 'tgt-diff-8',
    },
    {
      id: 'diff-9',
      type: '修改',
      standardHighlight: '45',
      compareHighlight: '77',
      standardFullDisplay: (
        <span>
          23<span className="text-[#fa8c16]">45</span>6778¥
        </span>
      ),
      compareFullDisplay: (
        <span>
          23<span className="text-[#fa8c16]">77</span>6778¥
        </span>
      ),
      domIdSource: 'src-diff-9',
      domIdTarget: 'tgt-diff-9',
    },
    {
      id: 'diff-10',
      type: '修改',
      standardHighlight: '79',
      compareHighlight: '88',
      standardFullDisplay: (
        <span>
          36<span className="text-[#fa8c16]">79</span>20475¥
        </span>
      ),
      compareFullDisplay: (
        <span>
          36<span className="text-[#fa8c16]">88</span>20475¥
        </span>
      ),
      domIdSource: 'src-diff-10',
      domIdTarget: 'tgt-diff-10',
    },
  ]);

  // Calculate connector line coordinates based on active diff
  const updateConnectorLine = () => {
    if (!mainContainerRef.current) return;
    const activeItem = diffItems.find((d) => d.id === activeDiffId);
    if (!activeItem || !activeItem.domIdSource || !activeItem.domIdTarget) {
      setConnectorCoords((prev) => ({ ...prev, visible: false }));
      return;
    }

    const srcEl = document.getElementById(activeItem.domIdSource);
    const tgtEl = document.getElementById(activeItem.domIdTarget);

    if (!srcEl || !tgtEl) {
      setConnectorCoords((prev) => ({ ...prev, visible: false }));
      return;
    }

    const containerRect = mainContainerRef.current.getBoundingClientRect();
    const srcRect = srcEl.getBoundingClientRect();
    const tgtRect = tgtEl.getBoundingClientRect();

    const x1 = srcRect.right - containerRect.left;
    const y1 = srcRect.top + srcRect.height / 2 - containerRect.top;
    const x2 = tgtRect.left - containerRect.left;
    const y2 = tgtRect.top + tgtRect.height / 2 - containerRect.top;

    setConnectorCoords({
      x1,
      y1,
      x2,
      y2,
      visible: true,
    });
  };

  useLayoutEffect(() => {
    updateConnectorLine();
    window.addEventListener('resize', updateConnectorLine);
    return () => window.removeEventListener('resize', updateConnectorLine);
  }, [activeDiffId, leftZoom, rightZoom]);

  // Synchronous scroll handling
  const handleLeftScroll = () => {
    if (!scrollSyncEnabled || isScrollingSyncRef.current) return;
    if (scrollSyncEnabled && leftScrollRef.current && rightScrollRef.current) {
      isScrollingSyncRef.current = true;
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
      rightScrollRef.current.scrollLeft = leftScrollRef.current.scrollLeft;
      updateConnectorLine();
      setTimeout(() => {
        isScrollingSyncRef.current = false;
      }, 50);
    }
  };

  const handleRightScroll = () => {
    if (!scrollSyncEnabled || isScrollingSyncRef.current) return;
    if (scrollSyncEnabled && leftScrollRef.current && rightScrollRef.current) {
      isScrollingSyncRef.current = true;
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
      leftScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
      updateConnectorLine();
      setTimeout(() => {
        isScrollingSyncRef.current = false;
      }, 50);
    }
  };

  // Scroll to diff and make active
  const scrollToDiff = (diffId: string) => {
    setActiveDiffId(diffId);
    const item = diffItems.find((d) => d.id === diffId);
    if (item && item.domIdSource && item.domIdTarget) {
      const srcEl = document.getElementById(item.domIdSource);
      const tgtEl = document.getElementById(item.domIdTarget);
      if (srcEl && leftScrollRef.current) {
        srcEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (tgtEl && rightScrollRef.current) {
        tgtEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setTimeout(updateConnectorLine, 120);
  };

  const scrollToTocItem = (side: 'left' | 'right', domId: string) => {
    setTocPanels((prev) => ({
      ...prev,
      [side]: { ...prev[side], open: false },
    }));
    const containerRef = side === 'left' ? leftScrollRef : rightScrollRef;
    const el = document.getElementById(domId);
    if (containerRef.current && el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleIgnoreDiff = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDiffItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ignored: !item.ignored } : item
      )
    );
  };

  const showActionMessage = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2400);
  };

  const generateDownloadArtifact = (
    type: 'report' | 'comment',
    label: string
  ) => {
    setDownloadMenuOpen(false);
    const setStatus =
      type === 'report' ? setReportStatus : setCommentStatus;
    setStatus('generating');
    showActionMessage(`正在生成${label}…`);
    setTimeout(() => {
      setStatus('ready');
      showActionMessage(`${label}已生成，可在下载菜单中导出`);
    }, 1200);
  };

  const exportDownloadArtifact = (label: string) => {
    setDownloadMenuOpen(false);
    showActionMessage(`${label}已开始导出`);
  };

  const sourceFileName = task.sourceFile || '测1.docx';
  const targetFileOptions =
    task.targetFiles && task.targetFiles.length > 0
      ? task.targetFiles
      : [task.targetFile || '测2.docx'];
  const targetFileName =
    targetFileOptions[Math.min(activeTargetIndex, targetFileOptions.length - 1)] ||
    targetFileOptions[0] ||
    '测2.docx';
  const targetSimilarity =
    task.targetFileSimilarities?.[targetFileName] ??
    (targetFileOptions.length > 1
      ? Number((99.4 - activeTargetIndex * 0.35).toFixed(2))
      : 54.1);
  const isClauseDiff = (id: string) => /^diff-[1-4]$/.test(id);
  const getDiffCategory = (item: DiffItemData) => {
    if (item.type === '新增') return '新增条款';
    if (item.type === '删除') return '删除条款';
    return isClauseDiff(item.id) ? '条款差异' : '表格差异';
  };
  const diffFilterOptions = [
    ['全部差异', diffItems.length],
    ['新增条款', diffItems.filter((item) => item.type === '新增').length],
    ['删除条款', diffItems.filter((item) => item.type === '删除').length],
    [
      '条款差异',
      diffItems.filter((item) => getDiffCategory(item) === '条款差异').length,
    ],
    [
      '表格差异',
      diffItems.filter((item) => getDiffCategory(item) === '表格差异').length,
    ],
    ['印章差异', 0],
    ['相同条款', 0],
    ['人工忽略', diffItems.filter((item) => item.ignored).length],
  ] as [string, number][];
  const filteredDiffItems = diffItems.filter((item) => {
    if (diffFilter === '全部差异') return true;
    if (diffFilter === '人工忽略') return Boolean(item.ignored);
    return getDiffCategory(item) === diffFilter;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f7f8fa] text-[#1d2129] overflow-hidden select-none font-sans">
      {actionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] bg-[#1d2129]/95 text-white text-[12.5px] px-4 py-2 rounded shadow-lg">
          {actionToast}
        </div>
      )}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <header className="h-[44px] bg-white border-b border-[#e5e6eb] px-3 flex items-center justify-between shrink-0 z-20">
        {/* Left Controls: Back, View toggles, Fullscreen, Task Prev/Next */}
        <div className="flex items-center gap-2 text-[#4e5969] text-[13px]">
          {/* Back Icon Button */}
          <button
            onClick={onBack}
            className="p-1 text-[#4e5969] hover:text-[#1d2129] hover:bg-[#f2f3f5] rounded cursor-pointer transition-colors"
            title="返回任务列表"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Prev/Next, Rule, Doc & Similarity, Re-compare, Mark as Reviewed */}
        <div className="flex items-center gap-2.5">
          {/* Prev / Next Task Navigation */}
          <div className="flex items-center gap-3 text-[13px] mr-1">
            <button
              onClick={onPrevTask}
              disabled={!hasPrevTask}
              className={`flex items-center gap-0.5 transition-colors ${
                hasPrevTask
                  ? 'text-[#4e5969] hover:text-[#1d2129] cursor-pointer'
                  : 'text-[#c9cdd4] cursor-not-allowed'
              }`}
            >
              <span>|&lt; 上一篇</span>
            </button>
            <button
              onClick={onNextTask}
              disabled={!hasNextTask}
              className={`flex items-center gap-0.5 transition-colors ${
                hasNextTask
                  ? 'text-[#4e5969] hover:text-[#1d2129] cursor-pointer'
                  : 'text-[#c9cdd4] cursor-not-allowed'
              }`}
            >
              <span>下一篇 &gt;|</span>
            </button>
            <div className="h-3.5 w-[1px] bg-[#e5e6eb] ml-1" />
          </div>

          {/* Rule Selector / Label */}
          <div className="text-[12.5px] text-[#4e5969] flex items-center whitespace-nowrap">
            <span>比对规则:</span>
            <span className="text-[#1d2129] font-medium ml-1">
              {task.ruleName || '版本迭代比对-默认规则'}
            </span>
          </div>

          {/* Combined Doc & Similarity Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDocDropdownOpen((open) => !open)}
              className="h-[28px] px-2 bg-white border border-[#d9d9d9] hover:border-[#2f54eb] rounded-[3px] flex items-center gap-1.5 text-[12px] transition-colors cursor-pointer"
            >
              <span className="text-[#4e5969]">文档:</span>
              <span className="text-[#1d2129] font-medium max-w-[220px] truncate">
                {targetFileName}
              </span>
              <span className="flex items-center gap-0.5 text-[#1890ff] bg-[#e6f7ff] px-1.5 py-0.5 rounded text-[11.5px] font-medium ml-1">
                {targetSimilarity}%
                <ChevronDown className="w-3 h-3" />
              </span>
            </button>

            {docDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDocDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-[320px] bg-white border border-[#e5e6eb] rounded-[6px] shadow-lg py-1 z-30 max-h-[260px] overflow-y-auto">
                  {targetFileOptions.map((file, index) => {
                    const fileSimilarity =
                      task.targetFileSimilarities?.[file] ??
                      (targetFileOptions.length > 1
                        ? Number((99.4 - index * 0.35).toFixed(2))
                        : 54.1);
                    const isActive = index === activeTargetIndex;
                    return (
                      <button
                        key={file}
                        type="button"
                        onClick={() => {
                          setActiveTargetIndex(index);
                          setDocDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#f0f5ff] text-[#2f54eb]'
                            : 'text-[#1d2129] hover:bg-[#f7f8fa]'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0 text-[#86909c]" />
                        <span className="flex-1 min-w-0 truncate text-[12.5px]">
                          {file}
                        </span>
                        <span
                          className={`shrink-0 text-[11.5px] ${
                            isActive ? 'text-[#2f54eb]' : 'text-[#1890ff]'
                          }`}
                        >
                          {fileSimilarity}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Re-compare Button */}
          <button
            onClick={() => {
              if (onRetryTask) {
                onRetryTask(task.id);
              }
              showActionMessage('已重新发起比对，任务重新进入队列');
            }}
            className="h-[28px] px-2.5 bg-white border border-[#d9d9d9] text-[#1d2129] rounded-[3px] text-[12.5px] hover:bg-[#fafafa] hover:border-[#bfbfbf] transition-colors cursor-pointer"
          >
            重新比对
          </button>

          {/* Mark as Reviewed Button */}
          <button
            onClick={() => {
              if (!isAudited) {
                setIsAudited(true);
                if (onMarkReviewed) {
                  onMarkReviewed(task.id);
                }
                showActionMessage('已标记为审核');
              }
            }}
            disabled={isAudited}
            className={`h-[28px] px-3 text-white rounded-[3px] text-[12.5px] font-medium transition-colors ${
              isAudited
                ? 'bg-[#52c41a] cursor-default'
                : 'bg-[#2f54eb] hover:bg-[#1d39c4] cursor-pointer'
            }`}
          >
            {isAudited ? '已标记审核' : '标记为审核'}
          </button>

          {/* Download / Export Dropdown */}
          <div className="download-menu-anchor relative">
            <button
              onClick={() => {
                setDownloadMenuOpen((open) => !open);
                setDocDropdownOpen(false);
              }}
              className="w-[28px] h-[28px] flex items-center justify-center bg-white border border-[#d9d9d9] text-[#4e5969] rounded-[3px] hover:bg-[#fafafa] hover:text-[#1d2129] transition-colors cursor-pointer"
              title="下载/导出"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {downloadMenuOpen && (
              <div className="absolute right-0 top-[30px] w-[170px] bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-50 text-[13px]">
                <button
                  type="button"
                  disabled={reportStatus === 'generating'}
                  onClick={() => generateDownloadArtifact('report', '差异报告')}
                  className="w-full text-left px-3 py-1.5 text-[#1d2129] hover:bg-[#f7f8fa] transition-colors cursor-pointer disabled:text-[#c9cdd4] disabled:cursor-not-allowed"
                >
                  {reportStatus === 'generating' ? '正在生成…' : '生成差异报告'}
                </button>
                <button
                  type="button"
                  disabled={reportStatus !== 'ready'}
                  title={
                    reportStatus === 'ready'
                      ? ''
                      : reportStatus === 'generating'
                      ? '差异报告生成中'
                      : '任务未生成差异报告'
                  }
                  onClick={() => exportDownloadArtifact('差异报告')}
                  className="w-full text-left px-3 py-1.5 text-[#1d2129] hover:bg-[#f7f8fa] transition-colors disabled:text-[#c9cdd4] disabled:cursor-not-allowed"
                >
                  导出差异报告
                </button>
                <div className="h-px bg-[#f2f3f5] my-1" />
                <button
                  type="button"
                  disabled={commentStatus === 'generating'}
                  onClick={() => generateDownloadArtifact('comment', '批注文件')}
                  className="w-full text-left px-3 py-1.5 text-[#1d2129] hover:bg-[#f7f8fa] transition-colors cursor-pointer disabled:text-[#c9cdd4] disabled:cursor-not-allowed"
                >
                  {commentStatus === 'generating' ? '正在生成…' : '生成批注文件'}
                </button>
                <button
                  type="button"
                  disabled={commentStatus !== 'ready'}
                  title={
                    commentStatus === 'ready'
                      ? ''
                      : commentStatus === 'generating'
                      ? '批注文件生成中'
                      : '任务未生成批注文件'
                  }
                  onClick={() => exportDownloadArtifact('批注文件')}
                  className="w-full text-left px-3 py-1.5 text-[#1d2129] hover:bg-[#f7f8fa] transition-colors disabled:text-[#c9cdd4] disabled:cursor-not-allowed"
                >
                  导出批注文件
                </button>
                <div className="h-px bg-[#f2f3f5] my-1" />
                <button
                  type="button"
                  onClick={() => exportDownloadArtifact('原文件')}
                  className="w-full text-left px-3 py-1.5 text-[#1d2129] hover:bg-[#f7f8fa] transition-colors cursor-pointer"
                >
                  导出原文件
                </button>
              </div>
            )}
          </div>

          {/* Report / History Button */}
          <button
            onClick={() => setIsDiffSidebarCollapsed(!isDiffSidebarCollapsed)}
            className="w-[28px] h-[28px] flex items-center justify-center bg-white border border-[#d9d9d9] text-[#4e5969] rounded-[3px] hover:bg-[#fafafa] hover:text-[#1d2129] transition-colors cursor-pointer"
            title={isDiffSidebarCollapsed ? '展开差异点列表' : '收起差异点列表'}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 文档工作区：标题栏与双栏预览共用左侧区域，不延伸到右侧差异列表 */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-white">

      {/* ========================================================================= */}
      {/* 2. SUB-HEADER TOOLBAR (Document Titles, Scale & Page Nav)                 */}
      {/* ========================================================================= */}
      <div className="relative h-[36px] bg-white border-b border-[#e5e6eb] flex items-center shrink-0 z-10">
        {/* Left Document Title & Zoom/Page Controls */}
        <div className="flex-1 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <button
              type="button"
              title="目录"
              onClick={() => toggleDocPanel('left', 'catalog')}
              className="p-0.5 text-[#86909c] hover:text-[#1d2129] cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
            <div className="w-4 h-4 bg-[#ff4d4f]/10 text-[#ff4d4f] rounded-[2px] flex items-center justify-center text-[10px] font-bold border border-[#ff4d4f]/30">
              W
            </div>
            <span className="text-[#1d2129] truncate max-w-[320px]">{sourceFileName}</span>
          </div>

          <div className="flex items-center gap-1 text-[12px] text-[#4e5969]">
            <button
              onClick={() => setLeftZoom((z) => Math.max(50, z - 10))}
              className="w-4 h-4 flex items-center justify-center hover:bg-[#f0f2f5] rounded cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="border border-[#d9d9d9] bg-white rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer">
              <span>{leftZoom}%</span>
              <ChevronDown className="w-3 h-3 text-[#86909c]" />
            </div>
            <button
              onClick={() => setLeftZoom((z) => Math.min(200, z + 10))}
              className="w-4 h-4 flex items-center justify-center hover:bg-[#f0f2f5] rounded cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>

            <div className="h-3 w-[1px] bg-[#e5e6eb] mx-1" />

            <button
              onClick={() => setLeftPage(1)}
              disabled={leftPage <= 1}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              |&lt;
            </button>
            <button
              onClick={() => setLeftPage((p) => Math.max(1, p - 1))}
              disabled={leftPage <= 1}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &lt;
            </button>
            <div className="flex items-center gap-1 mx-0.5">
              <span className="px-2 py-0.5 border border-[#d9d9d9] bg-white rounded text-[11px] text-[#1d2129]">
                {leftPage}
              </span>
              <span className="text-[#86909c]">/ {totalPages}</span>
            </div>
            <button
              onClick={() => setLeftPage((p) => Math.min(totalPages, p + 1))}
              disabled={leftPage >= totalPages}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &gt;
            </button>
            <button
              onClick={() => setLeftPage(totalPages)}
              disabled={leftPage >= totalPages}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &gt;|
            </button>

            <button
              onClick={() => toggleDocPanel('left', 'search')}
              className="p-1 hover:bg-[#f0f2f5] rounded text-[#86909c] hover:text-[#1d2129] ml-1 cursor-pointer"
              title="文档搜索"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Document Title & Zoom/Page Controls */}
        <div className="flex-1 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <button
              type="button"
              title="目录"
              onClick={() => toggleDocPanel('right', 'catalog')}
              className="p-0.5 text-[#86909c] hover:text-[#1d2129] cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
            <div className="w-4 h-4 bg-[#ff4d4f]/10 text-[#ff4d4f] rounded-[2px] flex items-center justify-center text-[10px] font-bold border border-[#ff4d4f]/30">
              W
            </div>
            <span className="text-[#1d2129] truncate max-w-[320px]">{targetFileName}</span>
          </div>

          <div className="flex items-center gap-1 text-[12px] text-[#4e5969]">
            <button
              onClick={() => setRightZoom((z) => Math.max(50, z - 10))}
              className="w-4 h-4 flex items-center justify-center hover:bg-[#f0f2f5] rounded cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="border border-[#d9d9d9] bg-white rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer">
              <span>{rightZoom}%</span>
              <ChevronDown className="w-3 h-3 text-[#86909c]" />
            </div>
            <button
              onClick={() => setRightZoom((z) => Math.min(200, z + 10))}
              className="w-4 h-4 flex items-center justify-center hover:bg-[#f0f2f5] rounded cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>

            <div className="h-3 w-[1px] bg-[#e5e6eb] mx-1" />

            <button
              onClick={() => setRightPage(1)}
              disabled={rightPage <= 1}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              |&lt;
            </button>
            <button
              onClick={() => setRightPage((p) => Math.max(1, p - 1))}
              disabled={rightPage <= 1}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &lt;
            </button>
            <div className="flex items-center gap-1 mx-0.5">
              <span className="px-2 py-0.5 border border-[#d9d9d9] bg-white rounded text-[11px] text-[#1d2129]">
                {rightPage}
              </span>
              <span className="text-[#86909c]">/ {totalPages}</span>
            </div>
            <button
              onClick={() => setRightPage((p) => Math.min(totalPages, p + 1))}
              disabled={rightPage >= totalPages}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &gt;
            </button>
            <button
              onClick={() => setRightPage(totalPages)}
              disabled={rightPage >= totalPages}
              className="px-0.5 text-[#86909c] hover:text-[#1d2129] disabled:opacity-30 cursor-pointer"
            >
              &gt;|
            </button>

            <button
              onClick={() => toggleDocPanel('right', 'search')}
              className="p-1 hover:bg-[#f0f2f5] rounded text-[#86909c] hover:text-[#1d2129] ml-1 cursor-pointer"
              title="文档搜索"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE (Split Document Canvas + Right Side Diff Cards)        */}
      {/* ========================================================================= */}
      <div
        className="flex-1 flex overflow-hidden relative bg-[#f7f8fa]"
        ref={mainContainerRef}
      >
        {/* Left & Right Comparison Workspace (Split View) */}
        <div className="flex-1 flex relative overflow-hidden bg-[#fafafa]">
          {/* Dynamic SVG Connection Line between Source & Target Highlight */}
          {connectorCoords.visible && (
            <svg
              className="absolute inset-0 pointer-events-none z-10 w-full h-full"
              style={{ overflow: 'visible' }}
            >
              <line
                x1={connectorCoords.x1}
                y1={connectorCoords.y1}
                x2={connectorCoords.x2}
                y2={connectorCoords.y2}
                stroke="#faad14"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            </svg>
          )}

          {/* Left Document: 测1.docx */}
          <div className="relative flex-1 flex bg-white border-r border-[#e5e6eb] overflow-hidden">
            {tocPanels.left.open && (
              <DocCatalogPanel
                originalItems={SOURCE_DOC_TOC}
                aiItems={SOURCE_DOC_AI_TOC}
                mode={tocPanels.left.mode}
                onModeChange={(mode) =>
                  setTocPanels((prev) => ({
                    ...prev,
                    left: { ...prev.left, mode },
                  }))
                }
                onJump={(domId) => scrollToTocItem('left', domId)}
              />
            )}
            {/* Left Document Paper Canvas */}
            <div
              ref={leftScrollRef}
              onScroll={handleLeftScroll}
              className="flex-1 min-w-0 overflow-auto p-12 flex justify-center items-start"
            >
              <div
                style={{
                  transform: `scale(${leftZoom / 100})`,
                  transformOrigin: 'top center',
                }}
                className="w-[580px] min-h-[640px] bg-white text-[13px] text-[#1d2129] leading-relaxed transition-transform duration-100 font-sans"
              >
                <div className="space-y-1 mb-4 text-[13px]">
                  {/* Line 1: 1. 30日 内付款 */}
                  <div id="src-block-1">
                    <span className="font-bold">1.</span>
                    <span
                      id="src-diff-1"
                      onClick={() => scrollToDiff('diff-1')}
                      className="text-[#fa8c16] font-medium cursor-pointer"
                    >
                      30日
                    </span>{' '}
                    内付款
                  </div>

                  {/* Line 2 */}
                  <div id="src-block-2">
                    <span className="font-bold">2.</span>你好
                  </div>

                  {/* Line 3: 3.账 */}
                  <div id="src-block-3">
                    <span className="font-bold">3.</span>
                    <span
                      id="src-diff-2"
                      onClick={() => scrollToDiff('diff-2')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      账
                    </span>
                  </div>

                  {/* Line 4: 4. 你好，天气晴朗。《平凡的世界》 */}
                  <div id="src-block-4">
                    <span className="font-bold">4.</span> 你好，天气晴朗。
                    <span
                      id="src-diff-4"
                      onClick={() => scrollToDiff('diff-4')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      。《
                    </span>
                    平凡的世界
                    <span
                      id="src-diff-3"
                      onClick={() => scrollToDiff('diff-3')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      》
                    </span>
                  </div>
                </div>

                {/* Table Section */}
                <table
                  id="src-table-block"
                  className="w-full border-collapse border border-[#262626] text-[12px] mt-2"
                >
                  <tbody>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 w-14 font-normal text-[#1d2129]">
                        日期
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        2026-8-
                        <span
                          id="src-diff-5"
                          onClick={() => scrollToDiff('diff-5')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          8
                        </span>
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        星期
                        <span
                          id="src-diff-6"
                          onClick={() => scrollToDiff('diff-6')}
                          className="text-[#fa8c16] font-medium ml-0.5 cursor-pointer"
                        >
                          五
                        </span>
                      </td>
                    </tr>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 font-normal text-[#1d2129]">
                        名称
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        <span
                          id="src-diff-7"
                          onClick={() => scrollToDiff('diff-7')}
                          className="text-[#fa8c16] cursor-pointer"
                        >
                          招商
                        </span>
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        <span
                          id="src-diff-8"
                          onClick={() => scrollToDiff('diff-8')}
                          className="text-[#fa8c16] cursor-pointer"
                        >
                          建行
                        </span>
                      </td>
                    </tr>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 font-normal text-[#1d2129]">
                        金额
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        23
                        <span
                          id="src-diff-9"
                          onClick={() => scrollToDiff('diff-9')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          45
                        </span>
                        6778¥
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        36
                        <span
                          id="src-diff-10"
                          onClick={() => scrollToDiff('diff-10')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          79
                        </span>
                        20475¥
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Document: 测2.docx */}
          <div className="relative flex-1 flex bg-white border-r border-[#e5e6eb] overflow-hidden">
            {tocPanels.right.open && (
              <DocCatalogPanel
                originalItems={TARGET_DOC_TOC}
                aiItems={TARGET_DOC_AI_TOC}
                mode={tocPanels.right.mode}
                onModeChange={(mode) =>
                  setTocPanels((prev) => ({
                    ...prev,
                    right: { ...prev.right, mode },
                  }))
                }
                onJump={(domId) => scrollToTocItem('right', domId)}
              />
            )}
            {/* Right Document Paper Canvas */}
            <div
              ref={rightScrollRef}
              onScroll={handleRightScroll}
              className="flex-1 min-w-0 overflow-auto p-12 flex justify-center items-start"
            >
              <div
                style={{
                  transform: `scale(${rightZoom / 100})`,
                  transformOrigin: 'top center',
                }}
                className="w-[580px] min-h-[640px] bg-white text-[13px] text-[#1d2129] leading-relaxed transition-transform duration-100 font-sans"
              >
                <div className="space-y-1 mb-4 text-[13px]">
                  {/* Line 1: 1. 一个月 内付款 */}
                  <div id="tgt-block-1">
                    <span className="font-bold">1.</span>
                    <span
                      id="tgt-diff-1"
                      onClick={() => scrollToDiff('diff-1')}
                      className="text-[#fa8c16] font-medium cursor-pointer"
                    >
                      一个月
                    </span>{' '}
                    内付款
                  </div>

                  {/* Line 2 */}
                  <div id="tgt-block-2">
                    <span className="font-bold">2.</span>你好
                  </div>

                  {/* Line 3: 3.帐 */}
                  <div id="tgt-block-3">
                    <span className="font-bold">3.</span>
                    <span
                      id="tgt-diff-2"
                      onClick={() => scrollToDiff('diff-2')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      帐
                    </span>
                  </div>

                  {/* Line 4: 4. 你好,天气晴朗。<平凡的世界> */}
                  <div id="tgt-block-4">
                    <span className="font-bold">4.</span> 你好,天气晴朗。
                    <span
                      id="tgt-diff-4"
                      onClick={() => scrollToDiff('diff-4')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      .&lt;
                    </span>
                    平凡的世界
                    <span
                      id="tgt-diff-3"
                      onClick={() => scrollToDiff('diff-3')}
                      className="text-[#fa8c16] cursor-pointer"
                    >
                      &gt;
                    </span>
                  </div>
                </div>

                {/* Table Section */}
                <table
                  id="tgt-table-block"
                  className="w-full border-collapse border border-[#262626] text-[12px] mt-2"
                >
                  <tbody>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 w-14 font-normal text-[#1d2129]">
                        日期
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        2026-8-
                        <span
                          id="tgt-diff-5"
                          onClick={() => scrollToDiff('diff-5')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          7
                        </span>
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        星期
                        <span
                          id="tgt-diff-6"
                          onClick={() => scrollToDiff('diff-6')}
                          className="text-[#fa8c16] font-medium ml-0.5 cursor-pointer"
                        >
                          四
                        </span>
                      </td>
                    </tr>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 font-normal text-[#1d2129]">
                        名称
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        <span
                          id="tgt-diff-7"
                          onClick={() => scrollToDiff('diff-7')}
                          className="text-[#fa8c16] cursor-pointer"
                        >
                          建行
                        </span>
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        <span
                          id="tgt-diff-8"
                          onClick={() => scrollToDiff('diff-8')}
                          className="text-[#fa8c16] cursor-pointer"
                        >
                          招商
                        </span>
                      </td>
                    </tr>
                    <tr className="border border-[#262626]">
                      <td className="border border-[#262626] px-2.5 py-1 font-normal text-[#1d2129]">
                        金额
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        23
                        <span
                          id="tgt-diff-9"
                          onClick={() => scrollToDiff('diff-9')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          77
                        </span>
                        6778¥
                      </td>
                      <td className="border border-[#262626] px-2.5 py-1">
                        36
                        <span
                          id="tgt-diff-10"
                          onClick={() => scrollToDiff('diff-10')}
                          className="text-[#fa8c16] font-medium cursor-pointer"
                        >
                          88
                        </span>
                        20475¥
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. RIGHT SIDEBAR: 差异卡片列表                                               */}
        {/* ========================================================================= */}
        <aside className={`${isDiffSidebarCollapsed ? 'w-0' : 'w-[340px]'} shrink-0 bg-[#f8f9fc] flex flex-col overflow-hidden border-l border-[#e5e6eb] transition-all duration-200`}>
          {/* Header Row: 差异列表 + 全部差异 Dropdown */}
          <div className="px-3.5 py-3 flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#1d2129]">差异列表</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDiffDropdownOpen((open) => !open)}
                className="h-[28px] pl-3 pr-7 text-[12.5px] border border-[#d9d9d9] rounded-[4px] bg-white text-[#1d2129] cursor-pointer shadow-xs flex items-center justify-between gap-2 hover:border-[#bfbfbf] focus:outline-none"
              >
                <span className="whitespace-nowrap">{diffFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#86909c] pointer-events-none" />
              </button>

              {diffDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setDiffDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-[176px] bg-white border border-[#e5e6eb] rounded-[4px] shadow-lg py-1 z-30 text-[12.5px]">
                    {diffFilterOptions.map(([label, count]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setDiffFilter(label);
                          setDiffDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer ${
                          diffFilter === label
                            ? 'bg-[#f0f5ff] text-[#2f54eb] font-medium'
                            : 'text-[#4e5969] hover:bg-[#f7f8fa]'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={
                            diffFilter === label
                              ? 'text-[#2f54eb]'
                              : 'text-[#86909c]'
                          }
                        >
                          （{count}）
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Metric Box: 相似度 Donut & 差异总数 */}
          <div className="px-3.5 pb-2">
            <div className="bg-white border border-[#e5e6eb] rounded-[8px] p-3.5 shadow-xs flex items-center justify-around">
              {/* Similarity Column */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[13px] text-[#4e5969]">相似度</span>
                <div className="flex items-center gap-2">
                  {/* Circular progress / Donut icon */}
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#f0f2f5]"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#4f75ff]"
                        strokeDasharray={`${targetSimilarity}, ${(100 - targetSimilarity).toFixed(2)}`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                  <span className="text-[18px] font-bold text-[#1d2129] tracking-tight">
                    {targetSimilarity}%
                  </span>
                </div>
              </div>

              <div className="w-[1px] h-9 bg-[#f0f2f5]" />

              {/* Total Diff Count Column */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[13px] text-[#4e5969]">差异总数</span>
                <span className="text-[20px] font-bold text-[#1d2129]">
                  {diffItems.length}
                </span>
              </div>
            </div>
          </div>

          {/* Filter count text */}
          <div className="px-4 py-1.5 text-[12.5px] text-[#8c8c8c]">
            已筛选出{filteredDiffItems.length}条
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 space-y-3">
            {filteredDiffItems.map((item) => {
              const isActive = activeDiffId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => scrollToDiff(item.id)}
                  className={`bg-white rounded-[6px] p-3.5 shadow-sm transition-all cursor-pointer select-none text-[13px] relative ${
                    isActive
                      ? 'border border-[#52c41a] ring-1 ring-[#52c41a]/30'
                      : 'border border-[#e8e8e8] hover:border-[#d9d9d9]'
                  }`}
                >
                  {/* Card Top: Dot + 修改 + 忽略 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fa8c16]" />
                      <span className="font-normal text-[#1d2129]">
                        {item.type}
                      </span>
                    </div>

                    {isActive && (
                      <button
                        onClick={(e) => handleIgnoreDiff(e, item.id)}
                        className="text-[12px] text-[#1890ff] hover:text-[#096dd9] cursor-pointer"
                      >
                        {item.ignored ? '恢复' : '忽略'}
                      </button>
                    )}
                  </div>

                  {/* Standard Row */}
                  <div className="text-[#1d2129] leading-relaxed mb-1 flex items-start gap-1">
                    <span className="text-[#8c8c8c] shrink-0">标准:</span>
                    <span className="break-all">{item.standardFullDisplay}</span>
                  </div>

                  {/* Compare Row */}
                  <div className="text-[#1d2129] leading-relaxed flex items-start gap-1">
                    <span className="text-[#8c8c8c] shrink-0">比对:</span>
                    <span className="break-all">{item.compareFullDisplay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

    </div>
  );
};
