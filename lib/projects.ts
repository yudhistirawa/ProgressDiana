export const PROJECT_KEYS = ["diana", "bungtomo", "bisma", "sampoerna"] as const;

export type ProjectKey = (typeof PROJECT_KEYS)[number];

export const PROJECTS: Record<ProjectKey, {
  label: string;
  fullLabel: string;
  configKey: string;
  progressCollection: string;
  notificationCollection: string;
}> = {
  diana: {
    label: "Diana",
    fullLabel: "Proyek Diana",
    configKey: "stages_config",
    progressCollection: "Progress_Diana",
    notificationCollection: "Progress_Diana_Notifikasi",
  },
  bungtomo: {
    label: "Bung Tomo",
    fullLabel: "Proyek Bung Tomo",
    configKey: "stages_config_bungtomo",
    progressCollection: "Progress_BungTomo",
    notificationCollection: "Progress_BungTomo_Notifikasi",
  },
  bisma: {
    label: "Bisma",
    fullLabel: "Proyek Bisma",
    configKey: "stages_config_bisma",
    progressCollection: "Progress_Bisma",
    notificationCollection: "Progress_Bisma_Notifikasi",
  },
  sampoerna: {
    label: "MR Sampoerna Medan",
    fullLabel: "Proyek MR Sampoerna Medan",
    configKey: "stages_config_sampoerna",
    progressCollection: "Progress_Sampoerna",
    notificationCollection: "Progress_Sampoerna_Notifikasi",
  },
};

export function isProjectKey(value: unknown): value is ProjectKey {
  return typeof value === "string" && PROJECT_KEYS.includes(value as ProjectKey);
}

export function normalizeProject(value: unknown, fallback: ProjectKey = "diana"): ProjectKey {
  return isProjectKey(value) ? value : fallback;
}

export function projectLabel(project: ProjectKey, full = false): string {
  return full ? PROJECTS[project].fullLabel : PROJECTS[project].label;
}
