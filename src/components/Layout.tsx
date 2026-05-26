import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useDemo } from "./DemoProvider";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard, FolderOpen, BarChart3, Bot,
  Settings, Menu, X, LogOut, Sun, Moon, Sparkles,
} from "lucide-react";

const navItems = [
  { path: "/", label: "概览", icon: LayoutDashboard },
  { path: "/files", label: "资料", icon: FolderOpen },
  { path: "/analysis", label: "分析", icon: BarChart3 },
  { path: "/assistant", label: "助手", icon: Bot },
  { path: "/settings", label: "设置", icon: Settings },
];

const desktopNavItems = [
  { path: "/", label: "概览", icon: LayoutDashboard },
  { path: "/files", label: "资料库", icon: FolderOpen },
  { path: "/analysis", label: "经营分析", icon: BarChart3 },
  { path: "/assistant", label: "经营助手", icon: Bot },
  { path: "/settings", label: "模型设置", icon: Settings },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: false });
  const { isDark, toggleTheme } = useTheme();
  const { isDemo, exitDemo } = useDemo();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-1.5 text-xs"
          style={{ background: "linear-gradient(90deg, #A78BFA, #3B82F6)", color: "white" }}>
          <Sparkles size={12} />
          演示模式 - 使用测试数据体验全部功能
          <button onClick={() => { exitDemo(); navigate("/login"); }} className="underline ml-2">退出</button>
        </div>
      )}

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="fixed left-0 top-0 h-full z-50 hidden md:flex flex-col"
        style={{ width: 200, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-default)" }}>
        <div className="px-5 py-6">
          <h1 className="text-xl tracking-wider cursor-pointer font-extralight" style={{ color: "var(--text-primary)" }} onClick={() => navigate("/")}>数观</h1>
          <p className="text-[10px] mt-0.5 tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>DataPulse</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {desktopNavItems.map((item) => (
            <div key={item.path} className={`nav-item ${isActive(item.path) ? "active" : ""}`} onClick={() => navigate(item.path)}>
              <item.icon size={16} strokeWidth={1.5} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border"
            style={{ background: isDark ? "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(59,130,246,0.08))" : "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(59,130,246,0.06))", borderColor: isDark ? "rgba(167,139,250,0.2)" : "rgba(167,139,250,0.25)" }}
            onClick={() => navigate("/assistant")}>
            <Bot size={16} style={{ color: "var(--brand)" }} strokeWidth={1.5} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>AI 经营助手</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>随时提问</p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-2">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full transition-all duration-200" style={{ color: "var(--text-muted)" }}>
            {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
            <span className="text-sm">{isDark ? "浅色模式" : "深色模式"}</span>
          </button>
        </div>

        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.15)" }}>
              <span className="text-xs" style={{ color: "var(--brand)" }}>{isDemo ? "D" : (user?.name || "U")[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{isDemo ? "演示用户" : (user?.name || "未登录")}</p>
            </div>
          </div>
          <button onClick={() => { isDemo ? exitDemo() : logout(); navigate("/login"); }}
            className="flex items-center gap-2 text-xs transition-colors" style={{ color: "var(--text-muted)" }}>
            <LogOut size={12} />
            <span>{isDemo ? "退出演示" : "退出"}</span>
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Top Bar ═══ */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between px-4 h-14"
        style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-default)", top: isDemo ? 28 : 0 }}>
        <button onClick={() => setMenuOpen(true)} className="p-2 -ml-2" style={{ color: "var(--text-secondary)" }}>
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <h1 className="text-sm font-medium tracking-wider" style={{ color: "var(--text-primary)" }} onClick={() => navigate("/")}>数观</h1>
        <div className="w-8" />
      </header>

      {/* ═══ Mobile Menu Overlay ═══ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col"
            style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-default)" }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <h1 className="text-lg tracking-wider font-extralight" style={{ color: "var(--text-primary)" }}>数观</h1>
                <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>DataPulse</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2" style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 pt-3 space-y-1">
              {desktopNavItems.map((item) => (
                <div key={item.path} className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}>
                  <item.icon size={16} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>

            <div className="px-3 pb-2">
              <button onClick={() => { toggleTheme(); }} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full" style={{ color: "var(--text-muted)" }}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                <span className="text-sm">{isDark ? "浅色模式" : "深色模式"}</span>
              </button>
            </div>

            <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(167, 139, 250, 0.15)" }}>
                  <span className="text-xs" style={{ color: "var(--brand)" }}>{isDemo ? "D" : (user?.name || "U")[0]}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{isDemo ? "演示用户" : (user?.name || "未登录")}</p>
              </div>
              <button onClick={() => { isDemo ? exitDemo() : logout(); navigate("/login"); }}
                className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <LogOut size={12} />
                <span>{isDemo ? "退出演示" : "退出"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 md:ml-[200px] min-h-screen pt-14 md:pt-0"
        style={{ paddingTop: isDemo ? 72 : 56 }}>
        <Outlet />
      </main>

      {/* ═══ Toast Notifications ═══ */}
      <Toaster />

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around h-16 px-2"
        style={{ background: "var(--bg-sidebar)", borderTop: "1px solid var(--border-default)", backdropFilter: "blur(20px)" }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-lg transition-colors"
              style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}>
              <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] scale-90">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
