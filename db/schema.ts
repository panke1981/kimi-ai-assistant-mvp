import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  json,
  decimal,
  int,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Companies ───────────────────────────────────────────
export const companies = mysqlTable("companies", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  businessType: varchar("businessType", { length: 100 }),
  goals: text("goals"),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ─── Periods (Month/Quarter) ─────────────────────────────
export const periods = mysqlTable("periods", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  label: varchar("label", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["month", "quarter", "year"]).default("month").notNull(),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  status: mysqlEnum("status", ["open", "analyzing", "completed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Period = typeof periods.$inferSelect;
export type InsertPeriod = typeof periods.$inferInsert;

// ─── Files ───────────────────────────────────────────────
export const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  periodId: bigint("periodId", { mode: "number", unsigned: true }).notNull(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileType: mysqlEnum("fileType", [
    "financial",
    "bank_statement",
    "sales",
    "inventory",
    "contract",
    "ad_spend",
    "other",
  ]).default("other").notNull(),
  size: int("size"),
  status: mysqlEnum("status", ["uploading", "processing", "processed", "error"])
    .default("uploading")
    .notNull(),
  aiRecognizedFields: json("aiRecognizedFields"),
  confirmedFields: json("confirmedFields"),
  storagePath: varchar("storagePath", { length: 500 }),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

// ─── Field Dictionary ────────────────────────────────────
export const fieldDictionary = mysqlTable("field_dictionary", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  originalField: varchar("originalField", { length: 255 }).notNull(),
  mappedField: varchar("mappedField", { length: 255 }),
  fieldType: mysqlEnum("fieldType", [
    "revenue",
    "cost",
    "expense",
    "profit",
    "quantity",
    "price",
    "date",
    "text",
    "unknown",
  ]).default("unknown").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  isConfirmed: mysqlEnum("isConfirmed", ["pending", "confirmed", "ignored"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FieldDictionary = typeof fieldDictionary.$inferSelect;
export type InsertFieldDictionary = typeof fieldDictionary.$inferInsert;

// ─── Reports ─────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  periodId: bigint("periodId", { mode: "number", unsigned: true }).notNull(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["monthly", "quarterly", "yearly", "custom"])
    .default("monthly")
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  insights: json("insights"),
  risks: json("risks"),
  suggestions: json("suggestions"),
  dataGaps: json("dataGaps"),
  chartData: json("chartData"),
  status: mysqlEnum("status", ["generating", "completed", "error"])
    .default("generating")
    .notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Metrics ─────────────────────────────────────────────
export const metrics = mysqlTable("metrics", {
  id: serial("id").primaryKey(),
  periodId: bigint("periodId", { mode: "number", unsigned: true }).notNull(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", [
    "revenue",
    "cost",
    "expense",
    "profit",
    "cashflow",
    "efficiency",
    "growth",
    "other",
  ]).default("other").notNull(),
  value: decimal("value", { precision: 18, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  changePercent: decimal("changePercent", { precision: 8, scale: 4 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

// ─── Conversations ───────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: serial("id").primaryKey(),
  companyId: bigint("companyId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["chat", "insight", "action"]).default("chat").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── AI Settings ─────────────────────────────────────────
export const aiSettings = mysqlTable("ai_settings", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  provider: mysqlEnum("provider", ["openai", "deepseek", "custom"]).default("openai").notNull(),
  apiKey: varchar("apiKey", { length: 500 }),
  baseUrl: varchar("baseUrl", { length: 500 }),
  model: varchar("model", { length: 100 }),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull().$onUpdate(() => new Date()),
});

export type AiSetting = typeof aiSettings.$inferSelect;
export type InsertAiSetting = typeof aiSettings.$inferInsert;
