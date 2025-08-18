import Page from "../components/Page";
import { Link, useParams } from "react-router-dom";

// Admin-only create options (role-scoped). Slugs follow "new<entity>" pattern for URLs.
const creations: Array<{ slug: string; label: string }> = [
  { slug: "newcrew", label: "New Crew" },
  { slug: "newmanager", label: "New Manager" },
  { slug: "newcontractor", label: "New Contractor" },
  { slug: "newcustomer", label: "New Customer" },
  { slug: "newcenter", label: "New Center" },
  { slug: "newservice", label: "New Service" },
  { slug: "newjob", label: "New Job" },
  { slug: "newsupply", label: "New Supply" },
  { slug: "newprocedure", label: "New Procedure" },
  { slug: "newtraining", label: "New Training" },
  { slug: "newwarehouse", label: "New Warehouse" },
];

export default function CreatePage() {
  const { role } = useParams();
  const base = role ? `/${role}/hub/create` : '/create';
  return (
    <Page title="Create">
      <p style={{marginBottom:16}}>Choose what you want to create:</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:12 }}>
        {creations.map(c => (
          <Link key={c.slug} to={`${base}/${c.slug}`} className="hub-card ui-card">
            <div className="title">{c.label}</div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
