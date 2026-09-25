import {
  AppBar,
  Overline,
  Panel,
  StatCell,
  StatGrid,
  StatusBar,
  ThemeProvider,
} from "@salnika/uipirate";

import { REPO_URL, SITE_NAME } from "../site";
import type { ContentPage, PageLink } from "../types";
import { ButtonLink } from "./ButtonLink";
import * as styles from "./SeoLayout.css";

const GROUPS: readonly { group: PageLink["group"]; label: string }[] = [
  { group: "tools", label: "TOOLS" },
  { group: "reference", label: "REFERENCE" },
];

interface SeoLayoutProps {
  page: ContentPage;
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  version: string;
  /** The build date, as YYYY-MM-DD. */
  updated: string;
}

/** The frame of every content page: kit app bar, page navigation, masthead, and footer. */
export function SeoLayout({ page, pages, version, updated }: SeoLayoutProps) {
  const Body = page.Body;
  const groups = GROUPS.map(({ group, label }) => ({
    label,
    links: pages.filter((link) => link.group === group),
  }));
  const current = (link: PageLink) => (link.path === page.path ? "page" : undefined);

  return (
    <ThemeProvider defaultTheme="dark" defaultDensity="comfortable" className={styles.shell}>
      <a className={styles.skipLink} href="#content">
        Skip to content
      </a>
      <AppBar
        role="banner"
        brand={
          <a className={styles.brand} href="/">
            EURORACK PANEL DESIGNER
          </a>
        }
        revision={<span className={styles.revision}>V{version}</span>}
        trailing={<ButtonLink href="/">Open the editor</ButtonLink>}
      />
      <nav className={styles.pageNav} aria-label="Tools and reference">
        <div className={styles.pageNavInner}>
          {groups.map(({ label, links }) => (
            <div key={label} className={styles.navGroup}>
              <span className={styles.navGroupLabel} aria-hidden="true">
                {label}
              </span>
              {links.map((link) => (
                <a
                  key={link.path}
                  className={styles.navLink}
                  href={link.path}
                  aria-current={current(link)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <main id="content" className={styles.main}>
        <header className={styles.masthead}>
          <div>
            <p className={styles.kicker}>{page.kicker}</p>
            <h1 className={styles.headline}>{page.heading ?? page.title}</h1>
            <p className={styles.lede}>{page.lead}</p>
          </div>
          <StatGrid columns={2} rule="hard">
            {page.facts.map((fact) => (
              <StatCell
                key={fact.label}
                label={fact.label}
                value={fact.value}
                unit={fact.unit}
                pad="lg"
              />
            ))}
          </StatGrid>
        </header>

        <Body />

        <section className={styles.cta} aria-labelledby="editor-cta">
          <Panel
            variant="device"
            title="EDITOR"
            sub="FREE · NO ACCOUNT"
            meta="STL · SVG · PNG · KICAD"
          >
            <div className={styles.ctaBody}>
              <h2 id="editor-cta" className={styles.ctaTitle}>
                Draw it instead of measuring it
              </h2>
              <p className={styles.ctaText}>
                {SITE_NAME} applies every number on this page automatically: pick a width in HP or
                millimeters, drop the parts, and export an STL, an SVG, a PNG or a KiCad Edge.Cuts
                outline. It runs in the browser, it is free, and it needs no account.
              </p>
              <ButtonLink href="/">Open the editor</ButtonLink>
            </div>
          </Panel>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {groups.map(({ label, links }) => (
            <div key={label}>
              <Overline tracking="widest">{label}</Overline>
              <ul className={styles.footerList}>
                {links.map((link) => (
                  <li key={link.path}>
                    <a href={link.path} aria-current={current(link)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <Overline tracking="widest">PROJECT</Overline>
            <ul className={styles.footerList}>
              <li>
                <a href="/">The editor</a>
              </li>
              <li>
                <a href={REPO_URL}>Source on GitHub</a>
              </li>
            </ul>
          </div>
        </div>
        <StatusBar trailing={`UPDATED ${updated}`}>
          <span>{SITE_NAME.toUpperCase()}</span>
          <span>OPEN SOURCE · MIT</span>
        </StatusBar>
      </footer>
    </ThemeProvider>
  );
}
