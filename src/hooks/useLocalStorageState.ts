
import { useState, useEffect, useCallback } from 'react';

function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) { // Key not found
        return defaultValue;
      }
      // Attempt to parse, will fall back to defaultValue on error via outer catch
      return JSON.parse(storedValue);
    } catch (error) {
      console.error(`Error reading/parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Effect to update localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // If state is undefined, store "null" to avoid storing the string "undefined"
        // JSON.stringify(undefined) is undefined, localStorage.setItem(key, undefined) stores "undefined"
        if (state === undefined) {
          window.localStorage.setItem(key, JSON.stringify(null));
        } else {
          window.localStorage.setItem(key, JSON.stringify(state));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        if (event.newValue) {
          try {
            setState(JSON.parse(event.newValue));
          } catch (error) {
            console.error(`Error parsing stored value on storage event for key "${key}":`, error);
            // Optionally revert to defaultValue or handle error appropriately
            // setState(defaultValue); 
          }
        } else {
          // Value was removed or set to null in another tab
          setState(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue]); // Include defaultValue in dependencies for correctness if it could change

  return [state, setState];
}

export default useLocalStorageState;
