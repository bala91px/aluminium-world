import type { JobStatus, QuoteStatus, StageStatus } from "./types";

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  sent: "Sent to customer",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const QUOTE_STATUS_COLOR: Record<QuoteStatus, "zinc" | "amber" | "green" | "blue" | "red" | "purple"> = {
  pending_approval: "amber",
  approved: "blue",
  sent: "blue",
  accepted: "green",
  rejected: "red",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  active: "Active",
  blocked: "Blocked",
  completed: "Completed",
};

export const JOB_STATUS_COLOR: Record<JobStatus, "zinc" | "amber" | "green" | "blue" | "red" | "purple"> = {
  active: "blue",
  blocked: "red",
  completed: "green",
};

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export const STAGE_STATUS_COLOR: Record<StageStatus, "zinc" | "amber" | "green" | "blue" | "red" | "purple"> = {
  pending: "zinc",
  in_progress: "blue",
  done: "green",
  blocked: "red",
};
