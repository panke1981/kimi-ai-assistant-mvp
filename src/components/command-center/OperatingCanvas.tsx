import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock3, Zap } from "lucide-react";

import { WorkspacePanel } from "@/components/command-center/WorkspacePanel";
import { revenueExpenseTrend, type ActionTask, type RiskSignal } from "@/lib/command-center-data";
import {
  canvasModeOptions,
  getCanvasModeMeta,
  isSummaryReasonSelectionActive,
  toneStyles,
  type CanvasMode,
  type StrategistSelection,
} from "@/lib/command-center-view";
import type { CommandCenterModel, DiagnosisDomain } from "@/lib/diagnosis-engine";

interface OperatingCanvasProps {
  model: CommandCenterModel;
  isUsingFallbackDiagnosis: boolean;
  diagnosisRefreshNote: string | null;
  strategistSelection: StrategistSelection;
  selectedDomain: DiagnosisDomain;
  canvasMode: CanvasMode;
  acceptedTaskIds: string[];
  completedTaskIds: string[];
  onCanvasModeChange: (mode: CanvasMode) => void;
  onSelectDiagnosis: (id: DiagnosisDomain) => void;
  onSelectSummaryReason: (index: number) => void;
  onSelectRisk: (id: string) => void;
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
}

export function OperatingCanvas({
  model,
  isUsingFallbackDiagnosis,
  diagnosisRefreshNote,
  strategistSelection,
  selectedDomain,
  canvasMode,
  acceptedTaskIds,
  completedTaskIds,
  onCanvasModeChange,
  onSelectDiagnosis,
  onSelectSummaryReason,
  onSelectRisk,
  onSelectTask,
  onCompleteTask,
}: OperatingCanvasProps) {
  const activeModeMeta = getCanvasModeMeta(canvasMode);

  return (
    <div className="flex min-h-0 flex-col gap-4" data-canvas-mode={canvasMode}>
      <WorkspacePanel className="rounded-xl p-3">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--brand)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--brand)" }}>本月经营结论</span>
              {isUsingFallbackDiagnosis ? (
                <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: "var(--warning)", background: "rgba(180,83,9,0.08)" }}>
                  本地诊断
                </span>
              ) : null}
              {diagnosisRefreshNote ? (
                <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: diagnosisRefreshNote.includes("待") ? "var(--warning)" : "var(--success)", background: diagnosisRefreshNote.includes("待") ? "rgba(180,83,9,0.08)" : "rgba(15,118,110,0.08)" }}>
                  {diagnosisRefreshNote}
                </span>
              ) : null}
              <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: "var(--success)", background: "rgba(15,118,110,0.08)" }}>
                置信度 {model.summary.confidence}%
              </span>
            </div>
            <h1 className="truncate text-[18px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{model.summary.conclusion}</h1>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {model.summary.reasons.map((reason, index) => {
                const active = isSummaryReasonSelectionActive(index, strategistSelection);
                return (
                  <button
                    key={reason}
                    onClick={() => onSelectSummaryReason(index)}
                    className="flex items-center gap-2 rounded-md border py-0.5 pl-1 pr-2 text-left text-xs transition-colors hover:bg-slate-50"
                    style={{
                      borderColor: active ? "rgba(37,99,235,0.24)" : "transparent",
                      background: active ? "rgba(37,99,235,0.06)" : "transparent",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    data-summary-reason={index}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                      style={{
                        background: active ? "var(--brand)" : "rgba(37,99,235,0.08)",
                        color: active ? "white" : "var(--brand)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{reason}</span>
                    <span className="ml-auto text-[10px]" style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}>
                      {active ? "分析中" : "分析"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-24 rounded-xl border p-2 text-center" style={{ borderColor: "rgba(15,118,110,0.22)", background: "rgba(15,118,110,0.06)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>经营健康度</p>
            <p className="mt-1 text-xl font-semibold data-mono" style={{ color: "var(--success)" }}>{model.summary.healthScore}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>/100</p>
          </div>
        </div>
      </WorkspacePanel>

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-white px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{activeModeMeta.title}</p>
          <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--text-muted)" }}>{activeModeMeta.description}</p>
        </div>
        <div className="flex shrink-0 rounded-lg border bg-slate-50 p-1" style={{ borderColor: "var(--border-subtle)" }}>
          {canvasModeOptions.map((option) => {
            const active = option.id === canvasMode;
            return (
              <button
                key={option.id}
                onClick={() => onCanvasModeChange(option.id)}
                className="rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: active ? "var(--brand)" : "transparent",
                  color: active ? "white" : "var(--text-secondary)",
                  boxShadow: active ? "0 8px 22px rgba(37,99,235,0.18)" : "none",
                }}
                data-canvas-mode-option={option.id}
              >
                {option.actionLabel}
              </button>
            );
          })}
        </div>
      </div>

      {canvasMode === "overview" ? (
        <>
          <MetricCardGrid model={model} strategistSelection={strategistSelection} selectedDomain={selectedDomain} onSelectDiagnosis={onSelectDiagnosis} />
          <div className="grid h-[150px] min-h-0 grid-cols-[1.2fr_0.8fr] gap-4">
            <TrendPanel compact />
            <RiskPanel risks={model.riskSignals} strategistSelection={strategistSelection} onSelectRisk={onSelectRisk} compact />
          </div>
        </>
      ) : null}

      {canvasMode === "risk" ? (
        <>
          <div className="grid h-[300px] min-h-0 grid-cols-[0.9fr_1.1fr] gap-4">
            <TrendPanel />
            <RiskPanel risks={model.riskSignals} strategistSelection={strategistSelection} onSelectRisk={onSelectRisk} />
          </div>
        </>
      ) : null}

      {canvasMode === "actions" ? (
        <ActionTaskPanel
          tasks={model.actionTasks}
          strategistSelection={strategistSelection}
          acceptedTaskIds={acceptedTaskIds}
          completedTaskIds={completedTaskIds}
          onSelectTask={onSelectTask}
          onCompleteTask={onCompleteTask}
        />
      ) : null}
    </div>
  );
}

