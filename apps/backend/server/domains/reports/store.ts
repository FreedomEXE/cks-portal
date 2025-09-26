import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubRole } from '../profile/types';

export interface ReportItem {
  id: string;
  type: 'report' | 'feedback';
  category: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'open' | 'closed' | 'in-progress';
  relatedService?: string | null;
  acknowledgments?: Array<{ userId: string; date: string }>;
  tags?: string[];
}

export interface HubReportsPayload {
  role: HubRole;
  cksCode: string;
  reports: ReportItem[];
  feedback: ReportItem[];
  // ...existing code...
}

async function getManagerReports(cksCode: string): Promise<HubReportsPayload> {
  // Manager sees all reports from their customers and centers
  const reportsResult = await query<any>(
    `SELECT r.* FROM reports r
     WHERE r.customer_id IN (
       SELECT customer_id FROM customers WHERE UPPER(cks_manager) = $1
     ) OR r.center_id IN (
       SELECT center_id FROM centers WHERE UPPER(cks_manager) = $1
     )
     ORDER BY r.created_at DESC NULLS LAST`,
    [cksCode],
  );

  const reports: ReportItem[] = reportsResult.rows.map(row => ({
    id: row.id,
    type: row.kind === 'feedback' ? 'feedback' : 'report',
    category: row.severity ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.customer_id ?? row.center_id ?? 'Unknown',
    submittedDate: row.created_at,
    status: row.status ?? 'open',
    relatedService: row.service_id,
    tags: row.tags ? row.tags.split(',') : [],
  }));

  return {
    role: 'manager',
    cksCode,
    reports: reports.filter(r => r.type === 'report'),
    feedback: reports.filter(r => r.type === 'feedback'),
  };
}

async function getCustomerReports(cksCode: string): Promise<HubReportsPayload> {
  const reportsResult = await query<any>(
    `SELECT * FROM reports
     WHERE UPPER(customer_id) = $1
     ORDER BY created_at DESC NULLS LAST`,
    [cksCode],
  );

  const reports: ReportItem[] = reportsResult.rows.map(row => ({
    id: row.id,
    type: row.kind === 'feedback' ? 'feedback' : 'report',
    category: row.severity ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.customer_id ?? 'Unknown',
    submittedDate: row.created_at,
    status: row.status ?? 'open',
    relatedService: row.service_id,
    tags: row.tags ? row.tags.split(',') : [],
  }));

  return {
    role: 'customer',
    cksCode,
    reports: reports.filter(r => r.type === 'report'),
    feedback: reports.filter(r => r.type === 'feedback'),
  };
}

async function getCenterReports(cksCode: string): Promise<HubReportsPayload> {
  const reportsResult = await query<any>(
    `SELECT * FROM reports
     WHERE UPPER(center_id) = $1
     ORDER BY created_at DESC NULLS LAST`,
    [cksCode],
  );

  const reports: ReportItem[] = reportsResult.rows.map(row => ({
    id: row.id,
    type: row.kind === 'feedback' ? 'feedback' : 'report',
    category: row.severity ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.center_id ?? 'Unknown',
    submittedDate: row.created_at,
    status: row.status ?? 'open',
    relatedService: row.service_id,
    tags: row.tags ? row.tags.split(',') : [],
  }));

  return {
    role: 'center',
    cksCode,
    reports: reports.filter(r => r.type === 'report'),
    feedback: reports.filter(r => r.type === 'feedback'),
  };
}

async function getContractorReports(cksCode: string): Promise<HubReportsPayload> {
  // Contractor sees reports from their centers
  const reportsResult = await query<any>(
    `SELECT r.* FROM reports r
     WHERE r.center_id IN (
       SELECT center_id FROM centers WHERE UPPER(contractor_id) = $1
     )
     ORDER BY r.created_at DESC NULLS LAST`,
    [cksCode],
  );

  const reports: ReportItem[] = reportsResult.rows.map(row => ({
    id: row.id,
    type: row.kind === 'feedback' ? 'feedback' : 'report',
    category: row.severity ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.center_id ?? 'Unknown',
    submittedDate: row.created_at,
    status: row.status ?? 'open',
    relatedService: row.service_id,
    tags: row.tags ? row.tags.split(',') : [],
  }));

  return {
    role: 'contractor',
    cksCode,
    reports: reports.filter(r => r.type === 'report'),
    feedback: reports.filter(r => r.type === 'feedback'),
  };
}

async function getCrewReports(cksCode: string): Promise<HubReportsPayload> {
  // Crew can only submit feedback, not reports
  const reportsResult = await query<any>(
    `SELECT * FROM reports
     WHERE UPPER(crew_member_id) = $1
     ORDER BY created_at DESC NULLS LAST`,
    [cksCode],
  );

  const reports: ReportItem[] = reportsResult.rows.map(row => ({
    id: row.id,
    type: 'feedback', // Crew only does feedback
    category: row.severity ?? 'General',
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    submittedBy: row.crew_member_id ?? 'Unknown',
    submittedDate: row.created_at,
    status: row.status ?? 'open',
    relatedService: row.service_id,
    tags: row.tags ? row.tags.split(',') : [],
  }));

  return {
    role: 'crew',
    cksCode,
    reports: [],
    feedback: reports,
  };
}

async function getWarehouseReports(cksCode: string): Promise<HubReportsPayload> {
  // Warehouses see reports related to product and service orders they were involved in
  // This will be mapped out in more detail later when we wire and test the entire reports flow
  // Per CKS REPORTS WORKFLOW doc: Warehouses can create feedback only and can resolve reports

  // TODO: Implement proper query once the reports table has proper warehouse linkage
  // The query should:
  // 1. Find all orders (product/service) involving this warehouse
  // 2. Get reports related to those orders via relatedOrder/relatedService fields
  // 3. Also get any feedback submitted by this warehouse

  // For now, return empty arrays to prevent errors
  return {
    role: 'warehouse',
    cksCode,
    reports: [],
    feedback: [],
  };
}

export async function getHubReports(role: HubRole, cksCode: string): Promise<HubReportsPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  switch (role) {
    case 'manager':
      return getManagerReports(normalizedCode);
    case 'customer':
      return getCustomerReports(normalizedCode);
    case 'contractor':
      return getContractorReports(normalizedCode);
    case 'center':
      return getCenterReports(normalizedCode);
    case 'crew':
      return getCrewReports(normalizedCode);
    case 'warehouse':
      return getWarehouseReports(normalizedCode);
    default:
      return null;
  }
}

