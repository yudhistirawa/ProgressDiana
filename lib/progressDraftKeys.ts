export const formStorageKey = (stage: number | string) => `progress-form-stage-${stage}`;
export const unsavedFlagKey = (stage: number | string) => `${formStorageKey(stage)}-unsaved`;
export const UNSAVED_PROGRESS_CONFIRM_MESSAGE =
  "Anda memiliki data laporan yang belum dikirim. Keluar dari halaman?";
export const UNSAVED_NAVIGATION_EVENT = "progress-draft:unsaved-navigation";

export const hasUnsavedProgressDraft = (stage: number | string): boolean => {
  if (typeof window === "undefined") return false;
  const storageKey = formStorageKey(stage);
  const unsavedKey = unsavedFlagKey(stage);
  if (window.sessionStorage.getItem(unsavedKey) === "1") return true;
  return Boolean(window.localStorage.getItem(storageKey));
};
