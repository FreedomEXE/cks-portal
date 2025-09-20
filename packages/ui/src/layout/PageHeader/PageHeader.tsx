import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  className?: string;
  srOnly?: boolean; // render visually hidden H1 for accessibility only
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = '',
  srOnly = false
}) => {
  return (
    <div className={`${styles.headerContainer} ${className}`}>
      <h1 className={`${styles.title} ${srOnly ? styles.srOnly : ''}`}>
        {title}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </h1>
    </div>
  );
};

export default PageHeader;