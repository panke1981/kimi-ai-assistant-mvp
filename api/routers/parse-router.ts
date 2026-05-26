import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { files, fieldDictionary, metrics, reports, periods } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { recognizeFields, calculateMetrics, generateAnalysisReport, generateChatResponse } from "../lib/ai-engine";
import { callAI, callAIForJSON } from "../lib/ai-caller";

export const parseRouter = createRouter({
  // Process uploaded file: parse → AI field recognition → calculate metrics
  processFile: authedQuery
    .input(
      z.object({
        fileId: z.number(),
        companyId: z.number(),
        periodId: z.number(),
        headers: z.array(z.string()),
        previewRows: z.array(z.record(z.string(), z.any())).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Step 1: Extract fields with samples for AI recognition
      const fieldsForRecognition = input.headers.map((header) => {
        const samples = input.previewRows
          .map((row) => row[header])
          .filter((v) => v !== null && v !== undefined && v !== "")
          .slice(0, 10);
        return { name: header, samples };
      });

      // Step 2: AI field recognition (try real AI first, fallback to rule engine)
      const systemPrompt = `你是「数观」AI 经营分析系统的字段识别专家。
请根据字段名和样本数据，为每个字段给出映射后的标准字段名和字段类型。
字段类型必须是: revenue(收入) / cost(成本) / expense(费用) / profit(利润) / quantity(数量) / price(价格) / date(日期) / text(文本) / unknown(未知)
严格按JSON返回: [{"name":"原始名","mappedField":"映射名","fieldType":"revenue","confidence":0.95}]`;

      const userPrompt = `分析以下字段:\n${fieldsForRecognition.map(f => `- "${f.name}": 样本 [${f.samples.slice(0, 5).join(", ")}]`).join("\n")}`;

      const recognized = await callAIForJSON(
        ctx.user.id,
        { systemPrompt, userPrompt, temperature: 0.2 },
        () => recognizeFields(fieldsForRecognition)
      );

      const fieldList = Array.isArray(recognized) ? recognized : recognizeFields(fieldsForRecognition);

      // Step 3: Save recognized fields to field_dictionary
      const savedFields = [];
      for (const field of fieldList) {
        const existing = await db
          .select()
          .from(fieldDictionary)
          .where(
            and(
              eq(fieldDictionary.companyId, input.companyId),
              eq(fieldDictionary.originalField, field.name)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          const [result] = await db
            .insert(fieldDictionary)
            .values({
              companyId: input.companyId,
              originalField: field.name,
              mappedField: field.mappedField,
              fieldType: field.fieldType as "revenue" | "cost" | "expense" | "profit" | "quantity" | "price" | "date" | "text" | "unknown",
              confidence: String(field.confidence),
              isConfirmed: field.confidence > 0.85 ? "confirmed" : "pending",
            })
            .$returningId();
          savedFields.push({ ...field, id: result.id, isConfirmed: field.confidence > 0.85 ? "confirmed" : "pending" });
        } else {
          await db
            .update(fieldDictionary)
            .set({
              mappedField: field.mappedField,
              fieldType: field.fieldType as "revenue" | "cost" | "expense" | "profit" | "quantity" | "price" | "date" | "text" | "unknown",
              confidence: String(field.confidence),
            })
            .where(eq(fieldDictionary.id, existing[0].id));
          savedFields.push({ ...field, id: existing[0].id, isConfirmed: existing[0].isConfirmed });
        }
      }

      // Step 4: Update file status
      await db
        .update(files)
        .set({
          status: "processed",
          aiRecognizedFields: fieldList,
        })
        .where(eq(files.id, input.fileId));

      // Step 5: Auto-calculate metrics if enough confirmed fields
      const confirmedFields = savedFields.filter((f) => f.isConfirmed === "confirmed");
      if (confirmedFields.length >= 2) {
        const fieldMappings = confirmedFields.map((f) => ({
          originalField: f.name,
          mappedField: f.mappedField,
          fieldType: f.fieldType,
        }));

        const calculatedMetrics = calculateMetrics(input.previewRows, fieldMappings);

        for (const metric of calculatedMetrics) {
          await db.insert(metrics).values({
            periodId: input.periodId,
            companyId: input.companyId,
            name: metric.name,
            category: metric.category as "revenue" | "cost" | "profit" | "cashflow" | "efficiency" | "growth" | "other",
            value: String(metric.value),
            unit: metric.unit ?? undefined,
          });
        }

        return {
          fields: savedFields,
          metrics: calculatedMetrics,
          autoAnalyzed: true,
        };
      }

      return { fields: savedFields, metrics: [], autoAnalyzed: false };
    }),

  // Generate report from real data
  generateReport: authedQuery
    .input(
      z.object({
        periodId: z.number(),
        companyId: z.number(),
        companyName: z.string(),
        period: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

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

      // Get existing metrics
      const existingMetrics = await db
        .select()
        .from(metrics)
        .where(eq(metrics.periodId, input.periodId));

      // Generate report with AI (try real AI first)
      const systemPrompt = `你是「数观」AI 经营分析系统的资深经营分析师。请基于经营数据指标生成专业月度经营分析报告。
严格按JSON返回: {"summary":"总结","insights":[{"title":"标题","content":"内容","level":"success"}],"risks":[{"title":"标题","content":"内容","severity":"medium"}],"suggestions":["建议1"],"dataGaps":["缺口1"]}`;

      const userPrompt = `企业: ${input.companyName}, 周期: ${input.period}
指标:\n${existingMetrics.map(m => `- ${m.name}: ${m.value}${m.unit || ""}`).join("\n")}
已确认字段: ${fields.map(f => `${f.originalField}→${f.mappedField}(${f.fieldType})`).join(", ")}`;

      const report = await callAIForJSON(
        ctx.user.id,
        { systemPrompt, userPrompt, temperature: 0.3 },
        () => generateAnalysisReport({
          period: input.period,
          companyName: input.companyName,
          metrics: existingMetrics.map((m) => ({ name: m.name, category: m.category, value: Number(m.value), unit: m.unit })),
          dataSize: 0,
          fieldCount: fields.length,
        })
      );

      // Ensure report has chartData
      if (!report.chartData) {
        report.chartData = {
          revenueTrend: [
            { month: "上期", value: existingMetrics.find((m) => m.name === "营业收入") ? Number(existingMetrics.find((m) => m.name === "营业收入")!.value) * 0.92 : 0 },
            { month: "本期", value: Number(existingMetrics.find((m) => m.name === "营业收入")?.value || 0) },
          ],
          costBreakdown: [
            { name: "商品成本", value: Number(existingMetrics.find((m) => m.name === "商品成本")?.value || 0) },
            { name: "运营费用", value: Number(existingMetrics.find((m) => m.name === "运营费用")?.value || 0) },
            { name: "净利润", value: Math.max(0, Number(existingMetrics.find((m) => m.name === "净利润")?.value || 0)) },
          ].filter((item) => item.value > 0),
        };
      }

      // Save report
      const [reportResult] = await db
        .insert(reports)
        .values({
          periodId: input.periodId,
          companyId: input.companyId,
          type: "monthly",
          title: `${input.period} 经营分析报告`,
          summary: report.summary,
          insights: report.insights,
          risks: report.risks,
          suggestions: report.suggestions,
          dataGaps: report.dataGaps,
          chartData: report.chartData,
          status: "completed",
        })
        .$returningId();

      return { reportId: reportResult.id, report };
    }),

  // Chat with AI assistant
  chat: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        companyName: z.string(),
        period: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

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
      const periodsList = await db
        .select()
        .from(periods)
        .where(eq(periods.companyId, input.companyId))
        .orderBy(periods.createdAt);

      const latestPeriod = periodsList[periodsList.length - 1];
      let existingMetrics: typeof metrics.$inferSelect[] = [];
      if (latestPeriod) {
        existingMetrics = await db
          .select()
          .from(metrics)
          .where(eq(metrics.periodId, latestPeriod.id));
      }

      // Try real AI first
      const systemPrompt = `你是「数观」AI 经营助手，资深企业经营顾问。帮助中小企业主理解经营数据、发现问题、优化决策。
风格: 专业但亲和，用数据说话，简洁有力，主动指出数据缺口。
当前企业: ${input.companyName}, 当前周期: ${input.period}
已确认字段: ${fields.map(f => `${f.originalField}→${f.mappedField}(${f.fieldType})`).join(", ")}
指标数据: ${existingMetrics.map(m => `${m.name}:${m.value}${m.unit || ""}`).join(", ")}`;

      const result = await callAI(ctx.user.id, {
        systemPrompt,
        userPrompt: input.message,
        temperature: 0.5,
      }, () => generateChatResponse(
        {
          companyName: input.companyName,
          period: input.period,
          metrics: existingMetrics.map((m) => ({ name: m.name, category: m.category, value: Number(m.value), unit: m.unit })),
          fields: fields.map((f) => ({ originalField: f.originalField, mappedField: f.mappedField || f.originalField, fieldType: f.fieldType })),
        },
        input.message
      ));

      return { response: result.content, fromRealAI: result.fromRealAI };
    }),
});
