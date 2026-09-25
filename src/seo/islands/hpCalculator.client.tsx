import { hydrateRoot } from "react-dom/client";

import { islandIdentifierPrefix } from "./entries";
import { HpCalculator } from "./HpCalculator";

const container = document.getElementById("hp-calculator");
if (container) {
  hydrateRoot(container, <HpCalculator />, {
    identifierPrefix: islandIdentifierPrefix("hp-calculator"),
  });
}
