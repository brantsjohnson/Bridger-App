import { Transition, Variants } from 'framer-motion';

/** Spring-like easing: things ease in and settle, they never snap. */
export const spring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.7
};

export const gentle: Transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

/** Content breathes in: transform + opacity only. */
export const breatheIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: gentle }
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
};

export const screenTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: gentle },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16 } }
};