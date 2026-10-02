"use client";

import { useEffect, useRef } from "react";

interface ExpiredSignInDialogProps {
  onDismiss: () => void;
}

export function ExpiredSignInDialog({ onDismiss }: ExpiredSignInDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    signInRef.current?.focus();
  }, []);

  return (
    <div className="expired-sign-in-backdrop">
      <div
        ref={dialogRef}
        className="expired-sign-in-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expired-sign-in-title"
        aria-describedby="expired-sign-in-description"
        onKeyDown={(event) => {
          if (event.key === "Escape") onDismiss();
          if (event.key !== "Tab") return;
          const actions = dialogRef.current?.querySelectorAll<HTMLElement>("button");
          if (!actions?.length) return;
          const first = actions[0];
          const last = actions[actions.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id="expired-sign-in-title">Your sign-in session expired</h2>
        <p id="expired-sign-in-description">
          Sign in again to load imagery. Your map view, layers, and drafts will stay open in this tab.
        </p>
        <div className="expired-sign-in-actions">
          <button
            ref={signInRef}
            type="button"
            className="primary-button"
            onClick={() => window.open(window.location.origin, "_blank", "noopener,noreferrer")}
          >
            Sign in
          </button>
          <button type="button" onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
