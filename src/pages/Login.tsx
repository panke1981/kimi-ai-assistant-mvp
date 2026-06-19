import { useSearchParams, useNavigate } from "react-router";
import { useDemo } from "@/hooks/useDemo";
import { ArrowRight, BarChart3, Bot, Database, Lock, Sparkles } from "lucide-react";

const loginErrorMessages: Record<string, string> = {
  oauth_config_missing: "KIMI 登录配置缺失，请先在 .env 中配置 APP_ID 和 KIMI_AUTH_URL。",
  oauth_origin_missing: "无法识别当前访问域名，请使用本地地址重新打开系统。",
  oauth_callback_failed: "KIMI 登录回调失败，请检查 APP_SECRET、KIMI_AUTH_URL、KIMI_OPEN_URL 和回调地址配置。",
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  const returnPath = searchParams.get("return");
  const loginError = searchParams.get("error");

  if (returnPath) {
    sessionStorage.setItem("oauth_return_path", returnPath);
  }

  const handleDemoMode = () => {
    startDemo();
    navigate(returnPath ? decodeURIComponent(returnPath) : "/");
  };

  const handleKimiLogin = () => {
    const params = new URLSearchParams();
    if (returnPath) params.set("return", returnPath);
    window.location.href = `/api/oauth/start${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 52%, #F7FEFB 100%)" }}>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5 lg:gap-8 items-stretch">
        <section className="rounded-2xl border p-7 md:p-10 flex flex-col justify-between"
          style={{ background: "rgba(255,255,255,0.86)", borderColor: "var(--border-default)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)" }}>
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", color: "white" }}>
                <BarChart3 size={21} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>数智经营</h1>
                <p className="text-xs tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>Business Intelligence MVP</p>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
              单用户经营驾驶舱
            </h2>
            <p className="text-base leading-7 max-w-xl" style={{ color: "var(--text-tertiary)" }}>
              先用本地样例数据跑通完整流程：看概览、上传资料、确认字段、生成报告，并让 AI 助手解释经营变化。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10">
            {[
              { icon: Database, label: "资料库", desc: "Excel / CSV" },
              { icon: BarChart3, label: "经营报告", desc: "指标与趋势" },
              { icon: Bot, label: "互动分析", desc: "追问与建议" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border p-4" style={{ background: "#FFFFFF", borderColor: "var(--border-subtle)" }}>
                <f.icon size={17} className="mb-3" style={{ color: "var(--brand)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border p-6 md:p-8 flex flex-col justify-center"
          style={{ background: "#FFFFFF", borderColor: "var(--border-default)", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)" }}>
          <div className="mb-6">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--brand)" }}>推荐入口</p>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>进入本地工作台</h2>
            <p className="text-sm leading-6" style={{ color: "var(--text-tertiary)" }}>
              当前版本先按单用户使用，不需要配置 KIMI 登录也能完整体验系统。
            </p>
          </div>

          <button
            onClick={handleDemoMode}
            className="w-full py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{ background: "var(--brand)", color: "white", boxShadow: "0 12px 30px rgba(37, 99, 235, 0.22)" }}
          >
            <Sparkles size={15} />
            进入数智经营工作台
            <ArrowRight size={15} />
          </button>

          <div className="my-6 rounded-xl border p-4" style={{ background: "var(--bg-input)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-start gap-3">
              <Lock size={16} className="mt-0.5" style={{ color: "var(--text-muted)" }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>真实 KIMI 登录</p>
                <p className="text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
                  部署或接入真实账号时再启用，需要配置 APP_ID、APP_SECRET、KIMI_AUTH_URL 和回调地址。
                </p>
              </div>
            </div>
            <button
              onClick={handleKimiLogin}
              className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium border transition-colors"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)", background: "#FFFFFF" }}
            >
              使用 KIMI 登录
            </button>
          </div>

          {loginError && (
            <div className="rounded-lg px-3 py-2 text-xs leading-relaxed"
              style={{ color: "var(--warning)", background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.18)" }}>
              {loginErrorMessages[loginError] || "KIMI 登录失败，请检查登录配置后重试。"}
            </div>
          )}

          <p className="text-[11px] leading-relaxed mt-5" style={{ color: "var(--text-muted)" }}>
            本地工作台使用内置样例数据，不写入外部账号。真实上传和模型配置可在接入数据库与 KIMI 登录后启用。
          </p>
        </section>
      </div>
    </div>
  );
}
