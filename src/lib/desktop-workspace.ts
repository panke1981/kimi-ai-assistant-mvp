export const DESKTOP_WORKSPACE_MIN_WIDTH = 1180;

export const desktopWorkspaceNotice = "数智经营指挥中心当前按电脑端大屏设计，请使用宽度 1180px 以上的屏幕访问。";

export function isDesktopWorkspaceWidth(width: number) {
  return width >= DESKTOP_WORKSPACE_MIN_WIDTH;
}
