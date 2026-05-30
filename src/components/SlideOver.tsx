"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { overlayVariants, panelVariants, base } from "@/lib/motion";
import { X } from "lucide-react";

export function SlideOver({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 bg-black/50"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={base}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Panel"}
            className={clsx(
              "relative w-full max-w-lg bg-[#12121a] border-l border-[#2a2a3a] overflow-y-auto shadow-2xl",
              className
            )}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={reduceMotion ? { duration: 0.12 } : base}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-3">
                {title ? (
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                ) : (
                  <span />
                )}
                <button
                  ref={closeBtnRef}
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#6b6b80] hover:text-white hover:bg-[#2a2a3a] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

