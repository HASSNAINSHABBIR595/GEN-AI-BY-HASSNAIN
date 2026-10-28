import { useLayoutEffect } from "react";
import { animate, stagger } from "animejs";

import { prefersReducedMotion } from "./animationConfig.js";

export function useMaskedLines(
  ref,
  {
    selector = "[data-line-inner]",
    duration = 900,
    staggerMs = 110,
    startDelay = 80,
    ease = "outExpo",
  } = {},
) {
  useLayoutEffect(() => {
    const root = ref.current;

    if (!root || prefersReducedMotion()) return undefined;

    const targets = Array.from(root.querySelectorAll(selector));

    if (!targets.length) return undefined;

    targets.forEach((target) => {
      target.style.transform = "translateY(110%)";
      target.style.willChange = "transform";
    });

    let completed = false;

    const animation = animate(targets, {
      translateY: ["110%", "0%"],
      duration,
      delay: stagger(staggerMs, { start: startDelay }),
      ease,
      onComplete: () => {
        completed = true;
        targets.forEach((target) => {
          target.style.transform = "";
          target.style.willChange = "";
        });
      },
    });

    return () => {
      if (!completed) animation.revert();
      targets.forEach((target) => {
        target.style.transform = "";
        target.style.willChange = "";
      });
    };
  }, [ref, selector, duration, staggerMs, startDelay, ease]);
}
