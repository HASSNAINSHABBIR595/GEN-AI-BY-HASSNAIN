import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Brand from "../../../components/Brand.jsx";
import Reveal from "../../../components/Reveal.jsx";
import Toast from "../../../components/Toast.jsx";
import useToast from "../../../hooks/useToast.js";
import { prefersReducedMotion } from "../../../animations/animationConfig.js";
import { useEntrance } from "../../../animations/useEntrance.js";
import { useMaskedLines } from "../../../animations/useMaskedLines.js";
import FileDropzone from "../components/FileDropzone.jsx";
import ReportResults from "../components/ReportResults.jsx";
import { validateResumeFile } from "../utils/resume.js";
import {
  generateReport,
  getReport,
  getReports,
} from "../services/report.api.js";
import { getApiErrorMessage } from "../../../lib/api.js";

const STEPS = [
  {
    number: "01",
    title: "Read",
    detail: "The resume, the role and your description are read in full.",
  },
  {
    number: "02",
    title: "Match",
    detail: "Every requirement in the role is marked strong, partial or missing.",
  },
  {
    number: "03",
    title: "Report",
    detail: "You get a score, the gaps, interview questions and a preparation plan.",
  },
];

const CHECKLIST = [
  "Your resume, as a PDF",
  "The role you are applying for, as posted",
  "A short, honest self-description",
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

function ReportGenerationPage() {
  const heroRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const resultRef = useRef(null);
  const abortRef = useRef(null);

  const { toast, showToast } = useToast();

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [requestError, setRequestError] = useState("");

  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [openingId, setOpeningId] = useState(null);

  useMaskedLines(heroRef);
  useEntrance(heroRef, {
    selector: "[data-enter]",
    staggerMs: 70,
    duration: 460,
    startDelay: 180,
  });

  const isGenerating = status === "generating";

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");

    try {
      const data = await getReports();
      setReports(data.reports);
    } catch (error) {
      setReportsError(
        getApiErrorMessage(error, "Could not load your saved reports."),
      );
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getReports();

        if (!cancelled) {
          setReports(data.reports);
          setReportsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setReportsError(
            getApiErrorMessage(error, "Could not load your saved reports."),
          );
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  function scrollToResult() {
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function handleResume(file) {
    setResume(file);
    setErrors((previous) => ({ ...previous, resume: undefined }));
  }

  async function requestReport() {
    if (isGenerating) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("generating");
    setRequestError("");

    try {
      const data = await generateReport({
        resume,
        jobDescription: jobDescription.trim(),
        selfDescription: selfDescription.trim(),
        signal: controller.signal,
      });

      const nextReport = data.report;

      setReport(nextReport);
      setStatus("success");
      showToast("Your report is ready.");

      setReports((previous) => {
        const summary = {
          _id: nextReport._id,
          candidateName: nextReport.candidateName,
          targetRole: nextReport.targetRole,
          matchScore: nextReport.matchScore,
          hiringRecommendation: nextReport.hiringRecommendation,
          executiveSummary: nextReport.executiveSummary,
          createdAt: nextReport.createdAt,
        };

        return [
          summary,
          ...previous.filter((item) => item._id !== summary._id),
        ];
      });

      scrollToResult();
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }

      setStatus("error");
      setRequestError(
        getApiErrorMessage(
          error,
          "The report could not be generated. Please try again.",
        ),
      );
      showToast("The report could not be generated.", "error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isGenerating) return;

    const nextErrors = {};

    const resumeError = validateResumeFile(resume);
    if (resumeError) nextErrors.resume = resumeError;

    if (!jobDescription.trim()) {
      nextErrors.job = "Paste the job description before generating a report.";
    }

    if (!selfDescription.trim()) {
      nextErrors.self = "Add a short self-description before generating a report.";
    }

    setErrors(nextErrors);
    setRequestError("");

    if (Object.keys(nextErrors).length > 0) {
      errorSummaryRef.current?.focus();
      return;
    }

    requestReport();
  }

  async function openReport(id) {
    if (openingId || isGenerating) return;

    setOpeningId(id);

    try {
      const data = await getReport(id);

      setReport(data.report);
      setStatus("success");
      scrollToResult();
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Could not open that report."),
        "error",
      );
    } finally {
      setOpeningId(null);
    }
  }

  function startAnother() {
    setStatus("idle");
    setResume(null);
    setJobDescription("");
    setSelfDescription("");
    setErrors({});
    setRequestError("");
    setReport(null);
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Toast toast={toast} />

      <header className="nav">
        <div className="shell nav-inner">
          <Brand />

          <div className="flex items-center gap-5">
            <Link to="/app/report-studio" className="text-link">
              Report studio
            </Link>

            <Link
              to="/"
              className="text-[15px] font-medium text-secondary underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-10 sm:pt-14 lg:pt-20">
          <div className="shell">
            <div ref={heroRef} className="sheet">
              <div className="col-span-12 lg:col-span-5">
                <p className="badge" data-enter>
                  Generation workspace
                </p>

                <h1 className="display mt-7">
                  <span className="line-mask">
                    <span className="line-inner" data-line-inner>
                      Three in.
                    </span>
                  </span>
                  <span className="line-mask">
                    <span className="line-inner" data-line-inner>
                      One out.
                    </span>
                  </span>
                </h1>

                <p className="lede mt-7 max-w-[34ch]" data-enter>
                  Add your resume, the role you are chasing and a short
                  self-description. The report does the reading, the ranking and
                  the planning.
                </p>

                <ul className="mt-9 space-y-2.5" data-enter>
                  {CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[15px] leading-6 text-secondary"
                    >
                      <Check
                        size={16}
                        className="mt-1 shrink-0 text-ink"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-12 mt-14 lg:col-span-6 lg:col-start-7 lg:mt-0">
                <div className="bg-paper p-7 sm:p-9" data-enter>
                  <p className="text-[13px] text-secondary">
                    How a report is built
                  </p>

                  <ol className="mt-7 space-y-8">
                    {STEPS.map((step) => (
                      <li
                        key={step.number}
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-5"
                      >
                        <span className="fact-value text-[28px] text-subtle">
                          {step.number}
                        </span>

                        <div>
                          <p className="text-[15px] font-semibold">{step.title}</p>
                          <p className="mt-1.5 text-[15px] leading-6 text-secondary">
                            {step.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="section-tight">
          <div className="shell">
            <div className="sheet">
              <div className="col-span-12 lg:col-span-7">
                <h2 className="h2">Start a new report</h2>

                <p className="body mt-4 max-w-[46ch]">
                  Your resume, the role and your own account of what you have
                  shipped. Nothing else is asked of you before the report is
                  written.
                </p>

                <form className="mt-9" onSubmit={handleSubmit} noValidate>
                  {hasErrors ? (
                    <div
                      ref={errorSummaryRef}
                      role="alert"
                      tabIndex={-1}
                      className="alert alert-error mb-7"
                    >
                      <div>
                        <p className="font-semibold">There is a problem</p>
                        <ul className="mt-2 space-y-1">
                          {errors.resume ? (
                            <li key="resume">
                              <a
                                href="#resume"
                                className="underline underline-offset-4"
                                onClick={(event) => {
                                  event.preventDefault();
                                  document.getElementById("resume")?.focus();
                                }}
                              >
                                {errors.resume}
                              </a>
                            </li>
                          ) : null}

                          {errors.job ? (
                            <li key="job">
                              <a
                                href="#job-description"
                                className="underline underline-offset-4"
                                onClick={(event) => {
                                  event.preventDefault();
                                  document
                                    .getElementById("job-description")
                                    ?.focus();
                                }}
                              >
                                {errors.job}
                              </a>
                            </li>
                          ) : null}

                          {errors.self ? (
                            <li key="self">
                              <a
                                href="#self-description"
                                className="underline underline-offset-4"
                                onClick={(event) => {
                                  event.preventDefault();
                                  document
                                    .getElementById("self-description")
                                    ?.focus();
                                }}
                              >
                                {errors.self}
                              </a>
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  <div className="field">
                    <label htmlFor="job-description" className="label">
                      The job description
                    </label>

                    <textarea
                      id="job-description"
                      value={jobDescription}
                      onChange={(event) => {
                        setJobDescription(event.target.value);
                        setErrors((previous) => ({
                          ...previous,
                          job: undefined,
                        }));
                      }}
                      placeholder="Paste the role as it was posted."
                      aria-invalid={errors.job ? "true" : "false"}
                      aria-describedby={
                        errors.job ? "job-error" : "job-hint"
                      }
                      className="textarea"
                    />

                    {errors.job ? (
                      <p id="job-error" className="field-error">
                        {errors.job}
                      </p>
                    ) : (
                      <p id="job-hint" className="field-hint">
                        The full posting works best, including the
                        responsibilities.
                      </p>
                    )}

                    <p className="field-hint" aria-live="polite">
                      {jobDescription.trim().length} characters
                    </p>
                  </div>

                  <div className="field mt-8">
                    <label htmlFor="self-description" className="label">
                      Your self-description
                    </label>

                    <textarea
                      id="self-description"
                      value={selfDescription}
                      onChange={(event) => {
                        setSelfDescription(event.target.value);
                        setErrors((previous) => ({
                          ...previous,
                          self: undefined,
                        }));
                      }}
                      placeholder="Tell us what you have built, what you are strongest at, and what you want to improve."
                      aria-invalid={errors.self ? "true" : "false"}
                      aria-describedby={
                        errors.self ? "self-error" : "self-hint"
                      }
                      className="textarea"
                    />

                    {errors.self ? (
                      <p id="self-error" className="field-error">
                        {errors.self}
                      </p>
                    ) : (
                      <p id="self-hint" className="field-hint">
                        Keep it honest and specific. This is matched against the
                        role alongside your resume.
                      </p>
                    )}

                    <p className="field-hint" aria-live="polite">
                      {selfDescription.trim().length} characters
                    </p>
                  </div>

                  <div className="field mt-8">
                    <label htmlFor="resume" className="label">
                      Your resume
                    </label>

                    <FileDropzone
                      file={resume}
                      onFile={handleResume}
                      onClear={() => setResume(null)}
                      invalid={Boolean(errors.resume)}
                      describedBy={errors.resume ? "resume-error" : undefined}
                      disabled={isGenerating}
                    />

                    {errors.resume ? (
                      <p id="resume-error" className="field-error">
                        {errors.resume}
                      </p>
                    ) : null}
                  </div>

                  {requestError ? (
                    <div role="alert" className="alert alert-error mt-8">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">
                          The report was not generated
                        </p>
                        <p className="mt-1">{requestError}</p>

                        <button
                          type="button"
                          onClick={requestReport}
                          disabled={isGenerating}
                          className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium underline underline-offset-4"
                        >
                          <RefreshCw size={15} aria-hidden="true" />
                          Try again
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="btn btn-primary btn-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                          Generating report
                        </>
                      ) : (
                        <>
                          Generate with AI
                          <ArrowRight size={17} aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <Link
                      to="/app/report-studio"
                      className="btn btn-secondary btn-lg"
                    >
                      Open the report studio
                    </Link>
                  </div>

                  <p
                    className="mt-4 text-[13px] text-secondary"
                    aria-live="polite"
                  >
                    {isGenerating
                      ? "The local model is reading the resume, the role and your description. On a CPU this can take up to 20 minutes — you can keep this tab open."
                      : "Nothing is sent anywhere until you generate."}
                  </p>
                </form>
              </div>

              <aside className="col-span-12 mt-14 lg:col-span-4 lg:col-start-9 lg:mt-0">
                <div className="bg-surface p-6 sm:p-7">
                  <p className="text-[15px] font-semibold">Before you start</p>

                  <ul className="mt-4 space-y-4">
                    {CHECKLIST.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[15px] leading-6 text-secondary"
                      >
                        <Check
                          size={16}
                          className="mt-1 shrink-0 text-ink"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 border-t border-line pt-6">
                    <div className="fact">
                      <p className="fact-value text-ink">1</p>
                      <p className="mt-2 text-[13px] leading-5 text-secondary">
                        report, saved to your account when it is ready
                      </p>
                    </div>
                  </div>
                </div>

                <div className="field-block mt-6 p-6 sm:p-7">
                  <p className="text-[15px] font-semibold text-field-ink">
                    Reports are preparation material
                  </p>

                  <p className="mt-3 text-[15px] leading-6 text-field-muted">
                    A score is a reading of three inputs, not a prediction of a
                    hiring decision.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Result */}
        {status === "success" && report ? (
          <section ref={resultRef} className="section-tight scroll-mt-[96px]">
            <div className="shell">
              <div className="sheet">
                <div className="col-span-12 lg:col-span-4">
                  <p className="badge">Report ready</p>

                  <h2 className="h2 mt-6">
                    {report.targetRole || "Interview readiness report"}
                  </h2>

                  <p className="body mt-4 max-w-[34ch]">
                    {report.candidateName
                      ? `${report.candidateName}, the report below is built from the resume, role and self-description you submitted.`
                      : "The report below is built from the resume, role and self-description you submitted."}
                  </p>

                  <div className="mt-8 flex flex-col gap-3">
                    <Link
                      to="/app/report-studio"
                      className="btn btn-primary"
                    >
                      Open in the report studio
                    </Link>

                    <button
                      type="button"
                      onClick={startAnother}
                      className="btn btn-secondary"
                    >
                      Start another report
                    </button>
                  </div>
                </div>

                <div className="col-span-12 mt-12 lg:col-span-8 lg:col-start-5 lg:mt-0">
                  <ReportResults report={report} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Recent reports */}
        <section className="section-tight">
          <div className="shell">
            <div className="sheet">
              <div className="col-span-12 lg:col-span-4">
                <h2 className="h2">Your reports</h2>

                <p className="body mt-4 max-w-[30ch]">
                  Every report you generate is saved to your account while you
                  prepare.
                </p>
              </div>

              <div className="col-span-12 mt-10 lg:col-span-7 lg:col-start-6 lg:mt-0">
                {reportsLoading ? (
                  <div className="bg-surface p-6 sm:p-8">
                    <p className="flex items-center gap-2 text-[15px] text-secondary">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Loading your reports
                    </p>
                  </div>
                ) : reportsError ? (
                  <div className="alert alert-error">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p>{reportsError}</p>
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
                  <div className="bg-surface p-6 sm:p-8">
                    <p className="empty-mark" aria-hidden="true">
                      0
                    </p>
                    <p className="mt-3 text-[15px] text-secondary">
                      reports saved to this account
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {reports.map((item, index) => (
                      <li
                        key={item._id || `report-${index}`}
                        className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium">
                            {item.targetRole || "Interview readiness report"}
                          </p>
                          <p className="mt-1 text-[13px] text-secondary">
                            {formatDate(item.createdAt)}
                            {item.hiringRecommendation
                              ? ` · ${item.hiringRecommendation}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          {Number.isFinite(Number(item.matchScore)) ? (
                            <span className="font-semibold">
                              {Number(item.matchScore)}
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => openReport(item._id)}
                            disabled={Boolean(openingId) || isGenerating}
                            className="btn btn-secondary btn-sm"
                          >
                            {openingId === item._id ? (
                              <>
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                                Opening
                              </>
                            ) : (
                              "View report"
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Closing band */}
        <Reveal as="section" className="field-block" y={12} staggerMs={55}>
          <div className="shell flex min-h-[56svh] flex-col justify-center py-20 sm:py-24">
            <div className="sheet items-end">
              <div className="col-span-12 lg:col-span-8">
                <h2 className="display text-field-ink" data-reveal>
                  <span className="line-mask">
                    <span className="line-inner">Read it.</span>
                  </span>
                  <span className="line-mask">
                    <span className="line-inner">Fix it.</span>
                  </span>
                </h2>

                <p
                  className="mt-7 max-w-[40ch] text-[20px] leading-7 text-field-muted"
                  data-reveal
                >
                  The report tells you where you stand. The plan tells you what
                  to do about it before the interview.
                </p>
              </div>

              <div
                className="col-span-12 mt-10 flex flex-col gap-3 lg:col-span-4 lg:mt-0 lg:items-end"
                data-reveal
              >
                <Link
                  to="/app/report-studio"
                  className="btn btn-inverse btn-lg w-full sm:w-auto"
                >
                  Open the report studio
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

export default ReportGenerationPage;
