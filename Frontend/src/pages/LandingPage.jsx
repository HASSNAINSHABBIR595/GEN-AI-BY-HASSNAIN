import { useRef, useState } from "react";
import { Check, FileText } from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ReportSheet from "../components/ReportSheet";
import { REPORTS, REPORT_ORDER } from "../data/reports.js";
import Reveal from "../components/Reveal";
import { useEntrance } from "../animations/useEntrance.js";
import { useMaskedLines } from "../animations/useMaskedLines.js";
import { useAuth } from "../features/auth/hooks/useAuth";

import libraryGreen from "../assets/images/library-green.jpg";
import libraryWarm from "../assets/images/library-warm.jpg";

const PROMISES = [
  {
    title: "Where do I stand?",
    description:
      "A match score and a plain hiring recommendation, so the first thing you know is the thing you came for.",
  },
  {
    title: "What can I prove?",
    description:
      "Each requirement is marked as strong, partial or missing, with the part of your resume that supports it.",
  },
  {
    title: "What will they ask?",
    description:
      "Technical, system design and behavioural questions written for this role, with the intent behind each one.",
  },
  {
    title: "Where will I struggle?",
    description:
      "The gaps are ranked by how much they change the outcome, not by how easy they are to put in a list.",
  },
  {
    title: "What do I do next?",
    description:
      "A seven-day plan with one focus per day, sized to the time you actually have before the interview.",
  },
  {
    title: "Why this report?",
    description:
      "It is built from your two documents, not a generic question bank. Every line traces back to something you wrote.",
  },
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function RoleControl({ reportId, setReportId }) {
  return (
    <div className="segment">
      {REPORT_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setReportId(id)}
          aria-pressed={reportId === id}
        >
          {REPORTS[id].label}
        </button>
      ))}
    </div>
  );
}

function QuestionControl({ report, questionType, setQuestionType }) {
  return (
    <div className="segment">
      {["technical", "behavioural"].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => setQuestionType(type)}
          aria-pressed={questionType === type}
        >
          {report.questions[type].label}
        </button>
      ))}
    </div>
  );
}

