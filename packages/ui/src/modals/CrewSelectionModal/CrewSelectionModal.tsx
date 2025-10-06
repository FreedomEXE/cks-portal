import React, { useState } from 'react';
import Button from '../../buttons/Button';
import { ModalRoot } from '../ModalRoot';

export interface CrewMember {
  code: string;
  name: string;
}

export interface CrewSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedCrew: string[], message?: string) => void;
  availableCrew: CrewMember[];
  quota?: number; // Optional: how many crew members needed
}

export default function CrewSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  availableCrew,
  quota
}: CrewSelectionModalProps) {
  const [selectedCrewCodes, setSelectedCrewCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setSelectedCrewCodes([]);
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleCrew = (crewCode: string) => {
    setSelectedCrewCodes(prev => {
      if (prev.includes(crewCode)) {
        return prev.filter(c => c !== crewCode);
      } else {
        return [...prev, crewCode];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedCrewCodes.length === 0) {
      return; // Don't submit if no crew selected
    }
    onSubmit(selectedCrewCodes, message || undefined);
    onClose();
  };

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h3 id="crew-selection-modal-title" style={{
          marginTop: 0,
          marginBottom: '8px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827'
        }}>
          Request Crew Assignment
        </h3>

        {quota && (
          <p style={{
            marginTop: 0,
            marginBottom: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Select up to {quota} crew member{quota !== 1 ? 's' : ''} to request for this service.
          </p>
        )}

        {/* Crew Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Select Crew Members *
          </label>
          <div style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {availableCrew.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No crew members available
              </div>
            ) : (
              availableCrew.map(crew => (
                <label
                  key={crew.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background-color 0.15s',
                    backgroundColor: selectedCrewCodes.includes(crew.code) ? '#eff6ff' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedCrewCodes.includes(crew.code)) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedCrewCodes.includes(crew.code)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCrewCodes.includes(crew.code)}
                    onChange={() => handleToggleCrew(crew.code)}
                    style={{
                      marginRight: '12px',
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#111827'
                    }}>
                      {crew.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {crew.code}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedCrewCodes.length > 0 && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {selectedCrewCodes.length} crew member{selectedCrewCodes.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Optional Message */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message for the crew members..."
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
            disabled={selectedCrewCodes.length === 0}
          >
            Send Request{selectedCrewCodes.length > 0 ? ` (${selectedCrewCodes.length})` : ''}
          </Button>
        </div>
      </div>
    </ModalRoot>
  );
}
