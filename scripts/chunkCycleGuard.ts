import type { Plugin } from "vite-plus";

/**
 * Fails the build when chunks import each other in a cycle. The chunk evaluated first then uses
 * bindings of a chunk that has not run yet: in 0.10.0, manual vendor chunks and Rolldown's runtime
 * helpers formed such a cycle, and every page load crashed with "t is not a function".
 */
export function chunkCycleGuardPlugin(): Plugin {
  return {
    name: "eurorack-chunk-cycle-guard",
    apply: "build",
    generateBundle(_options, bundle) {
      const importsByChunk = new Map<string, string[]>();
      for (const output of Object.values(bundle)) {
        if (output.type === "chunk") {
          importsByChunk.set(output.fileName, output.imports);
        }
      }

      const checked = new Set<string>();
      const path: string[] = [];
      const findCycle = (fileName: string): string[] | null => {
        const start = path.indexOf(fileName);
        if (start !== -1) {
          return [...path.slice(start), fileName];
        }
        if (checked.has(fileName)) {
          return null;
        }
        path.push(fileName);
        for (const imported of importsByChunk.get(fileName) ?? []) {
          const cycle = findCycle(imported);
          if (cycle) {
            return cycle;
          }
        }
        path.pop();
        checked.add(fileName);
        return null;
      };

      for (const fileName of importsByChunk.keys()) {
        const cycle = findCycle(fileName);
        if (cycle) {
          this.error(`Chunks import each other in a cycle: ${cycle.join(" -> ")}`);
        }
      }
    },
  };
}
