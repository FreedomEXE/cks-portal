import Page from "../components/Page";
import { Link } from "react-router-dom";

const demo = [
  { id: 1, title: "Service pricing model updated — review minimums", date: "2025-08-10" },
  { id: 2, title: "Training schedules posted for Q3", date: "2025-08-05" },
  { id: 3, title: "New supply SKUs added to warehouses", date: "2025-08-01" },
];

export default function NewsPage() {
  return (
    <Page title="News & Updates">
      <div style={{display:'grid', gap:12}}>
        {demo.map(n => (
          <Link key={n.id} to={`/news/${n.id}`} className="ui-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div className="title" style={{fontSize:18}}>{n.title}</div>
              <div style={{color:'#6b7280', fontSize:13}}>{n.date}</div>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
