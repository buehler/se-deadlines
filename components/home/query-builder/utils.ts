import {
  RsqlAstNodeType,
  RsqlParser,
  RsqlTokenType,
  RsqlTokenizer,
  type RsqlAstBasicExpressionNode,
  type RsqlAstBasicListExpressionNode,
  type RsqlAstNode,
} from "@mw-experts/rsql";
import {
  DEFAULT_FIELD,
  DEFAULT_OPERATOR,
  FIELD_DEFINITIONS,
  FORMAT_OPTIONS,
  OPERATOR_TOKENS,
  type OutputFormat,
} from "@/components/home/query-builder/config";
import type {
  BuilderFieldDefinition,
  BuilderFieldKey,
  BuilderOperator,
  ConditionNode,
  GroupNode,
  QueryCombinator,
  QueryNode,
} from "@/components/home/query-builder/types";

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function makeClientNodeId(prefix: "condition" | "group") {
  return `${prefix}-${makeId()}`;
}

export function getFieldDefinition(field: BuilderFieldKey): BuilderFieldDefinition {
  return FIELD_DEFINITIONS[field];
}

export function getAllowedOperators(field: BuilderFieldKey) {
  return getFieldDefinition(field).operators;
}

export function getDefaultOperator(field: BuilderFieldKey): BuilderOperator {
  return getAllowedOperators(field)[0] ?? DEFAULT_OPERATOR;
}

export function createConditionNode(
  overrides: Partial<Omit<ConditionNode, "type">> = {}
): ConditionNode {
  const field = overrides.field ?? DEFAULT_FIELD;
  const operator =
    overrides.operator && getAllowedOperators(field).includes(overrides.operator)
      ? overrides.operator
      : getDefaultOperator(field);
  const defaultValue =
    overrides.value ??
    (field === "deadline" && operator === "ge" ? getTodayDateString() : "");

  return {
    id: overrides.id ?? makeClientNodeId("condition"),
    type: "condition",
    field,
    operator,
    value: defaultValue,
  };
}

export function createGroupNode(
  overrides: Partial<Omit<GroupNode, "type">> = {}
): GroupNode {
  return {
    id: overrides.id ?? makeClientNodeId("group"),
    type: "group",
    combinator: overrides.combinator ?? "AND",
    children: overrides.children ?? [createConditionNode()],
  };
}

export function normalizeDateToUtcIso(value: string) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function getTodayDateString(date = new Date()) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function sanitizeValue(value: string) {
  return value.trim().replace(/["']/g, "");
}

function quoteValue(value: string) {
  return `"${sanitizeValue(value)}"`;
}

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => sanitizeValue(entry))
    .filter(Boolean);
}

function normalizeDateToPageValue(value: string) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function serializeCondition(
  condition: ConditionNode,
  serializeDateValue: (value: string) => string
) {
  const fieldDefinition = getFieldDefinition(condition.field);
  const token = OPERATOR_TOKENS[condition.operator];

  if (!token) {
    return null;
  }

  if (!condition.value.trim()) {
    return null;
  }

  if (condition.operator === "in" || condition.operator === "out") {
    const values =
      fieldDefinition.kind === "date"
        ? parseList(condition.value).map(serializeDateValue).filter(Boolean)
        : parseList(condition.value);

    if (values.length === 0) {
      return null;
    }

    return `${condition.field}${token}(${values.map(quoteValue).join(",")})`;
  }

  if (
    condition.operator === "includesAll" ||
    condition.operator === "includesOne"
  ) {
    const values = parseList(condition.value);

    if (values.length === 0) {
      return null;
    }

    return `${condition.field}${token}(${values.map(quoteValue).join(",")})`;
  }

  const rawValue =
    fieldDefinition.kind === "date"
      ? serializeDateValue(condition.value)
      : sanitizeValue(condition.value);

  if (!rawValue) {
    return null;
  }

  return `${condition.field}${token}${quoteValue(rawValue)}`;
}

function serializeGroup(
  node: GroupNode,
  serializeDateValue: (value: string) => string,
  isRoot = false
): string | null {
  const serializedChildren = node.children
    .map((child) => serializeNode(child, serializeDateValue))
    .filter((child): child is string => child !== null);

  if (serializedChildren.length === 0) {
    return null;
  }

  const separator = node.combinator === "AND" ? ";" : ",";
  const expression = serializedChildren.join(separator);

  return isRoot || serializedChildren.length === 1 ? expression : `(${expression})`;
}

