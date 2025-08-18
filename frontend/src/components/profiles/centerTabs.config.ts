/**
 * CKS Portal — Center Profile Tabs Config
 *
 * Purpose: Single source of truth for Center profile tabs/fields.
 * Used by CenterHub (owner view) and CenterProfile (read-only or role-filtered view).
 *
 * Change summary (Aug 2025): Extracted from inline config in `src/pages/Hubs/CenterHub.tsx`.
 */

export type ProfileTab = {
  label: string;
  columns: { key: string; label: string }[];
};

export const centerTabsConfig: ProfileTab[] = [
  {
    label: "Profile",
    columns: [
      { key: "center-id", label: "Center ID" },
      { key: "name", label: "Name" },
      { key: "address", label: "Address" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "website", label: "Website" },
      { key: "socials", label: "Socials" },
      { key: "manager-id", label: "Manager ID" },
      { key: "supervisor-id", label: "Supervisor ID" },
      { key: "contractor-id", label: "Contractor ID" },
      { key: "customer-id", label: "Customer ID" },
      { key: "service-start-date", label: "Service Start Date" },
      { key: "status", label: "Status" },
      { key: "services-active", label: "Services Active" },
      { key: "service-frequency", label: "Service Frequency" },
      { key: "notes", label: "Notes" },
    ],
  },
  {
    label: "Services",
    columns: [
      { key: "service-id", label: "Service ID" },
      { key: "name", label: "Name" },
      { key: "frequency", label: "Frequency" },
      { key: "assigned-crew", label: "Assigned Crew" },
      { key: "custom-procedure", label: "Custom Procedure" },
      { key: "notes", label: "Notes" },
    ],
  },
  {
    label: "Jobs",
    columns: [
      { key: "job-id", label: "Job ID" },
      { key: "date", label: "Date" },
      { key: "job-type", label: "Job Type" },
    ],
  },
  {
    label: "Crew",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "start-date", label: "Start Date" },
      { key: "shift", label: "Shift" },
      { key: "duties", label: "Duties" },
      { key: "custom-procedure", label: "Custom Procedure" },
      { key: "frequency", label: "Frequency" },
      { key: "notes", label: "Notes" },
    ],
  },
];

export default centerTabsConfig;
