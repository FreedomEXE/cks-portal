/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Ecosystem.tsx
 * 
 * Description: Center ecosystem view showing crew and team members
 * Function: Display hierarchy of people working at this center
 * Importance: Critical - Allows center managers to see their team structure
 * Connects to: Center API, crew management, team structure
 * 
 * Notes: Center-focused ecosystem showing only crew members working at this location.
 *        Centers can see crew working at their facility.
 */

import React, { useState, useEffect } from 'react';

interface EcosystemProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Off Duty' | 'Break';
  shift: string;
  specializations: string[];
}

export default function Ecosystem({ userId, config, features, api }: EcosystemProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEcosystemData = async () => {
      try {
        setLoading(true);
        
        // Mock crew data for this center
        const mockCrewMembers: CrewMember[] = [
          {
            id: 'CREW-001',
            name: 'Alex Johnson',
            role: 'Team Lead',
            status: 'Active',
            shift: 'Morning (6AM-2PM)',
            specializations: ['Cleaning', 'Equipment Maintenance']
          },
          {
            id: 'CREW-002',
            name: 'Maria Rodriguez',
            role: 'Cleaning Specialist',
            status: 'Active',
            shift: 'Morning (6AM-2PM)',
            specializations: ['Deep Cleaning', 'Sanitization']
          },
          {
            id: 'CREW-003',
            name: 'David Chen',
            role: 'Maintenance Tech',
            status: 'Break',
            shift: 'Day (8AM-4PM)',
            specializations: ['HVAC', 'Electrical']
          },
          {
            id: 'CREW-004',
            name: 'Sarah Wilson',
            role: 'Security Officer',
            status: 'Active',
            shift: 'Evening (4PM-12AM)',
            specializations: ['Security', 'Safety Protocols']
          },
          {
            id: 'CREW-005',
            name: 'Mike Thompson',
            role: 'Janitor',
            status: 'Off Duty',
            shift: 'Night (10PM-6AM)',
            specializations: ['General Cleaning', 'Waste Management']
          },
          {
            id: 'CREW-006',
            name: 'Lisa Park',
            role: 'Cleaning Specialist',
            status: 'Active',
            shift: 'Day (8AM-4PM)',
            specializations: ['Floor Care', 'Window Cleaning']
          }
        ];
        
        setCrewMembers(mockCrewMembers);
        
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

  const getStatusStats = () => {
    const active = crewMembers.filter(c => c.status === 'Active').length;
    const onBreak = crewMembers.filter(c => c.status === 'Break').length;
    const offDuty = crewMembers.filter(c => c.status === 'Off Duty').length;
    return { active, onBreak, offDuty };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading team information...</div>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Center Team</h2>
      
      {/* Team Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
            {stats.active}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Active Now</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
            {stats.onBreak}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>On Break</div>
        </div>

        <div className="ui-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
            {stats.offDuty}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Off Duty</div>
        </div>
      </div>

      {/* Crew Members List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        {crewMembers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Team Members</div>
            <div style={{ fontSize: 12 }}>Crew assignments will appear here</div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {crewMembers.map(member => (
                <div key={member.id} style={{
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {member.name}
                      </h3>
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

                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    <strong>Specializations:</strong> {member.specializations.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>Status Legend:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
            <span>Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></div>
            <span>On Break</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280' }}></div>
            <span>Off Duty</span>
          </div>
        </div>
      </div>
    </div>
  );
}