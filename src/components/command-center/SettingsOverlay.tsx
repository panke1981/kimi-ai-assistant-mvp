import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Gauge, KeyRound, X } from "lucide-react";
import { toast } from "sonner";

import {
  buildAiSettingsDraft,
  toAiSettingsInput,
  validateAiSettingsDraft,
  type AiSettingsDraft,
  type AiSettingsProvider,
} from "@/lib/ai-settings-form";
import type { AiSettingsSnapshot } from "@/lib/command-center-view";
import type { CommandCenterModel } from "@/lib/diagnosis-engine";
import { trpc } from "@/providers/trpc-client";

interface SettingsOverlayProps {
  isDemo: boolean;
  aiSettings: AiSettingsSnapshot | null | undefined;
  model: CommandCenterModel;
  onClose: () => void;
}

export function SettingsOverlay({ isDemo, aiSettings, model, onClose }: SettingsOverlayProps) {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"model" | "budget" | "rules" | "metrics">("model");
  const [modelDraft, setModelDraft] = useState<AiSettingsDraft>(() => buildAiSettingsDraft(aiSettings, isDemo));
  const [draftBudget, setDraftBudget] = useState({
    revenue: "270",
    expenseRate: "15",
    netMargin: "28",
    cashflow: "68",
  });
  const saveSettings = trpc.aiSettings.save.useMutation({
    onSuccess: async () => {
      await utils.aiSettings.get.invalidate();
      setModelDraft((draft) => ({ ...draft, apiKey: "" }));
      toast.success("模型设置已保存");
    },
    onError: (error) => {
      toast.error(error.message || "模型设置保存失败");
    },
  });

  useEffect(() => {
    setModelDraft(buildAiSettingsDraft(aiSettings, isDemo));
  }, [aiSettings, isDemo]);

  const isConfigured = Boolean(!isDemo && aiSettings?.isActive === "yes" && aiSettings.hasApiKey);
  const providerLabel = aiSettings?.provider === "deepseek" ? "DeepSeek" : aiSettings?.provider === "custom" ? "自定义模型" : "OpenAI";
  const ruleRows = [
    { name: "收入下降预警", condition: "收入环比下降超过 15%", status: model.riskSignals.some((risk) => risk.id.includes("revenue")) ? "已触发" : "监控中" },
    { name: "费用异常增长", condition: "费用增速高于收入增速", status: model.riskSignals.some((risk) => risk.id.includes("expense")) ? "已触发" : "监控中" },
    { name: "现金流风险", condition: "收入增长但现金流下降", status: model.riskSignals.some((risk) => risk.id.includes("cashflow")) ? "已触发" : "监控中" },
    { name: "复购承接不足", condition: "复购率低于预算目标", status: model.riskSignals.some((risk) => risk.id.includes("retention")) ? "已触发" : "监控中" },
  ];
  const metricRows = [
    { name: "营业收入", source: "销售数据 / 订单金额", formula: "订单金额求和", owner: "经营口径" },
    { name: "运营费用", source: "费用数据 / 推广、物流、人工", formula: "费用字段求和", owner: "财务口径" },
    { name: "净利润", source: "收入、成本、费用", formula: "收入 - 成本 - 费用", owner: "经营口径" },
    { name: "现金流净额", source: "银行流水 / 实收金额", formula: "收入流入 - 支出流出", owner: "资金口径" },
  ];

  const updateModelDraft = <Key extends keyof AiSettingsDraft>(key: Key, value: AiSettingsDraft[Key]) => {
    setModelDraft((draft) => ({ ...draft, [key]: value }));
  };

  const handleSaveModelSettings = async () => {
    if (isDemo) {
      toast.info("本地单用户模式不保存模型设置");
      return;
    }

    const error = validateAiSettingsDraft(modelDraft, isDemo);
    if (error) {
      toast.error(error);
      return;
    }

    await saveSettings.mutateAsync(toAiSettingsInput(modelDraft));
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-end bg-slate-900/12 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="m-5 flex h-[calc(100%-40px)] w-[560px] flex-col rounded-xl border bg-white shadow-2xl" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>设置中心浮窗</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>模型、预算、诊断规则、指标口径集中配置</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="关闭设置浮窗">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-5 py-4">
          {[
            { id: "model" as const, label: "模型", icon: KeyRound },
            { id: "budget" as const, label: "预算", icon: Gauge },
            { id: "rules" as const, label: "规则", icon: AlertTriangle },
            { id: "metrics" as const, label: "口径", icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium"
              style={{
                color: activeTab === tab.id ? "var(--brand)" : "var(--text-muted)",
                borderColor: activeTab === tab.id ? "rgba(37,99,235,0.24)" : "var(--border-subtle)",
                background: activeTab === tab.id ? "rgba(37,99,235,0.08)" : "#fff",
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
          {activeTab === "model" ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: isConfigured ? "rgba(15,118,110,0.22)" : "rgba(180,83,9,0.2)", background: isConfigured ? "rgba(15,118,110,0.06)" : "rgba(180,83,9,0.06)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#fff", color: isConfigured ? "var(--success)" : "var(--warning)" }}>
                      {isConfigured ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{isConfigured ? "自定义模型已启用" : "使用内置规则引擎"}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {isConfigured ? `${providerLabel} · ${aiSettings?.model}${aiSettings?.apiKeyPreview ? ` · ${aiSettings.apiKeyPreview}` : ""}` : "字段识别、诊断和报告使用本地规则，可完整演示"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px]" style={{ color: isConfigured ? "var(--success)" : "var(--warning)" }}>
                    {isConfigured ? "已启用" : isDemo ? "本地模式" : "未配置"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Provider", value: isDemo ? "内置引擎" : providerLabel },
                  { label: "Model", value: isDemo ? "local-rule-engine" : aiSettings?.model ?? "未配置" },
                  { label: "Base URL", value: aiSettings?.baseUrl || "默认端点" },
                  { label: "API Key", value: aiSettings?.hasApiKey ? aiSettings.apiKeyPreview ?? "已保存" : "未保存" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    <p className="mt-1 truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>配置说明</p>
                <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                  {isDemo ? "本地单用户模式不保存外部模型配置。真实接入后可直接在这个浮窗保存 OpenAI、DeepSeek 或兼容接口。" : "为安全起见，已保存的 API Key 不会回显；生产环境需要改为加密存储。再次保存时请输入新的 API Key。"}
                </p>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>模型接入配置</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>在当前工作台浮窗内完成配置，不跳转页面。</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={modelDraft.isActive === "yes"}
                      disabled={isDemo}
                      onChange={(event) => updateModelDraft("isActive", event.target.checked ? "yes" : "no")}
                    />
                    启用
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Provider</span>
                    <select
                      value={modelDraft.provider}
                      disabled={isDemo}
                      onChange={(event) => updateModelDraft("provider", event.target.value as AiSettingsProvider)}
                      className="mt-1 h-9 w-full rounded-lg border px-3 text-xs outline-none"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="custom">自定义兼容接口</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Model</span>
                    <input
                      value={modelDraft.model}
                      disabled={isDemo}
                      onChange={(event) => updateModelDraft("model", event.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border px-3 text-xs outline-none"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                      placeholder="gpt-4.1-mini"
                    />
                  </label>

                  <label className="col-span-2 block">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Base URL</span>
                    <input
                      value={modelDraft.baseUrl}
                      disabled={isDemo}
                      onChange={(event) => updateModelDraft("baseUrl", event.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border px-3 text-xs outline-none"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                      placeholder="默认端点或 OpenAI-compatible base URL"
                    />
                  </label>

                  <label className="col-span-2 block">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>API Key</span>
                    <input
                      value={modelDraft.apiKey}
                      disabled={isDemo}
                      onChange={(event) => updateModelDraft("apiKey", event.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border px-3 text-xs outline-none"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                      type="password"
                      placeholder={aiSettings?.hasApiKey ? `已保存 ${aiSettings.apiKeyPreview ?? ""}，再次保存需重新输入` : "sk-..."}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "budget" ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>预算目标草稿</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>本轮先作为工作台草稿，不写入数据库；后续可进入诊断规则。</p>
              </div>
              {[
                { key: "revenue" as const, label: "收入目标", unit: "万元" },
                { key: "expenseRate" as const, label: "费用率上限", unit: "%" },
                { key: "netMargin" as const, label: "净利率目标", unit: "%" },
                { key: "cashflow" as const, label: "现金流目标", unit: "万元" },
              ].map((item) => (
                <label key={item.key} className="block rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={draftBudget[item.key]}
                      onChange={(event) => setDraftBudget((budget) => ({ ...budget, [item.key]: event.target.value }))}
                      className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                    />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.unit}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : null}

          {activeTab === "rules" ? (
            <div className="space-y-3">
              {ruleRows.map((rule) => {
                const triggered = rule.status === "已触发";
                return (
                  <div key={rule.name} className="rounded-xl border p-4" style={{ borderColor: triggered ? "rgba(180,83,9,0.22)" : "var(--border-subtle)", background: triggered ? "rgba(180,83,9,0.05)" : "#fff" }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.name}</p>
                      <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: triggered ? "var(--warning)" : "var(--success)", background: "#fff" }}>{rule.status}</span>
                    </div>
                    <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>{rule.condition}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === "metrics" ? (
            <div className="space-y-3">
              {metricRows.map((metric) => (
                <div key={metric.name} className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{metric.name}</p>
                    <span className="rounded-full px-2 py-1 text-[10px]" style={{ color: "var(--brand)", background: "rgba(37,99,235,0.08)" }}>{metric.owner}</span>
                  </div>
                  <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>{metric.source}</p>
                  <p className="mt-1 text-[11px] data-mono" style={{ color: "var(--text-secondary)" }}>{metric.formula}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{isDemo ? "本地模式不保存更改" : "模型配置将在当前工作台保存"}</p>
          <button
            onClick={handleSaveModelSettings}
            disabled={saveSettings.isPending}
            className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: "var(--brand)", color: "white", opacity: saveSettings.isPending ? 0.68 : 1 }}
          >
            {saveSettings.isPending ? "保存中..." : "保存模型设置"}
          </button>
        </div>
      </div>
    </div>
  );
}
