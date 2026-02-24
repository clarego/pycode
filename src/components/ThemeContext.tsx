import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextValue {
  darkMode: boolean;
  hackerMode: boolean;
  toggleDarkMode: () => void;
  toggleHackerMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: true,
  hackerMode: false,
  toggleDarkMode: () => {},
  toggleHackerMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme-dark');
    return stored === null ? true : stored === 'true';
  });
  const [hackerMode, setHackerMode] = useState(() => {
    return localStorage.getItem('theme-hacker') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('hacker', hackerMode);
    localStorage.setItem('theme-dark', String(darkMode));
    localStorage.setItem('theme-hacker', String(hackerMode));
  }, [darkMode, hackerMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
    if (hackerMode) setHackerMode(false);
  }, [hackerMode]);

  const toggleHackerMode = useCallback(() => {
    setHackerMode((prev) => {
      const next = !prev;
      if (next) setDarkMode(true);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, hackerMode, toggleDarkMode, toggleHackerMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
