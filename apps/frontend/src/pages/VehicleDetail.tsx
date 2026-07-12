import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, useAppState } from '../context/AppContext';
import { api } from '../lib/api';
import { Vehicle } from '../types';
import { ShieldCheck, MapPin, Milestone, CalendarDays, CheckCircle2, Phone, CalendarRange, ShoppingCart, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addVisitRequest, addTransaction } = useAppState();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [visitPhotos, setVisitPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState('');

  // Visit Request States
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);

  // Buy States
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [buySuccessId, setBuySuccessId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.vehicles.get(id);
        if (res.success && res.data) {
          setVehicle(res.data.vehicle);
          setPhotos(res.data.photos || []);
          setVisitPhotos(res.data.visit_photos_published || []);
          
          const coverUrl = res.data.photos?.find((p: any) => p.is_cover)?.file_url || 
                           res.data.photos?.[0]?.file_url || 
                           'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
          setActivePhoto(coverUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsSubmittingVisit(true);
    try {
      const ok = await addVisitRequest(id, visitNotes);
      if (ok) {
        setVisitSuccess(true);
        setVisitNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const handleBuy = async () => {
    if (!id || !isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsSubmittingBuy(true);
    try {
      const txId = await addTransaction('vehicle', id, 1);
      if (txId) {
        setBuySuccessId(txId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 text-sm">
        Memuat detail kendaraan...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 text-sm space-y-4">
        <p>Unit kendaraan tidak ditemukan.</p>
        <Link to="/katalog-kendaraan" className="text-green-600 font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back link */}
      <Link to="/katalog-kendaraan" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Gallery & Inspection Photos */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Photo Slider */}
          <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-100">
            <img
              src={activePhoto}
              alt={`${vehicle.brand} ${vehicle.model}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            
            {vehicle.document_status === 'verified' && (
              <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-4 h-4" />
                <span>Dokumen Terverifikasi ✓</span>
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {photos.map((ph) => (
                <button
                  key={ph.id}
                  onClick={() => setActivePhoto(ph.file_url)}
                  className={`w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activePhoto === ph.file_url ? 'border-green-600 shadow-sm' : 'border-transparent'
                  }`}
                >
                  <img src={ph.file_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Published Physical Inspection Photos (Visi Anti-Penipuan) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-display font-bold text-slate-900 text-base">Foto Hasil Kunjungan Fisik Terbuka</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Foto-foto di bawah ini diambil secara langsung oleh tim Admin atau dikoordinasikan dalam pengawasan ketat saat kunjungan fisik. Ditayangkan demi transparansi kondisi mesin, interior, dan bodi unit sesungguhnya.
            </p>

            {visitPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2 text-xs">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <span>Belum ada foto kunjungan fisik yang diunggah untuk unit ini.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visitPhotos.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(url)}
                    className="aspect-video rounded-lg overflow-hidden border border-slate-100 bg-slate-50 hover:opacity-90 transition-opacity"
                  >
                    <img src={url} alt={`Kunjungan Fisik ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Technical Specs, Status Checklist, Action Buttons */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Title & Price */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xs">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
              {vehicle.brand}
            </span>
            
            <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight leading-tight">
              {vehicle.model}
            </h1>

            <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span>Tahun Produksi: <strong className="text-slate-800">{vehicle.year}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-slate-400" />
                <span>Kilometer: <strong className="text-slate-800">{vehicle.mileage.toLocaleString('id-ID')} km</strong></span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Harga Jual Escrow-Lite</p>
              <p className="font-display font-bold text-slate-900 text-3xl">
                {formatPrice(vehicle.price)}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Lokasi Unit: <strong className="text-slate-700">{vehicle.location}</strong></span>
            </div>
          </div>

          {/* Document Verification Checklist details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Status Verifikasi Berkas Fisik</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-50 bg-slate-50/50">
                <span className={`w-2 h-2 rounded-full ${vehicle.verification_checklist?.stnk ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                <span>Fisik STNK</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-50 bg-slate-50/50">
                <span className={`w-2 h-2 rounded-full ${vehicle.verification_checklist?.bpkb ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                <span>Fisik BPKB</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-50 bg-slate-50/50">
                <span className={`w-2 h-2 rounded-full ${vehicle.verification_checklist?.tax_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                <span>Pajak Aktif</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              * Dokumen telah melalui pengecekan fisik langsung oleh tim Admin LCS Motor untuk memastikan keaslian nomor rangka dan keabsahan hukum kendaraan.
            </p>
          </div>

          {/* General Notes & Description */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-slate-900 text-sm">Kondisi Umum Kendaraan</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic leading-relaxed">
                "{vehicle.condition_notes || 'Kondisi fisik standar pemakaian normal, mesin sehat.'}"
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-slate-900 text-sm">Deskripsi Lengkap</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {vehicle.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>
          </div>

          {/* BUY & INSPECTION ACTIONS BOARD */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-sm">Tertarik dengan Unit Ini?</h3>
            
            {buySuccessId ? (
              <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-4 space-y-2 animate-fade-in">
                <p className="font-bold">✓ Transaksi Pembelian Sukses Dibuat!</p>
                <p>Silakan buka Dashboard Customer Anda untuk mengunggah bukti transfer manual escrow.</p>
                <Link to="/dashboard/customer?tab=transactions" className="inline-block mt-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                  Buka Riwayat Transaksi
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                
                {/* Buy button */}
                <button
                  onClick={handleBuy}
                  disabled={isSubmittingBuy || vehicle.status === 'sold'}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {vehicle.status === 'sold' ? 'Sudah Terjual' : isSubmittingBuy ? 'Memproses...' : 'Beli Sekarang'}
                </button>

                {/* Ajukan Kunjungan */}
                <button
                  onClick={() => setShowVisitModal(true)}
                  disabled={vehicle.status === 'sold'}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
                >
                  <CalendarRange className="w-4 h-4" />
                  Ajukan Kunjungan
                </button>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Ajukan Kunjungan Modal Popup */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-display font-bold text-base">Ajukan Kunjungan Fisik</h3>
                  <p className="text-[11px] text-slate-400">Unit: {vehicle.brand} {vehicle.model}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVisitModal(false);
                  setVisitSuccess(false);
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVisitSubmit} className="p-6 space-y-4">
              
              {visitSuccess ? (
                <div className="bg-green-50 border border-green-100 text-green-800 text-sm rounded-xl p-4 flex gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Pengajuan Berhasil!</p>
                    <p className="text-xs text-green-700 leading-relaxed mt-1">Permintaan kunjungan fisik Anda telah masuk ke antrean Admin Sistem. Kami akan segera menghubungi Anda untuk koordinasi jadwal terbaik.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
                    Ajukan jadwal perkiraan yang Anda inginkan (misal: "Sabtu pagi jam 10") atau tinggalkan catatan khusus mengenai bagian unit yang ingin Anda inspeksi secara mendalam.
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Catatan / Preferensi Jadwal Kunjungan
                    </label>
                    <textarea
                      required
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Masukkan catatan Anda..."
                      rows={3}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitModal(false);
                    setVisitSuccess(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Tutup
                </button>
                {!visitSuccess && (
                  <button
                    type="submit"
                    disabled={isSubmittingVisit}
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-all"
                  >
                    {isSubmittingVisit ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple small X component inline helper
const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
