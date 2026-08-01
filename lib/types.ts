export type ProjectStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export interface ProjectSummary {
  id: string;
  title: string;
  client: string;
  status: ProjectStatus;
  priority: Priority;
  progressPercentage: number;
  createdAt: string;
  taskCount: number;
  completedTaskCount: number;
  activeWorkerCount: number;
}

export interface ActiveWorkSession {
  id: string;
  userId: string;
  projectId: string;
  clockIn: string;
  clockOut: string | null;
  durationMins: number | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  project?: { id: string; title: string; client: string };
}

export interface DashboardStats {
  totalProjects: number;
  activeSessions: number;
  completedTasks: number;
  totalHoursLogged: number;
}

export interface ActivityEvent {
  id: string;
  type: "clock-in" | "clock-out";
  userName: string;
  projectTitle: string;
  at: string;
}
