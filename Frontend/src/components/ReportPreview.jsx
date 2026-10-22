import { useLayoutEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { Sparkles } from "lucide-react";

import { MOTION, prefersReducedMotion } from "../animations/animationConfig.js";
import { clearMotionStyles } from "../animations/animationUtils.js";

function ScoreRing({ value }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg
        viewBox="0 0 76 76"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-surface-strong"
        />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent"
        />
      </svg>

      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-lg font-semibold text-ink">{value}</span>
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-subtle">
          Match
        </span>
      </span>
    </div>
  );
}

function SkillRow({ label, value, muted = false }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-secondary">{label}</span>
        <span className="text-[11px] font-medium text-ink">{value}%</span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-strong">
        <div
          data-bar
          className={`h-full rounded-full ${
            muted ? "bg-line-strong" : "bg-accent"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ReportPreview() {
  const previewRef = useRef(null);

  useLayoutEffect(() => {
    const root = previewRef.current;

    if (!root || prefersReducedMotion()) return undefined;

    const bars = Array.from(root.querySelectorAll("[data-bar]"));

    if (!bars.length) return undefined;

    bars.forEach((bar) => {
      bar.style.transformOrigin = "left center";
      bar.style.transform = "scaleX(0)";
      bar.style.willChange = "transform";
    });

    let completed = false;

    const animation = animate(bars, {
      scaleX: [0, 1],
      duration: 650,
      delay: stagger(85, { start: 420 }),
      ease: MOTION.ease.enter,
      onComplete: () => {
        completed = true;
        clearMotionStyles(bars);
      },
    });

    return () => {
      if (!completed) animation.revert();
      clearMotionStyles(bars);
    };
  }, []);

  return (
    <div
      ref={previewRef}
      role="img"
      aria-label="Preview of a GEN+AI interview report showing an 84 percent match score, skill alignment bars, and a tailored next interview question"
      className="card overflow-hidden shadow-[0_28px_70px_-32px_rgba(16,24,40,0.35)]"
    >
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />

        <span className="ml-2 text-[11px] font-medium text-subtle">
          Interview readiness
        </span>

        <span className="badge badge-accent ml-auto">Sample</span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
              Target role
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-ink">
              Senior Frontend Engineer
            </p>
            <p className="mt-1 text-xs text-secondary">
              Recommendation:{" "}
              <span className="font-medium text-accent-hover">
                Proceed to technical
              </span>
            </p>
          </div>

          <ScoreRing value={84} />
        </div>

        <div className="mt-6 space-y-3.5">
          <SkillRow label="React & component design" value={92} />
          <SkillRow label="TypeScript" value={81} />
          <SkillRow label="System design" value={58} />
          <SkillRow label="Testing strategy" value={34} muted />
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            <Sparkles size={12} aria-hidden="true" />
            Next question
          </p>

          <p className="mt-1.5 text-xs leading-5 text-secondary">
            How would you structure a React application for a team of twelve
            engineers?
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportPreview;
