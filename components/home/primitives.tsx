import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
} from "@/components/ui/card";

function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.22em] text-outline",
        className
      )}
    >
      {children}
    </p>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-on-surface">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SurfacePanel({
  as: Comp = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Comp
      className={cn(
        "section-surface ghost-outline rounded-[1.75rem] py-0 shadow-none",
        className
      )}
    >
      {children}
    </Comp>
  );
}

function SurfacePanelHeader({
  eyebrow,
  title,
  description,
  className,
  action,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <CardHeader
      className={cn("gap-4 px-6 pt-6 sm:px-8 sm:pt-8", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionIntro
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="min-w-0"
        />
        {action}
      </div>
    </CardHeader>
  );
}

function SurfacePanelBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <CardContent className={cn("px-6 pb-6 sm:px-8 sm:pb-8", className)}>
      {children}
    </CardContent>
  );
}

function QueryClauseBadge({
  field,
  operator,
  value,
}: {
  field: string;
  operator: string;
  value: string;
}) {
  return (
    <Badge
      variant="outline"
      className="h-auto rounded-full border-outline-variant/30 bg-surface-container-high px-3 py-2 text-on-surface"
    >
      <span className="text-primary">{field}</span>
      <span className="text-outline">{operator}</span>
      <span className="font-bold">{value}</span>
    </Badge>
  );
}

function FormatBadge({
  active = false,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Badge
      variant={active ? "secondary" : "outline"}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        active
          ? "bg-secondary text-on-secondary"
          : "border-secondary/15 bg-surface-container-lowest text-secondary"
      )}
    >
      {children}
    </Badge>
  );
}

function InlineMetric({
  value,
  label,
}: {
  value: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function EndpointFact({
  term,
  detail,
}: {
  term: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div>
      <dt className="font-medium text-on-surface">{term}</dt>
      <dd className="mt-1 text-on-surface-variant">{detail}</dd>
    </div>
  );
}

function HeroPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel ghost-outline surface-panel rounded-[1.75rem] p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

function HeroPanelContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hero-gradient rounded-[1.4rem] px-6 py-6 text-on-primary sm:px-8 sm:py-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  EndpointFact,
  FormatBadge,
  HeroPanel,
  HeroPanelContent,
  InlineMetric,
  QueryClauseBadge,
  SectionEyebrow,
  SectionIntro,
  SurfacePanel,
  SurfacePanelBody,
  SurfacePanelHeader,
};
