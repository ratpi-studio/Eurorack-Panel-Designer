import { Check, Copy, FileBraces, FilePlus2, PenTool } from "lucide-react";
import React from "react";

// The page of a shared design is laid out like the page of an order code.
import * as styles from "@components/OrderRecap/OrderRecap.css";
import { SphereLoader } from "@components/SphereLoader/SphereLoader";
import { useI18n } from "@i18n/I18nContext";
import { reportError } from "@lib/monitoring";
import { computeOrderMountingHoles } from "@lib/order";
import { ORDER_PANEL_THICKNESS_MM } from "@lib/orderCatalog";
import { serializePanelModel } from "@lib/serialization";
import {
  ShareRequestError,
  fetchSharedDesign,
  openDesignUrl,
  type SharedDesign as SharedDesignRecord,
} from "@lib/share";

type ShareCopy = ReturnType<typeof useI18n>["share"];

const LazyPanel3DView = React.lazy(() =>
  import("@components/Panel3DView/Panel3DView").then((module) => ({
    default: module.Panel3DView,
  })),
);

type LoadState =
  | { status: "loading" }
  | { status: "failed"; notFound: boolean }
  | { status: "ready"; record: SharedDesignRecord };

function downloadFile(fileName: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function SharedDesignDetails({ record, copy }: { record: SharedDesignRecord; copy: ShareCopy }) {
  const [isCopied, setIsCopied] = React.useState(false);
  const mountingHoles = React.useMemo(
    () => computeOrderMountingHoles(record.model),
    [record.model],
  );
  const name = record.name || copy.untitled;

  React.useEffect(() => {
    if (!isCopied) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => setIsCopied(true))
      .catch(() => setIsCopied(false));
  };

  const handleDownloadJson = () => {
    const baseName = name.trim().replace(/\s+/g, "-") || "panel";
    downloadFile(`${baseName}.json`, serializePanelModel(record.model), "application/json");
  };

  return (
    <>
      <span className={styles.label}>{copy.pageEyebrow}</span>
      <h1 className={styles.title}>{name}</h1>
      {record.size ? <p className={styles.hint}>{record.size}</p> : null}
      <div className={styles.layout}>
        <div className={styles.previewFrame}>
          <React.Suspense
            fallback={
              <div className={styles.previewFallback}>
                <SphereLoader label={copy.previewLoading} />
              </div>
            }
          >
            <LazyPanel3DView
              model={record.model}
              mountingHoles={mountingHoles}
              thicknessMm={ORDER_PANEL_THICKNESS_MM}
            />
          </React.Suspense>
        </div>
        <div className={styles.column}>
          <section className={styles.howTo}>
            <a className={styles.buyButton} href={openDesignUrl(record.code)}>
              <PenTool size={20} />
              {copy.openInEditor}
            </a>
            <p className={styles.hint}>{copy.openInEditorHint}</p>
          </section>
          <div className={styles.fileButtons}>
            <button type="button" className={styles.copyButton} onClick={copyLink}>
              {isCopied ? <Check /> : <Copy />}
              {isCopied ? copy.copied : copy.copyLink}
            </button>
            <button type="button" className={styles.copyButton} onClick={handleDownloadJson}>
              <FileBraces />
              {copy.downloadJson}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** The page of a design shared by link: the panel in 3D, and a way to open a copy in the editor. */
export function SharedDesign({ code }: { code: string }) {
  const t = useI18n();
  const copy = t.share;
  const [state, setState] = React.useState<LoadState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    fetchSharedDesign(code)
      .then((record) => {
        if (!cancelled) {
          setState({ status: "ready", record });
        }
      })
      .catch((error: unknown) => {
        const notFound =
          error instanceof ShareRequestError && (error.status === 400 || error.status === 404);
        if (!notFound) {
          reportError(error, "share-page");
        }
        if (!cancelled) {
          setState({ status: "failed", notFound });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        {state.status === "ready" ? (
          <SharedDesignDetails record={state.record} copy={copy} />
        ) : (
          <>
            <h1 className={styles.title}>{copy.pageEyebrow}</h1>
            {state.status === "loading" ? (
              <SphereLoader label={copy.loading} />
            ) : (
              <p className={styles.status} role="alert">
                {state.notFound ? copy.notFound : copy.loadError}
              </p>
            )}
          </>
        )}
        <a className={styles.editLink} href="/">
          <FilePlus2 />
          {copy.designYourOwn}
        </a>
      </div>
    </div>
  );
}
