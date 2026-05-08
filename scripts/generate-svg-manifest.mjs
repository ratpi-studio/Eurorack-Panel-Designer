#!/usr/bin/env node
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const SVG_LIBRARY_DIR = path.join(PUBLIC_DIR, "svg-library");
const MANIFEST_PATH = path.join(SVG_LIBRARY_DIR, "manifest.json");

function toPatternName(filename) {
  const parsed = path.parse(filename);
  return parsed.name.replace(/[_.-]+/g, " ").replace(/\s+/g, " ").trim();
}

function toManifestEntry(filename) {
  const parsed = path.parse(filename);
  return {
    id: parsed.name,
    name: toPatternName(filename),
    src: `svg-library/${filename}`,
  };
}

const entries = readdirSync(SVG_LIBRARY_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((filename) => filename.toLowerCase().endsWith(".svg"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(toManifestEntry);

writeFileSync(MANIFEST_PATH, `${JSON.stringify(entries, null, 2)}\n`);

console.log(`Generated ${path.relative(process.cwd(), MANIFEST_PATH)} with ${entries.length} SVGs.`);
