import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Flag,
  Layers3,
  MessageSquareText,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { UploadOverlay } from "@/components/command-center/UploadOverlay";
import { SettingsOverlay } from "@/components/command-center/SettingsOverlay";
import { ReportOverlay } from "@/components/command-center/ReportOverlay";
import { useDemo } from "@/hooks/useDemo";
import { trpc } from "@/providers/trpc-client";
import { DEMO_COMPANY, DEMO_FIELDS, DEMO_FILES, DEMO_PERIOD } from "@/lib/demo-data";
import { adaptStoredDiagnosis } from "@/lib/command-center-adapter";
import { commandCenterModel, revenueExpenseTrend } from "@/lib/command-center-data";
import { applyFieldConfirmation, type FieldConfirmationStatus } from "@/lib/field-confirmation-workflow";
import { toFieldType } from "@/lib/field-display";
import { isSupportedDataFile, parseDataFile } from "@/lib/file-parser";
import { createProcessingId, detectFileType, fileToBase64 } from "@/lib/file-upload-workflow";
import {
  toFieldStatus,
  type CommandFieldItem,
  type CommandFileItem,
  type OverlayPanel,
  type UploadOutcome,
  type UploadOverlayTab,
} from "@/lib/command-center-view";
import type { CommandCenterRouteProps } from "@/lib/command-center-routes";
import { DESKTOP_WORKSPACE_MIN_WIDTH } from "@/lib/desktop-workspace";
import type { ActionTask, EvidenceItem } from "@/lib/diagnosis-engine";

type WorkspaceSection = "overview" | "assets" | "themes" | "issues" | "reports" | "settings";
type WorkspaceNavigationTarget = "overview" | "files" | "fields" | "analysis" | "assistant" | "settings";
type WorkspacePath = "/" | "/files" | "/fields" | "/analysis" | "/assistant" | "/settings";

interface BusinessModule {
  id: "revenue" | "expense" | "profit" | "cashflow";
  name: string;
  value: string;
  budgetRate: string;
  budgetDiff: string;
  yoy: string;
  mom: string;
  tone: "good" | "warning" | "danger";
  insight: string;
}

interface PriorityIssue {
  id: string;
  title: string;
  severity: "高" | "中" | "低";
  impactAmount: string;
  impactMetric: string;
  improvement: string;
  action: string;
  evidence: string;
}

interface AnalysisTheme {
  name: string;
  status: "已解锁" | "部分解锁" | "待补充";
  requirement: string;
  next: string;
}

interface IssueRecord {
  title: string;
  source: string;
  impact: string;
  severity: "高" | "中" | "低";
  owner: string;
  action: string;
  due: string;
  status: string;
  evidence: string;
}

const sectionItems: Array<{ id: WorkspaceSection; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "经营总览", icon: BarChart3 },
  { id: "assets", label: "数据资产", icon: Database },
  { id: "themes", label: "分析主题", icon: Layers3 },
  { id: "issues", label: "议题库", icon: Flag },
  { id: "reports", label: "汇报包", icon: FileText },
  { id: "settings", label: "设置", icon: Settings },
];

const businessModules: BusinessModule[] = [
  {
    id: "revenue",
    name: "收入",
    value: "284.6 万",
    budgetRate: "105.4%",
    budgetDiff: "+14.6 万",
    yoy: "+16.2%",
    mom: "+12.5%",
    tone: "good",
    insight: "收入达成预算，新客贡献增长明显。",
  },
  {
    id: "expense",
    name: "费用",
    value: "42.7 万",
    budgetRate: "109.5%",
    budgetDiff: "+3.7 万",
    yoy: "+14.8%",
    mom: "+18.2%",
    tone: "warning",
    insight: "费用增长快于预算，市场费用是主要压力。",
  },
  {
    id: "profit",
    name: "利润",
    value: "85.4 万",
    budgetRate: "92.0%",
    budgetDiff: "-7.4 万",
    yoy: "+21.1%",
    mom: "+22.4%",
    tone: "danger",
    insight: "利润未达目标，收入增量被费用和交付成本抵消。",
  },
  {
    id: "cashflow",
    name: "现金流",
    value: "61.2 万",
    budgetRate: "90.0%",
    budgetDiff: "-6.8 万",
    yoy: "+5.6%",
    mom: "-6.8%",
    tone: "warning",
    insight: "现金回收弱于收入，需要关注应收周期。",
  },
];

const priorityIssues: PriorityIssue[] = [
  {
    id: "profit-gap",
    title: "利润目标未达成",
    severity: "高",
    impactAmount: "-7.4 万",
    impactMetric: "净利润完成率 92.0%",
    improvement: "预计可改善 5.8-8.6 万",
    action: "进入利润差异分析",
    evidence: "收入超预算，但市场费用与交付成本拖累利润。",
  },
  {
    id: "marketing-cost",
    title: "市场费用投入效率偏弱",
    severity: "中",
    impactAmount: "-3.2 万",
    impactMetric: "市场费用超预算 15.8%",
    improvement: "预计费用率下降 0.8-1.2pp",
    action: "复盘投放 ROI",
    evidence: "营销费用增长快于新客收入增长。",
  },
  {
    id: "cashflow-risk",
    title: "现金回收低于经营进度",
    severity: "中",
    impactAmount: "-6.8 万",
    impactMetric: "现金流完成率 90.0%",
    improvement: "预计回收 12-18 万应收款",
    action: "查看回款明细",
    evidence: "收入增长但现金流环比下降，应收周期延长。",
  },
];

