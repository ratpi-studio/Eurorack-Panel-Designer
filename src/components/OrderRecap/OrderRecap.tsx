import React from "react";

import { useI18n } from "@i18n/I18nContext";
import { collectTextFontIds, hasDesignElements } from "@lib/designLayer";
import { reportError } from "@lib/monitoring";
import {
  OrderRequestError,
  computeOrderMountingHoles,
  fetchOrder,
  getAppInfo,
  getEtsyListingUrl,
  isOrderingEnabled,
  type OrderRecord,
} from "@lib/order";
import {
  ORDER_PANEL_THICKNESS_MM,
  filamentHex,
  isFilamentId,
  orderPriceEur,
} from "@lib/orderCatalog";
import { serializePanelModel } from "@lib/serialization";
import { loadTextFonts } from "@lib/text/textFontLoader";

import * as styles from "./OrderRecap.css";

type OrderCopy = ReturnType<typeof useI18n>["order"];

const LazyPanel3DView = React.lazy(() =>
  import("@components/Panel3DView/Panel3DView").then((module) => ({
    default: module.Panel3DView,
  })),
);

interface OrderRecapProps {
  /** The design code from the page URL, as typed or pasted. */
  id: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "failed"; notFound: boolean }
  | { status: "ready"; record: OrderRecord };

