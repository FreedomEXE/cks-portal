import { useEffect, useMemo, useState } from 'react';
import { Button } from '@cks/ui';
import {
  fetchCatalogEcosystems,
  fetchCatalogVisibilityConfig,
  updateCatalogVisibilityConfig,
  type CatalogEcosystem,
  type CatalogVisibilityItem,
  type CatalogVisibilityMode,
  type CatalogVisibilityType,
} from '../../shared/api/admin';

interface CatalogVisibilitySectionProps {
  onNotify?: (message: string) => void;
}

export default function CatalogVisibilitySection({ onNotify }: CatalogVisibilitySectionProps) {
  const [ecosystems, setEcosystems] = useState<CatalogEcosystem[]>([]);
  const [ecosystemsLoading, setEcosystemsLoading] = useState(true);
  const [ecosystemsError, setEcosystemsError] = useState<string | null>(null);

  const [selectedEcosystemId, setSelectedEcosystemId] = useState<string>('');
  const [itemType, setItemType] = useState<CatalogVisibilityType>('product');
  const [mode, setMode] = useState<CatalogVisibilityMode>('all');
  const [items, setItems] = useState<CatalogVisibilityItem[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setEcosystemsLoading(true);
      setEcosystemsError(null);
      try {
        const result = await fetchCatalogEcosystems();
        if (cancelled) return;
        setEcosystems(result);
        if (!selectedEcosystemId && result.length > 0) {
          setSelectedEcosystemId(result[0].ecosystemId);
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load ecosystems';
        setEcosystemsError(message);
      } finally {
        if (!cancelled) {
          setEcosystemsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedEcosystemId) {
      setMode('all');
      setItems([]);
      setSelectedCodes(new Set());
      setConfigError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const config = await fetchCatalogVisibilityConfig(selectedEcosystemId, itemType);
        if (cancelled) return;
        setMode(config.mode);
        setItems(config.items);
        setSelectedCodes(new Set(config.selectedItemCodes.map((code) => code.toUpperCase())));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load visibility config';
        setConfigError(message);
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedEcosystemId, itemType]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleToggleCode = (code: string) => {
    if (mode === 'all') return;
    const normalized = code.toUpperCase();
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return next;
    });
  };

  const handleSelectFiltered = () => {
    if (mode === 'all') return;
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      for (const item of filteredItems) {
        next.add(item.code.toUpperCase());
      }
      return next;
    });
  };

  const handleClearFiltered = () => {
    if (mode === 'all') return;
    const filteredSet = new Set(filteredItems.map((item) => item.code.toUpperCase()));
    setSelectedCodes((prev) => {
      const next = new Set<string>();
      for (const code of prev) {
        if (!filteredSet.has(code)) {
          next.add(code);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedEcosystemId || saving) return;
    setSaving(true);
    setConfigError(null);
    try {
      await updateCatalogVisibilityConfig(selectedEcosystemId, {
        type: itemType,
        mode,
        itemCodes: mode === 'allowlist' ? Array.from(selectedCodes).sort() : [],
      });
      onNotify?.(
        `Saved ${itemType} visibility for ${selectedEcosystemId}: ${mode === 'all' ? 'all items visible' : `${selectedCodes.size} selected`}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save visibility config';
      setConfigError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 180px 180px auto', gap: 12, alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Ecosystem</span>
          <select
            value={selectedEcosystemId}
            onChange={(event) => setSelectedEcosystemId(event.target.value)}
            disabled={ecosystemsLoading || ecosystems.length === 0}
            style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, background: '#fff' }}
          >
            {ecosystems.length === 0 ? (
              <option value="">No ecosystems found</option>
            ) : (
              ecosystems.map((eco) => (
                <option key={eco.ecosystemId} value={eco.ecosystemId}>
                  {eco.ecosystemName ? `${eco.ecosystemName} (${eco.ecosystemId})` : eco.ecosystemId}
                </option>
              ))
            )}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Catalog Type</span>
          <select
            value={itemType}
            onChange={(event) => setItemType(event.target.value as CatalogVisibilityType)}
            style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, background: '#fff' }}
          >
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Mode</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as CatalogVisibilityMode)}
            style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, background: '#fff' }}
          >
            <option value="all">All items</option>
            <option value="allowlist">Custom allowlist</option>
          </select>
        </label>

        <Button variant="primary" size="small" onClick={handleSave} disabled={!selectedEcosystemId || saving || configLoading}>
          {saving ? 'Saving...' : 'Save Visibility'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${itemType}s by code/name/category...`}
          style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, background: '#fff' }}
        />
        <Button variant="secondary" size="small" onClick={handleSelectFiltered} disabled={mode === 'all' || filteredItems.length === 0}>
          Select filtered
        </Button>
        <Button variant="secondary" size="small" onClick={handleClearFiltered} disabled={mode === 'all' || filteredItems.length === 0}>
          Clear filtered
        </Button>
      </div>

      <div style={{ fontSize: 13, color: '#475569' }}>
        {mode === 'all'
          ? `All ${itemType}s are currently visible to this ecosystem.`
          : `${selectedCodes.size} of ${items.length} ${itemType}s selected.`}
      </div>

      {ecosystemsError && <div style={{ color: '#dc2626', fontSize: 13 }}>{ecosystemsError}</div>}
      {configError && <div style={{ color: '#dc2626', fontSize: 13 }}>{configError}</div>}

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', maxHeight: 420, overflowY: 'auto' }}>
        {configLoading ? (
          <div style={{ padding: 16, color: '#2563eb', fontSize: 13 }}>Loading catalog visibility...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>No catalog items found for this filter.</div>
        ) : (
          filteredItems.map((item) => {
            const checked = selectedCodes.has(item.code.toUpperCase());
            return (
              <label
                key={item.code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '22px 130px 1fr 160px',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: mode === 'all' ? 'default' : 'pointer',
                  opacity: mode === 'all' ? 0.7 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={mode === 'all'}
                  onChange={() => handleToggleCode(item.code)}
                />
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>{item.code}</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{item.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{item.category || 'uncategorized'}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
