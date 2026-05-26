/**
 * AI Service Layer
 * Centralizes all AI interactions for field recognition, report generation, and chat
 */

const SYSTEM_PROMPT_FIELD_RECOGNITION = `你是「数观」AI 经营分析系统的字段识别专家。你的任务是理解用户上传的经营数据文件中的字段含义。

请根据提供的字段名和样本数据，为每个字段给出：
1. 映射后的标准字段名（中文）
2. 字段类型：revenue(收入) / cost(成本) / expense(费用) / profit(利润) / quantity(数量) / price(价格) / date(日期) / text(文本) / unknown(未知)
3. 置信度（0-1）

注意：
- "实收金额"、"销售额"、"营业收入"等应映射为收入类
- "成本"、"商品成本"、"采购成本"等应映射为成本类  
- "费用"、"推广消耗"、"广告费"等应映射为费用类
- "利润"、"净利润"、"毛利"等应映射为利润类
- "日期"、"时间"等应映射为日期类
- "数量"、"件数"、"订单量"等应映射为数量类

请严格按 JSON 格式返回数组。`;

const SYSTEM_PROMPT_REPORT = `你是「数观」AI 经营分析系统的资深经营分析师。你拥有 20 年企业财务管理经验，擅长从数据中发现经营问题。

请基于提供的经营数据指标，生成一份专业的月度经营分析报告。

报告要求：
1. 用专业但易懂的语言
2. 数据引用要具体、有对比
3. 风险提示要明确指出潜在问题
4. 建议要可执行、具体
5. 数据缺口要指出缺少什么数据会影响什么分析

请严格按 JSON 格式返回。`;

const SYSTEM_PROMPT_CHAT = `你是「数观」AI 经营助手，一位资深的企业经营顾问。你的职责是帮助中小企业主理解经营数据、发现问题、优化决策。

你的风格：
- 专业但不失亲和力
- 善于用数据说话
- 回答简洁有力，重点突出
- 主动指出数据缺口和改进方向
- 不编造数据，只基于提供的数据进行分析

当用户的问题涉及未提供的数据时，坦诚告知并建议补充。

请用中文回答。`;

// ─── Field Recognition ──────────────────────────────────

export async function recognizeFields(fields: { name: string; samples: any[] }[]): Promise<any[]> {
  const prompt = `${SYSTEM_PROMPT_FIELD_RECOGNITION}

请分析以下字段：
${fields.map(f => `- "${f.name}": 样本值 [${f.samples.slice(0, 5).join(", ")}]`).join("\n")}

请返回 JSON 数组格式：
[{"name": "原始字段名", "mappedField": "映射后名称", "fieldType": "revenue/cost/expense/profit/quantity/price/date/text/unknown", "confidence": 0.95}]`;

  try {
    const response = await callAI(prompt);
    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error("Field recognition failed:", e);
    return fallbackFieldRecognition(fields);
  }
}

function fallbackFieldRecognition(fields: { name: string; samples: any[] }[]): any[] {
  const keywordMap: Record<string, { mappedField: string; fieldType: string }> = {
    // Revenue
    "金额": { mappedField: "金额", fieldType: "revenue" },
    "收入": { mappedField: "营业收入", fieldType: "revenue" },
    "销售额": { mappedField: "销售额", fieldType: "revenue" },
    "营收": { mappedField: "营业收入", fieldType: "revenue" },
    "实收": { mappedField: "实收金额", fieldType: "revenue" },
    "总价": { mappedField: "总价", fieldType: "revenue" },
    "price": { mappedField: "价格", fieldType: "price" },
    // Cost
    "成本": { mappedField: "成本", fieldType: "cost" },
    "进价": { mappedField: "采购成本", fieldType: "cost" },
    "cost": { mappedField: "成本", fieldType: "cost" },
    // Expense
    "费用": { mappedField: "费用", fieldType: "expense" },
    "推广": { mappedField: "推广费用", fieldType: "expense" },
    "广告": { mappedField: "广告费用", fieldType: "expense" },
    "消耗": { mappedField: "消耗金额", fieldType: "expense" },
    "运费": { mappedField: "运费", fieldType: "expense" },
    // Quantity
    "数量": { mappedField: "数量", fieldType: "quantity" },
    "件数": { mappedField: "件数", fieldType: "quantity" },
    "订单": { mappedField: "订单数", fieldType: "quantity" },
    "qty": { mappedField: "数量", fieldType: "quantity" },
    "quantity": { mappedField: "数量", fieldType: "quantity" },
    // Date
    "日期": { mappedField: "日期", fieldType: "date" },
    "时间": { mappedField: "时间", fieldType: "date" },
    "date": { mappedField: "日期", fieldType: "date" },
    // Text
    "名称": { mappedField: "名称", fieldType: "text" },
    "客户": { mappedField: "客户", fieldType: "text" },
    "商品": { mappedField: "商品", fieldType: "text" },
    "备注": { mappedField: "备注", fieldType: "text" },
    "编号": { mappedField: "编号", fieldType: "text" },
  };

  return fields.map((f) => {
    const name = f.name.toLowerCase();
    let matched = { mappedField: f.name, fieldType: "unknown" };
    let confidence = 0.5;

    for (const [keyword, mapping] of Object.entries(keywordMap)) {
      if (name.includes(keyword.toLowerCase())) {
        matched = mapping;
        confidence = 0.85;
        break;
      }
    }

    return {
      name: f.name,
      mappedField: matched.mappedField,
      fieldType: matched.fieldType,
      confidence,
    };
  });
}

