import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { fieldDictionary } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { assertCompanyOwner, assertFieldOwner } from "../lib/ownership";

export const fieldRouter = createRouter({
  list: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      return db
        .select()
        .from(fieldDictionary)
        .where(eq(fieldDictionary.companyId, input.companyId))
        .orderBy(fieldDictionary.createdAt);
    }),

  getByOriginalField: authedQuery
    .input(z.object({ companyId: z.number(), originalField: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const [field] = await db
        .select()
        .from(fieldDictionary)
        .where(
          and(
            eq(fieldDictionary.companyId, input.companyId),
            eq(fieldDictionary.originalField, input.originalField)
          )
        )
        .limit(1);
      return field ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        originalField: z.string().min(1),
        mappedField: z.string().optional(),
        fieldType: z.enum([
          "revenue",
          "cost",
          "expense",
          "profit",
          "quantity",
          "price",
          "date",
          "text",
          "unknown",
        ]),
        confidence: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const [field] = await db
        .insert(fieldDictionary)
        .values({
          companyId: input.companyId,
          originalField: input.originalField,
          mappedField: input.mappedField,
          fieldType: input.fieldType,
          confidence: input.confidence ? String(input.confidence) : null,
          isConfirmed: "pending",
        })
        .$returningId();
      return { id: field.id };
    }),

  confirm: authedQuery
    .input(
      z.object({
        id: z.number(),
        mappedField: z.string().optional(),
        fieldType: z.enum([
          "revenue",
          "cost",
          "expense",
          "profit",
          "quantity",
          "price",
          "date",
          "text",
          "unknown",
        ]),
        isConfirmed: z.enum(["confirmed", "ignored"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await assertFieldOwner(db, id, ctx.user.id);
      await db
        .update(fieldDictionary)
        .set(data)
        .where(eq(fieldDictionary.id, id));
      return { success: true };
    }),

  batchCreate: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        fields: z.array(
          z.object({
            originalField: z.string(),
            mappedField: z.string().optional(),
            fieldType: z.string(),
            confidence: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const values = input.fields.map((f) => ({
        companyId: input.companyId,
        originalField: f.originalField,
        mappedField: f.mappedField,
        fieldType: f.fieldType as "revenue" | "cost" | "expense" | "profit" | "quantity" | "price" | "date" | "text" | "unknown",
        confidence: f.confidence ? String(f.confidence) : null,
        isConfirmed: "pending" as const,
      }));
      await db.insert(fieldDictionary).values(values);
      return { success: true };
    }),
});