function downloadFile(fileName: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function FilamentValue({ id, copy }: { id: string; copy: OrderCopy }) {
  if (!isFilamentId(id)) {
    return <dd className={styles.detailValue}>{id || "—"}</dd>;
  }
  return (
    <dd className={styles.detailValue}>
      <span
        className={styles.swatch}
        style={{ backgroundColor: filamentHex(id) }}
        aria-hidden="true"
      />
      {copy.filamentNames[id]}
    </dd>
  );
}

function OrderDetails({ record, copy }: { record: OrderRecord; copy: OrderCopy }) {
  // With ordering off, the page still shows the design, for orders placed before.
  const listingUrl = isOrderingEnabled() ? getEtsyListingUrl() : null;
  const [isCopied, setIsCopied] = React.useState(false);
  const [downloadFailed, setDownloadFailed] = React.useState(false);
  const { model, filaments, widthHp } = record;

  const mountingHoles = React.useMemo(() => computeOrderMountingHoles(model), [model]);
  const previewModel = React.useMemo(
    () => ({
      ...model,
      panelColor: isFilamentId(filaments.panel) ? filamentHex(filaments.panel) : model.panelColor,
      designColor: isFilamentId(filaments.details)
        ? filamentHex(filaments.details)
        : model.designColor,
    }),
    [model, filaments],
  );

  React.useEffect(() => {
    if (!isCopied) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const copyCode = () => {
    navigator.clipboard
      .writeText(record.code)
      .then(() => setIsCopied(true))
      .catch(() => setIsCopied(false));
  };

  const handleDownloadStl = () => {
    setDownloadFailed(false);
    // Texts are only built once their font has loaded.
    Promise.all([import("@lib/exportStl"), loadTextFonts(collectTextFontIds(model.elements))])
      .then(([{ buildPanelStlWithWarnings }]) => {
        const { stl } = buildPanelStlWithWarnings(model, mountingHoles, {
          thicknessMm: ORDER_PANEL_THICKNESS_MM,
        });
        downloadFile(`${record.code}.stl`, stl, "model/stl");
      })
      .catch((error: unknown) => {
        reportError(error, "order-page");
        setDownloadFailed(true);
      });
  };

  const handleDownloadJson = () => {
    downloadFile(`${record.code}.json`, serializePanelModel(model), "application/json");
  };

  const currentCommit = getAppInfo().commit;
  const hasDesignerChanged = Boolean(
    record.app.commit && currentCommit && record.app.commit !== currentCommit,
  );

  return (
    <>
      <h1 className={styles.title}>{listingUrl ? copy.pageTitle : copy.designTitle}</h1>
      <section className={styles.codeBlock}>
        <span className={styles.label}>{copy.codeLabel}</span>
        <div className={styles.codeRow}>
          <span className={styles.code} translate="no">
            {record.code}
          </span>
          <button type="button" className={styles.copyButton} onClick={copyCode}>
            {isCopied ? copy.copied : copy.copyCode}
          </button>
        </div>
        <p className={styles.hint}>{copy.codeHint}</p>
      </section>
      <div className={styles.layout}>
        <div className={styles.previewFrame}>
          <React.Suspense fallback={<p className={styles.status}>{copy.previewLoading}</p>}>
            <LazyPanel3DView
              model={previewModel}
              mountingHoles={mountingHoles}
              thicknessMm={ORDER_PANEL_THICKNESS_MM}
            />
          </React.Suspense>
        </div>
        <div className={styles.column}>
          <dl className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <dt className={styles.label}>{copy.widthLabel}</dt>
              <dd className={styles.detailValue}>{copy.widthValue(widthHp)}</dd>
            </div>
            <div className={styles.detailItem}>
              <dt className={styles.label}>{copy.priceLabel}</dt>
              <dd className={styles.detailValue}>{copy.price(orderPriceEur(widthHp))}</dd>
            </div>
            <div className={styles.detailItem}>
              <dt className={styles.label}>{copy.panelFilamentLabel}</dt>
              <FilamentValue id={filaments.panel} copy={copy} />
            </div>
            {hasDesignElements(model.elements) ? (
              <div className={styles.detailItem}>
                <dt className={styles.label}>{copy.detailsFilamentLabel}</dt>
                <FilamentValue id={filaments.details} copy={copy} />
              </div>
            ) : null}
          </dl>
          <p className={styles.hint}>{copy.priceHint}</p>
          <section className={styles.howTo}>
            <h2 className={styles.sectionTitle}>{copy.howToTitle}</h2>
            {listingUrl ? (
              <>
                <ol className={styles.steps}>
                  {copy.howToSteps(widthHp).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <a
                  className={styles.buyButton}
                  href={listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={copyCode}
                >
                  {copy.buyCta}
                </a>
              </>
            ) : (
              <p className={styles.hint}>{copy.buyUnavailable}</p>
            )}
          </section>
        </div>
      </div>
      <section className={styles.files}>
        <h2 className={styles.sectionTitle}>{copy.filesTitle}</h2>
        <p className={styles.hint}>{copy.filesHint(ORDER_PANEL_THICKNESS_MM)}</p>
        <div className={styles.fileButtons}>
          <button type="button" className={styles.copyButton} onClick={handleDownloadStl}>
            {copy.downloadStl}
          </button>
          <button type="button" className={styles.copyButton} onClick={handleDownloadJson}>
            {copy.downloadJson}
          </button>
        </div>
        {downloadFailed ? (
          <p className={styles.error} role="alert">
            {copy.downloadError}
          </p>
        ) : null}
        <p className={styles.hint}>
          {copy.versionNote(record.app.version, record.app.commit)}
          {hasDesignerChanged ? ` ${copy.versionChanged}` : ""}
        </p>
      </section>
    </>
  );
}

/** The page of an order code: what will be printed, and how to buy it on Etsy. */
export function OrderRecap({ id }: OrderRecapProps) {
  const t = useI18n();
  const copy = t.order;
  const [state, setState] = React.useState<LoadState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetchOrder(id)
      .then((record) => {
        if (!cancelled) {
          setState({ status: "ready", record });
        }
      })
      .catch((error: unknown) => {
        const notFound =
          error instanceof OrderRequestError && (error.status === 400 || error.status === 404);
        if (!notFound) {
          reportError(error, "order-page");
        }
        if (!cancelled) {
          setState({ status: "failed", notFound });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {state.status === "ready" ? (
          <OrderDetails record={state.record} copy={copy} />
        ) : (
          <>
            <h1 className={styles.title}>{copy.codeLabel}</h1>
            <p className={styles.status} role={state.status === "loading" ? undefined : "alert"}>
              {state.status === "loading"
                ? copy.loading
                : state.notFound
                  ? copy.notFound
                  : copy.loadError}
            </p>
          </>
        )}
        <a className={styles.editLink} href="/">
          {copy.backToDesigner}
        </a>
      </div>
    </div>
  );
}
