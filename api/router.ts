import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { companyRouter } from "./routers/company-router";
import { periodRouter } from "./routers/period-router";
import { fileRouter } from "./routers/file-router";
import { fieldRouter } from "./routers/field-router";
import { reportRouter, metricRouter } from "./routers/report-router";
import { aiRouter } from "./routers/ai-router";
import { parseRouter } from "./routers/parse-router";
import { aiSettingsRouter } from "./routers/ai-settings-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  company: companyRouter,
  period: periodRouter,
  file: fileRouter,
  field: fieldRouter,
  report: reportRouter,
  metric: metricRouter,
  ai: aiRouter,
  parse: parseRouter,
  aiSettings: aiSettingsRouter,
});

export type AppRouter = typeof appRouter;
