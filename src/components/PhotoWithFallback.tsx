import React, { useState } from 'react';
import { MapPin, Utensils, Wrench, ShoppingCart, Activity, Coffee, Star, Info } from 'lucide-react';
import { PlaceCategory } from '../types';

interface PhotoWithFallbackProps {
  name: string;
  photoUrl?: string;
  category?: PlaceCategory | string;
  className?: string;
}

const CATEGORY_THEMES: Record<string, { color: string; icon: any }> = {
  'Restaurante': { color: 'bg-orange-500', icon: Utensils },
  'Lazer': { color: 'bg-purple-500', icon: Coffee },
  'Mercados': { color: 'bg-emerald-500', icon: ShoppingCart },
  'Saúde': { color: 'bg-rose-500', icon: Activity },
  'Mecânica': { color: 'bg-slate-700', icon: Wrench },
  'Utilidades': { color: 'bg-blue-500', icon: Info },
  'Outros': { color: 'bg-indigo-500', icon: MapPin },
};

export function PhotoWithFallback({ name, photoUrl, category, className = "" }: PhotoWithFallbackProps) {
  const [error, setError] = useState(false);
  const theme = CATEGORY_THEMES[category as string] || CATEGORY_THEMES['Outros'];
  const Icon = theme.icon;
  const initial = name.charAt(0).toUpperCase();

  // If we have a URL and no error has occurred yet
  if (photoUrl && !error) {
    return (
      <img 
        src={photoUrl} 
        alt={name} 
        className={`w-full h-full object-cover ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  // Fallback: Elegant colored avatar with initial and category icon
  // This is only used if both official photo AND Street View fallback fail
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
