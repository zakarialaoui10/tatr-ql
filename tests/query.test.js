import { describe, it, expect } from "vitest";
import {
  tokenize,
  parseQuery,
  evaluateQuery,
  matchesQuery
} from "../src/query.js";

const task = {
  tags: ["ziko", "router"],
  priority: 5
};

describe("tokenize", () => {
  it("tokenizes keywords", () => {
    expect(tokenize("priority gt 3")).toEqual([
      { type: "priority", value: "priority" },
      { type: "gt", value: "gt" },
      { type: "number", value: 3 },
      { type: "eof", value: null }
    ]);
  });

  it("tokenizes tags", () => {
    expect(tokenize(":ziko :router")).toEqual([
      { type: "tag", value: "ziko" },
      { type: "tag", value: "router" },
      { type: "eof", value: null }
    ]);
  });

  it("tokenizes brackets and negative numbers", () => {
    expect(tokenize("[priority ge -1]")).toEqual([
      { type: "lbracket", value: "[" },
      { type: "priority", value: "priority" },
      { type: "ge", value: "ge" },
      { type: "number", value: -1 },
      { type: "rbracket", value: "]" },
      { type: "eof", value: null }
    ]);
  });

  it("is case insensitive", () => {
    expect(tokenize("PRIORITY GT 3")).toEqual([
      { type: "priority", value: "priority" },
      { type: "gt", value: "gt" },
      { type: "number", value: 3 },
      { type: "eof", value: null }
    ]);
  });

  it("rejects unknown tokens", () => {
    expect(() => tokenize("foo")).toThrow(
      'Unexpected token "foo"'
    );
  });

  it("rejects empty tags", () => {
    expect(() => tokenize(":")).toThrow("Empty tag in TQL");
  });

  it("rejects invalid numbers", () => {
    expect(() => tokenize("-abc")).toThrow();
  });
});

describe("parseQuery", () => {
  it("returns any for an empty query", () => {
    expect(parseQuery("")).toEqual({ type: "any" });
    expect(parseQuery("   ")).toEqual({ type: "any" });
  });

  it("parses a tag", () => {
    expect(parseQuery(":ziko")).toEqual({
      type: "tag",
      tag: "ziko"
    });
  });

  it("parses any", () => {
    expect(parseQuery("any")).toEqual({
      type: "any"
    });
  });

  it("parses tagged", () => {
    expect(parseQuery("tagged")).toEqual({
      type: "tagged"
    });
  });

  it("parses priority", () => {
    expect(parseQuery("priority")).toEqual({
      type: "priority"
    });
  });

  it("parses numbers", () => {
    expect(parseQuery("-5")).toEqual({
      type: "number",
      value: -5
    });
  });

  it("parses not", () => {
    expect(parseQuery("not :ziko")).toEqual({
      type: "not",
      expr: {
        type: "tag",
        tag: "ziko"
      }
    });
  });

  it("parses comparisons", () => {
    expect(parseQuery("priority gt 3")).toEqual({
      type: "compare",
      op: "gt",
      left: { type: "priority" },
      right: { type: "number", value: 3 }
    });
  });

  it("parses and", () => {
    expect(parseQuery(":ziko and :router")).toEqual({
      type: "and",
      left: { type: "tag", tag: "ziko" },
      right: { type: "tag", tag: "router" }
    });
  });

  it("parses or", () => {
    expect(parseQuery(":ziko or :react")).toEqual({
      type: "or",
      left: { type: "tag", tag: "ziko" },
      right: { type: "tag", tag: "react" }
    });
  });

  it("respects and precedence over or", () => {
    expect(parseQuery(":a or :b and :c")).toEqual({
      type: "or",
      left: { type: "tag", tag: "a" },
      right: {
        type: "and",
        left: { type: "tag", tag: "b" },
        right: { type: "tag", tag: "c" }
      }
    });
  });

  it("parses brackets", () => {
    expect(parseQuery("[:a or :b] and :c")).toEqual({
      type: "and",
      left: {
        type: "or",
        left: { type: "tag", tag: "a" },
        right: { type: "tag", tag: "b" }
      },
      right: { type: "tag", tag: "c" }
    });
  });

  it("rejects incomplete expressions", () => {
    expect(() => parseQuery("priority gt")).toThrow();
  });

  it("rejects unclosed brackets", () => {
    expect(() => parseQuery("[:ziko")).toThrow();
  });

  it("rejects unexpected tokens", () => {
    expect(() => parseQuery(":ziko foo")).toThrow();
  });
});

describe("evaluateQuery", () => {
  it("evaluates any", () => {
    expect(evaluateQuery({ type: "any" }, task)).toBe(true);
  });

  it("evaluates tags", () => {
    expect(evaluateQuery({ type: "tag", tag: "ziko" }, task)).toBe(true);
    expect(evaluateQuery({ type: "tag", tag: "react" }, task)).toBe(false);
  });

  it("evaluates tagged", () => {
    expect(evaluateQuery({ type: "tagged" }, task)).toBe(true);
  });

  it("evaluates priority", () => {
    expect(evaluateQuery({ type: "priority" }, task)).toBe(5);
    expect(evaluateQuery({ type: "number", value: 3 }, task)).toBe(3);
  });

  it("evaluates not", () => {
    expect(
      evaluateQuery(
        { type: "not", expr: { type: "tag", tag: "react" } },
        task
      )
    ).toBe(true);
  });

  it("evaluates and", () => {
    expect(
      evaluateQuery(
        {
          type: "and",
          left: { type: "tag", tag: "ziko" },
          right: { type: "tag", tag: "router" }
        },
        task
      )
    ).toBe(true);
  });

  it("evaluates or", () => {
    expect(
      evaluateQuery(
        {
          type: "or",
          left: { type: "tag", tag: "react" },
          right: { type: "tag", tag: "ziko" }
        },
        task
      )
    ).toBe(true);
  });

  it("evaluates comparisons", () => {
    expect(matchesQuery("priority gt 3", task)).toBe(true);
    expect(matchesQuery("priority ge 5", task)).toBe(true);
    expect(matchesQuery("priority lt 10", task)).toBe(true);
    expect(matchesQuery("priority le 5", task)).toBe(true);
    expect(matchesQuery("priority eq 5", task)).toBe(true);
    expect(matchesQuery("priority ne 3", task)).toBe(true);
  });

  it("returns false for failed comparisons", () => {
    expect(matchesQuery("priority lt 3", task)).toBe(false);
    expect(matchesQuery("priority eq 3", task)).toBe(false);
  });
});

describe("matchesQuery", () => {
  it("accepts a query string", () => {
    expect(matchesQuery(":ziko", task)).toBe(true);
    expect(matchesQuery(":react", task)).toBe(false);
  });

  it("accepts an AST", () => {
    const ast = {
      type: "tag",
      tag: "ziko"
    };

    expect(matchesQuery(ast, task)).toBe(true);
  });

  it("supports complex queries", () => {
    expect(
      matchesQuery(
        "[:ziko or :react] and priority ge 5",
        task
      )
    ).toBe(true);

    expect(
      matchesQuery(
        "not :react and priority gt 3",
        task
      )
    ).toBe(true);
  });
});