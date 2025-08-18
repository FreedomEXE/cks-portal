/**
 * CKS Portal — Customer Profile Tabs Config (initial stub)
 * Extracted from inline config in CustomerHub for reuse.
 */
export type ProfileTab = { label: string; columns: { key: string; label: string }[] };

export const customerTabsConfig: ProfileTab[] = [
  { label: "Profile", columns: [
    { key: "customer-id", label: "Customer ID" },
    { key: "company-name", label: "Company Name" },
    { key: "address", label: "Address" },
    { key: "cks-manager", label: "CKS Manager" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "main-contact", label: "Main Contact" },
    { key: "website", label: "Website" },
    { key: "years-with-cks", label: "Years with CKS" },
    { key: "num-centers", label: "# of Centers" },
    { key: "contract-start-date", label: "Contract Start Date" },
    { key: "status", label: "Status" },
  ] },
  { label: "Centers", columns: [
    { key: "center-id", label: "Center ID" },
    { key: "center-name", label: "Center Name" },
    { key: "address", label: "Address" },
    { key: "center-manager", label: "Center Manager" },
    { key: "services-active", label: "Services Active" },
  ] },
  { label: "Services", columns: [
    { key: "year", label: "Year" },
    { key: "center", label: "Center" },
    { key: "service-id", label: "Serrvice ID" },
    { key: "renewal-date", label: "Renewal Date" },
    { key: "custom-procedure", label: "Custom Procedure" },
    { key: "contract-description", label: "Contract Description" },
  ] },
  { label: "Jobs", columns: [
    { key: "job-id", label: "Job ID" },
    { key: "date", label: "Date" },
    { key: "center", label: "Center" },
    { key: "job-type", label: "Job Type" },
  ] },
  { label: "Crew", columns: [
    { key: "crew-id", label: "Crew ID" },
    { key: "center-id", label: "Center ID" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
  ] },
];

export default customerTabsConfig;
