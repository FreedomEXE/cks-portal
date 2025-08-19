import React, { useEffect, useState } from 'react';
import Page from '../../../components/Page';
import ManagerProfilePage from './ManagerProfilePage';

export default function ManagerProfileParitySmoke() {
  const [baseline, setBaseline] = useState<any>(null);
  const [last, setLast] = useState<any>(null);
  const [cols, setCols] = useState<any>(null);

  useEffect(() => {
    const id = setInterval(() => {
      // Read the global values the instrumentation writes
      // (these may be set by ManagerProfile and ProfileTabs)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setBaseline(window.__mgrProfileBaseline || null);
      // @ts-ignore
      setLast(window.__mgrProfileLast || null);
      // @ts-ignore
      setCols(window.__mgrProfileLastColumns || null);
    }, 300);
    return () => clearInterval(id);
  }, []);

  const parity = baseline && last && baseline.hash === last.hash && JSON.stringify(baseline.signature) === JSON.stringify(last.signature);

  return (
    <Page title="Manager Profile Parity Smoke">
      <div style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <h3>Baseline</h3>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(baseline, null, 2)}</pre>
        </div>
        <div style={{flex:1}}>
          <h3>Last</h3>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(last, null, 2)}</pre>
        </div>
        <div style={{flex:1}}>
          <h3>Columns</h3>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(cols, null, 2)}</pre>
        </div>
      </div>
      <div style={{marginTop:16}}>
        <strong>Parity:</strong> {parity ? 'MATCH' : 'MISMATCH or waiting...'}
      </div>
      <div style={{marginTop:24}}>
        <h3>Rendered Manager Profile (below)</h3>
        <ManagerProfilePage />
      </div>
    </Page>
  );
}
