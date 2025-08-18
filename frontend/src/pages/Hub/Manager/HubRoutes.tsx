import React from 'react';
import { useLocation } from 'react-router-dom';
import HubShell from './HubShell';
import HubHome from './HubHome';
import ProfilePage from './Profile/ProfilePage';
import CentersPage from './Centers/CentersPage';
import ServicesPage from './Services/ServicesPage';
import JobsPage from './Jobs/JobsPage';
import ReportsPage from './Reports/ReportsPage';
import DocumentsPage from './Documents/DocumentsPage';
import SupportPage from './Support/SupportPage';

export default function ManagerHubRoutes() {
  const { pathname } = useLocation();
  // Expecting mount at /:username/hub/*
  const parts = pathname.split('/').filter(Boolean);
  const sub = parts.slice(3).join('/') || '';

  let body: React.ReactNode = <HubHome />;
  if (sub.startsWith('profile')) body = <ProfilePage />;
  else if (sub.startsWith('centers')) body = <CentersPage />;
  else if (sub.startsWith('services')) body = <ServicesPage />;
  else if (sub.startsWith('jobs')) body = <JobsPage />;
  else if (sub.startsWith('reports')) body = <ReportsPage />;
  else if (sub.startsWith('documents')) body = <DocumentsPage />;
  else if (sub.startsWith('support')) body = <SupportPage />;

  return <HubShell>{body}</HubShell>;
}
