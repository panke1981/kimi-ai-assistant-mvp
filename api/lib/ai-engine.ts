/**
 * AI Engine - Rule-based intelligent analysis
 * Fully functional without external AI API keys
 */

// ─── Field Recognition Engine ───────────────────────────

interface ParsedField {
  name: string;
  samples: unknown[];
}

interface RecognizedField {
  name: string;
  mappedField: string;
  fieldType: "revenue" | "cost" | "expense" | "profit" | "quantity" | "price" | "date" | "text" | "unknown";
  confidence: number;
}

const FIELD_KEYWORDS: Record<string, { mappedField: string; fieldType: RecognizedField["fieldType"]; weight: number }[]> = {
  revenue: [
    { mappedField: "营业收入", fieldType: "revenue", weight: 1 },
    { mappedField: "销售金额", fieldType: "revenue", weight: 0.95 },
    { mappedField: "实收金额", fieldType: "revenue", weight: 0.95 },
    { mappedField: "销售额", fieldType: "revenue", weight: 0.95 },
    { mappedField: "总收入", fieldType: "revenue", weight: 0.95 },
    { mappedField: "收入", fieldType: "revenue", weight: 0.9 },
    { mappedField: "成交额", fieldType: "revenue", weight: 0.9 },
    { mappedField: "总金额", fieldType: "revenue", weight: 0.85 },
    { mappedField: "金额", fieldType: "revenue", weight: 0.8 },
    { mappedField: "总价", fieldType: "revenue", weight: 0.85 },
    { mappedField: "实付金额", fieldType: "revenue", weight: 0.9 },
    { mappedField: "订单金额", fieldType: "revenue", weight: 0.92 },
    { mappedField: "成交金额", fieldType: "revenue", weight: 0.92 },
  ],
  cost: [
    { mappedField: "商品成本", fieldType: "cost", weight: 1 },
    { mappedField: "采购成本", fieldType: "cost", weight: 0.95 },
    { mappedField: "进货成本", fieldType: "cost", weight: 0.95 },
    { mappedField: "直接成本", fieldType: "cost", weight: 0.9 },
    { mappedField: "成本", fieldType: "cost", weight: 0.85 },
    { mappedField: "物料成本", fieldType: "cost", weight: 0.9 },
    { mappedField: "生产成本", fieldType: "cost", weight: 0.95 },
    { mappedField: "进价", fieldType: "cost", weight: 0.9 },
    { mappedField: "拿货价", fieldType: "cost", weight: 0.9 },
  ],
  expense: [
    { mappedField: "广告费用", fieldType: "expense", weight: 1 },
    { mappedField: "推广费用", fieldType: "expense", weight: 0.95 },
    { mappedField: "推广消耗", fieldType: "expense", weight: 0.98 },
    { mappedField: "营销费用", fieldType: "expense", weight: 0.9 },
    { mappedField: "广告费", fieldType: "expense", weight: 0.95 },
    { mappedField: "投放费用", fieldType: "expense", weight: 0.95 },
    { mappedField: "运费", fieldType: "expense", weight: 0.9 },
    { mappedField: "物流费用", fieldType: "expense", weight: 0.9 },
    { mappedField: "平台费用", fieldType: "expense", weight: 0.9 },
    { mappedField: "手续费", fieldType: "expense", weight: 0.85 },
    { mappedField: "佣金", fieldType: "expense", weight: 0.85 },
    { mappedField: "租金", fieldType: "expense", weight: 0.85 },
    { mappedField: "工资", fieldType: "expense", weight: 0.85 },
    { mappedField: "水电费", fieldType: "expense", weight: 0.8 },
    { mappedField: "费用", fieldType: "expense", weight: 0.75 },
  ],
  profit: [
    { mappedField: "净利润", fieldType: "profit", weight: 1 },
    { mappedField: "毛利润", fieldType: "profit", weight: 0.95 },
    { mappedField: "利润", fieldType: "profit", weight: 0.9 },
    { mappedField: "毛利", fieldType: "profit", weight: 0.9 },
    { mappedField: "净利", fieldType: "profit", weight: 0.9 },
    { mappedField: "盈利", fieldType: "profit", weight: 0.85 },
  ],
  quantity: [
    { mappedField: "数量", fieldType: "quantity", weight: 0.9 },
    { mappedField: "件数", fieldType: "quantity", weight: 0.9 },
    { mappedField: "订单数量", fieldType: "quantity", weight: 0.95 },
    { mappedField: "销量", fieldType: "quantity", weight: 0.9 },
    { mappedField: "购买数量", fieldType: "quantity", weight: 0.9 },
    { mappedField: "下单量", fieldType: "quantity", weight: 0.9 },
    { mappedField: "访客数", fieldType: "quantity", weight: 0.85 },
    { mappedField: "点击量", fieldType: "quantity", weight: 0.85 },
    { mappedField: "展现量", fieldType: "quantity", weight: 0.85 },
  ],
  price: [
    { mappedField: "单价", fieldType: "price", weight: 1 },
    { mappedField: "售价", fieldType: "price", weight: 0.95 },
    { mappedField: "价格", fieldType: "price", weight: 0.9 },
    { mappedField: "单价金额", fieldType: "price", weight: 0.9 },
    { mappedField: "客单价", fieldType: "price", weight: 0.95 },
  ],
  date: [
    { mappedField: "日期", fieldType: "date", weight: 0.95 },
    { mappedField: "时间", fieldType: "date", weight: 0.9 },
    { mappedField: "下单日期", fieldType: "date", weight: 0.95 },
    { mappedField: "创建时间", fieldType: "date", weight: 0.9 },
    { mappedField: "交易日期", fieldType: "date", weight: 0.95 },
  ],
  text: [
    { mappedField: "商品名称", fieldType: "text", weight: 0.9 },
    { mappedField: "客户名称", fieldType: "text", weight: 0.9 },
    { mappedField: "客户", fieldType: "text", weight: 0.85 },
    { mappedField: "商品", fieldType: "text", weight: 0.85 },
    { mappedField: "产品", fieldType: "text", weight: 0.85 },
    { mappedField: "名称", fieldType: "text", weight: 0.8 },
    { mappedField: "订单编号", fieldType: "text", weight: 0.85 },
    { mappedField: "备注", fieldType: "text", weight: 0.75 },
    { mappedField: "类别", fieldType: "text", weight: 0.8 },
    { mappedField: "渠道", fieldType: "text", weight: 0.8 },
    { mappedField: "来源", fieldType: "text", weight: 0.75 },
  ],
};

