import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAppState } from '../context/AppContext';
import { Search, ChevronRight, BookOpen, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Article } from '../types';

export const Articles: React.FC = () => {
  const { articles: allArticles } = useAppState();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Pagination states
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Categories from all articles
  const categories = useMemo(() => {
    const list = new Set(allArticles.filter(a => a.status === 'published').map((a) => a.category));
    return ['All', ...Array.from(list)];
  }, [allArticles]);

  // Fetch paginated & filtered articles
  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const qParts = [];
      qParts.push(`page=${page}`);
      qParts.push(`per_page=6`);
      if (search) qParts.push(`search=${encodeURIComponent(search)}`);
      if (category !== 'All') qParts.push(`category=${encodeURIComponent(category.toLowerCase())}`);

      const params = qParts.length > 0 ? `?${qParts.join('&')}` : '';
      const res = await api.articles.list(params);
      if (res.success && res.data) {
        setArticles(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalItems(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, search, category]);

  const handleFilterChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Helmet>
        <title>Artikel Edukasi &amp; Tips Otomotif - Sistem Jual Beli Aman</title>
        <meta name="description" content="Kumpulan panduan, tips pembelian kendaraan bekas bebas penipuan, cara cek dokumen asli, dan edukasi suku cadang berkualitas." />
      </Helmet>
      
      {/* Header */}
      <div className="space-y-1.5 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-100">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Artikel & Edukasi LCS</h1>
        <p className="text-slate-500 text-sm">
          Panduan komprehensif, tips inspeksi mandiri, cara merawat suku cadang, dan info terbaru seputar keselamatan jual beli kendaraan bekas.
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm grid md:grid-cols-12 gap-4">
        
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-2.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari topik artikel (contoh: dokumen, kampas rem, penipuan)..."
            className="pl-11 w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-green-600 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="md:col-span-4">
          <select
            value={category}
            onChange={handleFilterChange(setCategory)}
            className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
          >
            <option value="All">Semua Kategori Panduan</option>
            {categories.filter(c => c !== 'All').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Results */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
            Memuat artikel panduan...
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
            Artikel panduan edukasi tidak ditemukan.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((art) => (
              <Link
                key={art.id}
                to={`/articles/${art.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Cover photo */}
                <div className="aspect-video bg-slate-50 overflow-hidden relative">
                  <img
                    src={art.cover_url}
                    alt={art.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono backdrop-blur-xs">
                    {art.category}
                  </div>
                </div>

                {/* Content info */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="font-display font-bold text-slate-900 text-lg group-hover:text-green-700 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {art.seo_description || 'Pelajari selengkapnya seputar tips otomotif aman, verifikasi berkas hukum kendaraan bekas di ulasan edisi kali ini.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-xs font-semibold text-green-600 group-hover:text-green-700">
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      Diterbitkan: {new Date(art.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-0.5">
                      Baca Selengkapnya
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalItems} artikel)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
