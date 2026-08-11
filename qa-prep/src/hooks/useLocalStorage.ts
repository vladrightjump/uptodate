import { useCallback, useEffect, useState } from "react";

/** Persisted state. Falls back to `initial` when storage is unavailable or corrupt. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or private mode — state still works in memory */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** A persisted set of ids, with a toggle helper. */
export function useIdSet(key: string) {
  const [ids, setIds] = useLocalStorage<string[]>(key, []);
  const set = new Set(ids);

  const toggle = useCallback(
    (id: string) =>
      setIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      ),
    [setIds]
  );

  const clear = useCallback(() => setIds([]), [setIds]);

  return { set, toggle, clear, size: set.size };
}