function PlanControl({ day, setDay }) {
  return (
    <div className="segment">
      {DAYS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setDay(value)}
          aria-pressed={day === value}
          aria-label={`Day ${value}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function LandingPage() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  useMaskedLines(heroRef);
  useEntrance(heroRef, {
    selector: "[data-enter]",
    staggerMs: 70,
    duration: 460,
    startDelay: 200,
  });

  const [reportId, setReportId] = useState("frontend");
  const [questionType, setQuestionType] = useState("technical");
  const [focusGaps, setFocusGaps] = useState(false);
  const [day, setDay] = useState(2);

  const report = REPORTS[reportId];
  const primaryTo = user ? "/app" : "/register";
  const primaryLabel = user ? "Open workspace" : "Create your account";
  const secondaryTo = user ? "/app/report-studio" : "/login";
  const secondaryLabel = user ? "Open the report studio" : "Sign in";

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <section className="pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-16">
          <div className="shell">
            <div ref={heroRef} className="sheet">
              <div className="hidden lg:col-span-4 lg:row-start-1 lg:flex lg:flex-col lg:pt-40">
                <p className="lede max-w-[30ch]" data-enter>
                  GEN+AI reads your resume and the job description, then writes
                  the interview readiness report you can actually prepare from.
                </p>

                <div
                  className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start xl:flex-row"
                  data-enter
                >
                  <Link to={primaryTo} className="btn btn-primary btn-lg">
                    {primaryLabel}
                  </Link>

                  <Link to={secondaryTo} className="btn btn-secondary btn-lg">
                    {secondaryLabel}
                  </Link>
                </div>

                <div className="mt-12 max-w-[26ch]" data-enter>
                  <p className="text-[15px] font-semibold">You bring two things</p>

                  <ul className="mt-3 space-y-2">
                    {[
                      "Your resume, as a PDF",
                      "The role you are applying for",
                    ].map((item) => (
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

                <div className="field-block mt-20 w-full max-w-[280px] px-6 py-5">
                  <p className="fact-value text-field-ink">7</p>
                  <p className="mt-2 text-[15px] leading-5 text-field-muted">
                    days of preparation,
                    <br />
                    planned for you
                  </p>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8 lg:col-start-5 lg:row-start-1">
                <h1 className="display">
                  <span className="line-mask">
                    <span className="line-inner" data-line-inner>
                      Walk in
                    </span>
                  </span>
                  <span className="line-mask">
                    <span className="line-inner" data-line-inner>
                      ready.
                    </span>
                  </span>
                </h1>

                <div className="mt-8 flex flex-col gap-3 lg:hidden" data-enter>
                  <p className="lede max-w-[32ch]">
                    GEN+AI reads your resume and the job description, then writes
                    the interview readiness report you can actually prepare
                    from.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link to={primaryTo} className="btn btn-primary btn-lg">
                      {primaryLabel}
                    </Link>

                    <Link to={secondaryTo} className="btn btn-secondary btn-lg">
                      {secondaryLabel}
                    </Link>
                  </div>

                  <p className="mt-5 text-[15px] leading-6 text-secondary">
                    Seven days of preparation, planned for you.
                  </p>
                </div>

                <div className="relative mt-14                                sm:ml-10">
                  <ReportSheet report={REPORTS.frontend} compact />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <Reveal
          as="section"
          id="how-it-works"
          className="section surface-block"
          staggerMs={60}
        >
          <div className="shell">
            <div className="sheet">
              <div className="col-span-12 lg:col-span-3">
                <h2 className="h2" data-reveal>
                  Two in. One out.
                </h2>

                <p className="body mt-5 max-w-[30ch]" data-reveal>
                  No setup, no question bank to browse. You add the context and
                  the report does the reading.
                </p>
              </div>

              <div className="col-span-12 mt-12 lg:col-span-8 lg:col-start-5 lg:mt-0">
                <div className="space-y-16 sm:space-y-20">
                  <div data-reveal>
                    <h3 className="h3">First, add your resume.</h3>

                    <div className="mt-5 bg-background p-5 sm:p-6">
                      <div className="flex items-center gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-surface text-ink">
                          <FileText size={19} aria-hidden="true" />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[15px] font-medium">Resume.pdf</p>
                          <p className="small">2 pages, read in full</p>
                        </div>

                        <span className="ml-auto flex items-center gap-1.5 text-[13px] text-secondary">
                          <Check size={14} aria-hidden="true" />
                          Parsed
                        </span>
                      </div>
                    </div>

                    <div
                      className="mt-5 bg-paper p-5 sm:ml-14 sm:p-6"
                      data-ui
                    >
                      <p className="text-[13px] text-secondary">
                        Evidence found in the resume
                      </p>

                      <p className="mt-2 text-[15px] font-medium">
                        14 skills, 3 roles, 2 shipped projects
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "React",
                          "TypeScript",
                          "Design systems",
                          "GraphQL",
                          "Testing",
                          "Mentoring",
                        ].map((skill) => (
                          <span
                            key={skill}
                            className="bg-surface px-2.5 py-1 text-[13px] text-ink"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div data-reveal>
                    <h3 className="h3">Then paste the job description.</h3>

                    <div className="mt-5 bg-background p-5 sm:p-6">
                      <p className="text-[13px] text-secondary">
                        The role, as posted
                      </p>
                      <p className="mt-2 text-[15px] leading-6">
                        Senior Frontend Engineer. Five or more years with React
                        and TypeScript. You have shipped design systems, care
                        about testing, and can lead a small team.
                      </p>
                    </div>

                    <div
                      className="mt-5 bg-paper p-5 sm:ml-14 sm:p-6"
                      data-ui
                    >
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[13px] text-secondary">
                            Match against your resume
                          </p>
                          <p className="mt-1 text-[20px] font-semibold leading-none">
                            12 of 14 requirements have evidence
                          </p>
                        </div>

                        <p className="text-[44px] font-semibold leading-none tracking-[-0.06em]">
                          84
                        </p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {[
                          { label: "React and component design", value: 92 },
                          { label: "System design", value: 58, gap: true },
                          { label: "Testing strategy", value: 34, gap: true },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                              <span>{item.label}</span>
                              <span className="font-medium">{item.value}%</span>
                            </div>
                            <div className="report-track mt-1.5">
                              <div
                                className="report-track-fill"
                                data-gap={item.gap ? "true" : "false"}
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div data-reveal>
                    <h3 className="h3">Then read the report.</h3>

                    <p className="body mt-4 max-w-[52ch]">
                      The score, the evidence, the questions and the plan arrive
                      together, sized to the role you are actually chasing.
                    </p>

                    <div className="mt-6 max-w-[760px]">
                      <ReportSheet report={REPORTS.frontend} compact />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* The rooms */}
        <Reveal as="section" className="section-tight" staggerMs={55}>
          <div className="shell">
            <div className="mosaic" data-reveal>
              <div className="col-span-12 flex flex-col justify-between gap-10 bg-field p-7 text-field-ink sm:p-9 md:col-span-4">
                <h2 className="h2 text-field-ink">
                  Quiet work.
                </h2>

                <p className="max-w-[30ch] text-[18px] leading-6 text-field-muted">
                  The report does the reading and the sorting. You get the room,
                  the list, and the next seven days.
                </p>
              </div>

              <figure className="col-span-12 h-[320px] overflow-hidden md:col-span-5 md:h-auto">
                <img
                  src={libraryGreen}
                  alt="A miniature Georgian library in green, with a fireplace, writing desk and walls of books."
                  width="1920"
                  height="1189"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale"
                />
              </figure>

              <figure className="col-span-12 h-[320px] overflow-hidden md:col-span-3 md:h-auto">
                <img
                  src={libraryWarm}
                  alt="A miniature eighteenth-century library in warm wood, with a chandelier, armchairs and a writing table."
                  width="1920"
                  height="1627"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale"
                />
              </figure>
            </div>

            <p className="caption">
              <span>
                Miniature library rooms by Narcissa Niblack Thorne, c. 1937.
              </span>
              <span>Art Institute of Chicago, public domain.</span>
            </p>
          </div>
        </Reveal>

        {/* The report */}
        <section id="report" className="section">
          <div className="shell">
            <div className="section-head" data-reveal>
              <h2 className="h2">A report you can work from.</h2>

              <p className="body max-w-[48ch]">
                This is the sample report. Change the role, keep the gaps in
                front, swap the question type, or open a day of the plan. The
                report on the left is the same one you would take into the room.
              </p>
            </div>

            <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-7 lg:sticky lg:top-[96px] lg:self-start">
                <ReportSheet
                  report={report}
                  questionType={questionType}
                  focusGaps={focusGaps}
                  day={day}
                  onDayChange={setDay}
                  showPlan
                />
              </div>

              <div className="lg:col-span-4 lg:col-start-9">
                {/* Phone controls */}
                <div className="bg-surface p-5 sm:p-6 lg:hidden">
                  <div className="grid gap-6">
                    <div>
                      <p className="text-[15px] font-semibold">Change the role</p>
                      <div className="mt-3">
                        <RoleControl
                          reportId={reportId}
                          setReportId={setReportId}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[15px] font-semibold">
                        Keep the gaps in front
                      </p>
                      <label className="toggle mt-3">
                        <input
                          type="checkbox"
                          checked={focusGaps}
                          onChange={(event) =>
                            setFocusGaps(event.target.checked)
                          }
                        />
                        <span className="toggle-track" aria-hidden="true" />
                        {focusGaps ? "On" : "Off"}
                      </label>
                    </div>

                    <div>
                      <p className="text-[15px] font-semibold">
                        Change the question
                      </p>
                      <div className="mt-3">
                        <QuestionControl
                          report={report}
                          questionType={questionType}
                          setQuestionType={setQuestionType}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[15px] font-semibold">Open a day</p>
                      <div className="mt-3">
                        <PlanControl day={day} setDay={setDay} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop controls and copy */}
                <div className="hidden lg:block">
                  <div className="flex min-h-[46vh] flex-col justify-center">
                    <h3 className="h3">Start with the role.</h3>
                    <p className="body mt-3 max-w-[38ch]">
                      The same resume reads differently against a frontend, a
                      product or a data role. Pick the one you are chasing.
                    </p>
                    <div className="mt-5">
                      <RoleControl
                        reportId={reportId}
                        setReportId={setReportId}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-[46vh] flex-col justify-center">
                    <h3 className="h3">Keep the gaps in front.</h3>
                    <p className="body mt-3 max-w-[38ch]">
                      Strong evidence is useful. The two or three gaps that will
                      decide the interview are more useful.
                    </p>
                    <label className="toggle mt-5">
                      <input
                        type="checkbox"
                        checked={focusGaps}
                        onChange={(event) =>
                          setFocusGaps(event.target.checked)
                        }
                      />
                      <span className="toggle-track" aria-hidden="true" />
                      {focusGaps ? "Showing gaps" : "Showing everything"}
                    </label>
                  </div>

                  <div className="flex min-h-[46vh] flex-col justify-center">
                    <h3 className="h3">Change the question.</h3>
                    <p className="body mt-3 max-w-[38ch]">
                      The report carries both a technical question and a
                      behavioural one, each with the intent behind it.
                    </p>
                    <div className="mt-5">
                      <QuestionControl
                        report={report}
                        questionType={questionType}
                        setQuestionType={setQuestionType}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-[46vh] flex-col justify-center">
                    <h3 className="h3">Open a day of the plan.</h3>
                    <p className="body mt-3 max-w-[38ch]">
                      Seven days, one focus each. The plan is built from the gaps
                      above, not from a generic checklist.
                    </p>
                    <div className="mt-5">
                      <PlanControl day={day} setDay={setDay} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's inside */}
        <Reveal as="section" id="inside" className="section pt-0" staggerMs={55}>
          <div className="shell">
            <div className="sheet">
              <div className="col-span-12 lg:col-span-4">
                <h2 className="h2" data-reveal>
                  What every report answers.
                </h2>

                <p className="body mt-5 max-w-[30ch]" data-reveal>
                  A readiness report is only useful if it changes what you do
                  next. These are the questions it settles.
                </p>
              </div>

              <div className="col-span-12 mt-12 lg:col-span-7 lg:col-start-6 lg:mt-0">
                <div className="promise-list">
                  {PROMISES.map((promise) => (
                    <div
                      key={promise.title}
                      className="promise"
                      data-reveal
                    >
                      <h3 className="h3">{promise.title}</h3>
                      <p className="body">{promise.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal as="section" className="field-block" y={12} staggerMs={55}>
          <div className="shell flex min-h-[72svh] flex-col justify-center py-20 sm:py-24">
            <div className="sheet items-end">
              <div className="col-span-12 lg:col-span-8">
                <h2 className="display text-field-ink" data-reveal>
                  <span className="line-mask">
                    <span className="line-inner">Walk in</span>
                  </span>
                  <span className="line-mask">
                    <span className="line-inner">knowing.</span>
                  </span>
                </h2>

                <p
                  className="mt-7 max-w-[40ch] text-[20px] leading-7 text-field-muted"
                  data-reveal
                >
                  Two documents. One report. A clear list of what to fix before
                  the interview, and the questions you are most likely to face.
                </p>
              </div>

              <div
                className="col-span-12 mt-10 flex flex-col gap-3 lg:col-span-4 lg:mt-0 lg:items-end"
                data-reveal
              >
                <Link
                  to={primaryTo}
                  className="btn btn-inverse btn-lg w-full sm:w-auto"
                >
                  {primaryLabel}
                </Link>

                {!user ? (
                  <Link
                    to="/login"
                    className="btn btn-outline-inverse btn-lg w-full sm:w-auto"
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;




