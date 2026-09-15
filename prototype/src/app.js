
    (() => {
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const labels = { tasks: "任务中心", upload: "新建任务 / 接入文件", mode: "新建任务 / 处理模式", process: "新建任务 / 模型预处理", review: "人工复核", export: "输出文档", templates: "模板管理", "template-detail": "模板编辑", types: "文档类型管理", "type-detail": "文档类型编辑", flow: "流程配置", exports: "导出记录" };
      const seedTypes = [
        { name: "合同", code: "CONTRACT", keywords: ["合同", "协议", "借款人", "贷款人", "甲方", "乙方", "鉴于", "agreement", "credit agreement", "borrower", "lender", "guarantor", "amendment", "term loan"], negative: ["发票号码", "对账单", "invoice number"], instanceRegex: "(合同编号|协议编号|Contract Number|Agreement Number)[：:]?\\s*([A-Za-z0-9\\-]+)", threshold: 0.45 },
        { name: "发票", code: "INVOICE", keywords: ["发票", "发票代码", "发票号码", "购买方", "销售方", "价税合计", "invoice", "invoices", "bill to", "retail invoice", "total amount due", "invoice number"], negative: ["借款合同", "银行流水", "credit agreement"], instanceRegex: "(发票号码|Invoice Number|Invoice No)[^A-Za-z0-9#]*([A-Za-z0-9#\\-_]+)", threshold: 0.55 },
        { name: "银行流水", code: "BANK_STATEMENT", keywords: ["银行流水", "对账单", "账户", "账号", "交易日期", "借方", "贷方", "余额", "statement", "consolidated statement", "account summary", "transaction details", "account number", "account no", "opening balance", "closing balance"], negative: ["发票代码", "价税合计", "credit agreement"], instanceRegex: "(账号|账户|Account number|Account No)[：:]?\\s*([0-9\\-* ]{6,})", threshold: 0.45 },
        { name: "身份证明", code: "IDENTITY", keywords: ["身份证", "公民身份号码", "姓名", "性别", "民族", "住址", "identity card"], negative: ["合同编号", "发票号码", "credit agreement"], instanceRegex: "(公民身份号码|ID Number)[：:]?\\s*([0-9Xx]{15,18})", threshold: 0.65 },
        { name: "未知材料", code: "UNKNOWN", keywords: [], negative: [], instanceRegex: "", threshold: 1 }
      ];
      const embeddedSamplePdfs = window.__EMBEDDED_SAMPLE_PDFS__ || {};
      const samples = [
        { id: "ordered", name: "有序混合材料示例.pdf", mode: "ordered", pages: 6, groups: [{ name: "合同_1", typeCode: "CONTRACT", pages: [1, 2] }, { name: "发票_1", typeCode: "INVOICE", pages: [3] }, { name: "发票_2", typeCode: "INVOICE", pages: [4] }, { name: "银行流水_1", typeCode: "BANK_STATEMENT", pages: [5, 6] }] },
        { id: "unordered", name: "无序交错材料示例.pdf", mode: "unordered", pages: 6, groups: [{ name: "合同_1", typeCode: "CONTRACT", pages: [1, 3] }, { name: "发票_1", typeCode: "INVOICE", pages: [2] }, { name: "银行流水_1", typeCode: "BANK_STATEMENT", pages: [4, 6] }, { name: "发票_2", typeCode: "INVOICE", pages: [5] }] },
        { id: "auto", name: "自动判断材料示例.pdf", mode: "auto", resolvedMode: "ordered", pages: 6, groups: [{ name: "合同_1", typeCode: "CONTRACT", pages: [1, 2] }, { name: "发票_1", typeCode: "INVOICE", pages: [3] }, { name: "发票_2", typeCode: "INVOICE", pages: [4] }, { name: "银行流水_1", typeCode: "BANK_STATEMENT", pages: [5, 6] }] }
      ];
      const state = {
        screen: "tasks",
        file: null,
        data: null,
        pdf: null,
        pageCount: 0,
        mode: "unordered",
        templateId: null,
        pages: [],
        groups: [],
        selectedPages: new Set(),
        selectedGroups: new Set(),
        types: JSON.parse(localStorage.getItem("split.types.v3") || "null") || seedTypes,
        templates: JSON.parse(localStorage.getItem("split.templates.v3") || "null") || [{ id: "tpl-1", name: "金融材料顺序模板", slots: [{ typeCode: "CONTRACT", required: true, minCount: 1, maxCount: 1, minPages: 2, maxPages: 30 }, { typeCode: "INVOICE", required: true, minCount: 1, maxCount: 3, minPages: 1, maxPages: 2 }, { typeCode: "BANK_STATEMENT", required: true, minCount: 1, maxCount: 2, minPages: 2, maxPages: 20 }] }],
        history: JSON.parse(localStorage.getItem("split.history") || "[]"),
        flow: JSON.parse(localStorage.getItem("split.flow") || '{"review":true,"unknown":true,"defaultMode":"unordered"}')
      };
      let templateDraft = [];
      let editingTypeCode = null;
      let editingTemplateId = null;
      const toast = $("#toast");

      function notify(message, success = false) {
        toast.textContent = message; toast.classList.remove("hidden"); toast.style.borderColor = success ? "#b8dfd0" : "#c5cfdd";
        clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.add("hidden"), 2200);
      }
      function saveTypes() { localStorage.setItem("split.types.v3", JSON.stringify(state.types)); }
      function saveTemplates() { localStorage.setItem("split.templates.v3", JSON.stringify(state.templates)); }
      function saveHistory() { localStorage.setItem("split.history", JSON.stringify(state.history.slice(0, 30))); }
      function saveFlow() { localStorage.setItem("split.flow", JSON.stringify(state.flow)); }
      function base64ToBytes(base64) { const binary = atob(base64); return Uint8Array.from(binary, character => character.charCodeAt(0)); }
      async function loadSampleBytes(id) {
        if (embeddedSamplePdfs[id]) return base64ToBytes(embeddedSamplePdfs[id]);
        const response = await fetch(new URL(`./assets/samples/${id}-example.pdf`, document.baseURI));
        if (!response.ok) throw new Error(`示例文件加载失败：${response.status}`);
        return new Uint8Array(await response.arrayBuffer());
      }
      function typeName(code) { return (state.types.find(type => type.code === code) || { name: code }).name; }
      function sanitize(name) { return name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "document"; }
      function formatBytes(bytes) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))); return (bytes / 1024 ** i).toFixed(i ? 1 : 0) + " " + units[i]; }
      function route(name) {
        state.screen = name; $$('[data-screen]').forEach(screen => screen.classList.toggle('hidden', screen.dataset.screen !== name));
        const navMap = { "template-detail": "templates", "type-detail": "types" };
        const nav = navMap[name] || (["tasks", "templates", "types", "flow", "exports"].includes(name) ? name : "tasks");
        $$('[data-nav]').forEach(button => button.classList.toggle('active', button.dataset.nav === nav));
        $('#route-label').textContent = labels[name] || '文档拆分与重组'; window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      function renderTypes() {
        const keyword = normalizeText($('#type-search')?.value || '');
        const visibleTypes = state.types.filter(type => !keyword || normalizeText(`${type.name}${type.code}${(type.keywords || []).join('')}`).includes(keyword));
        $('#type-list').innerHTML = visibleTypes.map(type => `<tr><td>${type.code}</td><td><strong>${type.name}</strong></td><td>${type.description || (type.keywords || []).slice(0, 4).join('、') || '未配置说明'}</td><td>${type.application || '拆分重组'}</td><td>${type.industry || '其他'}</td><td>${(type.keywords || []).length + (type.negative || []).length + (type.instanceRegex ? 1 : 0)}</td><td>${type.status === 'disabled' ? '未启用' : '已启用'}</td><td><div class="row">${type.code === 'UNKNOWN' ? '<span class="small muted">系统内置</span>' : `<button class="button small" type="button" data-edit-type="${type.code}">编辑</button><button class="button small ghost" type="button" data-delete-type="${type.code}">删除</button>`}</div></td></tr>`).join('') || '<tr><td colspan="8"><div class="empty">暂无类型</div></td></tr>';
        const options = state.types.map(type => `<option value="${type.code}">${type.name}</option>`).join('');
        $('#group-type').innerHTML = options;
        $('#template-type').innerHTML = state.types.filter(type => type.code !== 'UNKNOWN').map(type => `<option value="${type.code}">${type.name}</option>`).join('');
      }
      function renderTemplateDraft() {
        $('#template-draft').innerHTML = templateDraft.length ? templateDraft.map((slot, index) => `<div class="rule-row"><span class="small mono">${index + 1}</span><span><strong>${typeName(slot.typeCode)}</strong><span class="small muted" style="display:block">${slot.required ? '必选' : '可选'} · ${slot.minCount}-${slot.maxCount} 份 · ${slot.minPages}-${slot.maxPages} 页</span></span><div class="row"><button class="button small ghost" type="button" data-move-slot="${index}" data-direction="-1">上移</button><button class="button small ghost" type="button" data-move-slot="${index}" data-direction="1">下移</button><button class="button small" type="button" data-remove-slot="${index}">移除</button></div></div>`).join('') : '<div class="empty">尚未添加 Slot</div>';
      }
      function renderTemplates() {
        const keyword = normalizeText($('#template-search')?.value || '');
        const visibleTemplates = state.templates.filter(template => !keyword || normalizeText(`${template.name}${(template.slots || []).map(slot => typeName(slot.typeCode)).join('')}`).includes(keyword));
        $('#template-list').innerHTML = visibleTemplates.map(template => `<tr><td><strong>${template.name}</strong></td><td>拆分重组</td><td>${(template.slots || []).length}</td><td>${template.version || 'v1.0'}</td><td>${template.status === 'disabled' ? '未启用' : '已启用'}</td><td>${template.updatedAt || '2026-09-15'}</td><td><button class="button small" type="button" data-edit-template="${template.id}">编辑</button></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty">暂无模板</div></td></tr>';
        $('#template-select').innerHTML = `<option value="">不使用模板</option>` + state.templates.map(template => `<option value="${template.id}">${template.name}</option>`).join('');
        renderTemplateDraft();
      }
      function renderHistory() {
        $('#history-list').innerHTML = state.history.length ? state.history.map(item => `<div class="export-row"><div><strong>${item.name}</strong><span class="small muted" style="display:block">${item.fileCount} 份文档 · ${item.pageCount} 页 · ${item.time}</span></div><span class="small muted">已完成</span><button class="button small" type="button" data-action="查看记录">查看</button></div>`).join('') : '<div class="empty">暂无导出记录</div>';
        $('#metric-export-count').textContent = state.history.length;
      }
      function renderTasks() {
        const assigned = state.pages.filter(page => page.groupId).length;
        $('#metric-task-count').textContent = state.file ? '1' : '0';
        $('#metric-doc-count').textContent = state.groups.length;
        $('#metric-unassigned').textContent = Math.max(0, state.pageCount - assigned);
        $('#task-list').innerHTML = state.file ? `<div class="task-row"><div class="task-main"><strong>${state.file.name}</strong><span class="small muted">${state.pageCount} 页 · ${state.mode === 'ordered' ? '有序模板拆分' : state.mode === 'auto' ? '自动判断' : '无序智能分拣'} · ${state.groups.length} 份文档 · ${Math.max(0, state.pageCount - assigned)} 页未分组</span></div><div class="row"><span class="small muted">${state.groups.length ? '已创建分组' : '待复核'}</span><button class="button small primary" type="button" data-route="review">继续复核</button></div></div>` : '<div class="empty">暂无任务。点击“新建任务”上传一份混合 PDF。</div>';
        $('#sample-list').innerHTML = samples.map(sample => { const modeText = sample.mode === 'ordered' ? '有序模板拆分' : sample.mode === 'unordered' ? '无序智能分拣' : '自动判断'; const detail = sample.mode === 'unordered' ? '页面交错 · 预置候选分组' : sample.mode === 'auto' ? '识别为有序模板拆分 · 预置候选分组' : '连续材料块 · 预置候选分组'; return `<div class="task-row"><div class="task-main"><strong>${sample.name}</strong><span class="small muted">6 页 · ${modeText} · ${detail} · 4 份文档</span></div><button class="button small" type="button" data-open-sample="${sample.id}">打开复核</button></div>`; }).join('');
      }
      function renderPages() {
        $('#page-count-label').textContent = `${state.pageCount} 页`;
        $('#page-grid').innerHTML = state.pages.map(page => {
          const checked = state.selectedPages.has(page.number) ? 'checked' : '';
          const group = state.groups.find(item => item.pages.includes(page.number));
          const typeLabel = page.typeCode && page.typeCode !== 'UNKNOWN' ? `${typeName(page.typeCode)} ${Math.round((page.confidence || 0) * 100)}%` : '未知';
          return `<label class="page-choice ${group ? 'assigned' : ''}" title="${(page.evidence || []).join('；')}"><input type="checkbox" data-page-check="${page.number}" ${checked}><span class="page-choice-label"><strong>第 ${page.number} 页</strong><span class="small muted">${typeLabel}${group ? ` · ${group.name}` : ''}</span></span></label>`;
        }).join('');
        $('#selection-summary').textContent = state.selectedPages.size ? `已选择 ${state.selectedPages.size} 页` : '未选择页面';
      }
      function renderGroups() {
        $('#group-count-label').textContent = `${state.groups.length} 份`;
        $('#group-list').innerHTML = state.groups.length ? state.groups.map(group => `<div class="group-item ${state.selectedGroups.has(group.id) ? 'active' : ''}"><div class="group-head"><label class="row"><input type="checkbox" data-group-check="${group.id}" ${state.selectedGroups.has(group.id) ? 'checked' : ''}><span><strong>${group.name}</strong><span class="small muted" style="display:block">${typeName(group.typeCode)} · ${group.pages.length} 页</span></span></label><button class="button small" type="button" data-delete-group="${group.id}">删除</button></div><div class="page-chips">${group.pages.map(page => `<span class="page-chip">第 ${page} 页</span>`).join('')}</div></div>`).join('') : '<div class="empty">尚未创建文档分组</div>';
        evaluateTemplate();
      }
      function renderExport() {
        $('#export-ready-count').textContent = `${state.groups.length} 份文档`;
        $('#export-list').innerHTML = state.groups.length ? state.groups.map(group => `<div class="export-row"><div><strong>${group.name}.pdf</strong><span class="small muted" style="display:block">${typeName(group.typeCode)} · 第 ${group.pages.join('、')} 页</span></div><span>${group.pages.length} 页</span><span>${state.file.name}</span><button class="button small" type="button" data-export-group="${group.id}"><i data-lucide="download"></i>下载</button></div>`).join('') : '<div class="empty">请在复核页面创建文档分组。</div>';
        const manifest = { sourceFile: state.file ? state.file.name : '', pageCount: state.pageCount, mode: state.mode, documents: state.groups.map(group => ({ id: group.id, name: group.name, type: typeName(group.typeCode), pages: group.pages })) };
        $('#manifest-preview').textContent = JSON.stringify(manifest, null, 2);
      }
      function renderAll() { renderTypes(); renderTemplates(); renderHistory(); renderTasks(); renderPages(); renderGroups(); renderExport(); }
      async function ensurePdfJs() {
        if (window.PDFJS) return window.PDFJS;
        await new Promise(resolve => window.addEventListener('pdfjs-ready', resolve, { once: true }));
        return window.PDFJS;
      }
      async function extractPageTexts(bytes) {
        const pdfjs = await ensurePdfJs();
        const document = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        const texts = [];
        for (let index = 1; index <= document.numPages; index += 1) {
          const page = await document.getPage(index);
          const content = await page.getTextContent();
          texts.push(content.items.map(item => item.str).join(' '));
        }
        await document.destroy();
        return texts;
      }
      function normalizeText(text) { return String(text || '').replace(/\s+/g, '').toLowerCase(); }
      function scoreDocumentType(text, type) {
        const normalized = normalizeText(text); let score = 0; const evidence = [];
        for (const keyword of type.keywords || []) if (normalized.includes(normalizeText(keyword))) { score += 0.16; evidence.push(`关键词：${keyword}`); }
        for (const keyword of type.negative || []) if (normalized.includes(normalizeText(keyword))) { score -= 0.18; evidence.push(`排除词：${keyword}`); }
        let instanceKey = null;
        if (type.instanceRegex) {
          try { const match = text.match(new RegExp(type.instanceRegex, 'i')); if (match) { score += 0.28; instanceKey = match[match.length - 1]; evidence.push(`实例键：${instanceKey}`); } } catch {}
        }
        return { code: type.code, score: Math.max(0, Math.min(1, score)), instanceKey, evidence };
      }
      function classifyPages(pageTexts) {
        return state.pages.map((page, index) => {
          const text = pageTexts[index] || '';
          const candidates = state.types.filter(type => type.code !== 'UNKNOWN').map(type => scoreDocumentType(text, type)).sort((a, b) => b.score - a.score);
          const best = candidates[0] || { code: 'UNKNOWN', score: 0, evidence: [] }; const runnerUp = candidates[1] || { score: 0 };
          const accepted = best.score >= (state.types.find(type => type.code === best.code)?.threshold || 0.65) && best.score - runnerUp.score >= 0.08;
          return { ...page, text, typeCode: accepted ? best.code : 'UNKNOWN', confidence: accepted ? best.score : best.score, instanceKey: accepted ? best.instanceKey : null, evidence: best.evidence || [], runnerUpScore: runnerUp.score };
        });
      }
      function buildGroupsFromPages() {
        const groups = [];
        state.pages.slice().sort((a, b) => a.number - b.number).forEach(page => {
          if (!page.typeCode || page.typeCode === 'UNKNOWN') return;
          let group = null;
          if (page.instanceKey) group = groups.find(item => item.typeCode === page.typeCode && item.instanceKey === page.instanceKey);
          if (!group) {
            const last = groups[groups.length - 1];
            const contiguous = last && last.typeCode === page.typeCode && last.pages[last.pages.length - 1] === page.number - 1;
            const compatibleKey = last && (!last.instanceKey || !page.instanceKey || last.instanceKey === page.instanceKey);
            if (contiguous && compatibleKey) { group = last; if (!group.instanceKey && page.instanceKey) group.instanceKey = page.instanceKey; }
          }
          if (!group) { group = { id: `auto-${Date.now()}-${groups.length}`, name: `${typeName(page.typeCode)}_${groups.filter(item => item.typeCode === page.typeCode).length + 1}`, typeCode: page.typeCode, pages: [], instanceKey: page.instanceKey, confidence: page.confidence, evidence: page.evidence }; groups.push(group); }
          group.pages.push(page.number); group.confidence = Math.max(group.confidence || 0, page.confidence || 0);
        });
        state.groups = groups;
      }
      function evaluateTemplate() {
        const template = state.templates.find(item => item.id === state.templateId);
        const container = $('#template-validation');
        if (state.mode !== 'ordered' || !template) { container.classList.add('hidden'); container.textContent = ''; return; }
        const sequence = state.groups.slice().sort((a, b) => Math.min(...a.pages) - Math.min(...b.pages)).map(group => group.typeCode);
        const checks = (template.slots || []).map((slot, index) => { const count = state.groups.filter(group => group.typeCode === slot.typeCode).length; const pages = state.groups.filter(group => group.typeCode === slot.typeCode).reduce((sum, group) => sum + group.pages.length, 0); const countOk = count >= slot.minCount && count <= slot.maxCount; const pagesOk = !pages || (pages >= slot.minPages && pages <= slot.maxPages); const position = sequence.indexOf(slot.typeCode); const orderOk = position === -1 || sequence.slice(0, position).every(code => { const previousSlot = (template.slots || []).find(item => item.typeCode === code); return !previousSlot || (template.slots || []).indexOf(previousSlot) <= index; }); return { index: index + 1, name: typeName(slot.typeCode), count, pages, countOk, pagesOk, orderOk, required: slot.required }; });
        container.classList.remove('hidden'); container.textContent = checks.map(check => `${check.index}. ${check.name}｜${check.required ? '必选' : '可选'}｜${check.countOk ? '份数正常' : '份数异常'}｜${check.pagesOk ? '页数正常' : '页数异常'}｜${check.orderOk ? '顺序正常' : '顺序异常'}｜实际 ${check.count} 份 / ${check.pages} 页`).join('\n');
      }
      async function parsePdf(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        state.file = file; state.data = bytes; state.pdf = pdf; state.pageCount = pdf.getPageCount();
        state.pages = Array.from({ length: state.pageCount }, (_, index) => ({ number: index + 1, groupId: null }));
        try { const pageTexts = await extractPageTexts(bytes); state.pages = classifyPages(pageTexts); buildGroupsFromPages(); } catch { state.groups = []; }
        state.selectedPages.clear(); state.selectedGroups.clear();
        $('#pdf-preview').src = URL.createObjectURL(file);
        $('#file-list').innerHTML = `<div class="file-row"><div class="file-main"><strong>${file.name}</strong><span class="small muted">${formatBytes(file.size)} · ${state.pageCount} 页</span></div><span class="tag green">PDF 解析完成</span></div>`;
        $('#file-summary').classList.remove('hidden'); $('#to-mode').disabled = false; $('#upload-message').className = 'message success'; $('#upload-message').innerHTML = '<i data-lucide="circle-check"></i>文件已真实解析，可以进入下一步。';
        $('#mode-file-summary').innerHTML = `<div class="file-main"><strong>${file.name}</strong><span class="small muted">${state.pageCount} 页 · ${formatBytes(file.size)}</span></div><span class="tag green">已就绪</span>`;
        if (window.lucide) lucide.createIcons({ attrs: { width: 16, height: 16, "stroke-width": 1.8 } }); renderAll(); notify('PDF 解析完成', true);
      }
      async function openSample(id) {
        const sample = samples.find(item => item.id === id); if (!sample) return;
        const bytes = await loadSampleBytes(id); const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        state.file = { name: sample.name, size: bytes.length }; state.data = bytes; state.pdf = pdf; state.pageCount = pdf.getPageCount(); state.mode = sample.mode; state.resolvedMode = sample.resolvedMode || sample.mode;
        state.templateId = (sample.mode === 'ordered' || sample.resolvedMode === 'ordered') ? (state.templates[0]?.id || null) : null;
        state.pages = Array.from({ length: state.pageCount }, (_, index) => ({ number: index + 1, groupId: null }));
        state.groups = [];
        try { const pageTexts = await extractPageTexts(bytes); state.pages = classifyPages(pageTexts); buildGroupsFromPages(); } catch {}
        if (!state.groups.length || state.groups.every(group => group.typeCode === 'UNKNOWN')) state.groups = sample.groups.map((group, index) => ({ id: `sample-${id}-${index + 1}`, ...group }));
        state.selectedPages.clear(); state.selectedGroups.clear(); const blob = new Blob([bytes], { type: "application/pdf" }); $('#pdf-preview').src = URL.createObjectURL(blob);
        const reviewMode = state.resolvedMode === 'ordered' ? '有序模板拆分' : '无序智能分拣'; $('#review-mode-tag').textContent = sample.mode === 'auto' ? `自动判断 → ${reviewMode}` : reviewMode;
        $('#review-hint').textContent = state.resolvedMode === 'ordered' ? '示例已预置模板候选分组，可继续调整顺序、份数和页面归属。' : '示例已预置跨页候选分组，可继续合并、拆分和调整页面归属。';
        renderAll(); route('review'); notify(`已打开示例：${sample.name}`, true);
      }
      function updateModeSelection(mode) {
        state.mode = mode; $('#mode-label').textContent = mode === 'ordered' ? '有序模板拆分' : mode === 'auto' ? '自动判断' : '无序智能分拣';
        $('#process-mode').textContent = $('#mode-label').textContent; $('#review-mode-tag').textContent = $('#mode-label').textContent;
        $$('[data-mode-card]').forEach(card => card.classList.toggle('active', card.dataset.modeCard === mode));
        $('#template-field').hidden = mode !== 'ordered'; $('#mode-config-note').textContent = mode === 'unordered' ? '无序模型策略' : mode === 'ordered' ? '模板约束模型策略' : '模型预处理前自动锁定';
      }
      function createGroup() {
        if (!state.selectedPages.size) return notify('请先勾选至少一页');
        const pages = [...state.selectedPages].sort((a, b) => a - b); const typeCode = $('#group-type').value;
        const group = { id: 'doc-' + Date.now(), name: `${typeName(typeCode)}_${state.groups.filter(item => item.typeCode === typeCode).length + 1}`, typeCode, pages };
        state.groups.forEach(item => item.pages = item.pages.filter(page => !pages.includes(page)));
        state.groups = state.groups.filter(item => item.pages.length);
        state.groups.push(group); state.selectedPages.clear(); renderAll(); notify('已创建文档分组', true);
      }
      async function exportGroup(group) {
        const target = await PDFLib.PDFDocument.create();
        const copied = await target.copyPages(state.pdf, group.pages.map(page => page - 1));
        copied.forEach(page => target.addPage(page));
        const bytes = await target.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${sanitize(group.name)}.pdf`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        state.history.unshift({ name: state.file.name, fileCount: 1, pageCount: group.pages.length, time: new Date().toLocaleString('zh-CN') }); saveHistory(); renderHistory();
        notify(`已导出 ${group.name}.pdf`, true);
      }
      async function buildPdf(group) {
        const target = await PDFLib.PDFDocument.create(); const copied = await target.copyPages(state.pdf, group.pages.map(page => page - 1)); copied.forEach(page => target.addPage(page)); return target.save();
      }
      document.addEventListener('click', async event => {
        const routeButton = event.target.closest('[data-route]'); if (routeButton) return route(routeButton.dataset.route);
        const sampleButton = event.target.closest('[data-open-sample]'); if (sampleButton) return openSample(sampleButton.dataset.openSample);
        const newTask = event.target.closest('[data-new-task]'); if (newTask) return route('upload');
        const pageCheck = event.target.closest('[data-page-check]'); if (pageCheck) { const page = Number(pageCheck.dataset.pageCheck); pageCheck.checked ? state.selectedPages.add(page) : state.selectedPages.delete(page); renderPages(); return; }
        const groupCheck = event.target.closest('[data-group-check]'); if (groupCheck) { const id = groupCheck.dataset.groupCheck; groupCheck.checked ? state.selectedGroups.add(id) : state.selectedGroups.delete(id); renderGroups(); return; }
        const deleteGroup = event.target.closest('[data-delete-group]'); if (deleteGroup) { state.groups = state.groups.filter(group => group.id !== deleteGroup.dataset.deleteGroup); state.selectedGroups.delete(deleteGroup.dataset.deleteGroup); renderAll(); return; }
        const deleteType = event.target.closest('[data-delete-type]'); if (deleteType) { state.types = state.types.filter(type => type.code !== deleteType.dataset.deleteType); saveTypes(); renderAll(); return; }
        const editType = event.target.closest('[data-edit-type]'); if (editType) { const type = state.types.find(item => item.code === editType.dataset.editType); if (!type) return; editingTypeCode = type.code; $('#type-detail-title').textContent = `编辑文档类型：${type.name}`; $('#type-name').value = type.name; $('#type-code').value = type.code; $('#type-code').disabled = true; $('#type-description').value = type.description || ''; $('#type-application').value = type.application || '智能审核、抽取、拆分重组'; $('#type-industry').value = type.industry || '其他'; $('#type-status').value = type.status || 'enabled'; $('#type-keywords').value = (type.keywords || []).join(','); $('#type-negative').value = (type.negative || []).join(','); $('#type-instance').value = type.instanceRegex || ''; $('#type-layout').value = (type.layout || []).join(','); $('#type-anchors').value = (type.anchors || []).join(','); $('#type-instance-fields').value = (type.instanceFields || []).join(','); $('#type-page-role').value = (type.pageRoles || []).join(','); $('#type-threshold-auto').value = type.threshold || 0.65; route('type-detail'); return; }
        const editTemplate = event.target.closest('[data-edit-template]'); if (editTemplate) { const template = state.templates.find(item => item.id === editTemplate.dataset.editTemplate); if (!template) return; editingTemplateId = template.id; templateDraft = (template.slots || []).map(slot => ({ ...slot })); $('#template-detail-title').textContent = `编辑模板：${template.name}`; $('#template-name').value = template.name; renderTemplateDraft(); route('template-detail'); return; }
        const removeSlot = event.target.closest('[data-remove-slot]'); if (removeSlot) { templateDraft.splice(Number(removeSlot.dataset.removeSlot), 1); renderTemplateDraft(); return; }
        const moveSlot = event.target.closest('[data-move-slot]'); if (moveSlot) { const index = Number(moveSlot.dataset.moveSlot); const target = index + Number(moveSlot.dataset.direction); if (target < 0 || target >= templateDraft.length) return; [templateDraft[index], templateDraft[target]] = [templateDraft[target], templateDraft[index]]; renderTemplateDraft(); return; }
        const exportGroupButton = event.target.closest('[data-export-group]'); if (exportGroupButton) { const group = state.groups.find(item => item.id === exportGroupButton.dataset.exportGroup); if (group) await exportGroup(group); return; }
        const action = event.target.closest('[data-action]'); if (action) notify(action.dataset.action + '：操作已触发');
      });
      $('#file-input').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; try { $('#upload-message').className = 'message'; $('#upload-message').textContent = '正在解析 PDF...'; await parsePdf(file); } catch (error) { $('#upload-message').className = 'message warning'; $('#upload-message').textContent = 'PDF 解析失败：' + error.message; } });
      $('#to-mode').addEventListener('click', () => route('mode'));
      $$('input[name="mode"]').forEach(input => input.addEventListener('change', () => updateModeSelection(input.value)));
      $('#template-select').addEventListener('change', event => { state.templateId = event.target.value; });
      $('#start-process').addEventListener('click', () => {
        if (!state.file) return notify('请先上传 PDF'); route('process'); const steps = [['PDF 校验','检查文件结构与页数', true],['页面文本提取','读取 PDF 文本和页面内容', true],['页面类型匹配','按关键词、排除词、字段正则和阈值分类', true],['实例聚合','按实例键和连续关系生成候选文档', true],['模板校验', state.mode === 'ordered' ? '校验顺序、份数和页码范围' : '无模板时不执行', state.mode === 'ordered'],['大模型增强','复杂语义和跨页关系模型服务', false],['结果校验','确认原文件未修改并准备复核输入', true]];
        $('#process-list').innerHTML = steps.map((step, index) => `<div class="process-row" data-process-row="${index}"><span class="process-index">${index + 1}</span><span><strong>${step[0]}</strong><span class="small muted" style="display:block">${step[1]}</span></span><span class="tag">等待</span></div>`).join('');
        let index = 0; const run = () => { const row = $(`[data-process-row="${index}"]`); if (!row) { $('#process-percent').textContent = '100%'; $('#process-log').textContent += '\n分类与聚合完成，已进入人工复核。大模型增强服务待接入。'; renderAll(); $('#to-review').classList.remove('hidden'); return; } row.classList.add('active'); row.querySelector('.tag').textContent = steps[index][2] ? '处理中' : '待接入'; $('#process-log').textContent += `\n${steps[index][2] ? '正在执行' : '等待接入'}：${steps[index][0]}`; setTimeout(() => { row.classList.remove('active'); if (steps[index][2]) { row.classList.add('done'); row.querySelector('.tag').className = 'tag green'; row.querySelector('.tag').textContent = '完成'; } else { row.querySelector('.tag').className = 'tag amber'; row.querySelector('.tag').textContent = '待接入'; } index += 1; $('#process-percent').textContent = Math.round(index / steps.length * 100) + '%'; run(); }, 260); }; run();
      });
      $('#to-review').addEventListener('click', () => route('review'));
      $('#create-group').addEventListener('click', createGroup);
      $('#merge-groups').addEventListener('click', () => { const selected = state.groups.filter(group => state.selectedGroups.has(group.id)); if (selected.length < 2) return notify('请至少选择两个文档分组'); const target = selected[0]; target.pages = [...new Set(selected.flatMap(group => group.pages))].sort((a, b) => a - b); state.groups = state.groups.filter(group => !selected.slice(1).includes(group)); state.selectedGroups.clear(); renderAll(); notify('已合并选中文档', true); });
      $('#ungroup-pages').addEventListener('click', () => { if (!state.selectedPages.size) return notify('请先勾选页面'); state.groups = state.groups.map(group => ({ ...group, pages: group.pages.filter(page => !state.selectedPages.has(page)) })).filter(group => group.pages.length); state.selectedPages.clear(); renderAll(); notify('已拆出选中页面'); });
      $('#to-export').addEventListener('click', () => route('export'));
      $('#download-zip').addEventListener('click', async () => { if (!state.groups.length) return notify('没有可导出的文档分组'); const zip = new JSZip(); for (const group of state.groups) { const bytes = await buildPdf(group); zip.file(`${sanitize(group.name)}.pdf`, bytes); } const manifest = { sourceFile: state.file.name, pageCount: state.pageCount, mode: state.mode, documents: state.groups.map(group => ({ name: group.name, type: typeName(group.typeCode), pages: group.pages })) }; zip.file('manifest.json', JSON.stringify(manifest, null, 2)); const blob = await zip.generateAsync({ type: 'blob' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'document-split-output.zip'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); state.history.unshift({ name: state.file.name, fileCount: state.groups.length, pageCount: state.pageCount, time: new Date().toLocaleString('zh-CN') }); saveHistory(); renderHistory(); notify('已导出 ZIP', true); });
      $('#download-manifest').addEventListener('click', () => { const manifest = { sourceFile: state.file ? state.file.name : '', pageCount: state.pageCount, mode: state.mode, documents: state.groups.map(group => ({ id: group.id, name: group.name, type: typeName(group.typeCode), pages: group.pages })) }; const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'manifest.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('已导出 manifest', true); });
      $('#create-type-entry').addEventListener('click', () => { editingTypeCode = null; $('#type-detail-title').textContent = '创建文档类型'; $('#type-code').disabled = false; ['type-name','type-code','type-description','type-keywords','type-negative','type-instance','type-layout','type-anchors','type-instance-fields','type-page-role','type-confusions','type-page-range'].forEach(id => $('#' + id).value = ''); route('type-detail'); });
      $('#back-to-types').addEventListener('click', () => route('types'));
      $$('[data-type-tab]').forEach(button => button.addEventListener('click', () => { $$('[data-type-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.typePanel !== button.dataset.typeTab)); $$('[data-type-tab]').forEach(item => item.classList.toggle('primary', item === button)); }));
      $('#create-type').addEventListener('click', () => { const name = $('#type-name').value.trim(); const code = $('#type-code').value.trim().toUpperCase(); if (!name || !code) return notify('请输入类型名称和编码'); const payload = { name, code, description: $('#type-description').value.trim(), application: $('#type-application').value, industry: $('#type-industry').value, status: $('#type-status').value, keywords: $('#type-keywords').value.split(',').map(item => item.trim()).filter(Boolean), negative: $('#type-negative').value.split(',').map(item => item.trim()).filter(Boolean), instanceRegex: $('#type-instance').value.trim(), layout: $('#type-layout').value.split(',').map(item => item.trim()).filter(Boolean), anchors: $('#type-anchors').value.split(',').map(item => item.trim()).filter(Boolean), instanceFields: $('#type-instance-fields').value.split(',').map(item => item.trim()).filter(Boolean), pageRoles: $('#type-page-role').value.split(',').map(item => item.trim()).filter(Boolean), threshold: Number($('#type-threshold-auto').value) || 0.65, reviewThreshold: Number($('#type-threshold-review').value) || 0.45, confusions: $('#type-confusions').value.split(',').map(item => item.trim()).filter(Boolean) }; if (editingTypeCode) { const index = state.types.findIndex(type => type.code === editingTypeCode); if (index >= 0) state.types[index] = payload; } else state.types.push(payload); saveTypes(); editingTypeCode = null; renderAll(); route('types'); notify('文档类型规则已保存', true); });
      $('#create-template-entry').addEventListener('click', () => { editingTemplateId = null; templateDraft = []; $('#template-detail-title').textContent = '创建模板'; $('#template-name').value = ''; renderTemplateDraft(); route('template-detail'); });
      $('#back-to-templates').addEventListener('click', () => route('templates'));
      $('#add-template-slot').addEventListener('click', () => { const slot = { typeCode: $('#template-type').value, required: $('#template-required').value === 'true', minCount: Number($('#template-min-count').value), maxCount: Number($('#template-max-count').value), minPages: Number($('#template-min-pages').value), maxPages: Number($('#template-max-pages').value) }; templateDraft.push(slot); renderTemplateDraft(); notify(`已添加 Slot：${typeName(slot.typeCode)}`); });
      $('#clear-template-slots').addEventListener('click', () => { templateDraft = []; renderTemplateDraft(); });
      $('#create-template').addEventListener('click', () => { const name = $('#template-name').value.trim(); if (!name || templateDraft.length < 2) return notify('请输入模板名称并至少添加两个 Slot'); const payload = { name, slots: templateDraft.map(slot => ({ ...slot })), version: 'v1.0', status: 'enabled', updatedAt: new Date().toISOString().slice(0, 10) }; if (editingTemplateId) { const index = state.templates.findIndex(template => template.id === editingTemplateId); if (index >= 0) state.templates[index] = { ...state.templates[index], ...payload }; } else state.templates.push({ id: 'tpl-' + Date.now(), ...payload }); saveTemplates(); editingTemplateId = null; templateDraft = []; renderAll(); route('templates'); notify('模板 Slot 规则已保存', true); });
      $('#type-search').addEventListener('input', renderTypes);
      $('#template-search').addEventListener('input', renderTemplates);
      $('#save-flow').addEventListener('click', () => { state.flow = { review: $('#flow-review').checked, unknown: $('#flow-unknown').checked, defaultMode: $('#flow-default-mode').value }; saveFlow(); notify('流程配置已保存', true); });
      function applyFlow() { $('#flow-review').checked = state.flow.review !== false; $('#flow-unknown').checked = state.flow.unknown !== false; $('#flow-default-mode').value = state.flow.defaultMode || 'unordered'; const defaultInput = document.querySelector(`input[name="mode"][value="${state.flow.defaultMode || 'unordered'}"]`); if (defaultInput) { defaultInput.checked = true; updateModeSelection(defaultInput.value); } }
      route('tasks'); renderAll(); applyFlow(); if (window.lucide) lucide.createIcons({ attrs: { width: 16, height: 16, "stroke-width": 1.8 } });
    })();
  
