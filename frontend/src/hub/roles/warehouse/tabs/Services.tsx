/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Services.tsx
 * 
 * Description: Warehouse services management including delivery, equipment rental, and repair services
 * Function: Track warehouse service offerings and history for billing and reporting
 * Importance: Critical - Service tracking for subscription billing and public repair services
 * Connects to: Service API, billing system, CKS catalog (for repair services)
 * Updated: Force HMR refresh - attempt 2
 */

import React, { useState } from 'react';

interface ServicesProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface WarehouseService {
  serviceId: string;
  serviceName: string;
  serviceType: 'delivery' | 'equipment_rental' | 'repair';
  description: string;
  client: string;
  clientType: 'contractor' | 'center' | 'customer';
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  cost: string;
  isRecurring: boolean;
  frequency?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  location?: string;
  notes?: string;
}

export default function Services({ userId, config, features, api }: ServicesProps) {
  const [activeTab, setActiveTab] = useState<'my_services' | 'active_services' | 'history'>('my_services');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock warehouse services data - simplified for table format
  const mockServices = {
    my_services: [
      {
        service_id: 'SRV-001',
        service_name: 'Weekly Delivery Service',
        service_type: 'Delivery',
        client: 'ABC Construction',
        start_date: '2025-01-01',
        status: 'active',
        cost: 'Subscription Included'
      },
      {
        service_id: 'SRV-002',
        service_name: 'Equipment Rental - Forklifts',
        service_type: 'Equipment Rental',
        client: 'Downtown Center',
        start_date: '2025-01-15',
        status: 'active',
        cost: 'Subscription Included'
      },
      {
        service_id: 'SRV-003',
        service_name: 'HVAC System Repair',
        service_type: 'Repair Service',
        client: 'Tech Innovation Hub',
        start_date: '2025-09-10',
        status: 'active',
        cost: '$850.00'
      }
    ],
    active_services: [
      {
        service_id: 'SRV-004',
        service_name: 'Emergency Equipment Delivery',
        service_type: 'Delivery',
        client: 'Metro Contractors',
        start_date: '2025-09-11',
        end_date: '2025-09-12',
        status: 'active',
        cost: 'Subscription Included'
      },
      {
        service_id: 'SRV-005',
        service_name: 'Generator Repair Service',
        service_type: 'Repair Service',
        client: 'Power Solutions Inc',
        start_date: '2025-09-09',
        end_date: '2025-09-15',
        status: 'active',
        cost: '$1,250.00'
      }
    ],
    history: [
      {
        service_id: 'SRV-006',
        service_name: 'Quarterly Equipment Rental',
        service_type: 'Equipment Rental',
        client: 'Seasonal Operations LLC',
        start_date: '2025-07-01',
        end_date: '2025-09-30',
        status: 'completed',
        cost: 'Subscription Included'
      },
      {
        service_id: 'SRV-007',
        service_name: 'Office Equipment Repair',
        service_type: 'Repair Service',
        client: 'Corporate Center',
        start_date: '2025-08-15',
        end_date: '2025-08-16',
        status: 'completed',
        cost: '$320.00'
      }
    ]
  };

  const handleServiceClick = (serviceId: string, section: string) => {
    alert(`Opening detailed view for ${serviceId} from ${section} section`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading services...</div>
      </div>
    );
  }

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'my_services': return mockServices.my_services;
      case 'active_services': return mockServices.active_services;
      case 'history': return mockServices.history;
      default: return [];
    }
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'my_services':
        return ['Service ID', 'Service Name', 'Service Type', 'Client', 'Status', 'Start Date'];
      case 'active_services':
        return ['Service ID', 'Service Name', 'Service Type', 'Client', 'Start Date', 'End Date'];
      case 'history':
        return ['Service ID', 'Service Name', 'Service Type', 'Client', 'Status', 'Start Date', 'End Date'];
      default:
        return [];
    }
  };

  const renderTableRow = (service: any) => {
    switch (activeTab) {
      case 'my_services':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#8b5cf6', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'My Services')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.service_type}</td>
            <td style={{ padding: 10 }}>{service.client}</td>
            <td style={{ padding: 10 }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: '#dcfce7',
                color: '#166534'
              }}>
                {service.status}
              </span>
            </td>
            <td style={{ padding: 10 }}>{service.start_date}</td>
          </tr>
        );
      case 'active_services':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#8b5cf6', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Active Services')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.service_type}</td>
            <td style={{ padding: 10 }}>{service.client}</td>
            <td style={{ padding: 10 }}>{service.start_date}</td>
            <td style={{ padding: 10 }}>{service.end_date || '—'}</td>
          </tr>
        );
      case 'history':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#8b5cf6', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Service History')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.service_type}</td>
            <td style={{ padding: 10 }}>{service.client}</td>
            <td style={{ padding: 10 }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: service.status === 'completed' ? '#dcfce7' : '#fef2f2',
                color: service.status === 'completed' ? '#166534' : '#991b1b'
              }}>
                {service.status}
              </span>
            </td>
            <td style={{ padding: 10 }}>{service.start_date}</td>
            <td style={{ padding: 10 }}>{service.end_date || '—'}</td>
          </tr>
        );
      default:
        return null;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'my_services': return `My Services (${mockServices.my_services.length})`;
      case 'active_services': return `Active Services (${mockServices.active_services.length})`;
      case 'history': return `Service History (${mockServices.history.length})`;
      default: return tab;
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'my_services': return 'Services assigned to this warehouse';
      case 'active_services': return 'Currently running services';
      case 'history': return 'Completed services archive';
      default: return '';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
          My Services
        </h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['my_services', 'active_services', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#8b5cf6' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Single Content Panel */}
      <div style={{ border: '1px solid #edf2f7', borderRadius: 10, background: '#fafafa', padding: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{getTabDescription()}</div>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Service ID or name"
            style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>max 10</span>
        </div>
        
        {/* Table */}
        <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {getTableHeaders().map(h => (
                  <th key={h} style={{ 
                    textAlign: 'left', 
                    background: '#f9fafb', 
                    borderBottom: '1px solid #e5e7eb', 
                    padding: 10, 
                    fontSize: 12, 
                    color: '#6b7280' 
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getCurrentData()
                .filter((s: any) => {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return String(s.service_id || '').toLowerCase().includes(q) || 
                         String(s.service_name || '').toLowerCase().includes(q);
                })
                .slice(0, 10)
                .map((service: any) => renderTableRow(service))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}