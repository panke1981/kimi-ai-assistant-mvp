import { describe, expect, it } from "vitest";
import { calculateMetrics, generateAnalysisReport, recognizeFields } from "./ai-engine";

describe("ai-engine", () => {
  it("recognizes common business fields", () => {
    const fields = recognizeFields([
      { name: "订单金额", samples: [100, 200] },
      { name: "商品成本", samples: [50, 80] },
      { name: "下单日期", samples: ["2026-04-01"] },
    ]);

    expect(fields.map((field) => field.fieldType)).toEqual(["revenue", "cost", "date"]);
    expect(fields[0].mappedField).toBe("订单金额");
  });

  it("calculates core metrics from mapped rows", () => {
    const metrics = calculateMetrics(
      [
        { amount: "100", cost: "40", qty: "2", price: "50" },
        { amount: "200", cost: "70", qty: "4", price: "50" },
      ],
      [
        { originalField: "amount", mappedField: "营业收入", fieldType: "revenue" },
        { originalField: "cost", mappedField: "商品成本", fieldType: "cost" },
        { originalField: "qty", mappedField: "数量", fieldType: "quantity" },
        { originalField: "price", mappedField: "单价", fieldType: "price" },
      ],
    );

    expect(metrics).toContainEqual({ name: "营业收入", category: "revenue", value: 300, unit: "元" });
    expect(metrics).toContainEqual({ name: "商品成本", category: "cost", value: 110, unit: "元" });
    expect(metrics).toContainEqual({ name: "销售数量", category: "quantity", value: 6, unit: "件" });
  });

  it("generates a fallback report without external AI", () => {
    const report = generateAnalysisReport({
      period: "2026-04",
      companyName: "星辰科技",
      metrics: [
        { name: "营业收入", category: "revenue", value: 1000, unit: "元" },
        { name: "商品成本", category: "cost", value: 500, unit: "元" },
      ],
      dataSize: 2,
      fieldCount: 2,
    });

    expect(report.summary).toContain("星辰科技");
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.chartData.revenueTrend).toHaveLength(2);
  });
});

