import { get } from "@vercel/blob";

import {
  injectShareMeta,
  readShareCode,
  readShareSummary,
  shareDesignPath,
  type ShareSummary,
} from "./_share";

// Serves /p/<code>, which vercel.json rewrites here: the editor's index.html, whose app shows the
// shared design, with the design's own title and link preview in its head. Chats, forums and
// search engines read that head without running JavaScript, so it has to be right in the HTML.

async function readSummary(code: string): Promise<ShareSummary | null> {
  try {
    const result = await get(shareDesignPath(code), { access: "public" });
    if (!result || result.statusCode !== 200) {
      return null;
    }
    return readShareSummary(JSON.parse(await new Response(result.stream).text()));
  } catch (error) {
    console.error("Could not read the share", error);
    return null;
  }
}

/** The editor's page as this deployment serves it, or null when it cannot be had. */
async function readEditorPage(url: URL): Promise<string | null> {
  try {
    const response = await fetch(new URL("/", url), { headers: { Accept: "text/html" } });
    const html = response.ok ? await response.text() : "";
    return html.includes("</head>") ? html : null;
  } catch (error) {
    console.error("Could not read the editor page", error);
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = readShareCode(url);
  const [page, summary] = await Promise.all([
    readEditorPage(url),
    code ? readSummary(code) : Promise.resolve(null),
  ]);
  if (!page) {
    // Nothing to put the metadata in: the editor opens the shared design the same way, through
    // the parameter src/lib/share.ts names OPEN_DESIGN_PARAM.
    return Response.redirect(new URL(code ? `/?design=${code}` : "/", url), 307);
  }
  return new Response(code ? injectShareMeta(page, code, summary) : page, {
    status: summary ? 200 : 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Kept short, so the page never points at the scripts of a deployment long gone.
      "Cache-Control": "public, max-age=0, s-maxage=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
