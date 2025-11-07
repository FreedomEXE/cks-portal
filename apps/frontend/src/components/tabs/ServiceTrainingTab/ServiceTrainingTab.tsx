import React, { useState } from 'react';
import { useSWRConfig } from 'swr';
import { updateServiceMetadataAPI } from '../../../shared/api/hub';

export interface ServiceTrainingTabProps {
  serviceId: string;
  files?: Array<{ name: string; size?: number; type?: string; content?: string }>;
}

export default function ServiceTrainingTab({ serviceId, files: initialFiles = [] }: ServiceTrainingTabProps) {
  const { mutate } = useSWRConfig();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<Array<{ name: string; size?: number; type?: string; content?: string }>>(initialFiles);

  const onSelect = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files;
    if (!f || f.length === 0) return;
    const picked = Array.from(f);
    const entries: Array<{ name: string; size: number; type: string; content?: string }> = [];
    for (const file of picked) {
      if (file.size <= 1024 * 1024) {
        const buf = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        entries.push({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', content: `data:${file.type};base64,${b64}` });
      } else {
        entries.push({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
      }
    }
    setFiles(prev => [...prev, ...entries]);
  };

  const onUpload = async () => {
    if (files.length === 0) return;
    try {
      setUploading(true);
      await updateServiceMetadataAPI(serviceId, { training: files });
      mutate((key: any) => typeof key === 'string' && (key.includes('/services') || key.includes(serviceId)));
    } finally {
      setUploading(false);
    }
  };

  const removeAt = async (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    await updateServiceMetadataAPI(serviceId, { training: next });
    mutate((key: any) => typeof key === 'string' && (key.includes('/services') || key.includes(serviceId)));
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Training</h3>
      <p style={{ color: '#6b7280' }}>Attach training videos/files for this service. Files up to 1MB are stored inline for MVP.</p>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" multiple onChange={onSelect} />
        <button onClick={onUpload} disabled={uploading || files.length === 0} style={{ padding: '6px 10px', borderRadius: 6, background: '#111827', color: '#fff', border: '1px solid #111827' }}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Attached Files</div>
          <ul style={{ color: '#374151' }}>
            {files.map((f, idx) => {
              const kb = f.size ? ` (${Math.round((f.size || 0)/1024)} KB)` : '';
              const canDownload = !!f.content;
              return (
                <li key={`${f.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {canDownload ? (
                    <a href={f.content} download={f.name} style={{ color: '#1d4ed8', textDecoration: 'underline' }}>{f.name}</a>
                  ) : (
                    <span>{f.name}</span>
                  )}
                  <span style={{ color: '#6b7280' }}>{kb}</span>
                  <button onClick={() => removeAt(idx)} style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Remove</button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
