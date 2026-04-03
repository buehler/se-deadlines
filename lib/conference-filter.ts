import {
  RsqlAstNodeType,
  RsqlParser,
  RsqlTokenType,
  RsqlTokenizer,
} from "@mw-experts/rsql";

import type { Conference } from "@/lib/data";

type RsqlValue = string | string[];

type RsqlNode =
  | {
      type: typeof RsqlAstNodeType.Root;
      value: RsqlNode;
    }
  | {
      type: typeof RsqlAstNodeType.CompositeExpression;
      operator: string;
      value: RsqlNode[];
    }
  | {
      type: typeof RsqlAstNodeType.BasicExpression;
      operator: string;
      field: string;
      value: RsqlValue;
    };

const tokenizer = RsqlTokenizer.getInstance();
const parser = RsqlParser.getInstance();

function deepFindProperty(input: unknown, path: string) {
  return path
    .replace(/\[/g, ".")
    .replace(/\]/g, "")
    .split(".")
    .reduce<unknown>(
      (result, key) =>
        result !== null &&
        result !== undefined &&
        typeof result === "object" &&
        key in result
          ? (result as Record<string, unknown>)[key]
          : null,
      input
    );
}

function getFieldData(conference: Conference, field: string): unknown {
  switch (field) {
    case "deadline":
      return conference.deadline.toISOString();
    case "tags.name":
      return conference.tags.map((tag) => tag.name);
    case "tags.tag":
      return conference.tags.map((tag) => tag.tag);
    default:
      return deepFindProperty(conference, field);
  }
}

function normalizeDeadlineOperand(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function getResolvedValue(conference: Conference, value: RsqlValue): RsqlValue {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const resolved = getFieldData(conference, entry);
      return typeof resolved === "string" ? resolved : entry;
    });
  }

  const resolved = getFieldData(conference, value);
  return typeof resolved === "string" ? resolved : value;
}

function getComparableValue(conference: Conference, field: string, value: RsqlValue) {
  const resolvedValue = getResolvedValue(conference, value);

  if (field !== "deadline") {
    return resolvedValue;
  }

  if (Array.isArray(resolvedValue)) {
    return resolvedValue.map(normalizeDeadlineOperand);
  }

  return typeof resolvedValue === "string"
    ? normalizeDeadlineOperand(resolvedValue)
    : resolvedValue;
}

function compareWithWildcard(patternWithWildcard: string, value: string) {
  let pattern = patternWithWildcard.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  pattern = pattern.replace(/\*/g, ".*");

  return new RegExp(`^${pattern}$`, "i").test(value);
}

function compareArrayEquality(
  data: string[],
  value: string,
  negate: boolean
) {
  const normalizedValue = value.toLowerCase();
  const result = value.includes("*")
    ? data.some((item) => compareWithWildcard(normalizedValue, item))
    : data.includes(normalizedValue);

  return negate ? !result : result;
}

