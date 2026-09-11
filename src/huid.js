import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const HUID_RE = /^\d{8}-\d{6}(?:-[A-Za-z0-9-]*)?$/;

const utcStamp=(date = new Date())=>{
  const p = (n, width) => String(n).padStart(width, "0");
  return (
    `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1, 2)}${p(date.getUTCDate(), 2)}` +
    `-${p(date.getUTCHours(), 2)}${p(date.getUTCMinutes(), 2)}${p(date.getUTCSeconds(), 2)}`
  );
}

export const isHuid = value => HUID_RE.test(value)

export const createHuid = ({ suffix } = {}) =>{
  const base = utcStamp();
  if (suffix == null || suffix === "") return base;
  if (!/^[A-Za-z0-9-]+$/.test(suffix)) {
    throw new Error("HUID suffix may contain only letters, numbers, and hyphens");
  }
  return `${base}-${suffix}`;
}

export const uniqueHuid = async (tasksDir, options = {}) =>{
  let huid = createHuid(options);
  while (true) {
    try {
      await readdir(join(tasksDir, huid));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      huid = createHuid(options);
    } catch (error) {
      if (error.code === "ENOENT") return huid;
      throw error;
    }
  }
}
