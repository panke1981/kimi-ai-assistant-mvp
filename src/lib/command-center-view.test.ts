import { describe, expect, it } from "vitest";

import {
  buildAnalysisTrailEntry,
  buildStrategistAnswer,
  commandActionOptions,
  canvasModeOptions,
  findRelatedEvidence,
  getCanvasModeForSelection,
  getCanvasModeMeta,
  isSummaryReasonSelectionActive,
  rankStrategistActions,
  resolveSummaryReasonSelection,
  updateAnalysisTrail,
  type AnalysisTrailEntry,
  toFieldStatus,
} from "@/lib/command-center-view";
import { commandCenterModel } from "@/lib/command-center-data";
import type { EvidenceItem } from "@/lib/diagnosis-engine";

const evidence: EvidenceItem[] = [
  {
    id: "ev-cashflow",
    title: "现金流净额变化",
    source: "银行流水 / 实收金额",
    value: "-6.8%",
    note: "现金流弱于收入增长。",
  },
  {
    id: "ev-revenue",
    title: "收入环比变化",
    source: "销售数据 / 营业收入",
    value: "+12.5%",
    note: "收入增长。",
  },
];

describe("command-center-view helpers", () => {
  it("normalizes field confirmation status", () => {
    expect(toFieldStatus("confirmed")).toBe("confirmed");
    expect(toFieldStatus("ignored")).toBe("ignored");
    expect(toFieldStatus("unexpected")).toBe("pending");
  });

  it("finds evidence related to metrics and falls back when no match exists", () => {
    expect(findRelatedEvidence(evidence, ["现金流净额"], [evidence[1]])).toEqual([evidence[0]]);
    expect(findRelatedEvidence(evidence, ["库存周转"], [evidence[1]])).toEqual([evidence[1]]);
  });

  it("ranks strategist actions by the selected diagnosis domain", () => {
    expect(rankStrategistActions(commandCenterModel.actionTasks, { kind: "diagnosis", id: "revenue" })[0]?.id).toBe("task-retention");
    expect(rankStrategistActions(commandCenterModel.actionTasks, { kind: "diagnosis", id: "profit" })[0]?.id).toBe("task-marketing-roi");
    expect(rankStrategistActions(commandCenterModel.actionTasks, { kind: "diagnosis", id: "cashflow" })[0]?.id).toBe("task-receivable");
  });

  it("prioritizes exact task and risk metric matches for strategist actions", () => {
    expect(rankStrategistActions(commandCenterModel.actionTasks, { kind: "task", id: "task-receivable" })[0]?.id).toBe("task-receivable");
    expect(
      rankStrategistActions(commandCenterModel.actionTasks, {
        kind: "risk",
        id: "risk-marketing-efficiency",
        relatedMetrics: ["营销费用", "渠道收入", "成交率", "复购率"],
      })[0]?.id,
    ).toBe("task-marketing-roi");
  });

  it("resolves summary reasons into analysis selections", () => {
    expect(resolveSummaryReasonSelection(0, commandCenterModel.riskSignals)).toEqual({ kind: "diagnosis", id: "revenue" });
    expect(resolveSummaryReasonSelection(1, commandCenterModel.riskSignals)).toEqual({ kind: "diagnosis", id: "profit" });
    expect(resolveSummaryReasonSelection(2, commandCenterModel.riskSignals)).toEqual({ kind: "risk", id: "risk-marketing-efficiency" });
    expect(resolveSummaryReasonSelection(3, commandCenterModel.riskSignals)).toEqual({ kind: "risk", id: "risk-retention" });
  });

  it("marks the matching summary reason as active", () => {
    expect(isSummaryReasonSelectionActive(0, { kind: "diagnosis", id: "revenue" })).toBe(true);
    expect(isSummaryReasonSelectionActive(2, { kind: "risk", id: "risk-marketing-efficiency" })).toBe(true);
    expect(isSummaryReasonSelectionActive(3, { kind: "risk", id: "risk-retention" })).toBe(true);
    expect(isSummaryReasonSelectionActive(1, { kind: "diagnosis", id: "revenue" })).toBe(false);
  });

  it("builds readable analysis trail entries for different selection types", () => {
    expect(buildAnalysisTrailEntry({ kind: "diagnosis", id: "cashflow" }, commandCenterModel)).toMatchObject({
      key: "diagnosis:cashflow",
      label: "诊断",
      title: "现金流诊断",
    });
    expect(buildAnalysisTrailEntry({ kind: "risk", id: "risk-cashflow" }, commandCenterModel)).toMatchObject({
      key: "risk:risk-cashflow",
      label: "风险",
      title: "现金流风险",
    });
    expect(buildAnalysisTrailEntry({ kind: "task", id: "task-receivable" }, commandCenterModel)).toMatchObject({
      key: "task:task-receivable",
      label: "任务",
      title: "优先跟进大额应收款",
    });
  });

  it("deduplicates and limits analysis trail entries", () => {
    const selections = [
      { kind: "diagnosis", id: "revenue" },
      { kind: "risk", id: "risk-cashflow" },
      { kind: "task", id: "task-receivable" },
      { kind: "diagnosis", id: "profit" },
      { kind: "risk", id: "risk-retention" },
      { kind: "diagnosis", id: "cashflow" },
      { kind: "task", id: "task-receivable" },
    ] as const;

    const trail = selections.reduce(
      (items, selection) => updateAnalysisTrail(items, buildAnalysisTrailEntry(selection, commandCenterModel)),
      [] as AnalysisTrailEntry[],
    );

    expect(trail.map((item) => item.key)).toEqual([
      "task:task-receivable",
      "diagnosis:cashflow",
      "risk:risk-retention",
      "diagnosis:profit",
      "risk:risk-cashflow",
    ]);
  });

  it("defines focused canvas modes for overview, risk and execution work", () => {
    expect(canvasModeOptions.map((option) => option.id)).toEqual(["overview", "risk", "actions"]);
    expect(getCanvasModeMeta("overview")).toMatchObject({
      title: "经营总览",
      actionLabel: "查看全局态势",
    });
    expect(getCanvasModeMeta("risk")).toMatchObject({
      title: "风险定位",
      actionLabel: "聚焦风险信号",
    });
    expect(getCanvasModeMeta("actions")).toMatchObject({
      title: "执行跟踪",
      actionLabel: "推进任务闭环",
    });
  });

  it("maps strategist selections to the most useful canvas mode", () => {
    expect(getCanvasModeForSelection({ kind: "diagnosis", id: "cashflow" })).toBe("overview");
    expect(getCanvasModeForSelection({ kind: "risk", id: "risk-cashflow" })).toBe("risk");
    expect(getCanvasModeForSelection({ kind: "task", id: "task-receivable" })).toBe("actions");
  });

  it("defines command palette actions for floating workspace panels", () => {
    expect(commandActionOptions.map((option) => option.id)).toEqual(["upload", "fields", "quality", "settings", "report"]);
    expect(commandActionOptions.map((option) => option.overlay)).toEqual(["upload", "upload", "upload", "settings", "report"]);
    expect(commandActionOptions[0]).toMatchObject({
      title: "上传数据",
      keywords: expect.arrayContaining(["上传", "Excel", "CSV"]),
    });
    expect(commandActionOptions[1]).toMatchObject({
      title: "字段确认",
      uploadTab: "fields",
      keywords: expect.arrayContaining(["字段", "映射"]),
    });
  });

  it("answers task execution prompts with concrete steps and validation metrics", () => {
    const task = commandCenterModel.actionTasks.find((item) => item.id === "task-receivable");
    expect(task).toBeTruthy();

    const answer = buildStrategistAnswer({
      question: "把这个任务拆成 3 个执行步骤",
      task,
      evidence: commandCenterModel.evidenceItems,
      actions: commandCenterModel.actionTasks,
    });

    expect(answer).toContain("1.");
    expect(answer).toContain(task?.owner);
    expect(answer).toContain(task?.metrics[0]);
  });

  it("answers risk root-cause prompts with rule, evidence and first action", () => {
    const risk = commandCenterModel.riskSignals.find((item) => item.id === "risk-cashflow");
    const action = commandCenterModel.actionTasks.find((item) => item.id === "task-receivable");
    expect(risk).toBeTruthy();
    expect(action).toBeTruthy();

    const answer = buildStrategistAnswer({
      question: "这个风险最可能的根因是什么？",
      risk,
      evidence: commandCenterModel.evidenceItems,
      actions: action ? [action] : [],
    });

    expect(answer).toContain(risk?.rule);
    expect(answer).toContain("根因");
    expect(answer).toContain(action?.title);
  });

  it("answers diagnosis data-gap prompts with evidence and missing checks", () => {
    const diagnosis = commandCenterModel.diagnosisBlocks.find((item) => item.id === "revenue");
    expect(diagnosis).toBeTruthy();

    const answer = buildStrategistAnswer({
      question: "还有哪些数据会影响结论？",
      diagnosis,
      evidence: commandCenterModel.evidenceItems.filter((item) => diagnosis?.evidenceIds.includes(item.id)),
      actions: commandCenterModel.actionTasks,
    });

    expect(answer).toContain(diagnosis?.title);
    expect(answer).toContain("还需要");
    expect(answer).toContain("字段");
  });
});
