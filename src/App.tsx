import { LucideProvider } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { OrderRecap } from "@components/OrderRecap/OrderRecap";
import { PanelDesigner } from "@components/PanelDesigner/PanelDesigner";
import { SharedDesign } from "@components/SharedDesign/SharedDesign";
import { TooltipLayer } from "@components/Tooltip/TooltipLayer";
import { I18nProvider } from "@i18n/I18nContext";
import { readShareCodeFromPath } from "@lib/share";

const ORDER_PATH_PREFIX = "/order/";

function resolveOrderId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const path = window.location.pathname;
  if (!path.startsWith(ORDER_PATH_PREFIX)) {
    return null;
  }
  const segment = path.slice(ORDER_PATH_PREFIX.length).split("/")[0];
  try {
    return decodeURIComponent(segment) || null;
  } catch {
    return segment || null;
  }
}

// Icons fill 32 px icon buttons and sit next to 13-14 px labels in menus and dialogs.
const ICON_SIZE_PX = 16;

/** The code of a shared design's page (/p/<code>), or null on any other page. */
function resolveShareCode(): string | null {
  return typeof window === "undefined" ? null : readShareCodeFromPath(window.location.pathname);
}

export function App() {
  const orderId = resolveOrderId();
  const shareCode = orderId ? null : resolveShareCode();

  return (
    <I18nProvider>
      <LucideProvider size={ICON_SIZE_PX}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0b1426",
              color: "#e2e8f0",
              border: "1px solid #1e293b",
            },
            success: {
              style: {
                background: "#0b1426",
                color: "#e2e8f0",
                border: "1px solid #0ea5e9",
              },
            },
            error: {
              style: {
                background: "#0b1426",
                color: "#fecdd3",
                border: "1px solid #b91c1c",
              },
            },
          }}
        />
        {orderId ? (
          <OrderRecap id={orderId} />
        ) : shareCode ? (
          <SharedDesign code={shareCode} />
        ) : (
          <PanelDesigner />
        )}
        <TooltipLayer />
      </LucideProvider>
    </I18nProvider>
  );
}
