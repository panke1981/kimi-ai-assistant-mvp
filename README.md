# 数智经营 MVP

数智经营是一个面向中小企业的企业数字经营分析系统。当前 MVP 已整理为单屏「经营指挥中心」：用户在一个大屏工作台内查看经营总览、定位风险、追问分析师、采纳行动任务，并通过浮窗完成数据上传、字段确认、数据质量检查、模型设置和报告生成。

当前工作台只面向电脑端大屏，最小工作区宽度为 `1180px`。小屏访问会显示大屏提示，不维护手机导航和移动端适配。

## 技术栈

- 前端：Vite、React 19、React Router、Tailwind CSS、Radix UI、Recharts
- 后端：Hono、tRPC、Zod
- 数据库：MySQL、Drizzle ORM
- 文件解析：xlsx
- AI：用户配置的 OpenAI-compatible API，未配置时使用内置规则引擎兜底

## 目录说明

- `src/`：前端工作台、组件、hooks、工具函数
- `api/`：Hono/tRPC 后端入口、路由、鉴权、AI 调用
- `db/`：Drizzle schema、关系、迁移
- `contracts/`：前后端共享常量和类型
- `shuzhi-ppt/`：产品演示材料

## 当前产品形态

主应用入口统一为 `CommandCenter` 单屏工作台：

- 左侧：诊断图层、最近分析轨迹、数据资产概览
- 中间：经营画布，支持经营总览、风险定位、执行跟踪三种模式
- 右侧：AI 策略分析师，可追问、采纳动作、生成任务草稿
- 顶部：`⌘K / Ctrl+K` 命令栏，可搜索风险、任务，或打开上传/字段/质量/设置/报告浮窗

兼容路由仍保留，但都落到同一个工作台：

- `/`：经营总览
- `/files`：打开数据资产浮窗的上传资料 tab
- `/fields`：打开数据资产浮窗的字段确认 tab
- `/analysis`：切到经营分析上下文
- `/assistant`：切到经营助手上下文
- `/settings`：打开设置中心浮窗

## 本地启动

```bash
npm install
cp .env.example .env
npm run dev
```

打开 `http://127.0.0.1:4314/`。没有配置 Kimi OAuth 和数据库时，可以在登录页点击“进入数智经营工作台”进入本地单用户模式，查看完整样例数据和交互链路。

## 环境变量

`.env.example` 中列出了所有变量。真实模式至少需要：

```bash
APP_ID=your-kimi-app-id
APP_SECRET=your-kimi-app-secret
DATABASE_URL=mysql://user:password@host:3306/shuzhi_business
KIMI_AUTH_URL=https://...
KIMI_OPEN_URL=https://...
UPLOAD_DIR=./uploads
```

`OWNER_UNION_ID` 可选，用于把首次匹配的 Kimi 用户设为 admin。`AUTH_BYPASS=true` 只在 `NODE_ENV=staging` 下生效，用于测试环境跳过 Kimi OAuth，生产环境不会启用。

## 数据库

配置 `DATABASE_URL` 后执行：

```bash
npm run db:generate
npm run db:migrate
```

开发阶段也可以用：

```bash
npm run db:push
```

## 本地单用户模式

本地单用户模式只使用前端内置样例数据，不写数据库，也不会保存上传文件或 API Key 设置。当前覆盖：

- 经营总览
- 数据资产浮窗：上传资料、字段确认、数据质量
- 风险定位和经营分析
- 右侧 AI 策略分析师追问
- 执行跟踪、采纳动作、完成验证
- 设置中心浮窗
- 经营复盘报告浮窗

## AI 模型设置

用户可在“模型设置”中配置 OpenAI、DeepSeek 或自定义 OpenAI-compatible API。MVP 阶段 API Key 仍存入数据库，但接口不会向前端回显明文，只返回是否已配置和脱敏尾号。生产化前应接入加密存储或密钥管理服务。

## 常用命令

```bash
npm run check
npm run lint
npm run test
npm run build
npm run start
```

`npm run check` 使用三个无增量 TypeScript project 检查，不写 `node_modules/.tmp`，便于在受限本地环境和 CI 中稳定运行。

`npm run build` 会先构建前端，再把 `api/boot.ts` 打包到 `dist/boot.js`。生产启动使用：

```bash
NODE_ENV=production node dist/boot.js
```

## 交接说明

当前实现状态、浏览器烟测路径和后续生产化事项记录在 `HANDOFF.md`。
