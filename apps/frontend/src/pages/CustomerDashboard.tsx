import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useAppState } from '../context/AppContext';
import { useChatSocket } from '../lib/socket';
import { api } from '../lib/api';
import { Transaction, VisitRequest, Message, Notification, Conversation } from '../types';
import { CreditCard, CalendarCheck, Bell, MessageSquare, ShieldCheck, CheckCircle2, Upload, Send, AlertTriangle, User as UserIcon } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';

export const CustomerDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { visitRequests, transactions, notifications, refreshAllData } = useAppState();

  const [activeTab, setActiveTab] = useState<'transactions' | 'visits' | 'notifications' | 'chat' | 'profile'>('transactions');

  // Tab: Upload proof states
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofAssetId, setProofAssetId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Tab: Chat states
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsgContent, setNewMsgContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Tab: Profile states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    // If opening chat tab, load conversation
    if (activeTab === 'chat' && user) {
      const initChat = async () => {
        try {
          const res = await api.chat.listConversations();
          if (res.success && res.data && res.data.length > 0) {
            setConversation(res.data[0]);
            const msgRes = await api.chat.listMessages(res.data[0].id);
            if (msgRes.success) setMessages(msgRes.data);
          } else {
            const createRes = await api.chat.createConversation({
              initial_message: 'Halo Admin, saya butuh bantuan seputar pesanan saya.'
            });
            if (createRes.success && createRes.data) {
              setConversation(createRes.data.conversation);
              const msgRes = await api.chat.listMessages(createRes.data.conversation.id);
              if (msgRes.success) setMessages(msgRes.data);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      initChat();
    }
  }, [activeTab, user]);

  // WebSocket Chat Listener
  const handleLiveMessage = (msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  useChatSocket(conversation?.id || '', handleLiveMessage);

  // Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    const ok = await updateProfile({ name: profileName, phone: profilePhone });
    if (ok) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !proofAssetId) return;

    setIsUploading(true);
    try {
      const res = await api.transactions.uploadPaymentProof(selectedTx.id, proofAssetId);
      if (res.success) {
        setShowUploadModal(false);
        setSelectedTx(null);
        setProofUrl('');
        setProofAssetId('');
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgContent.trim() || !conversation) return;

    const content = newMsgContent;
    setNewMsgContent('');

    const tempMsg: Message = {
      id: 'm_temp_' + Date.now(),
      conversation_id: conversation.id,
      sender_id: user?.id || 'customer',
      sender_name: user?.name || 'Customer',
      sender_role: 'customer',
      content,
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.chat.sendMessage(conversation.id, { content, message_type: 'text' });
      if (res.success && res.data) {
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? res.data : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Card */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">Selamat Datang, {user?.name}</h1>
          <p className="text-slate-400 text-xs">Pantau progres pembelian kendaraan, jadwalkan inspeksi fisik bebas penipuan, dan komunikasikan kendala Anda langsung ke Admin.</p>
        </div>
        
        {/* Verification badge status */}
        {user?.email_verified_at ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>Email Terverifikasi ✓</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold w-fit">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>Verifikasi Email Pending</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'transactions', label: 'Riwayat Transaksi', icon: CreditCard },
          { id: 'visits', label: 'Riwayat Kunjungan', icon: CalendarCheck },
          { id: 'notifications', label: 'Notifikasi', icon: Bell },
          { id: 'chat', label: 'Chat dengan Admin', icon: MessageSquare },
          { id: 'profile', label: 'Ubah Profil', icon: UserIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Daftar transaksi pembelian Anda yang diproteksi escrow platform</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">ID Transaksi</th>
                    <th className="p-4">Jenis Produk</th>
                    <th className="p-4">ID Unit / Spare Part</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Status Transaksi</th>
                    <th className="p-4 text-right">Aksi Pembayaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada transaksi pembelian dibuat.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-900">{t.id}</td>
                        <td className="p-4 capitalize">{t.product_type.replace('_', ' ')}</td>
                        <td className="p-4 font-mono text-slate-400">ID: {t.product_id}</td>
                        <td className="p-4 font-bold font-mono text-slate-800">{formatPrice((t.product_details?.price || 0) * t.quantity)}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'released_to_seller' ? 'bg-green-50 text-green-700' :
                            t.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            t.status === 'funds_held' ? 'bg-blue-50 text-blue-700' :
                            t.payment_proof_url ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {t.status === 'released_to_seller' ? 'SELESAI' :
                             t.status === 'cancelled' ? 'DIBATALKAN' :
                             t.status === 'funds_held' ? 'DANA ESCROW' :
                             t.payment_proof_url ? 'VERIFIKASI' : 'BELUM BAYAR'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {t.status === 'pending_payment' && !t.payment_proof_url ? (
                            <button
                              onClick={() => {
                                setSelectedTx(t);
                                setShowUploadModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] shadow-sm transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Bukti Transfer
                            </button>
                          ) : t.status === 'pending_payment' && t.payment_proof_url ? (
                            <span className="text-[10px] text-amber-600 font-semibold uppercase">Menunggu Verifikasi</span>
                          ) : (
                            <span className="text-[10px] text-green-600 font-semibold uppercase flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Transaksi Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Status pengajuan jadwal inspeksi / kunjungan fisik langsung Anda</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Tanggal Pengajuan</th>
                  <th className="p-4">ID Unit Mobil</th>
                  <th className="p-4">Preferensi Jadwal / Catatan</th>
                  <th className="p-4">Status Pengajuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visitRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Belum ada permintaan kunjungan fisik diajukan.</td>
                  </tr>
                ) : (
                  visitRequests.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-500">{new Date(v.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">ID: {v.vehicle_id}</td>
                      <td className="p-4 text-slate-500 italic max-w-xs truncate">"{v.notes || '-'}"</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          v.status === 'completed' ? 'bg-green-50 text-green-700' :
                          v.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                          v.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-fade-in max-w-3xl">
          <p className="text-xs text-slate-400 font-semibold">Pemberitahuan push/instan seputar progres escrow dan kunjungan Anda</p>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">Tidak ada notifikasi baru.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 border border-green-100">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.content}</p>
                    <span className="text-[9px] text-slate-400 font-mono block pt-1">
                      {new Date(n.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: REALTIME CHAT */}
      {activeTab === 'chat' && (
        <div className="max-w-3xl border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-xs h-[450px] flex flex-col justify-between animate-fade-in">
          
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm">Konsultasi dengan Admin Sistem</h3>
            <span className="text-[10px] text-slate-400 font-mono">Chatbox ID: {conversation?.id || 'Inisialisasi...'}</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl text-xs ${
                    isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-3xs'
                  }`}>
                    {m.content}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                    {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={newMsgContent}
              onChange={(e) => setNewMsgContent(e.target.value)}
              placeholder="Tulis pesan Anda untuk dikoordinasikan langsung..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-green-600 bg-slate-50 text-xs"
            />
            <button type="submit" className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-xl animate-fade-in">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Informasi Akun Anda</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">Nama Lengkap</label>
              <input
                type="text" required value={profileName} onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:bg-white focus:border-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">Nomor HP/WA</label>
              <input
                type="tel" required value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:bg-white focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors"
            >
              Simpan Profil
            </button>
            {profileSuccess && <span className="text-xs text-green-600 font-semibold ml-3">✓ Profil Anda berhasil diperbarui!</span>}
          </form>
        </div>
      )}

      {/* PAYMENT TRANSFER PROOF MODAL UPLOAD (DRAG-AND-DROP PREVIEW OR MANUAL SELECT) */}
      {showUploadModal && selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">Unggah Bukti Pembayaran</h3>
              <button onClick={() => {
                setShowUploadModal(false);
                setSelectedTx(null);
              }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProofSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Berkas Bukti Transfer Pembayaran *</label>
                <ImageUploader
                  onUploadSuccess={(assetId, fileUrl) => {
                    setProofAssetId(assetId);
                    setProofUrl(fileUrl);
                  }}
                  onClear={() => {
                    setProofAssetId('');
                    setProofUrl('');
                  }}
                  currentImageUrl={proofUrl}
                  label="Seret atau pilih foto bukti transfer Anda"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => {
                  setShowUploadModal(false);
                  setSelectedTx(null);
                  setProofUrl('');
                  setProofAssetId('');
                }} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800">Tutup</button>
                <button type="submit" disabled={isUploading || !proofAssetId} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg disabled:opacity-55">
                  {isUploading ? 'Mengirim...' : 'Kirim Bukti'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
