
import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import NewsPreview from '../../../components/NewsPreview';
import useMeProfile from '../../../hooks/useMeProfile';
import { deriveCodeFrom, displayNameFrom } from '../../../utils/profileCode';
import { useNavigate, useParams } from 'react-router-dom';

const navLinks = [
  { to: 'profile', label: 'My Profile' },
  { to: 'centers', label: 'My Centers' },
  { to: 'services', label: 'My Services' },
  { to: 'jobs', label: 'My Jobs' },
  { to: 'reports', label: 'My Reports' },
  { to: 'documents', label: 'My Documents' },
  { to: 'support', label: 'My Support' },
];

export default function HubHome() {
  const { kind, data, loading } = useMeProfile();
  const displayName = displayNameFrom(kind, data) || 'Manager';
  const code = deriveCodeFrom(kind, data) || '';
  const { username = '' } = useParams();
  const navigate = useNavigate();

  return (
    <div className="grid gap-6">
      <Card className="p-6 flex flex-col gap-2 shadow-card">
        <div className="text-base sm:text-lg font-semibold mb-1">
          {loading ? 'Loading…' : `Welcome, ${displayName}${code ? ` (${code})` : ''}!`}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          {navLinks.map(({ to, label }) => (
            <Button
              key={to}
              variant="ghost"
              className="rounded-2xl border border-ink-200 bg-white shadow-soft px-5 py-2 text-base font-medium hover:bg-ink-50 transition"
              onClick={() => navigate(to)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <NewsPreview code={code} limit={3} showUnread />
      </Card>
    </div>
  );
}