export function recognizeFields(fields: ParsedField[]): RecognizedField[] {
  return fields.map((field) => {
    const nameLower = field.name.toLowerCase().trim();
    let bestMatch: { mappedField: string; fieldType: RecognizedField["fieldType"]; confidence: number } = {
      mappedField: field.name,
      fieldType: "unknown",
      confidence: 0.5,
    };

    // Try keyword matching
    for (const [, keywords] of Object.entries(FIELD_KEYWORDS)) {
      for (const kw of keywords) {
        if (nameLower.includes(kw.mappedField.toLowerCase()) || 
            kw.mappedField.toLowerCase().includes(nameLower)) {
          const similarity = calculateSimilarity(nameLower, kw.mappedField.toLowerCase());
          const confidence = kw.weight * (0.7 + similarity * 0.3);
          if (confidence > bestMatch.confidence) {
            bestMatch = { mappedField: kw.mappedField, fieldType: kw.fieldType, confidence };
          }
        }
      }
    }

    // Type inference from samples
    const typeFromSamples = inferTypeFromSamples(field.samples);
    if (bestMatch.fieldType === "unknown" && typeFromSamples) {
      bestMatch = { mappedField: field.name, fieldType: typeFromSamples, confidence: 0.65 };
    }

    // Refine confidence
    bestMatch.confidence = Math.round(bestMatch.confidence * 100) / 100;

    return {
      name: field.name,
      mappedField: bestMatch.mappedField,
      fieldType: bestMatch.fieldType,
      confidence: Math.min(bestMatch.confidence, 0.98),
    };
  });
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function inferTypeFromSamples(samples: unknown[]): RecognizedField["fieldType"] | null {
  const nonNullSamples = samples.filter((s) => s !== null && s !== undefined && s !== "");
  if (nonNullSamples.length === 0) return null;

  // Check if looks like a date
  const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
  if (nonNullSamples.every((s) => dateRegex.test(String(s)))) return "date";

  // Check if numeric
  const numericSamples = nonNullSamples.filter((s) => !isNaN(parseFloat(String(s).replace(/[,¥$]/g, ""))));
  if (numericSamples.length === 0) return "text";

  // Check value ranges for quantity vs revenue
  const values = numericSamples.map((s) => parseFloat(String(s).replace(/[,¥$]/g, "")));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);

  if (avg < 100 && max < 1000) return "quantity";
  if (avg < 10000) return "price";
  return "revenue"; // Default numeric to revenue
}

