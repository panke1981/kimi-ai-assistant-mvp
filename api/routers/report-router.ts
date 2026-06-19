import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { reports, metrics } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import {
  assertCompanyOwner,
  assertMetricCompanyOwner,
  assertPeriodOwner,
  assertReportOwner,
} from "../lib/ownership";

export const reportRouter = createRouter({
  list: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      return db
        .select()
        .from(reports)
        .where(eq(reports.companyId, input.companyId))
        .orderBy(desc(reports.createdAt));
    }),

  getByPeriod: authedQuery
    .input(z.object({ periodId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertPeriodOwner(db, input.periodId, ctx.user.id);
      return db
        .select()
        .from(reports)
        .where(eq(reports.periodId, input.periodId))
        .orderBy(desc(reports.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertReportOwner(db, input.id, ctx.user.id);
      const [report] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.id))
        .limit(1);
      return report ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        periodId: z.number(),
        companyId: z.number(),
        type: z.enum(["monthly", "quarterly", "yearly", "custom"]).default("monthly"),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const period = await assertPeriodOwner(db, input.periodId, ctx.user.id);
      if (period.companyId !== input.companyId) {
        throw new Error("Period does not belong to company");
      }
      const [report] = await db
        .insert(reports)
        .values({
          periodId: input.periodId,
          companyId: input.companyId,
          type: input.type,
          title: input.title,
          status: "generating",
        })
        .$returningId();
      return { id: report.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        summary: z.string().optional(),
        insights: z.any().optional(),
        risks: z.any().optional(),
        suggestions: z.any().optional(),
        dataGaps: z.any().optional(),
        chartData: z.any().optional(),
        status: z.enum(["generating", "completed", "error"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await assertReportOwner(db, id, ctx.user.id);
      await db.update(reports).set(data).where(eq(reports.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertReportOwner(db, input.id, ctx.user.id);
      await db.delete(reports).where(eq(reports.id, input.id));
      return { success: true };
    }),
});

export const metricRouter = createRouter({
  list: authedQuery
    .input(z.object({ periodId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertPeriodOwner(db, input.periodId, ctx.user.id);
      return db
        .select()
        .from(metrics)
        .where(eq(metrics.periodId, input.periodId))
        .orderBy(metrics.category);
    }),

  create: authedQuery
    .input(
      z.object({
        periodId: z.number(),
        companyId: z.number(),
        name: z.string(),
        category: z.enum([
          "revenue",
          "cost",
          "expense",
          "profit",
          "cashflow",
          "efficiency",
          "growth",
          "other",
        ]),
        value: z.number(),
        unit: z.string().optional(),
        changePercent: z.number().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertMetricCompanyOwner(db, input.companyId, ctx.user.id);
      const period = await assertPeriodOwner(db, input.periodId, ctx.user.id);
      if (period.companyId !== input.companyId) {
        throw new Error("Period does not belong to company");
      }
      const [metric] = await db
        .insert(metrics)
        .values({
          periodId: input.periodId,
          companyId: input.companyId,
          name: input.name,
          category: input.category,
          value: String(input.value),
          unit: input.unit,
          changePercent: input.changePercent ? String(input.changePercent) : null,
          metadata: input.metadata,
        })
        .$returningId();
      return { id: metric.id };
    }),
});
