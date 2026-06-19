import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { aiSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export const aiSettingsRouter = createRouter({
  // Get current user's AI settings
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [setting] = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, ctx.user.id))
      .limit(1);
    if (!setting) return null;
    return {
      id: setting.id,
      userId: setting.userId,
      provider: setting.provider,
      baseUrl: setting.baseUrl,
      model: setting.model,
      isActive: setting.isActive,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      hasApiKey: Boolean(setting.apiKey),
      apiKeyPreview: setting.apiKey ? `...${setting.apiKey.slice(-4)}` : null,
    };
  }),

  // Save or update AI settings
  save: authedQuery
    .input(
      z.object({
        provider: z.enum(["openai", "deepseek", "custom"]),
        apiKey: z.string().min(1).max(500),
        baseUrl: z.string().optional(),
        model: z.string().min(1).max(100),
        isActive: z.enum(["yes", "no"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Check if settings already exist
      const [existing] = await db
        .select()
        .from(aiSettings)
        .where(eq(aiSettings.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(aiSettings)
          .set({
            provider: input.provider,
            // MVP note: persisted as plain text for now. Encrypt before production use.
            apiKey: input.apiKey,
            baseUrl: input.baseUrl || null,
            model: input.model,
            isActive: input.isActive,
          })
          .where(eq(aiSettings.id, existing.id));
        return { id: existing.id, message: "Settings updated" };
      } else {
        const [result] = await db
          .insert(aiSettings)
          .values({
            userId: ctx.user.id,
            provider: input.provider,
            apiKey: input.apiKey,
            baseUrl: input.baseUrl || null,
            model: input.model,
            isActive: input.isActive,
          })
          .$returningId();
        return { id: result.id, message: "Settings saved" };
      }
    }),

  // Delete AI settings
  delete: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .delete(aiSettings)
      .where(eq(aiSettings.userId, ctx.user.id));
    return { success: true };
  }),
});