function serializeNode(
  node: QueryNode,
  serializeDateValue: (value: string) => string,
  isRoot = false
): string | null {
  return node.type === "condition"
    ? serializeCondition(node, serializeDateValue)
    : serializeGroup(node, serializeDateValue, isRoot);
}

export function serializeExecutionQuery(
  node: QueryNode,
  isRoot = false
): string | null {
  return serializeNode(node, normalizeDateToPageValue, isRoot);
}

export function serializePageQuery(node: QueryNode, isRoot = false): string | null {
  if (isImplicitDefaultRootGroup(node)) {
    return null;
  }

  return serializeNode(node, normalizeDateToPageValue, isRoot);
}

export function buildSearchUri(format: OutputFormat, query: string | null) {
  const normalizedFormat = FORMAT_OPTIONS.includes(format) ? format : "json";
  const url = new URL(`/deadlines/${normalizedFormat}`, "http://localhost");

  if (query) {
    url.searchParams.set("q", query);
  }

  return `${url.pathname}${url.search}`;
}

export function buildReadableAbsoluteUri(
  origin: string,
  format: OutputFormat,
  query: string | null
) {
  const normalizedFormat = FORMAT_OPTIONS.includes(format) ? format : "json";
  const base = origin.replace(/\/$/, "");
  return query
    ? `${base}/deadlines/${normalizedFormat}?q=${query}`
    : `${base}/deadlines/${normalizedFormat}`;
}

export function buildFetchUri(format: OutputFormat, query: string | null) {
  const normalizedFormat = FORMAT_OPTIONS.includes(format) ? format : "json";

  if (!query) {
    return `/deadlines/${normalizedFormat}`;
  }

  return `/deadlines/${normalizedFormat}?q=${encodeURIComponent(query)}`;
}

export function buildDefaultDeadlineQuery(today: string) {
  return today ? `deadline=ge="${today}"` : null;
}

function isImplicitDefaultCondition(node: QueryNode) {
  return (
    node.type === "condition" &&
    node.field === "deadline" &&
    node.operator === "ge" &&
    node.value === getTodayDateString()
  );
}

function isImplicitDefaultRootGroup(node: QueryNode) {
  return (
    node.type === "group" &&
    node.combinator === "AND" &&
    node.children.length === 1 &&
    isImplicitDefaultCondition(node.children[0])
  );
}

const TOKEN_TO_OPERATOR: Partial<Record<RsqlTokenType, BuilderOperator>> = {
  [RsqlTokenType.BasicEqualOperator]: "eq",
  [RsqlTokenType.BasicNotEqualOperator]: "neq",
  [RsqlTokenType.BasicGreaterOperator]: "gt",
  [RsqlTokenType.BasicGreaterOrEqualOperator]: "ge",
  [RsqlTokenType.BasicLessOperator]: "lt",
  [RsqlTokenType.BasicLessOrEqualOperator]: "le",
  [RsqlTokenType.BasicInOperator]: "in",
  [RsqlTokenType.BasicNotInOperator]: "out",
  [RsqlTokenType.BasicIncludesAllOperator]: "includesAll",
  [RsqlTokenType.BasicIncludesOneOperator]: "includesOne",
};

function isBuilderFieldKey(value: string): value is BuilderFieldKey {
  return value in FIELD_DEFINITIONS;
}

function normalizeHydratedConditionValue(field: BuilderFieldKey, value: string) {
  return isDateField(field) ? normalizeDateToPageValue(value) : value;
}

function makeHydratedIdFactory() {
  let index = 0;

  return (prefix: "condition" | "group") => {
    const current = `${prefix}-${index}`;
    index += 1;
    return current;
  };
}

function parseAstNode(
  node: RsqlAstNode,
  nextId: (prefix: "condition" | "group") => string
): QueryNode | null {
  if (node.type === RsqlAstNodeType.CompositeExpression) {
    const combinator =
      node.operator === RsqlTokenType.CompositeAndOperator ? "AND" : "OR";
    const children = node.value
      .map((child) => parseAstNode(child, nextId))
      .filter((child): child is QueryNode => child !== null);

    if (children.length === 0) {
      return null;
    }

    return createGroupNode({
      id: nextId("group"),
      combinator,
      children,
    });
  }

  return parseConditionNode(
    node as RsqlAstBasicExpressionNode | RsqlAstBasicListExpressionNode,
    nextId
  );
}

