import React, { useState } from 'react';
import { X, Trash2, Edit3, MapPin, Star, Navigation, Search, Bookmark, Filter, Clock } from 'lucide-react';
import { SavedPlace, PlaceCategory } from '../types';
import { getOpeningStatus, getDefaultOpeningHoursForCategory } from '../utils/openingHours';

interface SavedPlacesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlaces: SavedPlace[];
  onSelectPlace: (place: SavedPlace) => void;
  onEditPlace: (place: SavedPlace) => void;
  onDeletePlace: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  categories: PlaceCategory[];
}

export function SavedPlacesSidebar({
  isOpen,
  onClose,
  savedPlaces,
  onSelectPlace,
  onEditPlace,
  onDeletePlace,
  userLocation,
  categories,
}: SavedPlacesSidebarProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'Todos'>('Todos');

  const allCategories = ['Todos', ...categories];

  if (!isOpen) return null;

  const filteredPlaces = savedPlaces.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Locais Salvos</h2>
              <p className="text-xs text-slate-500">{savedPlaces.length} locais na sua lista</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nos salvos (nome, notas...)"
              className="w-full bg-slate-100 text-sm pl-9 pr-3 py-2 rounded-xl outline-none focus:bg-white focus:border-blue-500 border border-slate-200 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of Places */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Nenhum local encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Explore o mapa ou busque estabelecimentos para salvar nos favoritos.
              </p>
            </div>
          ) : (
            filteredPlaces.map((place) => {
              // Calculate distance
              let distStr = '';
              if (userLocation) {
                const R = 6371;
                const dLat = (place.lat - userLocation.lat) * (Math.PI / 180);
                const dLng = (place.lng - userLocation.lng) * (Math.PI / 180);
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(userLocation.lat * (Math.PI / 180)) *
                    Math.cos(place.lat * (Math.PI / 180)) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;
                distStr = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
              }

              const effectiveHours = (place.openingHours && place.openingHours.length > 0)
                ? place.openingHours
                : getDefaultOpeningHoursForCategory(place.category, place.name);
              const opStatus = getOpeningStatus(effectiveHours);

              return (
                <div
                  key={place.id}
                  onClick={() => { onSelectPlace(place); onClose(); }}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {place.category}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          opStatus.isOpen 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${opStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {opStatus.statusText}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {place.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditPlace(place); }}
                        title="Editar categoria ou notas"
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePlace(place.id); }}
                        title="Excluir"
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{place.address}</span>
                  </div>

                  {place.notes && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900 italic">
                      "{place.notes}"
                    </div>
                  )}

                  {place.customPhotos && place.customPhotos.filter(p => typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('http')) && p.length > 50).length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="flex -space-x-2 overflow-hidden py-0.5">
                        {place.customPhotos.filter(p => typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('http')) && p.length > 50).slice(0, 3).map((photo, i) => (
                          <img 
                            key={i} 
                            src={photo} 
                            alt={`Foto ${i + 1}`} 
                            className="inline-block w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium ml-1">
                        {place.customPhotos.filter(p => typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('http')) && p.length > 50).length} {place.customPhotos.filter(p => typeof p === 'string' && (p.startsWith('data:image/') || p.startsWith('http')) && p.length > 50).length === 1 ? 'foto salva' : 'fotos salvas'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      {typeof place.rating === 'number' && (
                        <div className="flex items-center text-amber-500 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                          <span>{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {distStr && (
                        <div className="flex items-center text-blue-600 font-medium">
                          <Navigation className="w-3.5 h-3.5 mr-1" />
                          <span>{distStr}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-blue-600 font-medium group-hover:underline text-xs">
                      Ver no Mapa &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
