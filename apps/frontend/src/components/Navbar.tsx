import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useAppState } from '../context/AppContext';
import { Car, Menu, X, LogOut, LayoutDashboard, User as UserIcon, MessageSquare, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { platformName, unreadNotificationCount } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'super_admin': return '/dashboard/super-admin';
      case 'owner': return '/dashboard/owner';
      case 'admin': return '/dashboard/admin-sistem';
      default: return '/dashboard/customer';
    }
  };

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/katalog-kendaraan', label: 'Katalog Mobil' },
    { to: '/katalog-sparepart', label: 'Suku Cadang' },
    { to: '/articles', label: 'Artikel & Edukasi' },
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center text-white shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight">
                {platformName}
              </span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'border-green-600 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Chat and Notif badges if Customer */}
                {user?.role === 'customer' && (
                  <>
                    <Link to="/dashboard/customer?tab=chat" className="text-slate-500 hover:text-slate-900 relative p-1 rounded-full hover:bg-slate-50">
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                    <Link to="/dashboard/customer?tab=notifications" className="text-slate-500 hover:text-slate-900 relative p-1 rounded-full hover:bg-slate-50">
                      <Bell className="w-5 h-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <div className="h-5 w-[1px] bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-xs transition-all duration-150"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-hidden"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white shadow-lg animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.to)
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-100 px-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 uppercase font-mono">{user?.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  to="/auth?mode=register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
