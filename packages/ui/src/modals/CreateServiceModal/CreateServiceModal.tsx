import React, { useState } from 'react';
import Button from '../../buttons/Button';

export interface CreateServiceFormData {
  serviceType: 'one-time' | 'ongoing';
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  notes?: string;
}

export interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceFormData) => void;
  orderId?: string;
}

export default function CreateServiceModal({
  isOpen,
  onClose,
  onSubmit,
  orderId
}: CreateServiceModalProps) {
  const [serviceType, setServiceType] = useState<'one-time' | 'ongoing'>('one-time');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setServiceType('one-time');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = () => {
    // Start/end can be set later when work begins/completes
    onSubmit({
      serviceType,
      startDate,
      startTime,
      endDate: serviceType === 'one-time' ? endDate : undefined,
      endTime: serviceType === 'one-time' ? endTime : undefined,
      notes: notes || undefined
    });
    onClose();
  };

  const isFormValid = () => {
    return true; // No strict validation; manager can set start/end later
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-service-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '450px',
          maxWidth: '550px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="create-service-modal-title" style={{
          marginTop: 0,
          marginBottom: '8px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827'
        }}>
          Create Service
        </h3>

        {orderId && (
          <p style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Order: <span style={{ fontWeight: 500, color: '#3b82f6' }}>{orderId}</span>
          </p>
        )}

        {/* Service Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Service Type *
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: serviceType === 'one-time' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: serviceType === 'one-time' ? '#eff6ff' : 'white',
                transition: 'all 0.15s'
              }}
            >
              <input
                type="radio"
                name="serviceType"
                value="one-time"
                checked={serviceType === 'one-time'}
                onChange={(e) => setServiceType(e.target.value as 'one-time')}
                style={{ marginRight: '8px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  One-Time
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Has start and end dates
                </div>
              </div>
            </label>

            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: serviceType === 'ongoing' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: serviceType === 'ongoing' ? '#eff6ff' : 'white',
                transition: 'all 0.15s'
              }}
            >
              <input
                type="radio"
                name="serviceType"
                value="ongoing"
                checked={serviceType === 'ongoing'}
                onChange={(e) => setServiceType(e.target.value as 'ongoing')}
                style={{ marginRight: '8px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  Ongoing
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Continues until cancelled
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Start Date and Time */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Start Date & Time (optional)
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* End Date and Time (only for one-time services) */}
        {serviceType === 'one-time' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px'
            }}>
              End Date & Time *
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about this service..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            Create Service
          </Button>
        </div>
      </div>
    </div>
  );
}
