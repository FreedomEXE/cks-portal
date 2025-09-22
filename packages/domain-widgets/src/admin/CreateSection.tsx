/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: CreateSection.tsx
 *
 * Description:
 * Admin create section with tabs for all data types
 *
 * Responsibilities:
 * - Provide create forms for all data types
 * - Use TabContainer/NavigationTab pattern from directory
 *
 * Role in system:
 * - Used by AdminHub for create tab
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { Button, NavigationTab, PageWrapper, TabContainer } from '@cks/ui';

export default function CreateSection() {
  const [activeTab, setActiveTab] = useState('managers');

  // Form state for Manager
  const [managerForm, setManagerForm] = useState({
    fullName: '',
    address: '',
    phone: '',
    email: '',
    territory: '',
    role: '',
    reportsTo: ''
  });

  // Form state for Contractor
  const [contractorForm, setContractorForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    mainContact: ''
  });

  // Form state for Customer
  const [customerForm, setCustomerForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    mainContact: ''
  });

  // Form state for Center
  const [centerForm, setCenterForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    mainContact: ''
  });

  // Form state for Crew
  const [crewForm, setCrewForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    territory: '',
    emergencyContact: ''
  });

  // Form state for Warehouse
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    territory: '',
    mainContact: ''
  });

  const handleManagerInputChange = (field: string, value: string) => {
    setManagerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating manager:', managerForm);
    // TODO: Implement actual creation logic
    alert('Manager created successfully!');
    setManagerForm({
      fullName: '',
      address: '',
      phone: '',
      email: '',
      territory: '',
      role: '',
      reportsTo: ''
    });
  };

  const handleContractorInputChange = (field: string, value: string) => {
    setContractorForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContractorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating contractor:', contractorForm);
    // TODO: Implement actual creation logic
    alert('Contractor created successfully!');
    setContractorForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      mainContact: ''
    });
  };

  const handleCustomerInputChange = (field: string, value: string) => {
    setCustomerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating customer:', customerForm);
    // TODO: Implement actual creation logic
    alert('Customer created successfully!');
    setCustomerForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      mainContact: ''
    });
  };

  // Center handlers
  const handleCenterInputChange = (field: string, value: string) => {
    setCenterForm(prev => ({ ...prev, [field]: value }));
  };
  const handleCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating center:', centerForm);
    alert('Center created successfully!');
    setCenterForm({ name: '', address: '', phone: '', email: '', website: '', mainContact: '' });
  };

  // Crew handlers
  const handleCrewInputChange = (field: string, value: string) => {
    setCrewForm(prev => ({ ...prev, [field]: value }));
  };
  const handleCrewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating crew:', crewForm);
    alert('Crew created successfully!');
    setCrewForm({ name: '', address: '', phone: '', email: '', territory: '', emergencyContact: '' });
  };

  // Warehouse handlers
  const handleWarehouseInputChange = (field: string, value: string) => {
    setWarehouseForm(prev => ({ ...prev, [field]: value }));
  };
  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating warehouse:', warehouseForm);
    alert('Warehouse created successfully!');
    setWarehouseForm({ name: '', address: '', phone: '', email: '', territory: '', mainContact: '' });
  };

  const getReportsToOptions = (role: string) => {
    switch (role) {
      case 'Strategic Manager':
        return [{ value: 'CEO', label: 'CEO' }];
      case 'Operations Manager':
        return [
          { value: 'CEO', label: 'CEO' },
          { value: 'strategic-manager', label: 'Strategic Manager' }
        ];
      case 'Field Manager':
        return [
          { value: 'CEO', label: 'CEO' },
          { value: 'strategic-manager', label: 'Strategic Manager' },
          { value: 'operations-manager', label: 'Operations Manager' }
        ];
      case 'Development Manager':
        return [
          { value: 'CEO', label: 'CEO' },
          { value: 'strategic-manager', label: 'Strategic Manager' }
        ];
      default:
        return [];
    }
  };

  const renderManagerForm = () => (
    <div style={{
      padding: 24,
      background: 'white',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Manager</h3>

      <form onSubmit={handleManagerSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Full Name *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={managerForm.fullName}
                  onChange={(e) => handleManagerInputChange('fullName', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter full name"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Territory *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={managerForm.territory}
                  onChange={(e) => handleManagerInputChange('territory', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="e.g., North Region"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Phone *
                </label>
              </td>
              <td>
                <input
                  type="tel"
                  value={managerForm.phone}
                  onChange={(e) => handleManagerInputChange('phone', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="(555) 123-4567"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Email *
                </label>
              </td>
              <td>
                <input
                  type="email"
                  value={managerForm.email}
                  onChange={(e) => handleManagerInputChange('email', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="manager@example.com"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Role *
                </label>
              </td>
              <td>
                <select
                  value={managerForm.role}
                  onChange={(e) => handleManagerInputChange('role', e.target.value)}
                  required
                  style={{
                    width: '324px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Role</option>
                  <option value="Strategic Manager">Strategic Manager</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Field Manager">Field Manager</option>
                  <option value="Development Manager">Development Manager</option>
                </select>
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Reports To *
                </label>
              </td>
              <td>
                <select
                  value={managerForm.reportsTo}
                  onChange={(e) => handleManagerInputChange('reportsTo', e.target.value)}
                  required
                  disabled={!managerForm.role}
                  style={{
                    width: '324px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: managerForm.role ? 'white' : '#f9fafb',
                    color: managerForm.role ? '#111827' : '#9ca3af'
                  }}
                >
                  <option value="">
                    {managerForm.role ? 'Select Reports To' : 'Select Role First'}
                  </option>
                  {getReportsToOptions(managerForm.role).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Address *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={managerForm.address}
                  onChange={(e) => handleManagerInputChange('address', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter full address"
                />
              </td>
            </tr>

            {/* Submit Button Row */}
            <tr>
              <td></td>
              <td style={{ paddingTop: 16 }}>
                <Button
                  type="submit"
                  variant="primary"
                  roleColor="#3b82f6"
                >
                  Create Manager
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderContractorForm = () => (
    <div style={{
      padding: 24,
      background: 'white',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Contractor</h3>

      <form onSubmit={handleContractorSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Name *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={contractorForm.name}
                  onChange={(e) => handleContractorInputChange('name', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter company name"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Phone *
                </label>
              </td>
              <td>
                <input
                  type="tel"
                  value={contractorForm.phone}
                  onChange={(e) => handleContractorInputChange('phone', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="(555) 123-4567"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Email *
                </label>
              </td>
              <td>
                <input
                  type="email"
                  value={contractorForm.email}
                  onChange={(e) => handleContractorInputChange('email', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="contractor@example.com"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Website *
                </label>
              </td>
              <td>
                <input
                  type="url"
                  value={contractorForm.website}
                  onChange={(e) => handleContractorInputChange('website', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="https://example.com"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Main Contact *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={contractorForm.mainContact}
                  onChange={(e) => handleContractorInputChange('mainContact', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Contact person name"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Address *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={contractorForm.address}
                  onChange={(e) => handleContractorInputChange('address', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter full address"
                />
              </td>
            </tr>

            {/* Submit Button Row */}
            <tr>
              <td></td>
              <td style={{ paddingTop: 16 }}>
                <Button
                  type="submit"
                  variant="primary"
                  roleColor="#10b981"
                >
                  Create Contractor
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderCustomerForm = () => (
    <div style={{
      padding: 24,
      background: 'white',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Customer</h3>

      <form onSubmit={handleCustomerSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Name *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => handleCustomerInputChange('name', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter customer name"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Phone *
                </label>
              </td>
              <td>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="(555) 123-4567"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Email *
                </label>
              </td>
              <td>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="customer@example.com"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Website *
                </label>
              </td>
              <td>
                <input
                  type="url"
                  value={customerForm.website}
                  onChange={(e) => handleCustomerInputChange('website', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="https://example.com"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Main Contact *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={customerForm.mainContact}
                  onChange={(e) => handleCustomerInputChange('mainContact', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Contact person name"
                />
              </td>
            </tr>

            <tr>
              <td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}>
                <label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Address *
                </label>
              </td>
              <td>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => handleCustomerInputChange('address', e.target.value)}
                  required
                  style={{
                    width: '300px',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter full address"
                />
              </td>
            </tr>

            {/* Submit Button Row */}
            <tr>
              <td></td>
              <td style={{ paddingTop: 16 }}>
                <Button
                  type="submit"
                  variant="primary"
                  roleColor="#eab308"
                >
                  Create Customer
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderCenterForm = () => (
    <div style={{ padding: 24, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Center</h3>
      <form onSubmit={handleCenterSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Name *</label></td><td><input type="text" value={centerForm.name} onChange={(e) => handleCenterInputChange('name', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter center name" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Phone *</label></td><td><input type="tel" value={centerForm.phone} onChange={(e) => handleCenterInputChange('phone', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="(555) 123-4567" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Email *</label></td><td><input type="email" value={centerForm.email} onChange={(e) => handleCenterInputChange('email', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="center@example.com" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Website *</label></td><td><input type="url" value={centerForm.website} onChange={(e) => handleCenterInputChange('website', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="https://example.com" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Main Contact *</label></td><td><input type="text" value={centerForm.mainContact} onChange={(e) => handleCenterInputChange('mainContact', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Contact person name" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Address *</label></td><td><input type="text" value={centerForm.address} onChange={(e) => handleCenterInputChange('address', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter full address" /></td></tr>
            <tr><td></td><td style={{ paddingTop: 16 }}><Button type="submit" variant="primary" roleColor="#f59e0b">Create Center</Button></td></tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderCrewForm = () => (
    <div style={{ padding: 24, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Crew</h3>
      <form onSubmit={handleCrewSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Name *</label></td><td><input type="text" value={crewForm.name} onChange={(e) => handleCrewInputChange('name', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter crew member name" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Phone *</label></td><td><input type="tel" value={crewForm.phone} onChange={(e) => handleCrewInputChange('phone', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="(555) 123-4567" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Email *</label></td><td><input type="email" value={crewForm.email} onChange={(e) => handleCrewInputChange('email', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="crew@example.com" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Territory *</label></td><td><input type="text" value={crewForm.territory} onChange={(e) => handleCrewInputChange('territory', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="e.g., North Region" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Emergency Contact *</label></td><td><input type="text" value={crewForm.emergencyContact} onChange={(e) => handleCrewInputChange('emergencyContact', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Emergency contact info" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Address *</label></td><td><input type="text" value={crewForm.address} onChange={(e) => handleCrewInputChange('address', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter full address" /></td></tr>
            <tr><td></td><td style={{ paddingTop: 16 }}><Button type="submit" variant="primary" roleColor="#ef4444">Create Crew</Button></td></tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderWarehouseForm = () => (
    <div style={{ padding: 24, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#111827' }}>Create Warehouse</h3>
      <form onSubmit={handleWarehouseSubmit}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Name *</label></td><td><input type="text" value={warehouseForm.name} onChange={(e) => handleWarehouseInputChange('name', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter warehouse name" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Phone *</label></td><td><input type="tel" value={warehouseForm.phone} onChange={(e) => handleWarehouseInputChange('phone', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="(555) 123-4567" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Email *</label></td><td><input type="email" value={warehouseForm.email} onChange={(e) => handleWarehouseInputChange('email', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="warehouse@example.com" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Territory *</label></td><td><input type="text" value={warehouseForm.territory} onChange={(e) => handleWarehouseInputChange('territory', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="e.g., North Region" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Main Contact *</label></td><td><input type="text" value={warehouseForm.mainContact} onChange={(e) => handleWarehouseInputChange('mainContact', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Contact person name" /></td></tr>
            <tr><td style={{ width: '150px', verticalAlign: 'top', paddingRight: 16 }}><label style={{ fontWeight: 500, color: '#374151', fontSize: 14 }}>Address *</label></td><td><input type="text" value={warehouseForm.address} onChange={(e) => handleWarehouseInputChange('address', e.target.value)} required style={{ width: '300px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} placeholder="Enter full address" /></td></tr>
            <tr><td></td><td style={{ paddingTop: 16 }}><Button type="submit" variant="primary" roleColor="#8b5cf6">Create Warehouse</Button></td></tr>
          </tbody>
        </table>
      </form>
    </div>
  );

  const renderCreateForm = () => {
    switch (activeTab) {
      case 'managers':
        return renderManagerForm();
      case 'contractors':
        return renderContractorForm();
      case 'customers':
        return renderCustomerForm();
      case 'centers':
        return renderCenterForm();
      case 'crew':
        return renderCrewForm();
      case 'warehouses':
        return renderWarehouseForm();
      default:
        return (
          <div style={{
            padding: 24,
            background: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <p>Create {activeTab} form will be implemented here</p>
          </div>
        );
    }
  };

  return (
    <PageWrapper headerSrOnly>
      <TabContainer variant="pills" spacing="compact">
        <NavigationTab
          label="Managers"
          isActive={activeTab === 'managers'}
          onClick={() => setActiveTab('managers')}
          activeColor="#3b82f6"
        />
        <NavigationTab
          label="Contractors"
          isActive={activeTab === 'contractors'}
          onClick={() => setActiveTab('contractors')}
          activeColor="#10b981"
        />
        <NavigationTab
          label="Customers"
          isActive={activeTab === 'customers'}
          onClick={() => setActiveTab('customers')}
          activeColor="#eab308"
        />
        <NavigationTab
          label="Centers"
          isActive={activeTab === 'centers'}
          onClick={() => setActiveTab('centers')}
          activeColor="#f59e0b"
        />
        <NavigationTab
          label="Crew"
          isActive={activeTab === 'crew'}
          onClick={() => setActiveTab('crew')}
          activeColor="#ef4444"
        />
        <NavigationTab
          label="Warehouses"
          isActive={activeTab === 'warehouses'}
          onClick={() => setActiveTab('warehouses')}
          activeColor="#8b5cf6"
        />
        <NavigationTab
          label="Services"
          isActive={activeTab === 'services'}
          onClick={() => setActiveTab('services')}
          activeColor="#06b6d4"
        />
      </TabContainer>

      <div style={{ marginTop: 24 }}>
        {renderCreateForm()}
      </div>
    </PageWrapper>
  );
}

