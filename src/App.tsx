import { LucideProvider } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { OrderRecap } from "@components/OrderRecap/OrderRecap";
import { PanelDesigner } from "@components/PanelDesigner/PanelDesigner";
import { I18nProvider } from "@i18n/I18nContext";

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

// Icons sit next to 13-14 px labels in buttons, tabs and menus.
const ICON_SIZE_PX = 16;

export function App() {
  const orderId = resolveOrderId();

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
        {orderId ? <OrderRecap id={orderId} /> : <PanelDesigner />}
      </LucideProvider>
    </I18nProvider>
  );
}
