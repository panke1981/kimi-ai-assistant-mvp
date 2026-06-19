import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  actionTasks,
  companies,
  diagnosisResults,
  evidenceItems,
  metrics,
  riskSignals,
} from "@db/schema";
import { assertActionTaskOwner, assertCompanyOwner, assertPeriodOwner } from "../lib/ownership";
import { evaluateBusinessDiagnosis, type BusinessSnapshot } from "../../src/lib/diagnosis-engine";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function metricValue(metricList: Array<typeof metrics.$inferSelect>, names: string[], fallback = 0): number {
  const found = metricList.find((metric) => names.includes(metric.name));
  return found ? toNumber(found.value) : fallback;
}

function previousValue(current: number, changePercent: unknown, fallbackRatio = 0.9): number {
  const change = toNumber(changePercent);
  if (change !== 0) return current / (1 + change / 100);
  return current * fallbackRatio;
}

function metricPrevious(metricList: Array<typeof metrics.$inferSelect>, names: string[], current: number, fallbackRatio = 0.9): number {
  const found = metricList.find((metric) => names.includes(metric.name));
  return previousValue(current, found?.changePercent, fallbackRatio);
}

function toRiskLevel(level: "高" | "中" | "低"): "high" | "medium" | "low" {
  if (level === "高") return "high";
  if (level === "低") return "low";
  return "medium";
}

function toPriority(priority: "高" | "中" | "低"): "high" | "medium" | "low" {
  if (priority === "高") return "high";
  if (priority === "低") return "low";
  return "medium";
}

function toTaskStatus(status: "待处理" | "进行中" | "已完成"): "pending" | "in_progress" | "completed" {
  if (status === "进行中") return "in_progress";
  if (status === "已完成") return "completed";
  return "pending";
}

function fromTaskStatus(status: "pending" | "in_progress" | "completed") {
  if (status === "in_progress") return "进行中";
  if (status === "completed") return "已完成";
  return "待处理";
}

function buildSnapshot(params: {
  companyName: string;
  periodLabel: string;
  metricList: Array<typeof metrics.$inferSelect>;
}): BusinessSnapshot {
  const { companyName, periodLabel, metricList } = params;
  const revenue = metricValue(metricList, ["营业收入", "收入", "销售额"]);
  const expense = metricValue(metricList, ["运营费用", "费用", "营销费用"], Math.round(revenue * 0.15));
  const netProfit = metricValue(metricList, ["净利润", "利润"], Math.round(revenue - expense - metricValue(metricList, ["商品成本", "成本"], revenue * 0.55)));
  const netMargin = metricValue(metricList, ["净利率"], revenue > 0 ? netProfit / revenue * 100 : 0);
  const grossMargin = metricValue(metricList, ["毛利率"], 45);
  const cashflow = metricValue(metricList, ["现金流净额", "实收金额"], Math.round(revenue * 0.75));
  const marketingExpense = metricValue(metricList, ["营销费用", "广告费用", "广告费"], Math.round(expense * 0.39));
  const newCustomerRevenue = metricValue(metricList, ["新客收入"], Math.round(revenue * 0.36));
  const repeatRate = metricValue(metricList, ["新客复购率", "复购率"], 14);

  return {
    company: companyName,
    period: periodLabel,
    revenue: {
      value: revenue,
      previous: metricPrevious(metricList, ["营业收入", "收入", "销售额"], revenue),
      budget: Math.round(revenue * 0.95),
      historicalAverage: Math.round(revenue * 0.86),
    },
    expense: {
      value: expense,
      previous: metricPrevious(metricList, ["运营费用", "费用", "营销费用"], expense, 0.85),
      budget: Math.round(expense * 0.92),
      historicalAverage: Math.round(expense * 0.88),
    },
    grossMargin: {
      value: grossMargin,
      previous: metricPrevious(metricList, ["毛利率"], grossMargin, 0.97),
      budget: Math.max(0, grossMargin - 1),
      historicalAverage: Math.max(0, grossMargin - 2.5),
    },
    netProfit: {
      value: netProfit,
      previous: metricPrevious(metricList, ["净利润", "利润"], netProfit, 0.82),
      budget: Math.round(netProfit * 0.92),
      historicalAverage: Math.round(netProfit * 0.83),
    },
    netMargin: {
      value: netMargin,
      previous: metricPrevious(metricList, ["净利率"], netMargin, 0.92),
      budget: Math.max(0, netMargin - 2),
      historicalAverage: Math.max(0, netMargin - 3.2),
    },
    cashflow: {
      value: cashflow,
      previous: Math.round(cashflow * 1.07),
      budget: Math.round(cashflow * 1.1),
      historicalAverage: Math.round(cashflow * 1.04),
    },
    receivableDays: { value: 42, previous: 36, budget: 35, historicalAverage: 37 },
    marketingExpense: {
      value: marketingExpense,
      previous: Math.round(marketingExpense * 0.79),
      budget: Math.round(marketingExpense * 0.86),
      historicalAverage: Math.round(marketingExpense * 0.82),
    },
    newCustomerRevenue: {
      value: newCustomerRevenue,
      previous: Math.round(newCustomerRevenue * 0.84),
      budget: Math.round(newCustomerRevenue * 0.92),
      historicalAverage: Math.round(newCustomerRevenue * 0.79),
    },
    repeatRate: { value: repeatRate, previous: repeatRate + 2.5, budget: 21, historicalAverage: 18.2 },
  };
}

