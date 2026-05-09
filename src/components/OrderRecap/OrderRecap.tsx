import React from "react";

import { useI18n } from "@i18n/I18nContext";

import * as styles from "./OrderRecap.css";

interface OrderRecapProps {
  id: string;
}

interface OrderData {
  id: string;
  panelUrl: string;
  thumbnailUrl: string;
  panelColor: string;
  designColor: string;
  widthHp: number;
  priceEur: number;
  createdAt: string;
}

const ETSY_LISTING_URL = (import.meta.env.VITE_ETSY_LISTING_URL as string | undefined) ?? "";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function OrderRecap({ id }: OrderRecapProps) {
  const t = useI18n();
  const [data, setData] = React.useState<OrderData | null>(null);
  const [error, setError] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);

    fetch(`/api/order/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<OrderData>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCopy = React.useCallback(() => {
    if (!data) {
      return;
    }
    navigator.clipboard
      .writeText(data.id)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopied(false);
      });
  }, [data]);

  if (error) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t.order.title}</h1>
          <p className={styles.status}>{t.order.loadError}</p>
          <a href="/" className={styles.editLink}>
            {t.order.editLink}
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t.order.title}</h1>
          <p className={styles.status}>{t.order.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t.order.title}</h1>

        <div className={styles.thumbnailWrapper}>
          <img className={styles.thumbnail} src={data.thumbnailUrl} alt={t.order.title} />
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t.order.widthLabel}</span>
            <span className={styles.detailValue}>{data.widthHp} HP</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t.order.panelColorLabel}</span>
            <span className={styles.detailColor}>
              <span className={styles.swatch} style={{ backgroundColor: data.panelColor }} />
              {data.panelColor}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t.order.designColorLabel}</span>
            <span className={styles.detailColor}>
              <span className={styles.swatch} style={{ backgroundColor: data.designColor }} />
              {data.designColor}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>{t.order.priceLabel}</span>
            <span className={styles.detailValue}>{formatPrice(data.priceEur)}</span>
          </div>
        </div>

        <div className={styles.idBlock}>
          <span className={styles.detailLabel}>{t.order.idLabel}</span>
          <div className={styles.idRow}>
            <input className={styles.idInput} type="text" readOnly value={data.id} />
            <button type="button" className={styles.copyButton} onClick={handleCopy}>
              {copied ? t.order.copied : t.order.copyId}
            </button>
          </div>
          <span className={styles.idHelp}>{t.order.idHelp}</span>
        </div>

        {ETSY_LISTING_URL ? (
          <a
            className={styles.buyButton}
            href={ETSY_LISTING_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.order.buyCta}
          </a>
        ) : null}

        <a className={styles.editLink} href="/">
          {t.order.editLink}
        </a>
      </div>
    </div>
  );
}
