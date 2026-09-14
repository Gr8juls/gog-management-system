'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          // If no session, auto-login with Admin for smooth review or redirect to login
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0c1f3d] to-[#081528] border border-[#00adef]/40 flex items-center justify-center shadow-xl shadow-[#00adef]/20 animate-pulse">
              <img
                src="/logo-icon.png"
                alt="GOG Logo"
                className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(0,173,239,0.5)]"
              />
            </div>
            <div className="absolute -inset-2 border-2 border-[#00adef] border-t-transparent rounded-2xl animate-spin"></div>
          </div>
          <p className="text-xs text-[#38c8ff] font-medium tracking-wide">Loading GOG TECH HOUSE System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d19] flex">
      {/* Left Sidebar */}
      <Sidebar userRole={user?.role} userName={user?.name} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar currentUser={user} onRoleSwitched={fetchUser} />
        <main className="flex-1 p-6 lg:p-8 bg-[#060d19]/80 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
