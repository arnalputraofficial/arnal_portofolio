/**
 * Reading a pasted table.
 *
 * The entries panel asks for this. Numbers usually arrive as rows copied out of
 * a spreadsheet, and retyping them one dialog at a time is the slow part of
 * keeping a page current. The parsing itself is plain text handling with no
 * React or database in it, so it can be changed and checked on its own.
 */

/**
 * Split one line into cells.
 *
 * A tab, a pipe, or a comma all count as the separator. A comma inside quotes
 * belongs to the text rather than to the table, which is how a spreadsheet
 * writes a value that contains one.
 */
export function splitPastedLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    const isSeparator =
      !quoted && (character === "\t" || character === "|" || character === ",");

    if (isSeparator) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }

    cell += character;
  }

  cells.push(cell.trim());
  return cells;
}

/**
 * A number the way a spreadsheet writes one, or null when it is not a number.
 *
 * Both "1,450" and "1.450" are read as one thousand four hundred and fifty,
 * because a separator with exactly three digits behind it groups thousands in
 * either convention. Everything else takes its last separator as the decimal
 * point, so "1,45" and "1.45" are both one point four five. The rule is fixed
 * rather than guessed per line, so the same text always reads the same way.
 */
export function pastedNumber(cell: string): number | null {
  const negative = /^\s*-/.test(cell);
  const cleaned = cell.replace(/[^0-9.,]/g, "");
  if (cleaned.replace(/[.,]/g, "").length === 0) return null;

  const lastSeparator = Math.max(cleaned.lastIndexOf("."), cleaned.lastIndexOf(","));
  const digitsAfter = lastSeparator === -1 ? 0 : cleaned.length - lastSeparator - 1;

  let normalized: string;
  if (lastSeparator === -1) {
    normalized = cleaned;
  } else if (digitsAfter === 3) {
    normalized = cleaned.replace(/[.,]/g, "");
  } else {
    const whole = cleaned.slice(0, lastSeparator).replace(/[.,]/g, "");
    normalized = `${whole}.${cleaned.slice(lastSeparator + 1)}`;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** One line with its cells, and where it sat in the pasted text. */
export interface PastedLine {
  lineNumber: number;
  cells: string[];
}

/** Every line that carries something, blank lines and # comments left out. */
export function pastedLines(raw: string): PastedLine[] {
  return raw
    .split(/\r?\n/)
    .map((line, index) => ({ lineNumber: index + 1, line: line.trim() }))
    .filter(({ line }) => line.length > 0 && !line.startsWith("#"))
    .map(({ lineNumber, line }) => ({ lineNumber, cells: splitPastedLine(line) }));
}
