import { describe, expect, it } from "vitest";

import { fieldTypeLabels, toFieldType } from "@/lib/field-display";

describe("field-display", () => {
  it("normalizes known and unknown field types", () => {
    expect(toFieldType("revenue")).toBe("revenue");
    expect(toFieldType("expense")).toBe("expense");
    expect(toFieldType("not-a-type")).toBe("unknown");
    expect(toFieldType(null)).toBe("unknown");
  });

  it("provides Chinese labels for normalized field types", () => {
    expect(fieldTypeLabels[toFieldType("revenue")]).toBe("收入");
    expect(fieldTypeLabels[toFieldType("not-a-type")]).toBe("未知");
  });
});
