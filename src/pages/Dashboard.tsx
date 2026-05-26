import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTheme } from "@/hooks/useTheme";
import { useDemo, DEMO_COMPANY, DEMO_METRICS, DEMO_REPORT } from "@/components/DemoProvider";
import {
  ArrowRight,
  BarChart3, Zap, Building2, Upload, Brain, Plus,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// 类型定义 — 所有 Dashboard 内部数据显式收口
// ═══════════════════════════════════════════════════════

interface MetricItem {
  id: number;
  name: string;
  category: string;
  value: string;
  unit: string;
  changePercent?: string | null;
}

interface InsightItem {
  title: string;
  content: string;
  level?: string;
  severity?: string;
}

interface ReportItem {
  id: number;
  periodId: number;
  companyId: number;
  type: string;
  title: string;
  summary: string | null;
  insights: InsightItem[] | null;
  risks: InsightItem[] | null;
  suggestions: string[] | null;
  dataGaps: string[] | null;
  chartData: Record<string, unknown> | null;
  status: string | null;
  createdAt: Date | null;
}

interface CompanyItem {
  id: number;
  name: string;
  industry: string | null;
  businessType: string | null;
  goals: string | null;
}

interface PeriodItem {
  id: number;
  companyId: number;
  label: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

// ═══════════════════════════════════════════════════════
// 安全值处理函数
// ═══════════════════════════════════════════════════════

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function toDisplayValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "是" : "否";
  return "-";
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

function isNonEmptyArray<T>(v: unknown): v is T[] {
  return Array.isArray(v) && v.length > 0;
}

// ═══════════════════════════════════════════════════════
// 数据归一化函数 — 在 JSX 之前完成
// ═══════════════════════════════════════════════════════

function normalizeMetrics(raw: unknown): MetricItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => m !== null && typeof m === "object")
    .map((m) => ({
      id: typeof m.id === "number" ? m.id : 0,
      name: toStr(m.name),
      category: toStr(m.category),
      value: toStr(m.value),
      unit: toStr(m.unit),
      changePercent: m.changePercent !== undefined && m.changePercent !== null
        ? String(m.changePercent)
        : null,
    }));
}

function normalizeReport(raw: unknown): ReportItem | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const parseInsights = (v: unknown): InsightItem[] | null => {
    if (!Array.isArray(v)) return null;
    return v
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
      .map((item) => ({
        title: toStr(item.title),
        content: toStr(item.content),
        level: toStr(item.level) || undefined,
        severity: toStr(item.severity) || undefined,
      }));
  };

  const parseStringArray = (v: unknown): string[] | null => {
    if (!Array.isArray(v)) return null;
    return v.map((s) => toStr(s)).filter(Boolean);
  };

  return {
    id: typeof r.id === "number" ? r.id : 0,
    periodId: typeof r.periodId === "number" ? r.periodId : 0,
    companyId: typeof r.companyId === "number" ? r.companyId : 0,
    type: toStr(r.type),
    title: toStr(r.title),
    summary: r.summary !== null && r.summary !== undefined ? String(r.summary) : null,
    insights: parseInsights(r.insights),
    risks: parseInsights(r.risks),
    suggestions: parseStringArray(r.suggestions),
    dataGaps: parseStringArray(r.dataGaps),
    chartData: typeof r.chartData === "object" && r.chartData !== null
      ? (r.chartData as Record<string, unknown>)
      : null,
    status: r.status !== null && r.status !== undefined ? String(r.status) : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt : null,
  };
}

function normalizeCompanies(raw: unknown): CompanyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => c !== null && typeof c === "object")
    .map((c) => ({
      id: typeof c.id === "number" ? c.id : 0,
      name: toStr(c.name),
      industry: c.industry !== undefined && c.industry !== null ? String(c.industry) : null,
      businessType: c.businessType !== undefined && c.businessType !== null ? String(c.businessType) : null,
      goals: c.goals !== undefined && c.goals !== null ? String(c.goals) : null,
    }));
}

function normalizePeriods(raw: unknown): PeriodItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => p !== null && typeof p === "object")
    .map((p) => ({
      id: typeof p.id === "number" ? p.id : 0,
      companyId: typeof p.companyId === "number" ? p.companyId : 0,
      label: toStr(p.label),
      type: toStr(p.type),
      startDate: p.startDate !== null && p.startDate !== undefined ? String(p.startDate) : null,
      endDate: p.endDate !== null && p.endDate !== undefined ? String(p.endDate) : null,
      status: p.status !== null && p.status !== undefined ? String(p.status) : null,
    }));
}

