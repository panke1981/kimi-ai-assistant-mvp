import type { DiagnosisDomain } from "@/lib/command-center-data";
import type { ActionTask, CommandCenterModel, DiagnosisBlock, EvidenceItem, RiskSignal, Tone } from "@/lib/diagnosis-engine";
import type { FieldType } from "@/lib/field-display";
import type { fileTypeLabels } from "@/lib/file-upload-workflow";

export type OverlayPanel = "upload" | "settings" | "report" | null;
export type UploadOverlayTab = "upload" | "fields" | "quality";
export type CanvasMode = "overview" | "risk" | "actions";

export interface CommandActionOption {
  id: string;
  overlay: NonNullable<OverlayPanel>;
  uploadTab?: UploadOverlayTab;
  title: string;
  meta: string;
  detail: string;
  keywords: string[];
}

export type StrategistSelection =
  | { kind: "diagnosis"; id: DiagnosisDomain }
  | { kind: "risk"; id: string }
  | { kind: "task"; id: string };

type StrategistActionSelection =
  | { kind: "diagnosis"; id: DiagnosisDomain }
  | { kind: "risk"; id: string; relatedMetrics: string[] }
  | { kind: "task"; id: string };

export interface StrategistMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AnalysisTrailEntry {
  key: string;
  label: "诊断" | "风险" | "任务";
  title: string;
  detail: string;
  selection: StrategistSelection;
  tone: Tone;
}

export interface AiSettingsSnapshot {
  provider: string;
  baseUrl: string | null;
  model: string | null;
  isActive: "yes" | "no";
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
}

export interface CommandFileItem {
  id: number;
  originalName: string;
  fileType: keyof typeof fileTypeLabels;
  size: number | null;
  status: "uploading" | "processing" | "processed" | "error";
  createdAt: Date;
}

export interface CommandFieldItem {
  id: number;
  originalField: string;
  mappedField: string | null;
  fieldType: FieldType | string | null;
  confidence: string | null;
  isConfirmed: "pending" | "confirmed" | "ignored";
}

export interface UploadOutcome {
  fileName: string;
  autoAnalyzed: boolean;
}

export interface AnalysisStep {
  label: string;
  title: string;
  description: string;
  tone: keyof typeof toneStyles;
}

export interface StrategistAnswerContext {
  question: string;
  diagnosis?: DiagnosisBlock;
  risk?: RiskSignal;
  task?: ActionTask;
  evidence: EvidenceItem[];
  actions: ActionTask[];
}

export interface CanvasModeOption {
  id: CanvasMode;
  title: string;
  description: string;
  actionLabel: string;
}

export const toneStyles = {
  good: {
    color: "var(--success)",
    bg: "rgba(15,118,110,0.08)",
    border: "rgba(15,118,110,0.22)",
  },
  watch: {
    color: "var(--warning)",
    bg: "rgba(180,83,9,0.08)",
    border: "rgba(180,83,9,0.2)",
  },
  risk: {
    color: "var(--danger)",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.18)",
  },
};

export const canvasModeOptions: CanvasModeOption[] = [
  {
    id: "overview",
    title: "经营总览",
    description: "先看收入、费用、利润和现金流的整体态势。",
    actionLabel: "查看全局态势",
  },
  {
    id: "risk",
    title: "风险定位",
    description: "把画布聚焦到触发规则、风险证据和对应动作。",
    actionLabel: "聚焦风险信号",
  },
  {
    id: "actions",
    title: "执行跟踪",
    description: "只看已采纳任务、负责人、截止时间和验证指标。",
    actionLabel: "推进任务闭环",
  },
];

export const commandActionOptions: CommandActionOption[] = [
  {
    id: "upload",
    overlay: "upload",
    uploadTab: "upload",
    title: "上传数据",
    meta: "浮窗",
    detail: "导入 Excel / CSV，确认字段和数据质量",
    keywords: ["上传", "导入", "文件", "Excel", "CSV", "资料"],
  },
  {
    id: "fields",
    overlay: "upload",
    uploadTab: "fields",
    title: "字段确认",
    meta: "浮窗",
    detail: "检查字段映射、置信度和待确认字段",
    keywords: ["字段", "确认", "映射", "表头", "置信度"],
  },
  {
    id: "quality",
    overlay: "upload",
    uploadTab: "quality",
    title: "数据质量",
    meta: "浮窗",
    detail: "查看数据可分析度、异常文件和字段质量",
    keywords: ["质量", "数据质量", "可分析度", "异常", "低置信"],
  },
  {
    id: "settings",
    overlay: "settings",
    title: "模型设置",
    meta: "浮窗",
    detail: "查看模型、预算、规则和指标口径",
    keywords: ["设置", "模型", "预算", "规则", "指标", "口径"],
  },
  {
    id: "report",
    overlay: "report",
    title: "生成报告",
    meta: "浮窗",
    detail: "打开经营复盘报告并复制摘要",
    keywords: ["报告", "复盘", "摘要", "导出", "复制"],
  },
];

export function getCanvasModeMeta(mode: CanvasMode) {
  return canvasModeOptions.find((option) => option.id === mode) ?? canvasModeOptions[0];
}

