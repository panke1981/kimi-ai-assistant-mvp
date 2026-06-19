import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useDemo } from "@/hooks/useDemo";
import { Toaster } from "@/components/ui/sonner";
import { desktopWorkspaceNotice, DESKTOP_WORKSPACE_MIN_WIDTH } from "@/lib/desktop-workspace";
import {
  LayoutDashboard, FolderOpen, BarChart3, Bot,
  Settings, LogOut, Sun, Moon, Sparkles,
} from "lucide-react";

const desktopNavItems = [
  { path: "/", label: "概览", icon: LayoutDashboard },
  { path: "/files", label: "资料库", icon: FolderOpen },
  { path: "/analysis", label: "经营分析", icon: BarChart3 },
  { path: "/assistant", label: "经营助手", icon: Bot },
  { path: "/settings", label: "模型设置", icon: Settings },
];

const commandCenterPaths = new Set(["/", "/files", "/fields", "/analysis", "/assistant", "/settings"]);
const workspaceNavigationTargets: Record<string, "overview" | "files" | "fields" | "analysis" | "assistant" | "settings"> = {
  "/": "overview",
  "/files": "files",
  "/fields": "fields",
  "/analysis": "analysis",
  "/assistant": "assistant",
  "/settings": "settings",
};

type WorkspacePath = "/" | "/files" | "/fields" | "/analysis" | "/assistant" | "/settings";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: false });
  const { isDark, toggleTheme } = useTheme();
  const { isDemo, exitDemo } = useDemo();
  const [desktopWorkspacePath, setDesktopWorkspacePath] = useState(location.pathname);

  useEffect(() => {
    const handleWorkspacePathChange = (event: Event) => {
      const path = (event as CustomEvent<WorkspacePath>).detail;
      setDesktopWorkspacePath(path);
    };

    window.addEventListener("command-center:workspace-path", handleWorkspacePathChange);
    return () => window.removeEventListener("command-center:workspace-path", handleWorkspacePathChange);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isDesktopNavActive = (path: string) => {
    if (!commandCenterPaths.has(location.pathname)) return isActive(path);
    if (desktopWorkspacePath === "/fields" && path === "/files") return true;
    return desktopWorkspacePath === path;
  };

  const handleDesktopNavigation = (path: string) => {
    if (!commandCenterPaths.has(location.pathname)) {
      setDesktopWorkspacePath(path);
      navigate(path);
      return;
    }

    const target = workspaceNavigationTargets[path];
    if (!target) {
      navigate(path);
      return;
    }

    setDesktopWorkspacePath(path);
    window.dispatchEvent(new CustomEvent("command-center:navigate", { detail: target }));
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-1.5 text-xs"
          style={{ background: "linear-gradient(90deg, #2563EB, #0F766E)", color: "white" }}>
          <Sparkles size={12} />
          本地单用户模式 - 使用内置经营数据跑通完整流程
          <button onClick={() => { exitDemo(); navigate("/login"); }} className="underline ml-2">返回入口</button>
        </div>
      )}

      <div
        className="flex min-h-screen flex-1 items-center justify-center p-6 min-[1180px]:hidden"
        style={{ paddingTop: isDemo ? 72 : 24 }}
      >
        <section className="max-w-sm rounded-xl border bg-white p-6 text-center shadow-sm" style={{ borderColor: "var(--border-default)" }}>
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-base font-semibold" style={{ color: "white", background: "linear-gradient(135deg, var(--brand), var(--brand-blue))" }}>
            数
          </div>
          <h1 className="mt-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>请使用电脑端大屏</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            {desktopWorkspaceNotice}
          </p>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            当前最小工作区宽度：{DESKTOP_WORKSPACE_MIN_WIDTH}px
          </p>
        </section>
      </div>

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full min-[1180px]:flex flex-col"
        style={{ width: 76, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-default)" }}>
        <div className="flex flex-col items-center px-3 py-5">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold"
            style={{ color: "white", background: "linear-gradient(135deg, var(--brand), var(--brand-blue))" }}
            onClick={() => handleDesktopNavigation("/")}
            title="数智经营指挥中心"
          >
            数
          </button>
          <p className="mt-2 text-[9px] tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>BI</p>
        </div>

        <nav className="flex-1 px-2 space-y-2">
          {desktopNavItems.map((item) => (
            <button
              key={item.path}
              title={item.label}
              className={`nav-item h-11 w-full justify-center px-0 ${isDesktopNavActive(item.path) ? "active" : ""}`}
              onClick={() => handleDesktopNavigation(item.path)}
            >
              <item.icon size={17} strokeWidth={1.6} />
            </button>
          ))}
        </nav>

        <div className="px-2 pb-2">
          <button className="flex h-11 w-full items-center justify-center rounded-xl cursor-pointer transition-all duration-300 border"
            style={{ background: isDark ? "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08))" : "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(15,118,110,0.06))", borderColor: isDark ? "rgba(37,99,235,0.2)" : "rgba(37,99,235,0.18)" }}
            onClick={() => handleDesktopNavigation("/assistant")}
            title="经营助手">
            <Bot size={16} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-2 pb-2">
          <button onClick={toggleTheme} title={isDark ? "浅色模式" : "深色模式"} className="flex h-11 w-full items-center justify-center rounded-lg transition-all duration-200" style={{ color: "var(--text-muted)" }}>
            {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
          </button>
        </div>

        <div className="px-2 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mb-3 flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(37, 99, 235, 0.12)" }} title={isDemo ? "本地工作台" : (user?.name || "未登录")}>
              <span className="text-xs" style={{ color: "var(--brand)" }}>{isDemo ? "本" : (user?.name || "U")[0]}</span>
            </div>
          </div>
          <button onClick={() => { if (isDemo) exitDemo(); else logout(); navigate("/login"); }}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: "var(--text-muted)" }} title={isDemo ? "返回入口" : "退出登录"}>
            <LogOut size={12} />
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="hidden min-h-screen flex-1 pt-0 min-[1180px]:ml-[76px] min-[1180px]:block"
        style={{ paddingTop: isDemo ? 72 : 56 }}>
        <Outlet />
      </main>

      {/* ═══ Toast Notifications ═══ */}
      <Toaster />
    </div>
  );
}
