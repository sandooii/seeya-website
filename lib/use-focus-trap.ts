"use client";

import { useEffect, useRef } from "react";

/**
 * Trap keyboard focus inside a dialog so Tab cycles within the modal
 * instead of leaking to the page beneath. Pair with `useBodyScrollLock`
 * for proper modal behavior:
 *
 *   const ref = useFocusTrap<HTMLDivElement>(open);
 *   ...
 *   <div ref={ref} role="dialog" aria-modal="true"> ... </div>
 *
 * Behavior:
 *   - On open, moves focus to the first focusable element inside the
 *     trapped container (so screen readers announce the dialog).
 *   - Tab / Shift+Tab wrap around the focusable set inside the container.
 *   - On close, restores focus to whichever element was focused before
 *     the modal opened — so keyboard users land back where they triggered
 *     the open from.
 *
 * Implementation notes:
 *   - We re-query focusables on every Tab so dynamic content (e.g. a
 *     form revealing extra fields) stays trappable.
 *   - We do NOT manage Escape (the consumer usually wires this up with
 *     its own close logic).
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Remember who had focus so we can hand it back on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog. Prefer the first focusable; if there
    // are none, focus the container itself (it gets tabindex=-1).
    const initial = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (initial.length > 0) {
      initial[0].focus();
    } else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("data-focus-skip"));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whoever opened the modal. Wrap in try/catch
      // because the element may have unmounted while the modal was up.
      try {
        previouslyFocused?.focus?.();
      } catch {
        // ignore
      }
    };
  }, [active]);

  return containerRef;
}
