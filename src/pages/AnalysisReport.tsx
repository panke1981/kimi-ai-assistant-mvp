import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useDemo, DEMO_COMPANY, DEMO_METRICS, DEMO_REPORT } from "@/components/DemoProvider";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, AlertTriangle, Lightbulb, Info, FileText, Loader2,
} from "lucide-react";

const COLORS = ["#A78BFA", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const severityColors: Record<string, { border: string; text: string }> = {
  high:   { border: "#EF4444", text: "#F87171" },
  medium: { border: "#F59E0B", text: "#FBBF24" },
  low:    { border: "#FBBF24", text: "#FDE68A" },
};

// ── Types ───────────────────────────────────────────────
interface ReportItem {
  id: number;
  periodId: number;
  companyId: number;
  type: string;
  title: string;
  summary: string | null;
  status: string | null;
  chartData: unknown;
  insights: unknown;
  risks: unknown;
  suggestions: unknown;
  dataGaps: unknown;
  createdAt?: Date | string | null;
}

interface InsightItem {
  title: string;
  content: string;
  level?: string;
  severity?: string;
}

interface ChartPoint {
  month: string;
  value: number;
}

interface CostItem {
  name: string;
  value: number;
}

function isInsightArray(v: unknown): v is InsightItem[] {
  return Array.isArray(v) && v.every((i) => i !== null && typeof i === "object" && "title" in i && "content" in i);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}

function isChartData(v: unknown): v is { revenueTrend: ChartPoint[]; costBreakdown: CostItem[] } {
  return v !== null && typeof v === "object" && v !== undefined;
}

export default function AnalysisReport() {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const { isDemo } = useDemo();
  const utils = trpc.useUtils();

  // Demo data
  const demoCompanies = isDemo ? [{ id: DEMO_COMPANY.id, name: DEMO_COMPANY.name, industry: DEMO_COMPANY.industry, businessType: DEMO_COMPANY.businessType, goals: DEMO_COMPANY.goals, userId: 0, createdAt: new Date(), updatedAt: new Date() }] : undefined;
  const demoPeriods = isDemo ? [{ id: 1, companyId: DEMO_COMPANY.id, label: "2026-04", type: "month" as const, status: "completed" as const, createdAt: new Date(), updatedAt: new Date() }] : undefined;
  const demoReports = isDemo ? [DEMO_REPORT] : undefined;
  const demoMetrics = isDemo ? DEMO_METRICS : undefined;

  const { data: companiesData } = trpc.company.list.useQuery(undefined, { enabled: !isDemo });
  const { data: periodsData } = trpc.period.list.useQuery(
    { companyId: selectedCompany ?? 0 },
    { enabled: !!selectedCompany && !isDemo }
  );
  const { data: reportsData } = trpc.report.list.useQuery(
    { companyId: selectedCompany ?? 0 },
    { enabled: !!selectedCompany && !isDemo }
  );
  const { data: metricsData } = trpc.metric.list.useQuery(
    { periodId: selectedReport?.periodId ?? periodsData?.[0]?.id ?? 0 },
    { enabled: !!(selectedReport?.periodId || periodsData?.[0]?.id) && !isDemo }
  );

  const companies = isDemo ? demoCompanies : companiesData;
  const periods = isDemo ? demoPeriods : periodsData;
  const reports = isDemo ? demoReports : reportsData;
  const metrics = isDemo ? demoMetrics : metricsData;

  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompany) setSelectedCompany(companies[0].id);
  }, [companies, selectedCompany]);

  useEffect(() => {
    if (reports && reports.length > 0 && !selectedReport) setSelectedReport(reports[0]);
  }, [reports, selectedReport]);

  const generateReport = trpc.parse.generateReport.useMutation({
    onSuccess: () => utils.report.list.invalidate({ companyId: selectedCompany ?? 0 }),
  });

  const chartData = isChartData(selectedReport?.chartData) ? selectedReport.chartData as { revenueTrend: ChartPoint[]; costBreakdown: CostItem[] } : { revenueTrend: [], costBreakdown: [] };
  const revenueData: ChartPoint[] = chartData.revenueTrend || [];
  const costData: CostItem[] = chartData.costBreakdown || [];

  const insights: InsightItem[] = isInsightArray(selectedReport?.insights) ? selectedReport.insights : [];
  const risks: InsightItem[] = isInsightArray(selectedReport?.risks) ? selectedReport.risks : [];
  const suggestions: string[] = isStringArray(selectedReport?.suggestions) ? selectedReport.suggestions : [];
  const dataGaps: string[] = isStringArray(selectedReport?.dataGaps) ? selectedReport.dataGaps : [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light mb-1" style={{ color: "var(--text-primary)" }}>经营分析报告</h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {selectedReport ? selectedReport.title : "AI 生成的深度经营分析报告"}
            </p>
          </div>
          {companies && companies.length > 0 && periods && periods.length > 0 && (
            <button
              onClick={() => generateReport.mutate({
                periodId: periods[0].id,
                companyId: selectedCompany!,
                companyName: companies?.find(c => c.id === selectedCompany)?.name || "企业",
                period: periods[0].label,
              })}
              disabled={generateReport.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--brand)", color: "#050505" }}
            >
              {generateReport.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {generateReport.isPending ? "生成中..." : "生成新报告"}
            </button>
          )}
        </div>
      </div>

      {reports && reports.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all border"
              style={selectedReport?.id === r.id
                ? { background: "rgba(167, 139, 250, 0.08)", color: "var(--brand)", borderColor: "rgba(167, 139, 250, 0.3)" }
                : { color: "var(--text-muted)", borderColor: "var(--border-default)" }
              }
            >
              {r.title}
              {r.status === "generating" && <Loader2 size={10} className="inline ml-1.5 animate-spin" />}
            </button>
          ))}
        </div>
      )}

      {selectedReport?.status === "generating" ? (
        <div className="glass-panel rounded-xl p-16 text-center">
          <Loader2 size={32} className="mx-auto mb-4 animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-lg mb-2" style={{ color: "var(--text-primary)" }}>AI 正在分析经营数据...</p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>这可能需要几秒钟，AI 正在深度解析您的业务数据</p>
        </div>
      ) : selectedReport ? (
        <>
          <div className="glass-panel rounded-xl p-6 mb-6 border-l-2" style={{ borderLeftColor: "var(--brand)" }}>
            <h2 className="text-sm mb-3 flex items-center gap-2" style={{ color: "var(--brand)" }}>
              <Info size={14} /> AI 经营总结
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selectedReport.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>收入趋势</h3>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={{ stroke: "var(--border-default)" }} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={{ stroke: "var(--border-default)" }}
                    tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number | string) => [`¥${Number(value).toLocaleString()}`, "收入"]} />
                  <Area type="monotone" dataKey="value" stroke="#A78BFA" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs" style={{ color: "var(--text-disabled)" }}>上传多期数据后可查看趋势</p>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>成本结构</h3>
              {costData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                  <Pie data={costData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                    {costData.map((_e: CostItem, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number | string, name: string) => [`¥${Number(value).toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {costData.map((item: CostItem, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs" style={{ color: "var(--text-disabled)" }}>上传数据后可查看成本结构</p>
                </div>
              )}
            </div>
          </div>

          {metrics && metrics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <TrendingUp size={12} /> 核心指标
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {metrics.map((m) => (
                  <div key={m.id} className="glass-panel rounded-lg p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{m.name}</p>
                    <p className="text-lg font-semibold data-mono" style={{ color: "var(--text-primary)" }}>
                      {m.unit === "%" ? `${Number(m.value).toFixed(1)}%` : `¥${Number(m.value).toLocaleString()}`}
                    </p>
                    {m.changePercent && (
                      <p className="text-[10px] mt-1" style={{ color: Number(m.changePercent) >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {Number(m.changePercent) >= 0 ? "+" : ""}{Number(m.changePercent).toFixed(1)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Lightbulb size={12} style={{ color: "var(--brand)" }} /> 经营洞察
              </h2>
              <div className="space-y-2">
                {insights.map((insight: InsightItem, i: number) => (
                  <div key={i} className="glass-panel rounded-lg p-4 border-l-2" style={{ borderLeftColor: "#3B82F6" }}>
                    <p className="text-xs mb-1" style={{ color: "#3B82F6" }}>{insight.title}</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{insight.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <AlertTriangle size={12} style={{ color: "var(--danger)" }} /> 风险提示
              </h2>
              <div className="space-y-2">
                {risks.map((risk: InsightItem, i: number) => (
                  <div key={i} className="glass-panel rounded-lg p-4 border-l-2"
                    style={{ borderLeftColor: (risk.severity && severityColors[risk.severity]?.border) || "var(--warning)" }}>
                    <p className="text-xs mb-1" style={{ color: (risk.severity && severityColors[risk.severity]?.text) || "var(--warning)" }}>{risk.title}</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{risk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Lightbulb size={12} style={{ color: "var(--success)" }} /> AI 建议
              </h2>
              <div className="glass-panel rounded-xl p-5">
                <ul className="space-y-3">
                  {suggestions.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(167, 139, 250, 0.12)" }}>
                        <span className="text-[10px] font-medium" style={{ color: "var(--brand)" }}>{i + 1}</span>
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {dataGaps.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Info size={12} style={{ color: "var(--warning)" }} /> 数据缺口
              </h2>
              <div className="glass-panel rounded-xl p-5 border" style={{ borderColor: "rgba(251, 191, 36, 0.1)" }}>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>为了更精准的分析，建议补充以下数据：</p>
                <ul className="space-y-2">
                  {dataGaps.map((gap: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--warning)", opacity: 0.6 }} />
                      <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel rounded-xl p-16 text-center">
          <FileText size={32} className="mx-auto mb-4" style={{ color: "var(--border-hover)" }} strokeWidth={1.5} />
          <p className="text-lg mb-2" style={{ color: "var(--text-primary)" }}>暂无分析报告</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>上传数据并生成报告后，AI 深度经营分析将在此处展示</p>
          {periods && periods.length > 0 && (
            <button onClick={() => generateReport.mutate({
              periodId: periods[0].id,
              companyId: selectedCompany!,
              companyName: companies?.find(c => c.id === selectedCompany)?.name || "企业",
              period: periods[0].label,
            })}
              disabled={generateReport.isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--brand)", color: "#050505" }}>
              {generateReport.isPending ? "生成中..." : "生成首份报告"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
