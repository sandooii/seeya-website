"use client";

import { useEffect } from "react";

/**
 * Stack-aware body scroll lock.
 *
 * When two modals are open at the same time (e.g. TripModal opens a
 * WaitlistFormModal on top of itself) the naive
 * `document.body.style.overflow = "hidden" / ""` pattern races:
 * whichever modal closes FIRST also unlocks scroll, even though the
 * other modal is still on screen. On mobile Safari this leaves the
 * page "stuck" — the backdrop is still rendered but no one is
 * managing scroll, Lenis can drift, taps can fall through.
 *
 * This hook keeps a process-wide counter. Body overflow is only
 * restored when the last open modal releases its lock. It also
 * stores the previous overflow value so we restore it instead of
 * blanking out a value the page might have set.
 *
 * It registers a window `pagehide` fallback so a back-button
 * navigation that unmounts the modal without firing React cleanup
 * (rare, but happens on iOS) still restores scroll.
 */

let lockCount = 0;
let previousOverflow: string | null = null;

function lock() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlock() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? "";
    previousOverflow = null;
  }
}

/**
 * Lock body scroll for as long as `active` is true. Safe to nest —
 * the lock is reference-counted so two open modals share state and
 * only the LAST one to close releases the lock.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();

    // Belt-and-braces release on page hide. iOS Safari sometimes
    // unmounts components on back-navigation without firing useEffect
    // cleanup; this catches that case.
    const onPageHide = () => unlock();
    window.addEventListener("pagehide", onPageHide, { once: true });

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      unlock();
    };
  }, [active]);
}
