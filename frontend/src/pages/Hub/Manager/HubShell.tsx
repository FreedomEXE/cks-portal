import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { UserButton } from '@clerk/clerk-react';

type Props = { children?: React.ReactNode };

export default function HubShell({ children }: Props) {
  const { username = '' } = useParams();
  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src="/cks-logo.png" alt="CKS" className="w-8 h-8" />
          <div className="text-xl font-semibold text-ink-800">Manager Hub</div>
          <div className="text-sm text-ink-500">/{username}</div>
        </div>
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>

      <Card className="mb-4">
        <nav className="flex flex-wrap gap-1 p-2">
          {[
            ['.', 'Home'],
            ['profile', 'Profile'],
            ['centers', 'Centers'],
            ['services', 'Services'],
            ['jobs', 'Jobs'],
            ['reports', 'Reports'],
            ['documents', 'Documents'],
            ['support', 'Support'],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `px-3 py-1.5 rounded-xl text-sm ${isActive ? 'bg-ink-50 text-ink-900' : 'text-ink-700 hover:bg-ink-50'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </Card>

  {children}
    </div>
  );
}
