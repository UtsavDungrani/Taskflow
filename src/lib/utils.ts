import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ordering helper for drag-and-drop.
 *
 * Positions are floats, so dropping a card between two neighbours only writes
 * the moved row instead of renumbering the whole column. `before` and `after`
 * are the positions of the cards that will sit on either side of the drop,
 * or null at the ends of the list.
 */
export const POSITION_STEP = 1000;

export function positionBetween(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) return POSITION_STEP;
  if (before === null) return after! - POSITION_STEP;
  if (after === null) return before + POSITION_STEP;
  return (before + after) / 2;
}

/** Renders a task's human reference, e.g. "TF-14". */
export function taskRef(projectKey: string, number: number) {
  return `${projectKey}-${number}`;
}
