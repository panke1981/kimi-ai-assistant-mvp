import { describe, expect, it } from "vitest";

import {
  buildAiSettingsDraft,
  toAiSettingsInput,
  validateAiSettingsDraft,
  type AiSettingsDraft,
} from "@/lib/ai-settings-form";

describe("ai settings form helpers", () => {
  it("builds a practical default draft for a local workspace", () => {
    expect(buildAiSettingsDraft(null, true)).toEqual({
      provider: "openai",
      baseUrl: "",
      model: "local-rule-engine",
      apiKey: "",
      isActive: "no",
    });
  });

  it("prefills saved settings without exposing an API key value", () => {
    expect(
      buildAiSettingsDraft(
        {
          provider: "deepseek",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-chat",
          isActive: "yes",
          hasApiKey: true,
          apiKeyPreview: "...1234",
        },
        false,
      ),
    ).toEqual({
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: "",
      isActive: "yes",
    });
  });

  it("requires a fresh API key when saving real settings", () => {
    const draft: AiSettingsDraft = {
      provider: "openai",
      baseUrl: "",
      model: "gpt-4.1-mini",
      apiKey: "",
      isActive: "yes",
    };

    expect(validateAiSettingsDraft(draft, false)).toEqual("请输入 API Key 后再保存模型设置");
    expect(validateAiSettingsDraft(draft, true)).toBeNull();
  });

  it("normalizes optional base URL before submitting", () => {
    expect(
      toAiSettingsInput({
        provider: "custom",
        baseUrl: "  https://llm.example.com/v1  ",
        model: "  business-model  ",
        apiKey: "  sk-demo  ",
        isActive: "yes",
      }),
    ).toEqual({
      provider: "custom",
      baseUrl: "https://llm.example.com/v1",
      model: "business-model",
      apiKey: "sk-demo",
      isActive: "yes",
    });

    expect(
      toAiSettingsInput({
        provider: "openai",
        baseUrl: " ",
        model: "gpt-4.1-mini",
        apiKey: "sk-demo",
        isActive: "no",
      }).baseUrl,
    ).toBeUndefined();
  });
});
