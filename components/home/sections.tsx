import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  EndpointFact,
  FormatBadge,
  HeroPanel,
  HeroPanelContent,
  InlineMetric,
  QueryClauseBadge,
  SectionEyebrow,
  SurfacePanel,
  SurfacePanelBody,
  SurfacePanelHeader,
} from "@/components/home/primitives";
import type { QueryClause, SampleDeadline } from "@/components/home/data";

function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/10 bg-surface/85 backdrop-blur-xl">
      <div className="editorial-shell flex min-h-18 items-center justify-between gap-6 py-5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            SE Deadlines
          </span>
          <span className="text-sm text-on-surface-variant">
            API browser for conference deadlines & feed exports
          </span>
        </div>
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 text-sm text-on-surface-variant"
        >
          <a className="font-semibold text-primary hover:text-primary" href="#workspace">
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
  );
}

function HeroSection() {
  return (
    <section className="editorial-shell grid gap-10 pt-10 lg:grid-cols-[1.35fr_0.9fr] lg:pt-14">
      <div className="space-y-8">
        <div className="max-w-3xl space-y-5">
          <Badge className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-none">
            Digital Archivist Interface
          </Badge>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-on-surface sm:text-6xl">
            Build deadline feeds without reading route code first.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-on-surface-variant">
            The main API route already works. This page turns it into an
            operational surface: compose a filter, inspect the generated
            endpoint, then export deadlines as plain text, JSON, feed formats,
            or iCal.
          </p>
        </div>

        <HeroPanel>
          <HeroPanelContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl space-y-3">
                <SectionEyebrow className="text-white/70">
                  Main Use Case
                </SectionEyebrow>
                <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                  Query one dataset, publish to six downstream formats.
                </h2>
                <p className="max-w-lg text-sm leading-7 text-white/80">
                  RSQL-backed filtering on the route layer, readable export
                  links on the UI layer, no duplicated logic.
                </p>
              </div>
              <div className="grid min-w-[15rem] gap-3 text-sm text-white/80 sm:grid-cols-3 lg:grid-cols-1">
                <InlineMetric value="1" label="Compose query" />
                <InlineMetric value="2" label="Choose format" />
                <InlineMetric value="3" label="Use generated URL" />
              </div>
            </div>
          </HeroPanelContent>
        </HeroPanel>
      </div>

      <SurfacePanel as="aside" className="p-0">
        <SurfacePanelHeader
          eyebrow="Endpoint"
          title="`/deadlines/[[...acceptType]]`"
          className="pb-0"
        />
        <SurfacePanelBody className="pt-5">
          <Separator className="mb-5 bg-outline-variant/20" />
          <dl className="grid gap-4 text-sm">
            <EndpointFact
              term="Route parameter"
              detail="Optional output type: `json`, `rss`, `atom`, `json-feed`, `ical`, or text fallback."
            />
            <EndpointFact
              term="Query parameter"
              detail="`q` is passed directly into the RSQL filter implementation."
            />
            <EndpointFact
              term="Data source"
              detail="The route refreshes from the upstream YAML conference dataset every 24 hours."
            />
          </dl>
        </SurfacePanelBody>
      </SurfacePanel>
    </section>
  );
}

