import type { Transition, Variants } from 'motion/react';

export const springSnappy = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 38,
  mass: 0.85
};

export const springSoft = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 32
};

export const fadeFast: Transition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1]
};

export const fadeMedium: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1]
};

export const staggerList = 0.035;

export const pressTap = { scale: 0.985 };

export const pressTransition: Transition = { duration: 0.1 };

export const panelEnterY = 4;
export const panelExitY = -4;
export const revealY = 6;

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: staggerList, delayChildren: 0 }
  }
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft
  }
};

export function getReducedFadeTransition(reduceMotion: boolean | null): Transition {
  return reduceMotion ? { duration: 0.08 } : fadeFast;
}

export function getPanelTransition(reduceMotion: boolean | null): Transition {
  return reduceMotion ? { duration: 0.08 } : springSnappy;
}
