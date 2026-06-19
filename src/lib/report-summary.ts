import type { CommandCenterModel } from "@/lib/diagnosis-engine";

export function buildCommandCenterReportText(model: CommandCenterModel) {
  return [
    `${model.summary.company} ${model.summary.period} 经营复盘报告`,
    "",
    `经营结论：${model.summary.conclusion}`,
    `经营健康度：${model.summary.healthScore}/100，置信度：${model.summary.confidence}%`,
    "",
    "关键原因：",
    ...model.summary.reasons.map((reason, index) => `${index + 1}. ${reason}`),
    "",
    "风险信号：",
    ...(model.riskSignals.length > 0
      ? model.riskSignals.map((risk) => `- [${risk.level}] ${risk.name}：${risk.description}`)
      : ["- 暂无风险信号"]),
    "",
    "行动任务：",
    ...(model.actionTasks.length > 0
      ? model.actionTasks.map((task) => `- [${task.priority}] ${task.title}｜${task.owner}｜${task.due}｜${task.expectedImpact}`)
      : ["- 暂无行动任务"]),
  ].join("\n");
}
