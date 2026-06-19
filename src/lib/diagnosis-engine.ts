export type DiagnosisDomain = "revenue" | "expense" | "profit" | "cashflow";
export type Tone = "good" | "watch" | "risk";
export type RiskLevel = "高" | "中" | "低";
export type TaskPriority = "高" | "中" | "低";

export interface MetricComparison {
  value: number;
  previous: number;
  budget?: number;
  historicalAverage?: number;
}

export interface BusinessSnapshot {
  company: string;
  period: string;
  revenue: MetricComparison;
  expense: MetricComparison;
  grossMargin: MetricComparison;
  netProfit: MetricComparison;
  netMargin: MetricComparison;
  cashflow: MetricComparison;
  receivableDays: MetricComparison;
  marketingExpense: MetricComparison;
  newCustomerRevenue: MetricComparison;
  repeatRate: MetricComparison;
}

export interface DiagnosisBlock {
  id: DiagnosisDomain;
  title: string;
  status: string;
  verdict: string;
  metric: string;
  compare: string;
  tone: Tone;
  evidenceIds: string[];
}

export interface RiskSignal {
  id: string;
  name: string;
  level: RiskLevel;
  rule: string;
  description: string;
  relatedMetrics: string[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  value: string;
  note: string;
}

export interface ActionTask {
  id: string;
  title: string;
  type: string;
  priority: TaskPriority;
  owner: string;
  due: string;
  reason: string;
  metrics: string[];
  expectedImpact: string;
  status: "待处理" | "进行中" | "已完成";
}

export interface CommandCenterModel {
  summary: {
    company: string;
    period: string;
    conclusion: string;
    reasons: string[];
    healthScore: number;
    confidence: number;
  };
  metrics: Array<{ label: string; value: string; change: string; tone: Tone }>;
  diagnosisBlocks: DiagnosisBlock[];
  riskSignals: RiskSignal[];
  evidenceItems: EvidenceItem[];
  actionTasks: ActionTask[];
}

function changePercent(metric: MetricComparison): number {
  if (metric.previous === 0) return 0;
  return ((metric.value - metric.previous) / metric.previous) * 100;
}

function formatMoney(value: number): string {
  return `¥${Math.round(value).toLocaleString()}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatPoint(value: number): string {
  return `${value.toFixed(1)}%`;
}

function toneFromChange(value: number, goodWhenPositive = true): Tone {
  if (goodWhenPositive) {
    if (value >= 5) return "good";
    if (value <= -5) return "risk";
    return "watch";
  }
  if (value <= -5) return "good";
  if (value >= 10) return "risk";
  return "watch";
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function evaluateBusinessDiagnosis(snapshot: BusinessSnapshot): CommandCenterModel {
  const revenueChange = changePercent(snapshot.revenue);
  const expenseChange = changePercent(snapshot.expense);
  const profitChange = changePercent(snapshot.netProfit);
  const cashflowChange = changePercent(snapshot.cashflow);
  const marketingChange = changePercent(snapshot.marketingExpense);
  const newCustomerChange = changePercent(snapshot.newCustomerRevenue);
  const receivableDaysChange = snapshot.receivableDays.value - snapshot.receivableDays.previous;
  const repeatRateGap = snapshot.repeatRate.budget ? snapshot.repeatRate.budget - snapshot.repeatRate.value : 0;
  const expenseRate = snapshot.expense.value / snapshot.revenue.value * 100;

  const evidenceItems: EvidenceItem[] = [
    {
      id: "ev-revenue-growth",
      title: "收入环比变化",
      source: "销售数据 / 营业收入",
      value: formatPercent(revenueChange),
      note: `本期收入 ${formatMoney(snapshot.revenue.value)}，上期 ${formatMoney(snapshot.revenue.previous)}。`,
    },
    {
      id: "ev-new-customer",
      title: "新客贡献变化",
      source: "客户结构 / 新客收入",
      value: formatPercent(newCustomerChange),
      note: "新客收入增长快于整体收入，但需要复购承接。",
    },
    {
      id: "ev-expense-growth",
      title: "费用环比变化",
      source: "费用数据 / 运营费用",
      value: formatPercent(expenseChange),
      note: `本期费用 ${formatMoney(snapshot.expense.value)}，费用率 ${expenseRate.toFixed(1)}%。`,
    },
    {
      id: "ev-marketing",
      title: "营销投放变化",
      source: "广告投放 / 渠道费用",
      value: formatPercent(marketingChange),
      note: "营销费用增长需要与线索、成交和复购一起验证 ROI。",
    },
    {
      id: "ev-net-profit",
      title: "净利润变化",
      source: "利润计算 / 净利润",
      value: formatPercent(profitChange),
      note: `净利润 ${formatMoney(snapshot.netProfit.value)}，净利率 ${snapshot.netMargin.value.toFixed(1)}%。`,
    },
    {
      id: "ev-cashflow",
      title: "现金流净额变化",
      source: "银行流水 / 实收金额",
      value: formatPercent(cashflowChange),
      note: `现金流净额 ${formatMoney(snapshot.cashflow.value)}，弱于收入变化时需关注回款。`,
    },
    {
      id: "ev-receivable",
      title: "应收周转变化",
      source: "应收账款 / 回款周期",
      value: `${snapshot.receivableDays.value} 天`,
      note: `回款周期较上期变化 ${receivableDaysChange >= 0 ? "+" : ""}${receivableDaysChange} 天。`,
    },
    {
      id: "ev-repeat-rate",
      title: "新客复购缺口",
      source: "客户生命周期 / 复购率",
      value: `${snapshot.repeatRate.value}%`,
      note: snapshot.repeatRate.budget
        ? `目标复购率 ${snapshot.repeatRate.budget}%，当前缺口 ${repeatRateGap.toFixed(1)}pp。`
        : "缺少复购目标时，建议先建立客户复购基准。",
    },
  ];

  const riskSignals: RiskSignal[] = [];
  const actionTasks: ActionTask[] = [];

  if (revenueChange <= -15) {
    riskSignals.push({
      id: "risk-revenue-drop",
      name: "收入下降预警",
      level: "高",
      rule: "收入环比下降超过 15%",
      description: "收入短期下滑明显，需要拆解产品、客户、渠道、区域和订单数量。",
      relatedMetrics: ["营业收入", "订单数", "客单价", "成交率"],
    });
    actionTasks.push({
      id: "task-revenue-drop",
      title: "拆解收入下降来源",
      type: "收入诊断",
      priority: "高",
      owner: "经营负责人",
      due: "本周五",
      reason: `收入环比 ${formatPercent(revenueChange)}，触发收入下降预警。`,
      metrics: ["营业收入", "订单数", "客单价"],
      expectedImpact: "定位下滑来源并形成渠道/产品修复动作",
      status: "待处理",
    });
  }

  if (expenseChange > 20 && expenseChange > revenueChange) {
    riskSignals.push({
      id: "risk-expense-growth",
      name: "费用异常增长",
      level: "中",
      rule: "费用环比增长超过 20%，且收入增长低于费用增长",
      description: "费用增长没有带来等比例收入增长，建议排查营销、人工、采购和交付费用。",
      relatedMetrics: ["运营费用", "费用率", "营业收入"],
    });
  } else if (expenseChange > revenueChange && expenseChange > 0) {
    riskSignals.push({
      id: "risk-expense-faster-than-revenue",
      name: "费用增长快于收入",
      level: "中",
      rule: "费用环比增长幅度大于收入增长幅度",
      description: "收入增长被部分费用增长抵消，需要复盘费用结构和投入产出。",
      relatedMetrics: ["运营费用", "费用率", "营业收入"],
    });
  }

  if (marketingChange > revenueChange && marketingChange > 15) {
    riskSignals.push({
      id: "risk-marketing-efficiency",
      name: "营销费用低效预警",
      level: "中",
      rule: "营销费用增长，但收入未同步增长",
      description: "营销投入产出偏低，建议停止低效渠道并复盘客户质量。",
      relatedMetrics: ["营销费用", "渠道收入", "成交率", "复购率"],
    });
    actionTasks.push({
      id: "task-marketing-roi",
      title: "复盘近 30 天市场投放 ROI",
      type: "费用优化",
      priority: "高",
      owner: "市场负责人",
      due: "本周五",
      reason: `营销费用 ${formatPercent(marketingChange)}，高于收入 ${formatPercent(revenueChange)}。`,
      metrics: ["营销费用", "费用率", "渠道收入"],
      expectedImpact: "降低低效渠道消耗，费用率下降 0.8-1.2pp",
      status: "待处理",
    });
  }

  if (revenueChange > 0 && snapshot.netMargin.value < snapshot.netMargin.previous) {
    riskSignals.push({
      id: "risk-profit-quality",
      name: "利润质量预警",
      level: "中",
      rule: "收入增长，但净利率下降",
      description: "当前收入增长质量不高，建议检查低毛利订单、成本上涨和费用投放效率。",
      relatedMetrics: ["营业收入", "净利率", "毛利率", "运营费用"],
    });
  }

  if (revenueChange > 0 && cashflowChange < 0) {
    riskSignals.push({
      id: "risk-cashflow",
      name: "现金流风险",
      level: "高",
      rule: "收入增长但现金流净额下降",
      description: "账面收入增长，但现金回收变差，建议跟进应收款并收紧账期。",
      relatedMetrics: ["现金流净额", "应收款", "回款率"],
    });
    actionTasks.push({
      id: "task-receivable",
      title: "优先跟进大额应收款",
      type: "现金流改善",
      priority: "中",
      owner: "财务负责人",
      due: "下周三",
      reason: `现金流净额 ${formatPercent(cashflowChange)}，与收入增长背离。`,
      metrics: ["应收款", "现金流净额", "回款周期"],
      expectedImpact: "缩短回款周期 4-7 天",
      status: "待处理",
    });
  }

  if (snapshot.repeatRate.budget && snapshot.repeatRate.value < snapshot.repeatRate.budget) {
    riskSignals.push({
      id: "risk-retention",
      name: "新客复购偏低",
      level: "中",
      rule: "新客复购率低于目标值",
      description: "收入增长对新客依赖较高，增长可持续性需要验证。",
      relatedMetrics: ["新客收入", "复购率", "复购收入"],
    });
    actionTasks.push({
      id: "task-retention",
      title: "建立新客二次触达名单",
      type: "收入增长",
      priority: "高",
      owner: "运营负责人",
      due: "本周五",
      reason: `新客复购率 ${snapshot.repeatRate.value}%，低于目标 ${snapshot.repeatRate.budget}%。`,
      metrics: ["新客收入", "复购率", "复购收入"],
      expectedImpact: "新客复购率提升 3-5pp",
      status: "进行中",
    });
  }

  const expenseTone = expenseChange > revenueChange ? "watch" : "good";
  const cashflowTone = cashflowChange < 0 && revenueChange > 0 ? "risk" : toneFromChange(cashflowChange);
  const revenueTone = toneFromChange(revenueChange);
  const profitTone = toneFromChange(profitChange);

  const diagnosisBlocks: DiagnosisBlock[] = [
    {
      id: "revenue",
      title: "收入诊断",
      status: revenueChange >= 0 ? "增长有效" : "收入承压",
      verdict: revenueChange >= 0
        ? "收入增长主要来自新客订单和客单价提升，但复购收入占比仍需验证。"
        : "收入出现下滑，需要拆解产品、客户、渠道和订单数量变化。",
      metric: formatPercent(revenueChange),
      compare: "环比收入增长",
      tone: revenueTone,
      evidenceIds: ["ev-revenue-growth", "ev-new-customer", "ev-repeat-rate"],
    },
    {
      id: "expense",
      title: "费用诊断",
      status: expenseTone === "good" ? "费用可控" : "需要关注",
      verdict: expenseTone === "good"
        ? "费用增长低于收入增长，当前投入产出保持健康。"
        : "费用增长快于收入增长，营销费用 ROI 需要复盘。",
      metric: formatPercent(expenseChange),
      compare: "费用环比增长",
      tone: expenseTone,
      evidenceIds: ["ev-expense-growth", "ev-marketing"],
    },
    {
      id: "profit",
      title: "利润诊断",
      status: profitChange >= 0 ? "利润改善" : "利润下滑",
      verdict: profitChange >= 0
        ? "毛利率改善支撑净利润增长，但需要持续观察费用率是否侵蚀利润。"
        : "利润下降需要优先检查成本上涨、费用超支和低毛利订单。",
      metric: formatPoint(snapshot.netMargin.value),
      compare: "净利率",
      tone: profitTone,
      evidenceIds: ["ev-net-profit", "ev-expense-growth"],
    },
    {
      id: "cashflow",
      title: "现金流诊断",
      status: cashflowTone === "risk" ? "存在风险" : "现金健康",
      verdict: cashflowTone === "risk"
        ? "账面收入增长，但实收现金增长弱于收入，应收周转放慢。"
        : "现金流与收入变化基本匹配，回款质量保持稳定。",
      metric: formatPercent(cashflowChange),
      compare: "现金流净额变化",
      tone: cashflowTone,
      evidenceIds: ["ev-cashflow", "ev-receivable"],
    },
  ];

  const conclusion = riskSignals.some((risk) => risk.level === "高")
    ? "收入增长，利润改善，但费用率上升且现金流质量需要关注。"
    : "经营状态整体健康，收入与利润改善，费用和现金流仍需持续追踪。";

  const healthScore = Math.max(58, Math.min(94, Math.round(
    82
    + Math.max(-8, Math.min(8, revenueChange / 2))
    + Math.max(-8, Math.min(8, profitChange / 3))
    - Math.max(0, expenseChange - revenueChange) / 3
    + Math.min(0, cashflowChange) / 2
    - riskSignals.filter((risk) => risk.level === "高").length * 5,
  )));

  return {
    summary: {
      company: snapshot.company,
      period: snapshot.period,
      conclusion,
      reasons: [
        revenueChange >= 0 ? "新客消费提升带动收入增长" : "订单或客单价变化导致收入承压",
        profitChange >= 0 ? "毛利率改善支撑净利润增长" : "成本费用挤压利润空间",
        expenseChange > revenueChange ? "市场投放增加导致费用率上升" : "费用增长低于收入增长",
        snapshot.repeatRate.budget && snapshot.repeatRate.value < snapshot.repeatRate.budget
          ? "新客复购偏低，后续增长可持续性存在风险"
          : "客户复购表现接近目标",
      ],
      healthScore,
      confidence: 88,
    },
    metrics: [
      { label: "营业收入", value: formatMoney(snapshot.revenue.value), change: formatPercent(revenueChange), tone: revenueTone },
      { label: "运营费用", value: formatMoney(snapshot.expense.value), change: formatPercent(expenseChange), tone: expenseTone },
      { label: "净利润", value: formatMoney(snapshot.netProfit.value), change: formatPercent(profitChange), tone: profitTone },
      { label: "现金流净额", value: formatMoney(snapshot.cashflow.value), change: formatPercent(cashflowChange), tone: cashflowTone },
    ],
    diagnosisBlocks,
    riskSignals: uniqueById(riskSignals),
    evidenceItems,
    actionTasks: uniqueById(actionTasks),
  };
}
