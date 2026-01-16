import { useState } from 'react';
import { useAuth } from '@cks/auth';
import { useAccessCodeRedemption } from '../hooks/useAccessCodeRedemption';
import styles from './AccessGate.module.css';

export function AccessGate() {
  const { accessStatus, accessTier, accessSource } = useAuth();
  const { redeem, isRedeeming, error } = useAccessCodeRedemption();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || accessStatus === 'active') {
    return null;
  }

  return (
    <section className={styles.gate}>
      <div className={styles.content}>
        <div className={styles.headline}>
          <div>
            <p className={styles.title}>Activate your account</p>
            <p className={styles.subtitle}>
              Use a product code to unlock ordering and reporting. You can still browse the catalog.
            </p>
          </div>
          <button className={styles.ghostButton} onClick={() => setDismissed(true)}>
            Not now
          </button>
        </div>

        <div className={styles.row}>
          <input
            className={styles.input}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setMessage(null);
            }}
            placeholder="CKS-XXXX-XXXX-XXXX"
          />
          <button
            className={styles.button}
            disabled={!code.trim() || isRedeeming}
            onClick={async () => {
              if (!code.trim()) {
                return;
              }
              try {
                await redeem(code.trim());
                setCode('');
                setMessage('Access code applied. You can now place orders and submit reports.');
              } catch {
                setMessage(null);
              }
            }}
          >
            {isRedeeming ? 'Applying...' : 'Apply code'}
          </button>
        </div>

        <div className={styles.row}>
          <span className={styles.subtitle}>
            Status: <strong>{accessStatus === 'active' ? 'Active' : 'Locked'}</strong>
            {accessTier ? ` · ${accessTier}` : ''}
            {accessSource ? ` (${accessSource})` : ''}
          </span>
          {message ? <span className={styles.message}>{message}</span> : null}
          {error ? <span className={styles.error}>{error}</span> : null}
        </div>
      </div>
    </section>
  );
}
