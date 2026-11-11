import { Panel } from "@salnika/uipirate";

import { PanelPreview } from "../islands/PanelPreview";
import * as previewStyles from "../islands/PanelPreview.css";
import { mm } from "../pages/shared";
import { PAGE_PATHS } from "../paths";
import type { PanelTemplate } from "../templates";
import { ButtonLink } from "./ButtonLink";
import { link } from "./Prose.css";
import * as styles from "./TemplateFigure.css";

interface TemplateFigureProps {
  template: PanelTemplate;
}

/** A panel template drawn to scale, with its files to download and the way into the editor. */
export function TemplateFigure({ template }: TemplateFigureProps) {
  const { widthHp, widthMm, heightMm, holes, columnXs, files, editorUrl } = template;
  const holeDiameterMm = holes[0]?.diameterMm ?? 0;

  return (
    <div className={styles.figure}>
      <Panel
        variant="device"
        title="TEMPLATE"
        sub="TO SCALE"
        meta={`${widthHp} HP · 3U`}
        footer={
          <span className={styles.footerValue}>
            {mm(widthMm)} × {mm(heightMm)} MM · {holes.length} HOLES · Ø {mm(holeDiameterMm)}
          </span>
        }
      >
        <div className={previewStyles.frame}>
          <PanelPreview
            widthMm={widthMm}
            heightMm={heightMm}
            holes={holes}
            firstColumnMm={columnXs[0] ?? 0}
            label={`${widthHp} HP Eurorack blank panel, ${mm(widthMm)} by ${mm(heightMm)} mm, with ${holes.length} mounting holes.`}
          />
        </div>
      </Panel>
      <div className={styles.actions}>
        <ButtonLink href={editorUrl}>Open in the editor</ButtonLink>
        <ButtonLink href={files.svg} variant="secondary" download>
          SVG
        </ButtonLink>
        <ButtonLink href={files.stl} variant="secondary" download>
          STL
        </ButtonLink>
        <ButtonLink href={files.kicad_pcb} variant="secondary" download>
          KiCad
        </ButtonLink>
      </div>
      <p className={styles.terms}>
        Free for personal use: see the{" "}
        <a className={link} href={PAGE_PATHS.terms}>
          terms of use
        </a>
        .
      </p>
    </div>
  );
}
