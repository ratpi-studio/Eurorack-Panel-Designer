/**
 * Publishes the content pages of `src/seo/`: React pages built with the UI kit, rendered to plain
 * HTML so that crawlers which never run JavaScript read them whole, along with the sitemap,
 * robots.txt and llms.txt.
 *
 * Everything is made at build time, by two builds of its own:
 * - a client build of the pages' stylesheet and island scripts, in `assets/seo/`, kept apart from
 *   the editor's chunks so that neither changes the other;
 * - a server build of `src/seo/render.tsx`, loaded to render the pages with the client's files.
 * A page loads that stylesheet, and a script only for its island: no script brings styles.
 *
 * The production build adds their output to the app's. The dev server serves the very same files,
 * built on the first request and again after a source file changes: reload to see a change.
 *
 * Only builds with the base "/" publish them: the GitHub Pages build serves a `noindex` redirect
 * and would publish the pages under a path their absolute links do not match.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import {
  build,
  type InlineConfig,
  type Plugin,
  type ResolvedConfig,
  type Rolldown,
  type ViteDevServer,
} from "vite-plus";

import {
  ISLAND_ENTRIES,
  SEO_RENDER_ENTRY,
  SEO_STYLES_ENTRY,
  type IslandId,
} from "../../src/seo/islands/entries";
import { PAGE_PATHS, SITE_FILE_NAMES } from "../../src/seo/paths";
import type { PageAssets, SiteFile } from "../../src/seo/render";
import { chunkCycleGuardPlugin } from "../chunkCycleGuard";

interface RenderModule {
  renderSite: (assets: PageAssets) => SiteFile[];
}

const ASSETS_DIR = "assets/seo";
const STYLES_ENTRY_NAME = "seo-styles";

function sharedConfig(config: ResolvedConfig): InlineConfig {
  return {
    configFile: false,
    root: config.root,
    mode: config.mode,
    logLevel: "warn",
    resolve: { alias: config.resolve.alias },
    plugins: [vanillaExtractPlugin(), react()],
  };
}

function outputsOf(result: Awaited<ReturnType<typeof build>>): Rolldown.RolldownOutput[] {
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.filter((output): output is Rolldown.RolldownOutput => "output" in output);
}

/** The stylesheet, and every island's entry with the chunks it imports, from the client build. */
function collectAssets(output: Rolldown.RolldownOutput): PageAssets {
  const chunks = new Map<string, Rolldown.OutputChunk>();
  const stylesheets: string[] = [];
  for (const item of output.output) {
    if (item.type === "chunk") {
      chunks.set(item.fileName, item);
    } else if (item.fileName.endsWith(".css")) {
      stylesheets.push(`/${item.fileName}`);
    }
  }

  const importsOf = (fileName: string, seen = new Set<string>()): string[] => {
    for (const imported of chunks.get(fileName)?.imports ?? []) {
      if (!seen.has(imported)) {
        seen.add(imported);
        importsOf(imported, seen);
      }
    }
    return [...seen];
  };

  const islands: PageAssets["islands"] = {};
  for (const chunk of chunks.values()) {
    if (chunk.isEntry && chunk.name in ISLAND_ENTRIES) {
      islands[chunk.name as IslandId] = {
        script: `/${chunk.fileName}`,
        preloads: importsOf(chunk.fileName).map((fileName) => `/${fileName}`),
      };
    }
  }

  return { stylesheets, islands };
}

async function buildClient(config: ResolvedConfig): Promise<Rolldown.RolldownOutput> {
  const shared = sharedConfig(config);
  const result = await build({
    ...shared,
    plugins: [...(shared.plugins ?? []), chunkCycleGuardPlugin()],
    build: {
      write: false,
      outDir: config.build.outDir,
      emptyOutDir: false,
      copyPublicDir: false,
      assetsDir: ASSETS_DIR,
      // One stylesheet for every page, whether it runs an island or not.
      cssCodeSplit: false,
      sourcemap: false,
      rolldownOptions: {
        input: {
          [STYLES_ENTRY_NAME]: path.resolve(config.root, SEO_STYLES_ENTRY),
          ...Object.fromEntries(
            Object.entries(ISLAND_ENTRIES).map(([id, entry]) => [
              id,
              path.resolve(config.root, entry),
            ]),
          ),
        },
      },
    },
  });
  const [output] = outputsOf(result);
  if (!output) {
    throw new Error("The client build of the content pages produced no output.");
  }
  return output;
}