const analysisThemes: AnalysisTheme[] = [
  { name: "利润目标未达成分析", status: "已解锁", requirement: "收入实际 + 费用实际 + 利润目标", next: "查看原因拆解" },
  { name: "收入预实分析", status: "已解锁", requirement: "销售实际 + 销售预算", next: "查看客户/产品差异" },
  { name: "费用超预算分析", status: "已解锁", requirement: "费用实际 + 费用预算", next: "拆解科目和部门" },
  { name: "现金流风险分析", status: "部分解锁", requirement: "银行流水 + 应收账款 + 回款计划", next: "补充回款计划" },
  { name: "人效分析", status: "部分解锁", requirement: "收入/利润 + 员工人数/工时", next: "补充员工人数或工时" },
  { name: "坪效分析", status: "待补充", requirement: "门店收入 + 门店面积", next: "上传面积数据" },
];

const issueRecords: IssueRecord[] = [
  {
    title: "利润目标未达成分析",
    source: "系统发现 · 经营总览",
    impact: "-7.4 万",
    severity: "高",
    owner: "经营负责人",
    action: "复盘费用与交付成本",
    due: "本周五",
    status: "待确认",
    evidence: "费用超预算 3.7 万，交付成本拖累 3.1 万。",
  },
  {
    title: "市场费用 ROI 复盘",
    source: "AI 建议 · 费用主题",
    impact: "-3.2 万",
    severity: "中",
    owner: "市场负责人",
    action: "暂停低效渠道并复盘新客转化",
    due: "6月25日",
    status: "已转任务",
    evidence: "营销费用增速高于新客收入增速。",
  },
  {
    title: "现金回收节奏落后",
    source: "系统发现 · 现金流主题",
    impact: "-6.8 万",
    severity: "中",
    owner: "财务负责人",
    action: "跟进 Top 10 应收客户",
    due: "6月28日",
    status: "跟踪中",
    evidence: "应收周期从 36 天延长到 42 天。",
  },
];

const fieldMappings = [
  { source: "成交日期", target: "日期", usage: "收入趋势 / 预算期间", status: "已确认" },
  { source: "客户名称", target: "客户", usage: "客户贡献 / 集中度", status: "已确认" },
  { source: "订单金额", target: "收入金额", usage: "收入实际 / 预实差异", status: "已确认" },
  { source: "销售人员", target: "人员", usage: "人员产出排行", status: "待确认" },
];

