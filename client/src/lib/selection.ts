// Tiny cross-page store for the user's currently selected robots, so a
// selection made on the Compare tab carries over to the Evaluation Matrix
// (and survives a page reload). Persisted in localStorage.

const KEY = "robotSelection";

export function loadSelection(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function saveSelection(ids: number[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore storage errors (private mode, quota, etc.) */
  }
}
