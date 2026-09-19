/**
 * Types for the editable content layer.
 *
 * Every string an admin can change has a stable key. The key is what gets
 * stored in the database, so treat it as permanent: renaming a key orphans the
 * override that was saved under the old name.
 */

export type ContentPageId =
  | "global"
  | "home"
  | "career"
  | "projects"
  | "credentials"
  | "skills"
  | "about"
  | "contact"
  | "steadbyte"
  | "notfound";

export interface ContentEntry {
  /** Permanent identifier, for example "home.hero.title". */
  key: string;
  page: ContentPageId;
  /** Shown next to the field in the admin panel. */
  label: string;
  /** Used when no override has been published for this key. */
  default: string;
  /** Render a textarea instead of a single line field. */
  multiline?: boolean;
  /** Where the string appears, plus any tokens it accepts. */
  hint?: string;
}

export interface ContentPageMeta {
  id: ContentPageId;
  title: string;
  description: string;
  /** Where the admin can go to see this copy in context. */
  route: string;
}
