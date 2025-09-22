/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: TabContainer.tsx
 *
 * Description:
 * Container component for navigation tabs
 *
 * Responsibilities:
 * - Provide flex container for tab layout
 * - Handle different visual styles
 * - Ensure consistent spacing between tabs
 * - Support various tab arrangements
 *
 * Role in system:
 * - Container for NavigationTab components
 *
 * Notes:
 * Works with NavigationTab for complete navigation system
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';

export interface TabContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  spacing?: 'compact' | 'normal' | 'spacious';
  fullWidth?: boolean;
  backgroundColor?: string;
  borderBottom?: boolean;
  activeColor?: string;
}

export function TabContainer({
  children,
  variant = 'default',
  alignment = 'start',
  spacing = 'normal',
  fullWidth = false,
  backgroundColor = 'transparent',
  borderBottom = false,
  activeColor
}: TabContainerProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'compact':
        return '4px';
      case 'spacious':
        return '16px';
      default:
        return '8px';
    }
  };

  const getAlignment = () => {
    switch (alignment) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'stretch':
        return 'stretch';
      default:
        return 'flex-start';
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: alignment === 'stretch' ? 'stretch' : 'center',
    justifyContent: getAlignment(),
    gap: getSpacing(),
    width: fullWidth ? '100%' : 'auto',
    backgroundColor: backgroundColor,
    borderBottom: borderBottom ? '1px solid #e5e7eb' : 'none',
    flexWrap: 'wrap'
  };

  // Apply variant-specific container styles
  if (variant === 'pills') {
    containerStyles.padding = '4px';
    containerStyles.backgroundColor = backgroundColor === 'transparent' ? '#f9fafb' : backgroundColor;
    containerStyles.borderRadius = '8px';
  } else if (variant === 'underline') {
    containerStyles.borderBottom = '1px solid #e5e7eb';
    containerStyles.paddingBottom = '0';
  } else {
    // default variant
    containerStyles.padding = spacing === 'compact' ? '2px' : '4px';
  }

  // Clone children and pass variant and activeColor props to NavigationTab components
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type &&
        (child.type as any).name === 'NavigationTab') {
      return React.cloneElement(child, { variant, activeColor } as any);
    }
    return child;
  });

  return (
    <div style={containerStyles} role="tablist">
      {enhancedChildren}
    </div>
  );
}

export default TabContainer;