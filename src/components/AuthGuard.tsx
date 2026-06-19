import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth({ redirectOnUnauthenticated: false });
  const { isDemo } = useDemo();

  useEffect(() => {
    if (!isDemo && !isLoading && !isAuthenticated) {
      const returnPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?return=${returnPath}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, isDemo, navigate, location]);

  // Don't render anything until auth check is complete unless local workspace mode is active.
  if (isLoading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--border-default)", borderTopColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>加载中...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not in local workspace mode: show loading while redirect happens.
  if (!isAuthenticated && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--border-default)", borderTopColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>正在跳转登录...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
