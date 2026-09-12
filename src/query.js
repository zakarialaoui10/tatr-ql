/*
 * TQL parser/evaluator.
 *
 * Grammar:
 *   expr    := or
 *   or      := and ("or" and)*
 *   and     := compare ("and" compare)*
 *   compare := primary (compare-op primary)*
 *   primary := tag | "[" expr "]" | "not" primary | "any" | "tagged"
 *            | "priority" | number
 */

import { z } from "zod";

const COMPARATORS = new Set(["lt", "le", "gt", "ge", "eq", "ne"]);
const KEYWORDS = new Set([
  "and",
  "or",
  "not",
  "any",
  "tagged",
  "priority",
  ...COMPARATORS
]);

const TokenSchema = z.object({
  type: z.string(),
  value: z.union([z.string(), z.number(), z.null()])
});

const TokensSchema = z.array(TokenSchema);

export const tokenize = (input) => {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "[") {
      tokens.push({ type: "lbracket", value: ch });
      i++;
      continue;
    }
    if (ch === "]") {
      tokens.push({ type: "rbracket", value: ch });
      i++;
      continue;
    }
    if (ch === ":") {
      let j = i + 1;
      while (j < input.length && !/[\s[\]]/.test(input[j])) j++;
      if (j === i + 1) throw new Error("Empty tag in TQL");
      tokens.push({ type: "tag", value: input.slice(i + 1, j) });
      i = j;
      continue;
    }
    if (ch === "-" || /\d/.test(ch)) {
      let j = i;
      if (input[j] === "-") j++;
      const start = j;
      while (j < input.length && /\d/.test(input[j])) j++;
      if (j === start) {
        throw new Error(`Invalid number near "${input.slice(i)}"`);
      }
      tokens.push({
        type: "number",
        value: Number.parseInt(input.slice(i, j), 10)
      });
      i = j;
      continue;
    }

    let j = i;
    while (j < input.length && !/[\s[\]]/.test(input[j])) j++;
    const word = input.slice(i, j);
    const lower = word.toLowerCase();
    if (KEYWORDS.has(lower)) tokens.push({ type: lower, value: lower });
    else throw new Error(`Unexpected token "${word}"`);
    i = j;
  }
  return TokensSchema.parse([
    ...tokens,
    { type: "eof", value: null }
  ]);
};

export const parseQuery = (input) => {
  if (!input || !input.trim()) return { type: "any" };
  const tokens = tokenize(input);
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const expect = (type) => {
    const token = take();
    if (token.type !== type) throw new Error(`Expected ${type}, got ${token.type}`);
    return token;
  };
  const parsePrimary = () => {
    const token = peek();
    switch (token.type) {
      case "not":
        take();
        return { type: "not", expr: parsePrimary() };
      case "lbracket":
        take();
        const expr = parseOr();
        expect("rbracket");
        return expr;
      case "tag":
        take();
        return { type: "tag", tag: token.value };
      case "any":
        take();
        return { type: "any" };
      case "tagged":
        take();
        return { type: "tagged" };
      case "priority":
        take();
        return { type: "priority" };
      case "number":
        take();
        return { type: "number", value: token.value };
      default:
        throw new Error(`Expected expression, got ${token.type}`);
    }
  };

  const parseCompare = () => {
    let left = parsePrimary();
    while (COMPARATORS.has(peek().type)) {
      const op = take().type;
      const right = parsePrimary();
      left = { type: "compare", op, left, right };
    }
    return left;
  };

  const parseAnd = () => {
    let left = parseCompare();
    while (peek().type === "and") {
      take();
      left = {
        type: "and",
        left,
        right: parseCompare()
      };
    }
    return left;
  };

  const parseOr = () => {
    let left = parseAnd();
    while (peek().type === "or") {
      take();
      left = {
        type: "or",
        left,
        right: parseAnd()
      };
    }
    return left;
  };

  const ast = parseOr();
  if (peek().type !== "eof") throw new Error(`Unexpected token "${peek().value}"`);
  return ast;
};

export const evaluateQuery = (ast, task) => {
  switch (ast.type) {
    case "any": return true;
    case "tag": return task.tags.includes(ast.tag);
    case "tagged": return task.tags.length > 0;
    case "priority": return task.priority;
    case "number": return ast.value;
    case "not": return !Boolean(evaluateQuery(ast.expr, task));
    case "and": return Boolean(evaluateQuery(ast.left, task)) && Boolean(evaluateQuery(ast.right, task));
    case "or": return Boolean(evaluateQuery(ast.left, task)) || Boolean(evaluateQuery(ast.right, task));
    case "compare": {
      const left = evaluateQuery(ast.left, task);
      const right = evaluateQuery(ast.right, task);
      switch (ast.op) {
        case "lt": return left < right;
        case "le": return left <= right;
        case "gt": return left > right;
        case "ge": return left >= right;
        case "eq": return left === right;
        case "ne": return left !== right;
        default: throw new Error(`Unknown comparator ${ast.op}`);
      }
    }
    default: throw new Error(`Unknown AST node ${ast.type}`);
  }
};
export const matchesQuery = (query, task) => evaluateQuery(typeof query === "string" ? parseQuery(query) : query, task);