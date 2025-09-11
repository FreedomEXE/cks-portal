/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyServices.tsx
 * 
 * Description: Center service management for active and historical services
 * Function: View active services and service history for the center
 * Importance: Critical - Service tracking and management for center operations
 * Connects to: Service catalog API, center management, contractor partnerships
 */

import React, { useState, useEffect } from 'react';

interface ServicesProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  contractor: string;
  status: 'active' | 'scheduled' | 'completed';
  last_service: string;
  next_service?: string;
}

export default function MyServices({ userId, config, features, api }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [historyServices, setHistoryServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        
        // Mock active services data - Services center currently receives
        const mockActiveServices: Service[] = [
          {
            id: 'SVC-001',
            name: 'Daily Cleaning Service',
            category: 'cleaning',
            description: 'Daily facility cleaning and maintenance',
            contractor: 'Premium Cleaning Solutions',
            status: 'active',
            last_service: '2025-09-10',
            next_service: '2025-09-11'
          },
          {
            id: 'SVC-002',
            name: 'HVAC System Maintenance',
            category: 'maintenance',
            description: 'Monthly HVAC system inspection and maintenance',
            contractor: 'TechCorp Services',
            status: 'active',
            last_service: '2025-09-05',
            next_service: '2025-10-05'
          },
          {
            id: 'SVC-003',
            name: 'Security Monitoring',
            category: 'security',
            description: 'Daily security monitoring and patrol services',
            contractor: 'SecureWatch LLC',
            status: 'active',
            last_service: '2025-09-10',
            next_service: '2025-09-11'
          }
        ];

        // Mock history services data - Services no longer active
        const mockHistoryServices: Service[] = [
          {
            id: 'SVC-H001',
            name: 'Window Cleaning Service',
            category: 'cleaning',
            description: 'Weekly exterior window cleaning',
            contractor: 'Crystal Clear Windows',
            status: 'completed',
            last_service: '2025-08-30',
            next_service: undefined
          },
          {
            id: 'SVC-H002',
            name: 'Carpet Deep Cleaning',
            category: 'cleaning',
            description: 'Quarterly deep carpet cleaning service',
            contractor: 'FloorCare Specialists',
            status: 'completed',
            last_service: '2025-07-15',
            next_service: undefined
          }
        ];
        
        setActiveServices(mockActiveServices);
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
      case 'active': return '#10b981';
      case 'scheduled': return '#3b82f6';
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

  const currentServices = activeTab === 'active' ? activeServices : historyServices;

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
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['active', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#3b82f6' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'active' ? `Active Services (${activeServices.length})` : `Service History (${historyServices.length})`}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div>Loading services...</div>
          </div>
        ) : currentServices.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {activeTab === 'active' ? '🔧' : '📋'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              {activeTab === 'active' ? 'No Active Services' : 'No Service History'}
            </div>
            <div style={{ fontSize: 12 }}>
              {activeTab === 'active' 
                ? 'Services for your center will appear here' 
                : 'Past services will appear here'}
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
                  background: activeTab === 'active' ? '#f9fafb' : '#f7f7f7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {service.name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {service.contractor}
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
                        <span style={{ color: '#6b7280' }}>Last Service: </span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{service.last_service}</span>
                      </div>
                      {service.next_service && (
                        <div>
                          <span style={{ color: '#6b7280' }}>Next Service: </span>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{service.next_service}</span>
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
                      View Details
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