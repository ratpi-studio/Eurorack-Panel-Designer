import { Check, Copy, ExternalLink, Link2, X } from "lucide-react";
import React from "react";

import * as designerStyles from "@components/PanelDesigner/PanelDesigner.css";
import { useI18n } from "@i18n/I18nContext";
import { buildShareCardPng } from "@lib/canvas/shareCard";
import { withoutHiddenElements } from "@lib/elementVisibility";
import { reportError } from "@lib/monitoring";
import { type MountingHole, type PanelModel } from "@lib/panelTypes";
import {
  SHARE_CARD_SITE,
  ShareRequestError,
  createShare,
  describePanelSize,
  sharePageUrl,
} from "@lib/share";

import * as styles from "./ShareDialog.css";

type ShareCopy = ReturnType<typeof useI18n>["share"];

type ShareState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "ready"; url: string }
  | { status: "failed"; message: string };

interface ShareDialogProps {
  model: PanelModel;
  /** The panel's own mounting holes, as the editor draws them. */
  mountingHoles: MountingHole[];
  projectName: string;
  onClose: () => void;
}

function describeShareError(error: unknown, copy: ShareCopy): string {
  if (error instanceof ShareRequestError) {
    if (error.status === 0) {
      return copy.errors.network;
    }
    if (error.status === 413) {
      return copy.errors.tooLarge;
    }
    if (error.status === 400) {
      return copy.errors.invalid;
    }
  }
  return copy.errors.server;
}

/**
 * Shares the design by link. Nothing leaves the browser until the person asks for a link: the
 * design, without its hidden components, and the card its link shows in chats and forums.
 */
export function ShareDialog({ model, mountingHoles, projectName, onClose }: ShareDialogProps) {
  const t = useI18n();
  const copy = t.share;
  const [state, setState] = React.useState<ShareState>({ status: "idle" });
  const [isCopied, setIsCopied] = React.useState(false);
  const isCreating = state.status === "creating";

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreating, onClose]);

  React.useEffect(() => {
    if (!isCopied) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const handleCreate = () => {
    setState({ status: "creating" });
    const shared = withoutHiddenElements(model);
    const name = projectName.trim() || copy.untitled;
    const size = copy.size(describePanelSize(shared));
    buildShareCardPng(shared, mountingHoles, {
      name,
      size,
      tagline: copy.cardTagline,
      site: SHARE_CARD_SITE,
    })
      .then((cardDataUrl) => {
        if (!cardDataUrl) {
          throw new Error("The share card could not be drawn.");
        }
        return createShare({ model: shared, name, size, cardDataUrl });
      })
      .then((code) => {
        setState({ status: "ready", url: sharePageUrl(code, window.location.origin) });
      })
      .catch((error: unknown) => {
        reportError(error, "share-create");
        setState({ status: "failed", message: describeShareError(error, copy) });
      });
  };

  const copyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => setIsCopied(true))
      .catch(() => setIsCopied(false));
  };

  return (
    <div
      className={designerStyles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onPointerDown={() => {
        if (!isCreating) {
          onClose();
        }
      }}
    >
      <div
        className={designerStyles.modalWide}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 id="share-dialog-title" className={designerStyles.modalTitle}>
          {copy.dialogTitle}
        </h2>
        <p className={designerStyles.modalDescription}>{copy.dialogDescription}</p>
        {state.status === "ready" ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="share-link">
              {copy.linkLabel}
            </label>
            <div className={styles.linkRow}>
              <input
                id="share-link"
                className={styles.linkInput}
                value={state.url}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                className={designerStyles.secondaryButton}
                onClick={() => copyLink(state.url)}
              >
                {isCopied ? <Check /> : <Copy />}
                {isCopied ? copy.copied : copy.copyLink}
              </button>
              <button
                type="button"
                className={designerStyles.secondaryButton}
                onClick={() => window.open(state.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink />
                {copy.openLink}
              </button>
            </div>
          </div>
        ) : null}
        {state.status === "failed" ? (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        ) : null}
        <div className={designerStyles.modalActions}>
          {state.status === "ready" ? (
            <button type="button" className={designerStyles.primaryButton} onClick={onClose}>
              <Check />
              {copy.close}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={designerStyles.secondaryButton}
                onClick={onClose}
                disabled={isCreating}
              >
                <X />
                {copy.cancel}
              </button>
              <button
                type="button"
                className={designerStyles.primaryButton}
                onClick={handleCreate}
                disabled={isCreating}
              >
                <Link2 />
                {isCreating ? copy.creating : copy.create}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
