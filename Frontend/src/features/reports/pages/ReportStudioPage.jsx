import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Code2,
  Download,
  Layers,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

import Brand from "../../../components/Brand.jsx";
import Toast from "../../../components/Toast.jsx";
import useToast from "../../../hooks/useToast.js";
import { getReport, getReports, deleteReport } from "../services/report.api.js";
import { getApiErrorMessage } from "../../../lib/api.js";

const NEXT_STEPS = [
  "Every report saved to your account, newest first.",
  "The candidate, role, score and recommendation at a glance.",
  "The full gaps, interview questions and preparation plan on demand.",
];

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

const ALIGNMENT_LABELS = {
  strong: "Strong",
  partial: "Partial",
  weak: "Weak",
  not_demonstrated: "Not demonstrated",
};

const ALIGNMENT_TONES = {
  strong: "border-accent-line bg-accent-soft text-accent-hover",
  partial: "border-line-strong bg-surface text-secondary",
  weak: "border-danger-line bg-danger-soft text-danger",
  not_demonstrated: "border-line bg-surface text-subtle",
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

const QUESTION_TABS = [
  { key: "technicalQuestions", label: "Technical", icon: Code2 },
  { key: "systemDesignQuestions", label: "System design", icon: Layers },
  { key: "behavioralQuestions", label: "Behavioural", icon: MessageSquare },
];

function scoreTone(score) {
  if (score > 70) return "text-accent";
  if (score >= 50) return "text-secondary";
  return "text-danger";
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
      {children}
    </h2>
  );
}

function EmptyState({ children }) {
  return <p className="text-[14px] text-secondary">{children}</p>;
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-xl bg-surface" />
      <div className="h-40 rounded-xl bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-surface" />
        <div className="h-28 rounded-xl bg-surface" />
      </div>
      <div className="h-56 rounded-xl bg-surface" />
    </div>
  );
}

