// ============================================
// WHAT THIS FILE DOES (plain English):
// Tells the UI whether the person asked the OS to cut motion. Animations
// should go still when this is true.
// ============================================
import { useEffect, useState } from 'react';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return reduce;
}
