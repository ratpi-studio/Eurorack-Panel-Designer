import React from 'react';

import * as styles from './PanelDesigner.css';

const GITHUB_REPO_URL = 'https://github.com/ratpi-studio/Eurorack-Panel-Designer';

interface PanelHeaderProps {
  title: string;
  changelogLabel: string;
  onOpenChangelog: () => void;
}

export function PanelHeader({ title, changelogLabel, onOpenChangelog }: PanelHeaderProps) {
  return (
    <section className={styles.header}>
      <div className={styles.headerTop}>
        <div>
          <img src="/images/logo.svg" alt={title} className={styles.logo} />
        </div>
        <div className={styles.headerActions}>
          <a
            className={styles.githubLink}
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
          >
            <svg className={styles.githubIcon} viewBox="0 0 16 16" role="img" aria-hidden="true">
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82A7.62 7.62 0 0 1 8 3.44a7.6 7.6 0 0 1 2.01.27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
                fill="currentColor"
              />
            </svg>
            <span className={styles.githubLabel}>GitHub</span>
          </a>
          <a
            className={styles.supportLink}
            href="https://ko-fi.com/T6T01PMWCO"
            target="_blank"
            rel="noreferrer"
            aria-label="Support the project on Ko-fi"
          >
            <img
              className={styles.supportImage}
              src="/images/kofi5.png"
              alt="Buy me a coffee on Ko-fi"
            />
          </a>
          <button type="button" className={styles.changelogButton} onClick={onOpenChangelog}>
            {changelogLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
