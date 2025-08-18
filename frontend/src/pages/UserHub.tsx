import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { buildUrl, apiFetch } from '../lib/apiBase';
import { buildHubPath } from '../lib/hubRoutes';
import { useUser } from '@clerk/clerk-react';

export default function UserHub() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      try {
        // If slug matches signed-in user's username, call bootstrap with x-user-id header
        if (user?.username && slug === user.username) {
          const headers: Record<string,string> = {};
          if (user.id) headers['x-user-id'] = user.id;
          const res = await apiFetch(buildUrl('/me/bootstrap'), { headers });
          if (res.ok) {
            const js = await res.json();
            const role = (js?.role || js?.kind || '').toLowerCase();
            const code = js?.internal_code || js?.code || '';
            // Prefer navigating to the authoritative internal_code (hub id) or username.
            const hubId = (code || user?.username || '').toLowerCase();
            if (hubId) {
              try { sessionStorage.setItem('code', hubId); } catch (e) {}
              if (role) try { sessionStorage.setItem('role', role); } catch (e) {}
              const base = `/${slug}/hub`;
              const rest = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : '';
              const target = `/${hubId}/hub${rest}`;
              navigate(target, { replace: true });
              return;
            }
            if (role) {
              try { sessionStorage.setItem('role', role); } catch (e) {}
              const base = `/${slug}/hub`;
              const rest = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : '';
              const target = `/${role}/hub${rest}`;
              navigate(target, { replace: true });
              return;
            }
          }
        }

        // Fallback: try admin app-users list to find mapping by internal_code or username
        const r = await apiFetch(buildUrl('/admin/app-users'));
        if (r.ok) {
          const js = await r.json();
          const item = (js.items || []).find((it: any) => {
            if (!it) return false;
            if (it.internal_code && it.internal_code.toLowerCase() === (slug || '').toLowerCase()) return true;
            if (it.email && it.email.split && it.email.split('@')[0].toLowerCase() === (slug || '').toLowerCase()) return true;
            return false;
          });
          if (item) {
            const hubId = (item.internal_code || '').toLowerCase();
            try { if (hubId) sessionStorage.setItem('code', hubId); } catch (e) {}
            try { if (item.role) sessionStorage.setItem('role', item.role); } catch (e) {}
            const base = `/${slug}/hub`;
            const rest = window.location.pathname.startsWith(base) ? window.location.pathname.slice(base.length) : '';
            if (hubId) {
              const target = `/${hubId}/hub${rest}`;
              navigate(target, { replace: true });
              return;
            }
            const roleTarget = `/${item.role}/hub${rest}`;
            navigate(roleTarget, { replace: true });
            return;
          }
        }

        // If nothing found, route to generic hub router for fallback
        navigate('/hub', { replace: true });
      } catch (e) {
        navigate('/hub', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, user, navigate]);

  return loading ? <div style={{padding:24}}>Resolving user hub…</div> : null;
}