export default function CommandCenter({ initialPanel = null, initialFocus = "revenue", initialUploadTab = "upload" }: CommandCenterRouteProps) {
  const { isDemo } = useDemo();
  const utils = trpc.useUtils();
  const [section, setSection] = useState<WorkspaceSection>(initialPanel === "settings" ? "settings" : initialPanel === "report" ? "reports" : initialFocus === "profit" ? "themes" : "overview");
  const [overlay, setOverlay] = useState<OverlayPanel>(initialPanel);
  const [uploadTab, setUploadTab] = useState<UploadOverlayTab>(initialUploadTab);
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
  const [processingFileName, setProcessingFileName] = useState<string | null>(null);
  const [uploadOutcome, setUploadOutcome] = useState<UploadOutcome | null>(null);
  const [diagnosisRefreshNote, setDiagnosisRefreshNote] = useState<string | null>(null);
  const [fieldStatusOverrides, setFieldStatusOverrides] = useState<Record<number, FieldConfirmationStatus>>({});
  const [aiQuestion, setAiQuestion] = useState("为什么利润没有达标？");
  const [recentAiResponse, setRecentAiResponse] = useState("我建议先进入「利润目标未达成分析」，按收入正向贡献、费用拖累、交付成本拖累三段查看证据。");
  const aiInputRef = useRef<HTMLInputElement>(null);
  const processingFileNameRef = useRef<string | null>(null);

  const { data: companiesData } = trpc.company.list.useQuery(undefined, { enabled: !isDemo });
  const currentCompany = isDemo ? DEMO_COMPANY : companiesData?.[0];
  const companyId = currentCompany?.id;

  const { data: periodsData } = trpc.period.list.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId && !isDemo },
  );
  const currentPeriod = isDemo ? DEMO_PERIOD : periodsData?.[0];
  const periodId = currentPeriod?.id;

  const { data: fileListData } = trpc.file.list.useQuery(
    { periodId: periodId ?? 0 },
    { enabled: !!periodId && !isDemo },
  );
  const fileList: CommandFileItem[] = isDemo ? DEMO_FILES : (fileListData ?? []);

  const { data: fieldsData } = trpc.field.list.useQuery(
    { companyId: companyId ?? 0 },
    { enabled: !!companyId && !isDemo },
  );
  const baseFieldList: CommandFieldItem[] = (isDemo ? DEMO_FIELDS : (fieldsData ?? [])).map((field) => ({
    ...field,
    mappedField: field.mappedField ?? null,
    confidence: field.confidence ?? null,
    isConfirmed: toFieldStatus(field.isConfirmed),
  }));
  const fieldList = Object.entries(fieldStatusOverrides).reduce(
    (items, [fieldId, status]) => applyFieldConfirmation(items, Number(fieldId), status),
    baseFieldList,
  );

  const { data: aiSettingsData } = trpc.aiSettings.get.useQuery(undefined, { enabled: !isDemo });
  const diagnosisQuery = trpc.diagnosis.getByPeriod.useQuery(
    { periodId: periodId ?? 0 },
    { enabled: !!periodId && !isDemo },
  );

  const generateDiagnosis = trpc.diagnosis.generateForPeriod.useMutation({
    onSuccess: async () => {
      if (periodId) await utils.diagnosis.getByPeriod.invalidate({ periodId });
      setDiagnosisRefreshNote("已接入最新指标");
      toast.success("经营诊断已刷新");
    },
    onError: (error) => {
      toast.error(error.message || "诊断生成失败，请检查指标数据");
    },
  });
  const uploadFile = trpc.file.upload.useMutation({
    onSuccess: () => {
      if (periodId) utils.file.list.invalidate({ periodId });
    },
  });
  const processFile = trpc.parse.processFile.useMutation({
    onSuccess: async (data) => {
      if (data.autoAnalyzed && periodId && companyId) {
        await Promise.all([
          utils.metric.list.invalidate({ periodId }),
          utils.field.list.invalidate({ companyId }),
          utils.diagnosis.getByPeriod.invalidate({ periodId }),
        ]);
      }
      if (periodId) await utils.file.list.invalidate({ periodId });
      setProcessingFileId(null);
      setProcessingFileName(null);
      setUploadOutcome({ fileName: processingFileNameRef.current ?? "文件", autoAnalyzed: data.autoAnalyzed });
      processingFileNameRef.current = null;
      setDiagnosisRefreshNote(data.autoAnalyzed ? "新指标待诊断" : null);
      setSection("assets");
      toast.success(data.autoAnalyzed ? "文件已处理，指标已生成" : "文件已处理，请继续确认字段");
    },
    onError: () => {
      setProcessingFileId(null);
      setProcessingFileName(null);
      processingFileNameRef.current = null;
    },
  });
  const confirmField = trpc.field.confirm.useMutation({
    onSuccess: async () => {
      if (companyId) await utils.field.list.invalidate({ companyId });
      toast.success("字段状态已更新");
    },
    onError: (error) => {
      toast.error(error.message || "字段状态更新失败");
    },
  });

  const activeModel = isDemo ? commandCenterModel : adaptStoredDiagnosis(diagnosisQuery.data, commandCenterModel);
  const companyLabel = activeModel.summary.company;
  const periodLabel = activeModel.summary.period;
  const dataCompleteness = fileList.length >= 3 ? "数据完整度 82%" : "数据完整度 68%";
  const isUsingFallbackDiagnosis = !isDemo && !diagnosisQuery.data?.result;

  const notifyWorkspacePath = (path: WorkspacePath) => {
    window.dispatchEvent(new CustomEvent("command-center:workspace-path", { detail: path }));
  };

  const openUploadWorkspace = (tab: UploadOverlayTab) => {
    setUploadTab(tab);
    setOverlay("upload");
    setSection("assets");
    notifyWorkspacePath(tab === "fields" ? "/fields" : "/files");
  };

  const openSettingsWorkspace = () => {
    setSection("settings");
    setOverlay("settings");
    notifyWorkspacePath("/settings");
  };

  const openReportWorkspace = () => {
    setSection("reports");
    setOverlay("report");
  };

  const handleGenerateDiagnosis = () => {
    if (!companyId || !periodId || generateDiagnosis.isPending) return;
    generateDiagnosis.mutate({ companyId, periodId });
  };

  useEffect(() => {
    const handleWorkspaceNavigation = (event: Event) => {
      const target = (event as CustomEvent<WorkspaceNavigationTarget>).detail;
      if (target === "overview") {
        setSection("overview");
        setOverlay(null);
        notifyWorkspacePath("/");
      } else if (target === "files") {
        setSection("assets");
        setOverlay(null);
        notifyWorkspacePath("/files");
      } else if (target === "fields") {
        openUploadWorkspace("fields");
      } else if (target === "analysis" || target === "assistant") {
        setSection("themes");
        setOverlay(null);
        notifyWorkspacePath("/analysis");
      } else if (target === "settings") {
        openSettingsWorkspace();
      }
    };
    window.addEventListener("command-center:navigate", handleWorkspaceNavigation);
    return () => window.removeEventListener("command-center:navigate", handleWorkspaceNavigation);
  });

  const handleConfirmField = async (field: CommandFieldItem, status: FieldConfirmationStatus) => {
    const previousStatus = field.isConfirmed;
    setFieldStatusOverrides((overrides) => ({ ...overrides, [field.id]: status }));

    if (isDemo) {
      toast.info(status === "confirmed" ? "本地工作台已临时确认字段" : "本地工作台已临时忽略字段");
      return;
    }

    try {
      await confirmField.mutateAsync({
        id: field.id,
        mappedField: field.mappedField ?? field.originalField,
        fieldType: toFieldType(field.fieldType),
        isConfirmed: status === "confirmed" ? "confirmed" : "ignored",
      });
    } catch {
      setFieldStatusOverrides((overrides) => ({ ...overrides, [field.id]: previousStatus }));
    }
  };

  const handleUploadFile = async (file: File) => {
    if (isDemo) {
      toast.info("本地单用户模式展示样例链路，不保存上传文件");
      setSection("assets");
      return;
    }

    if (!companyId || !periodId) {
      toast.error("请先创建企业和账期，再上传数据");
      return;
    }

    if (!isSupportedDataFile(file.name)) {
      toast.error("仅支持 Excel (.xlsx, .xls) 或 CSV 文件");
      return;
    }

    const processingId = createProcessingId(file);
    setProcessingFileId(processingId);
    setProcessingFileName(file.name);
    processingFileNameRef.current = file.name;
    setUploadOutcome(null);
    setDiagnosisRefreshNote(null);

    try {
      const parsed = await parseDataFile(file);
      const base64 = await fileToBase64(file);
      const uploadResult = await uploadFile.mutateAsync({
        periodId,
        companyId,
        name: file.name,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileType: detectFileType(file.name),
        size: file.size,
        base64Content: base64,
      });

      await processFile.mutateAsync({
        fileId: uploadResult.id,
        companyId,
        periodId,
        headers: parsed.headers,
        previewRows: parsed.previewRows,
      });
    } catch (error) {
      setProcessingFileId(null);
      setProcessingFileName(null);
      processingFileNameRef.current = null;
      toast.error(error instanceof Error ? error.message : "文件处理失败，请重试");
    }
  };

  const askAi = (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setAiQuestion(cleanQuestion);
    setRecentAiResponse(buildAiResponse(cleanQuestion));
    if (cleanQuestion.includes("利润") || cleanQuestion.includes("达标")) {
      setSection("themes");
    }
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-30 overflow-hidden bg-[#f7f8fb] text-slate-900 min-[1180px]:left-[76px]"
      style={{ top: isDemo ? 28 : 0, minWidth: DESKTOP_WORKSPACE_MIN_WIDTH }}
      data-command-center-shell="true"
    >
      <div className="flex h-full">
        <aside className="flex w-[208px] shrink-0 flex-col border-r bg-white" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="border-b px-5 py-5" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
                智
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>数智经营</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>AI 经营诊断</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "settings") {
                      openSettingsWorkspace();
                      return;
                    }
                    if (item.id === "reports") {
                      setSection("reports");
                    } else {
                      setSection(item.id);
                    }
                    setOverlay(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                  style={{
                    background: active ? "rgba(37,99,235,0.08)" : "transparent",
                    color: active ? "var(--brand)" : "var(--text-secondary)",
                  }}
                >
                  <Icon size={16} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t px-4 py-4" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{companyLabel}</p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{periodLabel} · {dataCompleteness}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>经营期间 · {periodLabel}</p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{sectionTitle(section)}</h1>
                {isUsingFallbackDiagnosis ? (
                  <StatusPill tone="warning">规则诊断</StatusPill>
                ) : (
                  <StatusPill tone="good">数据诊断</StatusPill>
                )}
                {diagnosisRefreshNote ? <StatusPill tone="brand">{diagnosisRefreshNote}</StatusPill> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openUploadWorkspace("upload")}
                className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium"
                style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
              >
                <Upload size={14} />
                上传经营数据
              </button>
              {!isDemo && companyId && periodId ? (
                <button
                  onClick={handleGenerateDiagnosis}
                  disabled={generateDiagnosis.isPending}
                  className="rounded-xl border px-3 py-2 text-xs font-medium disabled:opacity-60"
                  style={{ borderColor: "rgba(37,99,235,0.22)", color: "var(--brand)", background: "rgba(37,99,235,0.06)" }}
                >
                  {generateDiagnosis.isPending ? "诊断中..." : diagnosisQuery.data?.result ? "重新诊断" : "生成诊断"}
                </button>
              ) : null}
              <button
                onClick={openReportWorkspace}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                生成汇报内容
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-auto px-6 py-5">
            {section === "overview" ? (
              <OverviewPage
                issues={priorityIssues}
                onAskAi={askAi}
                onOpenTheme={() => setSection("themes")}
                onSaveIssue={() => setSection("issues")}
              />
            ) : null}
            {section === "assets" ? (
              <DataAssetsPage
                files={fileList}
                fields={fieldList}
                onUpload={() => openUploadWorkspace("upload")}
                onFields={() => openUploadWorkspace("fields")}
                onAnalyze={() => setSection("themes")}
              />
            ) : null}
            {section === "themes" ? (
              <ProfitAnalysisPage
                evidence={activeModel.evidenceItems}
                actions={activeModel.actionTasks}
                onAskAi={askAi}
                onSaveIssue={() => setSection("issues")}
                onReport={() => setSection("reports")}
              />
            ) : null}
            {section === "issues" ? (
              <IssueLibraryPage records={issueRecords} onReport={() => setSection("reports")} />
            ) : null}
            {section === "reports" ? (
              <ReportPackPage onGenerate={openReportWorkspace} />
            ) : null}
            {section === "settings" ? (
              <SettingsLanding onOpenSettings={openSettingsWorkspace} />
            ) : null}
          </main>

          <footer className="shrink-0 border-t bg-white px-6 py-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.08)", color: "var(--brand)" }}>
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {["为什么利润没有达标？", "市场费用是否花多了？", "当前数据能做人效分析吗？"].map((question) => (
                    <button
                      key={question}
                      onClick={() => askAi(question)}
                      className="rounded-full px-3 py-1 text-[11px]"
                      style={{ background: "rgba(37,99,235,0.06)", color: "var(--brand)" }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl border bg-[#f8fafc] px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                  <MessageSquareText size={15} style={{ color: "var(--brand)" }} />
                  <input
                    ref={aiInputRef}
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") askAi(aiQuestion);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                    placeholder="问一个经营问题，系统会先判断数据是否充足，再生成分析议题"
                  />
                  <button onClick={() => askAi(aiQuestion)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--brand)" }}>
                    发送
                  </button>
                </div>
              </div>
              <div className="hidden w-[300px] shrink-0 rounded-xl border bg-white px-3 py-2 text-xs leading-5 xl:block" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>AI 建议：</span>{recentAiResponse}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {overlay === "upload" ? (
        <UploadOverlay
          files={fileList}
          fields={fieldList}
          isDemo={isDemo}
          isProcessing={!!processingFileId || uploadFile.isPending || processFile.isPending}
          processingLabel={processingFileName}
          uploadOutcome={uploadOutcome}
          canGenerateDiagnosis={!!companyId && !!periodId && !isDemo}
          hasDiagnosis={!!diagnosisQuery.data?.result}
          isGeneratingDiagnosis={generateDiagnosis.isPending}
          activeTab={uploadTab}
          onClose={() => setOverlay(null)}
          onActiveTabChange={setUploadTab}
          onUploadFile={handleUploadFile}
          onGenerateDiagnosis={handleGenerateDiagnosis}
          onConfirmField={handleConfirmField}
        />
      ) : null}
      {overlay === "settings" ? (
        <SettingsOverlay
          isDemo={isDemo}
          aiSettings={aiSettingsData}
          model={activeModel}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === "report" ? (
        <ReportOverlay
          model={activeModel}
          acceptedTaskIds={["task-marketing-roi"]}
          completedTaskIds={[]}
          onClose={() => setOverlay(null)}
        />
      ) : null}
    </div>
  );
}

function OverviewPage({
  issues,
  onAskAi,
  onOpenTheme,
  onSaveIssue,
}: {
  issues: PriorityIssue[];
  onAskAi: (question: string) => void;
  onOpenTheme: () => void;
  onSaveIssue: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
      <section className="rounded-[20px] bg-white px-7 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <StatusPill tone="brand">AI 经营结论</StatusPill>
              <StatusPill tone="warning">需关注利润质量</StatusPill>
            </div>
            <h2 className="text-[30px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
              收入达成预算，但利润承压。
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              本月收入完成率 105.4%，但市场费用和交付成本增长抵消了收入增量，现金回收也弱于经营进度。建议优先进入利润目标未达成分析。
            </p>
          </div>
          <div className="w-[220px] shrink-0 rounded-2xl border bg-[#f8fafc] p-4" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>经营健康度</p>
            <p className="mt-2 text-4xl font-semibold data-mono" style={{ color: "var(--warning)" }}>76</p>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>收入健康，利润和现金流需要进入专项分析。</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3">
        {businessModules.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id === "profit" ? onOpenTheme() : onAskAi(`分析${item.name}本期表现`)}
            className="rounded-2xl bg-white p-4 text-left shadow-[0_12px_36px_rgba(15,23,42,0.045)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                <p className="mt-2 text-2xl font-semibold data-mono" style={{ color: toneColor(item.tone) }}>{item.value}</p>
              </div>
              <StatusDot tone={item.tone} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              <MetricLine label="预算达成" value={item.budgetRate} tone={item.tone} />
              <MetricLine label="预算差异" value={item.budgetDiff} tone={item.tone} />
              <MetricLine label="同比" value={item.yoy} tone="good" />
              <MetricLine label="环比" value={item.mom} tone={item.mom.startsWith("-") ? "warning" : "good"} />
            </dl>
            <p className="mt-4 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{item.insight}</p>
          </button>
        ))}
      </section>

      <section className="grid min-h-[280px] grid-cols-[1fr_380px] gap-5">
        <div className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>优先关注问题</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>系统按影响金额、严重程度和可改善空间排序。</p>
            </div>
            <button onClick={onOpenTheme} className="rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--brand)" }}>
              进入深度分析
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {issues.map((issue) => (
              <div key={issue.id} className="grid grid-cols-[1fr_110px_130px_140px] items-center gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityPill severity={issue.severity} />
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{issue.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{issue.evidence}</p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>影响金额</p>
                  <p className="mt-1 text-sm font-semibold data-mono" style={{ color: issue.severity === "高" ? "var(--danger)" : "var(--warning)" }}>{issue.impactAmount}</p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>影响指标</p>
                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-primary)" }}>{issue.impactMetric}</p>
                </div>
                <button
                  onClick={() => issue.id === "profit-gap" ? onOpenTheme() : onAskAi(issue.title)}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold"
                  style={{ borderColor: "rgba(37,99,235,0.18)", color: "var(--brand)", background: "rgba(37,99,235,0.04)" }}
                >
                  {issue.action}
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>系统主动建议</h3>
          <div className="mt-4 space-y-3">
            {[
              "先分析利润未达标原因，确认费用和成本拖累。",
              "检查市场费用是否带来对应新客收入。",
              "补充回款计划，提升现金流风险判断可信度。",
            ].map((item) => (
              <button key={item} onClick={() => onAskAi(item)} className="w-full rounded-xl bg-[#f8fafc] px-4 py-3 text-left text-sm leading-6 transition-colors hover:bg-[#eef4ff]" style={{ color: "var(--text-secondary)" }}>
                {item}
              </button>
            ))}
          </div>
          <button onClick={onSaveIssue} className="mt-5 w-full rounded-xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
            查看已保存议题
          </button>
        </div>
      </section>
    </div>
  );
}

function DataAssetsPage({
  files,
  fields,
  onUpload,
  onFields,
  onAnalyze,
}: {
  files: CommandFileItem[];
  fields: CommandFieldItem[];
  onUpload: () => void;
  onFields: () => void;
  onAnalyze: () => void;
}) {
  const confirmedFields = fields.filter((field) => field.isConfirmed === "confirmed").length;
  return (
    <div className="mx-auto grid max-w-[1220px] grid-cols-[1fr_360px] gap-5">
      <section className="rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <StatusPill tone="good">销售实际数据已识别</StatusPill>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>
              当前数据可用，可支持收入趋势、收入预实与客户贡献分析。
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              系统已识别 {files.length} 个样例文件和 {fields.length} 个字段，字段映射确认度约 {Math.round((confirmedFields / Math.max(fields.length, 1)) * 100)}%。字段明细和数据预览已收纳到二级面板，避免首屏过载。
            </p>
          </div>
          <button onClick={onUpload} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
            <Upload size={16} />
            上传数据
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <RecognitionBlock title="数据识别结果" rows={[["数据类型", "销售收入"], ["数据性质", "实际数据"], ["期间", "2026-04"], ["记录量", "3,284 行"]]} />
          <RecognitionBlock title="字段映射状态" rows={[["已确认", `${confirmedFields} 个字段`], ["待确认", `${Math.max(fields.length - confirmedFields, 0)} 个字段`], ["关键字段", "日期 / 客户 / 金额"], ["置信度", "88%"]]} />
          <RecognitionBlock title="数据质量问题" rows={[["空值", "12 行金额为空"], ["重复", "3 个客户疑似重复"], ["异常值", "2 笔大额订单"], ["状态", "可分析"]]} />
        </div>

        <div className="mt-6 rounded-2xl bg-[#f8fafc] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>可支持分析清单</h3>
            <button onClick={onAnalyze} className="text-xs font-semibold" style={{ color: "var(--brand)" }}>开始分析</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {analysisThemes.slice(0, 6).map((theme) => (
              <div key={theme.name} className="rounded-xl bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{theme.name}</p>
                  <CapabilityPill status={theme.status} />
                </div>
                <p className="mt-2 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{theme.requirement}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>字段映射预览</h3>
            <button onClick={onFields} className="text-xs font-semibold" style={{ color: "var(--brand)" }}>打开字段抽屉</button>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {fieldMappings.map((field) => (
              <div key={field.source} className="grid grid-cols-[1fr_1fr_1.5fr_90px] items-center gap-4 px-4 py-3 text-xs">
                <span style={{ color: "var(--text-secondary)" }}>{field.source}</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{field.target}</span>
                <span style={{ color: "var(--text-muted)" }}>{field.usage}</span>
                <StatusPill tone={field.status === "已确认" ? "good" : "warning"}>{field.status}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <SidePanel title="推荐下一步">
          <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            建议先进入利润目标未达成分析。当前销售实际和预算数据较完整，但人效与现金流分析还需要补充员工人数、工时和回款计划。
          </p>
          <button onClick={onAnalyze} className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
            开始利润分析
          </button>
        </SidePanel>
        <SidePanel title="待补充数据">
          <GapList items={["费用预算：用于判断超预算科目", "员工人数 / 工时：用于做人效分析", "门店面积：用于做坪效分析", "回款计划：用于现金流风险判断"]} />
        </SidePanel>
        <SidePanel title="已上传文件">
          <div className="space-y-2">
            {files.slice(0, 4).map((file) => (
              <div key={file.id} className="rounded-xl bg-[#f8fafc] px-3 py-2">
                <p className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{file.originalName}</p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>已处理 · 参与分析</p>
              </div>
            ))}
          </div>
        </SidePanel>
      </aside>
    </div>
  );
}

function ProfitAnalysisPage({
  evidence,
  actions,
  onAskAi,
  onSaveIssue,
  onReport,
}: {
  evidence: EvidenceItem[];
  actions: ActionTask[];
  onAskAi: (question: string) => void;
  onSaveIssue: () => void;
  onReport: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-[1220px] grid-cols-[minmax(0,1fr)_340px] gap-5">
      <section className="space-y-5">
        <div className="rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <StatusPill tone="warning">临时分析 · 待确认</StatusPill>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>利润目标未达成分析</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                结论：收入超预算 5.4%，但市场费用与交付成本抵消了利润增量，导致净利润低于目标 7.4 万。
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={onSaveIssue} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>保存为议题</button>
              <button onClick={onReport} className="rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ background: "var(--brand)" }}>加入汇报</button>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>原因拆解</h3>
          <div className="mt-5 grid grid-cols-[1fr_32px_1fr_32px_1fr_32px_1fr] items-stretch gap-2">
            <DecompositionNode label="收入正向贡献" value="+14.6 万" tone="good" detail="收入完成预算 105.4%" />
            <ArrowRight className="self-center justify-self-center" size={18} style={{ color: "var(--text-muted)" }} />
            <DecompositionNode label="市场费用拖累" value="-3.7 万" tone="warning" detail="费用超预算 15.8%" />
            <ArrowRight className="self-center justify-self-center" size={18} style={{ color: "var(--text-muted)" }} />
            <DecompositionNode label="交付成本拖累" value="-11.4 万" tone="danger" detail="项目毛利低于目标" />
            <ArrowRight className="self-center justify-self-center" size={18} style={{ color: "var(--text-muted)" }} />
            <DecompositionNode label="利润目标差异" value="-7.4 万" tone="danger" detail="完成率 92.0%" />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_0.9fr] gap-5">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>趋势变化</h3>
              <StatusPill tone="warning">费用异常点</StatusPill>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueExpenseTrend}>
                  <CartesianGrid stroke="#E9EEF6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#DDE5F0" }} />
                  <Line type="monotone" dataKey="revenue" name="收入" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="expense" name="费用" stroke="#B45309" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="profit" name="利润" stroke="#0F766E" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>关键指标</h3>
            <div className="mt-4 space-y-3">
              {[
                ["利润完成率", "92.0%", "danger"],
                ["收入预算达成", "105.4%", "good"],
                ["费用预算达成", "109.5%", "warning"],
                ["市场费用超支", "15.8%", "warning"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span className="text-sm font-semibold data-mono" style={{ color: toneColor(tone as BusinessModule["tone"]) }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>建议动作</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(actions.length ? actions : fallbackActions()).slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-2xl bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{task.reason}</p>
                <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <span>{task.owner}</span>
                  <span>{task.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <SidePanel title="证据追溯">
          <EvidenceList evidence={evidence} />
        </SidePanel>
        <SidePanel title="计算逻辑">
          <div className="space-y-3 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
            <p>利润差异 = 实际利润 - 目标利润。</p>
            <p>费用拖累 = 实际费用 - 预算费用。</p>
            <p>收入贡献 = 实际收入 - 预算收入。</p>
          </div>
          <button className="mt-4 w-full rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
            查看原始明细
          </button>
        </SidePanel>
        <SidePanel title="AI 追问">
          <div className="space-y-2">
            {["如果排除一次性费用会怎样？", "市场费用有没有带来新客增长？", "这个结论能否用于老板汇报？"].map((prompt) => (
              <button key={prompt} onClick={() => onAskAi(prompt)} className="w-full rounded-xl bg-[#f8fafc] px-3 py-2 text-left text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
                {prompt}
              </button>
            ))}
          </div>
        </SidePanel>
      </aside>
    </div>
  );
}

function IssueLibraryPage({ records, onReport }: { records: IssueRecord[]; onReport: () => void }) {
  return (
    <div className="mx-auto max-w-[1220px] rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>议题库</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>承接系统发现的问题和用户确认保存的问题。</p>
        </div>
        <button onClick={onReport} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>加入汇报包</button>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {records.map((record) => (
          <div key={record.title} className="grid grid-cols-[1.2fr_100px_110px_120px_1fr_90px] items-center gap-4 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SeverityPill severity={record.severity} />
                <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{record.title}</p>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{record.source} · {record.evidence}</p>
            </div>
            <Cell label="影响金额" value={record.impact} danger />
            <Cell label="责任人" value={record.owner} />
            <Cell label="截止时间" value={record.due} />
            <Cell label="建议动作" value={record.action} />
            <StatusPill tone={record.status === "已转任务" ? "brand" : record.status === "跟踪中" ? "warning" : "default"}>{record.status}</StatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportPackPage({ onGenerate }: { onGenerate: () => void }) {
  const reportSections = ["本月经营结论", "核心指标", "主要问题", "原因分析", "行动建议", "责任分配", "下月关注事项"];
  return (
    <div className="mx-auto grid max-w-[1220px] grid-cols-[1fr_360px] gap-5">
      <section className="rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
        <StatusPill tone="brand">AI 汇报内容生成</StatusPill>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>2026 年 4 月经营分析汇报包</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          汇报包不做 PPT 编辑器，只管理已确认分析议题和证据素材，由大模型生成适合内部展示的内容稿、页面标题、核心观点和图表建议。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {reportSections.map((sectionName, index) => (
            <div key={sectionName} className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold" style={{ color: "var(--brand)" }}>{index + 1}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{sectionName}</span>
            </div>
          ))}
        </div>
      </section>
      <aside className="space-y-5">
        <SidePanel title="已选议题">
          <GapList items={["利润目标未达成分析", "市场费用 ROI 复盘", "现金回收节奏落后"]} />
        </SidePanel>
        <SidePanel title="生成方式">
          <GapList items={["老板汇报版：结论和动作优先", "经营分析版：保留证据和口径", "财务复盘版：强调预算和差异"]} />
          <button onClick={onGenerate} className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>生成汇报内容稿</button>
        </SidePanel>
      </aside>
    </div>
  );
}

function SettingsLanding({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="mx-auto max-w-[900px] rounded-[20px] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
      <StatusPill tone="brand">模型与系统设置</StatusPill>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--text-primary)" }}>配置 AI 经营顾问能力</h2>
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
        MVP 阶段保留 OpenAI-compatible 模型配置。系统负责数据治理和计算，大模型负责字段语义、分析解释和汇报内容生成。
      </p>
      <button onClick={onOpenSettings} className="mt-6 rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
        打开设置浮窗
      </button>
    </div>
  );
}

function sectionTitle(section: WorkspaceSection): string {
  const item = sectionItems.find((entry) => entry.id === section);
  return item?.label ?? "经营总览";
}

function buildAiResponse(question: string): string {
  if (question.includes("人效")) return "当前可部分做人效：已有收入和销售人员字段，缺少员工人数、人工成本或工时。建议补充员工数据表。";
  if (question.includes("市场") || question.includes("费用")) return "建议从市场费用预算差异、新客收入贡献和渠道 ROI 三个证据查看，先确认费用增长是否带来产出。";
  if (question.includes("利润") || question.includes("达标")) return "利润未达标的主因是费用与交付成本拖累。已为你打开利润目标未达成分析，可查看证据和计算逻辑。";
  return "我会先检查当前数据是否支持该分析，再给出可做分析、缺失数据和下一步建议。";
}

function RecognitionBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] p-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
            <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DecompositionNode({ label, value, tone, detail }: { label: string; value: string; tone: BusinessModule["tone"]; detail: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] p-4">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mt-2 text-xl font-semibold data-mono" style={{ color: toneColor(tone) }}>{value}</p>
      <p className="mt-2 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>{detail}</p>
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: EvidenceItem[] }) {
  const visibleEvidence = evidence.length ? evidence.slice(0, 4) : fallbackEvidence();
  return (
    <div className="space-y-3">
      {visibleEvidence.map((item) => (
        <div key={item.id} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
            <span className="text-xs font-semibold data-mono" style={{ color: "var(--brand)" }}>{item.value}</span>
          </div>
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>{item.source}</p>
          <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>{item.note}</p>
        </div>
      ))}
    </div>
  );
}

function fallbackEvidence(): EvidenceItem[] {
  return [
    { id: "fallback-profit", title: "利润预算差异", source: "利润目标 / 净利润", value: "-7.4 万", note: "实际利润低于目标，需拆解费用和成本拖累。" },
  ];
}

function fallbackActions(): ActionTask[] {
  return [
    {
      id: "fallback-action",
      title: "复盘市场费用和交付成本",
      type: "利润修复",
      priority: "高",
      owner: "经营负责人",
      due: "本周五",
      reason: "利润完成率低于目标，需要确认费用投入产出。",
      metrics: ["利润完成率", "费用率"],
      expectedImpact: "改善利润差异 5-8 万",
      status: "待处理",
    },
  ];
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {children}
    </section>
  );
}

function GapList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
          <CheckCircle2 className="mt-0.5 shrink-0" size={13} style={{ color: "var(--success)" }} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function MetricLine({ label, value, tone }: { label: string; value: string; tone: BusinessModule["tone"] }) {
  return (
    <>
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="text-right font-semibold data-mono" style={{ color: toneColor(tone) }}>{value}</dd>
    </>
  );
}

function Cell({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mt-1 truncate text-xs font-semibold" style={{ color: danger ? "var(--danger)" : "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "brand" | "good" | "warning" | "danger" | "default"; children: React.ReactNode }) {
  const palette = {
    brand: ["var(--brand)", "rgba(37,99,235,0.08)"],
    good: ["var(--success)", "rgba(15,118,110,0.08)"],
    warning: ["var(--warning)", "rgba(180,83,9,0.08)"],
    danger: ["var(--danger)", "rgba(220,38,38,0.08)"],
    default: ["var(--text-muted)", "rgba(100,116,139,0.08)"],
  }[tone];
  return (
    <span className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ color: palette[0], background: palette[1] }}>
      {children}
    </span>
  );
}

function SeverityPill({ severity }: { severity: "高" | "中" | "低" }) {
  const tone = severity === "高" ? "danger" : severity === "中" ? "warning" : "good";
  return <StatusPill tone={tone}>{severity}严重度</StatusPill>;
}

function CapabilityPill({ status }: { status: AnalysisTheme["status"] }) {
  const tone = status === "已解锁" ? "good" : status === "部分解锁" ? "warning" : "default";
  return <StatusPill tone={tone}>{status}</StatusPill>;
}

function StatusDot({ tone }: { tone: BusinessModule["tone"] }) {
  return <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: toneColor(tone) }} />;
}

function toneColor(tone: BusinessModule["tone"]): string {
  if (tone === "good") return "var(--success)";
  if (tone === "warning") return "var(--warning)";
  return "var(--danger)";
}
