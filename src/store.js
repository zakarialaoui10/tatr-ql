import {
  access,
  mkdir,
  readdir,
  readFile,
  writeFile,
  rm,
  rename
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { uniqueHuid, isHuid } from "./huid.js";
import { parseTaskMarkdown, serializeTask } from "./task.js";

export const findProjectRoot = (start = process.cwd()) => resolve(start);
export const tasksPath = (projectRoot = process.cwd()) => join(findProjectRoot(projectRoot), "tasks");
export const ensureTasksDir = async (projectRoot = process.cwd()) => {
  const dir = tasksPath(projectRoot);
  await mkdir(dir, { recursive: true });
  return dir;
};

export const listTaskIds = async (projectRoot = process.cwd()) => {
  const dir = tasksPath(projectRoot);
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && isHuid(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};

export const readTask = async (id, projectRoot = process.cwd()) => {
  if (!isHuid(id)) {
    throw new Error(`Invalid task ID: ${id}`);
  }
  const file = join(tasksPath(projectRoot), id, "TASK.md");
  const markdown = await readFile(file, "utf8");
  return parseTaskMarkdown(markdown, id);
};

export const listTasks = async (projectRoot = process.cwd()) => {
  const ids = await listTaskIds(projectRoot);
  const tasks = [];
  for (const id of ids) {
    try {
      tasks.push(await readTask(id, projectRoot));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
  }

  return tasks;
};

export const createTask = async ({
  projectRoot = process.cwd(),
  title,
  priority = 0,
  status = "OPEN",
  tags = [],
  description = "",
  suffix
}) => {
  if (!title?.trim()) {
    throw new Error("Task title is required");
  }
  const dir = await ensureTasksDir(projectRoot);
  const id = await uniqueHuid(dir, { suffix });
  const taskDir = join(dir, id);
  await mkdir(taskDir);
  const task = {
    id,
    title: title.trim(),
    status: String(status).toUpperCase(),
    priority: Number.parseInt(priority, 10),
    tags: Array.isArray(tags)
      ? tags
      : String(tags)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
    description
  };
  await writeFile(
    join(taskDir, "TASK.md"),
    serializeTask(task),
    "utf8"
  );
  return task;
};

export const writeTask = async (task, projectRoot = process.cwd()) => {
  if (!isHuid(task.id)) {
    throw new Error(`Invalid task ID: ${task.id}`);
  }
  const file = join(tasksPath(projectRoot), task.id, "TASK.md");
  await writeFile(file, serializeTask(task), "utf8");
  return task;
};

export const deleteTask = async (id, projectRoot = process.cwd()) => {
  if (!isHuid(id)) {
    throw new Error(`Invalid task ID: ${id}`);
  }
  await rm(join(tasksPath(projectRoot), id), {
    recursive: true,
    force: false
  });
};

export const moveTask = async (id, newId, projectRoot = process.cwd()) => {
  if (!isHuid(id) || !isHuid(newId)) {
    throw new Error("Both task IDs must be valid HUIDs");
  }
  const dir = tasksPath(projectRoot);
  await access(join(dir, id));
  await rename(join(dir, id), join(dir, newId));
};