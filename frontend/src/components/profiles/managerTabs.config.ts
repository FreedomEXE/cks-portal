/**
TRACE
OutboundImports: none (plain config file)
InboundUsedBy: frontend/src/components/ProfileTabs.tsx, frontend/src/pages/Hubs/Manager/ManagerProfile.tsx
+ProvidesData: tabs[] configuration (label + columns[])
+ConsumesData: none (export only)
+SideEffects: none
+RoleBranching: none (static config)
+CriticalForManagerProfile: yes (drives which tabs & columns are shown)
+SimplificationRisk: low/med (lots of fields; can be trimmed for manager-only view)
+*/

/**
 * CKS Portal  Manager Profile Tabs Config (initial)
 * Built from Ecosystem Files CSV headers for MGR-001.
 */
export type ProfileTab = { label: string; columns: { key: string; label: string }[] };

export const managerTabsConfig: ProfileTab[] = [
  { label: "Profile", columns: [
    { key: "full-name", label: "Full Name" },
    { key: "reports-to", label: "Reports To" },
  { key: "manager-id", label: "Manager ID" },
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
  ]},
  { label: "Centers", columns: [
    { key: "center-id", label: "Center ID" },
    { key: "center-name", label: "Center Name" },
    { key: "role", label: "Role" },
    { key: "procedures", label: "Procedures" },
    { key: "assigned-since", label: "Assigned Since" },
    { key: "status", label: "Status" },
  ]},
  { label: "Crew", columns: [
    { key: "crew-id", label: "Crew ID" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "start-date", label: "Start Date" },
    { key: "shift", label: "Shift" },
    { key: "duties", label: "Duties" },
    { key: "custom-procedure", label: "Custom Procedure" },
    { key: "frequency", label: "Frequency" },
    { key: "notes", label: "Notes" },
  ]},
  { label: "Services", columns: [
    { key: "service-id", label: "Service ID" },
    { key: "service-name", label: "Service Name" },
    { key: "experience", label: "Experience (Years)" },
    { key: "proficiency", label: "Proficiency" },
    { key: "certifications", label: "Certifications" },
  ]},
  { label: "Jobs", columns: [
    { key: "job-id", label: "Job ID" },
    { key: "service-name", label: "Service Name" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
  ]},
  { label: "Training", columns: [
    { key: "training-id", label: "Training ID" },
    { key: "service", label: "Service" },
    { key: "date-completed", label: "Date Completed" },
    { key: "last-refresher", label: "Last Refresher" },
    { key: "expires-on", label: "Expires On" },
    { key: "type", label: "Type" },
    { key: "days-to-complete", label: "Days to Complete" },
    { key: "status", label: "Status" },
  ]},
  { label: "Performance", columns: [
    { key: "performance-id", label: "Performance ID" },
    { key: "reviewed-by", label: "Reviewed By" },
    { key: "year", label: "Year" },
    { key: "reliability-score", label: "Reliability Score (%)" },
    { key: "avg-rating", label: "Avg Rating" },
    { key: "feedback-incidents", label: "Feedback Incidents" },
    { key: "notes", label: "Notes" },
  ]},
  { label: "Supplies/Equipment", columns: [
    { key: "item", label: "Item" },
    { key: "issued", label: "Issued" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status" },
    { key: "condition", label: "Condition" },
    { key: "notes", label: "Notes" },
  ]},
];

export default managerTabsConfig;

// MANAGER_TABS_CONFIG_REQUIREMENTS // ExpectedTabIds: profile, centers, crew, services, jobs, training, performance, supplies-equipment // TabHeadings: Profile -> [Full Name, Reports To, Manager ID, Role, Start Date, Years with Company, Primary Region, Email, Languages, Phone, Emergency Contact, Home Address, LinkedIn, Status, Availability, Preferred Areas, QR Code, Synced], Centers -> [Center ID, Center Name, Role, Procedures, Assigned Since, Status], Crew -> [Crew ID, Name, Role, Status, Start Date, Shift, Duties, Custom Procedure, Frequency, Notes], Services -> [Service ID, Service Name, Experience, Proficiency, Certifications], Jobs -> [Job ID, Service Name, Date, Status, Notes], Training -> [Training ID, Service, Date Completed, Last Refresher, Expires On, Type, Days to Complete, Status], Performance -> [Performance ID, Reviewed By, Year, Reliability Score, Avg Rating, Feedback Incidents, Notes], Supplies/Equipment -> [Item, Issued, Location, Status, Condition, Notes] // MissingOrUnused: none identified in config file itself
