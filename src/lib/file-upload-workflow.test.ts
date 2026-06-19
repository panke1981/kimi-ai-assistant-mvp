import { describe, expect, it } from "vitest";

import { detectFileType, fileTypeLabels } from "@/lib/file-upload-workflow";

describe("file-upload-workflow", () => {
  it("detects business file types from common names", () => {
    expect(detectFileType("2026年4月销售订单.xlsx")).toBe("sales");
    expect(detectFileType("银行流水.csv")).toBe("bank_statement");
    expect(detectFileType("广告投放明细.xlsx")).toBe("ad_spend");
    expect(detectFileType("库存表.xls")).toBe("inventory");
    expect(detectFileType("合同清单.xlsx")).toBe("contract");
    expect(detectFileType("财务记账.csv")).toBe("financial");
    expect(detectFileType("unknown.csv")).toBe("other");
  });

  it("keeps labels available for every detected type", () => {
    expect(fileTypeLabels[detectFileType("销售订单.xlsx")]).toBe("销售数据");
    expect(fileTypeLabels[detectFileType("unknown.csv")]).toBe("其他");
  });
});
