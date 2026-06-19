import type { CommandFieldItem } from "@/lib/command-center-view";

export type FieldConfirmationStatus = CommandFieldItem["isConfirmed"];

export interface FieldConfirmationSummary {
  confirmedCount: number;
  pendingCount: number;
  ignoredCount: number;
  lowConfidenceCount: number;
}

export function applyFieldConfirmation(
  fields: CommandFieldItem[],
  fieldId: number,
  status: FieldConfirmationStatus,
) {
  return fields.map((field) => (field.id === fieldId ? { ...field, isConfirmed: status } : field));
}

export function summarizeFieldConfirmation(fields: CommandFieldItem[]): FieldConfirmationSummary {
  return {
    confirmedCount: fields.filter((field) => field.isConfirmed === "confirmed").length,
    pendingCount: fields.filter((field) => field.isConfirmed === "pending").length,
    ignoredCount: fields.filter((field) => field.isConfirmed === "ignored").length,
    lowConfidenceCount: fields.filter((field) => Number(field.confidence ?? 1) < 0.85).length,
  };
}
