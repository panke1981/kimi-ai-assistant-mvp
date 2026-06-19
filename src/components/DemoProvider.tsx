import { useCallback, useState, type ReactNode } from "react";
import { DemoContext } from "@/lib/demo-context";
import { DEMO_COMPANY } from "@/lib/demo-data";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => {
    return sessionStorage.getItem("demo_mode") === "true";
  });
  const [demoCompany] = useState(DEMO_COMPANY);

  const startDemo = useCallback(() => {
    sessionStorage.setItem("demo_mode", "true");
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem("demo_mode");
    setIsDemo(false);
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoCompany, startDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

