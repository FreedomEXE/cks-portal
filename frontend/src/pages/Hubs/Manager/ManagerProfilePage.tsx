/**
 * TRACE
 * Purpose: Dedicated manager profile page (initial extract).
 * SourceOfTabs: managerTabs.config (imported via ManagerProfile)
 * DataSource: useMeProfile (temporary until useManagerProfileData)
 * VisualParity: Should match MyProfile manager branch output exactly.
 * Next: Replace useMeProfile with useManagerProfileData after parity test or hook creation.
 */

import React from "react";
import useManagerProfileData from "../../../hooks/useManagerProfileData";
import ManagerProfile from "./ManagerProfile";
import Skeleton from "../../../components/Skeleton";
import Page from "../../../components/Page";

export default function ManagerProfilePage() {
  const { loading, error, kind, data } = useManagerProfileData() as any;

  if (loading) return (
    <Page title="Manager Profile"><div style={{padding:16}}><Skeleton lines={6} /></div></Page>
  );

  if (error) return (
    <Page title="Manager Profile"><div style={{padding:16,color:'#b91c1c'}}>Error: {String(error)}</div></Page>
  );

  if (kind !== "manager") return (
    <Page title="Manager Profile"><div className="ui-card" style={{padding:16}}>No manager profile available.</div></Page>
  );

  return (
    <Page title="Manager Profile">
      <ManagerProfile data={data} />
    </Page>
  );
}