function parseConditionNode(
  node: RsqlAstBasicExpressionNode | RsqlAstBasicListExpressionNode,
  nextId: (prefix: "condition" | "group") => string
): ConditionNode | null {
  if (!isBuilderFieldKey(node.field)) {
    return null;
  }

  const field = node.field;
  const operator = TOKEN_TO_OPERATOR[node.operator];

  if (!operator || !getAllowedOperators(field).includes(operator)) {
    return null;
  }

  const rawValue = Array.isArray(node.value)
    ? node.value
        .map((value) => normalizeHydratedConditionValue(field, value))
        .filter(Boolean)
        .join(", ")
    : normalizeHydratedConditionValue(field, node.value);

  return createConditionNode({
    id: nextId("condition"),
    field,
    operator,
    value: rawValue,
  });
}

export function hydrateRootGroupFromQuery(query: string | null | undefined) {
  if (!query?.trim()) {
    return getEmptyRootGroup();
  }

  try {
    const tokens = RsqlTokenizer.getInstance().tokenize(query);
    const ast = RsqlParser.getInstance().parse(tokens);
    const nextId = makeHydratedIdFactory();
    const parsed = parseAstNode(ast.value, nextId);

    if (!parsed) {
      return getEmptyRootGroup();
    }

    if (parsed.type === "group") {
      return {
        ...parsed,
        id: "root",
      };
    }

    return createGroupNode({
      id: "root",
      combinator: "AND",
      children: [
        {
          ...parsed,
          id: "condition-0",
        },
      ],
    });
  } catch {
    return getEmptyRootGroup();
  }
}

export function updateNode(
  root: GroupNode,
  nodeId: string,
  updater: (node: QueryNode) => QueryNode
): GroupNode {
  if (root.id === nodeId) {
    const nextRoot = updater(root);
    return nextRoot.type === "group" ? nextRoot : root;
  }

  return {
    ...root,
    children: root.children.map((child) => {
      if (child.id === nodeId) {
        return updater(child);
      }

      if (child.type === "group") {
        return updateNode(child, nodeId, updater);
      }

      return child;
    }),
  };
}

export function appendNode(
  root: GroupNode,
  groupId: string,
  node: QueryNode
): GroupNode {
  return updateNode(root, groupId, (target) =>
    target.type === "group"
      ? { ...target, children: [...target.children, node] }
      : target
  );
}

function ensureNonEmptyGroup(node: GroupNode): GroupNode {
  return node.children.length > 0
    ? node
    : { ...node, children: [createConditionNode()] };
}

export function removeNode(root: GroupNode, nodeId: string): GroupNode {
  const removeFromGroup = (group: GroupNode): GroupNode => {
    const nextChildren = group.children
      .filter((child) => child.id !== nodeId)
      .map((child) =>
        child.type === "group" ? ensureNonEmptyGroup(removeFromGroup(child)) : child
      );

    return ensureNonEmptyGroup({ ...group, children: nextChildren });
  };

  return root.id === nodeId ? root : removeFromGroup(root);
}

export function resetOperatorForField(
  condition: ConditionNode,
  field: BuilderFieldKey
): ConditionNode {
  const allowedOperators = getAllowedOperators(field);

  return {
    ...condition,
    field,
    operator: allowedOperators.includes(condition.operator)
      ? condition.operator
      : getDefaultOperator(field),
    value: "",
  };
}

export function isDateField(field: BuilderFieldKey) {
  return getFieldDefinition(field).kind === "date";
}

export function getPlaceholder(
  field: BuilderFieldKey,
  operator: BuilderOperator
) {
  if (isDateField(field)) {
    return "Select date";
  }

  if (
    operator === "in" ||
    operator === "out" ||
    operator === "includesAll" ||
    operator === "includesOne"
  ) {
    return "value1, value2";
  }

  return "Value";
}

export function getEmptyRootGroup() {
  const today = getTodayDateString();
  return createGroupNode({
    id: "root",
    combinator: "AND",
    children: [
      createConditionNode({
        id: "condition-0",
        field: DEFAULT_FIELD,
        operator: DEFAULT_OPERATOR,
        value: today,
      }),
    ],
  });
}

export function changeGroupCombinator(
  root: GroupNode,
  groupId: string,
  combinator: QueryCombinator
) {
  return updateNode(root, groupId, (target) =>
    target.type === "group" ? { ...target, combinator } : target
  );
}
