"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { UNSAVED_NAVIGATION_EVENT, UNSAVED_PROGRESS_CONFIRM_MESSAGE } from "@/lib/progressDraftKeys";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  href: string;
  confirmMessage?: string;
  draftStorageKey?: string;
  unsavedSessionKey?: string;
};

export default function ConfirmNavigationButton({
  href,
  confirmMessage,
  draftStorageKey,
  unsavedSessionKey,
  onClick,
  ...rest
}: Props) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();

      const shouldAsk = (() => {
        if (typeof window === "undefined") return false;
        if (unsavedSessionKey && window.sessionStorage.getItem(unsavedSessionKey) === "1") return true;
        if (draftStorageKey && window.localStorage.getItem(draftStorageKey)) return true;
        return false;
      })();

      const message = confirmMessage ?? UNSAVED_PROGRESS_CONFIRM_MESSAGE;
      if (!shouldAsk) {
        router.push(href);
        return;
      }

      if (typeof window !== "undefined") {
        const detail = { href, message };
        const navEvent = new CustomEvent(UNSAVED_NAVIGATION_EVENT, {
          detail,
          cancelable: true,
        });
        const shouldContinue = window.dispatchEvent(navEvent);
        if (!shouldContinue) {
          return;
        }
      }

      if (window.confirm(message)) {
        router.push(href);
      }
    },
    [confirmMessage, draftStorageKey, href, onClick, router, unsavedSessionKey]
  );

  return (
    <button type="button" onClick={handleClick} {...rest} />
  );
}
