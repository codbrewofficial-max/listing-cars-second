import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Vehicle, SparePart, VisitRequest, Transaction, Article, Conversation, Message, Lead } from '../types';
import { Car, Settings, CalendarCheck, MessageSquare, ShieldCheck, FileText, CheckCircle, XCircle, Plus, Edit2, Trash2, Send, Clock, Sparkles, Users, Search, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';

export const DashboardAdminSistem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'visits' | 'chat' | 'payments' | 'articles' | 'leads_admin'>('products');

  // Tab: Product Management
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);

  // Pagination and search states
  const [vehiclePage, setVehiclePage] = useState(1);
  const [vehicleTotalPages, setVehicleTotalPages] = useState(1);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const [partPage, setPartPage] = useState(1);
  const [partTotalPages, setPartTotalPages] = useState(1);
  const [partSearch, setPartSearch] = useState('');

  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);
  const [articleSearch, setArticleSearch] = useState('');

  // Upload/Photo states
  const [vehiclePhotos, setVehiclePhotos] = useState<{ id?: string; file_url: string; media_asset_id?: string; is_cover?: boolean }[]>([]);
  const [partPhotos, setPartPhotos] = useState<{ id?: string; file_url: string; media_asset_id?: string; is_cover?: boolean }[]>([]);
  const [visitPhotoAssetId, setVisitPhotoAssetId] = useState('');

  // Vehicle form state
  const [vId, setVId] = useState<string | null>(null);
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState('');
  const [vMileage, setVMileage] = useState('');
  const [vPrice, setVPrice] = useState('');
  const [vLocation, setVLocation] = useState('');
  const [vNotes, setVNotes] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vSTNK, setVSTNK] = useState(false);
  const [vBPKB, setVBPKB] = useState(false);
  const [vTax, setVTax] = useState(false);
  const [vStatus, setVStatus] = useState<Vehicle['status']>('draft');

  // SparePart form state
  const [spId, setSpId] = useState<string | null>(null);
  const [spName, setSpName] = useState('');
  const [spCategory, setSpCategory] = useState('');
  const [spCondition, setSpCondition] = useState<'new' | 'used'>('new');
  const [spPrice, setSpPrice] = useState('');
  const [spDesc, setSpDesc] = useState('');
  const [spStatus, setSpStatus] = useState<SparePart['status']>('draft');

  // Tab: Inspeksi & Kunjungan
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);
  const [showVisitPhotoModal, setShowVisitPhotoModal] = useState(false);
  const [visitPhotoUrl, setVisitPhotoUrl] = useState('');

  // Tab: Realtime Chat
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Tab: Payments
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Tab: Article Management
  const [articles, setArticles] = useState<Article[]>([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [artId, setArtId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artSeoTitle, setArtSeoTitle] = useState('');
  const [artSeoDesc, setArtSeoDesc] = useState('');
  const [artStatus, setArtStatus] = useState<'draft' | 'published'>('draft');

  // Tab: Leads
  const [leads, setLeads] = useState<Lead[]>([]);

  const loadVehicles = async () => {
    try {
      const params = `?page=${vehiclePage}&per_page=5${vehicleSearch ? `&search=${encodeURIComponent(vehicleSearch)}` : ''}`;
      const res = await api.vehicles.adminList(params);
      if (res.success && res.data) {
        setVehicles(res.data);
        if (res.meta) {
          setVehicleTotalPages(res.meta.total_pages || 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadParts = async () => {
    try {
      const params = `?page=${partPage}&per_page=5${partSearch ? `&search=${encodeURIComponent(partSearch)}` : ''}`;
      const res = await api.spareParts.adminList(params);
      if (res.success && res.data) {
        setParts(res.data);
        if (res.meta) {
          setPartTotalPages(res.meta.total_pages || 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadArticles = async () => {
    try {
      const params = `?page=${articlePage}&per_page=5${articleSearch ? `&search=${encodeURIComponent(articleSearch)}` : ''}`;
      const res = await api.articles.adminList(params);
      if (res.success && res.data) {
        setArticles(res.data);
        if (res.meta) {
          setArticleTotalPages(res.meta.total_pages || 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      await loadVehicles();
      await loadParts();
      await loadArticles();

      const resVisits = await api.visits.listAll();
      if (resVisits.success) setVisits(resVisits.data);

      const resTx = await api.transactions.listAll();
      if (resTx.success) setTransactions(resTx.data);

      const resLeads = await api.leads.list();
      if (resLeads.success) setLeads(resLeads.data);

      const resConv = await api.chat.listConversations();
      if (resConv.success) setConversations(resConv.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [vehiclePage, vehicleSearch]);

  useEffect(() => {
    loadParts();
  }, [partPage, partSearch]);

  useEffect(() => {
    loadArticles();
  }, [articlePage, articleSearch]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle active conversation selection
  useEffect(() => {
    if (activeConv) {
      const fetchMsgs = async () => {
        const res = await api.chat.listMessages(activeConv.id);
        if (res.success) setMessages(res.data);
      };
      fetchMsgs();
      
      // Auto scroll
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeConv]);

  // Send message as agent
  const handleAgentSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !activeConv) return;

    const content = newMsgText;
    setNewMsgText('');

    const tempMsg: Message = {
      id: 'm_temp_' + Date.now(),
      conversation_id: activeConv.id,
      sender_id: 'admin_agent',
      sender_name: 'Admin Sistem',
      sender_role: 'admin',
      content,
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.chat.sendMessage(activeConv.id, { content, message_type: 'text' });
      if (res.success && res.data) {
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? res.data : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Vehicle Create/Edit
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      brand: vBrand,
      model: vModel,
      year: parseInt(vYear),
      mileage: parseFloat(vMileage),
      price: parseFloat(vPrice),
      location: vLocation,
      condition_notes: vNotes,
      description: vDesc,
      document_status: (vSTNK && vBPKB && vTax) ? 'verified' : 'unverified',
      verification_checklist: { stnk: vSTNK, bpkb: vBPKB, tax_active: vTax },
      status: vStatus
    };

    let targetVId = vId;
    if (vId) {
      await api.vehicles.update(vId, payload);
    } else {
      const res = await api.vehicles.create(payload);
      if (res.success && res.data && res.data.vehicle) {
        targetVId = res.data.vehicle.id;
      }
    }

    if (targetVId) {
      const newPhotos = vehiclePhotos.filter(p => p.media_asset_id && !p.id);
      for (const photo of newPhotos) {
        if (photo.media_asset_id) {
          await api.vehicles.addPhoto(targetVId, { media_asset_id: photo.media_asset_id, is_cover: photo.is_cover || false });
        }
      }
    }

    setShowVehicleModal(false);
    resetVehicleForm();
    loadVehicles();
  };

  const resetVehicleForm = () => {
    setVId(null);
    setVBrand('');
    setVModel('');
    setVYear('');
    setVMileage('');
    setVPrice('');
    setVLocation('');
    setVNotes('');
    setVDesc('');
    setVSTNK(false);
    setVBPKB(false);
    setVTax(false);
    setVStatus('draft');
    setVehiclePhotos([]);
  };

  // Submit Spare Part Create/Edit
  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: spName,
      category: spCategory,
      condition: spCondition,
      price: parseFloat(spPrice),
      description: spDesc,
      status: spStatus
    };

    let targetSpId = spId;
    if (spId) {
      await api.spareParts.update(spId, payload);
    } else {
      const res = await api.spareParts.create(payload);
      if (res.success && res.data && res.data.spare_part) {
        targetSpId = res.data.spare_part.id;
      }
    }

    if (targetSpId) {
      const newPhotos = partPhotos.filter(p => p.media_asset_id && !p.id);
      for (const photo of newPhotos) {
        if (photo.media_asset_id) {
          await api.spareParts.addPhoto(targetSpId, { media_asset_id: photo.media_asset_id, is_cover: photo.is_cover || false });
        }
      }
    }

    setShowPartModal(false);
    resetPartForm();
    loadParts();
  };

  const resetPartForm = () => {
    setSpId(null);
    setSpName('');
    setSpCategory('');
    setSpCondition('new');
    setSpPrice('');
    setSpDesc('');
    setSpStatus('draft');
    setPartPhotos([]);
  };

  // Article Create/Edit submit
  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: artTitle,
      category: artCategory,
      content: artContent,
      seo_title: artSeoTitle,
      seo_description: artSeoDesc,
      status: artStatus
    };

    if (artId) {
      await api.articles.update(artId, payload);
    } else {
      await api.articles.create(payload);
    }

    setShowArticleModal(false);
    setArtId(null);
    setArtTitle('');
    setArtCategory('');
    setArtContent('');
    setArtSeoTitle('');
    setArtSeoDesc('');
    setArtStatus('draft');
    loadData();
  };

  // Upload Physical Visit Verification Photos (transparency module against fraud)
  const handleUploadVisitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !visitPhotoAssetId) return;

    const res = await api.visits.addPhoto(selectedVisit.id, visitPhotoAssetId);
    if (res.success) {
      setShowVisitPhotoModal(false);
      setSelectedVisit(null);
      setVisitPhotoUrl('');
      setVisitPhotoAssetId('');
      loadData();
    }
  };

  const handleUpdateVisitStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    const res = await api.visits.updateStatus(id, { status });
    if (res.success) {
      loadData();
    }
  };

  const handleVerifyPayment = async (txId: string, action: 'completed' | 'rejected') => {
    const res = await api.transactions.verifyPayment(txId, { approved: action === 'completed' });
    if (res.success) {
      loadData();
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kewenangan Operasional / Admin Sistem</span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">Admin Sistem Panel</h1>
          <p className="text-slate-400 text-xs">Kelola iklan kendaraan, verifikasi kunjungan fisik bebas penipuan, layani chat pelanggan, pantau transaksi escrow.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'products', label: 'Product Management', icon: Car },
          { id: 'visits', label: 'Inspeksi & Kunjungan', icon: CalendarCheck },
          { id: 'chat', label: 'Chat Realtime', icon: MessageSquare },
          { id: 'payments', label: 'Verifikasi Pembayaran', icon: ShieldCheck },
          { id: 'articles', label: 'Article Management', icon: FileText },
          { id: 'leads_admin', label: 'Kelola Leads', icon: Users }
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

      {/* TAB: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Section: Vehicles */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 text-base">Kelola Unit Kendaraan Bekas</h3>
              <button
                onClick={() => {
                  resetVehicleForm();
                  setShowVehicleModal(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Unit Mobil
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari merk atau model mobil..."
                    value={vehicleSearch}
                    onChange={(e) => {
                      setVehicleSearch(e.target.value);
                      setVehiclePage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                  />
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Merk & Model</th>
                    <th className="p-4">Harga Penawaran</th>
                    <th className="p-4">Kelengkapan STNK/BPKB</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-4 space-y-0.5">
                        <p className="font-bold text-slate-900">{v.brand} {v.model}</p>
                        <p className="text-slate-400 text-[10px] font-mono">Tahun {v.year} | {v.location}</p>
                      </td>
                      <td className="p-4 font-bold font-mono text-slate-800">{formatPrice(v.price)}</td>
                      <td className="p-4 font-semibold text-green-700">
                        {v.document_status === 'verified' ? '✓ Lengkap & Asli' : 'Belum Diverifikasi'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          v.status === 'published' ? 'bg-green-50 text-green-700' :
                          v.status === 'sold' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setVId(v.id);
                              setVBrand(v.brand);
                              setVModel(v.model);
                              setVYear(v.year.toString());
                              setVMileage(v.mileage.toString());
                              setVPrice(v.price.toString());
                              setVLocation(v.location);
                              setVNotes(v.condition_notes || '');
                              setVDesc(v.description || '');
                              setVSTNK(v.verification_checklist?.stnk || false);
                              setVBPKB(v.verification_checklist?.bpkb || false);
                              setVTax(v.verification_checklist?.tax_active || false);
                              setVStatus(v.status);
                              setVehiclePhotos(v.photos || []);
                              setShowVehicleModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-green-600 border border-slate-100 rounded-lg hover:bg-slate-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Halaman <strong>{vehiclePage}</strong> dari <strong>{vehicleTotalPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={vehiclePage === 1}
                    onClick={() => setVehiclePage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={vehiclePage === vehicleTotalPages}
                    onClick={() => setVehiclePage(prev => Math.min(prev + 1, vehicleTotalPages))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Spare Parts */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 text-base">Kelola Katalog Suku Cadang</h3>
              <button
                onClick={() => {
                  resetPartForm();
                  setShowPartModal(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Suku Cadang
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari suku cadang..."
                    value={partSearch}
                    onChange={(e) => {
                      setPartSearch(e.target.value);
                      setPartPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                  />
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama Produk</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Kondisi</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {parts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{p.name}</td>
                      <td className="p-4 font-mono font-semibold text-slate-500 capitalize">{p.category}</td>
                      <td className="p-4 font-bold capitalize text-green-700">{p.condition}</td>
                      <td className="p-4 font-bold font-mono text-slate-800">{formatPrice(p.price)}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          p.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSpId(p.id);
                            setSpName(p.name);
                            setSpCategory(p.category);
                            setSpCondition(p.condition);
                            setSpPrice(p.price.toString());
                            setSpDesc(p.description || '');
                            setSpStatus(p.status);
                            setPartPhotos(p.photos || []);
                            setShowPartModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-green-600 border border-slate-100 rounded-lg hover:bg-slate-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Halaman <strong>{partPage}</strong> dari <strong>{partTotalPages}</strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={partPage === 1}
                    onClick={() => setPartPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={partPage === partTotalPages}
                    onClick={() => setPartPage(prev => Math.min(prev + 1, partTotalPages))}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB: INSPEKSI & KUNJUNGAN */}
      {activeTab === 'visits' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Memantau dan mengoordinasikan antrean kunjungan fisik dan unggahan foto inspeksi</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Tanggal Diajukan</th>
                  <th className="p-4">Pemohon (User)</th>
                  <th className="p-4">Unit Kendaraan</th>
                  <th className="p-4">Preferensi / Catatan</th>
                  <th className="p-4">Status Kunjungan</th>
                  <th className="p-4 text-right">Aksi Koordinasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500">{new Date(v.created_at).toLocaleString('id-ID')}</td>
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-slate-900">{v.customer?.name || 'Customer'}</p>
                      <p className="text-slate-400 text-[10px] font-mono">ID: {v.customer_id}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-900">ID Unit: {v.vehicle_id}</td>
                    <td className="p-4 text-slate-500 italic max-w-xs line-clamp-1">"{v.notes || '-'}"</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        v.status === 'completed' ? 'bg-green-50 text-green-700' :
                        v.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                        v.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {v.status === 'requested' && (
                          <button
                            onClick={() => handleUpdateVisitStatus(v.id, 'scheduled')}
                            className="p-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[10px]"
                          >
                            Jadwalkan
                          </button>
                        )}
                        {v.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedVisit(v);
                                setShowVisitPhotoModal(true);
                              }}
                              className="p-1 px-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold text-[10px]"
                              title="Unggah Foto Inspeksi Mandiri"
                            >
                              Upload Foto Inspeksi
                            </button>
                            <button
                              onClick={() => handleUpdateVisitStatus(v.id, 'completed')}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-green-600 hover:bg-slate-50"
                            >
                              Selesai
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">No actions</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REALTIME CHAT */}
      {activeTab === 'chat' && (
        <div className="grid md:grid-cols-12 gap-6 h-[500px] border border-slate-100 rounded-3xl bg-white overflow-hidden shadow-xs animate-fade-in">
          
          {/* Conversation List Left panel */}
          <div className="md:col-span-4 border-r border-slate-100 overflow-y-auto divide-y divide-slate-50">
            <div className="p-4 bg-slate-50/50">
              <h4 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">Ruang Chat Aktif</h4>
            </div>
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Tidak ada percakapan aktif.</div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConv?.id === c.id;
                const cust = c.participants?.find((p) => p.role === 'customer') || { name: 'Customer', user_id: 'guest' };
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full text-left p-4 hover:bg-slate-50/50 transition-colors flex flex-col gap-1 ${
                      isActive ? 'bg-green-50/40 border-l-4 border-green-600' : ''
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-xs">{cust.name || 'Pembeli / Customer'}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-full">ID: {cust.user_id}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Chat Messages Panel */}
          <div className="md:col-span-8 flex flex-col justify-between h-full bg-slate-50/50">
            {activeConv ? (
              <>
                {/* Header */}
                <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                  {(() => {
                    const activeCust = activeConv.participants?.find((p) => p.role === 'customer') || { name: 'Customer' };
                    return (
                      <p className="font-bold text-slate-800 text-sm">Konsultasi: {activeCust.name}</p>
                    );
                  })()}
                  <span className="text-[10px] text-slate-400 font-mono">Conversation ID: {activeConv.id}</span>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMe = m.sender_role === 'admin';
                    return (
                      <div key={m.id} className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl text-xs ${
                          isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-3xs'
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

                {/* Input reply form */}
                <form onSubmit={handleAgentSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    placeholder="Tulis balasan pesan untuk pembeli..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-green-600 bg-slate-50 text-xs"
                  />
                  <button type="submit" className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Pilih ruang percakapan di kolom kiri untuk melayani chat pembeli secara langsung.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: PAYMENTS (VERIFIKASI) */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Unggahan bukti transfer bank manual pembayaran escrow yang harus diperiksa Admin</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">ID Transaksi</th>
                  <th className="p-4">Jenis / Kategori</th>
                  <th className="p-4">Jumlah Nominal</th>
                  <th className="p-4">Bukti Unggahan</th>
                  <th className="p-4">Status Pembayaran</th>
                  <th className="p-4 text-right">Verifikasi Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="p-4 capitalize">{t.product_type}</td>
                    <td className="p-4 font-mono font-semibold">{formatPrice((t.product_details?.price || 0) * t.quantity)}</td>
                    <td className="p-4">
                      {t.payment_proof_url ? (
                        <a
                          href={t.payment_proof_url} target="_blank" rel="noreferrer"
                          className="text-green-600 font-semibold underline"
                        >
                          Lihat Gambar Bukti Transfer
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum diunggah</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        t.status === 'released_to_seller' ? 'bg-green-50 text-green-700' :
                        t.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        (t.payment_proof_url && t.status === 'pending_payment') ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {t.status === 'released_to_seller' ? 'RELEASED' :
                         t.status === 'cancelled' ? 'BATAL' :
                         t.status === 'funds_held' ? 'HOLD ESCROW' :
                         t.payment_proof_url ? 'BUKTI DIUNGHAH' : 'BELUM BAYAR'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {(t.payment_proof_url && t.status === 'pending_payment') ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleVerifyPayment(t.id, 'completed')}
                            className="p-1 px-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-[10px]"
                          >
                            Verifikasi Sah
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(t.id, 'rejected')}
                            className="p-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-[10px]"
                          >
                            Tolak / Salah
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Telah Diarsip</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ARTICLE MANAGEMENT */}
      {activeTab === 'articles' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-slate-900 text-base">Kelola Artikel Edukasi</h3>
            <button
              onClick={() => {
                setArtId(null);
                setArtTitle('');
                setArtCategory('');
                setArtContent('');
                setArtSeoTitle('');
                setArtSeoDesc('');
                setArtStatus('draft');
                setShowArticleModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tulis Artikel Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari judul artikel..."
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    setArticlePage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:border-green-600"
                />
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Judul Artikel</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">SEO Meta Title / Deskripsi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{art.title}</td>
                    <td className="p-4 font-mono font-semibold text-slate-500 capitalize">{art.category}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{art.seo_title || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        art.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setArtId(art.id);
                          setArtTitle(art.title);
                          setArtCategory(art.category);
                          setArtContent(art.content);
                          setArtSeoTitle(art.seo_title || '');
                          setArtSeoDesc(art.seo_description || '');
                          setArtStatus(art.status);
                          setShowArticleModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-green-600 border border-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Halaman <strong>{articlePage}</strong> dari <strong>{articleTotalPages}</strong>
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={articlePage === 1}
                  onClick={() => setArticlePage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={articlePage === articleTotalPages}
                  onClick={() => setArticlePage(prev => Math.min(prev + 1, articleTotalPages))}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEADS */}
      {activeTab === 'leads_admin' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-slate-400 font-semibold">Mengelola leads prospek yang masuk untuk ditindaklanjuti secara langsung via Telepon / WA</p>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Sumber</th>
                  <th className="p-4">Nama Prospek</th>
                  <th className="p-4">Kontak HP/WA</th>
                  <th className="p-4">Pesan Detail</th>
                  <th className="p-4">Status Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                    <td className="p-4 capitalize font-bold text-green-700">{l.source.replace('_', ' ')}</td>
                    <td className="p-4 font-bold text-slate-900">{l.name}</td>
                    <td className="p-4 font-mono font-semibold">{l.phone}</td>
                    <td className="p-4 text-slate-500">{l.message || '-'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 font-bold text-[10px]">
                        Pending WA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VEHICLE MODAL POPUP */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">{vId ? 'Edit Unit Kendaraan' : 'Tambah Unit Baru'}</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Merk Mobil *</label>
                  <input type="text" required value={vBrand} onChange={(e) => setVBrand(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Contoh: Toyota, Honda" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Model Unit *</label>
                  <input type="text" required value={vModel} onChange={(e) => setVModel(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Contoh: Avanza G, Civic Turbo" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Tahun *</label>
                  <input type="number" required value={vYear} onChange={(e) => setVYear(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Mileage (km) *</label>
                  <input type="number" required value={vMileage} onChange={(e) => setVMileage(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Lokasi *</label>
                  <input type="text" required value={vLocation} onChange={(e) => setVLocation(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Contoh: Jakarta, Bandung" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Harga Penawaran (IDR) *</label>
                <input type="number" required value={vPrice} onChange={(e) => setVPrice(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
              </div>

              {/* Checklist */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspeksi Keaslian Berkas Fisik</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input type="checkbox" checked={vSTNK} onChange={(e) => setVSTNK(e.target.checked)} />
                    STNK Asli
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input type="checkbox" checked={vBPKB} onChange={(e) => setVBPKB(e.target.checked)} />
                    BPKB Asli
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input type="checkbox" checked={vTax} onChange={(e) => setVTax(e.target.checked)} />
                    Pajak Aktif
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Catatan Kondisi Singkat</label>
                <input type="text" value={vNotes} onChange={(e) => setVNotes(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Misal: Bodi mulus, mesin kering, kaki-kaki empuk" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Deskripsi Detail</label>
                <textarea rows={3} value={vDesc} onChange={(e) => setVDesc(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Galeri Foto Unit *</label>
                {vehiclePhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg max-h-36 overflow-y-auto">
                    {vehiclePhotos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-slate-200 group bg-slate-200">
                        <img src={photo.file_url} alt="Unit" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={async () => {
                            if (vId && photo.id) {
                              await api.vehicles.deletePhoto(vId, photo.id);
                            }
                            setVehiclePhotos(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-0.5 rounded-full transition-colors"
                          title="Hapus Foto"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVehiclePhotos(prev => prev.map((p, i) => ({ ...p, is_cover: i === idx })));
                          }}
                          className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] font-bold ${
                            photo.is_cover ? 'bg-green-600 text-white' : 'bg-slate-900/60 text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          {photo.is_cover ? 'Cover' : 'Atur Cover'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUploader
                  onUploadSuccess={async (assetId, fileUrl) => {
                    if (vId) {
                      const res = await api.vehicles.addPhoto(vId, { media_asset_id: assetId, is_cover: vehiclePhotos.length === 0 });
                      if (res.success && res.data) {
                        setVehiclePhotos(prev => [...prev, res.data]);
                        loadVehicles();
                        return;
                      }
                    }
                    setVehiclePhotos(prev => [...prev, { file_url: fileUrl, media_asset_id: assetId, is_cover: prev.length === 0 }]);
                  }}
                  onClear={() => {}}
                  label="Tambah foto ke galeri unit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Status Publikasi</label>
                  <select value={vStatus} onChange={(e: any) => setVStatus(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs">
                    <option value="draft">Draft (Sembunyikan)</option>
                    <option value="published">Published (Tayang)</option>
                    <option value="sold">Sold (Sudah Terjual)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800">Tutup</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg">Simpan Mobil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPARE PART MODAL */}
      {showPartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">{spId ? 'Edit Suku Cadang' : 'Tambah Suku Cadang'}</h3>
              <button onClick={() => setShowPartModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePartSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Nama Produk Suku Cadang *</label>
                <input type="text" required value={spName} onChange={(e) => setSpName(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Kategori *</label>
                  <input type="text" required value={spCategory} onChange={(e) => setSpCategory(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Contoh: Ban, Aki, Oli, Rem" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Kondisi *</label>
                  <select value={spCondition} onChange={(e: any) => setSpCondition(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs">
                    <option value="new">Baru</option>
                    <option value="used">Bekas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Harga Suku Cadang (IDR) *</label>
                  <input type="number" required value={spPrice} onChange={(e) => setSpPrice(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Status Publikasi</label>
                  <select value={spStatus} onChange={(e: any) => setSpStatus(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs">
                    <option value="draft">Draft (Sembunyikan)</option>
                    <option value="published">Published (Tayang)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">Galeri Foto Produk Suku Cadang *</label>
                {partPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg max-h-36 overflow-y-auto">
                    {partPhotos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-slate-200 group bg-slate-200">
                        <img src={photo.file_url} alt="Part" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => {
                            setPartPhotos(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-0.5 rounded-full transition-colors"
                          title="Hapus Foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUploader
                  onUploadSuccess={async (assetId, fileUrl) => {
                    if (spId) {
                      const res = await api.spareParts.addPhoto(spId, { media_asset_id: assetId });
                      if (res.success && res.data) {
                        setPartPhotos(prev => [...prev, res.data]);
                        loadParts();
                        return;
                      }
                    }
                    setPartPhotos(prev => [...prev, { file_url: fileUrl, media_asset_id: assetId }]);
                  }}
                  onClear={() => {}}
                  label="Tambah foto ke galeri produk"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Deskripsi Suku Cadang</label>
                <textarea rows={3} value={spDesc} onChange={(e) => setSpDesc(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowPartModal(false)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800">Tutup</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg">Simpan Suku Cadang</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTICLE WRITING MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">{artId ? 'Edit Artikel Edukasi' : 'Tulis Artikel Edukasi'}</h3>
              <button onClick={() => setShowArticleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleArticleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Judul Artikel *</label>
                  <input type="text" required value={artTitle} onChange={(e) => setArtTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Kategori Panduan *</label>
                  <input type="text" required value={artCategory} onChange={(e) => setArtCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs" placeholder="Contoh: Keamanan, Perawatan, Berkas" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Konten Artikel (Mendukung Format Markdown) *</label>
                <textarea rows={8} required value={artContent} onChange={(e) => setArtContent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs font-mono resize-none" placeholder="Tulis konten dengan sintaks markdown..." />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta Tags Optimasi SEO</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">SEO Title Tag (Title-tag)</label>
                    <input type="text" value={artSeoTitle} onChange={(e) => setArtSeoTitle(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-md text-xs" placeholder="Saran: 50-60 karakter" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">SEO Meta Description</label>
                    <input type="text" value={artSeoDesc} onChange={(e) => setArtSeoDesc(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-md text-xs" placeholder="Saran: 120-150 karakter" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Status Publikasi</label>
                  <select value={artStatus} onChange={(e: any) => setArtStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs">
                    <option value="draft">Draft (Sembunyikan)</option>
                    <option value="published">Published (Tayang)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowArticleModal(false)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800">Tutup</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg">Simpan Artikel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISIT PHYSICAL PHOTO UPLOAD MODAL (Transparansi Anti-Penipuan) */}
      {showVisitPhotoModal && selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-display font-bold text-base">Unggah Foto Inspeksi Fisik</h3>
              <button onClick={() => {
                setShowVisitPhotoModal(false);
                setSelectedVisit(null);
              }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadVisitPhoto} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
                Silakan unggah foto hasil inspeksi fisik langsung (mesin, interior, bodi kendaraan) untuk diterbitkan langsung di halaman unit agar dapat dilihat secara transparan oleh pembeli lain.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Berkas Foto Hasil Inspeksi *</label>
                <ImageUploader
                  onUploadSuccess={(assetId, fileUrl) => {
                    setVisitPhotoAssetId(assetId);
                    setVisitPhotoUrl(fileUrl);
                  }}
                  onClear={() => {
                    setVisitPhotoAssetId('');
                    setVisitPhotoUrl('');
                  }}
                  currentImageUrl={visitPhotoUrl}
                  label="Seret atau pilih foto inspeksi fisik"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => {
                  setShowVisitPhotoModal(false);
                  setSelectedVisit(null);
                  setVisitPhotoUrl('');
                  setVisitPhotoAssetId('');
                }} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800">Tutup</button>
                <button type="submit" disabled={!visitPhotoAssetId} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg disabled:opacity-55">Menerbitkan Foto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