function QueryBuilderSection({
  clauses,
}: {
  clauses: QueryClause[];
}) {
  return (
    <section
      id="workspace"
      aria-labelledby="query-builder-title"
      className="editorial-shell scroll-mt-24 mt-10 grid gap-8 lg:grid-cols-[1.45fr_0.95fr]"
    >
      <SurfacePanel>
        <SurfacePanelHeader
          eyebrow="Query Builder"
          title={<span id="query-builder-title">Compose RSQL visually, keep the route untouched</span>}
          action={
            <Button
              type="button"
              variant="secondary"
              className="rounded-full bg-surface-container-high px-4 text-primary shadow-none hover:bg-surface-container"
            >
              Clear all
            </Button>
          }
        />
        <SurfacePanelBody className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            {clauses.map((clause) => (
              <QueryClauseBadge
                key={`${clause.field}-${clause.operator}-${clause.value}`}
                field={clause.field}
                operator={clause.operator}
                value={clause.value}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-dashed border-outline-variant bg-transparent px-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant hover:border-primary hover:bg-transparent hover:text-primary"
            >
              Add condition
            </Button>
          </div>

          <form>
            <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="keyword" className="field-label">
                  Keyword
                </FieldLabel>
                <Input
                  id="keyword"
                  name="keyword"
                  autoComplete="off"
                  spellCheck={false}
                  defaultValue="testing"
                  className="field-input h-auto border-transparent bg-surface-container-high px-4 py-3"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="deadline" className="field-label">
                  Earliest deadline
                </FieldLabel>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  autoComplete="off"
                  defaultValue="2026-04-01"
                  className="field-input h-auto border-transparent bg-surface-container-high px-4 py-3"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="core-rank" className="field-label">
                  CORE rank
                </FieldLabel>
                <Select defaultValue="A*" name="core">
                  <SelectTrigger
                    id="core-rank"
                    className="field-input h-auto w-full border-transparent bg-surface-container-high px-4 py-3"
                  >
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="A*">A*</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="location" className="field-label">
                  Location
                </FieldLabel>
                <Select defaultValue="all" name="location">
                  <SelectTrigger
                    id="location"
                    className="field-input h-auto w-full border-transparent bg-surface-container-high px-4 py-3"
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All locations</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="Asia">Asia</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </form>
        </SurfacePanelBody>
      </SurfacePanel>
    </section>
  );
}

function ExportPreviewSection({
  options,
  url,
}: {
  options: readonly string[];
  url: string;
}) {
  return (
    <section
      id="formats"
      aria-labelledby="export-preview-title"
      className="editorial-shell scroll-mt-24 mt-8"
    >
      <SurfacePanel className="border-0 bg-secondary/5">
        <SurfacePanelHeader
          eyebrow="Export"
          title={<span id="export-preview-title">Generated endpoint preview</span>}
          action={
            <Button
              type="button"
              variant="secondary"
              className="rounded-full bg-secondary px-4 text-on-secondary shadow-[0_12px_32px_-4px_rgba(6,97,156,0.12)] hover:bg-secondary/90"
            >
              Copy URL
            </Button>
          }
        />
        <SurfacePanelBody className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <FormatBadge key={option} active={option === "json"}>
                {option}
              </FormatBadge>
            ))}
          </div>

          <pre className="overflow-x-auto rounded-[1.4rem] bg-on-surface p-5 text-xs leading-7 text-primary-fixed">
            <code>{url}</code>
          </pre>

          <div className="grid gap-3 text-sm text-on-surface-variant">
            <p>Text is the fallback response when no output type is provided.</p>
            <p>
              JSON, feeds, and iCal all reuse the same filtered venue list from
              the route handler.
            </p>
          </div>
        </SurfacePanelBody>
      </SurfacePanel>
    </section>
  );
}

function DeadlineCard({ deadline }: { deadline: SampleDeadline }) {
  const urgent = deadline.urgency === "Closing Soon";

  return (
    <article
      className={cn(
        "surface-panel ghost-outline rounded-[1.6rem] bg-surface-container-lowest p-6 transition hover:bg-surface-container-low",
        urgent && "relative overflow-hidden"
      )}
    >
      {urgent ? (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-tertiary"
        />
      ) : null}

      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
        <div className="min-w-24 border-outline-variant/20 md:border-r md:pr-6">
          <p
            className={cn(
              "text-[0.68rem] font-bold uppercase tracking-[0.22em]",
              urgent ? "text-tertiary" : "text-outline"
            )}
          >
            {deadline.urgency}
          </p>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-on-surface">
            {deadline.month}
          </div>
          <div
            className={cn(
              "text-2xl font-light",
              urgent ? "text-tertiary" : "text-on-surface-variant"
            )}
          >
            {deadline.day}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-on-surface">
              {deadline.title}
            </h3>
            <Badge className="rounded-full bg-tertiary/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-tertiary shadow-none">
              {deadline.rank}
            </Badge>
            <Badge className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary shadow-none">
              {deadline.h5}
            </Badge>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
            {deadline.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {deadline.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full border-transparent bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface-variant"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="min-w-44 border-outline-variant/20 text-left md:border-l md:pl-6 md:text-right">
          <p className="text-sm font-medium text-on-surface-variant">
            {deadline.place}
          </p>
          <p
            className={cn(
              "mt-2 text-xs",
              urgent ? "font-semibold text-tertiary" : "text-outline"
            )}
          >
            {deadline.note}
          </p>
        </div>
      </div>
    </article>
  );
}

function DeadlinesPreviewSection({
  deadlines,
}: {
  deadlines: SampleDeadline[];
}) {
  return (
    <section className="editorial-shell mt-8">
      <SurfacePanel className="bg-surface-container-low px-0 py-0">
        <SurfacePanelHeader
          eyebrow="Previewed deadlines"
          title="Sample output mapped back to readable cards"
          description="Editorial layout over the same deadline model"
          className="px-3 pt-4 sm:px-5 sm:pt-5"
        />
        <SurfacePanelBody className="grid gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
          {deadlines.map((deadline) => (
            <DeadlineCard key={deadline.title} deadline={deadline} />
          ))}
        </SurfacePanelBody>
      </SurfacePanel>
    </section>
  );
}

export {
  DeadlinesPreviewSection,
  ExportPreviewSection,
  HeroSection,
  HomeHeader,
  QueryBuilderSection,
};
