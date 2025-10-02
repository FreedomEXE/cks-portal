import React, { useMemo, useState } from 'react';
import styles from './EditOrderModal.module.css';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { notes?: string }) => Promise<void>;
  currentNotes?: string | null;
  orderId: string;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentNotes,
  orderId,
}) => {
  const [notes, setNotes] = useState(currentNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: { notes?: string } = {};

    if (notes !== currentNotes) {
      payload.notes = notes.trim() || undefined;
    }

    if (Object.keys(payload).length === 0) {
      alert('No changes to save.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Failed to update order:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Edit Order</h2>
            <p className={styles.orderId}>{orderId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>
              Special Instructions / Notes
            </label>
            <textarea
              id="notes"
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Enter special instructions or notes..."
            />
          <div className={styles.charCount}>
            {notes.length} / 1000 characters
          </div>
          {error && (
            <div style={{ color: '#dc2626', marginTop: 8, fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditOrderModal;
