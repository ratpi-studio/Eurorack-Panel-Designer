import type { ReactElement } from "react";

import type { IslandId } from "./entries";
import { HpCalculator } from "./HpCalculator";

/** What the build renders for each island: the element its client entry hydrates. */
export const ISLANDS: Record<IslandId, () => ReactElement> = {
  "hp-calculator": () => <HpCalculator />,
};
