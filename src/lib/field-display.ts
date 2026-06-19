export type FieldType =
  | "revenue"
  | "cost"
  | "expense"
  | "profit"
  | "quantity"
  | "price"
  | "date"
  | "text"
  | "unknown";

export const fieldTypeLabels: Record<FieldType, string> = {
  revenue: "收入",
  cost: "成本",
  expense: "费用",
  profit: "利润",
  quantity: "数量",
  price: "价格",
  date: "日期",
  text: "文本",
  unknown: "未知",
};

export const fieldTypeColors: Record<FieldType, { bg: string; text: string }> = {
  revenue: { bg: "rgba(15,118,110,0.1)", text: "var(--success)" },
  cost: { bg: "rgba(220,38,38,0.08)", text: "var(--danger)" },
  expense: { bg: "rgba(180,83,9,0.08)", text: "var(--warning)" },
  profit: { bg: "rgba(37,99,235,0.08)", text: "var(--brand)" },
  quantity: { bg: "rgba(37,99,235,0.08)", text: "var(--brand)" },
  price: { bg: "rgba(180,83,9,0.08)", text: "var(--warning)" },
  date: { bg: "rgba(8,145,178,0.08)", text: "#0891B2" },
  text: { bg: "rgba(100,116,139,0.08)", text: "var(--text-muted)" },
  unknown: { bg: "rgba(100,116,139,0.08)", text: "var(--text-muted)" },
};

export function toFieldType(value: string | null | undefined): FieldType {
  return value && value in fieldTypeLabels ? (value as FieldType) : "unknown";
}
