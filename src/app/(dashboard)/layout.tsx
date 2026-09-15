'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
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

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d19] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0c1f3d] to-[#081528] border border-[#00adef]/40 flex items-center justify-center shadow-xl shadow-[#00adef]/20 animate-pulse">
              <img
                src="/logo-icon.png"
                alt="GOG Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_10px_rgba(0,173,239,0.5)]"
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
    <div className="min-h-screen bg-[#060d19] flex relative">
      {/* Sidebar: Docked on lg+, Drawer on <lg */}
      <Sidebar
        userRole={user?.role}
        userName={user?.name}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen min-w-0 transition-all duration-300">
        <Topbar
          currentUser={user}
          onRoleSwitched={fetchUser}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#060d19]/80 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
