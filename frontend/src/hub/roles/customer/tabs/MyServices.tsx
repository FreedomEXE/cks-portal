/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyServices.tsx - Customer
 * 
 * Description: Customer service management with active services and service history
 * Function: Manage active services, view service history, and browse CKS catalog
 * Importance: Critical - Service engagement and discovery management
 * Connects to: Services API, customer engagements, CKS catalog
 */

import React, { useState, useEffect } from 'react';
import { useCatalog } from '../../../../shared/catalog/CatalogContext';

interface MyServicesProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface Service {
  service_id: string;
  service_name: string;
  status: 'active' | 'completed' | 'cancelled';
  contractor?: string;
  start_date: string;
  end_date?: string;
  category: string;
}

export default function MyServices({ userId, config, features, api }: MyServicesProps) {
  const { open: openCatalog } = useCatalog();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [serviceHistory, setServiceHistory] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        
        // Mock active services (specific service instances for customer's centers)
        const mockActiveServices: Service[] = [
          {
            service_id: 'CEN001-SRV001',
            service_name: 'Commercial Deep Cleaning',
            status: 'active',
            contractor: 'Premium Cleaning Solutions',
            start_date: '2025-09-01',
            category: 'Recurring'
          },
          {
            service_id: 'CEN002-SRV002',
            service_name: 'HVAC System Maintenance',
            status: 'active',
            contractor: 'TechCorp Services',
            start_date: '2025-08-15',
            category: 'Monthly'
          },
          {
            service_id: 'CEN003-SRV003',
            service_name: 'Security Monitoring',
            status: 'active',
            contractor: 'SecureWatch LLC',
            start_date: '2025-09-09',
            category: 'Daily'
          }
        ];

        // Mock service history (completed/cancelled specific service instances)
        const mockServiceHistory: Service[] = [
          {
            service_id: 'CEN001-SRV004',
            service_name: 'Pest Control Service',
            status: 'completed',
            contractor: 'BugAway Solutions',
            start_date: '2025-07-01',
            end_date: '2025-07-15',
            category: 'Monthly'
          },
          {
            service_id: 'CEN002-SRV005',
            service_name: 'Window Cleaning Services',
            status: 'completed',
            contractor: 'Crystal Clear Windows',
            start_date: '2025-06-15',
            end_date: '2025-06-30',
            category: 'Bi-weekly'
          },
          {
            service_id: 'CEN003-SRV006',
            service_name: 'Floor Care & Maintenance',
            status: 'cancelled',
            contractor: 'Metro Floor Care',
            start_date: '2025-05-01',
            end_date: '2025-05-02',
            category: 'One-time'
          }
        ];
        
        setActiveServices(mockActiveServices);
        setServiceHistory(mockServiceHistory);
        
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [userId]);

  const handleServiceClick = (serviceId: string, section: string) => {
    // Mock detailed service view
    alert(`Opening detailed view for ${serviceId} from ${section} section`);
  };

  const handleBrowseCatalog = () => {
    openCatalog({ type: 'service' });
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
      case 'active': return activeServices;
      case 'history': return serviceHistory;
      default: return [];
    }
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'active':
        return ['Service ID', 'Service Name', 'Contractor', 'Category', 'Start Date'];
      case 'history':
        return ['Service ID', 'Service Name', 'Contractor', 'Status', 'Start Date', 'End Date'];
      default:
        return [];
    }
  };

  const renderTableRow = (service: any) => {
    switch (activeTab) {
      case 'active':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#eab308', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Active Services')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.contractor || '—'}</td>
            <td style={{ padding: 10 }}>{service.category}</td>
            <td style={{ padding: 10 }}>{service.start_date}</td>
          </tr>
        );
      case 'history':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#eab308', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Service History')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.contractor || '—'}</td>
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
      case 'active': return `Active Services (${activeServices.length})`;
      case 'history': return `Service History (${serviceHistory.length})`;
      default: return tab;
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'active': return 'Services currently being provided at your centers';
      case 'history': return 'Completed/cancelled services archive for your centers';
      default: return '';
    }
  };

  return (
    <div>
      {/* Header with Browse CKS Catalog Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
          My Services
        </h2>
        <button
          onClick={handleBrowseCatalog}
          style={{
            padding: '8px 16px',
            border: '1px solid #eab308',
            borderRadius: 6,
            background: '#eab308',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Browse CKS Catalog
        </button>
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
              background: activeTab === tab ? '#eab308' : 'white',
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
