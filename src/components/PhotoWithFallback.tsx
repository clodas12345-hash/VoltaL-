import React, { useState } from 'react';
import { MapPin, Utensils, Wrench, ShoppingCart, Activity, Coffee, Store } from 'lucide-react';
import { PlaceCategory } from '../types';
import { useCachedPhoto } from '../utils/photoCache';

interface PhotoWithFallbackProps {
  name: string;
  photoUrl?: string;
  category?: PlaceCategory | string;
  className?: string;
}

const CATEGORY_THEMES: Record<string, { color: string; icon: any; fallbackPhoto: string }> = {
  'Padaria': {
    color: 'bg-amber-500',
    icon: Store,
    fallbackPhoto: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  },
  'Restaurante': {
    color: 'bg-rose-500',
    icon: Utensils,
    fallbackPhoto: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  },
  'Cafeteria': {
    color: 'bg-lime-600',
    icon: Coffee,
    fallbackPhoto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  },
  'Supermercado': {
    color: 'bg-blue-600',
    icon: ShoppingCart,
    fallbackPhoto: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80',
  },
  'Farmácia': {
    color: 'bg-emerald-500',
    icon: Activity,
    fallbackPhoto: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  },
  'Shopping': {
    color: 'bg-purple-600',
    icon: Store,
    fallbackPhoto: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&auto=format&fit=crop&q=80',
  },
  'Automotivo': {
    color: 'bg-blue-700',
    icon: Wrench,
    fallbackPhoto: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
  },
  'Outros': {
    color: 'bg-slate-600',
    icon: MapPin,
    fallbackPhoto: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
  },
};

export function PhotoWithFallback({ name, photoUrl, category, className = "" }: PhotoWithFallbackProps) {
  const [errorStage, setErrorStage] = useState<number>(0); // 0 = primary url, 1 = fallback unsplash, 2 = icon avatar
  const { src: cachedPhotoSrc } = useCachedPhoto(photoUrl);

  const catKey = (category as string) || 'Outros';
  const theme = CATEGORY_THEMES[catKey] || CATEGORY_THEMES['Outros'];
  const Icon = theme.icon;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const effectivePhoto = cachedPhotoSrc || photoUrl;

  // Primary image (cached or live)
  if (effectivePhoto && errorStage === 0) {
    return (
      <img 
        src={effectivePhoto} 
        alt={name} 
        className={`w-full h-full object-cover ${className}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setErrorStage(1)}
      />
    );
  }

  // Secondary Fallback: Curated High-Res Category Photo
  if (errorStage <= 1 && theme.fallbackPhoto) {
    return (
      <img 
        src={theme.fallbackPhoto} 
        alt={name} 
        className={`w-full h-full object-cover ${className}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setErrorStage(2)}
      />
    );
  }

  // Final Fallback: Elegant colored badge with icon & name
  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${theme.color} text-white font-bold h-full w-full ${className}`}>
      <div className="relative flex flex-col items-center">
        <span className="text-2xl sm:text-3xl opacity-20 absolute inset-0 flex items-center justify-center select-none">
          {initial}
        </span>
        <Icon className="w-8 h-8 relative z-10 drop-shadow-md" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 mt-1 px-2 text-center truncate w-full">
        {name}
      </span>
    </div>
  );
}
