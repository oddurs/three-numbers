/** Canonical project paths, resolved from this module's own location. */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const engineDir = dirname(fileURLToPath(import.meta.url));
export const projectRoot = join(engineDir, "..");

export const paths = {
  root: projectRoot,
  data: join(projectRoot, "data"),
  fonts: join(projectRoot, "fonts"),
  figures: join(projectRoot, "figures"),
  book: join(projectRoot, "book"),
  research: join(projectRoot, "research"),
  build: join(projectRoot, "build"),
  buildFigures: join(projectRoot, "build", "figures"),
  buildResearch: join(projectRoot, "build", "research"),
} as const;
