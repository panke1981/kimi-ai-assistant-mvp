import {
  evaluateBusinessDiagnosis,
  type BusinessSnapshot,
  type DiagnosisDomain,
} from "@/lib/diagnosis-engine";

export type { ActionTask, DiagnosisBlock, EvidenceItem, RiskSignal } from "@/lib/diagnosis-engine";
export type { DiagnosisDomain };

export const demoBusinessSnapshot: BusinessSnapshot = {
  company: "星辰科技有限公司",
  period: "2026-04",
  revenue: { value: 2846500, previous: 2530000, budget: 2700000, historicalAverage: 2450000 },
  expense: { value: 426975, previous: 361144, budget: 390000, historicalAverage: 372000 },
  grossMargin: { value: 45, previous: 43.8, budget: 44, historicalAverage: 42.5 },
  netProfit: { value: 853950, previous: 697670, budget: 780000, historicalAverage: 705000 },
  netMargin: { value: 30, previous: 27.6, budget: 28, historicalAverage: 26.8 },
  cashflow: { value: 612300, previous: 656950, budget: 680000, historicalAverage: 635000 },
  receivableDays: { value: 42, previous: 36, budget: 35, historicalAverage: 37 },
  marketingExpense: { value: 168000, previous: 132900, budget: 145000, historicalAverage: 138000 },
  newCustomerRevenue: { value: 1040000, previous: 877000, budget: 960000, historicalAverage: 820000 },
  repeatRate: { value: 14, previous: 16.5, budget: 21, historicalAverage: 18.2 },
};

export const commandCenterModel = evaluateBusinessDiagnosis(demoBusinessSnapshot);

export const commandCenterSummary = commandCenterModel.summary;
export const commandCenterMetrics = commandCenterModel.metrics;
export const diagnosisBlocks = commandCenterModel.diagnosisBlocks;
export const riskSignals = commandCenterModel.riskSignals;
export const evidenceItems = commandCenterModel.evidenceItems;
export const actionTasks = commandCenterModel.actionTasks;

export const revenueExpenseTrend = [
  { month: "12月", revenue: 210, expense: 34, profit: 58 },
  { month: "1月", revenue: 235, expense: 36, profit: 66 },
  { month: "2月", revenue: 248, expense: 39, profit: 71 },
  { month: "3月", revenue: Math.round(demoBusinessSnapshot.revenue.previous / 10000), expense: 36, profit: 70 },
  {
    month: "4月",
    revenue: Math.round(demoBusinessSnapshot.revenue.value / 10000),
    expense: Math.round(demoBusinessSnapshot.expense.value / 10000),
    profit: Math.round(demoBusinessSnapshot.netProfit.value / 10000),
  },
];
