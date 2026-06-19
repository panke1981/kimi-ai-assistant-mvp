import { describe, expect, it } from "vitest";

import {
  addTrackedTaskId,
  summarizeTaskExecution,
} from "@/lib/task-execution-workflow";

describe("task execution workflow", () => {
  it("adds a task to execution tracking once", () => {
    expect(addTrackedTaskId([], "task-a")).toEqual(["task-a"]);
    expect(addTrackedTaskId(["task-a"], "task-a")).toEqual(["task-a"]);
    expect(addTrackedTaskId(["task-a"], "task-b")).toEqual(["task-a", "task-b"]);
  });

  it("summarizes accepted, completed and pending verification counts", () => {
    expect(summarizeTaskExecution(["task-a", "task-b"], ["task-b"])).toEqual({
      acceptedTaskCount: 2,
      completedTaskCount: 1,
      pendingVerificationCount: 1,
    });
  });
});
