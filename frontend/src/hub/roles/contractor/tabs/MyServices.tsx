/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyServices.tsx - Contractor
 * 
 * Description: Contractor service management with offerings and service history
 * Function: Manage services they offer, active services, and service history
 * Importance: Critical - Service portfolio and engagement management
 * Connects to: Services API, contractor offerings, CKS catalog
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
  client?: string;
  start_date: string;
  end_date?: string;
  category: string;
}

export default function MyServices({ userId, config, features, api }: MyServicesProps) {
  const { open: openCatalog } = useCatalog();
  const [activeTab, setActiveTab] = useState<'offered' | 'active' | 'history'>('offered');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [offeredServices, setOfferedServices] = useState<Service[]>([]);
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [serviceHistory, setServiceHistory] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        
        // Mock services contractor currently offers through CKS (generic catalog services)
        const mockOfferedServices: Service[] = [
          {
            service_id: 'SRV-001',
            service_name: 'Commercial Deep Cleaning',
            category: 'Cleaning',
            status: 'active',
            start_date: '2024-01-15'
          },
          {
            service_id: 'SRV-002',
            service_name: 'Floor Care & Maintenance',
            category: 'Maintenance',
            status: 'active',
            start_date: '2024-03-01'
          },
          {
            service_id: 'SRV-003',
            service_name: 'Window Cleaning Services',
            category: 'Cleaning',
            status: 'active',
            start_date: '2024-02-10'
          }
        ];

        // Mock active service engagements (specific instances contractor is working on)
        const mockActiveServices: Service[] = [
          {
            service_id: 'CEN001-SRV001',
            service_name: 'Commercial Deep Cleaning',
            status: 'active',
            client: 'Downtown Business Center',
            start_date: '2025-09-01',
            category: 'Recurring'
          },
          {
            service_id: 'CEN002-SRV002',
            service_name: 'Floor Care & Maintenance',
            status: 'active',
            client: 'Metro Construction LLC',
            start_date: '2025-09-10',
            end_date: '2025-09-15',
            category: 'One-time'
          }
        ];

        // Mock service history (completed/cancelled specific instances)
        const mockServiceHistory: Service[] = [
          {
            service_id: 'CEN003-SRV001',
            service_name: 'Commercial Deep Cleaning',
            status: 'completed',
            client: 'City Diner',
            start_date: '2025-08-15',
            end_date: '2025-08-20',
            category: 'One-time'
          },
          {
            service_id: 'CEN004-SRV003',
            service_name: 'Window Cleaning Services',
            status: 'cancelled',
            client: 'Health Partners Clinic',
            start_date: '2025-08-01',
            end_date: '2025-08-02',
            category: 'One-time'
          },
          {
            service_id: 'CEN005-SRV002',
            service_name: 'Floor Care & Maintenance',
            status: 'completed',
            client: 'Fashion Forward',
            start_date: '2025-07-01',
            end_date: '2025-07-31',
            category: 'Monthly'
          }
        ];

        setOfferedServices(mockOfferedServices);
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

  const handleAddService = () => {
    openCatalog({ type: 'service' });
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
      case 'offered': return offeredServices;
      case 'active': return activeServices;
      case 'history': return serviceHistory;
      default: return [];
    }
  };

  const getTableHeaders = () => {
    switch (activeTab) {
      case 'offered':
        return ['Service ID', 'Service Name', 'Category', 'Status', 'Start Date'];
      case 'active':
        return ['Service ID', 'Service Name', 'Client', 'Category', 'Start Date', 'End Date'];
      case 'history':
        return ['Service ID', 'Service Name', 'Client', 'Status', 'Start Date', 'End Date'];
      default:
        return [];
    }
  };

  const renderTableRow = (service: any) => {
    switch (activeTab) {
      case 'offered':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#10b981', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'My Services')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.category}</td>
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
      case 'active':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#10b981', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Active Services')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.client || '—'}</td>
            <td style={{ padding: 10 }}>{service.category}</td>
            <td style={{ padding: 10 }}>{service.start_date}</td>
            <td style={{ padding: 10 }}>{service.end_date || '—'}</td>
          </tr>
        );
      case 'history':
        return (
          <tr key={service.service_id}>
            <td style={{ padding: 10, fontWeight: 600, color: '#10b981', cursor: 'pointer' }}
                onClick={() => handleServiceClick(service.service_id, 'Service History')}>
              {service.service_id}
            </td>
            <td style={{ padding: 10 }}>{service.service_name}</td>
            <td style={{ padding: 10 }}>{service.client || '—'}</td>
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
      case 'offered': return `My Services (${offeredServices.length})`;
      case 'active': return `Active Services (${activeServices.length})`;
      case 'history': return `Service History (${serviceHistory.length})`;
      default: return tab;
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'offered': return 'Services you currently offer through CKS';
      case 'active': return 'Currently active service engagements';
      case 'history': return 'Completed/cancelled services archive';
      default: return '';
    }
  };

  return (
    <div>
      {/* Header with Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
          My Services
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAddService}
            style={{
              padding: '8px 16px',
              border: '1px solid #10b981',
              borderRadius: 6,
              background: 'white',
              color: '#10b981',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add Service
          </button>
          <button
            onClick={handleBrowseCatalog}
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
            Browse CKS Catalog
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['offered', 'active', 'history'] as const).map(tab => (
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
