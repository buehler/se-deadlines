import type {
  BuilderFieldDefinition,
  BuilderFieldKey,
  BuilderOperator,
} from "@/components/home/query-builder/types";

export const FORMAT_OPTIONS = [
  "text",
  "json",
  "json-feed",
  "rss",
  "atom",
  "ical",
] as const;

export type OutputFormat = (typeof FORMAT_OPTIONS)[number];

export const OPERATOR_LABELS: Record<BuilderOperator, string> = {
  eq: "Equals",
  neq: "Not equal",
  gt: "Greater than",
  ge: "Greater or equal",
  lt: "Less than",
  le: "Less or equal",
  in: "In list",
  out: "Not in list",
  includesAll: "Includes all",
  includesOne: "Includes one",
};

export const OPERATOR_TOKENS: Record<BuilderOperator, string> = {
  eq: "==",
  neq: "!=",
  gt: "=gt=",
  ge: "=ge=",
  lt: "=lt=",
  le: "=le=",
  in: "=in=",
  out: "=out=",
  includesAll: "=includes-all=",
  includesOne: "=includes-one=",
};

export const FIELD_DEFINITIONS: Record<BuilderFieldKey, BuilderFieldDefinition> = {
  name: {
    key: "name",
    label: "Name",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  description: {
    key: "description",
    label: "Description",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  year: {
    key: "year",
    label: "Year",
    kind: "number",
    operators: ["eq", "neq", "gt", "ge", "lt", "le", "in", "out"],
  },
  link: {
    key: "link",
    label: "Link",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  date: {
    key: "date",
    label: "Date",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  place: {
    key: "place",
    label: "Place",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  note: {
    key: "note",
    label: "Note",
    kind: "string",
    operators: ["eq", "neq", "in", "out"],
  },
  deadline: {
    key: "deadline",
    label: "Deadline",
    kind: "date",
    operators: ["eq", "neq", "gt", "ge", "lt", "le"],
  },
  "tags.name": {
    key: "tags.name",
    label: "Tag name",
    kind: "tag-array",
    operators: ["eq", "neq", "in", "out", "includesAll", "includesOne"],
  },
  "tags.tag": {
    key: "tags.tag",
    label: "Tag slug",
    kind: "tag-array",
    operators: ["eq", "neq", "in", "out", "includesAll", "includesOne"],
  },
};

export const FIELD_OPTIONS = Object.values(FIELD_DEFINITIONS);

export const DEFAULT_FIELD: BuilderFieldKey = "tags.name";
export const DEFAULT_OPERATOR: BuilderOperator = "includesOne";