// ─── Flow Field Background ───────────────────────────────
function FlowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const lines = 5;
    const nodes = [
      "现金流", "ROI", "毛利率", "用户数", "库存",
      "营收", "净利润", "客单价", "转化率", "退货率",
      "LTV", "CAC", "NPS", "复购率", "人效",
      "周转率", "ROI", "EBITDA", "现金流",
    ];

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      const alpha = isDark ? 0.3 : 0.06;
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bg.addColorStop(0, isDark ? `rgba(10, 10, 15, ${alpha})` : `rgba(167, 139, 250, ${alpha})`);
      bg.addColorStop(1, isDark ? "rgba(5, 5, 5, 0)" : "rgba(245, 245, 247, 0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      time += 0.008;
      const lineColor = isDark ? [167, 139, 250] : [139, 109, 230];

      for (let i = 0; i < lines; i++) {
        const baseY = 0.15 + (i / lines) * 0.7;
        const seed = i * 1.618;
        const drift = time * 0.015;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${lineColor[0]}, ${lineColor[1]}, ${lineColor[2]}, ${
          (isDark ? 0.08 : 0.05) + (isDark ? 0.04 : 0.03) * Math.sin(time * 0.5 + seed)
        })`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < w; x += 3) {
          const nx = x / w;
          const lineY = baseY + Math.sin(nx * 2 + drift + seed) * 0.03;
          const y = lineY * h + Math.sin(x * 0.01 + time + seed) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const nodeCount = 3 + (i % 3);
        for (let n = 0; n < nodeCount; n++) {
          const nodeSeed = seed * 7 + n * 13;
          const nodeT = ((time * 0.3 + nodeSeed * 0.1 + n / nodeCount) % 1);
          const nodeX = nodeT * w * 0.8 + w * 0.1;
          const nodeY = baseY * h + Math.sin(nodeT * 6 + seed) * 15;
          const pulse = 0.5 + 0.5 * Math.sin(time * 2 + nodeSeed);
          const nodeAlpha = (isDark ? 0.15 : 0.08) + pulse * (isDark ? 0.35 : 0.2);
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillStyle = `rgba(${lineColor[0]}, ${lineColor[1]}, ${lineColor[2]}, ${nodeAlpha})`;
          ctx.textAlign = "center";
          ctx.fillText(nodes[(i * nodeCount + n) % nodes.length], nodeX, nodeY);
        }
      }
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

// ─── Empty State ─────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc, action, actionLabel }: {
  icon: React.ElementType; title: string; desc: string; action: () => void; actionLabel: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-8 md:p-12 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(167, 139, 250, 0.08)" }}>
        <Icon size={24} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
      <button onClick={action} className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium mx-auto">
        <Plus size={14} />
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const { isDemo } = useDemo();
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  // Demo mode: use test data directly
  const demoCompanies = isDemo
    ? [{ id: DEMO_COMPANY.id, name: DEMO_COMPANY.name, industry: DEMO_COMPANY.industry, businessType: DEMO_COMPANY.businessType, goals: DEMO_COMPANY.goals }]
    : undefined;
  const demoPeriods = isDemo
    ? [{ id: 1, companyId: DEMO_COMPANY.id, label: "2026-04", type: "month" as const, startDate: "2026-04-01", endDate: "2026-04-30", status: "completed" as const }]
    : undefined;
  const demoMetrics = isDemo ? DEMO_METRICS : undefined;
  const demoReport = isDemo ? DEMO_REPORT : undefined;

  const { data: companiesData, isLoading: companiesLoading } = trpc.company.list.useQuery(undefined, { enabled: !isDemo });
  const { data: periodsData } = trpc.period.list.useQuery(
    { companyId: selectedCompany ?? 0 },
    { enabled: !!selectedCompany && !isDemo }
  );
  const { data: metricsData } = trpc.metric.list.useQuery(
    { periodId: periodsData?.[0]?.id ?? 0 },
    { enabled: !!periodsData?.[0]?.id && !isDemo }
  );
  const { data: latestReportsData } = trpc.report.getByPeriod.useQuery(
    { periodId: periodsData?.[0]?.id ?? 0 },
    { enabled: !!periodsData?.[0]?.id && !isDemo }
  );

  // ═══════════════════════════════════════════════════════
  // 数据归一化 — 在 JSX 之前完成
  // ═══════════════════════════════════════════════════════

  const companies: CompanyItem[] = normalizeCompanies(isDemo ? demoCompanies : companiesData);
  const periods: PeriodItem[] = normalizePeriods(isDemo ? demoPeriods : periodsData);
  const metrics: MetricItem[] = normalizeMetrics(isDemo ? demoMetrics : metricsData);
  const latestReport: ReportItem | null = normalizeReport(isDemo ? demoReport : latestReportsData?.[0]);
  const currentPeriod: PeriodItem | undefined = periods[0];
  const hasReport: boolean = latestReport !== null && latestReport.status === "completed";
  const hasMetrics: boolean = isNonEmptyArray<MetricItem>(metrics);

  const generateReport = trpc.parse.generateReport.useMutation({
    onSuccess: () => { window.location.reload(); },
  });

  useEffect(() => {
    if (companies.length > 0 && selectedCompany === null) {
      setSelectedCompany(companies[0].id);
    }
  }, [companies, selectedCompany]);

  // Loading
  if (companiesLoading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--border-default)", borderTopColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</p>
        </div>
      </div>
    );
  }

  // ── No Company ──────────────────────────────────────
  if (companies.length === 0) {
    return (
      <div className="relative min-h-screen">
        <FlowBackground />
        <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto px-4 md:px-8 pt-12 md:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-light tracking-wide" style={{ color: "var(--text-primary)" }}>企业经营概览</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>创建企业后即可开始 AI 经营分析</p>
          </div>
          <EmptyState
            icon={Building2}
            title="开始使用数观"
            desc="创建您的企业档案，AI 经营助手将帮助您分析经营数据、发现风险、优化决策。"
            action={() => navigate("/company/new")}
            actionLabel="创建企业"
          />

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6">
            {[
              { icon: Upload, title: "上传经营数据", desc: "支持 Excel、CSV 格式文件上传" },
              { icon: Brain, title: "AI 字段识别", desc: "自动识别数据字段含义并建档" },
              { icon: BarChart3, title: "智能分析报告", desc: "收入、成本、利润等核心指标分析" },
            ].map((f) => (
              <div key={f.title} className="glass-panel rounded-lg p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167, 139, 250, 0.08)" }}>
                  <f.icon size={14} style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Has Company ─────────────────────────────────────
  const firstCompanyName: string = toStr(companies[0]?.name);
  const currentCompanyName: string = toStr(companies.find((c) => c.id === selectedCompany)?.name) || firstCompanyName;

  // ── Action button text helpers ──
  const actionTitle: string = hasReport
    ? "本月分析已完成"
    : hasMetrics
      ? "开始 AI 月度经营分析"
      : "上传数据以开始分析";

  const actionDesc: string = hasReport
    ? "查看已生成的经营分析报告"
    : hasMetrics
      ? "AI 将基于数据生成深度分析报告"
      : "请先前往资料库上传经营数据文件";

  return (
    <div className="relative min-h-screen">
      <FlowBackground />
      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto px-4 md:px-8 pt-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
            <h1 className="text-2xl font-light tracking-wide" style={{ color: "var(--text-primary)" }}>企业经营概览</h1>
            <button
              onClick={() => navigate("/company/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-colors self-start"
              style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}
            >
              <Plus size={12} />
              新增企业
            </button>
          </div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            已为您生成本月核心指标 · {firstCompanyName}
          </p>
        </div>

        {/* Company Selector */}
        {companies.length > 1 ? (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompany(c.id)}
                className="px-4 py-2 rounded-lg text-sm transition-all duration-200 border whitespace-nowrap"
                style={
                  selectedCompany === c.id
                    ? { background: "rgba(167, 139, 250, 0.1)", color: "var(--brand)", borderColor: "rgba(167, 139, 250, 0.35)" }
                    : { color: "var(--text-muted)", borderColor: "var(--border-default)" }
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        {/* Stat Cards — with real data */}
        {hasMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* 总营收 */}
            <div className="glass-panel-hover rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.08), transparent)" }} />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.12)" }}>
                    <BarChart3 size={14} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>总营收</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-semibold data-mono" style={{ color: "var(--text-primary)" }}>
                  {(() => {
                    const m = metrics.find((x) => x.name === "营业收入");
                    return m ? `¥${toNum(m.value).toLocaleString()}` : "¥0";
                  })()}
                </span>
              </div>
            </div>

            {/* 毛利润 */}
            <div className="glass-panel-hover rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.08), transparent)" }} />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.12)" }}>
                    <Zap size={14} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>毛利润</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-semibold data-mono" style={{ color: "var(--text-primary)" }}>
                  {(() => {
                    const m = metrics.find((x) => x.name === "毛利润");
                    return m ? `¥${toNum(m.value).toLocaleString()}` : "¥0";
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs data-mono" style={{ color: "var(--success)" }}>
                  {(() => {
                    const m = metrics.find((x) => x.name === "毛利率");
                    return m ? `${toDisplayValue(m.value)}%` : "-";
                  })()}
                </span>
              </div>
            </div>

            {/* 净利润 */}
            <div className="glass-panel-hover rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.08), transparent)" }} />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.12)" }}>
                    <Zap size={14} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>净利润</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-semibold data-mono" style={{ color: "var(--text-primary)" }}>
                  {(() => {
                    const m = metrics.find((x) => x.name === "净利润");
                    return m ? `¥${toNum(m.value).toLocaleString()}` : "¥0";
                  })()}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Empty metrics placeholder */}
        {hasMetrics ? null : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {[
              { title: "总营收", value: "¥-", icon: BarChart3 },
              { title: "毛利润", value: "¥-", icon: Zap },
              { title: "净利润", value: "¥-", icon: Zap },
            ].map((s) => (
              <div key={s.title} className="glass-panel rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.12)" }}>
                    <s.icon size={14} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.title}</span>
                </div>
                <span className="text-2xl font-semibold data-mono" style={{ color: "var(--text-disabled)" }}>{s.value}</span>
                <p className="text-xs mt-2" style={{ color: "var(--text-disabled)" }}>上传数据后自动计算</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Area */}
        <div className="glass-panel rounded-xl p-6 md:p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>{actionTitle}</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>{actionDesc}</p>

            <div className="flex gap-3 justify-center flex-wrap">
              {hasReport ? (
                <button onClick={() => navigate("/analysis")} className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium">
                  查看分析报告 <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (hasMetrics && currentPeriod) {
                      generateReport.mutate({
                        periodId: currentPeriod.id,
                        companyId: selectedCompany ?? 0,
                        companyName: currentCompanyName,
                        period: currentPeriod.label,
                      });
                    } else {
                      navigate("/files");
                    }
                  }}
                  disabled={generateReport.isPending}
                  className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {generateReport.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI 分析中...
                    </>
                  ) : hasMetrics ? (
                    <>
                      <Zap size={14} />
                      开始月度分析
                    </>
                  ) : (
                    <>
                      <ArrowRight size={14} />
                      前往资料库
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate("/files")}
                className="px-6 py-3 rounded-xl text-sm transition-all border"
                style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}
              >
                管理资料
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Detail */}
        {hasMetrics ? (
          <div className="mt-6 md:mt-8">
            <h3 className="text-xs uppercase tracking-wider mb-3 md:mb-4" style={{ color: "var(--text-muted)" }}>详细指标</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {metrics.map((m) => (
                <div key={m.id} className="glass-panel rounded-lg p-3 md:p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider mb-1.5 md:mb-2" style={{ color: "var(--text-muted)" }}>{m.name}</p>
                  <p className="text-base md:text-lg font-semibold data-mono" style={{ color: "var(--text-primary)" }}>
                    {m.unit === "%"
                      ? `${toNum(m.value).toFixed(1)}%`
                      : m.unit === "笔" || m.unit === "件"
                        ? toNum(m.value).toLocaleString()
                        : `¥${toNum(m.value).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Quick Insights */}
        {isNonEmptyArray<InsightItem>(latestReport?.insights) ? (
          <div className="mt-8 md:mt-10">
            <h3 className="text-sm font-medium mb-3 md:mb-4 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>核心洞察</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {(latestReport!.insights!).slice(0, 3).map((insight, i) => (
                <div key={i} className="glass-panel rounded-lg p-4 border-l-2" style={{ borderLeftColor: "var(--brand)" }}>
                  <p className="text-xs mb-1.5" style={{ color: "var(--brand)" }}>{insight.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{insight.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
