/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: Dashboard.tsx
 * 
 * Description: KPI/overview view for Manager.
 * Function: Present KPI widgets and overview metrics.
 * Importance: Provides at-a-glance operational insights.
 * Connects to: api/manager.ts (GET /dashboard/kpis), caps dashboard:view.
 */

import React, { useState, useEffect } from 'react';
import { fetchDashboardKPIs } from '../api/manager';
import type { ManagerKPI } from '../types/manager';

export default function Dashboard() {
  const [kpis, setKpis] = useState<ManagerKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardKPIs()
      .then(setKpis)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!kpis) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h2>Manager Dashboard</h2>
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>My Contractors</h3>
          <p className="kpi-value">{kpis.contractors}</p>
        </div>
        <div className="kpi-card">
          <h3>My Customers</h3>
          <p className="kpi-value">{kpis.customers}</p>
        </div>
        <div className="kpi-card">
          <h3>My Centers</h3>
          <p className="kpi-value">{kpis.centers}</p>
        </div>
        <div className="kpi-card">
          <h3>My Crew</h3>
          <p className="kpi-value">{kpis.crew}</p>
        </div>
      </div>
    </div>
  );
}
