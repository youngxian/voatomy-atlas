'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function NotificationIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      initial="idle"
      animate="ring"
      variants={{
        idle: { rotate: 0 },
        ring: {
          rotate: [0, 15, -15, 10, -10, 5, -5, 0],
          transition: { duration: 1.5, repeat: Infinity, repeatDelay: 3 },
        },
      }}
    >
      <motion.path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.circle
        cx="18"
        cy="4"
        r="3"
        fill="#ef4444"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.4, delay: 0.8, repeat: Infinity, repeatDelay: 5 }}
      />
    </motion.svg>
  );
}

export function LockUnlockIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
    >
      <motion.rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke={color}
        strokeWidth={2}
      />
      <motion.path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
      />
      <motion.circle
        cx="12"
        cy="16.5"
        r="1.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 4.7 }}
      />
    </motion.svg>
  );
}

export function ToggleIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
    >
      <rect x="1" y="5" width="22" height="14" rx="7" stroke={color} strokeWidth={2} />
      <motion.circle
        r="5"
        cy="12"
        fill={color}
        initial={{ cx: 8 }}
        animate={{ cx: [8, 16, 8] }}
        transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
      />
    </motion.svg>
  );
}

export function SendIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      initial="idle"
      animate="send"
      variants={{
        idle: { x: 0, y: 0 },
        send: {
          x: [0, 3, 0],
          y: [0, -2, 0],
          transition: { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 },
        },
      }}
    >
      <motion.path
        d="M22 2L11 13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
      />
    </motion.svg>
  );
}

export function EyeToggleIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
    >
      <motion.path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={2}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.7, delay: 1, ease: 'easeOut', repeat: Infinity, repeatDelay: 4.8 }}
      />
    </motion.svg>
  );
}

export function SuccessIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
      />
      <motion.path
        d="M8 12.5L11 15.5L16 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut', repeat: Infinity, repeatDelay: 5.4 }}
      />
    </motion.svg>
  );
}

export function DownloadDoneIcon({ size = 24, color = 'currentColor', className }: AnimatedIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
    >
      <motion.path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M12 3v12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: [-4, 0, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 1, ease: 'easeOut', repeat: Infinity, repeatDelay: 4 }}
      />
      <motion.path
        d="M8 11l4 4 4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: [-4, 0, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 1, ease: 'easeOut', repeat: Infinity, repeatDelay: 4 }}
      />
      <motion.path
        d="M8 18l4 -3 4 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0, 1], scale: [0.8, 0.8, 1] }}
        transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut', repeat: Infinity, repeatDelay: 3.5 }}
      />
    </motion.svg>
  );
}