export function getCanvasModeForSelection(selection: StrategistSelection): CanvasMode {
  if (selection.kind === "risk") return "risk";
  if (selection.kind === "task") return "actions";
  return "overview";
}

export function toFieldStatus(value: string): CommandFieldItem["isConfirmed"] {
  if (value === "confirmed" || value === "ignored") return value;
  return "pending";
}

export function findRelatedEvidence(evidenceItems: EvidenceItem[], metrics: string[], fallback: EvidenceItem[]) {
  const related = evidenceItems.filter((item) => {
    const haystack = `${item.title} ${item.source} ${item.note}`;
    return metrics.some((metric) => haystack.includes(metric));
  });
  return related.length > 0 ? related : fallback;
}

const diagnosisActionMetrics: Record<DiagnosisDomain, string[]> = {
  revenue: ["新客收入", "复购率", "复购收入", "营业收入"],
  expense: ["营销费用", "费用率", "渠道收入", "运营费用"],
  profit: ["费用率", "营销费用", "净利润", "毛利率"],
  cashflow: ["应收款", "现金流净额", "回款周期", "回款率"],
};

function scoreTaskForMetrics(taskMetrics: string[], preferredMetrics: string[]) {
  return preferredMetrics.reduce((score, metric, index) => (
    taskMetrics.includes(metric) ? score + preferredMetrics.length - index : score
  ), 0);
}

export function rankStrategistActions(
  actionTasks: ActionTask[],
  selection: StrategistActionSelection,
  maxActions = 2,
) {
  if (selection.kind === "task") {
    const task = actionTasks.find((item) => item.id === selection.id);
    return task ? [task] : [];
  }

  const preferredMetrics = selection.kind === "risk"
    ? selection.relatedMetrics
    : diagnosisActionMetrics[selection.id];

  return actionTasks
    .filter((task) => task.metrics.some((metric) => preferredMetrics.includes(metric)))
    .sort((a, b) => scoreTaskForMetrics(b.metrics, preferredMetrics) - scoreTaskForMetrics(a.metrics, preferredMetrics))
    .slice(0, maxActions);
}

export function resolveSummaryReasonSelection(index: number, riskSignals: RiskSignal[]): StrategistSelection {
  if (index === 0) return { kind: "diagnosis", id: "revenue" };
  if (index === 1) return { kind: "diagnosis", id: "profit" };

  if (index === 2) {
    const marketingRisk = riskSignals.find((risk) => risk.id === "risk-marketing-efficiency")
      ?? riskSignals.find((risk) => risk.relatedMetrics.includes("营销费用"));
    return marketingRisk ? { kind: "risk", id: marketingRisk.id } : { kind: "diagnosis", id: "expense" };
  }

  const retentionRisk = riskSignals.find((risk) => risk.id === "risk-retention")
    ?? riskSignals.find((risk) => risk.relatedMetrics.includes("复购率"));
  return retentionRisk ? { kind: "risk", id: retentionRisk.id } : { kind: "diagnosis", id: "revenue" };
}

export function isSummaryReasonSelectionActive(index: number, selection: StrategistSelection) {
  if (index === 0) return selection.kind === "diagnosis" && selection.id === "revenue";
  if (index === 1) return selection.kind === "diagnosis" && selection.id === "profit";
  if (index === 2) {
    return (selection.kind === "risk" && selection.id === "risk-marketing-efficiency")
      || (selection.kind === "diagnosis" && selection.id === "expense");
  }
  return selection.kind === "risk" && selection.id === "risk-retention";
}

export function buildAnalysisTrailEntry(
  selection: StrategistSelection,
  model: CommandCenterModel,
): AnalysisTrailEntry {
  if (selection.kind === "risk") {
    const risk = model.riskSignals.find((item) => item.id === selection.id);
    return {
      key: `risk:${selection.id}`,
      label: "风险",
      title: risk?.name ?? "风险信号",
      detail: risk ? `${risk.level}风险 · ${risk.relatedMetrics.slice(0, 2).join(" / ")}` : "风险详情",
      selection,
      tone: risk?.level === "高" ? "risk" : "watch",
    };
  }

  if (selection.kind === "task") {
    const task = model.actionTasks.find((item) => item.id === selection.id);
    return {
      key: `task:${selection.id}`,
      label: "任务",
      title: task?.title ?? "行动任务",
      detail: task ? `${task.owner} · ${task.due}` : "任务详情",
      selection,
      tone: task?.priority === "高" ? "risk" : "watch",
    };
  }

  const block = model.diagnosisBlocks.find((item) => item.id === selection.id);
  return {
    key: `diagnosis:${selection.id}`,
    label: "诊断",
    title: block?.title ?? "诊断图层",
    detail: block ? `${block.status} · ${block.metric}` : "诊断详情",
    selection,
    tone: block?.tone ?? "watch",
  };
}

export function updateAnalysisTrail(
  currentTrail: AnalysisTrailEntry[],
  nextEntry: AnalysisTrailEntry,
  maxItems = 5,
) {
  return [
    nextEntry,
    ...currentTrail.filter((item) => item.key !== nextEntry.key),
  ].slice(0, maxItems);
}

