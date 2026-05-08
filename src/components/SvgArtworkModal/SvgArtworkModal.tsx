import React from "react";

import { useI18n } from "@i18n/I18nContext";
import { createSvgArtworkElement, sanitizeSvgArtwork } from "@lib/svgArtwork";
import type { PanelElement, Vector2 } from "@lib/panelTypes";

import * as styles from "./SvgArtworkModal.css";

interface SvgLibraryItem {
  id: string;
  name: string;
  src: string;
}

interface SvgArtworkModalProps {
  panelSizeMm: Vector2;
  onAddArtwork: (element: PanelElement) => void;
  onClose: () => void;
}

function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

function getPublicAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\/+/, "")}`;
}

function isLibraryItem(value: unknown): value is SvgLibraryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as SvgLibraryItem;
  return (
    typeof item.id === "string" && typeof item.name === "string" && typeof item.src === "string"
  );
}

export function SvgArtworkModal({
  panelSizeMm,
  onAddArtwork,
  onClose,
}: SvgArtworkModalProps) {
  const t = useI18n();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [libraryItems, setLibraryItems] = React.useState<SvgLibraryItem[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(getPublicAssetUrl("svg-library/manifest.json"))
      .then((response) => (response.ok ? response.json() : []))
      .then((payload: unknown) => {
        if (cancelled) {
          return;
        }
        setLibraryItems(Array.isArray(payload) ? payload.filter(isLibraryItem) : []);
      })
      .catch(() => {
        if (!cancelled) {
          setLibraryItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLibraryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addSvgText = React.useCallback(
    (svgText: string, sourceName?: string, sourceId?: string) => {
      try {
        const sanitized = sanitizeSvgArtwork(svgText);
        const element = createSvgArtworkElement({
          ...sanitized,
          panelSizeMm,
          sourceName,
          sourceId,
        });
        onAddArtwork(element);
        onClose();
      } catch {
        setError(t.svgArtwork.invalidSvg);
      }
    },
    [onAddArtwork, onClose, panelSizeMm, t.svgArtwork.invalidSvg],
  );

  const handleFiles = React.useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) {
        return;
      }
      if (!isSvgFile(file)) {
        setError(t.svgArtwork.invalidFile);
        return;
      }
      file
        .text()
        .then((text) => addSvgText(text, file.name))
        .catch(() => setError(t.svgArtwork.invalidSvg));
    },
    [addSvgText, t.svgArtwork.invalidFile, t.svgArtwork.invalidSvg],
  );

  const handleLibrarySelect = React.useCallback(
    (item: SvgLibraryItem) => {
      setError(null);
      fetch(getPublicAssetUrl(item.src))
        .then((response) => {
          if (!response.ok) {
            throw new Error("Unable to load SVG asset.");
          }
          return response.text();
        })
        .then((text) => addSvgText(text, item.name, item.id))
        .catch(() => setError(t.svgArtwork.libraryError));
    },
    [addSvgText, t.svgArtwork.libraryError],
  );

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={isDragging ? styles.dropZoneActive : styles.dropZone}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        {t.svgArtwork.dropLabel}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className={styles.hiddenInput}
        onChange={(event) => {
          if (event.target.files) {
            handleFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
      <div className={styles.message}>{t.svgArtwork.libraryTitle}</div>
      {isLibraryLoading ? <div className={styles.message}>{t.svgArtwork.libraryLoading}</div> : null}
      {!isLibraryLoading && !libraryItems.length ? (
        <div className={styles.message}>{t.svgArtwork.libraryEmpty}</div>
      ) : null}
      {libraryItems.length ? (
        <div className={styles.library}>
          {libraryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.libraryButton}
              onClick={() => handleLibrarySelect(item)}
            >
              <span className={styles.previewFrame} aria-hidden="true">
                <img className={styles.previewImage} src={getPublicAssetUrl(item.src)} alt="" />
              </span>
              <span className={styles.libraryName}>{item.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
}
