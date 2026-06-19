export interface TaskExecutionSummary {
  acceptedTaskCount: number;
  completedTaskCount: number;
  pendingVerificationCount: number;
}

export function addTrackedTaskId(taskIds: string[], taskId: string) {
  return taskIds.includes(taskId) ? taskIds : [...taskIds, taskId];
}

export function summarizeTaskExecution(acceptedTaskIds: string[], completedTaskIds: string[]): TaskExecutionSummary {
  const completedAcceptedCount = acceptedTaskIds.filter((id) => completedTaskIds.includes(id)).length;
  return {
    acceptedTaskCount: acceptedTaskIds.length,
    completedTaskCount: completedAcceptedCount,
    pendingVerificationCount: Math.max(acceptedTaskIds.length - completedAcceptedCount, 0),
  };
}
