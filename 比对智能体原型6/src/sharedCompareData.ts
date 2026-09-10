import { LayoutTypeItem } from './components/CompareLayoutManagement';

export interface RuleItem {
  id: string;
  name: string;
  desc: string;
  appName: string;
  auditType: string;
  auditPointsCount: number;
  templateLayout?: string;
  compareLayout?: string;
  creator: string;
  createTime?: string;
  updateTime: string;
}

export const INITIAL_SHARED_RULES: RuleItem[] = [
  {
    id: '1',
    name: '版本迭代比对-默认规则',
    desc: '核验内部审核、定稿、对方回传及续签等版本流转中的条款增删改，重点监控金额、主体、违约责任与管辖条款。',
    appName: '比对',
    auditType: '相同文件比对',
    auditPointsCount: 6,
    templateLayout: '通用合同标准版面解析',
    compareLayout: '合同修订批注与双栏比对版面',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '2',
    name: '模板基准校验比对-默认规则',
    desc: '以标准模板或范本为基准校验业务填充合同，定位固定条款被篡改、留白漏填及脱离模板的自定义改动。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 5,
    templateLayout: '通用格式合同结构化解析',
    compareLayout: '标准模板填空与留白区域解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '3',
    name: '关联协议对照比对-默认规则',
    desc: '用于主合同与补充协议、附件附表间的条款冲突和覆盖关系核验，识别价格、期限、权责等商务条件不一致。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 5,
    templateLayout: '主从协议条款勾稽与分栏解析',
    compareLayout: '补充协议与变更清单矩阵解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '4',
    name: '商务条件对齐比对-默认规则',
    desc: '对照商务谈判纪要、报价单或招投标文件，校验正式合同中的金额、付款节点、交付周期等商务条件完整一致。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 6,
    templateLayout: '商务表格与报价清单矩阵解析',
    compareLayout: '招投标文件分栏与参数表解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '5',
    name: '外部文件对照比对-默认规则',
    desc: '用于对方模板、历史同类合同及外部资质证照等文件与本次合同文本对照，核查主体信息与条款约定一致性。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 4,
    templateLayout: '资质证照与外部文件版面解析',
    compareLayout: '企业征信报告与流水凭据解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '6',
    name: '归档校验比对-默认规则',
    desc: '核验盖章扫描件与电子定稿版本完全一致，防范偷换页面、手写篡改及电子版与盖章版不一致的阴阳合同风险。',
    appName: '比对',
    auditType: '相同文件比对',
    auditPointsCount: 5,
    templateLayout: '签署扫描件倾斜校正与印章过滤版面',
    compareLayout: '图文混合高保真OCR解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '7',
    name: '金融监管示范文本比对-默认规则',
    desc: '用于金融监管示范文本与机构业务合同、制式合同与个性化合同的合规偏离识别，重点检查强制警示与消保条款。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 6,
    templateLayout: '监管示范文本与警示条款加粗解析',
    compareLayout: '金融产品说明书与费率表格解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
  {
    id: '8',
    name: '涉外多语言比对-默认规则',
    desc: '用于中英双语及多语种涉外合同条款对齐，定位翻译偏差、法律适用及争议解决管辖约定不一致。',
    appName: '比对',
    auditType: '不同文件比对',
    auditPointsCount: 4,
    templateLayout: '中英双语左右分栏对照解析',
    compareLayout: '涉外多语种混排与国际表格解析',
    creator: 'admin',
    createTime: '2026-08-27 10:00:00',
    updateTime: '2026-08-27 10:00:00',
  },
];

// Helper to normalize any rule auditType to only "相同文件比对" or "不同文件比对"
export const normalizeAuditType = (type?: string): string => {
  if (!type) return '相同文件比对';
  if (type === '相同文件比对' || type === '不同文件比对') return type;
  if (type.includes('全文') || type.includes('逐页') || type.includes('相同')) {
    return '相同文件比对';
  }
  return '不同文件比对';
};

const RULES_STORAGE_KEY = 'compare_rules_data_v9';
export const RULES_UPDATED_EVENT = 'compare_rules_updated';

export const getStoredRules = (): RuleItem[] => {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deduped = new Map<string, RuleItem>();
        parsed.forEach((item: RuleItem) => {
          const key = item.id
            ? `id:${item.id}`
            : `name:${item.appName || ''}|${item.name || ''}`;
          if (!deduped.has(key)) {
            deduped.set(key, item);
          }
        });
        return Array.from(deduped.values()).map((item: RuleItem) => ({
          ...item,
          auditType: normalizeAuditType(item.auditType),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load stored rules:', e);
  }
  return INITIAL_SHARED_RULES;
};

export const saveStoredRules = (rules: RuleItem[]) => {
  try {
    const normalized = rules.map((r) => ({
      ...r,
      auditType: normalizeAuditType(r.auditType),
    }));
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(RULES_UPDATED_EVENT, { detail: normalized }));
  } catch (e) {
    console.error('Failed to save rules to localStorage:', e);
  }
};

export const INITIAL_SHARED_LAYOUT_TYPES: LayoutTypeItem[] = [
  {
    id: 'layout-sc-01',
    name: '通用合同标准版面解析',
    strategy: '强制PDF解析',
    desc: '适用于版本迭代类合同，识别条款编号、正文段落、修订痕迹与签署落款。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-02',
    name: '标准模板填空与留白区域解析',
    strategy: '强制PDF解析',
    desc: '适用于模板基准校验类场景，定位固定条款、下划线填空、括号留白与变量区域。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-03',
    name: '主从协议条款勾稽与分栏解析',
    strategy: '强制PDF解析',
    desc: '适用于关联协议对照类场景，支持主协议、补充协议与附件的条款交叉引用和分栏排版解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-04',
    name: '商务表格与报价清单矩阵解析',
    strategy: '自动后缀判断',
    desc: '适用于商务条件对齐类场景，高精度提取报价单、商务条款汇总表、付款节点及网格表格。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-05',
    name: '资质证照与外部文件版面解析',
    strategy: '强制PDF解析',
    desc: '适用于外部文件对照类场景，识别营业执照、批文、历史合同等图文混合版面的关键字段。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-06',
    name: '签署扫描件倾斜校正与印章过滤版面',
    strategy: '自动后缀判断',
    desc: '适用于归档校验类场景，针对盖章扫描件自动纠偏、去黑边并进行印章过滤后的高保真 OCR 解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-07',
    name: '监管示范文本与警示条款加粗解析',
    strategy: '强制PDF解析',
    desc: '适用于金融行业特有场景，重点识别监管示范文本中的加粗、变色、下划线强制警示与消保条款。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-08',
    name: '中英双语左右分栏对照解析',
    strategy: '强制PDF解析',
    desc: '适用于涉外多语言场景，对中英双语左右分栏合同进行逐行镜像对齐与段落切割。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-09',
    name: '合同修订批注与双栏比对版面',
    strategy: '自动后缀判断',
    desc: '针对带修订痕迹、批注及双栏比对的合同文件进行结构化解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-10',
    name: '通用格式合同结构化解析',
    strategy: '强制PDF解析',
    desc: '适用于银行、保险及企业标准框架合同的模板化段落与条款识别。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-11',
    name: '补充协议与变更清单矩阵解析',
    strategy: '自动后缀判断',
    desc: '适用于主合同条款修改、期限顺延及价格变更清单的解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-12',
    name: '招投标文件分栏与参数表解析',
    strategy: '强制PDF解析',
    desc: '适用于标书、商务评审单与技术规格响应表的跨栏结构解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-13',
    name: '企业征信报告与流水凭据解析',
    strategy: '自动后缀判断',
    desc: '适用于人行征信报告、企业信用报告及银行流水凭据的关键字段结构化提取。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-14',
    name: '图文混合高保真OCR解析',
    strategy: '强制PDF解析',
    desc: '适用于盖章签署件、手写批注原件的字符与版面结构还原。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-15',
    name: '金融产品说明书与费率表格解析',
    strategy: '自动后缀判断',
    desc: '适用于理财产品说明书、费率阶梯表与计息公式矩阵解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
  {
    id: 'layout-sc-16',
    name: '涉外多语种混排与国际表格解析',
    strategy: '自动后缀判断',
    desc: '适用于多语种混排条款及国际贸易术语表格解析。',
    createTime: '2026-08-27 10:00:00',
    creator: 'admin',
  },
];
