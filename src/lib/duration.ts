/**
 * Durations are stored as whole minutes. These helpers are the only place
 * that knows how a human writes one.
 */

/**
 * Parses the shapes people actually type into minutes:
 *
 *   "2h"        -> 120      "1h30m"  -> 90       "1h 30m" -> 90
 *   "45m"       -> 45       "1:30"   -> 90       "0:45"   -> 45
 *   "2"         -> 120      "1.5"    -> 90       "1,5"    -> 90
 *
 * A bare number means hours, because "estimate: 2" reads as two hours to
 * everyone. Anything unparseable returns null rather than a wrong number —
 * silently logging 0 minutes would be worse than refusing.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase().replace(",", ".");
  if (!text) return null;

  // "1:30" — hours:minutes
  const clock = text.match(/^(\d+):([0-5]?\d)$/);
  if (clock) {
    return Number(clock[1]) * 60 + Number(clock[2]);
  }

  // "1h 30m", "1h", "30m" — either part optional, but at least one required.
  const units = text.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?$/);
  if (units && (units[1] || units[2])) {
    const hours = units[1] ? Number(units[1]) : 0;
    const minutes = units[2] ? Number(units[2]) : 0;
    const total = Math.round(hours * 60 + minutes);
    return total > 0 ? total : null;
  }

  // A bare number is hours.
  const bare = text.match(/^\d+(?:\.\d+)?$/);
  if (bare) {
    const total = Math.round(Number(text) * 60);
    return total > 0 ? total : null;
  }

  return null;
}

/** 90 -> "1h 30m", 45 -> "45m", 120 -> "2h", 0 -> "0m". */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Compact form for cards, where horizontal space is scarce: "1.5h". */
export function formatDurationShort(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0h";
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = minutes / 60;
  // One decimal only when it says something: 1.5h, but 2h not 2.0h.
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}
