import type { ReactNode } from "react";
import { Panel, Table, type Column } from "@salnika/uipirate";

import * as styles from "./DataTable.css";

interface DataTableProps<R> {
  /** Panel title, in the kit's mono capitals; also the table's accessible name. */
  title: string;
  /** Right-hand annotation of the panel header: a row count, a unit. */
  meta?: string;
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  /** What the columns mean, printed under the table. */
  note?: ReactNode;
  minWidth?: keyof typeof styles.minWidth;
}

/** A kit table in a kit panel, for the reference data of the pages. */
export function DataTable<R>({
  title,
  meta,
  columns,
  rows,
  rowKey,
  note,
  minWidth = "none",
}: DataTableProps<R>) {
  return (
    <Panel
      title={title}
      meta={meta}
      note={note ? <span className={styles.note}>{note}</span> : undefined}
    >
      <div className={styles.scroller}>
        <Table
          aria-label={title}
          className={styles.minWidth[minWidth]}
          columns={columns}
          rows={rows}
          rowKey={rowKey}
        />
      </div>
    </Panel>
  );
}
