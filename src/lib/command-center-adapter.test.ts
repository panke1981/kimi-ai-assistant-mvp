import { describe, expect, it } from "vitest";

import { adaptStoredDiagnosis } from "@/lib/command-center-adapter";
import { commandCenterModel, demoBusinessSnapshot } from "@/lib/command-center-data";

describe("adaptStoredDiagnosis", () => {
  it("keeps the fallback model when no stored diagnosis exists", () => {
    expect(adaptStoredDiagnosis(null, commandCenterModel)).toBe(commandCenterModel);
  });

  it("maps stored diagnosis rows into command center labels", () => {
    const model = adaptStoredDiagnosis(
      {
        result: {
          summary: "费用增长过快，需要优先复盘投放效率。",
          healthScore: 72,
          confidence: 91,
          reasons: ["费用增速超过收入", "现金流弱于收入"],
          diagnosisBlocks: commandCenterModel.diagnosisBlocks,
          snapshot: demoBusinessSnapshot,
        },
        riskSignals: [
          {
            code: "risk-expense",
            name: "费用异常",
            level: "high",
            rule: "费用增长超过阈值",
            description: "费用增长没有带来同等收入增长。",
            relatedMetrics: ["运营费用", "营业收入"],
          },
        ],
        evidenceItems: [
          {
            code: "ev-expense",
            title: "费用环比",
            source: "费用表",
            value: "+18.2%",
            note: "营销费用贡献最大。",
          },
        ],
        actionTasks: [
          {
            code: "task-roi",
            title: "复盘渠道 ROI",
            type: "费用优化",
            priority: "medium",
            owner: null,
            dueDate: null,
            triggerReason: "费用增长快于收入",
            relatedMetrics: ["营销费用"],
            expectedImpact: "降低低效渠道消耗",
            status: "in_progress",
          },
        ],
      },
      commandCenterModel,
    );

    expect(model.summary.conclusion).toBe("费用增长过快，需要优先复盘投放效率。");
    expect(model.summary.healthScore).toBe(72);
    expect(model.riskSignals[0]).toMatchObject({ id: "risk-expense", level: "高" });
    expect(model.actionTasks[0]).toMatchObject({ priority: "中", status: "进行中", owner: "经营负责人" });
  });
});
