import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { companies, periods } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const companyRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(companies)
      .where(eq(companies.userId, ctx.user.id))
      .orderBy(desc(companies.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.id))
        .limit(1);
      return company ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        industry: z.string().optional(),
        businessType: z.string().optional(),
        goals: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [company] = await db
        .insert(companies)
        .values({
          userId: ctx.user.id,
          name: input.name,
          industry: input.industry,
          businessType: input.businessType,
          goals: input.goals,
        })
        .$returningId();

      // Auto-create current month period
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      await db.insert(periods).values({
        companyId: company.id,
        label: `${year}-${month}`,
        type: "month",
        status: "open",
      });

      return { id: company.id };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        industry: z.string().optional(),
        businessType: z.string().optional(),
        goals: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(companies).set(data).where(eq(companies.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(companies).where(eq(companies.id, input.id));
      return { success: true };
    }),
});
