import { useLayoutEffect } from "react";
import { animate, stagger } from "animejs";

import { MOTION, prefersReducedMotion } from "./animationConfig.js";
import { clearMotionStyles } from "./animationUtils.js";

export function useScrollReveal(
  ref,
  {
    selector = "[data-reveal]",
    y = MOTION.distance.y,
    duration = MOTION.duration.base,
    staggerMs = MOTION.stagger.base,
    threshold = 0.15,
    rootMargin = "0px 0px -8% 0px",
  } = {},
) {
  useLayoutEffect(() => {
    const root = ref.current;

    if (
      !root ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    const targets = Array.from(root.querySelectorAll(selector));

    if (!targets.length) return undefined;

    targets.forEach((element) => {
      element.style.opacity = "0";
      element.style.transform = `translate3d(0, ${y}px, 0)`;
      element.style.willChange = "opacity, transform";
    });

    let animation = null;
    let completed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        observer.disconnect();

        animation = animate(targets, {
          opacity: [0, 1],
          translateY: [y, 0],
          duration,
          delay: stagger(staggerMs),
          ease: MOTION.ease.enter,
          onComplete: () => {
            completed = true;
            clearMotionStyles(targets);
          },
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      if (animation && !completed) animation.revert();
      clearMotionStyles(targets);
    };
  }, [ref, selector, y, duration, staggerMs, threshold, rootMargin]);
}
