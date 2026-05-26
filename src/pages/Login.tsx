import { useSearchParams, useNavigate } from "react-router";
import { useDemo } from "@/components/DemoProvider";
import { Sparkles, LogIn } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startDemo } = useDemo();
  const returnPath = searchParams.get("return");

  if (returnPath) {
    sessionStorage.setItem("oauth_return_path", returnPath);
  }

  const handleDemoMode = () => {
    startDemo();
    navigate(returnPath ? decodeURIComponent(returnPath) : "/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extralight tracking-wider mb-2" style={{ color: "var(--text-primary)" }}>
            数观
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>DataPulse</p>
          <p className="text-sm mt-4" style={{ color: "var(--text-tertiary)" }}>
            AI 经营分析助手
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              欢迎回来
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              登录后即可使用 AI 经营分析功能
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => { window.location.href = getOAuthUrl(); }}
            className="w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "var(--brand)", color: "#050505" }}
          >
            <LogIn size={14} />
            使用 Kimi 账号登录
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            <span className="text-[10px] uppercase" style={{ color: "var(--text-disabled)" }}>或</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={handleDemoMode}
            className="w-full py-3 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2"
            style={{ color: "var(--brand)", borderColor: "rgba(167, 139, 250, 0.3)", background: "rgba(167, 139, 250, 0.05)" }}
          >
            <Sparkles size={14} />
            体验演示模式
          </button>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--text-disabled)" }}>
              演示模式包含完整的测试数据<br />
              可体验所有 AI 经营分析功能
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "文件上传", desc: "Excel/CSV" },
            { label: "AI 分析", desc: "字段识别" },
            { label: "经营报告", desc: "指标计算" },
          ].map((f) => (
            <div key={f.label}
              className="text-center py-3 rounded-lg border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{f.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
