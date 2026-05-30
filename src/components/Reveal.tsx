"use client";

import { motion, useReducedMotion, type Target } from "framer-motion";
import clsx from "clsx";

type RevealVariant = 'fade-up' | 'fade' | 'scale' | 'slide-left' | 'slide-right';

const variants: Record<RevealVariant, { initial: Target; animate: Target }> = {
  'fade-up': {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
  },
  'slide-left': {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
  },
  'slide-right': {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
  },
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'fade-up',
  duration = 0.35,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const v = variants[variant];

  return (
    <motion.div
      className={clsx(className)}
      initial={reduceMotion ? { opacity: 0 } : v.initial}
      whileInView={v.animate}
      viewport={{ once, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? 0.1 : duration,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export function Stagger({
  children,
  className,
  staggerDelay = 0.06,
  initialDelay = 0,
}: StaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={clsx(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ staggerChildren: reduceMotion ? 0 : staggerDelay, delayChildren: initialDelay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={clsx(className)}
      variants={{
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
