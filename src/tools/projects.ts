import {
  createProject,
  getProject,
  listProjects,
  projectAnalytics,
  updateProject,
} from "../store.js";
import type { ProjectStatus } from "../types.js";

export function runProjectCreate(args: {
  id?: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
}) {
  return {
    created: true,
    project: createProject(args),
  };
}

export function runProjectGet(args: { project_id: string }) {
  const project = getProject(args.project_id);
  return project ? { project } : { error: `Project not found: ${args.project_id}` };
}

export function runProjectList(args: { status?: ProjectStatus; limit?: number }) {
  return { projects: listProjects(args) };
}

export function runProjectUpdate(args: {
  project_id: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  metadata?: Record<string, unknown> | null;
}) {
  const project = updateProject(args.project_id, {
    ...(args.name === undefined ? {} : { name: args.name }),
    ...(args.description === undefined ? {} : { description: args.description }),
    ...(args.status === undefined ? {} : { status: args.status }),
    ...(args.metadata === undefined ? {} : { metadata: args.metadata }),
  });
  return project ? { updated: true, project } : { error: `Project not found: ${args.project_id}` };
}

export function runProjectAnalytics(args: { project_id: string; from?: string; to?: string }) {
  const to = args.to ?? new Date().toISOString();
  const from = args.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
  const analytics = projectAnalytics({ projectId: args.project_id, from, to });
  return analytics ? { analytics } : { error: `Project not found: ${args.project_id}` };
}
