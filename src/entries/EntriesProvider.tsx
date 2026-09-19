/**
 * Reads the stored portfolio entries and falls back to the bundled samples.
 *
 * Two things can be true of a list: it has never been written to, or it was
 * filled in and then emptied on purpose. An empty table looks identical in both
 * cases, so the database keeps a marker per list in portfolio_entity_usage.
 * Until a marker exists the site shows the sample set from src/data/portfolio,
 * which is how an empty database still renders a complete looking site. The
 * moment a real entry is saved the marker appears and the samples drop out for
 * that list alone, so clearing every row really does show a bare section.
 *
 * Hidden rows are a separate matter. Row level security already keeps them away
 * from visitors, but a signed in admin can read them, so the public lists are
 * filtered here as well. A page must show the owner the same thing it shows a
 * stranger.
 *
 * If the database is unreachable the samples stay up. A failed read degrades to
 * the shipped copy, it never leaves a page blank.
 */
import * as React from "react";
import {
  career as sampleCareer,
  certifications as sampleCertifications,
  projects as sampleProjects,
  skills as sampleSkills,
} from "@/data/portfolio";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  parseSnapshot,
  publicImageUrl,
  type CareerEntry,
  type CertificationEntry,
  type EntrySnapshot,
  type EntryTable,
  type ProjectCurvePoint,
  type ProjectEntry,
  type SkillEntry,
} from "@/entries/types";

/** Re-read the cheap version marker this often, to catch edits made elsewhere. */
const VERSION_POLL_MS = 60_000;

/** A scan of a certificate, resolved to something a viewer can render. */
export interface CertificationScan {
  id: string;
  caption: string;
  url: string;
  /** Kept alongside the URL because removing a scan has to delete the object. */
  storagePath: string;
  /**
   * What the object is, so the viewer knows whether to show a picture or embed
   * a document. Carried through from the stored row rather than guessed from
   * the URL, which is often extensionless.
   */
  mimeType: string;
}

export interface EntryLists {
  career: CareerEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  skills: SkillEntry[];
}

/** A project photo, resolved to something a gallery can render. */
export interface ProjectPhoto {
  id: string;
  /** The words that go with the picture. May be empty. */
  caption: string;
  url: string;
  /** Kept alongside the URL because removing a photo has to delete the object. */
  storagePath: string;
}

export interface EntriesContextValue extends EntryLists {
  /** Every stored row, hidden ones included. The panel edits from this. */
  all: EntryLists;
  /** Scans belonging to one certificate, in the order the owner set. */
  scansFor: (certificationId: string) => CertificationScan[];
  /** Photos belonging to one project, in the order the owner set. */
  photosFor: (projectId: string) => ProjectPhoto[];
  /**
   * The hand set chart line, one point per year. Empty when the owner has not
   * set one, which is the signal for the chart to fall back to its computed
   * values rather than plot nothing.
   */
  curve: ProjectCurvePoint[];
  /** False until the first read attempt has settled. */
  ready: boolean;
  /** True when the read failed and every list is showing bundled samples. */
  offline: boolean;
  /**
   * True while a list is still showing the bundled samples, which means the
   * owner has never written to it. The page should say so rather than pass the
   * samples off as real history.
   */
  isSample: (table: EntryTable) => boolean;
  /** The stored data version, so views can tell when they are stale. */
  version: number;
  reload: () => Promise<void>;
}

const EntriesContext = React.createContext<EntriesContextValue | null>(null);

/** Sample rows carry no panel fields, so they are given a neutral set. */
function stamp(index: number) {
  return { visible: true, sortOrder: (index + 1) * 10 };
}

const SAMPLES: EntryLists = {
  career: sampleCareer.map((row, index) => ({ ...row, ...stamp(index) })),
  projects: sampleProjects.map((row, index) => ({ ...row, ...stamp(index) })),
  // The bundled certificates predate the credential link column.
  certifications: sampleCertifications.map((row, index) => ({
    ...row,
    ...stamp(index),
    credentialUrl: "",
  })),
  skills: sampleSkills.map((row, index) => ({ ...row, ...stamp(index) })),
};

const EMPTY: EntryLists = { career: [], projects: [], certifications: [], skills: [] };

/**
 * The entry payload and the usage markers, one round trip each.
 *
 * The markers are read from the table rather than through a function so the
 * same select works for a visitor and for the panel, and so a missing table
 * arrives as a plain empty list instead of a failed call.
 */
