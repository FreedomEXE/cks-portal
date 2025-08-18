/**
 * File: CreatePage.tsx
 *
 * Description:
 *   Admin Create hub page listing available creation tasks.
 *
 * Functionality:
 *   Displays a grid of links to specific create subpages under the username-scoped hub.
 *
 * Importance:
 *   Launch point for Admin creation workflows.
 *
 * Connections:
 *   Uses Page shell and react-router Link; targets Create* subpages.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import Page from '../../../../components/Page';
import { Link, useParams } from 'react-router-dom';

// Admin-only create options
const creations: Array<{ slug: string; label: string }> = [
  { slug: 'newcrew', label: 'New Crew' },
  { slug: 'newmanager', label: 'New Manager' },
  { slug: 'newcontractor', label: 'New Contractor' },
  { slug: 'newcustomer', label: 'New Customer' },
  { slug: 'newcenter', label: 'New Center' },
  { slug: 'newservice', label: 'New Service' },
  { slug: 'newjob', label: 'New Job' },
  { slug: 'newsupply', label: 'New Supply' },
  { slug: 'newprocedure', label: 'New Procedure' },
  { slug: 'newtraining', label: 'New Training' },
  { slug: 'newwarehouse', label: 'New Warehouse' },
];

export default function CreatePage() {
  const { username } = useParams();
  const base = username ? `/${username}/hub/create` : '/create';
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
