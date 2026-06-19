# 交接说明

## 当前状态

MVP 已整理为电脑端单屏「经营指挥中心」：

- 主入口：`src/pages/CommandCenter.tsx`
- 主布局：`src/components/Layout.tsx`
- 指挥中心组件：`src/components/command-center/`
- 本地样例数据和诊断模型：`src/lib/demo-data.ts`、`src/lib/command-center-data.ts`、`src/lib/diagnosis-engine.ts`
- 大屏约束：最小工作区宽度 `1180px`，小屏只显示电脑端大屏提示，不再维护手机导航。

旧的多页面主流程已经移除。兼容路由仍保留，但都会落到同一个工作台：

- `/`：经营画布
- `/files`：打开数据资产浮窗的「上传资料」
- `/fields`：打开数据资产浮窗的「字段确认」
- `/analysis`：聚焦经营分析上下文
- `/assistant`：聚焦 AI 策略分析师上下文
- `/settings`：打开设置中心浮窗

## 交互模型

- `Cmd/Ctrl + K` 聚焦顶部命令栏。
- 命令建议可打开上传资料、字段确认、数据质量、设置中心和经营复盘报告。
- `Esc` 关闭命令面板和浮窗。
- 点击遮罩可关闭上传、设置和报告浮窗。
- 字段确认浮窗支持确认/忽略字段；本地单用户模式只做临时状态更新，真实模式调用 `field.confirm` 保存。
- 右侧策略分析师的“生成任务草稿”会让推荐动作进入执行跟踪，顶部采纳/待验证计数、执行画布和报告浮窗会同步状态。
- 左侧导航高亮、顶部工作区标签、命令栏动作、顶部按钮状态保持同步。

## 验收命令

```bash
npm run check
npm run lint
npm run test
npm run build
```

当前预期：

- `npm run check`：通过
- `npm run lint`：通过，0 warning
- `npm run test`：通过，14 files / 45 tests
- `npm run build`：通过，前端已按 charts、xlsx、data、ui 做基础分包

`npm run check` 使用无增量 TypeScript 检查，不写 `node_modules/.tmp/*.tsbuildinfo`，便于在受限本地环境和 CI 中稳定运行。

## 浏览器烟测

1. 打开 `http://127.0.0.1:3000/`。
2. 如果仍在登录页，点击 `进入数智经营工作台`。
3. 确认出现单屏经营指挥中心。
4. 按 `Cmd/Ctrl + K`。
5. 输入 `字段确认`，确认数据资产浮窗打开并切到字段确认。
6. 关闭浮窗后再次按 `Cmd/Ctrl + K`。
7. 输入 `报告`，确认经营复盘报告浮窗打开。
8. 临时切到 `1100px` 宽度，确认显示电脑端大屏提示而不是手机导航。
9. 确认浏览器控制台无 error。

## 已知后续事项

- MVP 阶段 API Key 仍以明文存数据库；生产化前必须加密或接入密钥管理服务。
- 真实模式需要用 MySQL、Kimi OAuth 和真实 Excel/CSV 做长链路测试。
- 前端已做基础分包；后续可继续做路由级懒加载和首屏性能 profiling。
- 本阶段只验收电脑端大屏体验，`1180px` 以下显示提示页，移动端不在范围内。
