'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProfileSection from '@/components/ProfileSection';
import AccountSection from '@/components/AccountSection';
import NotificationsSection from '@/components/NotificationsSection';
import PrivacySection from '@/components/PrivacySection';
import MembershipSection from '@/components/MembershipSection';
import PlaceholderSection from '@/components/PlaceholderSection';

const tabs = [
  { key: 'profile', label: 'Perfil' },
  { key: 'account', label: 'Cuenta' },
  { key: 'membership', label: 'Membresía' },
  { key: 'notifications', label: 'Notificaciones' },
  { key: 'privacy', label: 'Privacidad' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-casaCream">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-casaCoffee/10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-heading font-semibold text-casaCoffee">Configuración</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar tabs */}
        <nav className="md:w-56 flex-shrink-0">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveSection(tab.key)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === tab.key
                      ? 'bg-casaOlive text-white font-semibold'
                      : 'text-casaCoffee hover:bg-casaCoffee/10'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="flex-1">
          {activeSection === 'profile' && <ProfileSection />}
          {activeSection === 'account' && <AccountSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'privacy' && <PrivacySection />}
          {activeSection === 'membership' && <MembershipSection />}
          {activeSection === 'placeholder' && <PlaceholderSection />}
        </main>
      </div>
    </div>
  );
}