/**
 * Writes to the entry tables.
 *
 * Every call lands on a SECURITY DEFINER function rather than on a table, so
 * the admin allowlist is checked inside the database and cannot be skipped by
 * editing the bundle. The field names here are the only place that knows the
 * wire format: the panel speaks the same shape the pages read, and this file
 * renames the few columns that differ (start/startMonth, end/endMonth,
 * cost/costM) on the way out.
 *
 * After a successful write the provider is told to refetch rather than having
 * its state patched. Refetching is what keeps the panel honest: the row that
 * comes back is the row the database actually holds, defaults included.
 */
import * as React from "react";
import { MISSING_CONFIG_MESSAGE, describeWriteError, supabase } from "@/lib/supabase";
import { useEntries } from "@/entries/EntriesProvider";
import type {
  CareerEntry,
  CertificationEntry,
  ChartRow,
  EntryTable,
  ProjectCurvePoint,
  ProjectEntry,
  SkillEntry,
} from "@/entries/types";

/** An entry being written: the stored shape, with the id filled in to update. */
type Input<T> = Omit<T, "id" | "sortOrder"> & { id?: string; sortOrder?: number };

export type CareerInput = Input<CareerEntry>;
export type ProjectInput = Input<ProjectEntry>;
export type CertificationInput = Input<CertificationEntry>;
export type SkillInput = Input<SkillEntry>;

/**
 * The two status lists the owner maintains. They are separate lists, because
 * "on-hold" says nothing about a certificate and "renewing" says nothing about
 * a project, so one shared list would offer each table values it never uses.
 */
export type StatusScope = "project" | "certification";

export interface ImageInput {
  certificationId: string;
  storagePath: string;
  caption: string;
  /** The type the browser reported for the picked file. */
  mimeType: string;
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
}

export interface ProjectPhotoInput {
  projectId: string;
  storagePath: string;
  caption: string;
  /** The type the browser reported for the picked file. */
  mimeType: string;
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
}

export interface EntryFeedback {
  tone: "status" | "error";
  text: string;
}

export interface EntryWriterValue {
  /** True while any write is in flight. */
  busy: boolean;
  feedback: EntryFeedback | null;
  clearFeedback: () => void;
  /** Returns the new row id, or null when the write was refused. */
  saveCareer: (input: CareerInput) => Promise<string | null>;
  saveProject: (input: ProjectInput) => Promise<string | null>;
  saveCertification: (input: CertificationInput) => Promise<string | null>;
  saveSkill: (input: SkillInput) => Promise<string | null>;
  /** Adds one skill category to the shared list. Returns its id, or null. */
  addSkillCategory: (name: string) => Promise<string | null>;
  /** Adds one role level to the shared list. Returns its id, or null. */
  addRoleLevel: (name: string) => Promise<string | null>;
  /** Renames a level, rewriting every job row that pointed at the old name. */
  renameRoleLevel: (from: string, to: string) => Promise<boolean>;
  /** Removes a level. Refused while a job entry still uses it. */
  deleteRoleLevel: (name: string) => Promise<boolean>;
  /** Adds one status to a list. */
  addStatusOption: (scope: StatusScope, name: string) => Promise<boolean>;
  /** Renames a status, rewriting every row that pointed at the old name. */
  renameStatusOption: (scope: StatusScope, from: string, to: string) => Promise<boolean>;
  /** Removes a status. Refused while a row still uses it. */
  deleteStatusOption: (scope: StatusScope, name: string) => Promise<boolean>;
  setVisible: (table: EntryTable, id: string, visible: boolean) => Promise<boolean>;
  removeEntry: (table: EntryTable, id: string) => Promise<boolean>;
  reorderEntries: (table: EntryTable, ids: string[]) => Promise<boolean>;
  addImage: (input: ImageInput) => Promise<boolean>;
  /** Removes the row and the stored object behind it. */
  removeImage: (id: string, storagePath: string) => Promise<boolean>;
  reorderImages: (certificationId: string, ids: string[]) => Promise<boolean>;
  /** Returns the new row id, or null when the write was refused. */
  addProjectPhoto: (input: ProjectPhotoInput) => Promise<string | null>;
  /** Rewrites the words under one photo, without touching the file. */
  setProjectPhotoCaption: (id: string, caption: string) => Promise<boolean>;
  removeProjectPhoto: (id: string, storagePath: string) => Promise<boolean>;
  reorderProjectPhotos: (projectId: string, ids: string[]) => Promise<boolean>;
  /** Replaces the whole chart line. An empty list clears it. */
  saveProjectCurve: (points: ProjectCurvePoint[]) => Promise<boolean>;
  /**
   * Replaces one chart's rows. An empty list clears them, which sends the
   * chart back to the numbers the entries produce.
   */
  saveChartSeries: (chart: string, rows: ChartRow[]) => Promise<boolean>;
}

