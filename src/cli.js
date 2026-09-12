import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createTask,
  deleteTask,
  ensureTasksDir,
  listTasks,
  readTask,
  tasksPath,
  writeTask
} from "./store.js";
import { parseTags } from "./task.js";
import { matchesQuery } from "./query.js";
import packageJson from "../package.json" with { type: "json" };

import {TermDOM} from "@b9g/termdom";
const term = new TermDOM();
term.attach();
const {document, window} = term;
globalThis.document = document
globalThis.window = window


import {
  StartPager, 
  Help,
  ShowTask
} from "./components/index.js";

const {version : VERSION} = packageJson;

const parseFlags = (args) => {
  const positionals = [];
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const eq = arg.indexOf("=");

    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }

    const key = arg.slice(2);
    const next = args[i + 1];

    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }

  return { positionals, flags };
};

const formatTask = (task) => {
  const tags = task.tags.length ? ` [${task.tags.join(", ")}]` : "";
  return `${task.id}  ${task.status.padEnd(6)}  ${String(task.priority).padStart(4)}  ${task.title}${tags}`;
};

const commandNew = async (args) => {
  const { positionals, flags } = parseFlags(args);
  const title = positionals.join(" ").trim();

  if (!title) throw new Error("Usage: tatr new <title>");

  const task = await createTask({
    title,
    priority: flags.priority ?? 0,
    tags: flags.tags ? parseTags(flags.tags) : [],
    description: flags.description ?? "",
    suffix: flags.suffix
  });

  console.log(task.id);
};

const commandLs = async (args) => {
  const { positionals, flags } = parseFlags(args);
  const query = positionals.join(" ").trim();
  let tasks = await listTasks();

  if (flags.open) tasks = tasks.filter((task) => task.status === "OPEN");
  if (flags.closed) tasks = tasks.filter((task) => task.status === "CLOSED");
  if (query) tasks = tasks.filter((task) => matchesQuery(query, task));

  tasks.sort((a, b) =>
    b.priority - a.priority ||
    a.id.localeCompare(b.id)
  );

  for (const task of tasks) console.log(formatTask(task));
};

const commandShow = async (id) => {
  if (!id) throw new Error("Usage: tatr show <id>");

  const task = await readTask(id);

  const {title, status, priority, tags} = task

  ShowTask({id, title, status, priority, tags}).mount(document.body)

  // console.log(`ID:       ${task.id}`);
  // console.log(`TITLE:    ${task.title}`);
  // console.log(`STATUS:   ${task.status}`);
  // console.log(`PRIORITY: ${task.priority}`);
  // console.log(`TAGS:     ${task.tags.join(", ")}`);

  // table(
  //   tbody(
  //     tr(td("ID"),       td(task.id)),
  //     tr(td("TITLE"),    td(task.title)),
  //     tr(td("STATUS"),   td(task.status)),
  //     tr(td("PRIORITY"), td(task.priority)),
  //     tr(td("TAGS"),     td(task.tags.join(", ")))
  //   )
  // ).mount(document.body)

  if (task.description) console.log(`\n${task.description}`);
};

const commandEdit = async (id) => {
  if (!id) throw new Error("Usage: tatr edit <id>");

  const editor = process.env.EDITOR || process.env.VISUAL;
  if (!editor) throw new Error("Set $EDITOR or $VISUAL before using tatr edit");

  const file = join(tasksPath(), id, "TASK.md");
  await readFile(file, "utf8");

  const child = spawn(editor, [file], {
    stdio: "inherit",
    shell: true
  });

  await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`editor exited with code ${code}`));
    });
  });
};

const setStatus = async (id, status) => {
  if (!id) {
    throw new Error(
      `Usage: tatr ${status === "CLOSED" ? "close" : "reopen"} <id>`
    );
  }

  const task = await readTask(id);
  task.status = status;
  await writeTask(task);
};

const commandTags = async () => {
  const file = join(tasksPath(), "tags");

  try {
    console.log(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No tasks/tags file.");
      return;
    }
    throw error;
  }
};

export const main = async (argv = process.argv.slice(2)) => {
  const [command = "help", ...args] = argv;

  switch (command) {
    case "help": 
    case "-h":
    case "--help":
      Help().mount(document.body);
      await StartPager()
      break;
    case "version":
    case "-v":
    case "--version":
      console.log(VERSION);
      break;
    case "init":
      await ensureTasksDir();
      console.log(`Initialized ${tasksPath()}`);
      break;
    case "new":
    case "add":
      await commandNew(args);
      break;
    case "ls":
    case "list":
      await commandLs(args);
      break;
    case "show":
      await commandShow(args[0]);
      break;
    case "edit":
      await commandEdit(args[0]);
      break;
    case "close":
      await setStatus(args[0], "CLOSED");
      break;
    case "reopen":
    case "open":
      await setStatus(args[0], "OPEN");
      break;
    case "rm":
    case "delete":
      if (!args[0]) throw new Error("Usage: tatr rm <id>");
      await deleteTask(args[0]);
      break;
    case "tags":
      await commandTags();
      break;
    default:
      throw new Error(`Unknown command "${command}". Run "tatr help".`);
  }
};