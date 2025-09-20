import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import Login from '@cks-auth/pages/Login';
import AdminHub from './hubs/AdminHub';
import ManagerHub from './hubs/ManagerHub';
import ContractorHub from './hubs/ContractorHub';
import CustomerHub from './hubs/CustomerHub';
import CenterHub from './hubs/CenterHub';
import CrewHub from './hubs/CrewHub';
import WarehouseHub from './hubs/WarehouseHub';

const hubComponents = {
  admin: AdminHub,
  manager: ManagerHub,
  contractor: ContractorHub,
  customer: CustomerHub,
  center: CenterHub,
  crew: CrewHub,
  warehouse: WarehouseHub,
} as const;

type HubKey = keyof typeof hubComponents;

type HubComponentProps = {
  initialTab?: string;
};

function RoleHubRoute() {
  const { role } = useParams<{ role?: string }>();
  const [searchParams] = useSearchParams();

  if (!role || !(role in hubComponents)) {
    return <Navigate to="/login" replace />;
  }

  const HubComponent = hubComponents[role as HubKey] as ComponentType<HubComponentProps>;
  const initialTab = searchParams.get('tab') ?? undefined;

  return <HubComponent initialTab={initialTab} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/:role/hub" element={<RoleHubRoute />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
