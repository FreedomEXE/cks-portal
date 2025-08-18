import Page from "../components/Page";
import AdminTable from "../components/AdminTable";
import useMyCode from "../hooks/useMyCode";
import Skeleton from "../components/Skeleton";

export default function MyCentersPage() {
  const { loading, error, code } = useMyCode();
  if (loading) return <Page title="My Centers"><Skeleton lines={6} /></Page>;
  if (error) return <Page title="My Centers"><div style={{padding:12, color:'#b91c1c'}}>Error: {error}</div></Page>;
  if (!code) return <Page title="My Centers"><div style={{padding:12}}>No profile code available.</div></Page>;
  return (
    <Page title="My Centers">
      <div style={{margin: '8px 0 12px', color: '#6b7280'}}>Centers for: {code}</div>
      <AdminTable
        columns={[
          { key: 'center_id', label: 'Center ID' },
          { key: 'name', label: 'Name' },
          { key: 'address', label: 'Address' },
          { key: 'status', label: 'Status' },
          { key: 'assigned_since', label: 'Assigned Since' },
        ]}
        rows={[]}
        loading={false}
        getKey={(r: any, i: number) => r.center_id || r.id || i}
      />
    </Page>
  );
}
