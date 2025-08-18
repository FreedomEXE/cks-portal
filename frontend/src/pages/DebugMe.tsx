import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildUrl, apiFetch } from '../lib/apiBase';
import { useUser } from '@clerk/clerk-react';
import { buildHubPath } from '../lib/hubRoutes';

export default function DebugMe() {
  const { user } = useUser();
  const [boot, setBoot] = useState<any>(null);
  const [appUsers, setAppUsers] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState('');
  const [linkResp, setLinkResp] = useState<any>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const headers: Record<string,string> = {};
        if (user?.id) headers['x-user-id'] = user.id;
        if (user?.primaryEmailAddress?.emailAddress) headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
        const b = await apiFetch(buildUrl('/me/bootstrap'), { headers });
        let bj = null;
        try { bj = await b.json(); } catch {}
        setBoot({ ok: b.ok, status: b.status, body: bj });
      } catch (e: any) {
        setErr((s) => s ? s + '\n' + String(e?.message || e) : String(e?.message || e));
      }
      try {
        const a = await apiFetch(buildUrl('/admin/app-users'));
        let aj = null;
        try { aj = await a.json(); } catch {}
        setAppUsers({ ok: a.ok, status: a.status, body: aj });
      } catch (e: any) {
        setErr((s) => s ? s + '\n' + String(e?.message || e) : String(e?.message || e));
      }
    })();
  }, [user]);

  const navigate = useNavigate();

  return (
    <div style={{padding:20}}>
      <h2>Debug: /me/bootstrap & app-users</h2>
      <div style={{marginTop:12}}>
        <strong>Clerk user:</strong>
        <pre style={{background:'#f3f4f6',padding:8}}>{JSON.stringify({ id: user?.id, username: user?.username, email: user?.primaryEmailAddress?.emailAddress }, null, 2)}</pre>
      </div>

      <div style={{marginTop:12}}>
        <strong>/me/bootstrap</strong>
        <pre style={{background:'#f8fafc',padding:8}}>{boot ? JSON.stringify(boot, null, 2) : 'loading...'}</pre>
      </div>

      <div style={{marginTop:12}}>
        <strong>/admin/app-users (first 20)</strong>
        <pre style={{background:'#fff7ed',padding:8}}>{appUsers ? JSON.stringify(appUsers, null, 2) : 'loading...'}</pre>
      </div>

      <div style={{marginTop:12}}>
        <strong>Local fallback keys</strong>
        <pre style={{background:'#eef2ff',padding:8}}>{JSON.stringify({ lastRole: (function(){try{return localStorage.getItem('me:lastRole')}catch{return null}})(), lastCode: (function(){try{return localStorage.getItem('me:lastCode')}catch{return null}})() }, null, 2)}</pre>
      </div>

      <div style={{marginTop:18, padding:12, border:'1px solid #e6e6e6', borderRadius:8, maxWidth:560}}>
        <h4>Link this Clerk user to an internal_code (POST /me/link)</h4>
        <div style={{marginTop:8}}>Use a valid internal_code (e.g. <code>000-A</code> for admin) or a center/crew/contractor code.</div>
        <div style={{display:'flex', gap:8, marginTop:10}}>
          <input value={linkCode} onChange={(e)=>setLinkCode(e.target.value)} placeholder="internal_code (e.g. 000-A or 001-A)" style={{flex:1,padding:8,borderRadius:6,border:'1px solid #cbd5e1'}} />
          <button disabled={linking || !linkCode} onClick={async ()=>{
            try {
              setLinking(true); setLinkResp(null); setErr(null);
              const headers: Record<string,string> = {'Content-Type':'application/json'};
              if (user?.id) headers['x-user-id'] = user.id;
              const r = await apiFetch(buildUrl('/me/link'), { method: 'POST', headers, body: JSON.stringify({ internal_code: String(linkCode).toUpperCase() }) });
              let j = null; try { j = await r.json(); } catch {}
              setLinkResp({ ok: r.ok, status: r.status, body: j });
              // If successful, refresh bootstrap and app-users display
              try {
                const b = await apiFetch(buildUrl('/me/bootstrap'), { headers }); let bj=null; try{bj=await b.json()}catch{}; setBoot({ ok: b.ok, status: b.status, body: bj });
                const a = await apiFetch(buildUrl('/admin/app-users')); let aj=null; try{aj=await a.json()}catch{}; setAppUsers({ ok: a.ok, status: a.status, body: aj });
                try { localStorage.removeItem('me:lastRole'); localStorage.removeItem('me:lastCode'); } catch {}
              } catch {}
            } catch (e:any) { setErr(String(e?.message||e)); }
            finally { setLinking(false); }
          }} style={{padding:'8px 12px', borderRadius:6, border:'none', background:'#0ea5e9', color:'#fff'}}>Link</button>
        </div>
        {linkResp && (
          <div style={{marginTop:10}}>
            <pre style={{background:'#f7fff7',padding:8}}>{JSON.stringify(linkResp, null, 2)}</pre>
            {linkResp.ok && linkResp.body && (
              <div style={{marginTop:8}}>
                <button onClick={()=>{
                  const body = linkResp.body || {};
                  const role = (body.role || '').toLowerCase();
                  const code = body.internal_code || '';
                  const uname = (user?.username) || (user?.primaryEmailAddress?.emailAddress||'').split('@')[0];
                  const path = buildHubPath(uname || code || role);
                  navigate(path, { replace: true });
                }} style={{padding:'8px 12px', borderRadius:6, border:'none', background:'#059669', color:'#fff'}}>Go to my hub</button>
              </div>
            )}
          </div>
        )}
      </div>

      {err && (
        <div style={{marginTop:12,color:'crimson'}}>
          <strong>Errors:</strong>
          <pre style={{background:'#fff1f2',padding:8}}>{String(err)}</pre>
        </div>
      )}
    </div>
  );
}
