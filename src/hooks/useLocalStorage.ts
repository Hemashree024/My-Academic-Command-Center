"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Prevent build error "window is not defined" during server side rendering
     if (typeof window === 'undefined') {
       return initialValue;
     }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading localStorage key “" + key + "”:", error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    // Prevent build error "window is not defined" during server side rendering
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = storedValue;
      // Save state
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, storedValue]);

   // Return a wrapped version of useState's setter function that ...
   // ... persists the new value to localStorage.
   const setValue = useCallback((value: T | ((val: T) => T)) => {
     try {
       // Allow value to be a function so we have the same API as useState
       const valueToStore =
         value instanceof Function ? value(storedValue) : value;
       // Save state
       setStoredValue(valueToStore);
     } catch (error) {
       console.log(error);
     }
   }, [storedValue, setStoredValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
