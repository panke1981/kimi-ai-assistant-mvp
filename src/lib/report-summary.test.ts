import { describe, expect, it } from "vitest";

import { commandCenterModel } from "@/lib/command-center-data";
import { buildCommandCenterReportText } from "@/lib/report-summary";

describe("buildCommandCenterReportText", () => {
  it("includes conclusion, health score, risks, and tasks", () => {
    const text = buildCommandCenterReportText(commandCenterModel);

    expect(text).toContain("经营复盘报告");
    expect(text).toContain(commandCenterModel.summary.conclusion);
    expect(text).toContain(`经营健康度：${commandCenterModel.summary.healthScore}/100`);
    expect(text).toContain("风险信号：");
    expect(text).toContain(commandCenterModel.riskSignals[0].name);
    expect(text).toContain("行动任务：");
    expect(text).toContain(commandCenterModel.actionTasks[0].title);
  });
});
