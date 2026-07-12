import React, { useState, useEffect } from 'react';
import { useAuth, useAppState } from '../context/AppContext';
import { api } from '../lib/api';
import { User, AuditLog, EmailLog } from '../types';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { Users, Settings, Shield, Mail, Key, ShieldAlert, CheckCircle, ToggleLeft, ToggleRight, Trash2, Plus, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';

export const DashboardSuperAdmin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { platformName, setPlatformName, platformLogoUrl, setPlatformLogoUrl, registrationOpen, setRegistrationOpen } = useAppState();

  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit' | 'email'>('users');

  // Tab: User Management States & Pagination
  const [users, setUsers] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('All');
  const [usersCount, setUsersCount] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create User form state
  const [newUName, setNewUName] = useState('');
  const [newUEmail, setNewUEmail] = useState('');
  const [newUPhone, setNewUPhone] = useState('');
  const [newURole, setNewURole] = useState<'super_admin' | 'owner' | 'admin' | 'customer'>('customer');
  const [newUPass, setNewUPass] = useState('');
  const [createError, setCreateError] = useState('');

  // Tab: Platform Settings
  const [tempPlatName, setTempPlatName] = useState(platformName);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Tab: Audit Logs States & Pagination
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditsCount, setAuditsCount] = useState(0);
  const [isAuditsLoading, setIsAuditsLoading] = useState(false);

  // Tab: Email Logs States & Pagination
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [emailPage, setEmailPage] = useState(1);
  const [emailTotalPages, setEmailTotalPages] = useState(1);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailsCount, setEmailsCount] = useState(0);
  const [isEmailsLoading, setIsEmailsLoading] = useState(false);

  // Fetch Users
  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const qParts = [`page=${userPage}`, `per_page=10`];
      if (userSearch) qParts.push(`search=${encodeURIComponent(userSearch)}`);
      if (userRole !== 'All') qParts.push(`role=${userRole.toLowerCase()}`);
      
      const res = await api.users.list(`?${qParts.join('&')}`);
      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) {
          setUserTotalPages(res.meta.total_pages || 1);
          setUsersCount(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Fetch Audit Logs
  const loadAudits = async () => {
    setIsAuditsLoading(true);
    try {
      const qParts = [`page=${auditPage}`, `per_page=10`];
      if (auditSearch) qParts.push(`search=${encodeURIComponent(auditSearch)}`);
      
      const res = await api.auditLogs.list(`?${qParts.join('&')}`);
      if (res.success && res.data) {
        setAudits(res.data);
        if (res.meta) {
          setAuditTotalPages(res.meta.total_pages || 1);
          setAuditsCount(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditsLoading(false);
    }
  };

  // Fetch Email Logs
  const loadEmails = async () => {
    setIsEmailsLoading(true);
    try {
      const qParts = [`page=${emailPage}`, `per_page=10`];
      if (emailSearch) qParts.push(`search=${encodeURIComponent(emailSearch)}`);
      
      const res = await api.emailLogs.list(`?${qParts.join('&')}`);
      if (res.success && res.data) {
        setEmails(res.data);
        if (res.meta) {
          setEmailTotalPages(res.meta.total_pages || 1);
          setEmailsCount(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEmailsLoading(false);
    }
  };

  // Effect to load data based on the active tab and its pagination/filter states
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'audit') {
      loadAudits();
    } else if (activeTab === 'email') {
      loadEmails();
    }
  }, [activeTab, userPage, userSearch, userRole, auditPage, auditSearch, emailPage, emailSearch]);

  const handleUpdatePlatformName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    await setPlatformName(tempPlatName);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await api.users.create({
        name: newUName,
        email: newUEmail,
        phone: newUPhone,
        role: newURole,
        password: newUPass
      });

      if (res.success) {
        setShowCreateModal(false);
        setNewUName('');
        setNewUEmail('');
        setNewUPhone('');
        setNewURole('customer');
        setNewUPass('');
        setUserPage(1);
        loadUsers();
      } else {
        setCreateError(res.error?.message || 'Gagal membuat pengguna baru.');
      }
    } catch (e) {
      setCreateError('Gagal terhubung ke server.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) return;
    const res = await api.users.delete(id);
    if (res.success) {
      setUserPage(1);
      loadUsers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Kewenangan Tertinggi</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-xs">Kelola akun pengguna, konfigurasi fitur platform, pantau audit keamanan, dan logs email keluar.</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Platform Settings
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Log
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'email' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email Logs
        </button>
      </div>

      {/* TAB: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-xs text-slate-400 font-semibold">Total Terdaftar: {usersCount} pengguna</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Buat User Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {/* Filter & Search Panel */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, telepon..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Filter Role:</span>
                <select
                  value={userRole}
                  onChange={(e) => {
                    setUserRole(e.target.value);
                    setUserPage(1);
                  }}
                  className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-hidden"
                >
                  <option value="All">Semua Role</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin Sistem</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Nama & Kontak</th>
                    <th className="p-4">Role Akses</th>
                    <th className="p-4">Email Terverifikasi</th>
                    <th className="p-4 text-right">Aksi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">Memuat data pengguna...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">Pengguna tidak ditemukan.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 space-y-1">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{u.email} | {u.phone || '-'}</p>
                        </td>
                        <td className="p-4 font-mono font-bold capitalize text-[11px] text-green-700">
                          {u.role.replace('_', ' ')}
                        </td>
                        <td className="p-4">
                          {u.email_verified_at ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold text-[10px]">
                              <CheckCircle className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowResetModal(true);
                              }}
                              className="p-2 text-slate-500 hover:text-green-600 rounded-lg hover:bg-slate-50 border border-slate-100"
                              title="Reset Password Manual (Cooldown Active)"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 border border-slate-100"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {!isUsersLoading && userTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Halaman <strong>{userPage}</strong> dari <strong>{userTotalPages}</strong> (Total {usersCount} user)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={userPage === userTotalPages}
                    onClick={() => setUserPage(prev => Math.min(prev + 1, userTotalPages))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-2xl space-y-8">
          
          <form onSubmit={handleUpdatePlatformName} className="space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm">Pengaturan Identitas</h3>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Platform Utama</label>
              <input
                type="text"
                required
                value={tempPlatName}
                onChange={(e) => setTempPlatName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Logo Platform Utama</label>
              <ImageUploader
                onUploadSuccess={async (assetId, fileUrl) => {
                  await setPlatformLogoUrl(fileUrl);
                }}
                onClear={async () => {
                  await setPlatformLogoUrl('');
                }}
                currentImageUrl={platformLogoUrl}
                label="Seret atau pilih gambar logo platform"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Simpan Identitas
            </button>
            {settingsSuccess && <span className="text-xs text-green-600 font-semibold ml-3">✓ Nama platform diperbarui!</span>}
          </form>

          <div className="h-[1px] bg-slate-100"></div>

          {/* Registration toggle check */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm">Kontrol Fitur</h3>
            
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Registrasi Akun Mandiri Online</p>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                  Mengaktifkan atau menonaktifkan pendaftaran akun baru oleh Customer secara langsung. Jika dimatikan, pendaftaran dialihkan melalui CS / WhatsApp resmi.
                </p>
              </div>

              <button
                onClick={() => setRegistrationOpen(!registrationOpen)}
                className="p-1 rounded-full text-slate-400 hover:text-green-600 transition-colors"
              >
                {registrationOpen ? (
                  <ToggleRight className="w-12 h-12 text-green-600" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-slate-400" />
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-semibold">Menampilkan log sistem audit keselamatan transaksi</p>
          
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {/* Search Audit */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aksi, operator, entitas..."
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Tanggal / Waktu</th>
                    <th className="p-4">Operator ID</th>
                    <th className="p-4">Aksi / Tindakan</th>
                    <th className="p-4">Detail Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-mono">
                  {isAuditsLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">Memuat data audit logs...</td>
                    </tr>
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">Audit logs tidak ditemukan.</td>
                    </tr>
                  ) : (
                    audits.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-normal text-slate-500">
                          {new Date(a.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-slate-900 font-bold">{a.actor_name}</td>
                        <td className="p-4 text-green-700 font-bold uppercase tracking-wider text-[11px]">{a.action_type}</td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">{JSON.stringify(a.metadata)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isAuditsLoading && auditTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between font-sans">
                <span className="text-[11px] text-slate-500 font-medium font-sans">
                  Halaman <strong>{auditPage}</strong> dari <strong>{auditTotalPages}</strong> (Total {auditsCount} log)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={auditPage === auditTotalPages}
                    onClick={() => setAuditPage(prev => Math.min(prev + 1, auditTotalPages))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: EMAIL LOGS */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-semibold">Daftar pemantauan antrean pengiriman email notifikasi Brevo</p>
          
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {/* Search Emails */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari penerima email atau tipe notifikasi..."
                  value={emailSearch}
                  onChange={(e) => {
                    setEmailSearch(e.target.value);
                    setEmailPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Tanggal Kirim</th>
                    <th className="p-4">Penerima</th>
                    <th className="p-4">Jenis Template</th>
                    <th className="p-4">Status Pengiriman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-mono">
                  {isEmailsLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">Memuat data log email...</td>
                    </tr>
                  ) : emails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">Log email tidak ditemukan.</td>
                    </tr>
                  ) : (
                    emails.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-500">
                          {new Date(e.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-slate-900 font-bold">{e.recipient_email}</td>
                        <td className="p-4 text-slate-500 capitalize">{e.purpose.replace('_', ' ')}</td>
                        <td className="p-4">
                          {e.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold text-[10px] font-sans">
                              Sent ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[10px] font-sans">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isEmailsLoading && emailTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between font-sans">
                <span className="text-[11px] text-slate-500 font-medium">
                  Halaman <strong>{emailPage}</strong> dari <strong>{emailTotalPages}</strong> (Total {emailsCount} log email)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={emailPage === 1}
                    onClick={() => setEmailPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={emailPage === emailTotalPages}
                    onClick={() => setEmailPage(prev => Math.min(prev + 1, emailTotalPages))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">Buat Pengguna Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p>{createError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Lengkap *</label>
                <input
                  type="text" required value={newUName} onChange={(e) => setNewUName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-green-600 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Akun *</label>
                <input
                  type="email" required value={newUEmail} onChange={(e) => setNewUEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-green-600 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Nomor HP/WA</label>
                <input
                  type="tel" value={newUPhone} onChange={(e) => setNewUPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-green-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Role Akses</label>
                  <select
                    value={newURole} onChange={(e: any) => setNewURole(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-green-600 outline-hidden"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin Sistem</option>
                    <option value="owner">Owner (Pemilik)</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Kata Sandi *</label>
                  <input
                    type="password" required value={newUPass} onChange={(e) => setNewUPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-green-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-slate-900 rounded-lg font-bold"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL TRIGGER */}
      {showResetModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetModal(false);
            setSelectedUser(null);
          }}
        />
      )}

    </div>
  );
};
