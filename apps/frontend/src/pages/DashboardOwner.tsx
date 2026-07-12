import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Transaction, Lead } from '../types';
import { TrendingUp, Users, DollarSign, FileText, CheckCircle, XCircle, ShoppingBag, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const DashboardOwner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'transactions' | 'leads'>('insights');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Leads pagination & search state
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsCount, setLeadsCount] = useState(0);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  // BI metric calculation
  const [stats, setStats] = useState({
    totalUsers: 142,
    totalSales: 0,
    leadsCount: 0,
    approvedCount: 0
  });

  const loadOwnerData = async () => {
    try {
      const resTx = await api.transactions.listAll();
      if (resTx.success) {
        setTransactions(resTx.data);
        
        // Calculate total sales from approved transactions
        const approved = resTx.data.filter((t: Transaction) => t.status === 'released_to_seller' || t.status === 'funds_held');
        const total = approved.reduce((acc: number, curr: Transaction) => acc + ((curr.product_details?.price || 0) * curr.quantity), 0);
        
        setStats((prev) => ({
          ...prev,
          totalSales: total,
          approvedCount: approved.length
        }));
      }

      const resLeads = await api.leads.list();
      if (resLeads.success) {
        setStats((prev) => ({ ...prev, leadsCount: resLeads.data.length }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaginatedLeads = async () => {
    setIsLeadsLoading(true);
    try {
      const qParts = [`page=${leadsPage}`, `per_page=10`];
      if (leadsSearch) {
        qParts.push(`search=${encodeURIComponent(leadsSearch)}`);
      }
      const res = await api.leads.list(`?${qParts.join('&')}`);
      if (res.success && res.data) {
        setLeads(res.data);
        if (res.meta) {
          setLeadsTotalPages(res.meta.total_pages || 1);
          setLeadsCount(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLeadsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchPaginatedLeads();
    }
  }, [activeTab, leadsPage, leadsSearch]);

  const handleApprove = async (txId: string) => {
    if (!confirm('Apakah Anda yakin ingin melepas dana escrow ke penjual untuk transaksi ini? Tindakan ini tidak dapat dibatalkan.')) return;
    const res = await api.transactions.releaseFunds(txId);
    if (res.success) {
      loadOwnerData();
    }
  };

  const handleReject = async (txId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) return;
    const res = await api.transactions.cancel(txId, 'Dibatalkan oleh Owner');
    if (res.success) {
      loadOwnerData();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kewenangan Strategis / Owner</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">Owner Dashboard</h1>
          <p className="text-slate-400 text-xs">Akses data performa penjualan otomotif, verifikasi antrean escrow approval transaksi, dan analisis prospek Leads bisnis.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'insights' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Tracking Insight
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'transactions' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Approval Queue
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'leads' ? 'border-green-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Leads Report
        </button>
      </div>

      {/* TAB: TRACKING INSIGHT */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Bento metric blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Pengguna</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers} Pengguna</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Penjualan</p>
              <p className="text-2xl font-bold text-slate-900">{formatPrice(stats.totalSales)}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Leads Masuk</p>
              <p className="text-2xl font-bold text-slate-900">{stats.leadsCount} Prospek</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Trx Sukses</p>
              <p className="text-2xl font-bold text-slate-900">{stats.approvedCount} Transaksi</p>
            </div>

          </div>

          {/* Simple and elegant D3 / visual layout placeholder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Grafik Ringkasan Kinerja Bisnis</h3>
            <div className="aspect-video md:aspect-[21/9] bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center text-xs text-slate-400">
              [ Visualisasi Grafik Garis Pendapatan & Konversi Leads Terintegrasi ]
            </div>
          </div>

        </div>
      )}

      {/* TAB: APPROVAL QUEUE */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Antrean transaksi menunggu persetujuan (Release Escrow-Lite)</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Tanggal Trx</th>
                    <th className="p-4">Customer ID</th>
                    <th className="p-4">Produk / Unit</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Tindakan Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada transaksi menunggu persetujuan.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          {new Date(t.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 font-bold text-slate-900">{t.customer?.name || t.customer_id}</td>
                        <td className="p-4 space-y-0.5">
                          <p className="font-semibold text-slate-800 capitalize">{t.product_type.replace('_', ' ')}</p>
                          <p className="text-slate-400 text-[10px] font-mono">ID: {t.product_id}</p>
                        </td>
                        <td className="p-4 font-bold font-mono">{formatPrice((t.product_details?.price || 0) * t.quantity)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.status === 'released_to_seller' ? 'bg-green-50 text-green-700' :
                            t.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            t.status === 'funds_held' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {t.status === 'released_to_seller' ? 'SELESAI' :
                             t.status === 'cancelled' ? 'BATAL' :
                             t.status === 'funds_held' ? 'HOLD ESCROW' : 'PROSES'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {t.status === 'funds_held' ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleApprove(t.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-100"
                                title="Lepas Dana Escrow ke Penjual"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(t.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100"
                                title="Batalkan Transaksi"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              No action required
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

      {/* TAB: LEADS REPORT */}
      {activeTab === 'leads' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Laporan data prospek pembeli (diperoleh dari Contact Form & WhatsApp floating modal)</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, telepon, email..."
                  value={leadsSearch}
                  onChange={(e) => {
                    setLeadsSearch(e.target.value);
                    setLeadsPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Tanggal Masuk</th>
                    <th className="p-4">Sumber Capture</th>
                    <th className="p-4">Nama Prospek</th>
                    <th className="p-4">Kontak Telepon/WA</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Pesan Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {isLeadsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Memuat data prospek...</td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada leads terekam.</td>
                    </tr>
                  ) : (
                    leads.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          {new Date(l.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            l.source === 'whatsapp_modal' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {l.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{l.name}</td>
                        <td className="p-4 font-mono font-semibold text-slate-800">{l.phone}</td>
                        <td className="p-4 font-mono text-slate-500">{l.email || '-'}</td>
                        <td className="p-4 text-slate-500 line-clamp-1 max-w-xs">{l.message || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLeadsLoading && leadsTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Halaman <strong>{leadsPage}</strong> dari <strong>{leadsTotalPages}</strong> (Total {leadsCount} prospek)
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={leadsPage === 1}
                    onClick={() => setLeadsPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={leadsPage === leadsTotalPages}
                    onClick={() => setLeadsPage(prev => Math.min(prev + 1, leadsTotalPages))}
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

    </div>
  );
};
