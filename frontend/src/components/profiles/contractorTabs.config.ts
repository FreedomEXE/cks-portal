/**
 * CKS Portal — Contractor Profile Tabs Config (initial stub)
 * Extracted from inline config in ContractorHub for reuse.
 */
export type ProfileTab = { label: string; columns: { key: string; label: string }[] };

export const contractorTabsConfig: ProfileTab[] = [
  { label: "Profile", columns: [
    { key: "contractor-id", label: "Contractor ID" },
    { key: "company-name", label: "Company Name" },
    { key: "address", label: "Address" },
    { key: "cks-manager", label: "CKS Manager" },
    { key: "main-contact", label: "Main Contact" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "years-with-cks", label: "Years with CKS" },
    { key: "num-customers", label: "# of Customers" },
    { key: "contract-start-date", label: "Contract Start Date" },
    { key: "status", label: "Status" },
    { key: "services-specialized-in", label: "Services Specialized In" },
  ] },
  { label: "Customers", columns: [
    { key: "customer-id", label: "Customer ID" },
    { key: "customer-name", label: "Customer Name" },
    { key: "customer-type", label: "Customer Type" },
    { key: "start-date", label: "Start Date" },
    { key: "status", label: "Status" },
  ] },
  { label: "Centers", columns: [
    { key: "center-id", label: "Center ID" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "location", label: "Location" },
    { key: "start-date", label: "Start Date" },
    { key: "active", label: "Active" },
  ] },
  { label: "Services", columns: [
    { key: "service", label: "Service" },
    { key: "type", label: "Type" },
    { key: "jobs-completed", label: "Jobs Completed" },
  ] },
  { label: "Crew", columns: [
    { key: "crew-id", label: "Crew ID" },
    { key: "center-id", label: "Center ID" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ] },
  { label: "Contracts Info", columns: [
    { key: "id", label: "ID" },
    { key: "customer-name", label: "Customer Name" },
    { key: "contract-start-date", label: "Contract Start Date" },
    { key: "contract-end-date", label: "Contract End Date" },
    { key: "renewal-status", label: "Renewal Status" },
    { key: "next-review-date", label: "Next Review Date" },
    { key: "notes", label: "Notes" },
  ] },
];

export default contractorTabsConfig;
