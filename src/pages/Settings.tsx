import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  KeyRound,
  Globe,

  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,

  Sparkles,
} from "lucide-react";

const PRESET_MODELS: Record<string, { label: string; models: string[] }> = {
  openai: {
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  deepseek: {
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  custom: {
    label: "自定义",
    models: [],
  },
};

export default function Settings() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<"openai" | "deepseek" | "custom">("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [isActive, setIsActive] = useState<"yes" | "no">("no");
  const [savedMessage, setSavedMessage] = useState("");

  const { data: settings } = trpc.aiSettings.get.useQuery();
  const utils = trpc.useUtils();

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setProvider((settings.provider as "openai" | "deepseek" | "custom") || "openai");
      setApiKey(settings.apiKey || "");
      setBaseUrl(settings.baseUrl || "");
      setModel(settings.model || "gpt-4o-mini");
      setIsActive(settings.isActive as "yes" | "no");
    }
  }, [settings]);

  const saveSettings = trpc.aiSettings.save.useMutation({
    onSuccess: () => {
      utils.aiSettings.get.invalidate();
      setSavedMessage("设置已保存");
      setTimeout(() => setSavedMessage(""), 3000);
    },
  });

  const deleteSettings = trpc.aiSettings.delete.useMutation({
    onSuccess: () => {
      utils.aiSettings.get.invalidate();
      setProvider("openai");
      setApiKey("");
      setBaseUrl("");
      setModel("gpt-4o-mini");
      setIsActive("no");
      setSavedMessage("设置已清除");
      setTimeout(() => setSavedMessage(""), 3000);
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) return;
    saveSettings.mutate({
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      model,
      isActive,
    });
  };

  const handleProviderChange = (p: "openai" | "deepseek" | "custom") => {
    setProvider(p);
    if (p === "openai") {
      setBaseUrl("");
      setModel("gpt-4o-mini");
    } else if (p === "deepseek") {
      setBaseUrl("");
      setModel("deepseek-chat");
    }
  };

  const isConfigured = settings && settings.isActive === "yes" && settings.apiKey;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={14} />
        返回
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.1)" }}>
            <KeyRound size={14} style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-xl font-light" style={{ color: "var(--text-primary)" }}>AI 模型设置</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          配置您自己的大模型 API，AI 分析将使用您指定的模型
        </p>
      </div>

      {/* Status Card */}
      <div className="glass-panel rounded-xl p-5 mb-6 border" style={{ borderColor: isConfigured ? "rgba(52, 211, 153, 0.2)" : "rgba(251, 191, 36, 0.2)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isConfigured ? "rgba(52, 211, 153, 0.1)" : "rgba(251, 191, 36, 0.1)" }}>
              {isConfigured ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} /> : <AlertCircle size={18} style={{ color: "var(--warning)" }} />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {isConfigured ? "AI 模型已配置" : "使用内置分析引擎"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isConfigured
                  ? `${PRESET_MODELS[settings.provider]?.label || ""} · ${settings.model}`
                  : "字段识别、报告生成、AI 对话均使用规则引擎，效果可靠"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: isConfigured ? "var(--success)" : "var(--warning)" }} />
            <span className="text-xs" style={{ color: isConfigured ? "var(--success)" : "var(--warning)" }}>
              {isConfigured ? "已启用" : "未启用"}
            </span>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider mb-3 block" style={{ color: "var(--text-muted)" }}>
          模型提供商
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(PRESET_MODELS) as [string, { label: string; models: string[] }][]).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => handleProviderChange(key as "openai" | "deepseek" | "custom")}
              className="px-4 py-3 rounded-xl border text-sm font-medium transition-all"
              style={
                provider === key
                  ? { background: "rgba(167, 139, 250, 0.08)", color: "var(--brand)", borderColor: "rgba(167, 139, 250, 0.3)" }
                  : { color: "var(--text-muted)", borderColor: "var(--border-default)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
          模型
        </label>
        {provider === "custom" ? (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="输入模型名，如 gpt-4o"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        ) : (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          >
            {PRESET_MODELS[provider]?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      {/* Base URL (optional) */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
          API Base URL（可选，留空使用默认）
        </label>
        <div className="relative">
          <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={provider === "openai" ? "https://api.openai.com/v1" : provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://your-api-endpoint.com/v1"}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* API Key */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
          API Key *
        </label>
        <div className="relative">
          <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-disabled)" }} />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none data-mono"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-disabled)" }}>
          您的 API Key 仅存储在您的账户中，不会共享给第三方
        </p>
      </div>

      {/* Activate Toggle */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ background: isActive === "yes" ? "var(--brand)" : "var(--border-default)" }}
            onClick={() => setIsActive(isActive === "yes" ? "no" : "yes")}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
              style={{
                background: "white",
                transform: isActive === "yes" ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </div>
          <div>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>启用自定义 AI 模型</span>
            <p className="text-xs" style={{ color: "var(--text-disabled)" }}>
              开启后，字段识别、报告生成和 AI 对话将使用您配置的模型
            </p>
          </div>
        </label>
      </div>

      {/* Saved Message */}
      {savedMessage && (
        <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
          <CheckCircle2 size={14} />
          {savedMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!apiKey.trim() || saveSettings.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--brand)", color: "#050505" }}
        >
          {saveSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          保存设置
        </button>

        {settings && (
          <button
            onClick={() => { if (confirm("确定清除所有 AI 模型设置？")) deleteSettings.mutate(); }}
            disabled={deleteSettings.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm border transition-colors disabled:opacity-50"
            style={{ color: "var(--danger)", borderColor: "rgba(248, 113, 113, 0.2)" }}
          >
            <Trash2 size={14} />
            清除设置
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-10 glass-panel rounded-xl p-5 border" style={{ borderColor: "rgba(59, 130, 246, 0.1)" }}>
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>支持的模型</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>OpenAI</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>DeepSeek</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>deepseek-chat, deepseek-reasoner</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>自定义</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>任何 OpenAI-compatible API（如代理服务、本地模型等）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
