import toast from "react-hot-toast";

import { enUS } from "@i18n/en_US";
import {
  GITHUB_PAGES_DATA_PREFIX,
  importGithubPagesData,
  readGithubPagesData,
} from "@lib/githubPagesMigration";
import { reportError } from "@lib/monitoring";

type Migration = { status: "none" | "imported" } | { status: "failed"; error: unknown };

// Runs when main.tsx loads, before the store module: an imported autosave has to be in
// localStorage before the store hydrates from it.
function migrate(): Migration {
  const { hash, pathname, search } = window.location;
  if (!hash.startsWith(GITHUB_PAGES_DATA_PREFIX)) {
    return { status: "none" };
  }
  // Drop the data from the URL first: it stays out of the history, error reports and analytics.
  window.history.replaceState(window.history.state, "", `${pathname}${search}`);
  try {
    const data = readGithubPagesData(hash);
    if (data) {
      importGithubPagesData(data, {
        sessionProjectName: enUS.githubPagesMigration.sessionProjectName,
        projectNameSuffix: enUS.githubPagesMigration.projectNameSuffix,
      });
    }
    return { status: "imported" };
  } catch (error) {
    return { status: "failed", error };
  }
}

const migration = migrate();

/** Tells the user about the import, once and for longer than usual. Called after Sentry starts. */
export function notifyGithubPagesMigration(): void {
  if (migration.status === "imported") {
    toast.success(enUS.githubPagesMigration.imported, {
      id: "github-pages-migration",
      duration: 8000,
    });
  } else if (migration.status === "failed") {
    reportError(migration.error, "github-pages-import");
    toast.error(enUS.githubPagesMigration.failed, { id: "github-pages-migration", duration: 8000 });
  }
}
