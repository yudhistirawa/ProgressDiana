import { cookies } from "next/headers";
import { normalizeProject, type ProjectKey } from "./projects";

export function dashboardProject(requested?: string): ProjectKey {
  const role = cookies().get("role")?.value;
  if (role === "sampoerna") return "sampoerna";
  return normalizeProject(requested);
}

export function dashboardProjectOrUndefined(requested?: string): ProjectKey | undefined {
  const role = cookies().get("role")?.value;
  if (role === "sampoerna") return "sampoerna";
  return requested ? normalizeProject(requested) : undefined;
}

export function isDashboardProjectLocked(): boolean {
  return cookies().get("role")?.value === "sampoerna";
}
