import { describe, expect, it } from "vitest";

import { evaluateBusinessDiagnosis, type BusinessSnapshot } from "@/lib/diagnosis-engine";

const baseSnapshot: BusinessSnapshot = {
  company: "测试企业",
  period: "2026-04",
  revenue: { value: 1200000, previous: 1000000, budget: 1100000, historicalAverage: 980000 },
  expense: { value: 180000, previous: 160000, budget: 170000, historicalAverage: 155000 },
  grossMargin: { value: 42, previous: 40, budget: 41, historicalAverage: 39 },
  netProfit: { value: 260000, previous: 220000, budget: 240000, historicalAverage: 215000 },
  netMargin: { value: 21.7, previous: 22, budget: 22, historicalAverage: 20 },
  cashflow: { value: 980000, previous: 900000, budget: 940000, historicalAverage: 880000 },
  receivableDays: { value: 31, previous: 32, budget: 35, historicalAverage: 33 },
  marketingExpense: { value: 65000, previous: 60000, budget: 62000, historicalAverage: 59000 },
  newCustomerRevenue: { value: 360000, previous: 310000, budget: 330000, historicalAverage: 300000 },
  repeatRate: { value: 23, previous: 22, budget: 21, historicalAverage: 20 },
};

describe("evaluateBusinessDiagnosis", () => {
  it("generates a healthy model with diagnosis blocks and no high-risk cashflow signal", () => {
    const model = evaluateBusinessDiagnosis(baseSnapshot);

    expect(model.summary.company).toBe("测试企业");
    expect(model.diagnosisBlocks).toHaveLength(4);
    expect(model.riskSignals.some((risk) => risk.id === "risk-cashflow")).toBe(false);
    expect(model.metrics.map((metric) => metric.label)).toEqual(["营业收入", "运营费用", "净利润", "现金流净额"]);
  });

  it("triggers expense and marketing efficiency risks when costs grow faster than revenue", () => {
    const model = evaluateBusinessDiagnosis({
      ...baseSnapshot,
      revenue: { ...baseSnapshot.revenue, value: 1100000, previous: 1000000 },
      expense: { ...baseSnapshot.expense, value: 220000, previous: 160000 },
      marketingExpense: { ...baseSnapshot.marketingExpense, value: 90000, previous: 60000 },
    });

    expect(model.riskSignals.map((risk) => risk.id)).toContain("risk-expense-growth");
    expect(model.riskSignals.map((risk) => risk.id)).toContain("risk-marketing-efficiency");
    expect(model.actionTasks.map((task) => task.id)).toContain("task-marketing-roi");
    expect(model.diagnosisBlocks.find((block) => block.id === "expense")?.tone).toBe("watch");
  });

  it("triggers cashflow risk and receivable task when revenue grows but cashflow falls", () => {
    const model = evaluateBusinessDiagnosis({
      ...baseSnapshot,
      revenue: { ...baseSnapshot.revenue, value: 1300000, previous: 1000000 },
      cashflow: { ...baseSnapshot.cashflow, value: 760000, previous: 900000 },
      receivableDays: { ...baseSnapshot.receivableDays, value: 45, previous: 32 },
    });

    expect(model.riskSignals.map((risk) => risk.id)).toContain("risk-cashflow");
    expect(model.actionTasks.map((task) => task.id)).toContain("task-receivable");
    expect(model.diagnosisBlocks.find((block) => block.id === "cashflow")?.tone).toBe("risk");
  });

  it("triggers revenue drop task when revenue declines more than 15 percent", () => {
    const model = evaluateBusinessDiagnosis({
      ...baseSnapshot,
      revenue: { ...baseSnapshot.revenue, value: 800000, previous: 1000000 },
    });

    expect(model.riskSignals.map((risk) => risk.id)).toContain("risk-revenue-drop");
    expect(model.actionTasks.map((task) => task.id)).toContain("task-revenue-drop");
    expect(model.diagnosisBlocks.find((block) => block.id === "revenue")?.tone).toBe("risk");
  });
});