/** Builds `render.tsx` for Node, next to the dependencies it imports, and loads it. */
async function loadRenderer(config: ResolvedConfig): Promise<RenderModule> {
  // Apart per command, so a production build never overwrites what a running dev server loads.
  const outDir = path.resolve(config.root, "node_modules/.cache/eurorack-seo", config.command);
  await build({
    ...sharedConfig(config),
    build: {
      ssr: path.resolve(config.root, SEO_RENDER_ENTRY),
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: false,
      rolldownOptions: {
        output: { entryFileNames: "render.mjs" },
      },
    },
  });
  // A fresh URL for every build: Node would hand back the module it loaded first.
  const url = `${pathToFileURL(path.join(outDir, "render.mjs")).href}?build=${Date.now()}`;
  return (await import(url)) as RenderModule;
}

type SiteFiles = Map<string, string | Uint8Array>;

/** Every file of the content pages, keyed by the path each one is published at. */
async function buildSite(config: ResolvedConfig): Promise<SiteFiles> {
  const client = await buildClient(config);
  const renderer = await loadRenderer(config);
  const files: SiteFiles = new Map();
  for (const item of client.output) {
    files.set(item.fileName, item.type === "chunk" ? item.code : item.source);
  }
  for (const file of renderer.renderSite(collectAssets(client))) {
    files.set(file.fileName, file.source);
  }
  return files;
}

const PAGE_FILES = new Set<string>(Object.values(PAGE_PATHS).map((page) => `${page}index.html`));
const SITE_FILES = new Set<string>(SITE_FILE_NAMES.map((name) => `/${name}`));

/**
 * The file a request asks for among those the content pages publish, or null. Every other
 * request, the editor's modules included, goes straight to Vite.
 */
function publishedFile(url: string | undefined): string | null {
  const pathname = url?.split("?")[0];
  if (!pathname) {
    return null;
  }
  if (pathname.startsWith(`/${ASSETS_DIR}/`) || SITE_FILES.has(pathname)) {
    return pathname.slice(1);
  }
  const page = `${pathname.replace(/\/?(index\.html)?$/, "")}/index.html`;
  return PAGE_FILES.has(page) ? page.slice(1) : null;
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** What the pages are built from: a change under these builds them again. */
const SOURCES = ["src", "vendor", "package.json"];

function serveBuiltSite(server: ViteDevServer, config: ResolvedConfig) {
  let site: Promise<SiteFiles> | null = null;

  server.watcher.on("all", (_event, file) => {
    const relative = path.relative(config.root, file);
    if (
      SOURCES.some((source) => relative === source || relative.startsWith(`${source}${path.sep}`))
    ) {
      site = null;
    }
  });

  server.middlewares.use((request, response, next) => {
    const fileName =
      request.method === "GET" || request.method === "HEAD" ? publishedFile(request.url) : null;
    if (!fileName) {
      next();
      return;
    }

    site ??= buildSite(config).catch((error: unknown) => {
      site = null;
      throw error;
    });
    site
      .then((files) => {
        const source = files.get(fileName);
        if (source === undefined) {
          next();
          return;
        }
        response.setHeader(
          "Content-Type",
          CONTENT_TYPES[path.extname(fileName)] ?? "application/octet-stream",
        );
        response.end(source);
      })
      .catch((error: unknown) => next(error));
  });
}

export function seoPagesPlugin(base: string): Plugin {
  let config: ResolvedConfig;

  return {
    name: "eurorack-seo-pages",
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      if (base === "/") {
        serveBuiltSite(server, config);
      }
    },
    async generateBundle() {
      if (base !== "/" || config.command !== "build" || config.build.ssr) {
        return;
      }

      for (const [fileName, source] of await buildSite(config)) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}
