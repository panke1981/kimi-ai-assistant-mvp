import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { conversations, companies, periods, metrics, fieldDictionary } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateChatResponse } from "../lib/ai-engine";

export const aiRouter = createRouter({
  // Get chat history
  getHistory: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(conversations)
        .where(eq(conversations.companyId, input.companyId))
        .orderBy(conversations.createdAt)
        .limit(100);
    }),

  // Send message - now uses real AI engine
  sendMessage: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Save user message
      await db.insert(conversations).values({
        companyId: input.companyId,
        userId: ctx.user.id,
        role: "user",
        content: input.content,
        type: "chat",
      });

      // Get company info
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      // Get confirmed fields
      const fields = await db
        .select()
        .from(fieldDictionary)
        .where(
          and(
            eq(fieldDictionary.companyId, input.companyId),
            eq(fieldDictionary.isConfirmed, "confirmed")
          )
        );

      // Get latest metrics
      const periodList = await db
        .select()
        .from(periods)
        .where(eq(periods.companyId, input.companyId))
        .orderBy(desc(periods.createdAt))
        .limit(1);

      const latestPeriod = periodList[0];
      let existingMetrics: typeof metrics.$inferSelect[] = [];
      if (latestPeriod) {
        existingMetrics = await db
          .select()
          .from(metrics)
          .where(eq(metrics.periodId, latestPeriod.id));
      }

      // Generate real AI response
      const response = generateChatResponse(
        {
          companyName: company?.name || "企业",
          period: latestPeriod?.label || "本月",
          metrics: existingMetrics.map((m) => ({
            name: m.name,
            category: m.category,
            value: Number(m.value),
            unit: m.unit,
          })),
          fields: fields.map((f) => ({
            originalField: f.originalField,
            mappedField: f.mappedField || f.originalField,
            fieldType: f.fieldType,
          })),
        },
        input.content
      );

      // Save AI response
      await db.insert(conversations).values({
        companyId: input.companyId,
        userId: ctx.user.id,
        role: "assistant",
        content: response,
        type: "chat",
      });

      return { response };
    }),
});
