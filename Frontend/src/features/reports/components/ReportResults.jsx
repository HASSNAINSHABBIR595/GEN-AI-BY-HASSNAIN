import {
  CalendarDays,
  Check,
  ChevronDown,
  Code2,
  Layers,
  ListChecks,
  MessageSquare,
  Sparkles,
} from "lucide-react";

const ALIGNMENT_LABELS = {
  strong: "Strong match",
  partial: "Partial match",
  weak: "Weak match",
  not_demonstrated: "Not demonstrated",
};

const ALIGNMENT_TONES = {
  strong: "border-accent-line bg-accent-soft text-accent-hover",
  partial: "border-line-strong bg-surface text-secondary",
  weak: "border-danger-line bg-danger-soft text-danger",
  not_demonstrated: "border-danger-line bg-danger-soft text-danger",
};

const SEVERITY_TONES = {
  high: "border-danger-line bg-danger-soft text-danger",
  medium: "border-line-strong bg-surface text-secondary",
  low: "border-accent-line bg-accent-soft text-accent-hover",
};

const DIFFICULTY_TONES = {
  hard: "border-danger-line bg-danger-soft text-danger",
  medium: "border-line-strong bg-surface text-secondary",
  easy: "border-accent-line bg-accent-soft text-accent-hover",
};

