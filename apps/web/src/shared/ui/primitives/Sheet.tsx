import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
  /**
   * Optional explicit aria label for the dialog. Pass when the visible header text is
   * not present (e.g. icon-only sheets).
   */
  ariaLabel?: string;
  /** Extra class names for the panel. */
  className?: string;
}

/**
 * Full-screen mobile sheet with frosted glass background. Uses Framer Motion for
 * a smooth fade+slide transition and traps body scroll while open.
 */
export function Sheet({ open, onClose, children, ariaLabel, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="sheet-overlay"
            className="bb-sheet-overlay"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={cn("bb-sheet-panel", className)}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