function MetricCardGrid({
  model,
  strategistSelection,
  selectedDomain,
  onSelectDiagnosis,
  compact = false,
}: {
  model: CommandCenterModel;
  strategistSelection: StrategistSelection;
  selectedDomain: DiagnosisDomain;
  onSelectDiagnosis: (id: DiagnosisDomain) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {model.metrics.map((metric) => {
        const tone = toneStyles[metric.tone];
        const domain = metricDomainByLabel(metric.label);
        const active = strategistSelection.kind === "diagnosis" && selectedDomain === domain;
        return (
          <button
            key={metric.label}
            onClick={() => onSelectDiagnosis(domain)}
            className="rounded-xl border bg-white p-3 text-left transition-colors hover:-translate-y-px hover:shadow-md"
            style={{
              borderColor: active ? tone.border : "var(--border-default)",
              background: active ? tone.bg : "#fff",
              boxShadow: active ? "0 18px 45px rgba(15, 23, 42, 0.08)" : "0 18px 45px rgba(15, 23, 42, 0.05)",
            }}
            data-metric-domain={domain}
          >
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{metric.label}</p>
            <p className={`${compact ? "mt-1 text-base" : "mt-1 text-lg"} font-semibold data-mono`} style={{ color: "var(--text-primary)" }}>{metric.value}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs data-mono" style={{ color: tone.color }}>{metric.change}</p>
              <span className="text-[10px]" style={{ color: active ? tone.color : "var(--text-muted)" }}>
                {active ? "正在分析" : "点击分析"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function metricDomainByLabel(label: string): DiagnosisDomain {
  if (label.includes("费用")) return "expense";
  if (label.includes("利润")) return "profit";
  if (label.includes("现金")) return "cashflow";
  return "revenue";
}

function TrendPanel({ compact = false }: { compact?: boolean }) {
  return (
    <WorkspacePanel className={`${compact ? "rounded-xl p-3" : "rounded-xl p-4"}`} data-command-section="trend">
      <div className={`${compact ? "mb-2" : "mb-3"} flex items-center justify-between`}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>收入 / 费用 / 利润趋势</h2>
          {compact ? null : <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>单位：万元，异常点由规则库标注</p>}
        </div>
        <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: "var(--warning)", background: "rgba(180,83,9,0.08)" }}>费用异常点</span>
      </div>
      <div className={`pointer-events-none ${compact ? "h-[92px]" : "h-[210px]"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueExpenseTrend}>
            <CartesianGrid stroke="#E9EEF6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#DDE5F0" }} />
            <Line type="monotone" dataKey="revenue" name="收入" stroke="#2563EB" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="expense" name="费用" stroke="#B45309" strokeWidth={2.5} dot />
            <Line type="monotone" dataKey="profit" name="利润" stroke="#0F766E" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WorkspacePanel>
  );
}

function RiskPanel({
  risks,
  strategistSelection,
  onSelectRisk,
  compact = false,
}: {
  risks: RiskSignal[];
  strategistSelection: StrategistSelection;
  onSelectRisk: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <WorkspacePanel className={`flex min-h-0 flex-col ${compact ? "rounded-xl p-3" : "rounded-xl p-4"}`} data-command-section="risk">
      <div className={`${compact ? "mb-2" : "mb-3"} flex items-center justify-between`}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>风险信号</h2>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{risks.length} 条触发 · 点击分析</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {risks.map((risk) => {
          const active = strategistSelection.kind === "risk" && strategistSelection.id === risk.id;
          return (
            <button
              key={risk.id}
              onClick={() => onSelectRisk(risk.id)}
              className={`w-full rounded-lg border text-left transition-colors hover:-translate-y-px hover:shadow-sm ${compact ? "p-2" : "p-2.5"}`}
              style={{ borderColor: active ? "rgba(37,99,235,0.32)" : "var(--border-subtle)", background: active ? "rgba(37,99,235,0.05)" : "#fff" }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{risk.name}</p>
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: risk.level === "高" ? "var(--danger)" : "var(--warning)", background: risk.level === "高" ? "rgba(220,38,38,0.08)" : "rgba(180,83,9,0.08)" }}>{risk.level}</span>
              </div>
              {compact ? null : <p className="text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{risk.description}</p>}
              <p className={`${compact ? "mt-1" : "mt-2"} text-[10px]`} style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}>
                {active ? "正在右侧分析" : "点击查看证据链和动作建议"}
              </p>
            </button>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

function ActionTaskPanel({
  tasks,
  strategistSelection,
  acceptedTaskIds,
  completedTaskIds,
  onSelectTask,
  onCompleteTask,
}: {
  tasks: ActionTask[];
  strategistSelection: StrategistSelection;
  acceptedTaskIds: string[];
  completedTaskIds: string[];
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
}) {
  const acceptedTasks = tasks.filter((task) => acceptedTaskIds.includes(task.id));
  const completedCount = acceptedTasks.filter((task) => completedTaskIds.includes(task.id)).length;

  return (
    <WorkspacePanel className="rounded-xl p-4" data-command-section="actions">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>行动任务</h2>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>点击任务可在右侧生成执行建议</span>
      </div>

      <div className="mb-3 rounded-lg border p-3" style={{ borderColor: acceptedTasks.length > 0 ? "rgba(15,118,110,0.22)" : "var(--border-subtle)", background: acceptedTasks.length > 0 ? "rgba(15,118,110,0.05)" : "#fff" }}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: acceptedTasks.length > 0 ? "var(--success)" : "var(--text-muted)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>执行跟踪</p>
          </div>
          <span className="text-[11px] data-mono" style={{ color: acceptedTasks.length > 0 ? "var(--success)" : "var(--text-muted)" }}>
            {completedCount}/{acceptedTasks.length || tasks.length}
          </span>
        </div>
        {acceptedTasks.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {acceptedTasks.slice(0, 2).map((task) => {
              const completed = completedTaskIds.includes(task.id);
              return (
              <div
                key={task.id}
                className="rounded-lg border bg-white px-3 py-2"
                style={{ borderColor: completed ? "rgba(15,118,110,0.32)" : "rgba(15,118,110,0.18)" }}
              >
                <p className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <Clock3 size={12} />
                  <span className="truncate">{task.owner} · {task.due}</span>
                </div>
                <p className="mt-1 truncate text-[10px]" style={{ color: "var(--success)" }}>验证：{task.metrics.slice(0, 2).join(" / ") || "关键指标"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => onSelectTask(task.id)}
                    className="rounded-md border px-2 py-1 text-[10px]"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    查看分析
                  </button>
                  <button
                    onClick={() => onCompleteTask(task.id)}
                    disabled={completed}
                    className="rounded-md px-2 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ background: completed ? "rgba(15,118,110,0.1)" : "var(--success)", color: completed ? "var(--success)" : "white" }}
                  >
                    {completed ? "已完成验证" : "完成验证"}
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <p className="text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
            在右侧策略分析师中点击“采纳动作”，任务会进入执行跟踪，并显示负责人、截止时间和验证指标。
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tasks.map((task) => {
          const active = strategistSelection.kind === "task" && strategistSelection.id === task.id;
          const accepted = acceptedTaskIds.includes(task.id);
          const completed = completedTaskIds.includes(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className="rounded-lg border p-2.5 text-left transition-colors hover:-translate-y-px hover:shadow-sm"
              style={{
                borderColor: completed ? "rgba(15,118,110,0.42)" : accepted ? "rgba(15,118,110,0.32)" : active ? "rgba(37,99,235,0.32)" : "var(--border-subtle)",
                background: completed ? "rgba(15,118,110,0.1)" : accepted ? "rgba(15,118,110,0.06)" : active ? "rgba(37,99,235,0.05)" : "#fff",
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: task.priority === "高" ? "var(--danger)" : "var(--warning)", background: task.priority === "高" ? "rgba(220,38,38,0.08)" : "rgba(180,83,9,0.08)" }}>{task.priority}优先级</span>
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: accepted ? "var(--success)" : "var(--text-muted)", background: accepted ? "#fff" : "transparent" }}>
                  {completed ? "已完成" : accepted ? "已采纳" : task.status}
                </span>
              </div>
              <p className="text-xs font-semibold leading-5" style={{ color: "var(--text-primary)" }}>{task.title}</p>
              <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>{task.owner} · {task.due}</p>
              <p className="mt-2 text-[10px]" style={{ color: accepted ? "var(--success)" : active ? "var(--brand)" : "var(--text-muted)" }}>
                {completed ? "已完成验证" : accepted ? "已进入执行跟踪" : active ? "正在右侧拆解" : "点击拆解执行路径"}
              </p>
            </button>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}