export const diagnosisRouter = createRouter({
  getByPeriod: authedQuery
    .input(z.object({ periodId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertPeriodOwner(db, input.periodId, ctx.user.id);
      const [result] = await db
        .select()
        .from(diagnosisResults)
        .where(eq(diagnosisResults.periodId, input.periodId))
        .orderBy(desc(diagnosisResults.createdAt))
        .limit(1);

      if (!result) return null;

      const [risks, evidence, tasks] = await Promise.all([
        db.select().from(riskSignals).where(eq(riskSignals.diagnosisResultId, result.id)),
        db.select().from(evidenceItems).where(eq(evidenceItems.diagnosisResultId, result.id)),
        db.select().from(actionTasks).where(eq(actionTasks.diagnosisResultId, result.id)),
      ]);

      return { result, risks, evidence, tasks };
    }),

  generateForPeriod: authedQuery
    .input(z.object({ companyId: z.number(), periodId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const period = await assertPeriodOwner(db, input.periodId, ctx.user.id);
      if (period.companyId !== input.companyId) throw new Error("Period does not belong to company");

      const [company] = await db
        .select({ name: companies.name })
        .from(companies)
        .where(and(eq(companies.id, input.companyId), eq(companies.userId, ctx.user.id)))
        .limit(1);

      const metricList = await db
        .select()
        .from(metrics)
        .where(eq(metrics.periodId, input.periodId));

      const snapshot = buildSnapshot({
        companyName: company?.name ?? "当前企业",
        periodLabel: period.label,
        metricList,
      });
      const model = evaluateBusinessDiagnosis(snapshot);

      const [inserted] = await db
        .insert(diagnosisResults)
        .values({
          periodId: input.periodId,
          companyId: input.companyId,
          summary: model.summary.conclusion,
          healthScore: model.summary.healthScore,
          confidence: model.summary.confidence,
          reasons: model.summary.reasons,
          diagnosisBlocks: model.diagnosisBlocks,
          snapshot,
          status: "generated",
        })
        .$returningId();

      const diagnosisResultId = inserted.id;

      for (const risk of model.riskSignals) {
        await db.insert(riskSignals).values({
          diagnosisResultId,
          companyId: input.companyId,
          periodId: input.periodId,
          code: risk.id,
          name: risk.name,
          level: toRiskLevel(risk.level),
          rule: risk.rule,
          description: risk.description,
          relatedMetrics: risk.relatedMetrics,
        });
      }

      for (const evidence of model.evidenceItems) {
        await db.insert(evidenceItems).values({
          diagnosisResultId,
          companyId: input.companyId,
          periodId: input.periodId,
          code: evidence.id,
          title: evidence.title,
          source: evidence.source,
          value: evidence.value,
          note: evidence.note,
        });
      }

      for (const task of model.actionTasks) {
        await db.insert(actionTasks).values({
          diagnosisResultId,
          companyId: input.companyId,
          periodId: input.periodId,
          code: task.id,
          title: task.title,
          type: task.type,
          priority: toPriority(task.priority),
          owner: task.owner,
          dueDate: task.due,
          triggerReason: task.reason,
          relatedMetrics: task.metrics,
          suggestedAction: task.reason,
          expectedImpact: task.expectedImpact,
          status: toTaskStatus(task.status),
        });
      }

      return { id: diagnosisResultId, model };
    }),

  updateTaskStatus: authedQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "in_progress", "completed"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertActionTaskOwner(db, input.id, ctx.user.id);
      await db.update(actionTasks).set({ status: input.status }).where(eq(actionTasks.id, input.id));
      return { success: true, statusLabel: fromTaskStatus(input.status) };
    }),
});
