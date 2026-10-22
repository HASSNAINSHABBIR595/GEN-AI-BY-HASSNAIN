import { useLayoutEffect } from "react";
import { animate } from "animejs";

import { MOTION, prefersReducedMotion } from "./animationConfig.js";

export function useSpin(ref, { enabled = true } = {}) {
  useLayoutEffect(() => {
    const element = ref.current;

    if (!enabled || !element || prefersReducedMotion()) return undefined;

    const animation = animate(element, {
      rotate: [0, 360],
      duration: MOTION.duration.loading,
      ease: MOTION.ease.linear,
      loop: true,
    });

    return () => animation.revert();
  }, [ref, enabled]);
}
