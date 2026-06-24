"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Piège le focus dans un conteneur (modal, lightbox) tant que `active` est vrai :
 * - mémorise l'élément focalisé avant ouverture et le restaure à la fermeture,
 * - place le focus initial dans le conteneur,
 * - boucle Tab / Shift+Tab à l'intérieur,
 * - `Échap` déclenche `onDismiss`.
 *
 * Le conteneur ciblé doit porter `tabIndex={-1}`.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onDismiss?: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      node
        ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    const items = focusable();
    (items[0] ?? node)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismiss?.();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusable();
      if (list.length === 0) {
        event.preventDefault();
        node?.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [active, onDismiss]);

  return ref;
}
