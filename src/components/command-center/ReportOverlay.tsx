import { Copy, FileText, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { buildCommandCenterReportText } from "@/lib/report-summary";
import { toneStyles } from "@/lib/command-center-view";
import type { CommandCenterModel } from "@/lib/diagnosis-engine";

interface ReportOverlayProps {
  model: CommandCenterModel;
  acceptedTaskIds: string[];
  completedTaskIds: string[];
  onClose: () => void;
}

export function ReportOverlay({ model, acceptedTaskIds, completedTaskIds, onClose }: ReportOverlayProps) {
  const highRisks = model.riskSignals.filter((risk) => risk.level === "高");
  const topEvidence = model.evidenceItems.slice(0, 4);
  const acceptedTasks = model.actionTasks.filter((task) => acceptedTaskIds.includes(task.id));
  const completedTasks = model.actionTasks.filter((task) => completedTaskIds.includes(task.id));
  const reportText = [
    buildCommandCenterReportText(model),
    "",
    "执行跟踪：",
    acceptedTasks.length > 0
      ? `- 已采纳 ${acceptedTasks.length} 项，已完成验证 ${completedTasks.length} 项。`
      : "- 暂无已采纳任务。",
    ...acceptedTasks.map((task) => {
      const state = completedTaskIds.includes(task.id) ? "已完成验证" : "执行跟踪中";
      return `- [${state}] ${task.title}｜${task.owner}｜${task.due}｜验证指标：${task.metrics.slice(0, 2).join("、") || "关键指标"}`;
    }),
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success("报告摘要已复制");
    } catch {
      toast.error("复制失败，请手动选择报告内容");
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/12 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[calc(100%-56px)] w-[920px] flex-col rounded-xl border bg-white shadow-2xl" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.08)", color: "var(--brand)" }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{model.summary.period} 经营复盘报告</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{model.summary.company} · 结论、风险、证据和行动任务</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
              <Copy size={14} /> 复制摘要
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="关闭报告浮窗">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <section className="rounded-xl border p-5" style={{ borderColor: "rgba(37,99,235,0.18)", background: "rgba(37,99,235,0.04)" }}>
            <div className="mb-3 flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--brand)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>经营结论</span>
              <span className="rounded-full bg-white px-2 py-1 text-[10px]" style={{ color: "var(--success)" }}>健康度 {model.summary.healthScore}/100</span>
              <span className="rounded-full bg-white px-2 py-1 text-[10px]" style={{ color: "var(--text-muted)" }}>置信度 {model.summary.confidence}%</span>
            </div>
            <h3 className="text-xl font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{model.summary.conclusion}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {model.summary.reasons.map((reason, index) => (
                <div key={reason} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]" style={{ background: "rgba(37,99,235,0.08)", color: "var(--brand)" }}>{index + 1}</span>
                  <span className="leading-5">{reason}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-4 gap-3">
            {model.metrics.map((metric) => {
              const tone = toneStyles[metric.tone];
              return (
                <div key={metric.label} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{metric.label}</p>
                  <p className="mt-1 text-lg font-semibold data-mono" style={{ color: "var(--text-primary)" }}>{metric.value}</p>
                  <p className="mt-1 text-xs data-mono" style={{ color: tone.color }}>{metric.change}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-4 grid grid-cols-[1fr_1fr] gap-4">
            <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>风险诊断</h3>
                <span className="text-[11px]" style={{ color: highRisks.length > 0 ? "var(--danger)" : "var(--text-muted)" }}>{highRisks.length} 个高风险</span>
              </div>
              <div className="space-y-2">
                {model.riskSignals.map((risk) => (
                  <div key={risk.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{risk.name}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: risk.level === "高" ? "var(--danger)" : "var(--warning)", background: risk.level === "高" ? "rgba(220,38,38,0.08)" : "rgba(180,83,9,0.08)" }}>{risk.level}</span>
                    </div>
                    <p className="text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{risk.description}</p>
                  </div>
                ))}
                {model.riskSignals.length === 0 ? (
                  <p className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>暂无风险信号。</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>证据链</h3>
              <div className="space-y-2">
                {topEvidence.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                      <span className="text-xs data-mono" style={{ color: "var(--brand)" }}>{item.value}</span>
                    </div>
                    <p className="text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border bg-white p-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>行动任务</h3>
              <span className="text-[11px]" style={{ color: acceptedTasks.length > 0 ? "var(--success)" : "var(--text-muted)" }}>
                已采纳 {acceptedTasks.length} · 已完成 {completedTasks.length}
              </span>
            </div>
            <div className="mb-3 rounded-lg border px-3 py-2" style={{ borderColor: acceptedTasks.length > 0 ? "rgba(15,118,110,0.2)" : "var(--border-subtle)", background: acceptedTasks.length > 0 ? "rgba(15,118,110,0.05)" : "#fff" }}>
              <p className="text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
                {acceptedTasks.length > 0
                  ? `当前已有 ${acceptedTasks.length} 项建议进入执行跟踪，其中 ${completedTasks.length} 项完成验证。`
                  : "当前报告仅包含建议任务；在工作台采纳动作后，这里会同步执行状态。"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {model.actionTasks.map((task) => {
                const accepted = acceptedTaskIds.includes(task.id);
                const completed = completedTaskIds.includes(task.id);
                return (
                <div
                  key={task.id}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: completed ? "rgba(15,118,110,0.32)" : accepted ? "rgba(15,118,110,0.22)" : "var(--border-subtle)",
                    background: completed ? "rgba(15,118,110,0.08)" : accepted ? "rgba(15,118,110,0.04)" : "#fff",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: task.priority === "高" ? "var(--danger)" : "var(--warning)", background: task.priority === "高" ? "rgba(220,38,38,0.08)" : "rgba(180,83,9,0.08)" }}>{task.priority}优先级</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: completed ? "var(--success)" : accepted ? "var(--success)" : "var(--text-muted)", background: completed || accepted ? "#fff" : "transparent" }}>
                      {completed ? "已完成验证" : accepted ? "执行跟踪中" : task.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-5" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                  <p className="mt-2 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>{task.owner} · {task.due}</p>
                  <p className="mt-2 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>{task.expectedImpact}</p>
                  {accepted ? (
                    <p className="mt-2 text-[10px]" style={{ color: "var(--success)" }}>验证：{task.metrics.slice(0, 2).join(" / ") || "关键指标"}</p>
                  ) : null}
                </div>
              );
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>报告基于当前工作台诊断模型生成，可继续在右侧策略分析师追问。</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>关闭</button>
            <button onClick={handleCopy} className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--brand)", color: "white" }}>复制报告</button>
          </div>
        </div>
      </div>
    </div>
  );
}
