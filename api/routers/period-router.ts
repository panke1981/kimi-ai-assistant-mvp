import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { periods, files, reports } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const periodRouter = createRouter({
  list: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(periods)
        .where(eq(periods.companyId, input.companyId))
        .orderBy(desc(periods.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [period] = await db
        .select()
        .from(periods)
        .where(eq(periods.id, input.id))
        .limit(1);
      return period ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        label: z.string().min(1).max(20),
        type: z.enum(["month", "quarter", "year"]).default("month"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [period] = await db
        .insert(periods)
        .values({
          companyId: input.companyId,
          label: input.label,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "open",
        })
        .$returningId();
      return { id: period.id };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(reports).where(eq(reports.periodId, input.id));
      await db.delete(files).where(eq(files.periodId, input.id));
      await db.delete(periods).where(eq(periods.id, input.id));
      return { success: true };
    }),
});
