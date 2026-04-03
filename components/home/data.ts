export type QueryClause = {
  field: string;
  operator: string;
  value: string;
};

export type SampleDeadline = {
  month: string;
  day: string;
  urgency: "Standard" | "Closing Soon";
  title: string;
  rank: string;
  h5: string;
  summary: string;
  tags: string[];
  place: string;
  note: string;
};

export const queryClauses: QueryClause[] = [
  { field: "Tag", operator: "CONTAINS", value: "testing" },
  { field: "Core", operator: "IS", value: "A*" },
  { field: "Deadline", operator: "AFTER", value: "2026-04-01" },
];

export const sampleDeadlines: SampleDeadline[] = [
  {
    month: "APR",
    day: "14",
    urgency: "Standard",
    title: "ASE 2026",
    rank: "CORE A*",
    h5: "H5: 64",
    summary: "International conference on automated software engineering.",
    tags: ["Testing", "Formal Methods", "Synthesis"],
    place: "Singapore",
    note: "Abstracts due Apr 07",
  },
  {
    month: "APR",
    day: "21",
    urgency: "Closing Soon",
    title: "ICSE 2027",
    rank: "CORE A*",
    h5: "H5: 92",
    summary: "Flagship conference for software engineering research & practice.",
    tags: ["General SE", "Maintenance", "Empirical"],
    place: "Madrid, Spain",
    note: "7 days remaining",
  },
  {
    month: "MAY",
    day: "03",
    urgency: "Standard",
    title: "RE 2026",
    rank: "CORE A",
    h5: "H5: 47",
    summary: "Requirements engineering venues filtered through the same API query.",
    tags: ["Requirements", "Qualitative", "Case Study"],
    place: "Lisbon, Portugal",
    note: "Notifications expected in June",
  },
];

export const formatOptions = [
  "text",
  "json",
  "json-feed",
  "rss",
  "atom",
  "ical",
] as const;

export const previewUrl =
  "/deadlines/json?q=tags=like='testing';and;deadline=gt='2026-04-01';and;core=='A*'";
