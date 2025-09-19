import React, { useState } from 'react';
import styles from './TabSection.module.css';
import NavigationTab from '../../navigation/NavigationTab';
import TabContainer from '../../navigation/TabContainer';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabSectionProps {
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  description?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
  primaryColor?: string;
  className?: string;
  /** Controls internal content padding. default: padded; flush: no padding for full-bleed content */
  contentPadding?: 'default' | 'flush';
}

/**
 * TabSection provides a modern rounded container for tabbed content
 * with integrated search and consistent styling
 */
const TabSection: React.FC<TabSectionProps> = ({
  tabs,
  activeTab,
  onTabChange,
  description,
  searchPlaceholder,
  onSearch,
  actionButton,
  children,
  primaryColor = '#3b82f6',
  className = '',
  contentPadding = 'default'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Tabs - Using existing NavigationTab component */}
      {tabs && tabs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <TabContainer variant="pills" spacing="compact">
            {tabs.map((tab) => (
              <NavigationTab
                key={tab.id}
                label={tab.label}
                count={tab.count}
                isActive={activeTab === tab.id}
                onClick={() => onTabChange?.(tab.id)}
                activeColor={primaryColor}
              />
            ))}
          </TabContainer>
        </div>
      )}

      {/* Description - Outside the rounded container */}
      {description && (
        <div className={styles.description}>{description}</div>
      )}

      {/* Card wrapper matching ui-card style */}
      <div
        className="ui-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: 0,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}
      >
        {/* Search bar section */}
        {(searchPlaceholder || actionButton) && (
          <div className={styles.searchSection}>
            {searchPlaceholder && (
              <div className={styles.searchContainer}>
                <svg
                  className={styles.searchIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearch}
                  className={styles.searchInput}
                />
              </div>
            )}
            {actionButton && (
              <div className={styles.actionButton}>
                {actionButton}
              </div>
            )}
          </div>
        )}

        {/* Divider line */}
        {searchPlaceholder && (
          <div className={styles.divider} />
        )}

        {/* Main content area */}
        <div className={`${styles.content} ${contentPadding === 'flush' ? styles.contentFlush : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default TabSection;