import React from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { ShieldCheck, MapPin, Milestone, CalendarDays } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const coverPhoto = vehicle.photos?.find(p => p.is_cover)?.file_url || 
                     vehicle.photos?.[0]?.file_url || 
                     'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
      
      {/* Image Gallery Cover */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={coverPhoto}
          alt={`${vehicle.brand} ${vehicle.model}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Verification Badge */}
        {vehicle.document_status === 'verified' && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dokumen Terverifikasi ✓</span>
          </div>
        )}

        {/* Location tag */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs">
          <MapPin className="w-3 h-3 text-slate-300" />
          <span>{vehicle.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md w-fit font-bold">
          {vehicle.brand}
        </span>
        
        <h3 className="font-display font-bold text-slate-900 text-base mt-2 line-clamp-1 group-hover:text-green-700 transition-colors">
          {vehicle.model}
        </h3>

        {/* Tech Indicators */}
        <div className="grid grid-cols-2 gap-3 my-4 border-y border-slate-50 py-3 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Tahun {vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Milestone className="w-4 h-4 text-slate-400" />
            <span>{vehicle.mileage.toLocaleString('id-ID')} km</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Harga Penawaran</p>
            <p className="font-display font-bold text-slate-900 text-lg">
              {formatPrice(vehicle.price)}
            </p>
          </div>
          
          <Link
            to={`/katalog-kendaraan/${vehicle.id}`}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            Lihat Unit
          </Link>
        </div>
      </div>

    </div>
  );
};
