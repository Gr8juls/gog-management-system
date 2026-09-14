import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GOG TECH HOUSE | Production & Inventory Management System',
  description: 'Complete production and inventory management system for GOG TECH HOUSE Printing & Branding',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060d19] text-slate-100 antialiased selection:bg-[#00adef] selection:text-white">
        {children}
      </body>
    </html>
  );
}
