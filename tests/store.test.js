import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  findProjectRoot,
  tasksPath,
  ensureTasksDir,
  listTaskIds,
  readTask,
  listTasks,
  createTask,
  writeTask,
  deleteTask,
  moveTask
} from "../src/store.js";

describe("store", () => {
  let projectRoot;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "tasks-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  describe("findProjectRoot", () => {
    it("returns the resolved path", () => {
      expect(findProjectRoot(projectRoot)).toBe(projectRoot);
    });
  });

  describe("tasksPath", () => {
    it("returns the tasks directory", () => {
      expect(tasksPath(projectRoot)).toBe(join(projectRoot, "tasks"));
    });
  });

  describe("ensureTasksDir", () => {
    it("creates the tasks directory", async () => {
      const dir = await ensureTasksDir(projectRoot);

      expect(dir).toBe(tasksPath(projectRoot));
      expect(await listTaskIds(projectRoot)).toEqual([]);
    });
  });

  describe("createTask", () => {
    it("creates a task", async () => {
      const task = await createTask({
        projectRoot,
        title: "Build router",
        priority: 1,
        tags: ["ziko", "router"],
        description: "Implement the file based router.",
        suffix: "router"
      });

      expect(task).toMatchObject({
        title: "Build router",
        status: "OPEN",
        priority: 1,
        tags: ["ziko", "router"],
        description: "Implement the file based router."
      });

      expect(task.id).toBeTruthy();
      expect(await listTaskIds(projectRoot)).toContain(task.id);
    });

    it("rejects an empty title", async () => {
      await expect(
        createTask({
          projectRoot,
          title: ""
        })
      ).rejects.toThrow("Task title is required");
    });

    it("accepts comma-separated tags", async () => {
      const task = await createTask({
        projectRoot,
        title: "Test tags",
        tags: "ziko, router, test"
      });

      expect(task.tags).toEqual(["ziko", "router", "test"]);
    });
  });

  describe("readTask", () => {
    it("reads a created task", async () => {
      const created = await createTask({
        projectRoot,
        title: "Build router",
        priority: 2,
        tags: ["router"],
        description: "Router implementation.",
        suffix: "router"
      });

      const task = await readTask(created.id, projectRoot);

      expect(task).toMatchObject({
        id: created.id,
        title: "Build router",
        status: "OPEN",
        priority: 2,
        tags: ["router"],
        description: "Router implementation."
      });
    });

    it("rejects an invalid task ID", async () => {
      await expect(
        readTask("invalid", projectRoot)
      ).rejects.toThrow("Invalid task ID");
    });
  });

  describe("listTaskIds", () => {
    it("returns task IDs", async () => {
      const first = await createTask({
        projectRoot,
        title: "First",
        suffix: "first"
      });

      const second = await createTask({
        projectRoot,
        title: "Second",
        suffix: "second"
      });

      const ids = await listTaskIds(projectRoot);

      expect(ids).toEqual(
        [first.id, second.id].sort()
      );
    });

    it("returns an empty array when tasks directory does not exist", async () => {
      expect(await listTaskIds(projectRoot)).toEqual([]);
    });
  });

  describe("listTasks", () => {
    it("returns all tasks", async () => {
      await createTask({
        projectRoot,
        title: "First",
        suffix: "first"
      });

      await createTask({
        projectRoot,
        title: "Second",
        suffix: "second"
      });

      const tasks = await listTasks(projectRoot);

      expect(tasks).toHaveLength(2);
      expect(tasks.map((task) => task.title)).toEqual([
        "First",
        "Second"
      ]);
    });
  });

  describe("writeTask", () => {
    it("updates an existing task", async () => {
      const task = await createTask({
        projectRoot,
        title: "Old title",
        suffix: "test"
      });

      task.title = "New title";
      task.status = "CLOSED";
      task.priority = 5;
      task.tags = ["updated"];
      task.description = "Updated description.";

      await writeTask(task, projectRoot);

      const result = await readTask(task.id, projectRoot);

      expect(result).toMatchObject({
        title: "New title",
        status: "CLOSED",
        priority: 5,
        tags: ["updated"],
        description: "Updated description."
      });
    });

    it("rejects an invalid task ID", async () => {
      await expect(
        writeTask(
          {
            id: "invalid",
            title: "Test",
            status: "OPEN",
            priority: 0,
            tags: [],
            description: ""
          },
          projectRoot
        )
      ).rejects.toThrow("Invalid task ID");
    });
  });

  describe("deleteTask", () => {
    it("deletes a task", async () => {
      const task = await createTask({
        projectRoot,
        title: "Delete me",
        suffix: "delete"
      });

      await deleteTask(task.id, projectRoot);

      expect(await listTaskIds(projectRoot)).not.toContain(task.id);
    });

    it("rejects an invalid task ID", async () => {
      await expect(
        deleteTask("invalid", projectRoot)
      ).rejects.toThrow("Invalid task ID");
    });
  });

  describe("moveTask", () => {
    it("moves a task to a new ID", async () => {
      const task = await createTask({
        projectRoot,
        title: "Move me",
        suffix: "old"
      });

      const newId = task.id.replace("old", "new");

      await moveTask(task.id, newId, projectRoot);

      expect(await listTaskIds(projectRoot)).toContain(newId);
      expect(await listTaskIds(projectRoot)).not.toContain(task.id);

      const moved = await readTask(newId, projectRoot);

      expect(moved.title).toBe("Move me");
    });

    it("rejects invalid IDs", async () => {
      await expect(
        moveTask("invalid", "also-invalid", projectRoot)
      ).rejects.toThrow("Both task IDs must be valid HUIDs");
    });
  });
});