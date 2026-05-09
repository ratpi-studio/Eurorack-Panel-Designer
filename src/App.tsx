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
  const id = path.slice(ORDER_PATH_PREFIX.length).split("/")[0];
  return id || null;
}

export function App() {
  const orderId = resolveOrderId();

  return (
    <I18nProvider>
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
    </I18nProvider>
  );
}
