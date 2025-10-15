/**
 * useTabsFromUrl - Tab State Sync with URL Parameters
 *
 * Syncs tab state with URL search params for deep linking and back/forward support.
 *
 * URL Format:
 * - ?tab=dashboard
 * - ?tab=directory&dirTab=orders&subTab=product-orders
 *
 * Usage:
 * ```tsx
 * const { activeTab, setActiveTab, ... } = useTabsFromUrl({
 *   defaultTab: 'dashboard',
 *   defaultDirTab: 'admins',
 *   ...
 * });
 * ```
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';

export interface TabsFromUrlConfig {
  defaultTab?: string;
  defaultDirTab?: string;
  defaultOrdersSubTab?: string;
  defaultServicesSubTab?: string;
  defaultReportsSubTab?: string;
}

export interface TabsFromUrlState {
  // Current tab states
  activeTab: string;
  directoryTab: string;
  ordersSubTab: string;
  servicesSubTab: string;
  reportsSubTab: string;

  // Setters that update both state and URL
  setActiveTab: (tab: string) => void;
  setDirectoryTab: (tab: string) => void;
  setOrdersSubTab: (subTab: string) => void;
  setServicesSubTab: (subTab: string) => void;
  setReportsSubTab: (subTab: string) => void;
}

/**
 * Hook to sync tab state with URL parameters
 */
export function useTabsFromUrl(config: TabsFromUrlConfig = {}): TabsFromUrlState {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    defaultTab = 'dashboard',
    defaultDirTab = 'admins',
    defaultOrdersSubTab = 'product-orders',
    defaultServicesSubTab = 'catalog-services',
    defaultReportsSubTab = 'reports',
  } = config;

  // Initialize state from URL or defaults
  const [activeTab, setActiveTabState] = useState(
    searchParams.get('tab') || defaultTab
  );
  const [directoryTab, setDirectoryTabState] = useState(
    searchParams.get('dirTab') || defaultDirTab
  );
  const [ordersSubTab, setOrdersSubTabState] = useState(
    searchParams.get('subTab') || defaultOrdersSubTab
  );
  const [servicesSubTab, setServicesSubTabState] = useState(
    searchParams.get('subTab') || defaultServicesSubTab
  );
  const [reportsSubTab, setReportsSubTabState] = useState(
    searchParams.get('subTab') || defaultReportsSubTab
  );

  // Sync state from URL when params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    const dirTab = searchParams.get('dirTab');
    const subTab = searchParams.get('subTab');

    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
    if (dirTab && dirTab !== directoryTab) {
      setDirectoryTabState(dirTab);
    }
    if (subTab) {
      // Update the appropriate sub-tab based on dirTab
      if (dirTab === 'orders' && subTab !== ordersSubTab) {
        setOrdersSubTabState(subTab);
      } else if (dirTab === 'services' && subTab !== servicesSubTab) {
        setServicesSubTabState(subTab);
      } else if (dirTab === 'reports' && subTab !== reportsSubTab) {
        setReportsSubTabState(subTab);
      }
    }
  }, [searchParams]);

  // Setter that updates both state and URL
  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', tab);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setDirectoryTab = useCallback(
    (tab: string) => {
      setDirectoryTabState(tab);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('dirTab', tab);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setOrdersSubTab = useCallback(
    (subTab: string) => {
      setOrdersSubTabState(subTab);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', subTab);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setServicesSubTab = useCallback(
    (subTab: string) => {
      setServicesSubTabState(subTab);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', subTab);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setReportsSubTab = useCallback(
    (subTab: string) => {
      setReportsSubTabState(subTab);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', subTab);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return {
    activeTab,
    directoryTab,
    ordersSubTab,
    servicesSubTab,
    reportsSubTab,
    setActiveTab,
    setDirectoryTab,
    setOrdersSubTab,
    setServicesSubTab,
    setReportsSubTab,
  };
}
