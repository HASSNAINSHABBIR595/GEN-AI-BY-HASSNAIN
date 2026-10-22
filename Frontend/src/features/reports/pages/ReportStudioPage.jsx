import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Brand from "../../../components/Brand.jsx";
import Toast from "../../../components/Toast.jsx";
import useToast from "../../../hooks/useToast.js";
import ReportResults from "../components/ReportResults.jsx";
import { getReport, getReports } from "../services/report.api.js";
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

function ReportStudioPage() {
  const { toast, showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [openingId, setOpeningId] = useState(null);

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

  async function openReport(id) {
    if (openingId) return;

    setOpeningId(id);

    try {
      const data = await getReport(id);
      setSelectedReport(data.report);

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (requestError) {
      showToast(
        getApiErrorMessage(requestError, "Could not open that report."),
        "error",
      );
    } finally {
      setOpeningId(null);
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
            {selectedReport ? (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    All reports
                  </button>

                  <Link to="/app" className="text-link">
                    Generate another
                  </Link>
                </div>

                <ReportResults report={selectedReport} />
              </>
            ) : (
              <>
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
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportStudioPage;
