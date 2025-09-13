/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crew.ts
 * 
 * Description: Crew-specific API client for backend communication
 * Function: Provides crew-specific API calls and data fetching
 * Importance: Critical - Primary API interface for Crew hub
 * Connects to: Crew backend endpoints, authentication, data hooks
 * 
 * Notes: Crew-specific version of manager API client.
 *        Handles crew operations, job management, and team coordination.
 *        Isolated from other role APIs for security and maintainability.
 */

import { buildCrewApiUrl, crewApiFetch } from '../utils/crewApi';

// Crew profile management
export async function getCrewProfile(crewId: string) {
  const url = buildCrewApiUrl('/profile', { code: crewId });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew profile: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateCrewProfile(crewId: string, profileData: any) {
  const url = buildCrewApiUrl('/profile');
  const response = await crewApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update crew profile: ${response.status}`);
  }
  
  return await response.json();
}

// Team and member management
export async function getCrewMembers(crewId: string) {
  const url = buildCrewApiUrl('/members', { code: crewId });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew members: ${response.status}`);
  }
  
  return await response.json();
}

export async function addCrewMember(crewId: string, memberData: any) {
  const url = buildCrewApiUrl('/members');
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...memberData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add crew member: ${response.status}`);
  }
  
  return await response.json();
}

export async function removeCrewMember(crewId: string, memberId: string) {
  const url = buildCrewApiUrl(`/members/${memberId}`);
  const response = await crewApiFetch(url, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to remove crew member: ${response.status}`);
  }
  
  return await response.json();
}

// Job and task management
export async function getCrewJobs(crewId: string, filters: any = {}) {
  const url = buildCrewApiUrl('/jobs', { code: crewId, ...filters });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew jobs: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateJobStatus(jobId: string, status: string, notes?: string) {
  const url = buildCrewApiUrl(`/jobs/${jobId}/status`);
  const response = await crewApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update job status: ${response.status}`);
  }
  
  return await response.json();
}

export async function reportJobIssue(jobId: string, issueData: any) {
  const url = buildCrewApiUrl(`/jobs/${jobId}/issues`);
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issueData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to report job issue: ${response.status}`);
  }
  
  return await response.json();
}

// Equipment management
export async function getCrewEquipment(crewId: string) {
  const url = buildCrewApiUrl('/equipment', { code: crewId });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew equipment: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateEquipmentStatus(equipmentId: string, status: string, notes?: string) {
  const url = buildCrewApiUrl(`/equipment/${equipmentId}/status`);
  const response = await crewApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update equipment status: ${response.status}`);
  }
  
  return await response.json();
}

export async function requestEquipmentMaintenance(equipmentId: string, maintenanceData: any) {
  const url = buildCrewApiUrl(`/equipment/${equipmentId}/maintenance`);
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(maintenanceData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to request equipment maintenance: ${response.status}`);
  }
  
  return await response.json();
}

// Schedule and availability
export async function getCrewSchedule(crewId: string, startDate?: string, endDate?: string) {
  const params = { code: crewId };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const url = buildCrewApiUrl('/schedule', params);
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew schedule: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateCrewAvailability(crewId: string, availabilityData: any) {
  const url = buildCrewApiUrl('/availability');
  const response = await crewApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...availabilityData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update crew availability: ${response.status}`);
  }
  
  return await response.json();
}

// Performance and metrics
export async function getCrewMetrics(crewId: string, period: string = '30d') {
  const url = buildCrewApiUrl('/metrics', { code: crewId, period });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew metrics: ${response.status}`);
  }
  
  return await response.json();
}

export async function getCrewPerformance(crewId: string, memberId?: string) {
  const params = { code: crewId };
  if (memberId) params.member_id = memberId;
  
  const url = buildCrewApiUrl('/performance', params);
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew performance: ${response.status}`);
  }
  
  return await response.json();
}

// Activity and communications
export async function getCrewActivity(crewId: string, limit: number = 5) {
  const url = buildCrewApiUrl('/activity', { code: crewId, limit });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }
  
  return await response.json();
}

export async function clearCrewActivity(crewId: string) {
  const url = buildCrewApiUrl('/clear-activity', { code: crewId });
  const response = await crewApiFetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to clear activity: ${response.status}`);
  }
  
  return await response.json();
}

export async function sendCrewMessage(crewId: string, messageData: any) {
  const url = buildCrewApiUrl('/messages');
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...messageData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send crew message: ${response.status}`);
  }
  
  return await response.json();
}

// Training and certifications
export async function getCrewTraining(crewId: string) {
  const url = buildCrewApiUrl('/training', { code: crewId });
  const response = await crewApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crew training: ${response.status}`);
  }
  
  return await response.json();
}

export async function recordTrainingCompletion(crewId: string, trainingData: any) {
  const url = buildCrewApiUrl('/training/complete');
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...trainingData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to record training completion: ${response.status}`);
  }
  
  return await response.json();
}

// Emergency and safety
export async function reportSafetyIncident(crewId: string, incidentData: any) {
  const url = buildCrewApiUrl('/safety/incidents');
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...incidentData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to report safety incident: ${response.status}`);
  }
  
  return await response.json();
}

export async function requestEmergencySupport(crewId: string, requestData: any) {
  const url = buildCrewApiUrl('/emergency/support');
  const response = await crewApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crew_id: crewId, ...requestData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to request emergency support: ${response.status}`);
  }
  
  return await response.json();
}