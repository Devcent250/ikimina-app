import { useState, useEffect } from "react";

function useLocalStorageState(key, defaultValue, enabled: boolean = true) {
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    if (enabled) {
      if (storedValue !== null) {
        try {
          return JSON.parse(storedValue);
        } catch (error) {
          console.error("Error parsing JSON", error);
          return defaultValue;
        }
      } else {
        return defaultValue;
      }
    } else {
      return defaultValue;
    }
  });

  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null && enabled) {
      try {
        setState(JSON.parse(storedValue));
      } catch (error) {
        console.error("Error parsing JSON", error);
      }
    }
  }, [key]);

  // Update local storage when the state changes
  useEffect(() => {
    if (enabled) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
