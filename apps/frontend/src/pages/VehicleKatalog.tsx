import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { VehicleCard } from '../components/VehicleCard';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Vehicle } from '../types';

export const VehicleKatalog: React.FC = () => {
  const { vehicles: allVehicles } = useAppState();

  // Filter States
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All');
  const [location, setLocation] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [docStatus, setDocStatus] = useState('All');

  // Pagination states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Unique Brands & Locations for Filter Selects (from global/all list)
  const brands = useMemo(() => {
    const list = new Set(allVehicles.filter(v => v.status === 'published').map((v) => v.brand));
    return ['All', ...Array.from(list)];
  }, [allVehicles]);

  const locations = useMemo(() => {
    const list = new Set(allVehicles.filter(v => v.status === 'published').map((v) => v.location));
    return ['All', ...Array.from(list)];
  }, [allVehicles]);

  // Fetch paginated & filtered data from API
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const qParts = [];
      qParts.push(`page=${page}`);
      qParts.push(`per_page=6`);
      if (search) qParts.push(`search=${encodeURIComponent(search)}`);
      if (brand !== 'All') qParts.push(`brand=${encodeURIComponent(brand)}`);
      if (location !== 'All') qParts.push(`location=${encodeURIComponent(location)}`);
      if (docStatus !== 'All') qParts.push(`document_status=${encodeURIComponent(docStatus)}`);
      if (minPrice) qParts.push(`price_min=${minPrice}`);
      if (maxPrice) qParts.push(`price_max=${maxPrice}`);

      const params = qParts.length > 0 ? `?${qParts.join('&')}` : '';
      const res = await api.vehicles.list(params);
      if (res.success && res.data) {
        setVehicles(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalItems(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, search, brand, location, docStatus, minPrice, maxPrice]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Katalog Mobil Bekas</h1>
        <p className="text-slate-500 text-sm">Temukan mobil impian Anda dengan status dokumen fisik yang telah diverifikasi secara transparan.</p>
      </div>

      {/* Filter and Search Box Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari merk mobil, model (contoh: Avanza, Civic, Turbo)..."
            className="pl-11 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-green-600 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Brand */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Merk</label>
            <select
              value={brand}
              onChange={handleFilterChange(setBrand)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
            >
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Kota Lokasi</label>
            <select
              value={location}
              onChange={handleFilterChange(setLocation)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
            >
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Verification Badge filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Dokumen</label>
            <select
              value={docStatus}
              onChange={handleFilterChange(setDocStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
            >
              <option value="All">Semua</option>
              <option value="verified">Terverifikasi ✓</option>
              <option value="unverified">Belum Diverifikasi</option>
            </select>
          </div>

          {/* Min Price */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Harga Min (IDR)</label>
            <input
              type="number"
              value={minPrice}
              onChange={handleFilterChange(setMinPrice)}
              placeholder="Min..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
            />
          </div>

          {/* Max Price */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Harga Maks (IDR)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={handleFilterChange(setMaxPrice)}
              placeholder="Maks..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-green-600 focus:bg-white"
            />
          </div>

        </div>

      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>Menampilkan {vehicles.length} dari {totalItems} unit kendaraan</p>
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Urutkan: Terbaru</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
            Memuat data katalog mobil...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
            Unit kendaraan yang dicari tidak ditemukan dengan filter saat ini.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
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
