import type { DiagnosisDomain } from "@/lib/command-center-data";
import type { OverlayPanel, UploadOverlayTab } from "@/lib/command-center-view";

export interface CommandCenterRouteProps {
  initialPanel?: OverlayPanel;
  initialFocus?: DiagnosisDomain;
  initialUploadTab?: UploadOverlayTab;
}

export type CommandCenterWorkspacePath = "/" | "/files" | "/fields" | "/analysis" | "/assistant" | "/settings";

export interface CommandCenterWorkspaceRoute {
  path: CommandCenterWorkspacePath;
  props: CommandCenterRouteProps;
}

export const commandCenterWorkspaceRoutes = [
  { path: "/", props: {} },
  { path: "/files", props: { initialPanel: "upload" } },
  { path: "/fields", props: { initialPanel: "upload", initialUploadTab: "fields" } },
  { path: "/analysis", props: { initialFocus: "profit" } },
  { path: "/assistant", props: { initialFocus: "expense" } },
  { path: "/settings", props: { initialPanel: "settings" } },
] as const satisfies readonly CommandCenterWorkspaceRoute[];
