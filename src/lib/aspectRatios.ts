/**
 * Aspect ratio catalogue for the admin preview tool.
 *
 * What this module is honest about:
 * - The list below is the owner's fixed preference list, not a survey of the
 *   market. Nothing here is measured from real device telemetry.
 * - Ratio labels are written the way each device family is conventionally
 *   quoted, and those conventions disagree. A phone "20:9" means 20 tall by 9
 *   wide; a tablet "4:3" means 4 wide by 3 tall. So each entry stores only the
 *   long side over the short side, plus the orientation that family is normally
 *   quoted in, and the frame ratio is derived from those two facts. Treating
 *   "20:9" as a wide box is the bug this shape prevents.
 * - "Automatic detection" reads the browser's own viewport/screen numbers. It
 *   reports the closest supported ratio *and* which orientation it matched, so a
 *   wrong guess is visible instead of silently trusted.
 * - Device class detection uses the shortest side and pointer type. A desktop
 *   with a touch screen can therefore be read as a tablet, which is why the
 *   detected class is shown as a suggestion the user can override.
 *
 * No DOM access happens at module scope; every function guards `window` so the
 * module stays import-safe during prerender and inside tests.
 */

/** Device families the preference list is grouped by. */
export type DeviceClass = "smartphone" | "tablet";

/** Which way the device is held. */
export type Orientation = "portrait" | "landscape";

export interface AspectRatioOption {
  /** stable id, e.g. "20:9" */
  id: string;
  /** long side divided by short side, e.g. 20/9 for "20:9" */
  longShort: number;
  label: string;
  deviceClass: DeviceClass;
  /** the orientation this family is conventionally quoted in */
  defaultOrientation: Orientation;
  /** short note shown next to the option in the picker */
  note: string;
}

export interface DeviceReading {
  /** viewport width in CSS pixels */
  viewportWidth: number;
  /** viewport height in CSS pixels */
  viewportHeight: number;
  /** window.screen.width/height, which is the full panel, not the page */
  screenWidth: number;
  screenHeight: number;
  /** width over height of the reading source, so a portrait phone is under 1 */
  ratio: number;
  /** one of the catalogue ids, or null when nothing is close enough */
  nearestId: string | null;
  /** which orientation of that option matched */
  nearestOrientation: Orientation;
  /** absolute difference between measured ratio and the matched frame ratio */
  deviation: number;
  /** true when the nearest option is within MATCH_TOLERANCE */
  confident: boolean;
  deviceClass: DeviceClass;
  /** how the class was decided, shown in the panel for transparency */
  classReason: string;
}

/** Widest accepted gap between a measured ratio and a catalogue entry. */
export const MATCH_TOLERANCE = 0.12;

/** Catalogue in the owner's order: phone ratios first, then tablets. */
export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "20:9", longShort: 20 / 9, label: "20:9", deviceClass: "smartphone", defaultOrientation: "portrait", note: "Modern tall phone" },
  { id: "19.5:9", longShort: 19.5 / 9, label: "19.5:9", deviceClass: "smartphone", defaultOrientation: "portrait", note: "iPhone notch era" },
  { id: "16:9", longShort: 16 / 9, label: "16:9", deviceClass: "smartphone", defaultOrientation: "portrait", note: "Classic widescreen" },
  { id: "19:9", longShort: 19 / 9, label: "19:9", deviceClass: "smartphone", defaultOrientation: "portrait", note: "Slender Android" },
  { id: "4:3", longShort: 4 / 3, label: "4:3", deviceClass: "tablet", defaultOrientation: "landscape", note: "iPad landscape" },
  { id: "16:10", longShort: 16 / 10, label: "16:10", deviceClass: "tablet", defaultOrientation: "landscape", note: "Android tablet" },
  { id: "3:2", longShort: 3 / 2, label: "3:2", deviceClass: "tablet", defaultOrientation: "landscape", note: "Surface style" },
];

export const DEVICE_CLASS_LABEL: Record<DeviceClass, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
};

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  portrait: "Portrait",
  landscape: "Landscape",
};

export const DEVICE_CLASS_ORDER: DeviceClass[] = ["smartphone", "tablet"];

