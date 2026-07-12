import React from 'react';
import { Navbar } from './Navbar';
import { ChatWidget } from './ChatWidget';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Floating Chat & WhatsApp Action Widgets */}
      <ChatWidget />
      
      {/* Humid/Simple Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-500">LCS Platform — Sistem Jual Beli Kendaraan & Suku Cadang Terpercaya</p>
          <p>© 2026 LCS Motor. Semua hak dilindungi. Transaksi aman, transparan, anti-penipuan.</p>
        </div>
      </footer>
    </div>
  );
};
