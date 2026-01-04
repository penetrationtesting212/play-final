/**
 * Enterprise-Grade Tabs Component
 * Provides accessible tabbed navigation
 */

import * as React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };
  
  const variantStyles = {
    underline: {
      container: 'border-b border-[var(--color-border)]',
      tab: 'border-b-2 border-transparent',
      active: 'border-[var(--color-primary)] text-[var(--color-primary)]',
      inactive: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border-light)]',
    },
    pills: {
      container: '',
      tab: 'rounded-md',
      active: 'bg-[var(--color-primary)] text-white',
      inactive: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
    },
    enclosed: {
      container: 'border-b border-[var(--color-border)]',
      tab: 'border rounded-t-md border-b-0',
      active: 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)]',
      inactive: 'bg-[var(--color-surface)] border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)]',
    },
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div className={`flex gap-1 ${styles.container}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={`
            ${sizeStyles[size]}
            ${styles.tab}
            ${tab.id === activeTab ? styles.active : styles.inactive}
            inline-flex items-center gap-2
            font-medium transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          `}
          role="tab"
          aria-selected={tab.id === activeTab}
          aria-disabled={tab.disabled}
        >
          {tab.icon}
          {tab.label}
          {tab.badge && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-error)] text-white">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export interface TabPanelProps {
  children: React.ReactNode;
  activeTab: string;
  tabId: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, activeTab, tabId }) => {
  if (activeTab !== tabId) return null;
  
  return (
    <div role="tabpanel" aria-labelledby={tabId} className="py-4">
      {children}
    </div>
  );
};
