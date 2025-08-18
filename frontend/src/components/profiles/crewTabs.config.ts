/**
 * CKS Portal — Crew Profile Tabs Config (initial stub)
 * Extracted from inline config in CrewHub for reuse.
 */
export type ProfileTab = { label: string; columns: { key: string; label: string }[] };

export const crewTabsConfig: ProfileTab[] = [
  { label: "Profile", columns: [
    { key: "full-name", label: "Full Name" },
    { key: "reports-to", label: "Reports To" },
    { key: "crew-id", label: "Crew ID" },
    { key: "role", label: "Role" },
    { key: "start-date", label: "Start Date" },
    { key: "years-with-company", label: "Years with Company" },
    { key: "primary-region", label: "Primary Region" },
    { key: "email", label: "Email" },
    { key: "languages", label: "Languages" },
    { key: "phone", label: "Phone" },
    { key: "emergency-contact", label: "Emergency Contact" },
    { key: "home-address", label: "Home Address" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "status", label: "Status" },
    { key: "availability", label: "Availability" },
    { key: "preferred-areas", label: "Preferred Areas" },
    { key: "qr-code", label: "QR Code" },
    { key: "synced", label: "Synced with Portal" },
  ] },
  { label: "Centers", columns: [
    { key: "center-id", label: "Center ID" },
    { key: "center-name", label: "Center Name" },
    { key: "role", label: "Role" },
    { key: "procedures", label: "Procedures" },
    { key: "assigned-since", label: "Assigned Since" },
    { key: "status", label: "Status" },
  ] },
  { label: "Services", columns: [
    { key: "service-id", label: "Service ID" },
    { key: "service-name", label: "Service Name" },
    { key: "experience", label: "Experience (Years)" },
    { key: "proficiency", label: "Proficiency" },
    { key: "certifications", label: "Certifications" },
  ] },
  { label: "Jobs", columns: [
    { key: "job-id", label: "Job ID" },
    { key: "service-name", label: "Service Name" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
  ] },
  { label: "Supplies/Equipment", columns: [
    { key: "item", label: "Item" },
    { key: "issued", label: "Issued" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status" },
    { key: "condition", label: "Condition" },
    { key: "notes", label: "Notes" },
  ] },
  { label: "Training", columns: [
    { key: "training-id", label: "Training ID" },
    { key: "service", label: "Service" },
    { key: "date-completed", label: "Date Completed" },
    { key: "last-refresher", label: "Last Refresher" },
    { key: "expires-on", label: "Expires On" },
    { key: "type", label: "Type" },
    { key: "days-to-complete", label: "Days to Complete" },
    { key: "status", label: "Status" },
  ] },
  { label: "Performance", columns: [
    { key: "performance-id", label: "Performance ID" },
    { key: "reviewed-by", label: "Reviewed By" },
    { key: "year", label: "Year" },
    { key: "reliability-score", label: "Reliability Score (%)" },
    { key: "avg-rating", label: "Avg Rating" },
    { key: "feedback-incidents", label: "Feedback Incidents" },
    { key: "notes", label: "Notes" },
  ] },
];

export default crewTabsConfig;
