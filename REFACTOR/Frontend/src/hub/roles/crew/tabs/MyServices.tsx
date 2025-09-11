/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyServices.tsx
 * 
 * Description: Crew service training and history management
 * Function: View training certifications and service experience
 * Importance: Critical - Track skills and training for crew development
 * Connects to: Training API, certification tracking, skill management
 */

import React, { useState, useEffect } from 'react';

interface ServicesProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface ServiceSkill {
  id: string;
  name: string;
  category: string;
  status: 'certified' | 'training' | 'completed';
  description: string;
  certification_date?: string;
  trainer?: string;
  experience_hours?: number;
}

export default function MyServices({ userId, config, features, api }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<'skills' | 'history'>('skills');
  const [skillsServices, setSkillsServices] = useState<ServiceSkill[]>([]);
  const [historyServices, setHistoryServices] = useState<ServiceSkill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        
        // Mock current skills/certifications
        const mockSkillsServices: ServiceSkill[] = [
          {
            id: 'SKILL-001',
            name: 'General Cleaning Certification',
            category: 'cleaning',
            status: 'certified',
            description: 'Basic commercial cleaning techniques and safety',
            certification_date: '2024-06-15',
            trainer: 'Alex Johnson',
            experience_hours: 120
          },
          {
            id: 'SKILL-002',
            name: 'Floor Care Specialist',
            category: 'cleaning',
            status: 'certified',
            description: 'Advanced floor cleaning and maintenance',
            certification_date: '2024-08-20',
            trainer: 'Maria Rodriguez',
            experience_hours: 80
          },
          {
            id: 'SKILL-003',
            name: 'Equipment Safety Training',
            category: 'safety',
            status: 'training',
            description: 'Currently training on equipment safety protocols',
            trainer: 'David Chen',
            experience_hours: 15
          }
        ];

        // Mock training history
        const mockHistoryServices: ServiceSkill[] = [
          {
            id: 'HIST-001',
            name: 'Basic Safety Orientation',
            category: 'safety',
            status: 'completed',
            description: 'Initial safety training and orientation',
            certification_date: '2024-05-01',
            trainer: 'Safety Department',
            experience_hours: 8
          },
          {
            id: 'HIST-002',
            name: 'Customer Service Basics',
            category: 'service',
            status: 'completed',
            description: 'Customer interaction and service standards',
            certification_date: '2024-05-15',
            trainer: 'HR Department',
            experience_hours: 4
          }
        ];
        
        setSkillsServices(mockSkillsServices);
        setHistoryServices(mockHistoryServices);
        
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'certified': return '#10b981';
      case 'training': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading services...</div>
      </div>
    );
  }

  const currentServices = activeTab === 'skills' ? skillsServices : historyServices;

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Services</h2>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #10b981',
            borderRadius: 6,
            background: '#10b981',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Request Training
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['skills', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#10b981' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'skills' ? `Current Skills (${skillsServices.length})` : `Training History (${historyServices.length})`}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {currentServices.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {activeTab === 'skills' ? '🎓' : '📋'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              {activeTab === 'skills' ? 'No Skills Certified' : 'No Training History'}
            </div>
            <div style={{ fontSize: 12 }}>
              {activeTab === 'skills' 
                ? 'Your certifications and skills will appear here' 
                : 'Completed training will appear here'}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {currentServices.map(service => (
                <div key={service.id} style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: activeTab === 'skills' ? '#f9fafb' : '#f7f7f7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {service.name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {service.category} • Trainer: {service.trainer}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: getStatusColor(service.status),
                      color: 'white'
                    }}>
                      {service.status}
                    </div>
                  </div>

                  <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>
                    {service.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <span style={{ color: '#6b7280' }}>Experience: </span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{service.experience_hours}h</span>
                      </div>
                      {service.certification_date && (
                        <div>
                          <span style={{ color: '#6b7280' }}>Certified: </span>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{service.certification_date}</span>
                        </div>
                      )}
                    </div>
                    <button style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      color: '#111827',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}