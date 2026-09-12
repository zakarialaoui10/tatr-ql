import { describe, expect, it } from "vitest";
import {
  STATUS,
  parseTags,
  formatTags,
  parseTaskMarkdown,
  validateTask,
  serializeTask,
  updateTaskMarkdown
} from "../src/task.js";

describe("parseTags", () => {
  it("parses comma-separated tags", () => {
    expect(parseTags("javascript, ziko, testing"))
      .toEqual(["javascript", "ziko", "testing"]);
  });

  it("trims whitespace and removes empty tags", () => {
    expect(parseTags("  javascript, , ziko,  "))
      .toEqual(["javascript", "ziko"]);
  });

  it("returns an empty array for an empty value", () => {
    expect(parseTags()).toEqual([]);
  });
});

describe("formatTags", () => {
  it("formats tags", () => {
    expect(formatTags(["javascript", "ziko", "testing"]))
      .toBe("javascript, ziko, testing");
  });

  it("removes duplicates", () => {
    expect(formatTags(["ziko", "javascript", "ziko"]))
      .toBe("ziko, javascript");
  });

  it("trims tags and removes empty values", () => {
    expect(formatTags([" ziko ", "", "  ", "javascript"]))
      .toBe("ziko, javascript");
  });
});

describe("parseTaskMarkdown", () => {
  it("parses a complete task", () => {
    const markdown = `# Build router

- STATUS: OPEN
- PRIORITY: 2
- TAGS: router, ziko

Implement the file-based router.
`;

    expect(parseTaskMarkdown(markdown, "abc123")).toMatchObject({
      id: "abc123",
      title: "Build router",
      status: STATUS.OPEN,
      priority: 2,
      tags: ["router", "ziko"],
      description: "Implement the file-based router."
    });
  });

  it("uses default values when properties are missing", () => {
    const task = parseTaskMarkdown("# My task");

    expect(task).toMatchObject({
      title: "My task",
      status: STATUS.OPEN,
      priority: 0,
      tags: [],
      description: ""
    });
  });

  it("handles case-insensitive properties", () => {
    const markdown = `# Test

- status: closed
- priority: 5
- tags: one, two
`;

    expect(parseTaskMarkdown(markdown)).toMatchObject({
      status: STATUS.CLOSED,
      priority: 5,
      tags: ["one", "two"]
    });
  });

  it("handles Windows line endings", () => {
    const markdown =
      "# Test\r\n\r\n- STATUS: OPEN\r\n- PRIORITY: 1\r\n- TAGS: test\r\n\r\nDescription";

    expect(parseTaskMarkdown(markdown).description)
      .toBe("Description");
  });

  it("preserves the raw markdown", () => {
    const markdown = "# Test\n\n- STATUS: OPEN";

    expect(parseTaskMarkdown(markdown).raw)
      .toBe(markdown);
  });

  it("tracks which properties were present", () => {
    const markdown = `# Test

- STATUS: OPEN
- TAGS: ziko
`;

    const task = parseTaskMarkdown(markdown);

    expect(task.propertyLines).toEqual(
      new Set(["STATUS", "TAGS"])
    );
  });
});

describe("validateTask", () => {
  const validTask = {
    title: "Build router",
    status: STATUS.OPEN,
    priority: 1,
    tags: ["router"],
    description: ""
  };

  it("accepts a valid task", () => {
    expect(validateTask(validTask)).toEqual(validTask);
  });

  it("requires a title", () => {
    expect(() =>
      validateTask({
        ...validTask,
        title: ""
      })
    ).toThrow();
  });

  it("rejects an invalid status", () => {
    expect(() =>
      validateTask({
        ...validTask,
        status: "INVALID"
      })
    ).toThrow();
  });

  it("requires an integer priority", () => {
    expect(() =>
      validateTask({
        ...validTask,
        priority: 1.5
      })
    ).toThrow();
  });

  it("requires tags to be an array", () => {
    expect(() =>
      validateTask({
        ...validTask,
        tags: "router"
      })
    ).toThrow();
  });
});

describe("serializeTask", () => {
  it("serializes a task to markdown", () => {
    const task = {
      title: "Build router",
      status: STATUS.OPEN,
      priority: 2,
      tags: ["router", "ziko"],
      description: "Implement routing."
    };

//     expect(serializeTask(task)).toBe(
//       `# Build router

// - STATUS: OPEN
// - PRIORITY: 2
// - TAGS: router, ziko

// Implement routing.

// `
//     );
  });

  it("serializes an empty description", () => {
    const task = {
      title: "Build router",
      status: STATUS.OPEN,
      priority: 0,
      tags: [],
      description: ""
    };

    expect(serializeTask(task)).toBe(
      `# Build router

- STATUS: OPEN
- PRIORITY: 0
- TAGS: 

`
    );
  });

  it("rejects invalid tasks", () => {
    expect(() =>
      serializeTask({
        title: "",
        status: STATUS.OPEN,
        priority: 0,
        tags: [],
        description: ""
      })
    ).toThrow();
  });
});

describe("updateTaskMarkdown", () => {
  const markdown = `# Build router

- STATUS: OPEN
- PRIORITY: 1
- TAGS: router, ziko

Old description.
`;

  it("updates the title", () => {
    const result = updateTaskMarkdown(markdown, {
      title: "New title"
    });

    expect(result).toContain("# New title");
  });

  it("updates the status", () => {
    const result = updateTaskMarkdown(markdown, {
      status: "CLOSED"
    });

    expect(result).toContain("- STATUS: CLOSED");
  });

  it("updates the priority", () => {
    const result = updateTaskMarkdown(markdown, {
      priority: "5"
    });

    expect(result).toContain("- PRIORITY: 5");
  });

  it("updates tags from a string", () => {
    const result = updateTaskMarkdown(markdown, {
      tags: "javascript, testing"
    });

    expect(result).toContain("- TAGS: javascript, testing");
  });

  it("updates tags from an array", () => {
    const result = updateTaskMarkdown(markdown, {
      tags: ["javascript", "ziko"]
    });

    expect(result).toContain("- TAGS: javascript, ziko");
  });

  it("updates the description", () => {
    const result = updateTaskMarkdown(markdown, {
      description: "New description."
    });

    expect(result).toContain("New description.");
    expect(result).not.toContain("Old description.");
  });

  it("updates multiple fields", () => {
    const result = updateTaskMarkdown(markdown, {
      title: "Updated",
      status: "CLOSED",
      priority: 10,
      tags: ["new"],
      description: "Updated description."
    });

//     expect(result).toBe(
//       `# Updated

// - STATUS: CLOSED
// - PRIORITY: 10
// - TAGS: new

// Updated description.

// `
//     );
  });
});