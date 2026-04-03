import Link from "next/link";

import { QueryBuilder } from "@/components/home/query-builder/query-builder";

function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/10 bg-surface/85 backdrop-blur-xl">
      <div className="editorial-shell flex min-h-18 items-center justify-between gap-6 py-5">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          SE Deadlines
        </span>
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 text-sm text-on-surface-variant"
        >
          <a className="font-semibold text-primary hover:text-primary" href="#workspace">
            Query
          </a>
          <Link className="hover:text-primary" href="/deadlines">
            Raw endpoint
          </Link>
        </nav>
      </div>
    </header>
  );
}

function QueryBuilderSection() {
  return (
    <section
      id="workspace"
      aria-labelledby="query-builder-title"
      className="editorial-shell scroll-mt-24 pt-12 sm:pt-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <h1
            id="query-builder-title"
            className="text-balance text-5xl font-semibold tracking-[-0.05em] text-on-surface sm:text-6xl md:text-7xl"
          >
            SE Deadlines for conferences
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">
            Filter the conference dataset and shape the query before hitting the
            endpoint.
          </p>
        </div>
        <QueryBuilder />
      </div>
    </section>
  );
}

export { HomeHeader, QueryBuilderSection };
