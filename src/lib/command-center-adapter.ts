import type {
  ActionTask,
  BusinessSnapshot,
  CommandCenterModel,
  DiagnosisBlock,
  EvidenceItem,
  RiskLevel,
  RiskSignal,
  TaskPriority,
} from "@/lib/diagnosis-engine";
import { evaluateBusinessDiagnosis } from "@/lib/diagnosis-engine";

type StoredRiskLevel = "high" | "medium" | "low";
type StoredTaskPriority = "high" | "medium" | "low";
type StoredTaskStatus = "pending" | "in_progress" | "done" | "completed";

interface StoredDiagnosisResult {
  summary: string;
  healthScore: number;
  confidence: number;
  reasons: unknown;
  diagnosisBlocks: unknown;
  snapshot: unknown;
}

interface StoredRiskSignal {
  code: string;
  name: string;
  level: StoredRiskLevel;
  rule: string | null;
  description: string | null;
  relatedMetrics: unknown;
}

interface StoredEvidenceItem {
  code: string;
  title: string;
  source: string | null;
  value: string | null;
  note: string | null;
}

interface StoredActionTask {
  code: string;
  title: string;
  type: string | null;
  priority: StoredTaskPriority;
  owner: string | null;
  dueDate: string | null;
  triggerReason: string | null;
  relatedMetrics: unknown;
  expectedImpact: string | null;
  status: StoredTaskStatus;
}

export interface StoredDiagnosisBundle {
  result: StoredDiagnosisResult | null;
  risks?: StoredRiskSignal[];
  evidence?: StoredEvidenceItem[];
  tasks?: StoredActionTask[];
  riskSignals?: StoredRiskSignal[];
  evidenceItems?: StoredEvidenceItem[];
  actionTasks?: StoredActionTask[];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isBusinessSnapshot(value: unknown): value is BusinessSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<BusinessSnapshot>;
  return typeof snapshot.company === "string"
    && typeof snapshot.period === "string"
    && typeof snapshot.revenue?.value === "number"
    && typeof snapshot.expense?.value === "number"
    && typeof snapshot.netProfit?.value === "number"
    && typeof snapshot.cashflow?.value === "number";
}

function asDiagnosisBlocks(value: unknown, fallback: DiagnosisBlock[]): DiagnosisBlock[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is DiagnosisBlock => {
    if (!item || typeof item !== "object") return false;
    const block = item as Partial<DiagnosisBlock>;
    return typeof block.id === "string"
      && typeof block.title === "string"
      && typeof block.status === "string"
      && typeof block.verdict === "string"
      && typeof block.metric === "string"
      && typeof block.compare === "string"
      && (block.tone === "good" || block.tone === "watch" || block.tone === "risk")
      && Array.isArray(block.evidenceIds);
  });
}

function levelFromStored(level: StoredRiskLevel): RiskLevel {
  if (level === "high") return "高";
  if (level === "low") return "低";
  return "中";
}

function priorityFromStored(priority: StoredTaskPriority): TaskPriority {
  if (priority === "high") return "高";
  if (priority === "low") return "低";
  return "中";
}

function statusFromStored(status: StoredTaskStatus): ActionTask["status"] {
  if (status === "done" || status === "completed") return "已完成";
  if (status === "in_progress") return "进行中";
  return "待处理";
}

function deriveModelFromResult(result: StoredDiagnosisResult, fallback: CommandCenterModel): CommandCenterModel {
  if (!isBusinessSnapshot(result.snapshot)) {
    return {
      ...fallback,
      summary: {
        ...fallback.summary,
        conclusion: result.summary || fallback.summary.conclusion,
        healthScore: result.healthScore,
        confidence: result.confidence,
        reasons: asStringArray(result.reasons),
      },
      diagnosisBlocks: asDiagnosisBlocks(result.diagnosisBlocks, fallback.diagnosisBlocks),
    };
  }

  return {
    ...evaluateBusinessDiagnosis(result.snapshot),
    summary: {
      company: result.snapshot.company,
      period: result.snapshot.period,
      conclusion: result.summary,
      reasons: asStringArray(result.reasons),
      healthScore: result.healthScore,
      confidence: result.confidence,
    },
    diagnosisBlocks: asDiagnosisBlocks(result.diagnosisBlocks, fallback.diagnosisBlocks),
  };
}

export function adaptStoredDiagnosis(
  bundle: StoredDiagnosisBundle | null | undefined,
  fallback: CommandCenterModel,
): CommandCenterModel {
  if (!bundle?.result) return fallback;

  const model = deriveModelFromResult(bundle.result, fallback);

  const storedRisks = bundle.risks ?? bundle.riskSignals ?? [];
  const storedEvidence = bundle.evidence ?? bundle.evidenceItems ?? [];
  const storedTasks = bundle.tasks ?? bundle.actionTasks ?? [];

  const riskSignals: RiskSignal[] = storedRisks.map((risk) => ({
    id: risk.code,
    name: risk.name,
    level: levelFromStored(risk.level),
    rule: risk.rule ?? "",
    description: risk.description ?? "",
    relatedMetrics: asStringArray(risk.relatedMetrics),
  }));

  const evidenceItems: EvidenceItem[] = storedEvidence.map((item) => ({
    id: item.code,
    title: item.title,
    source: item.source ?? "经营数据",
    value: item.value ?? "-",
    note: item.note ?? "",
  }));

  const actionTasks: ActionTask[] = storedTasks.map((task) => ({
    id: task.code,
    title: task.title,
    type: task.type ?? "经营动作",
    priority: priorityFromStored(task.priority),
    owner: task.owner ?? "经营负责人",
    due: task.dueDate ?? "待定",
    reason: task.triggerReason ?? "",
    metrics: asStringArray(task.relatedMetrics),
    expectedImpact: task.expectedImpact ?? "",
    status: statusFromStored(task.status),
  }));

  return {
    ...model,
    riskSignals,
    evidenceItems,
    actionTasks,
  };
}
