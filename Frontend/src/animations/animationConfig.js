export const MOTION = Object.freeze({
  duration: {
    micro: 120,
    quick: 220,
    base: 420,
    slow: 560,
    loading: 900,
  },
  stagger: {
    tight: 30,
    base: 60,
    loose: 80,
  },
  ease: {
    enter: "outCubic",
    exit: "inCubic",
    standard: "inOutQuad",
    linear: "linear",
  },
  distance: {
    y: 14,
    x: 18,
  },
  scale: {
    from: 0.98,
  },
});

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
