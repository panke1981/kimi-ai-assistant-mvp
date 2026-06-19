import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  companies,
  conversations,
  actionTasks,
  diagnosisResults,
  diagnosisRules,
  evidenceItems,
  fieldDictionary,
  files,
  metrics,
  periods,
  reports,
  riskSignals,
} from "@db/schema";
import type { getDb } from "../queries/connection";

type Db = ReturnType<typeof getDb>;

function notFound(message = "Resource not found") {
  return new TRPCError({ code: "NOT_FOUND", message });
}

export async function assertCompanyOwner(db: Db, companyId: number, userId: number) {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
    .limit(1);

  if (!company) throw notFound("Company not found");
  return company;
}

export async function assertPeriodOwner(db: Db, periodId: number, userId: number) {
  const [period] = await db
    .select({ id: periods.id, companyId: periods.companyId, label: periods.label })
    .from(periods)
    .innerJoin(companies, eq(periods.companyId, companies.id))
    .where(and(eq(periods.id, periodId), eq(companies.userId, userId)))
    .limit(1);

  if (!period) throw notFound("Period not found");
  return period;
}

export async function assertFileOwner(db: Db, fileId: number, userId: number) {
  const [file] = await db
    .select({ id: files.id, companyId: files.companyId, periodId: files.periodId })
    .from(files)
    .innerJoin(companies, eq(files.companyId, companies.id))
    .where(and(eq(files.id, fileId), eq(companies.userId, userId)))
    .limit(1);

  if (!file) throw notFound("File not found");
  return file;
}

export async function assertFieldOwner(db: Db, fieldId: number, userId: number) {
  const [field] = await db
    .select({ id: fieldDictionary.id, companyId: fieldDictionary.companyId })
    .from(fieldDictionary)
    .innerJoin(companies, eq(fieldDictionary.companyId, companies.id))
    .where(and(eq(fieldDictionary.id, fieldId), eq(companies.userId, userId)))
    .limit(1);

  if (!field) throw notFound("Field not found");
  return field;
}

export async function assertReportOwner(db: Db, reportId: number, userId: number) {
  const [report] = await db
    .select({ id: reports.id, companyId: reports.companyId, periodId: reports.periodId })
    .from(reports)
    .innerJoin(companies, eq(reports.companyId, companies.id))
    .where(and(eq(reports.id, reportId), eq(companies.userId, userId)))
    .limit(1);

  if (!report) throw notFound("Report not found");
  return report;
}

export async function assertMetricCompanyOwner(db: Db, companyId: number, userId: number) {
  return assertCompanyOwner(db, companyId, userId);
}

export async function assertDiagnosisResultOwner(db: Db, diagnosisResultId: number, userId: number) {
  const [diagnosisResult] = await db
    .select({ id: diagnosisResults.id, companyId: diagnosisResults.companyId, periodId: diagnosisResults.periodId })
    .from(diagnosisResults)
    .innerJoin(companies, eq(diagnosisResults.companyId, companies.id))
    .where(and(eq(diagnosisResults.id, diagnosisResultId), eq(companies.userId, userId)))
    .limit(1);

  if (!diagnosisResult) throw notFound("Diagnosis result not found");
  return diagnosisResult;
}

export async function assertActionTaskOwner(db: Db, actionTaskId: number, userId: number) {
  const [task] = await db
    .select({ id: actionTasks.id, companyId: actionTasks.companyId, periodId: actionTasks.periodId, diagnosisResultId: actionTasks.diagnosisResultId })
    .from(actionTasks)
    .innerJoin(companies, eq(actionTasks.companyId, companies.id))
    .where(and(eq(actionTasks.id, actionTaskId), eq(companies.userId, userId)))
    .limit(1);

  if (!task) throw notFound("Action task not found");
  return task;
}

export async function deleteCompanyTree(db: Db, companyId: number) {
  const companyPeriods = await db
    .select({ id: periods.id })
    .from(periods)
    .where(eq(periods.companyId, companyId));
  const periodIds = companyPeriods.map((period) => period.id);

  await db.delete(conversations).where(eq(conversations.companyId, companyId));
  await db.delete(actionTasks).where(eq(actionTasks.companyId, companyId));
  await db.delete(evidenceItems).where(eq(evidenceItems.companyId, companyId));
  await db.delete(riskSignals).where(eq(riskSignals.companyId, companyId));
  await db.delete(diagnosisResults).where(eq(diagnosisResults.companyId, companyId));
  await db.delete(diagnosisRules).where(eq(diagnosisRules.companyId, companyId));
  await db.delete(fieldDictionary).where(eq(fieldDictionary.companyId, companyId));
  await db.delete(metrics).where(eq(metrics.companyId, companyId));
  await db.delete(reports).where(eq(reports.companyId, companyId));
  await db.delete(files).where(eq(files.companyId, companyId));

  for (const periodId of periodIds) {
    await db.delete(periods).where(eq(periods.id, periodId));
  }

  await db.delete(companies).where(eq(companies.id, companyId));
}
