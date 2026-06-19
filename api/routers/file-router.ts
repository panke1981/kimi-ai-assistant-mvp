import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { files } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { env } from "../lib/env";
import { assertCompanyOwner, assertFileOwner, assertPeriodOwner } from "../lib/ownership";

const UPLOAD_DIR = env.uploadDir;

export const fileRouter = createRouter({
  list: authedQuery
    .input(z.object({ periodId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertPeriodOwner(db, input.periodId, ctx.user.id);
      return db
        .select()
        .from(files)
        .where(eq(files.periodId, input.periodId))
        .orderBy(desc(files.createdAt));
    }),

  upload: authedQuery
    .input(
      z.object({
        periodId: z.number(),
        companyId: z.number(),
        name: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        fileType: z.enum([
          "financial",
          "bank_statement",
          "sales",
          "inventory",
          "contract",
          "ad_spend",
          "other",
        ]),
        size: z.number(),
        base64Content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertCompanyOwner(db, input.companyId, ctx.user.id);
      const period = await assertPeriodOwner(db, input.periodId, ctx.user.id);
      if (period.companyId !== input.companyId) {
        throw new Error("Period does not belong to company");
      }

      await mkdir(join(UPLOAD_DIR, String(input.periodId)), { recursive: true });

      const buffer = Buffer.from(input.base64Content, "base64");
      const storagePath = join(
        UPLOAD_DIR,
        String(input.periodId),
        `${Date.now()}_${input.name}`
      );

      await writeFile(storagePath, buffer);

      const [file] = await db
        .insert(files)
        .values({
          periodId: input.periodId,
          companyId: input.companyId,
          name: input.name,
          originalName: input.originalName,
          mimeType: input.mimeType,
          fileType: input.fileType,
          size: input.size,
          status: "processing",
          storagePath,
        })
        .$returningId();

      return { id: file.id, storagePath };
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["uploading", "processing", "processed", "error"]),
        aiRecognizedFields: z.any().optional(),
        confirmedFields: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await assertFileOwner(db, id, ctx.user.id);
      await db.update(files).set(data).where(eq(files.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertFileOwner(db, input.id, ctx.user.id);
      await db.delete(files).where(eq(files.id, input.id));
      return { success: true };
    }),

  getContent: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await assertFileOwner(db, input.id, ctx.user.id);
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, input.id))
        .limit(1);
      if (!file || !file.storagePath) return null;
      try {
        const content = await readFile(file.storagePath, "utf-8");
        return { content, mimeType: file.mimeType, originalName: file.originalName };
      } catch {
        return null;
      }
    }),
});