function evalBasicExpression(node: Extract<RsqlNode, { type: "BASIC_EXPRESSION" }>, conference: Conference) {
  const data = getFieldData(conference, node.field);
  const resolvedValue = getComparableValue(conference, node.field, node.value);
  const listData = Array.isArray(data)
    ? data.map((item) => `${item}`.toLowerCase())
    : null;
  const stringData = `${data ?? ""}`;
  const lowerStringData = stringData.toLowerCase();

  switch (node.operator) {
    case RsqlTokenType.BasicEqualOperator: {
      if (Array.isArray(data) && typeof resolvedValue === "string") {
        return compareArrayEquality(listData ?? [], resolvedValue, false);
      }

      if (typeof resolvedValue === "string" && resolvedValue.includes("*")) {
        return compareWithWildcard(resolvedValue.toLowerCase(), lowerStringData);
      }

      return `${resolvedValue}`.toLowerCase() === lowerStringData;
    }

    case RsqlTokenType.BasicNotEqualOperator: {
      if (Array.isArray(data) && typeof resolvedValue === "string") {
        return compareArrayEquality(listData ?? [], resolvedValue, true);
      }

      if (typeof resolvedValue === "string" && resolvedValue.includes("*")) {
        return !compareWithWildcard(
          resolvedValue.toLowerCase(),
          lowerStringData
        );
      }

      return `${resolvedValue}`.toLowerCase() !== lowerStringData;
    }

    case RsqlTokenType.BasicGreaterOperator:
    case RsqlTokenType.BasicGreaterOrEqualOperator:
    case RsqlTokenType.BasicLessOperator:
    case RsqlTokenType.BasicLessOrEqualOperator: {
      if (node.field === "deadline" && typeof resolvedValue === "string") {
        if (node.operator === RsqlTokenType.BasicGreaterOperator) {
          return stringData > resolvedValue;
        }

        if (node.operator === RsqlTokenType.BasicGreaterOrEqualOperator) {
          return stringData >= resolvedValue;
        }

        if (node.operator === RsqlTokenType.BasicLessOperator) {
          return stringData < resolvedValue;
        }

        return stringData <= resolvedValue;
      }

      const numberData = Number(data);
      const numberValue = Number(resolvedValue);

      if (Number.isNaN(numberData) || Number.isNaN(numberValue)) {
        return false;
      }

      if (node.operator === RsqlTokenType.BasicGreaterOperator) {
        return numberData > numberValue;
      }

      if (node.operator === RsqlTokenType.BasicGreaterOrEqualOperator) {
        return numberData >= numberValue;
      }

      if (node.operator === RsqlTokenType.BasicLessOperator) {
        return numberData < numberValue;
      }

      return numberData <= numberValue;
    }

    case RsqlTokenType.BasicInOperator: {
      if (!Array.isArray(resolvedValue)) {
        return false;
      }

      const normalizedValues = resolvedValue.map((item) => item.toLowerCase());

      if (Array.isArray(data)) {
        return (listData ?? []).some((item) => normalizedValues.includes(item));
      }

      return normalizedValues.includes(lowerStringData);
    }

    case RsqlTokenType.BasicNotInOperator: {
      if (!Array.isArray(resolvedValue)) {
        return false;
      }

      const normalizedValues = resolvedValue.map((item) => item.toLowerCase());

      if (Array.isArray(data)) {
        return !(listData ?? []).some((item) => normalizedValues.includes(item));
      }

      return !normalizedValues.includes(lowerStringData);
    }

    case RsqlTokenType.BasicIncludesAllOperator: {
      if (!Array.isArray(data) || !Array.isArray(resolvedValue)) {
        return false;
      }

      return resolvedValue
        .map((item) => item.toLowerCase())
        .every((item) => (listData ?? []).includes(item));
    }

    case RsqlTokenType.BasicIncludesOneOperator: {
      if (!Array.isArray(data) || !Array.isArray(resolvedValue)) {
        return false;
      }

      return resolvedValue
        .map((item) => item.toLowerCase())
        .some((item) => (listData ?? []).includes(item));
    }

    default:
      throw new TypeError(`Unsupported operator: ${node.operator}`);
  }
}

function matchesNode(node: RsqlNode, conference: Conference): boolean {
  switch (node.type) {
    case RsqlAstNodeType.Root:
      return matchesNode(node.value, conference);
    case RsqlAstNodeType.CompositeExpression:
      return node.operator === RsqlTokenType.CompositeAndOperator
        ? node.value.every((child) => matchesNode(child, conference))
        : node.value.some((child) => matchesNode(child, conference));
    case RsqlAstNodeType.BasicExpression:
      return evalBasicExpression(node, conference);
    default:
      throw new TypeError(`Unsupported AST node type: ${String(node)}`);
  }
}

export function filterConferences(rsql: string, conferences: Conference[]) {
  const ast = parser.parse(tokenizer.tokenize(rsql)) as RsqlNode;
  return conferences.filter((conference) => matchesNode(ast, conference));
}
