import React, { createContext, useState, useEffect, useContext } from 'react';
import { THEMES } from '../utils/constants';
import { StorageService } from '../services/StorageService';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState('lovely');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    StorageService.getTheme().then((savedTheme) => {
      if (savedTheme && THEMES[savedTheme]) {
        setThemeId(savedTheme);
      }
      setIsReady(true);
    });
  }, []);

  const changeTheme = async (newThemeId) => {
    if (THEMES[newThemeId]) {
      setThemeId(newThemeId);
      await StorageService.setTheme(newThemeId);
    }
  };

  const currentTheme = THEMES[themeId];

  if (!isReady) return null; // Or a loader

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, changeTheme, themeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
