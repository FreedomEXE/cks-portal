import ProfileTabs from "../../../components/ProfileTabs";
import managerTabsConfig from "../../../components/profiles/managerTabs.config";

export default function ManagerProfile({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div>
      {/* No header card per recent requirement; only tabs and table headings */}
      <ProfileTabs
        tabs={managerTabsConfig}
        subject={{ kind: 'manager', code: data?.manager_id, name: data?.name }}
      />
    </div>
  );
}
