import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, useAppState } from '../context/AppContext';
import { api } from '../lib/api';
import { SparePart } from '../types';
import { ArrowLeft, ShoppingCart, Tag, AlertCircle } from 'lucide-react';

export const SparePartDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addTransaction } = useAppState();

  const [part, setPart] = useState<SparePart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buySuccessId, setBuySuccessId] = useState<string | null>(null);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.spareParts.get(id);
        if (res.success && res.data) {
          setPart(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleBuy = async () => {
    if (!id || !isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsSubmittingBuy(true);
    try {
      const txId = await addTransaction('spare_part', id, 1);
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
        Memuat detail suku cadang...
      </div>
    );
  }

  if (!part) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 text-sm space-y-4">
        <p>Suku cadang tidak ditemukan.</p>
        <Link to="/katalog-sparepart" className="text-green-600 font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  const coverPhoto = part.photos?.[0]?.file_url || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Back link */}
      <Link to="/katalog-sparepart" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Suku Cadang
      </Link>

      <div className="grid md:grid-cols-12 gap-8 items-start bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs">
        
        {/* Photo aspect square */}
        <div className="md:col-span-5 aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
          <img
            src={coverPhoto}
            alt={part.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info detail */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {part.category}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                part.condition === 'new' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {part.condition === 'new' ? 'BARU' : 'BEKAS'}
              </span>
            </div>

            <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight leading-snug">
              {part.name}
            </h1>

            <p className="font-display font-bold text-slate-900 text-3xl">
              {formatPrice(part.price)}
            </p>
          </div>

          <div className="h-[1px] bg-slate-100"></div>

          <div className="space-y-2">
            <h3 className="font-display font-semibold text-slate-900 text-sm">Deskripsi Suku Cadang</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {part.description || 'Tidak ada deskripsi tambahan.'}
            </p>
          </div>

          <div className="h-[1px] bg-slate-100"></div>

          {/* Action box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
            <div className="flex gap-2 text-slate-500 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p>Pembelian suku cadang diamankan dengan escrow manual platform. Uang Anda disimpan aman di platform hingga suku cadang dikirimkan dan diterima dengan baik.</p>
            </div>

            {buySuccessId ? (
              <div className="bg-green-50 border border-green-100 text-green-800 text-xs rounded-xl p-4 space-y-2 animate-fade-in">
                <p className="font-bold">✓ Transaksi Pembelian Suku Cadang Sukses Dibuat!</p>
                <p>Silakan buka Dashboard Customer Anda untuk mengunggah bukti transfer manual escrow.</p>
                <Link to="/dashboard/customer?tab=transactions" className="inline-block mt-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                  Buka Riwayat Transaksi
                </Link>
              </div>
            ) : (
              <button
                onClick={handleBuy}
                disabled={isSubmittingBuy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-xs transition-all text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {isSubmittingBuy ? 'Memproses...' : 'Beli Suku Cadang'}
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
