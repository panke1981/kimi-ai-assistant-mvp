import { describe, expect, it } from "vitest";

import {
  applyFieldConfirmation,
  summarizeFieldConfirmation,
} from "@/lib/field-confirmation-workflow";
import type { CommandFieldItem } from "@/lib/command-center-view";

const fields: CommandFieldItem[] = [
  {
    id: 1,
    originalField: "订单金额",
    mappedField: "营业收入",
    fieldType: "revenue",
    confidence: "0.95",
    isConfirmed: "confirmed",
  },
  {
    id: 2,
    originalField: "备注",
    mappedField: "备注",
    fieldType: "text",
    confidence: "0.74",
    isConfirmed: "pending",
  },
];

describe("field confirmation workflow", () => {
  it("updates one field status without mutating the original list", () => {
    const nextFields = applyFieldConfirmation(fields, 2, "ignored");

    expect(nextFields).toMatchObject([
      { id: 1, isConfirmed: "confirmed" },
      { id: 2, isConfirmed: "ignored" },
    ]);
    expect(fields[1]?.isConfirmed).toBe("pending");
  });

  it("summarizes confirmed, pending, ignored and low-confidence fields", () => {
    expect(summarizeFieldConfirmation(fields)).toEqual({
      confirmedCount: 1,
      pendingCount: 1,
      ignoredCount: 0,
      lowConfidenceCount: 1,
    });

    expect(summarizeFieldConfirmation(applyFieldConfirmation(fields, 2, "ignored"))).toEqual({
      confirmedCount: 1,
      pendingCount: 0,
      ignoredCount: 1,
      lowConfidenceCount: 1,
    });
  });
});
