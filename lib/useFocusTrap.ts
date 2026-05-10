import { useEffect, useRef } from 'react';

/**
 * Trap keyboard focus inside a container while it is "active". Used for
 * modals and drawers (WCAG 2.1.1 Keyboard / 4.1.2 dialog pattern).
 *
 * Behavior when `active` is true:
 *   - Remembers the element that had focus before activation.
 *   - Moves focus to the first focusable element inside the container.
 *   - Tab and Shift+Tab cycle within the container; focus cannot escape.
 *   - When `active` flips false, focus returns to the previously focused
 *     element (e.g. the button that opened the dialog).
 *
 * The container element is identified by the returned ref — pass it as
 * the `ref` of the dialog wrapper.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Remember what was focused before so we can restore it on close.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(
          (el) =>
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-hidden') !== 'true' &&
            // Filter out elements inside a hidden parent
            el.offsetParent !== null
        );

    // Move focus into the container on mount.
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // Fall back to focusing the container itself so Tab has a home.
      container.tabIndex = -1;
      container.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !container.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to whatever opened the trap.
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [active]);

  return containerRef;
}
