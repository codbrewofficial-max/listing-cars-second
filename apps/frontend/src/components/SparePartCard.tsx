import React from 'react';
import { Link } from 'react-router-dom';
import { SparePart } from '../types';
import { Check } from 'lucide-react';

interface SparePartCardProps {
  sparePart: SparePart;
}

export const SparePartCard: React.FC<SparePartCardProps> = ({ sparePart }) => {
  const coverPhoto = sparePart.photos?.[0]?.file_url || 
                     'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
      
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={coverPhoto}
          alt={sparePart.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Condition Badge */}
        <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-md ${
          sparePart.condition === 'new' 
            ? 'bg-blue-600 text-white' 
            : 'bg-amber-600 text-white'
        }`}>
          {sparePart.condition === 'new' ? 'BARU' : 'BEKAS'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
          {sparePart.category}
        </span>

        <h3 className="font-display font-bold text-slate-800 text-sm mt-1 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
          {sparePart.name}
        </h3>

        {/* Price & Button */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
          <p className="font-display font-bold text-slate-900 text-sm">
            {formatPrice(sparePart.price)}
          </p>

          <Link
            to={`/katalog-sparepart/${sparePart.id}`}
            className="px-3.5 py-1.5 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
          >
            Beli
          </Link>
        </div>
      </div>

    </div>
  );
};
