/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Admin Hub - FULLY INDEPENDENT)
 * 
 * Description: Consolidated admin hub with complete independence from shared components
 * Function: Single-page admin interface with tabbed sections for system management
 * Importance: Critical - Central administration for all CKS Portal operations
 * Connects to: Admin API endpoints only, Admin authentication, sessionStorage
 * 
 * Notes: 100% self-contained admin hub with no external dependencies.
 *        Admin is the only non-template hub that creates data for all other hubs.
 *        Includes user creation, system management, and directory functionality.
 *        Uses black theme for administrative authority and system control.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { validateAdminRole, getAdminSession, setAdminSession, getAdminOperationalInfo } from './utils/adminAuth';
import { buildAdminApiUrl, adminApiFetch } from './utils/adminApi';

type AdminSection = 'dashboard' | 'directory' | 'create' | 'manage' | 'assign' | 'reports' | 'profile';

export default function AdminHome() {
  const { user } = useUser();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Set section based on URL path
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && ['dashboard', 'directory', 'create', 'manage', 'assign', 'reports', 'profile'].includes(path)) {
      setActiveSection(path as AdminSection);
    }
  }, [location.pathname]);

  // Validate admin access
  if (!user || !validateAdminRole(user)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000000',
        color: '#ffffff' 
      }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Admin privileges required</div>
        </div>
      </div>
    );
  }

  // Get admin info
  const adminInfo = getAdminOperationalInfo(user);
  const adminSession = getAdminSession();
  const adminCode = adminSession.code || adminInfo.adminId || 'admin-000';
  const adminName = adminInfo.adminName || user.fullName || 'System Administrator';

  // Set admin session
  useEffect(() => {
    if (adminCode && adminName && adminInfo.adminId) {
      setAdminSession(adminCode, adminName, adminInfo.adminId);
    }
  }, [adminCode, adminName, adminInfo.adminId]);

  // Navigation sections
  const sections = [
    { id: 'dashboard', label: '🏠 Dashboard', description: 'System overview and metrics' },
    { id: 'directory', label: '📋 CKS Directory', description: 'Searchable user database' },
    { id: 'create', label: '➕ Create', description: 'Create users and data' },
    { id: 'manage', label: '⚙️ Manage', description: 'Manage users and system' },
    { id: 'assign', label: '👥 Assign', description: 'Assign roles and permissions' },
    { id: 'reports', label: '📊 Reports', description: 'System reports and analytics' },
    { id: 'profile', label: '👤 Profile', description: 'Admin profile settings' },
  ];

  // Sample user data for directory
  const sampleUsers = [
    { id: 'mgr-001', name: 'John Smith', email: 'john.smith@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'con-045', name: 'Sarah Johnson', email: 'sarah@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Active', lastLogin: '1 day ago' },
    { id: 'cus-123', name: 'Mike Davis', email: 'mike@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '3 hours ago' },
    { id: 'ctr-089', name: 'Lisa Wilson', email: 'lisa@center.com', role: 'Center', hub: 'Center', status: 'Active', lastLogin: '1 hour ago' },
    { id: 'crw-234', name: 'Tom Brown', email: 'tom@crew.com', role: 'Crew', hub: 'Crew', status: 'Active', lastLogin: '30 min ago' },
    { id: 'mgr-002', name: 'Jennifer Lee', email: 'jennifer@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '4 hours ago' },
    { id: 'con-046', name: 'Robert Chen', email: 'robert@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Inactive', lastLogin: '2 weeks ago' },
    { id: 'cus-124', name: 'Amy Taylor', email: 'amy@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '1 day ago' },
  ];

  // Filter users based on search term
  const filteredUsers = sampleUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div style={{ padding: '20px 0' }}>
            {/* Welcome Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000000 0%, #1f1f1f 100%)',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Welcome, {adminName}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                System Administrator ({adminCode})
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>1,523</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Total Users</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>247</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Active Sessions</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#eab308' }}>98.5%</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>System Uptime</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>45</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Days Online</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 20,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent System Activity</div>
              <div style={{ space: 12 }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>New user created: john.doe@company.com</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>2 hours ago</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>System backup completed successfully</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>4 hours ago</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Security scan completed - No issues found</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>6 hours ago</div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Database optimization completed</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>8 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Create New Data</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Create users, roles, and system data</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* Create User */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👤 Create User</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Create new users for Manager, Contractor, Customer, Center, or Crew hubs
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  CREATE USER
                </button>
              </div>

              {/* Create Role */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🎭 Create Role</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Create custom roles with specific permissions and access levels
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  CREATE ROLE
                </button>
              </div>

              {/* Create Center */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Create Center</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Create new customer centers and assign them to contractors
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  CREATE CENTER
                </button>
              </div>

              {/* Create System Config */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>⚙️ Create Config</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Create system configurations and application settings
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  CREATE CONFIG
                </button>
              </div>
            </div>
          </div>
        );

      case 'manage':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Manage Resources</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage existing users, roles, and system resources</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Edit, deactivate, or manage existing user accounts
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>1,523 users</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE USERS
                </button>
              </div>

              {/* Role Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🎭 Role Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Modify permissions and manage existing roles
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>6 active roles</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE ROLES
                </button>
              </div>

              {/* Center Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Center Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage customer centers and their assignments
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>342 active centers</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE CENTERS
                </button>
              </div>

              {/* System Resources */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔧 System Resources</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage system configurations and resources
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>System healthy</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE SYSTEM
                </button>
              </div>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Assign Roles & Permissions</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Assign roles, permissions, and hub access to users</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* Hub Access Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏠 Hub Access</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Assign users to Manager, Contractor, Customer, Center, or Crew hubs
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, background: '#3b82f6', padding: '2px 6px', borderRadius: 4 }}>MANAGER</span>
                  <span style={{ fontSize: 10, background: '#10b981', padding: '2px 6px', borderRadius: 4 }}>CONTRACTOR</span>
                  <span style={{ fontSize: 10, background: '#eab308', padding: '2px 6px', borderRadius: 4 }}>CUSTOMER</span>
                  <span style={{ fontSize: 10, background: '#f97316', padding: '2px 6px', borderRadius: 4 }}>CENTER</span>
                  <span style={{ fontSize: 10, background: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>CREW</span>
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  ASSIGN HUB ACCESS
                </button>
              </div>

              {/* Permission Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔐 Permissions</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Assign specific permissions and access levels to users
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  ASSIGN PERMISSIONS
                </button>
              </div>

              {/* Center Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Center Assignment</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Assign crew members to centers and centers to contractors
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  ASSIGN CENTERS
                </button>
              </div>

              {/* Bulk Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📋 Bulk Assignment</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Bulk assign roles and permissions to multiple users
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  BULK ASSIGNMENT
                </button>
              </div>
            </div>
          </div>
        );

      case 'directory':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>CKS Directory</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Searchable database of all users with IDs and basic information</div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Search users by name, ID, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 500,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid #333333',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Users Table */}
            <div style={{ 
              border: '1px solid #333333',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#111111'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#000000' }}>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      User ID
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Name
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Email
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Role
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Hub
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Last Login
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const hubColor = 
                      user.hub === 'Manager' ? '#3b82f6' :
                      user.hub === 'Contractor' ? '#10b981' :
                      user.hub === 'Customer' ? '#eab308' :
                      user.hub === 'Center' ? '#f97316' :
                      user.hub === 'Crew' ? '#ef4444' : '#666666';
                    
                    return (
                      <tr key={user.id} style={{ borderTop: index > 0 ? '1px solid #333333' : 'none' }}>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {user.id}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.name}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.email}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.role}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            background: hubColor,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            {user.hub}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            color: user.status === 'Active' ? '#10b981' : '#f87171',
                            fontWeight: 600
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          opacity: 0.8
                        }}>
                          {user.lastLogin}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <button style={{
                            padding: '4px 8px',
                            background: '#333333',
                            border: '1px solid #555555',
                            borderRadius: 4,
                            color: '#ffffff',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}>
                            View Account
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: '#888888',
                fontSize: 14
              }}>
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>System Reports</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Analytics and reporting for all hub activities</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Activity Report */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Activity</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Login patterns, session duration, and user engagement across all hubs
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>247 active users today</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Hub Performance */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏠 Hub Performance</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Usage statistics and performance metrics for each hub type
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>All hubs operational</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Security Audit */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔒 Security Audit</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Security events, failed logins, and system vulnerabilities
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>Last scan: 2 hours ago</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* System Health */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>💚 System Health</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Server performance, uptime, and resource utilization
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>98.5% uptime</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Admin Profile</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage your administrator profile and preferences</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
              {/* Profile Info */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}>
                    👤
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{adminName}</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{adminCode}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>System Administrator</div>
                </div>
                
                <div style={{ space: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14 }}>{user.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: 14 }}>{adminInfo.department}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Last Login</div>
                    <div style={{ fontSize: 14 }}>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Profile Settings</div>
                
                <div style={{ space: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Admin Code
                    </label>
                    <input
                      type="text"
                      value={adminCode}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.primaryEmailAddress?.emailAddress || ''}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <button style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    border: '1px solid #555555',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    marginRight: 12
                  }}>
                    UPDATE PROFILE
                  </button>

                  <button style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid #333333',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14
                  }}>
                    CHANGE PASSWORD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      color: '#ffffff' 
    }}>
      {/* Header */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>⚫ AdminHub</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>System Control Center</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{adminName}</div>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#10b981' 
            }}></div>
            <button
              onClick={() => window.location.href = '/logout'}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                border: '1px solid #555555',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '0 24px',
        overflowX: 'auto'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as AdminSection)}
                style={{
                  padding: '12px 16px',
                  background: activeSection === section.id ? '#ffffff' : 'transparent',
                  color: activeSection === section.id ? '#000000' : '#ffffff',
                  border: 'none',
                  borderBottom: activeSection === section.id ? '2px solid #ffffff' : '2px solid transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {renderSectionContent()}
      </div>
    </div>
  );
}