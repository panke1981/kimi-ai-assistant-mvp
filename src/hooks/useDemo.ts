import { useContext } from "react";
import { DemoContext } from "@/lib/demo-context";

export function useDemo() {
  return useContext(DemoContext);
}

