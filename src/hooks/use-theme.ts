
'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark'; // Simplified to light/dark based on usage

// Simple hook implementation using localStorage and CSS class toggling
export function useTheme() {
  const [theme, _setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light'; // Default for SSR
    }
    // Initialize theme from localStorage or default to light
    const storedTheme = localStorage.getItem('theme');
    // Ensure stored theme is a valid Theme type
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return 'light'; // Default to light if nothing set or invalid value
  });

   // Effect to apply the theme class to the root element
   useEffect(() => {
     if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark'); // Remove previous theme classes
        root.classList.add(theme); // Add the current theme class
        localStorage.setItem('theme', theme); // Persist the theme choice
     }
  }, [theme]); // Rerun effect when theme changes

  // Function to update the theme state
  const setTheme = (newTheme: Theme) => {
    _setTheme(newTheme);
  };


  return { theme, setTheme };
}
