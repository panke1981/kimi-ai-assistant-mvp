import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseDataFile } from "@/lib/file-parser";

function makeFile(content: string | Uint8Array, name: string, type = "text/csv") {
  return new File([content], name, { type });
}

describe("parseDataFile", () => {
  it("parses csv files with quoted commas", async () => {
    const parsed = await parseDataFile(makeFile('name,amount\n"套餐, A",120\n普通款,80', "sales.csv"));

    expect(parsed.headers).toEqual(["name", "amount"]);
    expect(parsed.previewRows[0]).toEqual({ name: "套餐, A", amount: 120 });
    expect(parsed.rowCount).toBe(2);
  });

  it("parses xlsx files", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["订单金额", "商品成本"],
      [100, 40],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const parsed = await parseDataFile(makeFile(new Uint8Array(data), "sales.xlsx"));

    expect(parsed.headers).toEqual(["订单金额", "商品成本"]);
    expect(parsed.previewRows[0]).toEqual({ 订单金额: 100, 商品成本: 40 });
  });

  it("rejects empty files and files without data rows", async () => {
    await expect(parseDataFile(makeFile("", "empty.csv"))).rejects.toThrow("文件为空");
    await expect(parseDataFile(makeFile("name,amount", "headers.csv"))).rejects.toThrow("至少需要包含表头和一行数据");
  });
});
