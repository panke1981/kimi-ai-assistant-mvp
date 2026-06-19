import { describe, expect, it } from "vitest";

import {
  DESKTOP_WORKSPACE_MIN_WIDTH,
  desktopWorkspaceNotice,
  isDesktopWorkspaceWidth,
} from "@/lib/desktop-workspace";

describe("desktop workspace constraints", () => {
  it("documents that the command center is a large-screen desktop workspace", () => {
    expect(DESKTOP_WORKSPACE_MIN_WIDTH).toBe(1180);
    expect(isDesktopWorkspaceWidth(1179)).toBe(false);
    expect(isDesktopWorkspaceWidth(1180)).toBe(true);
    expect(desktopWorkspaceNotice).toContain("电脑端大屏");
  });
});
