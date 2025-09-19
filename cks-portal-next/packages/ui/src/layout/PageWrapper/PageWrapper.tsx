import React from 'react';
import PageHeader from '../PageHeader';
import styles from './PageWrapper.module.css';

interface PageWrapperProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
  showHeader?: boolean;
  toolbar?: React.ReactNode; // sticky toolbar/filters area under nav
  headerSrOnly?: boolean; // render header as screen-reader only
}

/**
 * PageWrapper provides consistent page structure and prevents layout wobble
 * - Consistent padding and min-height
 * - Optional PageHeader integration
 * - Smooth transitions between different content
 */
const PageWrapper: React.FC<PageWrapperProps> = ({
  title,
  subtitle,
  children,
  className = '',
  variant = 'default',
  showHeader = true,
  toolbar,
  headerSrOnly = false
}) => {
  return (
    <div className={`${styles.pageWrapper} ${styles[variant]} ${className}`}>
      {toolbar && (
        <div className={styles.toolbar}>
          {toolbar}
        </div>
      )}
      {showHeader && (
        <PageHeader title={title} subtitle={subtitle} srOnly={headerSrOnly} />
      )}
      <div className={styles.contentContainer}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;