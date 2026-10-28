import { useLayoutEffect } from "react";
import { animate, stagger } from "animejs";

import { MOTION, prefersReducedMotion } from "./animationConfig.js";
import { clearMotionStyles } from "./animationUtils.js";

export function useEntrance(
  ref,
  {
    selector = "[data-enter]",
    y = MOTION.distance.y,
    duration = MOTION.duration.base,
    staggerMs = MOTION.stagger.base,
    startDelay = 0,
    enabled = true,
  } = {},
) {
  useLayoutEffect(() => {
    const root = ref.current;

    if (!enabled || !root || prefersReducedMotion()) return undefined;

    const targets = Array.from(root.querySelectorAll(selector));

    if (!targets.length) return undefined;

    let completed = false;

    targets.forEach((element) => {
      element.style.willChange = "opacity, transform";
    });

    const animation = animate(targets, {
      opacity: [0, 1],
      translateY: [y, 0],
      duration,
      delay: stagger(staggerMs, { start: startDelay }),
      ease: MOTION.ease.enter,
      onComplete: () => {
        completed = true;
        clearMotionStyles(targets);
      },
    });

    return () => {
      if (!completed) animation.revert();
      clearMotionStyles(targets);
    };
  }, [ref, selector, y, duration, staggerMs, startDelay, enabled]);
}
