import React from 'react';
import { UserRole } from '../types';
import {
  Users,
  Settings,
  ShieldAlert,
  Mail,
  TrendingUp,
  CreditCard,
  FileText,
  Car,
  CalendarCheck,
  MessageSquare,
  BadgeAlert,
  Bell,
  CheckCircle,
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab }) => {
  // Define menus for each role
  const menus: Record<UserRole, { id: string; label: string; icon: React.ComponentType<any> }[]> = {
    super_admin: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'settings', label: 'Platform Settings', icon: Settings },
      { id: 'audit', label: 'Audit Log', icon: ShieldAlert },
      { id: 'email', label: 'Email Logs', icon: Mail },
    ],
    owner: [
      { id: 'insights', label: 'Tracking Insight', icon: TrendingUp },
      { id: 'transactions', label: 'Approval Queue', icon: CreditCard },
      { id: 'leads', label: 'Leads Report', icon: FileText },
    ],
    admin: [
      { id: 'products', label: 'Product Management', icon: Car },
      { id: 'visits', label: 'Inspeksi & Kunjungan', icon: CalendarCheck },
      { id: 'chat', label: 'Chat Realtime', icon: MessageSquare },
      { id: 'payments', label: 'Verifikasi Pembayaran', icon: BadgeAlert },
      { id: 'articles', label: 'Article Management', icon: FileText },
      { id: 'leads_admin', label: 'Kelola Leads', icon: Users },
    ],
    customer: [
      { id: 'transactions', label: 'Riwayat Transaksi', icon: CreditCard },
      { id: 'visits', label: 'Riwayat Kunjungan', icon: CalendarCheck },
      { id: 'notifications', label: 'Notifikasi', icon: Bell },
      { id: 'chat', label: 'Chat dengan Admin', icon: MessageSquare },
    ],
  };

  const currentMenu = menus[role] || [];

  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-100 flex-shrink-0 md:h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-400">
          Menu Navigasi
        </p>
        <p className="text-sm font-bold text-slate-800 capitalize mt-1">
          {role.replace('_', ' ')} Panel
        </p>
      </div>
      <nav className="p-2 space-y-1">
        {currentMenu.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all-300 ${
                isSelected
                  ? 'bg-green-50 text-green-700 font-semibold border-l-4 border-green-600 rounded-l-none pl-2.5'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
