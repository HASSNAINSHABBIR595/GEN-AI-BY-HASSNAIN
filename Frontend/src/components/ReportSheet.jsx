import { useLayoutEffect, useRef } from "react";
import { animate } from "animejs";

import { MOTION, prefersReducedMotion } from "../animations/animationConfig.js";

const PLAN_DAYS = [1, 2, 3, 4, 5, 6, 7];

function ReportSheet({
  report,
  questionType = "technical",
  focusGaps = false,
  day = 1,
  onDayChange,
  showPlan = false,
  compact = false,
}) {
  const rootRef = useRef(null);
  const question = report.questions[questionType] ?? report.questions.technical;
  const selectedDay = report.plan[day - 1] ?? report.plan[0];

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root || prefersReducedMotion()) return undefined;

    const bars = Array.from(root.querySelectorAll("[data-bar]"));
    const scoreBar = root.querySelector("[data-score-bar]");

    if (scoreBar) {
      scoreBar.style.transformOrigin = "left center";
      scoreBar.style.transform = "scaleX(0)";
    }

    bars.forEach((bar) => {
      bar.style.transformOrigin = "left center";
      bar.style.transform = "scaleX(0)";
    });

    const targets = scoreBar ? [scoreBar, ...bars] : bars;

    if (!targets.length) return undefined;

    let completed = false;

    const animation = animate(targets, {
      scaleX: [0, 1],
      duration: 620,
      delay: (_, index) => 80 + index * 70,
      ease: MOTION.ease.enter,
      onComplete: () => {
        completed = true;
        targets.forEach((target) => {
          target.style.transformOrigin = "";
          target.style.transform = "";
        });
      },
    });

    return () => {
      if (!completed) animation.revert();
      targets.forEach((target) => {
        target.style.transformOrigin = "";
        target.style.transform = "";
      });
    };
  }, [report.id, focusGaps]);

  return (
    <div ref={rootRef} className="report" data-ui>
      <div className="report-bar">
        <span>Interview readiness report</span>
        <span>Sample</span>
      </div>

      <div className="report-body">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="report-role">{report.role}</p>
            <p className="report-meta">{report.verdict}</p>
          </div>

          <div className="report-score shrink-0">
            <span className="report-score-value">{report.score}</span>
            <span className="report-score-label">match</span>
          </div>
        </div>

        <div className="report-scale" aria-hidden="true">
          <div
            className="report-scale-fill"
            data-score-bar
            style={{ width: `${report.score}%` }}
          />
        </div>

        <p className="report-meta mt-4 leading-5">{report.summary}</p>

        <div className={`mt-6 space-y-3.5 ${compact ? "mb-1" : ""}`}>
          {report.skills.map((skill) => {
            const dimmed = focusGaps && !skill.gap;

            return (
              <div key={skill.name} className={dimmed ? "opacity-40" : ""}>
                <div className="report-row">
                  <span className="truncate">{skill.name}</span>
                  <span className="font-medium">{skill.value}%</span>
                </div>

                <div className="report-track" aria-hidden="true">
                  <div
                    className="report-track-fill"
                    data-bar
                    data-gap={skill.gap ? "true" : "false"}
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!compact ? (
          <>
            <div className="report-callout mt-5">
              <p className="text-[13px] text-secondary">
                {question.label} question
              </p>
              <p className="mt-1.5 text-[15px] font-medium leading-5">
                {question.prompt}
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-secondary">
                Looking for: {question.intent}
              </p>
            </div>

            {showPlan ? (
              <div className="mt-5">
                <p className="text-[13px] text-secondary">
                  Seven-day plan, day {day} of 7
                </p>

                <div className="report-plan mt-2">
                  {PLAN_DAYS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onDayChange?.(value)}
                      aria-pressed={value === day}
                      className="report-day"
                      aria-label={`Show day ${value} of the plan`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-[15px] font-medium">
                  {selectedDay.focus}
                </p>
                <p className="mt-1 text-[13px] leading-5 text-secondary">
                  {selectedDay.detail}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ReportSheet;

