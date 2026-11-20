import { useState, useEffect } from 'react';

/**
 * Custom debounce hook for search inputs and live filtering
 */
export function useDebounce(value, delayMs = 260) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
