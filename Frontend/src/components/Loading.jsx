import { useRef } from "react";

import Brand from "./Brand";
import { useEntrance } from "../animations/useEntrance.js";
import { useSpin } from "../animations/useSpin.js";

function Loading({ label = "Opening your workspace" }) {
  const rootRef = useRef(null);
  const spinnerRef = useRef(null);

  useEntrance(rootRef, { staggerMs: 55, duration: 360, y: 8 });
  useSpin(spinnerRef);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6"
    >
      <div data-enter>
        <Brand />
      </div>

      <div data-enter>
        <span
          ref={spinnerRef}
          aria-hidden="true"
          className="block h-9 w-9 rounded-full border-[3px] border-line border-t-accent"
        />
      </div>

      <p className="text-[15px] text-secondary" data-enter>
        {label}
      </p>
    </div>
  );
}

export default Loading;
