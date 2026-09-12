import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  HUID_RE,
  isHuid,
  createHuid,
  uniqueHuid
} from "../src/huid.js";

describe("huid", () => {
  describe("HUID_RE", () => {
    it("matches valid HUIDs", () => {
      expect(HUID_RE.test("20260912-143025")).toBe(true);
      expect(HUID_RE.test("20260912-143025-test")).toBe(true);
      expect(HUID_RE.test("20260912-143025-my-task")).toBe(true);
    });

    it("rejects invalid HUIDs", () => {
      expect(HUID_RE.test("2026-09-12-143025")).toBe(false);
      expect(HUID_RE.test("20260912")).toBe(false);
      expect(HUID_RE.test("20260912-14302")).toBe(false);
      expect(HUID_RE.test("invalid")).toBe(false);
      expect(HUID_RE.test("20260912-143025_test")).toBe(false);
    });
  });

  describe("isHuid", () => {
    it("returns true for valid HUIDs", () => {
      expect(isHuid("20260912-143025")).toBe(true);
      expect(isHuid("20260912-143025-task")).toBe(true);
    });

    it("returns false for invalid values", () => {
      expect(isHuid("invalid")).toBe(false);
      expect(isHuid("")).toBe(false);
      expect(isHuid(null)).toBe(false);
      expect(isHuid(undefined)).toBe(false);
    });
  });

  describe("createHuid", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(
        new Date("2026-09-12T14:30:25.000Z")
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("creates a HUID from the UTC timestamp", () => {
      expect(createHuid()).toBe("20260912-143025");
    });

    it("creates a HUID with a suffix", () => {
      expect(
        createHuid({ suffix: "router" })
      ).toBe("20260912-143025-router");
    });

    it("accepts hyphens in the suffix", () => {
      expect(
        createHuid({ suffix: "my-task" })
      ).toBe("20260912-143025-my-task");
    });

    it("allows an empty suffix", () => {
      expect(createHuid({ suffix: "" }))
        .toBe("20260912-143025");
    });

    it("rejects an invalid suffix", () => {
      expect(() =>
        createHuid({ suffix: "my_task" })
      ).toThrow(
        "HUID suffix may contain only letters, numbers, and hyphens"
      );
    });

    it("rejects spaces in the suffix", () => {
      expect(() =>
        createHuid({ suffix: "my task" })
      ).toThrow();
    });
  });

  describe("uniqueHuid", () => {
    let tasksDir;

    beforeEach(async () => {
      tasksDir = await mkdtemp(join(tmpdir(), "huid-"));
      vi.useFakeTimers();
      vi.setSystemTime(
        new Date("2026-09-12T14:30:25.000Z")
      );
    });

    afterEach(async () => {
      vi.useRealTimers();
      await rm(tasksDir, {
        recursive: true,
        force: true
      });
    });

    it("returns an unused HUID", async () => {
      const huid = await uniqueHuid(tasksDir);

      expect(huid).toBe("20260912-143025");
    });

    it("returns a HUID with a suffix", async () => {
      const huid = await uniqueHuid(tasksDir, {
        suffix: "router"
      });

      expect(huid).toBe("20260912-143025-router");
    });

    // it("waits when the HUID already exists", async () => {
    //   const existing = "20260912-143025";
    //   await mkdir(join(tasksDir, existing));

    //   const promise = uniqueHuid(tasksDir);

    //   await vi.advanceTimersByTimeAsync(1000);

    //   const huid = await promise;

    //   expect(huid).toBe("20260912-143025");
    // });
  });
});