import React from "react";

import * as designerStyles from "@components/PanelDesigner/PanelDesigner.css";
import { useI18n } from "@i18n/I18nContext";
import { collectTextFontIds, hasDesignElements } from "@lib/designLayer";
import { getVisibleElements, withoutHiddenElements } from "@lib/elementVisibility";
import { reportError } from "@lib/monitoring";
import {
  OrderRequestError,
  computeOrderMountingHoles,
  createOrder,
  isBlockingIssue,
  listOrderIssues,
  type OrderFilaments,
  type OrderIssue,
} from "@lib/order";
import {
  FILAMENTS,
  ORDER_PANEL_THICKNESS_MM,
  filamentHex,
  nearestFilament,
  orderPriceEur,
  type FilamentId,
} from "@lib/orderCatalog";
import { type PanelModel } from "@lib/panelTypes";
import { getTextFontsVersion, loadTextFonts, subscribeTextFonts } from "@lib/text/textFontLoader";

import * as styles from "./OrderDialog.css";

type OrderCopy = ReturnType<typeof useI18n>["order"];

const LazyPanel3DView = React.lazy(() =>
  import("@components/Panel3DView/Panel3DView").then((module) => ({
    default: module.Panel3DView,
  })),
);

interface OrderDialogProps {
  model: PanelModel;
  onClose: () => void;
}

function describeOrderError(error: unknown, copy: OrderCopy): string {
  if (error instanceof OrderRequestError) {
    if (error.status === 0) {
      return copy.errors.network;
    }
    if (error.status === 404) {
      return copy.errors.unavailable;
    }
    if (error.status === 413) {
      return copy.errors.tooLarge;
    }
    if (error.status >= 400 && error.status < 500) {
      return copy.errors.invalid;
    }
  }
  return copy.errors.server;
}

function describeIssue(issue: OrderIssue, copy: OrderCopy): string {
  switch (issue.kind) {
    case "tooWide":
      return copy.issueTooWide(issue.widthHp, issue.maxWidthHp);
    case "sameFilament":
      return copy.issueSameFilament;
    case "textPrint":
      return copy.issueTextPrint(issue.count);
    case "hiddenElements":
      return copy.issueHiddenElements(issue.count);
  }
}

interface FilamentPickerProps {
  name: string;
  label: string;
  hint?: string;
  value: FilamentId;
  copy: OrderCopy;
  onChange: (id: FilamentId) => void;
}

function FilamentPicker({ name, label, hint, value, copy, onChange }: FilamentPickerProps) {
  return (
    <fieldset className={styles.filamentField}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.swatches}>
        {FILAMENTS.map((filament) => (
          <label
            key={filament.id}
            className={styles.swatchOption[value === filament.id ? "selected" : "idle"]}
          >
            <input
              className={styles.swatchInput}
              type="radio"
              name={name}
              value={filament.id}
              checked={value === filament.id}
              onChange={() => onChange(filament.id)}
            />
            <span
              className={styles.swatch}
              style={{ backgroundColor: filament.hex }}
              aria-hidden="true"
            />
            {copy.filamentNames[filament.id]}
          </label>
        ))}
      </div>
      {hint ? <span className={designerStyles.hint}>{hint}</span> : null}
    </fieldset>
  );
}

/** Lets the buyer pick the filaments, then stores the design and opens its order page. */
export function OrderDialog({ model, onClose }: OrderDialogProps) {
  const t = useI18n();
  const copy = t.order;
  const [filaments, setFilaments] = React.useState<OrderFilaments>(() => ({
    panel: nearestFilament(model.panelColor),
    details: nearestFilament(model.designColor),
  }));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const mountingHoles = React.useMemo(() => computeOrderMountingHoles(model), [model]);
  // The preview shows the chosen filaments instead of the editor colors.
  const previewModel = React.useMemo(
    () => ({
      ...withoutHiddenElements(model),
      panelColor: filamentHex(filaments.panel),
      designColor: filamentHex(filaments.details),
    }),
    [model, filaments],
  );
  // Checking texts needs their fonts: list the issues again once they have loaded.
  React.useSyncExternalStore(subscribeTextFonts, getTextFontsVersion);
  React.useEffect(() => {
    void loadTextFonts(collectTextFontIds(model.elements));
  }, [model.elements]);
  const issues = listOrderIssues(model, filaments);
  const isBlocked = issues.some(isBlockingIssue);
  const widthHp = model.dimensions.widthHp;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    createOrder(model, filaments)
      .then((code) => {
        window.location.assign(`/order/${encodeURIComponent(code)}`);
      })
      .catch((error: unknown) => {
        reportError(error, "order-create");
        setErrorMessage(describeOrderError(error, copy));
        setIsSubmitting(false);
      });
  };

  return (
    <div
      className={designerStyles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-dialog-title"
      onPointerDown={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className={styles.dialog}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 id="order-dialog-title" className={designerStyles.modalTitle}>
          {copy.dialogTitle}
        </h2>
        <p className={designerStyles.modalDescription}>{copy.dialogDescription}</p>
        <div className={styles.layout}>
          <div className={styles.column}>
            <span className={designerStyles.label}>{copy.previewLabel}</span>
            <div className={styles.previewFrame}>
              <React.Suspense
                fallback={
                  <div className={designerStyles.viewportFallback}>{copy.previewLoading}</div>
                }
              >
                <LazyPanel3DView
                  model={previewModel}
                  mountingHoles={mountingHoles}
                  thicknessMm={ORDER_PANEL_THICKNESS_MM}
                />
              </React.Suspense>
            </div>
          </div>
          <div className={styles.column}>
            <FilamentPicker
              name="order-panel-filament"
              label={copy.panelFilamentLabel}
              value={filaments.panel}
              copy={copy}
              onChange={(panel) => setFilaments((previous) => ({ ...previous, panel }))}
            />
            {hasDesignElements(getVisibleElements(model.elements)) ? (
              <FilamentPicker
                name="order-details-filament"
                label={copy.detailsFilamentLabel}
                hint={copy.detailsFilamentHint}
                value={filaments.details}
                copy={copy}
                onChange={(details) => setFilaments((previous) => ({ ...previous, details }))}
              />
            ) : null}
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={designerStyles.label}>{copy.widthLabel}</span>
                <span className={styles.summaryValue}>{copy.widthValue(widthHp)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={designerStyles.label}>{copy.priceLabel}</span>
                <span className={styles.summaryValue}>
                  {isBlocked ? "—" : copy.price(orderPriceEur(widthHp))}
                </span>
                <span className={designerStyles.hint}>{copy.priceHint}</span>
              </div>
            </div>
            {issues.length ? (
              <ul className={styles.issues}>
                {issues.map((issue) => (
                  <li
                    key={issue.kind}
                    className={styles.issue[isBlockingIssue(issue) ? "blocking" : "warning"]}
                  >
                    {describeIssue(issue, copy)}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className={designerStyles.previewSection}>
              <span className={designerStyles.label}>{copy.stepsTitle}</span>
              <ol className={styles.steps}>
                {copy.steps(widthHp).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className={designerStyles.modalActions}>
          <button
            type="button"
            className={designerStyles.secondaryButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isBlocked || isSubmitting}
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
