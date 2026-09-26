import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** 9.2 — Mobile: the OS "Reduce Motion" setting. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
