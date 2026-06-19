import { createContext } from "react";

export interface DemoContextType {
  isDemo: boolean;
  demoCompany: { id: number; name: string } | null;
  startDemo: () => void;
  exitDemo: () => void;
}

export const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  demoCompany: null,
  startDemo: () => {},
  exitDemo: () => {},
});

