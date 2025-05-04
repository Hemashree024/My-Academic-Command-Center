"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with the initialValue.
  // This ensures server and initial client render match.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // useEffect runs only on the client, after hydration.
  // It reads the value from localStorage and updates the state.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // Optionally set the initial value in localStorage if it doesn't exist
        // window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Run only once on mount when the key changes (which it shouldn't typically)

  // Wrapped setter function that persists to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, storedValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
