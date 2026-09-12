import { z } from "zod";

export const STATUS = Object.freeze({
  OPEN: "OPEN",
  CLOSED: "CLOSED"
});

export const TaskSchema = z.object({
  id: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Task title is required"),
  status: z.enum([STATUS.OPEN, STATUS.CLOSED]),
  priority: z.number().int(),
  tags: z.array(z.string()),
  description: z.string(),
  raw: z.string().optional(),
  propertyLines: z.instanceof(Set).optional()
});

export const TaskChangesSchema = z.object({
  title: z.string().optional(),
  status: z.enum([STATUS.OPEN, STATUS.CLOSED]).optional(),
  priority: z.coerce.number().int().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  description: z.string().optional()
});

const propertyLineRegex = /^\s*-\s+(STATUS|PRIORITY|TAGS):\s*(.*?)\s*$/i;
const propertyStartRegex = /^\s*-\s+(STATUS|PRIORITY|TAGS):/i;

export const parseTags = (value = "") => value.split(",").map((tag) => tag.trim()).filter(Boolean);

export const formatTags = (tags = []) => [...new Set(tags.map(String).map((x) => x.trim()).filter(Boolean))].join(", ");

export const parseTaskMarkdown = (markdown, id = null) => {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let title = "";
  let status = STATUS.OPEN;
  let priority = 0;
  let tags = [];
  const propertyLines = new Set();
  if (lines[0]?.startsWith("# ")) title = lines[0].slice(2).trim();
  for (const line of lines.slice(1)) {
    const match = line.match(propertyLineRegex);
    if (!match) continue;
    const key = match[1].toUpperCase();
    const value = match[2];
    propertyLines.add(key);
    switch (key) {
      case "STATUS" : status = value.toUpperCase(); break;
      case "PRIORITY": {
        const value = Number.parseInt(match[2], 10);
        priority = Number.isNaN(value) ? 0 : value;
        break;
      }
      case "TAGS" : tags = parseTags(value); break;
    }
  }
  let descriptionStart = 1;
  while (descriptionStart < lines.length && (lines[descriptionStart].trim() === "" ||propertyStartRegex.test(lines[descriptionStart]))){
    descriptionStart++;
  }
  const description = lines.slice(descriptionStart).join("\n").replace(/\s+$/, "");
  return {
    id,
    title,
    status,
    priority,
    tags,
    description,
    raw: markdown,
    propertyLines
  };
};

export const validateTask = (task) => TaskSchema.parse(task);
export const serializeTask = (task) => {
  const validated = validateTask(task);
  const body = validated.description ? `\n${validated.description}\n` : "\n";
  return [
    `# ${validated.title}`,
    "",
    `- STATUS: ${validated.status}`,
    `- PRIORITY: ${validated.priority}`,
    `- TAGS: ${formatTags(validated.tags)}`,
    body
  ].join("\n").replace(/\n{3,}$/g, "\n\n");
};

export const updateTaskMarkdown = (markdown, changes = {}) => {
  const task = parseTaskMarkdown(markdown);
  const validatedChanges = TaskChangesSchema.parse(changes);
  for (const [key, value] of Object.entries(validatedChanges)) {
    switch (key) {
      case "title":
      case "status":
      case "priority":
      case "description":
        task[key] = value;
        break;
      case "tags":
        task.tags = Array.isArray(value) ? value : parseTags(value);
        break;
    }
  }
  return serializeTask(task);
};