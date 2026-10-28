import { useLayoutEffect, useRef } from "react";
import { animate } from "animejs";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { MOTION, prefersReducedMotion } from "../animations/animationConfig.js";
import { clearMotionStyles } from "../animations/animationUtils.js";

function Toast({ toast }) {
  const toastRef = useRef(null);
  const toastKey = toast ? `${toast.type}:${toast.message}` : "";

  useLayoutEffect(() => {
    const element = toastRef.current;

    if (!element || !toastKey || prefersReducedMotion()) return undefined;

    const icon = element.querySelector("[data-toast-icon]");
    let completed = false;

    const animation = animate(element, {
      opacity: [0, 1],
      translateY: [-8, 0],
      duration: MOTION.duration.quick,
      ease: MOTION.ease.enter,
      onComplete: () => {
        completed = true;
        clearMotionStyles([element]);
      },
    });

    const iconAnimation = icon
      ? animate(icon, {
          scale: [0.75, 1],
          duration: 300,
          ease: MOTION.ease.enter,
        })
      : null;

    return () => {
      if (!completed) animation.revert();
      clearMotionStyles([element]);
      if (iconAnimation) iconAnimation.revert();
    };
  }, [toastKey]);

  if (!toast) return null;

  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      ref={toastRef}
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={`toast ${
        isError
          ? "border-danger-line bg-danger-soft text-danger"
          : "border-accent-line bg-accent-soft text-accent-hover"
      }`}
    >
      <span data-toast-icon className="mt-0.5 shrink-0">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span>{toast.message}</span>
    </div>
  );
}

export default Toast;
