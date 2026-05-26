import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DemoContextType {
  isDemo: boolean;
  demoCompany: { id: number; name: string } | null;
  startDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  demoCompany: null,
  startDemo: () => {},
  exitDemo: () => {},
});

export function useDemo() {
  return useContext(DemoContext);
}

// Demo test data
export const DEMO_COMPANY = {
  id: 999999,
  name: "星辰科技有限公司",
  industry: "电商零售",
  businessType: "有限责任公司",
  goals: "growth,profit",
};

export const DEMO_METRICS = [
  { id: 1, name: "营业收入", category: "revenue", value: "2846500", unit: "元", changePercent: "12.5" },
  { id: 2, name: "商品成本", category: "cost", value: "1565575", unit: "元", changePercent: "8.3" },
  { id: 3, name: "运营费用", category: "expense", value: "426975", unit: "元", changePercent: "-2.1" },
  { id: 4, name: "毛利润", category: "profit", value: "1280925", unit: "元", changePercent: "18.7" },
  { id: 5, name: "毛利率", category: "profit", value: "45.0", unit: "%", changePercent: "2.8" },
  { id: 6, name: "净利润", category: "profit", value: "853950", unit: "元", changePercent: "22.4" },
  { id: 7, name: "净利率", category: "profit", value: "30.0", unit: "%", changePercent: "4.2" },
  { id: 8, name: "销售数量", category: "quantity", value: "15860", unit: "件", changePercent: "15.2" },
  { id: 9, name: "交易笔数", category: "efficiency", value: "4260", unit: "笔", changePercent: "9.8" },
  { id: 10, name: "客单价", category: "efficiency", value: "668.0", unit: "元", changePercent: "2.5" },
  { id: 11, name: "平均单价", category: "price", value: "179.5", unit: "元", changePercent: "-1.8" },
  { id: 12, name: "单件利润", category: "profit", value: "53.8", unit: "元", changePercent: "6.2" },
  { id: 13, name: "成本率", category: "efficiency", value: "55.0", unit: "%", changePercent: "-2.0" },
  { id: 14, name: "费用率", category: "efficiency", value: "15.0", unit: "%", changePercent: "-2.2" },
];

export const DEMO_REPORT = {
  id: 1,
  periodId: 1,
  companyId: 999999,
  type: "monthly",
  title: "2026年4月 经营分析报告",
  summary: "星辰科技有限公司 2026年4月经营分析：本期营业收入 2,846,500 元，共 4,260 笔交易，销售 15,860 件。毛利润 1,280,925 元，毛利率 45.0%。净利润 853,950 元，净利率 30.0%。整体经营状况良好，盈利能力强劲。",
  insights: [
    { title: "收入概况", content: "本期营业收入 2,846,500 元，来自 4,260 笔交易，平均客单价 668 元，共售出 15,860 件。收入环比增长 12.5%，增长势头良好。", level: "success" },
    { title: "盈利能力", content: "毛利率 45.0%，净利率 30.0%，盈利能力处于优秀水平。定价策略合理，成本控制良好。", level: "success" },
    { title: "成本控制", content: "成本占收入 55.0%，处于合理区间。费用率 15.0%，费用控制优秀。", level: "success" },
    { title: "费用管理", content: "费用占收入 15.0%，费用控制在合理范围内。运营效率持续提升。", level: "info" },
  ],
  risks: [
    { title: "客单价波动", content: "平均客单价 668 元，环比变化 2.5%。需关注客户消费行为变化趋势。", severity: "low" },
    { title: "数据完整度", content: "当前分析基于 4,260 笔交易数据。建议补充客户分层数据和历史同期对比数据。", severity: "low" },
  ],
  suggestions: [
    "继续优化产品结构，提升高毛利品类销售占比",
    "建立客户分层体系，针对不同价值客户制定差异化策略",
    "关注费用率变化趋势，持续优化运营效率",
    "补充历史数据建立趋势分析能力",
    "探索新渠道获客，保持增长势头",
  ],
  dataGaps: [
    "缺少历史同期数据，无法进行同比分析",
    "缺少客户分层信息（新老客、复购率），无法评估客户生命周期价值",
    "缺少库存数据，无法分析周转率和滞销风险",
    "缺少营销渠道数据，无法评估各渠道ROI",
  ],
  chartData: {
    revenueTrend: [
      { month: "2025-12", value: 2100000 },
      { month: "2026-01", value: 2350000 },
      { month: "2026-02", value: 2480000 },
      { month: "2026-03", value: 2530000 },
      { month: "2026-04", value: 2846500 },
    ],
    costBreakdown: [
      { name: "商品成本", value: 1565575 },
      { name: "运营费用", value: 426975 },
      { name: "净利润", value: 853950 },
    ],
  },
  status: "completed",
};

export const DEMO_FIELDS = [
  { id: 1, originalField: "订单金额", mappedField: "营业收入", fieldType: "revenue", confidence: "0.95", isConfirmed: "confirmed" },
  { id: 2, originalField: "商品成本", mappedField: "商品成本", fieldType: "cost", confidence: "0.98", isConfirmed: "confirmed" },
  { id: 3, originalField: "推广费用", mappedField: "广告费用", fieldType: "expense", confidence: "0.92", isConfirmed: "confirmed" },
  { id: 4, originalField: "物流费用", mappedField: "运费", fieldType: "expense", confidence: "0.90", isConfirmed: "confirmed" },
  { id: 5, originalField: "订单日期", mappedField: "交易日期", fieldType: "date", confidence: "0.96", isConfirmed: "confirmed" },
  { id: 6, originalField: "商品名称", mappedField: "商品", fieldType: "text", confidence: "0.93", isConfirmed: "confirmed" },
  { id: 7, originalField: "购买数量", mappedField: "数量", fieldType: "quantity", confidence: "0.94", isConfirmed: "confirmed" },
  { id: 8, originalField: "客户名称", mappedField: "客户", fieldType: "text", confidence: "0.88", isConfirmed: "confirmed" },
  { id: 9, originalField: "单价", mappedField: "单价", fieldType: "price", confidence: "0.97", isConfirmed: "confirmed" },
  { id: 10, originalField: "备注", mappedField: "备注", fieldType: "text", confidence: "0.75", isConfirmed: "pending" },
];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => {
    return sessionStorage.getItem("demo_mode") === "true";
  });
  const [demoCompany] = useState(DEMO_COMPANY);

  const startDemo = useCallback(() => {
    sessionStorage.setItem("demo_mode", "true");
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem("demo_mode");
    setIsDemo(false);
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoCompany, startDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
