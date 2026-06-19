import type { AiSettingsSnapshot } from "@/lib/command-center-view";

export type AiSettingsProvider = "openai" | "deepseek" | "custom";
export type AiSettingsActiveState = "yes" | "no";

export interface AiSettingsDraft {
  provider: AiSettingsProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  isActive: AiSettingsActiveState;
}

export interface AiSettingsInput {
  provider: AiSettingsProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isActive: AiSettingsActiveState;
}

export function buildAiSettingsDraft(settings: AiSettingsSnapshot | null | undefined, isDemo: boolean): AiSettingsDraft {
  return {
    provider: toProvider(settings?.provider),
    baseUrl: settings?.baseUrl ?? "",
    model: isDemo ? "local-rule-engine" : settings?.model ?? "gpt-4.1-mini",
    apiKey: "",
    isActive: isDemo ? "no" : settings?.isActive ?? "yes",
  };
}

export function validateAiSettingsDraft(draft: AiSettingsDraft, isDemo: boolean) {
  if (isDemo) return null;
  if (!draft.model.trim()) return "请输入模型名称";
  if (!draft.apiKey.trim()) return "请输入 API Key 后再保存模型设置";
  if (draft.provider === "custom" && !draft.baseUrl.trim()) return "自定义模型需要填写 Base URL";
  return null;
}

export function toAiSettingsInput(draft: AiSettingsDraft): AiSettingsInput {
  const baseUrl = draft.baseUrl.trim();
  return {
    provider: draft.provider,
    apiKey: draft.apiKey.trim(),
    baseUrl: baseUrl || undefined,
    model: draft.model.trim(),
    isActive: draft.isActive,
  };
}

function toProvider(provider: string | null | undefined): AiSettingsProvider {
  if (provider === "deepseek" || provider === "custom") return provider;
  return "openai";
}