const QUESTION_GROUPS = [
  {
    key: "technicalQuestions",
    title: "Technical questions",
    icon: Code2,
  },
  {
    key: "systemDesignQuestions",
    title: "System design questions",
    icon: Layers,
  },
  {
    key: "behavioralQuestions",
    title: "Behavioural questions",
    icon: MessageSquare,
  },
];

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function humanize(value) {
  const raw = text(value);
  if (!raw) return "";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TextBlock({ value, className = "" }) {
  const content = text(value);
  if (!content) return null;

  return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
}

function Section({ title, description, children }) {
  return (
    <section className="border-t border-paper-line px-5 py-6 sm:px-7">
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
        {title}
      </h4>

      {text(description) ? (
        <p className="mt-2 max-w-[62ch] text-[14px] leading-6 text-secondary">
          {description}
        </p>
      ) : null}

      <div className="mt-4">{children}</div>
    </section>
  );
}

function QuestionGroup({ title, icon: Icon, questions }) {
  if (!questions.length) return null;

  return (
    <Section title={title}>
      <div className="space-y-2.5">
        {questions.map((question, index) => {
          const difficulty = text(question.difficulty).toLowerCase();
          const difficultyTone =
            DIFFICULTY_TONES[difficulty] || "border-line bg-surface text-secondary";

          return (
            <details
              key={`${question.question}-${index}`}
              className="group border border-line bg-surface/50"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-line-strong bg-paper text-[12px] font-semibold text-secondary">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-6 text-ink">
                    {text(question.question) || "Question"}
                  </span>

                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    {text(question.relatedSkill) ? (
                      <span className="badge">
                        <Icon size={12} aria-hidden="true" />
                        {question.relatedSkill}
                      </span>
                    ) : null}

                    {difficulty ? (
                      <span className={`badge ${difficultyTone}`}>
                        {humanize(difficulty)}
                      </span>
                    ) : null}
                  </span>
                </span>

                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180"
                />
              </summary>

              <div className="border-t border-line px-4 pb-4 pt-3">
                {text(question.intention) ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                      Why it is asked
                    </p>
                    <TextBlock
                      value={question.intention}
                      className="mt-1 text-[14px] leading-6 text-secondary"
                    />
                  </div>
                ) : null}

                {text(question.answer) ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                      Model answer
                    </p>
                    <TextBlock
                      value={question.answer}
                      className="mt-1 text-[14px] leading-6 text-ink"
                    />
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * Displays the report exactly as returned by POST /api/interview.
 * Only sections present in the response are rendered.
 */
function ReportResults({ report }) {
  if (!report || typeof report !== "object") return null;

  const candidateName = text(report.candidateName);
  const targetRole = text(report.targetRole);
  const recommendation = text(report.hiringRecommendation);
  const summary = text(report.executiveSummary);
  const generatedAt = formatDate(report.createdAt);

  const rawScore = Number(report.matchScore);
  const score = Number.isFinite(rawScore)
    ? Math.min(100, Math.max(0, Math.round(rawScore)))
    : null;

  const keyStrengths = asArray(report.keyStrengths)
    .map(text)
    .filter(Boolean);

  const areasForGrowth = asArray(report.areasForGrowth).filter(
    (area) => area && typeof area === "object" && text(area.skill),
  );

  const skillsAnalysis = asArray(report.skillsAnalysis).filter(
    (skill) => skill && typeof skill === "object" && text(skill.skill),
  );

  const focusAreas = asArray(report.interviewerFocusAreas)
    .map(text)
    .filter(Boolean);

  const preparationPlan = asArray(report.preparationPlan).filter(
    (day) => day && typeof day === "object" && (text(day.focus) || asArray(day.tasks).length),
  );

  return (
    <article className="report-result border border-paper-line bg-paper text-ink">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-line px-5 py-3 sm:px-7">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-secondary">
          Interview readiness report
        </span>
        <span className="badge">
          <Sparkles size={12} aria-hidden="true" />
          Generated by GEN+AI
        </span>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {candidateName ? (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  Candidate
                </p>
                <h3 className="h3 mt-2 break-words">{candidateName}</h3>
              </>
            ) : (
              <h3 className="h3">Interview readiness report</h3>
            )}

            {targetRole ? (
              <p className="mt-2 text-[15px] leading-6 text-secondary">
                Target role:{" "}
                <span className="font-medium text-ink">{targetRole}</span>
              </p>
            ) : null}

            {recommendation ? (
              <p className="mt-2 text-[15px] leading-6 text-secondary">
                Recommendation:{" "}
                <span className="font-semibold text-ink">{recommendation}</span>
              </p>
            ) : null}

            {generatedAt ? (
              <p className="mt-2 text-[13px] text-secondary">
                Generated {generatedAt}
              </p>
            ) : null}
          </div>

          {score !== null ? (
            <div className="report-score shrink-0 self-start">
              <span className="report-score-value">{score}</span>
              <span className="report-score-label">match</span>
            </div>
          ) : null}
        </div>

        {score !== null ? (
          <div
            className="report-scale"
            role="img"
            aria-label={`Overall match score: ${score} out of 100`}
          >
            <div className="report-scale-fill" style={{ width: `${score}%` }} />
          </div>
        ) : null}

        {summary ? (
          <TextBlock
            value={summary}
            className="mt-5 text-[16px] leading-7 text-ink"
          />
        ) : null}
      </div>

      {keyStrengths.length ? (
        <Section title="Key strengths">
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {keyStrengths.map((strength, index) => (
              <li
                key={`${strength}-${index}`}
                className="flex items-start gap-2.5 text-[15px] leading-6 text-ink"
              >
                <Check
                  size={16}
                  className="mt-1 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {areasForGrowth.length ? (
        <Section
          title="Areas for growth"
          description="The gaps worth closing before the interview."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {areasForGrowth.map((area, index) => {
              const severity = text(area.severity).toLowerCase();
              const tone =
                SEVERITY_TONES[severity] ||
                "border-line-strong bg-surface text-secondary";

              return (
                <div
                  key={`${area.skill}-${index}`}
                  className="border border-line bg-background/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold">{area.skill}</p>
                    {severity ? (
                      <span className={`badge ${tone}`}>
                        {humanize(severity)} priority
                      </span>
                    ) : null}
                  </div>

                  <TextBlock
                    value={area.explanation}
                    className="mt-2 text-[14px] leading-6 text-secondary"
                  />

                  {text(area.recommendation) ? (
                    <p className="mt-3 border-t border-line pt-3 text-[14px] leading-6 text-ink">
                      <span className="font-semibold">Next step: </span>
                      {area.recommendation}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {skillsAnalysis.length ? (
        <Section title="Skills analysis">
          <ul className="divide-y divide-line">
            {skillsAnalysis.map((skill, index) => {
              const alignment = text(skill.alignment).toLowerCase();
              const alignmentTone =
                ALIGNMENT_TONES[alignment] ||
                "border-line bg-surface text-secondary";

              return (
                <li
                  key={`${skill.skill}-${index}`}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold">{skill.skill}</p>

                    {text(skill.importance) ? (
                      <span className="badge">
                        {humanize(skill.importance)}
                      </span>
                    ) : null}

                    {alignment ? (
                      <span className={`badge ${alignmentTone}`}>
                        {ALIGNMENT_LABELS[alignment] || humanize(alignment)}
                      </span>
                    ) : null}
                  </div>

                  {text(skill.evidence) ? (
                    <p className="mt-2 text-[14px] leading-6 text-secondary">
                      <span className="font-medium text-ink">Evidence: </span>
                      {skill.evidence}
                    </p>
                  ) : null}

                  <TextBlock
                    value={skill.assessment}
                    className="mt-1.5 text-[14px] leading-6 text-ink"
                  />
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {focusAreas.length ? (
        <Section
          title="Interview focus areas"
          description="What an interviewer is likely to probe."
        >
          <ol className="space-y-2.5">
            {focusAreas.map((area, index) => (
              <li
                key={`${area}-${index}`}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-[15px] leading-6"
              >
                <span className="fact-value text-[20px] text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{area}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {QUESTION_GROUPS.map((group) => (
        <QuestionGroup
          key={group.key}
          title={group.title}
          icon={group.icon}
          questions={asArray(report[group.key]).filter(
            (question) =>
              question && typeof question === "object" && text(question.question),
          )}
        />
      ))}

      {preparationPlan.length ? (
        <Section
          title="Preparation plan"
          description="Work through these days before the interview."
        >
          <ol className="space-y-3">
            {preparationPlan.map((day, index) => {
              const tasks = asArray(day.tasks).map(text).filter(Boolean);
              const dayNumber = Number(day.day);

              return (
                <li
                  key={`${day.focus || "day"}-${index}`}
                  className="border border-line bg-background/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center bg-accent text-[13px] font-semibold text-field-ink">
                      {Number.isFinite(dayNumber) ? dayNumber : index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">
                        {text(day.focus) || `Day ${index + 1}`}
                      </p>

                      {tasks.length ? (
                        <ul className="mt-2 space-y-1.5">
                          {tasks.map((task, taskIndex) => (
                            <li
                              key={`${task}-${taskIndex}`}
                              className="flex items-start gap-2 text-[14px] leading-6 text-secondary"
                            >
                              <Check
                                size={14}
                                className="mt-1 shrink-0 text-accent"
                                aria-hidden="true"
                              />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {text(day.expectedOutcome) ? (
                        <p className="mt-2 border-t border-line pt-2 text-[14px] leading-6 text-ink">
                          <span className="font-semibold">Outcome: </span>
                          {day.expectedOutcome}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-paper-line px-5 py-3 text-[12px] text-secondary sm:px-7">
        <ListChecks size={14} aria-hidden="true" />
        <span>Preparation material, not a hiring decision.</span>

        {generatedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <CalendarDays size={14} aria-hidden="true" />
            <span>{generatedAt}</span>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default ReportResults;
