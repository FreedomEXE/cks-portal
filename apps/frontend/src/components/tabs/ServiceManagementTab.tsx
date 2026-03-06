import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { updateCatalogService, uploadCatalogImage } from '../../shared/api/admin';

interface ServiceManagementTabProps {
  serviceId: string;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  imageUrl?: string | null;
}

export default function ServiceManagementTab({
  serviceId,
  name,
  description,
  category,
  imageUrl,
}: ServiceManagementTabProps) {
  const { getToken } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draftName, setDraftName] = useState(name ?? '');
  const [draftDescription, setDraftDescription] = useState(description ?? '');
  const [draftCategory, setDraftCategory] = useState(category ?? '');
  const [draftImageUrl, setDraftImageUrl] = useState(imageUrl ?? '');

  // Photo upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(name ?? '');
    setDraftDescription(description ?? '');
    setDraftCategory(category ?? '');
    setDraftImageUrl(imageUrl ?? '');
  }, [name, description, category, imageUrl]);

  const hasChanges = useMemo(() => {
    return (draftName ?? '') !== (name ?? '') ||
      (draftDescription ?? '') !== (description ?? '') ||
      (draftCategory ?? '') !== (category ?? '');
  }, [draftName, draftDescription, draftCategory, name, description, category]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await updateCatalogService(
        serviceId,
        {
          name: draftName.trim() || undefined,
          description: draftDescription.trim() || undefined,
          category: draftCategory.trim() || undefined,
        },
        { getToken },
      );
      window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
      toast.success('Service updated');
    } catch (err: any) {
      console.error('[ServiceManagementTab] Update failed', err);
      toast.error(err?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 12 }}>
      <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            cursor: 'pointer',
          }}
        >
          <span>Service Details</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{detailsOpen ? 'Hide' : 'Show'}</span>
        </button>
        {detailsOpen && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Name</span>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Category</span>
              <input
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Description</span>
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={4}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
              />
            </label>
            {/* ── Photo Upload ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Service Photo</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(previewUrl || draftImageUrl) ? (
                    <img
                      src={previewUrl || draftImageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>No image</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                      e.currentTarget.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: '#334155',
                    }}
                  >
                    {selectedFile ? selectedFile.name : 'Choose Image...'}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedFile) return;
                        setUploading(true);
                        try {
                          const result = await uploadCatalogImage(selectedFile, 'service', serviceId, { getToken });
                          setDraftImageUrl(result.imageUrl);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
                          toast.success('Photo uploaded');
                        } catch (err: any) {
                          toast.error(err?.message || 'Upload failed');
                        } finally {
                          setUploading(false);
                        }
                      }}
                      disabled={uploading}
                      style={{
                        borderRadius: 8,
                        border: 'none',
                        background: uploading ? '#cbd5f5' : '#4f46e5',
                        color: '#fff',
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            borderRadius: 10,
            border: 'none',
            background: saving ? '#cbd5f5' : '#4f46e5',
            color: '#fff',
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
