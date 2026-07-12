import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { SparePartCard } from '../components/SparePartCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { SparePart } from '../types';

export const SparePartKatalog: React.FC = () => {
  const { spareParts: allSpareParts } = useAppState();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');

  // Pagination states
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic unique categories from all loaded parts
  const categories = useMemo(() => {
    const list = new Set(allSpareParts.filter(sp => sp.status === 'published').map((sp) => sp.category));
    return ['All', ...Array.from(list)];
  }, [allSpareParts]);

  // Fetch paginated & filtered from API
  const fetchSpareParts = async () => {
    setIsLoading(true);
    try {
      const qParts = [];
      qParts.push(`page=${page}`);
      qParts.push(`per_page=8`); // 8 items per page for parts grid (4x2 grid)
      if (search) qParts.push(`search=${encodeURIComponent(search)}`);
      if (category !== 'All') qParts.push(`category=${encodeURIComponent(category.toLowerCase())}`);
      if (condition !== 'All') qParts.push(`condition=${encodeURIComponent(condition.toLowerCase())}`);

      const params = qParts.length > 0 ? `?${qParts.join('&')}` : '';
      const res = await api.spareParts.list(params);
      if (res.success && res.data) {
        setSpareParts(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalItems(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching spare parts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpareParts();
  }, [page, search, category, condition]);

  const handleFilterChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Katalog Suku Cadang</h1>
        <p className="text-slate-500 text-sm">Suku cadang orisinil (baru & bekas layak pakai) untuk perawatan mobil kesayangan Anda.</p>
      </div>

      {/* Filter and Search Box Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm grid md:grid-cols-12 gap-4">
        
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau deskripsi suku cadang..."
            className="pl-11 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-green-600 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3 space-y-1">
          <select
            value={category}
            onChange={handleFilterChange(setCategory)}
            className="w-full text-xs px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
          >
            <option value="All">Semua Kategori</option>
            {categories.filter(c => c !== 'All').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Condition Filter */}
        <div className="md:col-span-3 space-y-1">
          <select
            value={condition}
            onChange={handleFilterChange(setCondition)}
            className="w-full text-xs px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
          >
            <option value="All">Semua Kondisi</option>
            <option value="new">Baru (New Genuine)</option>
            <option value="used">Bekas Layak Pakai</option>
          </select>
        </div>

      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-xs text-slate-400">Menampilkan {spareParts.length} dari {totalItems} produk suku cadang</p>

        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
            Memuat katalog suku cadang...
          </div>
        ) : spareParts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
            Suku cadang yang dicari tidak ditemukan dengan filter saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {spareParts.map((sp) => (
              <SparePartCard key={sp.id} sparePart={sp} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
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
