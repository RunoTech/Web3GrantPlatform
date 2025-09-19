import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme] = useState<Theme>('light'); // Always light mode

  useEffect(() => {
    // Force light theme on document and clear any dark mode settings
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('light');
    localStorage.removeItem('theme'); // Remove any saved theme preference
  }, []);

  // Disabled toggle function - does nothing
  const toggleTheme = () => {
    // Dark mode disabled - no theme switching allowed
    console.log('Theme switching is disabled. Site is locked to light mode.');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};