export function optionsForDeviceClass(deviceClass: DeviceClass): AspectRatioOption[] {
  return ASPECT_RATIOS.filter((option) => option.deviceClass === deviceClass);
}

export function findRatio(id: string | null | undefined): AspectRatioOption | null {
  if (!id) return null;
  return ASPECT_RATIOS.find((option) => option.id === id) ?? null;
}

/**
 * Width over height for a frame. A portrait "20:9" becomes 9/20 = 0.45, which
 * is the tall box a phone page is actually laid out in.
 */
export function frameValue(option: AspectRatioOption, orientation: Orientation): number {
  return orientation === "portrait" ? 1 / option.longShort : option.longShort;
}

/**
 * Closest catalogue entry to a measured width/height ratio, checking both
 * orientations of every option. Returns null only for unmeasurable input.
 */
export function closestRatio(
  width: number,
  height: number,
): { option: AspectRatioOption; orientation: Orientation; deviation: number } | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const measured = width / height;
  let best: { option: AspectRatioOption; orientation: Orientation; deviation: number } | null = null;
  for (const option of ASPECT_RATIOS) {
    for (const orientation of ["portrait", "landscape"] as Orientation[]) {
      const deviation = Math.abs(measured - frameValue(option, orientation));
      if (!best || deviation < best.deviation) {
        best = { option, orientation, deviation };
      }
    }
  }
  return best;
}

/**
 * Reads the current device. Prefers the physical screen ratio when the browser
 * exposes a portrait panel, because the viewport shrinks with browser chrome
 * and would otherwise be read as an oddly tall phone.
 */
export function readDevice(): DeviceReading | null {
  if (typeof window === "undefined") return null;

  const viewportWidth = Math.round(window.innerWidth || 0);
  const viewportHeight = Math.round(window.innerHeight || 0);
  const screenWidth = Math.round(window.screen?.width || 0);
  const screenHeight = Math.round(window.screen?.height || 0);

  const screenUsable = screenWidth > 0 && screenHeight > 0 && screenHeight >= screenWidth;
  const sourceWidth = screenUsable ? screenWidth : viewportWidth;
  const sourceHeight = screenUsable ? screenHeight : viewportHeight;
  if (!sourceWidth || !sourceHeight) return null;

  const match = closestRatio(sourceWidth, sourceHeight);
  const shortestSide = Math.min(sourceWidth, sourceHeight);
  const hasTouch = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;

  // Tablet vs phone: the shortest side is the reliable signal, since a phone in
  // landscape still has a short edge. 768 CSS px is the usual tablet breakpoint.
  let deviceClass: DeviceClass;
  let classReason: string;
  if (shortestSide >= 768) {
    deviceClass = "tablet";
    classReason = `shortest side ${shortestSide}px >= 768px`;
  } else if (hasTouch && shortestSide >= 600) {
    deviceClass = "tablet";
    classReason = `coarse pointer with shortest side ${shortestSide}px`;
  } else {
    deviceClass = "smartphone";
    classReason = `shortest side ${shortestSide}px and ${hasTouch ? "coarse" : "fine"} pointer`;
  }

  return {
    viewportWidth,
    viewportHeight,
    screenWidth,
    screenHeight,
    ratio: sourceWidth / sourceHeight,
    nearestId: match?.option.id ?? null,
    nearestOrientation: match?.orientation ?? "portrait",
    deviation: match?.deviation ?? Number.POSITIVE_INFINITY,
    confident: Boolean(match && match.deviation <= MATCH_TOLERANCE),
    deviceClass,
    classReason,
  };
}

const RATIO_STORAGE_KEY = "arnal.preview.aspectRatio";
const ORIENTATION_STORAGE_KEY = "arnal.preview.orientation";
const PAGE_STORAGE_KEY = "arnal.preview.page";

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode or blocked storage: fall back to in-memory defaults.
    return null;
  }
}

function writeStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Persistence is a convenience; failing to store must not break the panel.
  }
}

function isOrientation(value: string | null): value is Orientation {
  return value === "portrait" || value === "landscape";
}