const MEDIA_BUCKET = "portfolio-media";

/** Empty text is sent as null so a cleared field really clears. */
function text(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useEntryWriter(): EntryWriterValue {
  const { reload } = useEntries();

  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<EntryFeedback | null>(null);

  const clearFeedback = React.useCallback(() => setFeedback(null), []);

  const refuse = React.useCallback((message: string) => {
    setBusy(false);
    setFeedback({ tone: "error", text: message });
  }, []);

  /** One write, one refetch, one line of feedback. */
  const call = React.useCallback(
    async <T = unknown,>(
      rpc: string,
      args: Record<string, unknown>,
      done: string,
      failure: string,
    ): Promise<{ ok: boolean; data: T | null }> => {
      if (!supabase) {
        refuse(MISSING_CONFIG_MESSAGE);
        return { ok: false, data: null };
      }

      setBusy(true);
      setFeedback(null);

      const { data, error } = await supabase.rpc(rpc, args);

      if (error) {
        refuse(`${failure} ${describeWriteError(error)}`);
        return { ok: false, data: null };
      }

      await reload();
      setBusy(false);
      setFeedback({ tone: "status", text: done });
      return { ok: true, data: (data ?? null) as T | null };
    },
    [refuse, reload],
  );

  const saveCareer = React.useCallback(
    async (input: CareerInput) => {
      const result = await call(
        "portfolio_save_career",
        {
          p_payload: {
            id: input.id ?? null,
            title: input.title,
            company: input.company,
            sector: input.sector,
            location: input.location,
            startMonth: input.start,
            endMonth: text(input.end),
            level: input.level,
            headcount: input.headcount,
            summary: input.summary,
            highlights: input.highlights,
            stack: input.stack,
            visible: input.visible,
            sortOrder: input.sortOrder ?? null,
          },
        },
        "The job entry is saved.",
        "The job entry was not saved.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const saveProject = React.useCallback(
    async (input: ProjectInput) => {
      const result = await call(
        "portfolio_save_project",
        {
          p_payload: {
            id: input.id ?? null,
            name: input.name,
            kind: input.kind,
            status: input.status,
            role: input.role,
            year: input.year,
            months: input.months,
            teamSize: input.teamSize,
            budgetM: input.budgetM,
            impact: input.impact,
            stack: input.stack,
            summary: input.summary,
            location: input.location,
            featured: input.featured ?? false,
            visible: input.visible,
            sortOrder: input.sortOrder ?? null,
          },
        },
        "The project is saved.",
        "The project was not saved.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const saveCertification = React.useCallback(
    async (input: CertificationInput) => {
      const result = await call(
        "portfolio_save_certification",
        {
          p_payload: {
            id: input.id ?? null,
            name: input.name,
            issuer: input.issuer,
            domain: input.domain,
            issuedMonth: input.issued,
            expiresMonth: text(input.expires),
            credentialId: input.credentialId,
            credentialUrl: text(input.credentialUrl),
            status: input.status,
            costM: input.cost,
            visible: input.visible,
            sortOrder: input.sortOrder ?? null,
          },
        },
        "The certificate is saved.",
        "The certificate was not saved.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const saveSkill = React.useCallback(
    async (input: SkillInput) => {
      const result = await call(
        "portfolio_save_skill",
        {
          p_payload: {
            id: input.id ?? null,
            name: input.name,
            category: input.category,
            level: input.level,
            years: input.years,
            since: input.since,
            evidence: input.evidence,
            visible: input.visible,
            sortOrder: input.sortOrder ?? null,
          },
        },
        "The skill is saved.",
        "The skill was not saved.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const addSkillCategory = React.useCallback(
    async (name: string) => {
      const result = await call(
        "portfolio_add_skill_category",
        { p_name: name },
        `The category "${name.trim()}" was added.`,
        "The category was not added.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const addRoleLevel = React.useCallback(
    async (name: string) => {
      const result = await call(
        "portfolio_add_role_level",
        { p_name: name },
        `The level "${name.trim()}" was added.`,
        "The level was not added.",
      );
      return result.ok ? String(result.data) : null;
    },
    [call],
  );

  const renameRoleLevel = React.useCallback(
    async (from: string, to: string) => {
      const result = await call(
        "portfolio_rename_role_level",
        { p_from: from, p_to: to },
        `The level "${from.trim()}" is now "${to.trim()}".`,
        "The level was not renamed.",
      );
      return result.ok;
    },
    [call],
  );

  const deleteRoleLevel = React.useCallback(
    async (name: string) => {
      const result = await call(
        "portfolio_delete_role_level",
        { p_name: name },
        `The level "${name.trim()}" was deleted.`,
        "The level was not deleted.",
      );
      return result.ok;
    },
    [call],
  );

  /**
   * The three status list writes. They mirror the level and category writes
   * above: the boolean says whether it landed, and the caller re-reads the
   * lists so the dropdown shows the order the database now holds.
   */
  const addStatusOption = React.useCallback(
    async (scope: StatusScope, name: string) => {
      const result = await call(
        "portfolio_add_status_option",
        { p_scope: scope, p_name: name },
        `The status "${name.trim()}" was added.`,
        "The status was not added.",
      );
      return result.ok;
    },
    [call],
  );

  const renameStatusOption = React.useCallback(
    async (scope: StatusScope, from: string, to: string) => {
      const result = await call(
        "portfolio_rename_status_option",
        { p_scope: scope, p_from: from, p_to: to },
        `The status "${from.trim()}" is now "${to.trim()}".`,
        "The status was not renamed.",
      );
      return result.ok;
    },
    [call],
  );

  const deleteStatusOption = React.useCallback(
    async (scope: StatusScope, name: string) => {
      const result = await call(
        "portfolio_delete_status_option",
        { p_scope: scope, p_name: name },
        `The status "${name.trim()}" was deleted.`,
        "The status was not deleted.",
      );
      return result.ok;
    },
    [call],
  );

  const setVisible = React.useCallback(
    async (table: EntryTable, id: string, visible: boolean) => {
      const result = await call(
        "portfolio_set_entry_visible",
        { p_table: table, p_id: id, p_visible: visible },
        visible ? "Shown on the site again." : "Hidden from the site.",
        "The change was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const removeEntry = React.useCallback(
    async (table: EntryTable, id: string) => {
      const result = await call(
        "portfolio_delete_entry",
        { p_table: table, p_id: id },
        "The entry is deleted.",
        "The entry was not deleted.",
      );
      return result.ok;
    },
    [call],
  );

  const reorderEntries = React.useCallback(
    async (table: EntryTable, ids: string[]) => {
      const result = await call(
        "portfolio_reorder_entries",
        { p_table: table, p_ids: ids },
        "The order is saved.",
        "The new order was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const addImage = React.useCallback(
    async (input: ImageInput) => {
      const result = await call(
        "portfolio_add_certification_image",
        {
          p_payload: {
            certificationId: input.certificationId,
            storagePath: input.storagePath,
            caption: input.caption,
            mimeType: input.mimeType,
            width: input.width ?? null,
            height: input.height ?? null,
            byteSize: input.byteSize ?? null,
          },
        },
        "The scan is attached.",
        "The scan was not attached.",
      );
      return result.ok;
    },
    [call],
  );

  const removeImage = React.useCallback(
    async (id: string, storagePath: string) => {
      const result = await call(
        "portfolio_delete_certification_image",
        { p_id: id },
        "The scan is removed.",
        "The scan was not removed.",
      );
      if (!result.ok || !supabase) return result.ok;

      // The row is gone either way; a leftover object costs storage but shows
      // nowhere, so a failed cleanup is reported and not treated as a failure.
      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      if (error) {
        console.warn("[entries] the scan row was removed but its file was not:", error.message);
      }
      return true;
    },
    [call],
  );

  const reorderImages = React.useCallback(
    async (certificationId: string, ids: string[]) => {
      const result = await call(
        "portfolio_reorder_certification_images",
        { p_certification_id: certificationId, p_ids: ids },
        "The scan order is saved.",
        "The new scan order was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const addProjectPhoto = React.useCallback(
    async (input: ProjectPhotoInput) => {
      const result = await call<{ id: string }>(
        "portfolio_add_project_image",
        {
          p_payload: {
            projectId: input.projectId,
            storagePath: input.storagePath,
            caption: input.caption,
            mimeType: input.mimeType,
            width: input.width ?? null,
            height: input.height ?? null,
            byteSize: input.byteSize ?? null,
          },
        },
        "The photo is attached.",
        "The photo was not attached.",
      );
      return result.ok ? result.data?.id ?? "written" : null;
    },
    [call],
  );

  const setProjectPhotoCaption = React.useCallback(
    async (id: string, caption: string) => {
      const result = await call(
        "portfolio_set_project_image_caption",
        { p_id: id, p_caption: caption },
        "The caption is saved.",
        "The caption was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const removeProjectPhoto = React.useCallback(
    async (id: string, storagePath: string) => {
      const result = await call(
        "portfolio_delete_project_image",
        { p_id: id },
        "The photo is removed.",
        "The photo was not removed.",
      );
      if (!result.ok || !supabase) return result.ok;

      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      if (error) {
        console.warn("[entries] the photo row was removed but its file was not:", error.message);
      }
      return true;
    },
    [call],
  );

  const reorderProjectPhotos = React.useCallback(
    async (projectId: string, ids: string[]) => {
      const result = await call(
        "portfolio_reorder_project_images",
        { p_project_id: projectId, p_ids: ids },
        "The photo order is saved.",
        "The new photo order was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const saveProjectCurve = React.useCallback(
    async (points: ProjectCurvePoint[]) => {
      const result = await call(
        "portfolio_save_project_curve",
        { p_points: points },
        points.length > 0 ? "The chart line is saved." : "The chart line is cleared.",
        "The chart line was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  const saveChartSeries = React.useCallback(
    async (chart: string, rows: ChartRow[]) => {
      const result = await call(
        "portfolio_save_chart_series",
        { p_chart: chart, p_rows: rows },
        rows.length > 0 ? "The chart is saved." : "The chart is back to the computed numbers.",
        "The chart was not saved.",
      );
      return result.ok;
    },
    [call],
  );

  return {
    busy,
    feedback,
    clearFeedback,
    saveCareer,
    saveProject,
    saveCertification,
    saveSkill,
    addSkillCategory,
    addRoleLevel,
    renameRoleLevel,
    deleteRoleLevel,
    addStatusOption,
    renameStatusOption,
    deleteStatusOption,
    setVisible,
    removeEntry,
    reorderEntries,
    addImage,
    removeImage,
    reorderImages,
    addProjectPhoto,
    setProjectPhotoCaption,
    removeProjectPhoto,
    reorderProjectPhotos,
    saveProjectCurve,
    saveChartSeries,
  };
}
