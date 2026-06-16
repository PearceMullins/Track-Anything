const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
];

/** Placeholder hint for the label field on row `index` (0-based). */
export function labelPlaceholder(index: number): string {
  const word = ORDINALS[index] ?? `${index + 1}th`;
  return `${word} set`;
}
