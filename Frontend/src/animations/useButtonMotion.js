import { useEffect } from "react";
import { animate } from "animejs";

import { MOTION, prefersReducedMotion } from "./animationConfig.js";

export function useButtonMotion() {
  useEffect(() => {
    const root = document.getElementById("root");

    if (!root || prefersReducedMotion()) return undefined;

    const animations = new Set();
    const perElement = new WeakMap();

    function move(button, translateY, scale = 1) {
      if (!button || button.disabled || button.getAttribute("aria-disabled")) {
        return;
      }

      perElement.get(button)?.cancel();

      const animation = animate(button, {
        translateY,
        scale,
        duration: MOTION.duration.micro,
        ease: MOTION.ease.standard,
      });

      perElement.set(button, animation);
      animations.add(animation);
    }

    function findButton(target) {
      if (!(target instanceof Element)) return null;
      return target.closest(".btn");
    }

    function onPointerOver(event) {
      const button = findButton(event.target);

      if (!button || button.contains(event.relatedTarget)) return;

      move(button, -1);
    }

    function onPointerOut(event) {
      const button = findButton(event.target);

      if (!button || button.contains(event.relatedTarget)) return;

      move(button, 0);
    }

    function onPointerDown(event) {
      const button = findButton(event.target);

      if (!button) return;

      move(button, 0, 0.985);
    }

    function onPointerUp(event) {
      const button = findButton(event.target);

      if (!button) return;

      move(button, 0, 1);
    }

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);

    return () => {
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);

      animations.forEach((animation) => {
        animation.cancel();
        animation.revert();
      });
    };
  }, []);
}
