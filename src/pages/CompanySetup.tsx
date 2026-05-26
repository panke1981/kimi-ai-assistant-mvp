import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Building2, ArrowLeft, Check } from "lucide-react";

const industries = [
  "电商零售", "餐饮服务", "教育培训", "科技软件",
  "制造业", "批发贸易", "医疗健康", "文化传媒",
  "金融服务", "房地产", "物流运输", "其他",
];

const businessTypes = [
  "个体经营", "有限责任公司", "股份有限公司",
  "合伙企业", "个人独资企业", "其他",
];

const goals = [
  { id: "growth", label: "增长优先" },
  { id: "profit", label: "利润优先" },
  { id: "cashflow", label: "现金流稳健" },
  { id: "cost", label: "控成本" },
  { id: "expand", label: "扩张规模" },
];

export default function CompanySetup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [step, setStep] = useState<"form" | "success">("form");

  const createCompany = trpc.company.create.useMutation({
    onSuccess: () => setStep("success"),
  });

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createCompany.mutate({
      name: name.trim(),
      industry: industry || undefined,
      businessType: businessType || undefined,
      goals: selectedGoals.length > 0 ? selectedGoals.join(",") : undefined,
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(167, 139, 250, 0.15)" }}
          >
            <Check size={28} style={{ color: "var(--brand)" }} />
          </div>
          <h2 className="text-xl font-medium mb-3" style={{ color: "var(--text-primary)" }}>企业创建成功</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
            AI 经营助手已为您初始化。请前往资料库上传经营数据以开始分析。
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/files")}
              className="px-6 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--brand)", color: "#050505" }}
            >
              上传数据
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 rounded-xl text-sm border transition-colors"
              style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}
            >
              返回概览
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          返回
        </button>

        <div className="mb-8">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: "rgba(167, 139, 250, 0.1)" }}
          >
            <Building2 size={18} style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-xl font-light mb-2" style={{ color: "var(--text-primary)" }}>创建企业</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>设置您的企业基本信息，AI 将据此优化分析策略</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
              企业名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入企业名称"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
              所属行业
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">选择行业</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
              经营类型
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">选择类型</option>
              {businessTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-3 block" style={{ color: "var(--text-muted)" }}>
              经营目标（可多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="px-4 py-2 rounded-lg text-sm transition-all duration-200 border"
                  style={
                    selectedGoals.includes(g.id)
                      ? {
                          background: "rgba(167, 139, 250, 0.1)",
                          color: "var(--brand)",
                          borderColor: "rgba(167, 139, 250, 0.3)",
                        }
                      : {
                          color: "var(--text-muted)",
                          borderColor: "var(--border-default)",
                        }
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || createCompany.isPending}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--brand)", color: "#050505" }}
          >
            {createCompany.isPending ? "创建中..." : "创建企业"}
          </button>
        </div>
      </div>
    </div>
  );
}