export interface PreferredRatio {
  option: AspectRatioOption;
  orientation: Orientation;
}

/**
 * The ratio to open with: the stored choice when it still exists in the
 * catalogue, otherwise the detected ratio, otherwise the first option of the
 * detected family. Orientation follows the same order of preference.
 */
export function loadPreferredRatio(reading: DeviceReading | null): PreferredRatio {
  const stored = findRatio(readStored(RATIO_STORAGE_KEY));
  const storedOrientation = readStored(ORIENTATION_STORAGE_KEY);
  if (stored) {
    return {
      option: stored,
      orientation: isOrientation(storedOrientation) ? storedOrientation : stored.defaultOrientation,
    };
  }
  const detected = findRatio(reading?.nearestId ?? null);
  if (detected) {
    return { option: detected, orientation: reading?.nearestOrientation ?? detected.defaultOrientation };
  }
  const fallback = reading ? optionsForDeviceClass(reading.deviceClass)[0] : undefined;
  const option = fallback ?? ASPECT_RATIOS[0];
  return { option, orientation: option.defaultOrientation };
}

/** Keeps the chosen ratio for the rest of the session and future visits. */
export function savePreferredRatio(id: string, orientation: Orientation): void {
  writeStored(RATIO_STORAGE_KEY, id);
  writeStored(ORIENTATION_STORAGE_KEY, orientation);
}

export function loadPreferredPage(): string | null {
  const stored = readStored(PAGE_STORAGE_KEY);
  return stored && stored.length > 0 ? stored : null;
}

export function savePreferredPage(pageId: string): void {
  writeStored(PAGE_STORAGE_KEY, pageId);
}

export interface FrameSize {
  /** inner width of the frame in CSS pixels */
  width: number;
  /** inner height of the frame in CSS pixels */
  height: number;
}

/**
 * Largest box of the given width-over-height ratio that fits inside
 * maxWidth x maxHeight. Used so the preview frame keeps its ratio exactly at any
 * panel width, which is what lets the overflow probe measure a truthful
 * viewport instead of a distorted one.
 */
export function frameSize(aspect: number, maxWidth: number, maxHeight: number): FrameSize {
  const safeWidth = Math.max(1, Math.floor(maxWidth));
  const safeHeight = Math.max(1, Math.floor(maxHeight));
  if (!Number.isFinite(aspect) || aspect <= 0) return { width: safeWidth, height: safeHeight };
  const byWidth = { width: safeWidth, height: Math.round(safeWidth / aspect) };
  const byHeight = { width: Math.round(safeHeight * aspect), height: safeHeight };
  return byWidth.height <= safeHeight ? byWidth : byHeight;
}

export interface DistortionCheck {
  status: "ok" | "warn";
  /** measured width-over-height of the rendered box */
  measured: number;
  /** absolute gap between the rendered ratio and the requested ratio */
  delta: number;
  message: string;
}

/**
 * Distortion check for a rendered box. Content is only distorted when the box
 * ratio drifts from the requested ratio, so the tolerance is tight (0.01).
 */
export function checkDistortion(options: {
  option: AspectRatioOption;
  orientation: Orientation;
  width: number;
  height: number;
}): DistortionCheck {
  const { option, orientation, width, height } = options;
  const expected = frameValue(option, orientation);
  if (width <= 0 || height <= 0) {
    return { status: "warn", measured: 0, delta: Number.POSITIVE_INFINITY, message: "Frame has no measurable size yet." };
  }
  const measured = width / height;
  const delta = Math.abs(measured - expected);
  const describe = `${option.id} ${ORIENTATION_LABEL[orientation].toLowerCase()}`;
  if (delta <= 0.01) {
    return {
      status: "ok",
      measured,
      delta,
      message: `Rendered ${measured.toFixed(3)}:1 against ${describe} at ${expected.toFixed(3)}:1. No distortion.`,
    };
  }
  return {
    status: "warn",
    measured,
    delta,
    message: `Rendered ${measured.toFixed(3)}:1 while ${describe} asks for ${expected.toFixed(3)}:1. Content inside would be stretched.`,
  };
}
