import { describe, expect, it } from "vitest";

import { commandCenterWorkspaceRoutes } from "@/lib/command-center-routes";

describe("command center workspace routes", () => {
  it("keeps legacy workspace paths inside the single-screen command center", () => {
    expect(commandCenterWorkspaceRoutes).toEqual([
      { path: "/", props: {} },
      { path: "/files", props: { initialPanel: "upload" } },
      { path: "/fields", props: { initialPanel: "upload", initialUploadTab: "fields" } },
      { path: "/analysis", props: { initialFocus: "profit" } },
      { path: "/assistant", props: { initialFocus: "expense" } },
      { path: "/settings", props: { initialPanel: "settings" } },
    ]);
  });
});