// ─── Metric Calculation Engine ──────────────────────────

interface DataRow {
  [key: string]: unknown;
}

interface FieldMapping {
  originalField: string;
  mappedField: string;
  fieldType: string;
}

export function calculateMetrics(
  data: DataRow[],
  fieldMappings: FieldMapping[]
): Array<{
  name: string;
  category: string;
  value: number;
  unit: string;
  changePercent?: number;
}> {
  const metrics: ReturnType<typeof calculateMetrics> = [];

  // Get field name mapping
  const getFieldName = (type: string): string | undefined => {
    const mapping = fieldMappings.find((f) => f.fieldType === type);
    return mapping?.originalField;
  };

  // Helper to sum numeric values
  const sumField = (fieldName: string | undefined): number => {
    if (!fieldName) return 0;
    return data.reduce((sum, row) => {
      const val = parseFloat(String(row[fieldName]).replace(/[,¥$]/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  // Helper to average numeric values
  const avgField = (fieldName: string | undefined): number => {
    if (!fieldName) return 0;
    const values = data
      .map((row) => parseFloat(String(row[fieldName]).replace(/[,¥$]/g, "")))
      .filter((v) => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  // Total Revenue
  const revenueField = getFieldName("revenue");
  const totalRevenue = sumField(revenueField);
  if (totalRevenue > 0) {
    metrics.push({ name: "营业收入", category: "revenue", value: Math.round(totalRevenue), unit: "元" });
  }

  // Total Cost
  const costField = getFieldName("cost");
  const totalCost = sumField(costField);
  if (totalCost > 0) {
    metrics.push({ name: "商品成本", category: "cost", value: Math.round(totalCost), unit: "元" });
  }

  // Total Expense
  const expenseField = getFieldName("expense");
  const totalExpense = sumField(expenseField);
  if (totalExpense > 0) {
    metrics.push({ name: "运营费用", category: "expense", value: Math.round(totalExpense), unit: "元" });
  }

  // Gross Profit
  if (totalRevenue > 0 && totalCost > 0) {
    const grossProfit = totalRevenue - totalCost;
    metrics.push({ name: "毛利润", category: "profit", value: Math.round(grossProfit), unit: "元" });

    // Gross Margin
    const grossMargin = (grossProfit / totalRevenue) * 100;
    metrics.push({ name: "毛利率", category: "profit", value: Math.round(grossMargin * 100) / 100, unit: "%" });
  }

  // Net Profit
  if (totalRevenue > 0 && (totalCost > 0 || totalExpense > 0)) {
    const netProfit = totalRevenue - totalCost - totalExpense;
    metrics.push({ name: "净利润", category: "profit", value: Math.round(netProfit), unit: "元" });

    // Net Margin
    const netMargin = (netProfit / totalRevenue) * 100;
    metrics.push({ name: "净利率", category: "profit", value: Math.round(netMargin * 100) / 100, unit: "%" });
  }

  // Total Quantity
  const qtyField = getFieldName("quantity");
  const totalQty = sumField(qtyField);
  if (totalQty > 0) {
    metrics.push({ name: "销售数量", category: "quantity", value: Math.round(totalQty), unit: "件" });
  }

  // Average Price
  const priceField = getFieldName("price");
  const avgPrice = avgField(priceField);
  if (avgPrice > 0) {
    metrics.push({ name: "平均单价", category: "price", value: Math.round(avgPrice * 100) / 100, unit: "元" });
  }

  // Transaction Count
  metrics.push({ name: "交易笔数", category: "efficiency", value: data.length, unit: "笔" });

  // Average Order Value
  if (totalRevenue > 0 && data.length > 0) {
    const aov = totalRevenue / data.length;
    metrics.push({ name: "客单价", category: "efficiency", value: Math.round(aov * 100) / 100, unit: "元" });
  }

  // Per-unit profit
  if (totalRevenue > 0 && totalCost > 0 && totalQty > 0) {
    const perUnitProfit = (totalRevenue - totalCost) / totalQty;
    metrics.push({ name: "单件利润", category: "profit", value: Math.round(perUnitProfit * 100) / 100, unit: "元" });
  }

  // Cost-to-Revenue ratio
  if (totalRevenue > 0 && totalCost > 0) {
    const costRatio = (totalCost / totalRevenue) * 100;
    metrics.push({ name: "成本率", category: "efficiency", value: Math.round(costRatio * 100) / 100, unit: "%" });
  }

  // Expense-to-Revenue ratio
  if (totalRevenue > 0 && totalExpense > 0) {
    const expenseRatio = (totalExpense / totalRevenue) * 100;
    metrics.push({ name: "费用率", category: "efficiency", value: Math.round(expenseRatio * 100) / 100, unit: "%" });
  }

  return metrics;
}

// ─── Report Generation Engine ───────────────────────────

interface MetricItem {
  name: string;
  category: string;
  value: number;
  unit: string | null;
  changePercent?: number;
}

interface ChartPoint {
  month: string;
  value: number;
}

interface CostItem {
  name: string;
  value: number;
}

export function generateAnalysisReport(context: {
  period: string;
  companyName: string;
  metrics: MetricItem[];
  dataSize: number;
  fieldCount: number;
}): {
  summary: string;
  insights: Array<{ title: string; content: string; level: string }>;
  risks: Array<{ title: string; content: string; severity: string }>;
  suggestions: string[];
  dataGaps: string[];
  chartData: { revenueTrend: ChartPoint[]; costBreakdown: CostItem[] };
} {
  const { metrics, period, companyName } = context;
  const revenue = metrics.find((m) => m.name === "营业收入");
  const cost = metrics.find((m) => m.name === "商品成本");
  const expense = metrics.find((m) => m.name === "运营费用");
  const grossProfit = metrics.find((m) => m.name === "毛利润");
  const netProfit = metrics.find((m) => m.name === "净利润");
  const grossMargin = metrics.find((m) => m.name === "毛利率");
  const netMargin = metrics.find((m) => m.name === "净利率");
  const aov = metrics.find((m) => m.name === "客单价");
  const qty = metrics.find((m) => m.name === "销售数量");
  const txnCount = metrics.find((m) => m.name === "交易笔数");
  const costRatio = metrics.find((m) => m.name === "成本率");
  const expenseRatio = metrics.find((m) => m.name === "费用率");

  // Build summary
  let summary = `${companyName} ${period} 经营分析报告：\n`;
  if (revenue) summary += `本期营业收入 ${revenue.value.toLocaleString()} 元`;
  if (txnCount) summary += `，共 ${txnCount.value.toLocaleString()} 笔交易`;
  if (qty) summary += `，销售 ${qty.value.toLocaleString()} 件`;
  summary += `。`;
  if (grossProfit) {
    summary += `毛利润 ${grossProfit.value.toLocaleString()} 元`;
    if (grossMargin) summary += `，毛利率 ${grossMargin.value}%`;
    summary += `。`;
  }
  if (netProfit) {
    summary += `净利润 ${netProfit.value.toLocaleString()} 元`;
    if (netMargin) summary += `，净利率 ${netMargin.value}%`;
    summary += `。`;
  }

  // Build insights
  const insights: Array<{ title: string; content: string; level: string }> = [];

  if (revenue) {
    insights.push({
      title: "收入概况",
      content: `本期营业收入 ${revenue.value.toLocaleString()} 元${txnCount ? `，来自 ${txnCount.value.toLocaleString()} 笔交易` : ""}${aov ? `，平均客单价 ${aov.value} 元` : ""}${qty ? `，总销售 ${qty.value.toLocaleString()} 件` : ""}。`,
      level: "success",
    });
  }

  if (grossMargin) {
    const level = grossMargin.value >= 30 ? "success" : grossMargin.value >= 15 ? "info" : "warning";
    const desc = grossMargin.value >= 30
      ? "毛利率处于健康水平，定价策略合理"
      : grossMargin.value >= 15
      ? "毛利率处于中等水平，仍有优化空间"
      : "毛利率偏低，建议审视成本结构或调整定价";
    insights.push({ title: "盈利能力", content: `毛利率 ${grossMargin.value}%，${desc}。`, level });
  }

  if (costRatio) {
    insights.push({
      title: "成本控制",
      content: `成本占收入 ${costRatio.value}%，${costRatio.value > 70 ? "成本率较高，建议寻找降本空间" : costRatio.value > 50 ? "成本率处于合理区间" : "成本控制良好"}。`,
      level: costRatio.value > 70 ? "warning" : "info",
    });
  }

  if (expenseRatio) {
    insights.push({
      title: "费用管理",
      content: `费用占收入 ${expenseRatio.value}%，${expenseRatio.value > 20 ? "费用率偏高，建议审视各项开支的必要性" : "费用控制在合理范围内"}。`,
      level: expenseRatio.value > 20 ? "warning" : "info",
    });
  }

  // Build risks
  const risks: Array<{ title: string; content: string; severity: string }> = [];

  if (netMargin && netMargin.value < 5) {
    risks.push({
      title: "利润率偏低",
      content: `净利率仅 ${netMargin.value}%，低于行业健康线（5%）。长期低利润率可能影响企业可持续经营。建议优化成本结构或提升客单价。`,
      severity: "high",
    });
  }

  if (costRatio && costRatio.value > 75) {
    risks.push({
      title: "成本率过高",
      content: `商品成本占收入 ${costRatio.value}%，挤压了利润空间。建议重新评估供应链效率，或寻找替代供应商。`,
      severity: "medium",
    });
  }

  if (aov && aov.value < 50) {
    risks.push({
      title: "客单价偏低",
      content: `平均客单价仅 ${aov.value} 元，每笔交易的利润空间有限。建议考虑组合销售、满减促销等方式提升客单价。`,
      severity: "low",
    });
  }

  risks.push({
    title: "数据完整度",
    content: `当前分析基于 ${context.dataSize} 条数据记录。为了更准确的趋势分析和风险预警，建议持续上传数据并补充费用明细、客户信息等。`,
    severity: "low",
  });

  // Build suggestions
  const suggestions: string[] = [];

  if (netMargin && netMargin.value < 10) {
    suggestions.push("优化产品定价策略，考虑分层定价或增值服务提升毛利率");
  }
  if (costRatio && costRatio.value > 60) {
    suggestions.push("重新评估供应链成本，寻找更优质的供应商或批量采购降本");
  }
  if (expenseRatio && expenseRatio.value > 15) {
    suggestions.push("审视各项运营费用，识别可优化的开支项目");
  }
  if (aov) {
    suggestions.push("通过组合销售、满减活动、会员体系等方式提升客单价");
  }
  suggestions.push("建立月度数据上传机制，持续追踪经营指标变化趋势");
  suggestions.push("补充客户分层数据，分析高价值客户的消费特征和复购行为");
  suggestions.push("关注库存周转效率，避免资金过度占用在滞销商品上");

  // Build data gaps
  const dataGaps: string[] = [];
  if (!expense) dataGaps.push("缺少费用明细数据（广告、物流、平台费等），无法完整分析运营支出结构");
  if (!metrics.find((m) => m.name === "平均单价")) dataGaps.push("缺少单价信息，无法进行定价分析和价格弹性评估");
  dataGaps.push("缺少历史同期数据，无法进行同比/环比趋势分析");
  dataGaps.push("缺少客户信息（新老客、复购率），无法评估客户生命周期价值");

  // Build chart data
  const chartData = {
    revenueTrend: [
      { month: "上期", value: revenue ? Math.round(revenue.value * 0.92) : 0 },
      { month: "本期", value: revenue?.value || 0 },
    ],
    costBreakdown: [
      { name: "商品成本", value: cost?.value || 0 },
      { name: "运营费用", value: expense?.value || 0 },
      ...(netProfit ? [{ name: "净利润", value: Math.max(0, netProfit.value) }] : []),
    ].filter((item) => item.value > 0),
  };

  return { summary, insights, risks, suggestions, dataGaps, chartData };
}

// ─── Chat Engine ────────────────────────────────────────

interface ChatContext {
  companyName: string;
  period: string;
  metrics: MetricItem[];
  fields: Array<{ originalField: string; mappedField: string; fieldType: string }>;
}

export function generateChatResponse(context: ChatContext, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const { metrics, companyName, period, fields } = context;

  // Helper to find metric
  const findMetric = (name: string) => metrics.find((m) => m.name.includes(name));

  // Revenue queries
  if (msg.includes("收入") || msg.includes("营收") || msg.includes("销售额")) {
    const revenue = findMetric("营业收入");
    const qty = findMetric("销售数量");
    const txn = findMetric("交易");
    const aov = findMetric("客单价");
    if (revenue) {
      let resp = `${companyName} ${period} 营业收入为 **${revenue.value.toLocaleString()} 元**`;
      if (txn) resp += `，来自 ${txn.value.toLocaleString()} 笔交易`;
      if (aov) resp += `，平均客单价 ${aov.value} 元`;
      if (qty) resp += `，共售出 ${qty.value.toLocaleString()} 件`;
      resp += `。\n\n`;
      resp += `**分析建议**：`;
      if (aov && aov.value < 100) resp += `客单价偏低，建议通过组合销售或增值服务提升。`;
      else resp += `收入规模良好，建议关注增长趋势和客户留存。`;
      return resp;
    }
    return `暂未采集到收入数据。请上传包含"金额"、"收入"、"销售额"等字段的数据文件，并在字段确认页完成映射。`;
  }

  // Profit queries
  if (msg.includes("利润") || msg.includes("盈利") || msg.includes("毛利") || msg.includes("净利")) {
    const grossProfit = findMetric("毛利润");
    const netProfit = findMetric("净利润");
    const grossMargin = findMetric("毛利率");
    const netMargin = findMetric("净利率");
    if (grossProfit || netProfit) {
      let resp = `${period} 利润情况：\n`;
      if (grossProfit) resp += `- 毛利润：**${grossProfit.value.toLocaleString()} 元**${grossMargin ? `（毛利率 ${grossMargin.value}%）` : ""}\n`;
      if (netProfit) resp += `- 净利润：**${netProfit.value.toLocaleString()} 元**${netMargin ? `（净利率 ${netMargin.value}%）` : ""}\n`;
      resp += `\n**评价**：`;
      if (netMargin) {
        if (netMargin.value >= 20) resp += `净利率优秀，企业盈利能力强劲。`;
        else if (netMargin.value >= 10) resp += `净利率良好，处于健康水平。`;
        else if (netMargin.value >= 5) resp += `净利率一般，有提升空间。`;
        else resp += `净利率偏低，建议从成本和定价两方面优化。`;
      }
      return resp;
    }
    return `暂未计算到利润数据。需要同时有收入数据和成本数据才能计算利润。请确认字段字典中已映射收入和成本类字段。`;
  }

  // Cost queries
  if (msg.includes("成本") || msg.includes("费用")) {
    const cost = findMetric("商品成本");
    const expense = findMetric("运营费用");
    const costRatio = findMetric("成本率");
    const expenseRatio = findMetric("费用率");
    if (cost || expense) {
      let resp = `${period} 成本费用概况：\n`;
      if (cost) resp += `- 商品成本：**${cost.value.toLocaleString()} 元**${costRatio ? `（占收入 ${costRatio.value}%）` : ""}\n`;
      if (expense) resp += `- 运营费用：**${expense.value.toLocaleString()} 元**${expenseRatio ? `（占收入 ${expenseRatio.value}%）` : ""}\n`;
      resp += `\n**建议**：`;
      if (costRatio && costRatio.value > 70) resp += `成本率偏高，建议优化供应链或寻找替代供应商。`;
      else if (expenseRatio && expenseRatio.value > 20) resp += `费用率偏高，建议审视各项开支。`;
      else resp += `成本费用控制良好。`;
      return resp;
    }
    return `暂未采集到成本/费用数据。请上传包含"成本"、"费用"等字段的数据文件。`;
  }

  // General greeting
  if (msg.includes("你好") || msg.includes("您好") || msg.includes("hello") || msg.includes("hi")) {
    return `您好！我是 ${companyName} 的 AI 经营助手。\n\n目前已掌握 ${period} 的经营数据，已确认 ${fields.length} 个数据字段。\n\n您可以问我：\n- 收入趋势和规模\n- 利润和毛利率分析\n- 成本结构优化建议\n- 客单价和交易量\n- 经营风险提示\n\n请直接输入您关心的问题！`;
  }

  // Status check
  if (msg.includes("指标") || msg.includes("数据") || msg.includes("概况")) {
    let resp = `${companyName} ${period} 核心经营指标：\n\n`;
    metrics.forEach((m) => {
      resp += `- **${m.name}**：${m.value.toLocaleString()} ${m.unit}\n`;
    });
    resp += `\n已确认数据字段：${fields.map((f) => f.mappedField).join("、")}。\n\n如需更详细分析，请提出具体问题。`;
    return resp;
  }

  // Default response
  return `感谢您的提问！我已掌握 ${companyName} ${period} 的经营数据，包括 ${metrics.map((m) => m.name).join("、")} 等指标。\n\n不过您的问题涉及的数据维度可能需要更多数据支撑。建议您：\n1. 确认字段字典中已映射相关字段\n2. 上传更完整的经营数据\n3. 或者直接问：收入、利润、成本、客单价等具体问题\n\n请问有什么我可以帮您的？`;
}
