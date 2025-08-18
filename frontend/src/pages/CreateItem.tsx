import { useParams } from "react-router-dom";
import Page from "../components/Page";

export default function CreateItem() {
  const { type } = useParams<{ type: string }>();
  const raw = (type || '').toLowerCase();
  const base = raw.startsWith('new') ? raw.slice(3) : raw;
  const nice = base.replace(/(^|[-_])(\w)/g, (_, __, c) => ` ${c.toUpperCase()}`).trim();
  return (
    <Page title={`Create ${nice || ''}`.trim()}>
      <p>Placeholder form for creating a new {nice || 'Item'}.</p>
      <p>We will add fields and validation next.</p>
    </Page>
  );
}
