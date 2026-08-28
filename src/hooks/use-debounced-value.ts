import { useEffect, useState } from "react";

/**
 * Echoes `value`, but only after it has stopped changing for `delayMs`.
 *
 * Meant for a search box wired to a server request: without this, every
 * keystroke would fire its own fetch, most of them abandoned before the
 * response even lands.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