function QuestionCard({ question, index, icon: Icon }) {
  const difficulty = text(question.difficulty).toLowerCase();
  const difficultyTone =
    DIFFICULTY_TONES[difficulty] || "border-line bg-surface text-secondary";

  return (
    <details className="group rounded-lg border border-line bg-background/60">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line-strong bg-paper text-[12px] font-semibold text-secondary">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-6 text-ink">
            {text(question.question) || "Question"}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            {text(question.relatedSkill) ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-2.5 py-0.5 text-[12px] text-secondary">
                <Icon size={12} aria-hidden="true" />
                {question.relatedSkill}
              </span>
            ) : null}
            {difficulty ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] ${difficultyTone}`}
              >
                {humanize(difficulty)}
              </span>
            ) : null}
          </span>
        </span>
        <span className="mt-1 text-secondary transition-transform duration-200 group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="border-t border-line px-4 pb-4 pt-3 space-y-3">
        {text(question.intention) ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Why it is asked
            </p>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-6 text-secondary">
              {question.intention}
            </p>
          </div>
        ) : null}
        {text(question.answer) ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Model answer
            </p>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-6 text-ink">
              {question.answer}
            </p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function ReportDashboard({ report, onDelete, deleting }) {
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

  const reportId = report._id || report.id;

  const [activeTab, setActiveTab] = useState("technicalQuestions");

  const activeQuestions = asArray(report[activeTab]).filter(
    (q) => q && typeof q === "object" && text(q.question),
  );

  const tabIcon = QUESTION_TABS.find((t) => t.key === activeTab)?.icon || Code2;

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-br from-surface to-background">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
              Candidate
            </p>
            <h1 className="mt-1 text-[32px] font-bold tracking-[-0.03em] text-ink sm:text-[40px]">
              {candidateName || "Interview readiness report"}
            </h1>
            {targetRole ? (
              <p className="mt-2 text-[16px] text-secondary">
                Target role:{" "}
                <span className="font-semibold text-ink">{targetRole}</span>
              </p>
            ) : null}
            {recommendation ? (
              <span className="mt-3 inline-flex items-center rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-hover">
                {recommendation}
              </span>
            ) : null}
            {generatedAt ? (
              <p className="mt-3 text-[13px] text-secondary">
                Generated {generatedAt}
              </p>
            ) : null}
          </div>

          {score !== null ? (
            <div className="shrink-0 text-center md:text-right">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
                Match score
              </p>
              <p className={`text-[64px] font-bold leading-none ${scoreTone(score)}`}>
                {score}
              </p>
              <p className="text-[13px] text-secondary">out of 100</p>
              <div className="mt-3 h-2 w-full min-w-[160px] overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${
                    score > 70
                      ? "bg-accent"
                      : score >= 50
                        ? "bg-secondary"
                        : "bg-danger"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Executive summary */}
      {(summary || focusAreas.length) ? (
        <section>
          <SectionTitle>Executive summary</SectionTitle>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {summary ? (
              <Card className="md:col-span-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  Candidate summary
                </p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink">
                  {summary}
                </p>
              </Card>
            ) : null}
            {focusAreas.length ? (
              <Card className="md:col-span-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  Key insights
                </p>
                <ul className="mt-2 space-y-2">
                  {focusAreas.map((area, i) => (
                    <li
                      key={`${area}-${i}`}
                      className="flex items-start gap-2 text-[14px] leading-6 text-secondary"
                    >
                      <Sparkles
                        size={14}
                        className="mt-1 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Key strengths */}
      {keyStrengths.length ? (
        <section>
          <SectionTitle>Key strengths</SectionTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {keyStrengths.map((strength, i) => (
              <Card
                key={`${strength}-${i}`}
                className="flex items-start gap-3 border-accent-line bg-accent-soft/40"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-hover">
                  <Check size={16} aria-hidden="true" />
                </span>
                <p className="text-[15px] leading-6 text-ink">{strength}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Areas for growth */}
      {areasForGrowth.length ? (
        <section>
          <SectionTitle>Areas for growth</SectionTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {areasForGrowth.map((area, i) => {
              const severity = text(area.severity).toLowerCase();
              const tone =
                SEVERITY_TONES[severity] ||
                "border-line-strong bg-surface text-secondary";
              return (
                <Card key={`${area.skill}-${i}`} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-ink">
                      {area.skill}
                    </p>
                    {severity ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] ${tone}`}
                      >
                        {humanize(severity)} priority
                      </span>
                    ) : null}
                  </div>
                  {text(area.explanation) ? (
                    <p className="text-[14px] leading-6 text-secondary">
                      {area.explanation}
                    </p>
                  ) : null}
                  {text(area.recommendation) ? (
                    <p className="border-t border-line pt-2 text-[14px] leading-6 text-ink">
                      <span className="font-semibold">Next step: </span>
                      {area.recommendation}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Skills analysis */}
      {skillsAnalysis.length ? (
        <section>
          <SectionTitle>Skills analysis</SectionTitle>
          {/* Desktop table */}
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-line md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-surface text-[12px] uppercase tracking-[0.12em] text-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Skill</th>
                  <th className="px-4 py-3 font-semibold">Importance</th>
                  <th className="px-4 py-3 font-semibold">Alignment</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                  <th className="px-4 py-3 font-semibold">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-background/40">
                {skillsAnalysis.map((skill, i) => {
                  const alignment = text(skill.alignment).toLowerCase();
                  const tone =
                    ALIGNMENT_TONES[alignment] ||
                    "border-line bg-surface text-secondary";
                  return (
                    <tr key={`${skill.skill}-${i}`}>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {skill.skill}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {humanize(skill.importance) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {alignment ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] ${tone}`}
                          >
                            {ALIGNMENT_LABELS[alignment] || humanize(alignment)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {text(skill.evidence) || "—"}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {text(skill.assessment) || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mt-3 space-y-3 md:hidden">
            {skillsAnalysis.map((skill, i) => {
              const alignment = text(skill.alignment).toLowerCase();
              const tone =
                ALIGNMENT_TONES[alignment] ||
                "border-line bg-surface text-secondary";
              return (
                <Card key={`${skill.skill}-${i}`} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-ink">
                      {skill.skill}
                    </p>
                    {alignment ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] ${tone}`}
                      >
                        {ALIGNMENT_LABELS[alignment] || humanize(alignment)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[13px] text-secondary">
                    <span className="font-medium text-ink">Importance: </span>
                    {humanize(skill.importance) || "—"}
                  </p>
                  {text(skill.evidence) ? (
                    <p className="text-[13px] text-secondary">
                      <span className="font-medium text-ink">Evidence: </span>
                      {skill.evidence}
                    </p>
                  ) : null}
                  {text(skill.assessment) ? (
                    <p className="text-[13px] text-ink">{skill.assessment}</p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Interview questions */}
      {QUESTION_TABS.some((t) => asArray(report[t.key]).length) ? (
        <section>
          <SectionTitle>Interview questions</SectionTitle>
          <div className="mt-3">
            <div
              role="tablist"
              className="flex flex-wrap gap-2 border-b border-line pb-3"
            >
              {QUESTION_TABS.map((tab) => {
                const count = asArray(report[tab.key]).length;
                if (!count) return null;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2 text-[14px] font-medium transition ${
                      active
                        ? "border-accent text-accent"
                        : "border-transparent text-secondary hover:text-ink"
                    }`}
                  >
                    <tab.icon size={15} aria-hidden="true" />
                    {tab.label}
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3" role="tabpanel">
              {activeQuestions.length ? (
                activeQuestions.map((q, i) => (
                  <QuestionCard
                    key={`${q.question}-${i}`}
                    question={q}
                    index={i}
                    icon={tabIcon}
                  />
                ))
              ) : (
                <EmptyState>No questions in this category.</EmptyState>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Preparation plan */}
      {preparationPlan.length ? (
        <section>
          <SectionTitle>Preparation plan</SectionTitle>
          <div className="mt-3">
            <ol className="relative space-y-4 border-l-2 border-accent-line pl-6">
              {preparationPlan.map((day, index) => {
                const tasks = asArray(day.tasks).map(text).filter(Boolean);
                const dayNumber = Number(day.day);
                return (
                  <li key={`${day.focus || "day"}-${index}`} className="relative">
                    <span className="absolute -left-[33px] top-1 grid h-6 w-6 place-items-center rounded-full bg-accent text-[12px] font-semibold text-field-ink">
                      {Number.isFinite(dayNumber) ? dayNumber : index + 1}
                    </span>
                    <Card className="space-y-2">
                      <p className="text-[15px] font-semibold text-ink">
                        {text(day.focus) || `Day ${index + 1}`}
                      </p>
                      {tasks.length ? (
                        <ul className="space-y-1.5">
                          {tasks.map((task, ti) => (
                            <li
                              key={`${task}-${ti}`}
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
                        <p className="border-t border-line pt-2 text-[14px] leading-6 text-ink">
                          <span className="font-semibold">Outcome: </span>
                          {day.expectedOutcome}
                        </p>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Bottom actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-secondary btn-sm"
        >
          <Download size={15} aria-hidden="true" />
          Download as PDF
        </button>
        <button
          type="button"
          onClick={() => onDelete(reportId)}
          disabled={deleting === reportId}
          className="btn btn-secondary btn-sm text-danger hover:bg-danger-soft"
        >
          {deleting === reportId ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={15} aria-hidden="true" />
          )}
          Delete report
        </button>
      </div>
    </div>
  );
}

function ReportStudioPage() {
  const { toast, showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getReports();
      setReports(data.reports);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Could not load your saved reports."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async (id) => {
    if (!id) return;
    setOpeningId(id);
    setError("");
    try {
      const data = await getReport(id);
      setSelectedReport(data.report);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Could not open that report."),
      );
      setSelectedReport(null);
    } finally {
      setOpeningId(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getReports();

        if (!cancelled) {
          setReports(data.reports);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(requestError, "Could not load your saved reports."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stateReport = location.state?.report;
    const id = searchParams.get("id");

    if (stateReport) {
      queueMicrotask(() => {
        setSelectedReport(stateReport);
        setError("");
      });
      return;
    }

    if (!id) {
      queueMicrotask(() => setSelectedReport(null));
      return;
    }

    queueMicrotask(() => {
      fetchReport(id);
    });

    return () => {};
  }, [fetchReport, location.state, searchParams]);

  function openReport(id) {
    if (openingId) return;
    setOpeningId(id);
    navigate(`/app/report-studio?id=${id}`);
  }

  async function handleDelete(id) {
    if (!id || deletingId) return;
    const confirmed = window.confirm("Delete this report? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      if ((selectedReport?._id || selectedReport?.id) === id) {
        setSelectedReport(null);
        navigate("/app/report-studio");
      }
      showToast("Report deleted.", "success");
    } catch (requestError) {
      showToast(
        getApiErrorMessage(requestError, "Could not delete that report."),
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toast toast={toast} />

      <header className="nav">
        <div className="shell nav-inner">
          <Brand />

          <Link
            to="/"
            className="text-[15px] font-medium text-secondary underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
          >
            Back to overview
          </Link>
        </div>
      </header>

      <main className="shell pb-20 pt-12 sm:pt-16">
        {selectedReport ? (
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  navigate("/app/report-studio");
                }}
                className="btn btn-secondary btn-sm"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                All reports
              </button>

              <Link to="/app" className="text-link">
                Generate another
              </Link>
            </div>

            {openingId ? (
              <Skeleton />
            ) : (
              <ReportDashboard
                report={selectedReport}
                onDelete={handleDelete}
                deleting={deletingId}
              />
            )}
          </div>
        ) : searchParams.get("id") ? (
          <div className="mx-auto max-w-5xl">
            {openingId ? (
              <Skeleton />
            ) : error ? (
              <div className="alert alert-error">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const id = searchParams.get("id");
                      if (id) fetchReport(id);
                    }}
                    className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/app/report-studio")}
                    className="mt-2 ml-4 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                  >
                    Back to all reports
                  </button>
                </div>
              </div>
            ) : (
              <Skeleton />
            )}
          </div>
        ) : (
          <div className="sheet">
            <div className="col-span-12 lg:col-span-4">
              <h1 className="h2">Report studio</h1>

              <p className="lede mt-5 max-w-[34ch]">
                Your generated interview reports live here. Open one to revisit
                the gaps, the questions and the preparation plan.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/app" className="btn btn-primary">
                  Start a new report
                </Link>

                <Link to="/" className="btn btn-secondary">
                  Back to overview
                </Link>
              </div>

              <div className="mt-14">
                <h2 className="text-[15px] font-semibold">What is in the studio</h2>

                <ul className="mt-4 space-y-4">
                  {NEXT_STEPS.map((item) => (
                    <li
                      key={item}
                      className="max-w-[40ch] text-[16px] leading-6 text-secondary"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 bg-surface p-6 sm:p-8">
                <p className="empty-mark" aria-hidden="true">
                  {loading ? "—" : reports.length}
                </p>
                <p className="mt-3 text-[15px] text-secondary">
                  {reports.length === 1
                    ? "report saved to this account"
                    : "reports saved to this account"}
                </p>
              </div>
            </div>

            <div className="col-span-12 mt-14 lg:col-span-7 lg:col-start-6 lg:mt-0">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h2 className="h3">Saved reports</h2>
                  <p className="mt-2 text-[13px] text-secondary">
                    Newest first. Open any report to read it in full.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadReports}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="border border-line bg-surface p-6 sm:p-8">
                    <p className="flex items-center gap-2 text-[15px] text-secondary">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Loading your reports
                    </p>
                  </div>
                ) : error ? (
                  <div className="alert alert-error">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={loadReports}
                        className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                      >
                        <RefreshCw size={15} aria-hidden="true" />
                        Try again
                      </button>
                    </div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="border border-line bg-surface p-6 sm:p-8">
                    <p className="empty-mark" aria-hidden="true">
                      0
                    </p>
                    <p className="mt-3 text-[15px] text-secondary">
                      You have not generated a report yet.
                    </p>

                    <Link to="/app" className="btn btn-primary mt-6">
                      Generate your first report
                    </Link>
                  </div>
                ) : (
                  <ul className="border-t border-line">
                    {reports.map((report) => (
                      <li
                        key={report._id}
                        className="border-b border-line py-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold">
                              {report.targetRole || "Interview readiness report"}
                            </p>

                            <p className="mt-1 text-[13px] text-secondary">
                              {formatDate(report.createdAt)}
                            </p>

                            {report.executiveSummary ? (
                              <p className="mt-2 line-clamp-2 max-w-[56ch] text-[14px] leading-6 text-secondary">
                                {report.executiveSummary}
                              </p>
                            ) : null}

                            {report.hiringRecommendation ? (
                              <p className="mt-2 text-[13px] text-secondary">
                                Recommendation:{" "}
                                <span className="font-medium text-ink">
                                  {report.hiringRecommendation}
                                </span>
                              </p>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 items-center gap-4">
                            {Number.isFinite(Number(report.matchScore)) ? (
                              <span className="text-[20px] font-semibold">
                                {Number(report.matchScore)}
                              </span>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => openReport(report._id)}
                              disabled={Boolean(openingId)}
                              className="btn btn-secondary btn-sm"
                            >
                              {openingId === report._id ? (
                                <>
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                    aria-hidden="true"
                                  />
                                  Opening
                                </>
                              ) : (
                                "Open report"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(report._id)}
                              disabled={deletingId === report._id}
                              className="btn btn-ghost btn-sm text-danger"
                              aria-label="Delete report"
                            >
                              {deletingId === report._id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2 size={15} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportStudioPage;
