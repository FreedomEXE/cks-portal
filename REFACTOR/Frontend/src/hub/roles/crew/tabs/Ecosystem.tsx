/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Ecosystem.tsx
 * 
 * Description: Crew ecosystem view showing fellow team members and center info
 * Function: Display team structure and facility information
 * Importance: Critical - Allows crew to see their work environment and colleagues
 * Connects to: Center API, crew management, team coordination
 */

import React, { useState, useEffect } from 'react';

interface EcosystemProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Off Duty' | 'Break';
  shift: string;
}

interface CenterInfo {
  name: string;
  location: string;
  supervisor: string;
}

export default function Ecosystem({ userId, config, features, api }: EcosystemProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEcosystemData = async () => {
      try {
        setLoading(true);
        
        setCenterInfo({
          name: 'Downtown Service Center',
          location: '123 Main Street, Business District',
          supervisor: 'Alex Johnson'
        });
        
        const mockTeamMembers: TeamMember[] = [
          {
            id: 'CREW-001',
            name: 'Alex Johnson',
            role: 'Team Lead',
            status: 'Active',
            shift: 'Morning (6AM-2PM)'
          },
          {
            id: 'CREW-002',
            name: 'Maria Rodriguez',
            role: 'Cleaning Specialist',
            status: 'Active',
            shift: 'Morning (6AM-2PM)'
          },
          {
            id: 'CREW-003',
            name: 'David Chen',
            role: 'Maintenance Tech',
            status: 'Break',
            shift: 'Day (8AM-4PM)'
          },
          {
            id: 'CREW-005',
            name: 'Lisa Park',
            role: 'Cleaning Specialist',
            status: 'Active',
            shift: 'Day (8AM-4PM)'
          }
        ];
        
        setTeamMembers(mockTeamMembers);
        
      } catch (error) {
        console.error('Error loading ecosystem data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEcosystemData();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Break': return '#f59e0b';
      case 'Off Duty': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading team information...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Team</h2>
      
      {/* Center Info */}
      {centerInfo && (
        <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#10b981' }}>Work Location</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Center:</strong> {centerInfo.name}</div>
            <div><strong>Address:</strong> {centerInfo.location}</div>
            <div><strong>Supervisor:</strong> {centerInfo.supervisor}</div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#10b981' }}>Team Members</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {teamMembers.map(member => (
              <div key={member.id} style={{
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                      {member.name}
                    </h4>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {member.role} • {member.shift}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: getStatusColor(member.status),
                    color: 'white'
                  }}>
                    {member.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}