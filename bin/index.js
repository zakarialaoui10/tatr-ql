#!/usr/bin/env node
import { main } from "../src/cli.js";

main().catch((error) => {
  console.error(`tatr: ${error.message}`);
  process.exitCode = 1;
});
