export const REPORTS = {
  frontend: {
    id: "frontend",
    label: "Frontend",
    role: "Senior Frontend Engineer",
    score: 84,
    verdict: "Proceed to the technical loop",
    summary:
      "Strong evidence for component architecture. System design and testing are the areas to close before the loop.",
    skills: [
      { name: "React & component design", value: 92 },
      { name: "TypeScript", value: 81 },
      { name: "System design", value: 58, gap: true },
      { name: "Testing strategy", value: 34, gap: true },
    ],
    questions: {
      technical: {
        label: "Technical",
        prompt:
          "How would you structure a React application for a team of twelve engineers?",
        intent:
          "Ownership boundaries, data flow, and the real cost of conventions.",
      },
      behavioural: {
        label: "Behavioural",
        prompt:
          "Tell me about a technical decision you changed after shipping it.",
        intent:
          "Judgement under new evidence, and how you bring a team with you.",
      },
    },
    plan: [
      {
        focus: "Audit the gap map",
        detail:
          "Re-read the two lowest ratings and write one sentence of evidence for each. This is the material you will rehearse against.",
      },
      {
        focus: "Rebuild one answer",
        detail:
          "Take a project you own and write the architecture decision in six sentences: context, options, choice, trade-off, result.",
      },
      {
        focus: "Testing walkthrough",
        detail:
          "Prepare one end-to-end testing story: what you test, what you leave, and how you keep the suite fast.",
      },
      {
        focus: "System design drill",
        detail:
          "Sketch a dashboard for 10,000 rows. Decide where data is fetched, cached and rendered, then say it out loud in five minutes.",
      },
      {
        focus: "Behavioural rehearsal",
        detail:
          "Write three stories with a clear conflict, a decision you made, and what changed. Keep each under two minutes.",
      },
      {
        focus: "Mock interview",
        detail:
          "Answer the two questions in this report without notes. Record it once, then cut every sentence that does not move the answer.",
      },
      {
        focus: "Close the loop",
        detail:
          "Re-read the report summary, pick the one gap you will name honestly, and prepare the question you want to ask them.",
      },
    ],
  },
  product: {
    id: "product",
    label: "Product",
    role: "Senior Product Manager",
    score: 76,
    verdict: "Proceed with a portfolio review",
    summary:
      "Clear discovery instincts and a credible portfolio. Analytics depth and pricing experience are the open questions.",
    skills: [
      { name: "Discovery & research", value: 88 },
      { name: "Experiment design", value: 72 },
      { name: "Analytics fluency", value: 61, gap: true },
      { name: "Pricing & packaging", value: 45, gap: true },
    ],
    questions: {
      technical: {
        label: "Case",
        prompt:
          "Walk us through the last product bet you killed, and how you knew.",
        intent:
          "Evidence, timing, and how you protected the team from a sunk cost.",
      },
      behavioural: {
        label: "Behavioural",
        prompt:
          "Tell me about a scope disagreement with engineering that you had to resolve.",
        intent:
          "How you separate the outcome from the estimate, and who owns the call.",
      },
    },
    plan: [
      {
        focus: "Pick the portfolio story",
        detail:
          "Choose the one product you can defend end to end, from the first interview to the metric you moved.",
      },
      {
        focus: "Numbers under the story",
        detail:
          "Write the baseline, the change, the time window, and what else could explain the result. Learn them cold.",
      },
      {
        focus: "Pricing drill",
        detail:
          "Take a product you know and write three packaging options with the metric each one protects.",
      },
      {
        focus: "Analytics rehearsal",
        detail:
          "Prepare one funnel and one cohort read. Say which number you trusted and which one you did not.",
      },
      {
        focus: "Kill story",
        detail:
          "Rehearse the bet you stopped. Lead with the decision, then the evidence, then what it cost.",
      },
      {
        focus: "Mock case",
        detail:
          "Answer the case question in this report in six minutes. Ask two clarifying questions before you propose anything.",
      },
      {
        focus: "Close the loop",
        detail:
          "Pick the gap you will name, and prepare two questions about how product decisions actually get made there.",
      },
    ],
  },
  data: {
    id: "data",
    label: "Data",
    role: "Analytics Engineer",
    score: 71,
    verdict: "Proceed to a technical screen",
    summary:
      "Solid modelling and SQL evidence. Experimentation and data contracts are the areas a panel will press on.",
    skills: [
      { name: "SQL & modelling", value: 86 },
      { name: "dbt & pipelines", value: 74 },
      { name: "Experimentation", value: 63, gap: true },
      { name: "Data contracts", value: 39, gap: true },
    ],
    questions: {
      technical: {
        label: "Technical",
        prompt:
          "How would you model a subscription business in dbt, from source to revenue?",
        intent:
          "Grain, keys, incremental logic, and the tests that keep the model honest.",
      },
      behavioural: {
        label: "Behavioural",
        prompt:
          "Tell me about a time a metric you owned turned out to be wrong.",
        intent:
          "Ownership, disclosure, and the fix that stopped it recurring.",
      },
    },
    plan: [
      {
        focus: "Audit the gap map",
        detail:
          "Re-read the two lowest ratings and find one piece of work that is honest evidence for each.",
      },
      {
        focus: "Rebuild the model",
        detail:
          "Take your best dbt project and write the grain, the keys and the incremental strategy in five sentences.",
      },
      {
        focus: "Testing story",
        detail:
          "Prepare one incident: the bad metric, how it was caught, who was told, and what changed in the pipeline.",
      },
      {
        focus: "Experiment drill",
        detail:
          "Explain how you would read the result of a pricing test with a noisy conversion funnel.",
      },
      {
        focus: "Contract rehearsal",
        detail:
          "Describe one data contract you would put between a producer and a consumer, and what it prevents.",
      },
      {
        focus: "Mock screen",
        detail:
          "Answer the technical question in this report in seven minutes, with a diagram and a test.",
      },
      {
        focus: "Close the loop",
        detail:
          "Name the gap you will be honest about, and prepare a question about how the team decides what ships.",
      },
    ],
  },
};

export const REPORT_ORDER = ["frontend", "product", "data"];