// ─── Report Generation ──────────────────────────────────

export async function generateReport(data: {
  period: string;
  companyName: string;
  fields: any[];
  metrics: any[];
}): Promise<any> {
  const prompt = `${SYSTEM_PROMPT_REPORT}

经营数据概况：
- 企业：${data.companyName}
- 分析周期：${data.period}
- 已确认字段：${data.fields.map((f) => `${f.originalField}→${f.mappedField}(${f.fieldType})`).join(", ")}
- 核心指标：
${data.metrics.map((m) => `  · ${m.name}: ${m.value}${m.unit || ""} ${m.changePercent ? `(环比${m.changePercent > 0 ? "+" : ""}${m.changePercent}%)` : ""}`).join("\n")}

请生成分析报告，返回 JSON 格式：
{
  "summary": "一段整体的月度经营总结（200字左右）",
  "insights": [{"title": "洞察标题", "content": "具体描述", "level": "info/warning/success"}],
  "risks": [{"title": "风险标题", "content": "具体描述", "severity": "high/medium/low"}],
  "suggestions": ["具体建议1", "建议2"],
  "dataGaps": ["缺少的数据及影响说明"]
}`;

  try {
    const response = await callAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Report generation failed:", e);
  }

  // Fallback
  return generateFallbackReport(data);
}

function generateFallbackReport(data: { metrics: any[]; companyName: string; period: string }): any {
  const revenue = data.metrics.find((m) => m.category === "revenue");
  const profit = data.metrics.find((m) => m.category === "profit");
  const cost = data.metrics.find((m) => m.category === "cost");

  return {
    summary: `${data.companyName} ${data.period} 经营分析：${revenue ? `营业收入${revenue.value}元` : "收入数据采集中"}，${profit ? `净利润${profit.value}元` : "利润数据采集中"}。整体经营${profit && revenue ? (Number(profit.value) / Number(revenue.value) > 0.2 ? "状况良好，利润率处于健康水平" : "利润率偏低，建议关注成本控制") : "数据待完善"}。`,
    insights: [
      { title: "收入趋势", content: revenue ? `本期收入${Number(revenue.value).toLocaleString()}元，建议对比历史数据评估增长态势。` : "收入数据待采集，建议上传销售明细表。", level: revenue ? "success" : "warning" },
      { title: "成本结构", content: cost ? `成本总额${Number(cost.value).toLocaleString()}元，${revenue ? `占收入${((Number(cost.value) / Number(revenue.value)) * 100).toFixed(1)}%` : ""}。` : "成本数据待采集，建议上传成本明细表。", level: cost ? "info" : "warning" },
    ],
    risks: [
      { title: "数据完整度", content: "当前数据可能不完整，分析结果仅供参考。建议补充更多经营数据以获得更精准的分析。", severity: "medium" },
    ],
    suggestions: [
      "补充至少3个月的历史数据以进行趋势对比分析",
      "上传银行流水数据以完善现金流分析",
      "建立定期数据上传机制以持续追踪经营指标",
    ],
    dataGaps: [
      "缺少历史同期数据，无法进行同比分析",
      "缺少费用明细，无法拆解成本结构",
      "缺少客户数据，无法评估客户价值和复购率",
    ],
  };
}

// ─── Chat ───────────────────────────────────────────────

export async function chat(context: {
  companyName: string;
  period: string;
  metrics: any[];
  fields: any[];
  history: { role: string; content: string }[];
}, userMessage: string): Promise<string> {
  const metricsSummary = context.metrics
    .map((m) => `- ${m.name}: ${m.value}${m.unit || ""}`)
    .join("\n");

  const fieldsSummary = context.fields
    .filter((f) => f.isConfirmed === "confirmed")
    .map((f) => `- ${f.originalField} → ${f.mappedField} (${f.fieldType})`)
    .join("\n");

  const prompt = `${SYSTEM_PROMPT_CHAT}

当前企业信息：
- 企业名称：${context.companyName}
- 当前周期：${context.period}

已确认的数据字段：
${fieldsSummary || "暂无已确认字段"}

当前经营指标：
${metricsSummary || "暂无指标数据"}

用户问题：${userMessage}

请基于以上数据给出专业、简洁的经营分析回答。如果没有足够数据支撑，请坦诚告知并建议补充哪些数据。`;

  try {
    return await callAI(prompt);
  } catch (e) {
    console.error("Chat failed:", e);
    return `抱歉，我暂时无法处理您的请求。建议您：\n1. 确认已上传经营数据文件\n2. 完成 AI 字段确认\n3. 生成经营分析报告后再提问\n\n如果您已上传数据，请尝试重新生成报告。`;
  }
}

// ─── Low-level AI call ──────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  // Try OpenAI-compatible endpoint first
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error("No AI API key configured");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "";
}
