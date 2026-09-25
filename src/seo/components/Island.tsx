import { createContext, useContext } from "react";

import type { IslandId } from "../islands/entries";

/**
 * The HTML the build rendered for each island. Islands are rendered on their own, with the same
 * root the browser hydrates, so React finds exactly the markup it would produce. A page rendered
 * as text, for llms-full.txt, gets none and leaves its islands out.
 */
export const IslandHtmlContext = createContext<Partial<Record<IslandId, string>>>({});

export function Island({ id }: { id: IslandId }) {
  const html = useContext(IslandHtmlContext)[id];
  if (html === undefined) {
    return null;
  }

  return <div id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}
