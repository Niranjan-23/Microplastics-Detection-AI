import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';

function App() {
  // Sync with browser preferences by default
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('microplastics_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('microplastics_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  // Sync index.html root body class for custom index.css styles
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Create MUI Theme
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#10B981', // Emerald Accent
          light: '#34D399',
          dark: '#059669',
        },
        secondary: {
          main: '#94A3B8', // Slate Secondary
          light: '#CBD5E1',
          dark: '#64748B',
        },
        background: {
          default: darkMode ? '#080C10' : '#F4F6F8', // Dark slate / Light grey-slate
          paper: darkMode ? '#11161D' : '#FFFFFF', // Dark elevated / White cards
        },
        text: {
          primary: darkMode ? '#F8FAFC' : '#0B1015',
          secondary: darkMode ? '#94A3B8' : '#64748B',
        },
        divider: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        error: {
          main: '#EF4444',
        },
        warning: {
          main: '#F59E0B',
        },
        info: {
          main: '#22D3EE',
        },
        success: {
          main: '#22C55E',
        },
      },
      typography: {
        fontFamily: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, letterSpacing: '-0.01em' },
        h4: { fontWeight: 600, letterSpacing: '-0.01em' },
        h5: { fontWeight: 500, letterSpacing: '-0.01em' },
        h6: { fontWeight: 500 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        body1: { fontWeight: 400 },
        body2: { fontWeight: 400 },
        button: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
      shape: {
        borderRadius: 0, // Sharp edges
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: darkMode ? '#080C10' : '#F4F6F8',
              color: darkMode ? '#F8FAFC' : '#0B1015',
              transition: 'background-color 0.2s ease, color 0.2s ease',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderRadius: 0, // Remove rounded radius
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: 'none', // Flat minimal layout
              transition: 'background-color 0.2s ease',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 0, // Remove rounded radius
              fontWeight: 500,
              boxShadow: 'none',
              transition: 'all 0.20s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
      },
    });
  }, [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </ThemeProvider>
  );
}

export default App;
