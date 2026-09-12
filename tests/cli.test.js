import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "../src/cli.js";
import * as store from "../src/store.js";

vi.mock("../src/store.js", () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  ensureTasksDir: vi.fn(),
  listTasks: vi.fn(),
  readTask: vi.fn(),
  tasksPath: vi.fn(() => "/tmp/tasks"),
  writeTask: vi.fn()
}));

describe("main", () => {
  let logSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("shows help by default", async () => {
    await main([]);
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls[0][0]).toContain("tatr 0.1.0");
  });

  it("shows help with --help", async () => {
    await main(["--help"]);
    expect(logSpy.mock.calls[0][0]).toContain("Usage:");
  });

  it("shows version", async () => {
    await main(["version"]);
    expect(logSpy).toHaveBeenCalledWith("0.1.0");
  });

  it("initializes tasks directory", async () => {
    await main(["init"]);
    expect(store.ensureTasksDir).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("Initialized /tmp/tasks");
  });

  it("creates a task", async () => {
    store.createTask.mockResolvedValue({
      id: "20260912-143000",
      title: "Fix bug"
    });

    await main(["new", "Fix", "bug"]);

    expect(store.createTask).toHaveBeenCalledWith({
      title: "Fix bug",
      priority: 0,
      tags: [],
      description: "",
      suffix: undefined
    });

    expect(logSpy).toHaveBeenCalledWith("20260912-143000");
  });

  it("creates a task with options", async () => {
    store.createTask.mockResolvedValue({
      id: "20260912-143000-test",
      title: "Fix bug"
    });

    await main([
      "new",
      "Fix",
      "bug",
      "--priority",
      "10",
      "--tags",
      "bug,ziko",
      "--suffix",
      "test",
      "--description",
      "Fix it"
    ]);

    expect(store.createTask).toHaveBeenCalledWith({
      title: "Fix bug",
      priority: "10",
      tags: ["bug", "ziko"],
      description: "Fix it",
      suffix: "test"
    });
  });

  it("supports --key=value flags", async () => {
    store.createTask.mockResolvedValue({
      id: "20260912-143000"
    });

    await main([
      "new",
      "Test",
      "--priority=5",
      "--tags=one,two",
      "--description=Hello"
    ]);

    expect(store.createTask).toHaveBeenCalledWith({
      title: "Test",
      priority: "5",
      tags: ["one", "two"],
      description: "Hello",
      suffix: undefined
    });
  });

  it("supports add as alias for new", async () => {
    store.createTask.mockResolvedValue({
      id: "20260912-143000"
    });

    await main(["add", "Test"]);

    expect(store.createTask).toHaveBeenCalled();
  });

  it("lists tasks", async () => {
    store.listTasks.mockResolvedValue([
      {
        id: "2",
        title: "Low",
        status: "OPEN",
        priority: 1,
        tags: []
      },
      {
        id: "1",
        title: "High",
        status: "OPEN",
        priority: 10,
        tags: ["bug"]
      }
    ]);

    await main(["ls"]);

    expect(logSpy.mock.calls).toEqual([
      ["1  OPEN      10  High [bug]"],
      ["2  OPEN       1  Low"]
    ]);
  });

  it("supports list as alias for ls", async () => {
    store.listTasks.mockResolvedValue([]);

    await main(["list"]);

    expect(store.listTasks).toHaveBeenCalled();
  });

  it("filters open tasks", async () => {
    store.listTasks.mockResolvedValue([
      {
        id: "1",
        title: "Open",
        status: "OPEN",
        priority: 1,
        tags: []
      },
      {
        id: "2",
        title: "Closed",
        status: "CLOSED",
        priority: 2,
        tags: []
      }
    ]);

    await main(["ls", "--open"]);

    expect(logSpy.mock.calls).toHaveLength(1);
    expect(logSpy.mock.calls[0][0]).toContain("Open");
  });

  it("filters closed tasks", async () => {
    store.listTasks.mockResolvedValue([
      {
        id: "1",
        title: "Open",
        status: "OPEN",
        priority: 1,
        tags: []
      },
      {
        id: "2",
        title: "Closed",
        status: "CLOSED",
        priority: 2,
        tags: []
      }
    ]);

    await main(["ls", "--closed"]);

    expect(logSpy.mock.calls).toHaveLength(1);
    expect(logSpy.mock.calls[0][0]).toContain("Closed");
  });

  it("filters tasks with TQL", async () => {
    store.listTasks.mockResolvedValue([
      {
        id: "1",
        title: "Bug",
        status: "OPEN",
        priority: 10,
        tags: ["bug"]
      },
      {
        id: "2",
        title: "Feature",
        status: "OPEN",
        priority: 5,
        tags: ["feature"]
      }
    ]);

    await main(["ls", ":bug"]);

    expect(logSpy.mock.calls).toHaveLength(1);
    expect(logSpy.mock.calls[0][0]).toContain("Bug");
  });

  it("shows a task", async () => {
    store.readTask.mockResolvedValue({
      id: "20260912-143000",
      title: "Fix bug",
      status: "OPEN",
      priority: 5,
      tags: ["bug", "ziko"],
      description: "Fix the issue."
    });

    await main(["show", "20260912-143000"]);

    expect(logSpy).toHaveBeenCalledWith("ID:       20260912-143000");
    expect(logSpy).toHaveBeenCalledWith("TITLE:    Fix bug");
    expect(logSpy).toHaveBeenCalledWith("STATUS:   OPEN");
    expect(logSpy).toHaveBeenCalledWith("PRIORITY: 5");
    expect(logSpy).toHaveBeenCalledWith("TAGS:     bug, ziko");
    expect(logSpy).toHaveBeenCalledWith("\nFix the issue.");
  });

  it("closes a task", async () => {
    const task = {
      id: "1",
      title: "Test",
      status: "OPEN"
    };

    store.readTask.mockResolvedValue(task);

    await main(["close", "1"]);

    expect(store.readTask).toHaveBeenCalledWith("1");
    expect(task.status).toBe("CLOSED");
    expect(store.writeTask).toHaveBeenCalledWith(task);
  });

  it("reopens a task", async () => {
    const task = {
      id: "1",
      title: "Test",
      status: "CLOSED"
    };

    store.readTask.mockResolvedValue(task);

    await main(["reopen", "1"]);

    expect(task.status).toBe("OPEN");
    expect(store.writeTask).toHaveBeenCalledWith(task);
  });

  it("supports open as alias for reopen", async () => {
    const task = {
      id: "1",
      title: "Test",
      status: "CLOSED"
    };

    store.readTask.mockResolvedValue(task);

    await main(["open", "1"]);

    expect(task.status).toBe("OPEN");
  });

  it("deletes a task", async () => {
    await main(["rm", "1"]);

    expect(store.deleteTask).toHaveBeenCalledWith("1");
  });

  it("supports delete as alias for rm", async () => {
    await main(["delete", "1"]);

    expect(store.deleteTask).toHaveBeenCalledWith("1");
  });

  it("rejects new without title", async () => {
    await expect(main(["new"])).rejects.toThrow(
      "Usage: tatr new <title>"
    );
  });

  it("rejects show without id", async () => {
    await expect(main(["show"])).rejects.toThrow(
      "Usage: tatr show <id>"
    );
  });

  it("rejects edit without id", async () => {
    await expect(main(["edit"])).rejects.toThrow(
      "Usage: tatr edit <id>"
    );
  });

  it("rejects close without id", async () => {
    await expect(main(["close"])).rejects.toThrow(
      "Usage: tatr close <id>"
    );
  });

  it("rejects reopen without id", async () => {
    await expect(main(["reopen"])).rejects.toThrow(
      "Usage: tatr reopen <id>"
    );
  });

  it("rejects rm without id", async () => {
    await expect(main(["rm"])).rejects.toThrow(
      "Usage: tatr rm <id>"
    );
  });

  it("rejects unknown commands", async () => {
    await expect(main(["unknown"])).rejects.toThrow(
      'Unknown command "unknown". Run "tatr help".'
    );
  });
});