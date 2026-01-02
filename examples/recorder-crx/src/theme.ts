/**
 * Enterprise-Grade Theme System
 * Provides comprehensive theming support with light/dark modes
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  colors: {
    // Primary brand colors
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryLight: string;
    primaryDark: string;

    // Secondary colors
    secondary: string;
    secondaryHover: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Neutral colors
    background: string;
    backgroundElevated: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderLight: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverted: string;
    
    // Special
    overlay: string;
    shadow: string;
  };
  
  typography: {
    fontFamily: string;
    fontFamilyMono: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',
    primaryLight: '#dbeafe',
    primaryDark: '#1e3a8a',
    
    secondary: '#64748b',
    secondaryHover: '#475569',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    background: '#ffffff',
    backgroundElevated: '#f8fafc',
    surface: '#f1f5f9',
    surfaceHover: '#e2e8f0',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    text: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#94a3b8',
    textInverted: '#ffffff',
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    primaryLight: '#1e3a8a',
    primaryDark: '#dbeafe',
    
    secondary: '#94a3b8',
    secondaryHover: '#cbd5e1',
    
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    background: '#0f172a',
    backgroundElevated: '#1e293b',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    borderLight: '#475569',
    
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    textInverted: '#0f172a',
    
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = darkTheme;
  private listeners: Set<(theme: Theme) => void> = new Set();
  
  private constructor() {
    this.loadTheme();
  }
  
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }
  
  private loadTheme() {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode) {
      this.setThemeMode(savedMode);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setThemeMode(prefersDark ? 'dark' : 'light');
    }
  }
  
  setThemeMode(mode: ThemeMode) {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? darkTheme : lightTheme;
    } else {
      this.currentTheme = mode === 'dark' ? darkTheme : lightTheme;
    }
    
    localStorage.setItem('theme-mode', mode);
    this.applyTheme();
    this.notifyListeners();
  }
  
  private applyTheme() {
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(this.currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${this.kebabCase(key)}`, value);
    });
    
    Object.entries(this.currentTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    Object.entries(this.currentTheme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    Object.entries(this.currentTheme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    root.style.setProperty('--font-family', this.currentTheme.typography.fontFamily);
    root.style.setProperty('--font-family-mono', this.currentTheme.typography.fontFamilyMono);
  }
  
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  getTheme(): Theme {
    return this.currentTheme;
  }
  
  subscribe(callback: (theme: Theme) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentTheme));
  }
  
  toggleTheme() {
    const newMode = this.currentTheme.mode === 'dark' ? 'light' : 'dark';
    this.setThemeMode(newMode);
  }
}

export default ThemeManager.getInstance();
