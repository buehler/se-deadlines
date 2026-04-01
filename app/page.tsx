import Link from "next/link";

const queryClauses = [
  { field: "Tag", operator: "CONTAINS", value: "testing" },
  { field: "Core", operator: "IS", value: "A*" },
  { field: "Deadline", operator: "AFTER", value: "2026-04-01" },
];

const sampleDeadlines = [
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
    summary: "Flagship conference for software engineering research and practice.",
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

const formatOptions = ["text", "json", "json-feed", "rss", "atom", "ical"] as const;

const previewUrl =
  "/deadlines/json?q=tags=like='testing';and;deadline=gt='2026-04-01';and;core=='A*'";

export default function Home() {
  return (
    <main className="app-shell flex-1 pb-16">
      <header className="sticky top-0 z-30 border-b border-outline-variant/10 bg-surface/85 backdrop-blur-xl">
        <div className="editorial-shell flex min-h-18 items-center justify-between gap-6 py-5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              SE Deadlines
            </span>
            <span className="text-sm text-on-surface-variant">
              API browser for conference deadlines and feed exports
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-on-surface-variant">
            <a className="font-semibold text-primary" href="#workspace">
              Query
            </a>
            <a className="hover:text-primary" href="#formats">
              Formats
            </a>
            <Link className="hover:text-primary" href="/deadlines">
              Raw endpoint
            </Link>
          </nav>
        </div>
      </header>

      <section className="editorial-shell grid gap-10 pt-10 lg:grid-cols-[1.35fr_0.9fr] lg:pt-14">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Digital Archivist Interface
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-on-surface sm:text-6xl">
              Build deadline feeds without reading route code first.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-on-surface-variant">
              The main API route already works. This page turns it into an
              operational surface: compose a filter, inspect the generated
              endpoint, then export deadlines as plain text, JSON, feed
              formats, or iCal.
            </p>
          </div>

          <div className="glass-panel ghost-outline surface-panel rounded-[1.75rem] p-4 sm:p-6">
            <div className="hero-gradient rounded-[1.4rem] px-6 py-6 text-on-primary sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Main Use Case
                  </p>
                  <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                    Query one dataset, publish to six downstream formats.
                  </h2>
                  <p className="max-w-lg text-sm leading-7 text-white/80">
                    RSQL-backed filtering on the route layer, readable export
                    links on the UI layer, no duplicated logic.
                  </p>
                </div>
                <div className="grid min-w-[15rem] gap-3 text-sm text-white/80 sm:grid-cols-3 lg:grid-cols-1">
                  <div>
                    <div className="text-2xl font-semibold text-white">1</div>
                    <div>Compose query</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-white">2</div>
                    <div>Choose format</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-white">3</div>
                    <div>Use generated URL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="section-surface ghost-outline rounded-[1.75rem] p-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">
                Endpoint
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-on-surface">
                `/deadlines/[[...acceptType]]`
              </h2>
            </div>

            <div className="ambient-divider" />

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-on-surface">Route parameter</dt>
                <dd className="mt-1 text-on-surface-variant">
                  Optional output type: `json`, `rss`, `atom`, `json-feed`,
                  `ical`, or text fallback.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-on-surface">Query parameter</dt>
                <dd className="mt-1 text-on-surface-variant">
                  `q` is passed directly into the RSQL filter implementation.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-on-surface">Data source</dt>
                <dd className="mt-1 text-on-surface-variant">
                  The route refreshes from the upstream YAML conference dataset
                  every 24 hours.
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section
        id="workspace"
        className="editorial-shell mt-10 grid gap-8 lg:grid-cols-[1.45fr_0.95fr]"
      >
        <div className="section-surface ghost-outline rounded-[1.75rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">
                Query Builder
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-on-surface">
                Compose RSQL visually, keep the route untouched
              </h2>
            </div>
            <button className="rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary">
              Clear all
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {queryClauses.map((clause) => (
              <div
                key={`${clause.field}-${clause.operator}-${clause.value}`}
                className="token-chip"
              >
                <span className="text-primary">{clause.field}</span>
                <span className="text-outline">{clause.operator}</span>
                <span className="font-bold">{clause.value}</span>
              </div>
            ))}
            <button className="rounded-full border border-dashed border-outline-variant bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant hover:border-primary hover:text-primary">
              Add condition
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="field-label">Keyword</span>
              <input
                className="field-input"
                defaultValue="testing"
                name="keyword"
                type="text"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">Earliest deadline</span>
              <input
                className="field-input"
                defaultValue="2026-04-01"
                name="deadline"
                type="date"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">CORE rank</span>
              <select className="field-input" defaultValue="A*" name="core">
                <option>A*</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">Location</span>
              <select
                className="field-input"
                defaultValue="all"
                name="location"
              >
                <option value="all">All locations</option>
                <option>Europe</option>
                <option>North America</option>
                <option>Asia</option>
              </select>
            </label>
          </div>
        </div>

        <div
          id="formats"
          className="flex flex-col gap-6 rounded-[1.75rem] bg-secondary/5 p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                Export
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-secondary">
                Generated endpoint preview
              </h2>
            </div>
            <button className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary shadow-[0_12px_32px_-4px_rgba(6,97,156,0.12)]">
              Copy URL
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => (
              <span
                key={option}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  option === "json"
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container-lowest text-secondary"
                }`}
              >
                {option}
              </span>
            ))}
          </div>

          <pre className="overflow-x-auto rounded-[1.4rem] bg-on-surface p-5 text-xs leading-7 text-primary-fixed">
            <code>{previewUrl}</code>
          </pre>

          <div className="grid gap-3 text-sm text-on-surface-variant">
            <p>Text is the fallback response when no output type is provided.</p>
            <p>
              JSON, feeds, and iCal all reuse the same filtered venue list from
              the route handler.
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-shell mt-8">
        <div className="rounded-[1.9rem] bg-surface-container-low p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">
                Previewed deadlines
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-on-surface">
                Sample output mapped back to readable cards
              </h2>
            </div>
            <div className="text-sm text-on-surface-variant">
              Editorial layout over the same deadline model
            </div>
          </div>

          <div className="mt-2 grid gap-4">
            {sampleDeadlines.map((deadline) => {
              const urgent = deadline.urgency === "Closing Soon";

              return (
                <article
                  key={deadline.title}
                  className={`surface-panel ghost-outline rounded-[1.6rem] bg-surface-container-lowest p-6 transition hover:bg-surface-container-low ${
                    urgent ? "relative overflow-hidden" : ""
                  }`}
                >
                  {urgent ? (
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-tertiary" />
                  ) : null}

                  <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
                    <div className="min-w-24 border-outline-variant/20 md:border-r md:pr-6">
                      <p
                        className={`text-[0.68rem] font-bold uppercase tracking-[0.22em] ${
                          urgent ? "text-tertiary" : "text-outline"
                        }`}
                      >
                        {deadline.urgency}
                      </p>
                      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-on-surface">
                        {deadline.month}
                      </div>
                      <div
                        className={`text-2xl font-light ${
                          urgent ? "text-tertiary" : "text-on-surface-variant"
                        }`}
                      >
                        {deadline.day}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-on-surface">
                          {deadline.title}
                        </h3>
                        <span className="rounded-full bg-tertiary/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-tertiary">
                          {deadline.rank}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary">
                          {deadline.h5}
                        </span>
                      </div>
                      <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                        {deadline.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {deadline.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface-variant"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-44 border-outline-variant/20 text-left md:border-l md:pl-6 md:text-right">
                      <p className="text-sm font-medium text-on-surface-variant">
                        {deadline.place}
                      </p>
                      <p
                        className={`mt-2 text-xs ${
                          urgent
                            ? "font-semibold text-tertiary"
                            : "text-outline"
                        }`}
                      >
                        {deadline.note}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
