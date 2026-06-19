export type FileType =
  | "financial"
  | "bank_statement"
  | "sales"
  | "inventory"
  | "contract"
  | "ad_spend"
  | "other";

export const fileTypeLabels: Record<FileType, string> = {
  financial: "财务数据",
  bank_statement: "银行流水",
  sales: "销售数据",
  inventory: "库存数据",
  contract: "合同",
  ad_spend: "广告投放",
  other: "其他",
};

export function detectFileType(filename: string): FileType {
  const lower = filename.toLowerCase();
  if (lower.includes("ad") || lower.includes("广告") || lower.includes("投放")) return "ad_spend";
  if (lower.includes("bank") || lower.includes("银行") || lower.includes("流水")) return "bank_statement";
  if (lower.includes("sale") || lower.includes("销售") || lower.includes("订单") || lower.includes("交易")) return "sales";
  if (lower.includes("inv") || lower.includes("库存") || lower.includes("存货")) return "inventory";
  if (lower.includes("contract") || lower.includes("合同")) return "contract";
  if (lower.includes("fin") || lower.includes("财务") || lower.includes("记账")) return "financial";
  return "other";
}

export function createProcessingId(file: File) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${file.name}-${Math.random().toString(36).slice(2)}`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
