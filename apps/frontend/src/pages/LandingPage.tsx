import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAppState } from '../context/AppContext';
import { VehicleCard } from '../components/VehicleCard';
import { ShieldCheck, MessageSquare, Handshake, CheckCircle2, ChevronRight, Send, HelpCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { vehicles, articles, addLead } = useAppState();
  
  // Leads contact form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    setSuccess(false);
    try {
      const ok = await addLead({
        source: 'contact_form',
        name,
        phone,
        email: email || undefined,
        message: msg
      });
      if (ok) {
        setSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        setMsg('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuredVehicles = vehicles.slice(0, 3);
  const featuredArticles = articles.slice(0, 2);

  return (
    <div className="space-y-16 pb-12">
      <Helmet>
        <title>Sistem Jual Beli Kendaraan Second &amp; Suku Cadang Escrow</title>
        <meta name="description" content="Platform transaksi kendaraan bekas dan suku cadang aman dengan perlindungan escrow dan verifikasi fisik admin sistem." />
      </Helmet>
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-900/40 via-slate-950 to-slate-950 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Sistem Escrow & Verifikasi Dokumen 100% Aman</span>
            </div>
            
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-white">
              Beli Kendaraan Bekas <span className="text-green-500">Tanpa Rasa Khawatir</span>
            </h1>
            
            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Platform jual beli kendaraan second & suku cadang dengan <strong className="text-white">Inspeksi Dokumen Fisik</strong> oleh Admin, sistem <strong className="text-white">Kunjungan Fisik Terjadwal</strong>, dan metode <strong className="text-white">Pembayaran Escrow</strong> aman.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/katalog-kendaraan"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1"
              >
                Cari Mobil Bekas
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/articles"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-all"
              >
                Pelajari Tips Keamanan
              </Link>
            </div>
          </div>

          {/* Visual USP Board */}
          <div className="md:col-span-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-100">3 Pilar Garansi Transaksi Aman</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400 flex-shrink-0 border border-green-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">1. Inspeksi Dokumen Asli</h4>
                  <p className="text-xs text-slate-400 mt-1">Admin memeriksa fisik STNK, BPKB, dan pajak aktif sebelum kendaraan diiklankan.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400 flex-shrink-0 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">2. Kunjungan Fisik Terjadwal</h4>
                  <p className="text-xs text-slate-400 mt-1">Pembeli dapat mengajukan inspeksi langsung yang dikoordinasikan secara transparan oleh Admin.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400 flex-shrink-0 border border-green-500/20">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">3. Escrow Manual (Escrow-Lite)</h4>
                  <p className="text-xs text-slate-400 mt-1">Uang pembayaran Anda ditahan di rekening penampung platform hingga serah terima unit selesai.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Verified Vehicles Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Rekomendasi Mobil Pilihan</h2>
            <p className="text-slate-500 text-sm mt-1">Unit terverifikasi dokumen oleh tim Admin.</p>
          </div>
          <Link to="/katalog-kendaraan" className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
            Lihat Semua Unit
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
            Belum ada rekomendasi unit kendaraan tayang saat ini.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* Educational Blog Articles Block */}
      <section className="bg-slate-100/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Edukasi Keamanan & Perawatan</h2>
              <p className="text-slate-500 text-sm mt-1">Panduan praktis agar Anda terhindar dari penipuan jual beli.</p>
            </div>
            <Link to="/articles" className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
              Lihat Artikel
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredArticles.map((art) => (
              <Link
                key={art.id}
                to={`/articles/${art.slug}`}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 group"
              >
                <div className="w-full md:w-36 aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                  <img
                    src={art.cover_url}
                    alt={art.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-green-600 tracking-wider bg-green-50 px-2 py-0.5 rounded-sm">
                    {art.category}
                  </span>
                  <h3 className="font-display font-bold text-slate-800 text-base line-clamp-2 group-hover:text-green-700 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {art.seo_description || 'Baca panduan lengkap selengkapnya di artikel edisi terbaru ini.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Leads Generation Form (Hubungi Kami) */}
      <section id="contact-form" className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Ajukan Pertanyaan Umum</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Tim admin sistem kami siap membantu menjawab pertanyaan seputar verifikasi unit atau kendala transaksi.
            </p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-100 text-green-800 text-sm rounded-xl p-4 flex gap-2.5 items-center animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p>Terima kasih! Pertanyaan Anda telah dicatat sebagai Leads. Tim Admin kami akan segera menghubungi Anda melalui nomor telepon/WhatsApp.</p>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon / WA *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Alamat Email (Opsional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Isi Pertanyaan
              </label>
              <textarea
                rows={3}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Tuliskan pertanyaan Anda secara detail di sini..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors disabled:bg-slate-300"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Pertanyaan'}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};
