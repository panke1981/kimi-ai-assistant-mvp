/**
 * AI Caller - Unified interface for AI model calls
 * Supports: user-configured API keys (OpenAI-compatible), fallback to rule engine
 */

import { getDb } from "../queries/connection";
import { aiSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface AICallResult {
  content: string;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  fromRealAI: boolean;
}

interface UserAIConfig {
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  model: string;
}

/**
 * Get user's AI configuration from database
 */
async function getUserAIConfig(userId: number): Promise<UserAIConfig | null> {
  try {
    const db = getDb();
    const [setting] = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, userId))
      .limit(1);

    if (!setting || setting.isActive !== "yes" || !setting.apiKey) {
      return null;
    }

    // Build base URL
    let baseUrl = setting.baseUrl;
    if (!baseUrl) {
      const providerUrls: Record<string, string> = {
        openai: "https://api.openai.com/v1",
        deepseek: "https://api.deepseek.com/v1",
        custom: "",
      };
      baseUrl = providerUrls[setting.provider] || "";
    }
    if (!baseUrl) return null;

    return {
      provider: setting.provider,
      apiKey: setting.apiKey,
      baseUrl,
      model: setting.model || "gpt-4o-mini",
    };
  } catch {
    return null;
  }
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAICompatible(config: UserAIConfig, options: AICallOptions): Promise<AICallResult | null> {
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", response.status, error);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content || "";
    if (!content) return null;

    return {
      content,
      model: data.model || config.model,
      usage: data.usage,
      fromRealAI: true,
    };
  } catch (e) {
    console.error("AI call failed:", e);
    return null;
  }
}

/**
 * Main AI call function - tries real AI first, falls back to rule engine
 */
export async function callAI(
  userId: number,
  options: AICallOptions,
  fallbackFn: () => string
): Promise<AICallResult> {
  // Try user's configured AI first
  const config = await getUserAIConfig(userId);

  if (config) {
    const result = await callOpenAICompatible(config, options);
    if (result) return result;
  }

  // Fallback to rule engine
  return {
    content: fallbackFn(),
    fromRealAI: false,
  };
}

/**
 * Call AI with JSON response expected - tries to parse JSON from response
 */
export async function callAIForJSON<T>(
  userId: number,
  options: AICallOptions,
  fallbackFn: () => T
): Promise<T> {
  const result = await callAI(userId, options, () => JSON.stringify(fallbackFn()));

  if (!result.fromRealAI) {
    return fallbackFn();
  }

  // Try to parse JSON from real AI response
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/) || result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
  } catch {
    // JSON parse failed, use fallback
  }

  return fallbackFn();
}

/**
 * Check if user has active AI configuration
 */
export async function hasActiveAI(userId: number): Promise<boolean> {
  const config = await getUserAIConfig(userId);
  return config !== null;
}
