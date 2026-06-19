import { Bot, CheckCircle2, ChevronRight, MessageSquare, Wand2 } from "lucide-react";

import { WorkspacePanel } from "@/components/command-center/WorkspacePanel";
import { toneStyles, type AnalysisStep, type StrategistMessage, type StrategistSelection } from "@/lib/command-center-view";
import type { ActionTask, EvidenceItem } from "@/lib/command-center-data";
import type { Tone } from "@/lib/diagnosis-engine";

interface StrategistPanelProps {
  tone: Tone;
  title: string;
  status: string;
  summary: string;
  metrics: string[];
  evidence: EvidenceItem[];
  actions: ActionTask[];
  analysisSteps: AnalysisStep[];
  selection: StrategistSelection;
  acceptedTaskIds: string[];
  completedTaskIds: string[];
  messages: StrategistMessage[];
  question: string;
  quickPrompts: string[];
  onQuestionChange: (value: string) => void;
  onSendQuestion: () => void;
  onQuickPrompt: (value: string) => void;
  onApplyAction: () => void;
  onDraftTask: () => void;
  onSelectTask: (id: string) => void;
}

export function StrategistPanel({
  tone,
  title,
  status,
  summary,
  metrics,
  evidence,
  actions,
  analysisSteps,
  selection,
  acceptedTaskIds = [],
  completedTaskIds = [],
  messages,
  question,
  quickPrompts,
  onQuestionChange,
  onSendQuestion,
  onQuickPrompt,
  onApplyAction,
  onDraftTask,
  onSelectTask,
}: StrategistPanelProps) {
  const primaryAction = actions[0];
  const primaryActionAccepted = !!primaryAction && acceptedTaskIds.includes(primaryAction.id);
  const primaryActionCompleted = !!primaryAction && completedTaskIds.includes(primaryAction.id);
  const selectionLabel = selection.kind === "risk" ? "风险信号" : selection.kind === "task" ? "行动任务" : "诊断图层";
  const executionStatus = primaryActionCompleted ? "已完成验证" : primaryActionAccepted ? "执行跟踪中" : "待采纳";

  return (
    <WorkspacePanel className="flex min-h-0 flex-col rounded-xl">
      <div className="border-b p-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mb-2 flex items-center gap-2">
          <Bot size={16} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI 策略分析师</h2>
        </div>
        <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>基于规则、指标和证据生成判断，不做泛化建议。</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 pr-3">
        <div className="rounded-xl border p-4" style={{ borderColor: toneStyles[tone].border, background: toneStyles[tone].bg }}>
          <p className="text-[11px] font-medium" style={{ color: toneStyles[tone].color }}>{title} · {status}</p>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: "var(--text-primary)" }}>{summary}</p>
          {metrics.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {metrics.slice(0, 4).map((metric) => (
                <span key={metric} className="rounded-full bg-white px-2 py-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>{metric}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "当前对象", value: selectionLabel },
            { label: "证据", value: `${evidence.length} 条` },
            { label: "执行", value: executionStatus },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-white px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              <p className="mt-1 truncate text-xs font-semibold" style={{ color: item.label === "执行" && primaryActionCompleted ? "var(--success)" : item.label === "执行" && primaryActionAccepted ? "var(--brand)" : "var(--text-primary)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>分析路径</p>
          <div className="space-y-2">
            {analysisSteps.map((step, index) => {
              const stepTone = toneStyles[step.tone];
              return (
                <div key={`${step.label}-${step.title}`} className="rounded-lg border bg-white p-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: stepTone.bg, color: stepTone.color }}>
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: stepTone.color }}>{step.label}</span>
                    <span className="truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{step.title}</span>
                  </div>
                  <p className="pl-7 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onApplyAction}
            disabled={primaryActionAccepted}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium"
            style={{ background: primaryActionAccepted ? "rgba(15,118,110,0.1)" : "var(--brand)", color: primaryActionAccepted ? "var(--success)" : "white" }}
          >
            <CheckCircle2 size={13} />
            {primaryActionCompleted ? "已完成验证" : primaryActionAccepted ? "已采纳动作" : "采纳动作"}
          </button>
          <button
            onClick={onDraftTask}
            className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium"
            style={{ borderColor: "rgba(37,99,235,0.22)", color: "var(--brand)", background: "rgba(37,99,235,0.06)" }}
          >
            <Wand2 size={13} />
            生成任务草稿
          </button>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>快速追问</p>
          <div className="grid grid-cols-1 gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onQuickPrompt(prompt)}
                className="rounded-lg border px-3 py-2 text-left text-[11px] leading-5 transition-colors hover:bg-slate-50"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "#fff" }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>关键证据</p>
          <div className="space-y-2">
            {evidence.map((item) => (
              <div key={item.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <span className="text-xs data-mono" style={{ color: "var(--brand)" }}>{item.value}</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.source}</p>
                <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>{item.note}</p>
              </div>
            ))}
            {evidence.length === 0 ? (
              <div className="rounded-lg border p-3 text-[11px]" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                暂无直接证据，建议先补充字段和指标数据。
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>推荐动作</p>
          <div className="space-y-2">
            {actions.map((task) => (
              <ActionInspectorButton
                key={task.id}
                task={task}
                active={selection.kind === "task" && selection.id === task.id}
                accepted={acceptedTaskIds.includes(task.id)}
                completed={completedTaskIds.includes(task.id)}
                onSelectTask={onSelectTask}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>互动记录</p>
          <div className="space-y-2">
            {messages.slice(-3).map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.text.slice(0, 12)}`}
                className="rounded-lg border px-3 py-2 text-[11px] leading-5"
                style={{
                  borderColor: message.role === "assistant" ? "var(--border-subtle)" : "rgba(37,99,235,0.22)",
                  background: message.role === "assistant" ? "#fff" : "rgba(37,99,235,0.06)",
                  color: "var(--text-secondary)",
                }}
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t p-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
          <MessageSquare size={14} style={{ color: "var(--brand)" }} />
          <input
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSendQuestion();
            }}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--text-secondary)" }}
            placeholder="追问当前风险、证据或任务"
          />
          <button onClick={onSendQuestion} className="rounded-md px-2 py-1 text-[11px]" style={{ background: "var(--brand)", color: "white" }}>发送</button>
        </div>
      </div>
    </WorkspacePanel>
  );
}

function ActionInspectorButton({
  task,
  active,
  accepted,
  completed,
  onSelectTask,
}: {
  task: ActionTask;
  active: boolean;
  accepted: boolean;
  completed: boolean;
  onSelectTask: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelectTask(task.id)}
      className="w-full rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
      style={{
        borderColor: completed ? "rgba(15,118,110,0.34)" : accepted ? "rgba(37,99,235,0.28)" : active ? "rgba(37,99,235,0.32)" : "var(--border-subtle)",
        background: completed ? "rgba(15,118,110,0.06)" : accepted ? "rgba(37,99,235,0.05)" : "#fff",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-5" style={{ color: "var(--text-primary)" }}>{task.title}</span>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px]" style={{ color: completed ? "var(--success)" : accepted ? "var(--brand)" : "var(--text-muted)", background: completed ? "rgba(15,118,110,0.1)" : accepted ? "rgba(37,99,235,0.08)" : "transparent" }}>
          {completed ? "已完成" : accepted ? "已采纳" : task.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span className="truncate">{task.owner}</span>
        <span className="truncate text-right">{task.due}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-[10px]" style={{ color: "var(--success)" }}>{task.metrics.slice(0, 2).join(" / ") || "关键指标"}</span>
        <ChevronRight size={14} style={{ color: active ? "var(--brand)" : "var(--text-muted)" }} />
      </div>
    </button>
  );
}
