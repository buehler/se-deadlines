import type { Conference } from "@/lib/data";

export type BuilderFieldKey =
  | "name"
  | "description"
  | "year"
  | "link"
  | "date"
  | "place"
  | "note"
  | "deadline"
  | "tags.name"
  | "tags.tag";

export type BuilderFieldKind = "string" | "number" | "date" | "tag-array";

export type BuilderOperator =
  | "eq"
  | "neq"
  | "gt"
  | "ge"
  | "lt"
  | "le"
  | "in"
  | "out"
  | "includesAll"
  | "includesOne";

export type QueryCombinator = "AND" | "OR";

export type BuilderFieldDefinition = {
  key: BuilderFieldKey;
  label: string;
  kind: BuilderFieldKind;
  operators: BuilderOperator[];
};

export type ConditionNode = {
  id: string;
  type: "condition";
  field: BuilderFieldKey;
  operator: BuilderOperator;
  value: string;
};

export type GroupNode = {
  id: string;
  type: "group";
  combinator: QueryCombinator;
  children: QueryNode[];
};

export type QueryNode = ConditionNode | GroupNode;

export type PreviewConference = Omit<Conference, "deadline"> & {
  deadline: string;
};

export type PreviewState = {
  status: "idle" | "loading" | "success" | "error";
  data: PreviewConference[];
  error: string | null;
};
