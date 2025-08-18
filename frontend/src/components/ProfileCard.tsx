
// src/components/ProfileCard.jsx
import ProfilePhoto from "./ProfilePhoto";

export default function ProfileCard({ kind, data }) {
  if (!data) return null;

  const Header = ({ title, subtitle, idKey }) => (
    <div className="ui-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ProfilePhoto id={`${kind}:${idKey}`} name={title} />
        <div style={{ minWidth: 0 }}>
          <div className="title" style={{ marginBottom: 2 }}>{title}</div>
          <div style={{ color: '#6b7280' }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );

  if (kind === "crew") {
  return <Header title={data.name} subtitle={`Crew • ${data.crew_id}`} idKey={data.crew_id} />;
  }

  if (kind === "contractor") {
  return <Header title={data.company_name} subtitle={`Contractor • ${data.contractor_id}`} idKey={data.contractor_id} />;
  }

  if (kind === "customer") {
  return <Header title={data.company_name} subtitle={`Customer • ${data.customer_id}`} idKey={data.customer_id} />;
  }

  if (kind === "center") {
  return <Header title={data.center_name || data.name} subtitle={`Center • ${data.center_id}`} idKey={data.center_id} />;
  }

  if (kind === "manager") {
  return <Header title={data.name} subtitle={`Manager • ${data.manager_id}`} idKey={data.manager_id} />;
  }

  if (kind === "admin") {
    // No admin-specific card content for the hub; the header already shows the welcome line.
    return null;
  }

  return null;
}