export function buildStrategistAnswer({
  question,
  diagnosis,
  risk,
  task,
  evidence,
  actions,
}: StrategistAnswerContext) {
  const normalizedQuestion = question.toLowerCase();
  const primaryEvidence = evidence[0];
  const secondaryEvidence = evidence[1];
  const primaryAction = task ?? actions[0];

  if (task) {
    if (question.includes("3 个") || question.includes("步骤") || normalizedQuestion.includes("step")) {
      return `可以拆成 3 步：1. ${task.owner} 先核对 ${task.metrics.slice(0, 2).join("、") || "关键指标"}，确认口径和责任清单；2. 在 ${task.due} 前推进「${task.title}」，优先处理触发原因：${task.reason}；3. 用 ${task.metrics.join("、") || "验证指标"} 复盘，目标是${task.expectedImpact}。`;
    }
    if (question.includes("哪些数据") || question.includes("先看")) {
      return `这个任务先看三类数据：${task.metrics.join("、") || "关键经营指标"}。当前触发原因是：${task.reason}；如果有明细表，优先按客户、渠道、账期拆开，确认是否由少数大额项目造成。`;
    }
    if (question.includes("做不完") || question.includes("风险")) {
      return `如果本周做不完，主要风险是问题继续拖到下个账期，${task.expectedImpact}无法验证。建议先完成最小闭环：锁定负责人 ${task.owner}、确认截止 ${task.due}、至少跟踪 ${task.metrics.slice(0, 2).join("、") || "核心指标"}。`;
    }
    return `${task.title} 的触发原因是：${task.reason} 建议由 ${task.owner} 在 ${task.due} 前推进，验收指标为 ${task.metrics.join("、") || "关键经营指标"}，预期影响是${task.expectedImpact}。`;
  }

  if (risk) {
    if (question.includes("根因") || question.includes("为什么")) {
      return `这个风险的根因优先按规则「${risk.rule}」排查。当前最可疑的是 ${risk.relatedMetrics.slice(0, 3).join("、")} 的联动异常；证据上先看 ${primaryEvidence ? `${primaryEvidence.title}（${primaryEvidence.value}）` : "第一条关键证据"}${secondaryEvidence ? ` 和 ${secondaryEvidence.title}（${secondaryEvidence.value}）` : ""}。建议第一动作是${primaryAction ? `「${primaryAction.title}」` : "先补齐负责人和截止时间"}。`;
    }
    if (question.includes("证据")) {
      return `先查两条证据：${primaryEvidence ? `${primaryEvidence.title}：${primaryEvidence.note}` : "当前证据不足"}${secondaryEvidence ? `；${secondaryEvidence.title}：${secondaryEvidence.note}` : ""}。如果两条都指向 ${risk.relatedMetrics.slice(0, 2).join("、")}，这个风险就可以进入执行处理。`;
    }
    if (question.includes("停止") || question.includes("低效")) {
      return `先暂停与 ${risk.relatedMetrics.slice(0, 2).join("、")} 明显背离的动作，再保留能带来现金或利润改善的部分。当前建议动作是${primaryAction ? `「${primaryAction.title}」：${primaryAction.expectedImpact}` : "先形成一条负责人与截止时间明确的任务"}。`;
    }
    return `${risk.name} 的规则是「${risk.rule}」。当前相关指标包括 ${risk.relatedMetrics.join("、")}，建议先核验证据链，再采纳最靠近该风险的动作：${primaryAction?.title ?? "等待任务拆解"}。`;
  }

  if (diagnosis) {
    if (question.includes("数据") || question.includes("影响结论") || question.includes("缺口")) {
      return `${diagnosis.title} 当前判断为「${diagnosis.status}」。已有证据是 ${evidence.slice(0, 2).map((item) => `${item.title} ${item.value}`).join("、") || "暂无直接证据"}；还需要补充字段或明细：客户/渠道/产品拆分、账期口径、异常大额订单，才能判断这条结论是否由结构变化造成。`;
    }
    if (question.includes("证据")) {
      return `${diagnosis.title} 最关键的证据是 ${primaryEvidence ? `${primaryEvidence.title}（${primaryEvidence.value}）` : "暂无关键证据"}。${secondaryEvidence ? `第二证据是 ${secondaryEvidence.title}（${secondaryEvidence.value}）。` : ""}如果这两条与业务明细一致，当前「${diagnosis.status}」判断可信度会更高。`;
    }
    if (question.includes("下一步") || question.includes("优先")) {
      return `下一步优先推进${primaryAction ? `「${primaryAction.title}」` : "证据复核任务"}。原因是 ${diagnosis.verdict}；建议把验证指标定为 ${primaryAction?.metrics.join("、") || "收入、费用、利润、现金流"}。`;
    }
    return `${diagnosis.title} 当前判断为「${diagnosis.status}」。核心依据是 ${evidence.slice(0, 2).map((item) => `${item.title} ${item.value}`).join("、") || diagnosis.verdict}。`;
  }

  return "当前还没有选中具体诊断、风险或任务。建议先点击左侧诊断图层，或在顶部搜索风险和行动任务。";
}