async function fetchEntries(): Promise<{ snapshot: EntrySnapshot | null; written: Set<EntryTable> }> {
  if (!supabase) return { snapshot: null, written: new Set() };

  const [entriesResult, usageResult] = await Promise.all([
    supabase.rpc("portfolio_entries"),
    supabase.from("portfolio_entity_usage").select("entity"),
  ]);

  if (entriesResult.error) {
    console.warn("[entries] could not read the entry lists:", entriesResult.error.message);
  }

  if (usageResult.error) {
    console.warn("[entries] could not read the usage markers:", usageResult.error.message);
  }

  const written = new Set<EntryTable>();
  for (const row of (usageResult.data ?? []) as Array<{ entity: string }>) {
    const short = row.entity.replace(/^portfolio_/, "") as EntryTable;
    if (short in EMPTY) written.add(short);
  }

  return { snapshot: entriesResult.error ? null : parseSnapshot(entriesResult.data), written };
}

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<EntrySnapshot | null>(null);
  const [written, setWritten] = React.useState<ReadonlySet<EntryTable>>(() => new Set<EntryTable>());
  const [version, setVersion] = React.useState(1);
  const [ready, setReady] = React.useState(false);
  const [offline, setOffline] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setOffline(true);
      setReady(true);
      return;
    }

    const result = await fetchEntries();
    setOffline(result.snapshot === null);
    setSnapshot(result.snapshot);
    setWritten(result.written);
    if (result.snapshot) setVersion(result.snapshot.version);
    setReady(true);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Read through a ref so the polling effect does not restart on every write.
  const versionRef = React.useRef(version);
  versionRef.current = version;

  /**
   * A second tab, or an edit made from a phone, should show up without a manual
   * reload. Only the version number is polled; the payload is refetched when it
   * actually changes.
   */
  React.useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const timer = window.setInterval(async () => {
      const { data, error } = await client
        .from("portfolio_data_version")
        .select("version")
        .maybeSingle();

      if (!active || error || !data) return;
      if ((data as { version: number }).version !== versionRef.current) await load();
    }, VERSION_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);

  const value = React.useMemo<EntriesContextValue>(() => {
    const all: EntryLists = snapshot
      ? {
          career: snapshot.career,
          projects: snapshot.projects,
          certifications: snapshot.certifications,
          skills: snapshot.skills,
        }
      : EMPTY;

    const grouped = new Map<string, CertificationScan[]>();
    for (const image of snapshot?.certificationImages ?? []) {
      const url = publicImageUrl(image.storagePath);
      if (!url) continue;
      const list = grouped.get(image.certificationId) ?? [];
      list.push({
        id: image.id,
        caption: image.caption,
        url,
        storagePath: image.storagePath,
        mimeType: image.mimeType,
      });
      grouped.set(image.certificationId, list);
    }

    const photoGroups = new Map<string, ProjectPhoto[]>();
    for (const image of snapshot?.projectImages ?? []) {
      const url = publicImageUrl(image.storagePath);
      if (!url) continue;
      const list = photoGroups.get(image.projectId) ?? [];
      list.push({
        id: image.id,
        caption: image.caption,
        url,
        storagePath: image.storagePath,
      });
      photoGroups.set(image.projectId, list);
    }

    return {
      career: written.has("career") ? all.career.filter((row) => row.visible) : SAMPLES.career,
      projects: written.has("projects") ? all.projects.filter((row) => row.visible) : SAMPLES.projects,
      certifications: written.has("certifications")
        ? all.certifications.filter((row) => row.visible)
        : SAMPLES.certifications,
      skills: written.has("skills") ? all.skills.filter((row) => row.visible) : SAMPLES.skills,
      all,
      scansFor: (certificationId: string) => grouped.get(certificationId) ?? [],
      photosFor: (projectId: string) => photoGroups.get(projectId) ?? [],
      curve: snapshot?.projectCurve ?? [],
      ready,
      offline,
      isSample: (table: EntryTable) => !written.has(table),
      version,
      reload: load,
    };
  }, [snapshot, written, ready, offline, version, load]);

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const context = React.useContext(EntriesContext);
  if (!context) {
    throw new Error("useEntries must be called inside an EntriesProvider");
  }
  return context;
}
