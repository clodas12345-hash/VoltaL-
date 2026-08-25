import React, { useState } from 'react';
import { X, MapPin, Navigation, Star, Compass, Clock, Phone, DollarSign, ChevronDown, ChevronUp, SlidersHorizontal, Check } from 'lucide-react';
import { MapPin as MapPinType } from '../types';
import { getOpeningStatus, getWeekdaySchedules, getDefaultOpeningHoursForCategory } from '../utils/openingHours';

interface SearchProximityListModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: MapPinType[];
  userLocation: { lat: number; lng: number } | null;
  onSelectPlace: (place: MapPinType) => void;
  onNavigate: (place: MapPinType) => void;
  searchRadiusMeters?: number;
  onRadiusChange?: (radiusMeters: number) => void;
  searchQuery?: string;
}

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '1,5 km', value: 1500 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
];

export function SearchProximityListModal({
  isOpen,
  onClose,
  searchResults,
  userLocation,
  onSelectPlace,
  onNavigate,
  searchRadiusMeters = 1500,
  onRadiusChange,
  searchQuery = '',
}: SearchProximityListModalProps) {
  const [expandedHoursPlaceId, setExpandedHoursPlaceId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Haversine distance calculation in meters/km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const currentCenter = userLocation || { lat: -23.5505, lng: -46.6333 };

  // Sort search results by distance from userLocation
  const sortedResults = [...searchResults].sort((a, b) => {
    const distA = getDistance(currentCenter.lat, currentCenter.lng, a.lat, a.lng);
    const distB = getDistance(currentCenter.lat, currentCenter.lng, b.lat, b.lng);
    return distA - distB;
  });

  const radiusFormatted = searchRadiusMeters >= 1000 
    ? `${(searchRadiusMeters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` 
    : `${searchRadiusMeters} m`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Lista de Locais</h2>
                <p className="text-xs text-slate-400">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Locais ordenados por proximidade'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Radius Selector Pills */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                Raio de Pesquisa
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {radiusFormatted}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = searchRadiusMeters === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onRadiusChange && onRadiusChange(opt.value)}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {sortedResults.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-700 text-base">Nenhum local encontrado no raio de {radiusFormatted}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tente aumentar o raio de pesquisa acima para 3 km, 5 km ou 10 km para encontrar mais estabelecimentos.
              </p>
            </div>
          ) : (
            sortedResults.map((place, index) => {
              const distKm = getDistance(currentCenter.lat, currentCenter.lng, place.lat, place.lng);
              const distText = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;

              const effectiveHours = (place.openingHours && place.openingHours.length > 0)
                ? place.openingHours
                : getDefaultOpeningHoursForCategory(place.category, place.name);
              const opStatus = getOpeningStatus(effectiveHours);
              const isHoursExpanded = expandedHoursPlaceId === (place.id || String(index));
              const weekdaySchedules = isHoursExpanded ? getWeekdaySchedules(effectiveHours) : [];

              return (
                <div
                  key={place.id || index}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 transition-all shadow-xs hover:shadow-md hover:border-emerald-300 flex flex-col gap-3 group"
                >
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {place.photoUrl ? (
                        <div 
                          className="w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer bg-slate-100"
                          onClick={() => onSelectPlace(place)}
                        >
                          <img 
                            src={place.photoUrl} 
                            alt={place.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
                          onClick={() => onSelectPlace(place)}
                        >
                          {index + 1}
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {place.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                              {place.category}
                            </span>
                          )}
                          {place.priceLevel && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {place.priceLevel}
                            </span>
                          )}
                        </div>

                        <h4 
                          onClick={() => onSelectPlace(place)}
                          className="font-bold text-slate-900 text-sm sm:text-base leading-snug cursor-pointer group-hover:text-emerald-700 transition-colors"
                        >
                          {place.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{place.address}</p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onSelectPlace(place)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        title="Ver ficha completa"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => {
                          onNavigate(place);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer"
                        title="Iniciar rota até o local"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-white" />
                        <span>Ir</span>
                      </button>
                    </div>
                  </div>

                  {/* Informações Básicas: Distância, Avaliação, Horário de Funcionamento & Telefone */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Distância */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                          📍 {distText} de você
                        </span>

                        {/* Status Aberto/Fechado */}
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          opStatus.isOpen 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${opStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {opStatus.statusText}
                        </span>

                        {/* Avaliação */}
                        {place.rating && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {place.rating} {place.userRatingsTotal ? `(${place.userRatingsTotal})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Botão para ver horários da semana */}
                      <button
                        type="button"
                        onClick={() => setExpandedHoursPlaceId(isHoursExpanded ? null : (place.id || String(index)))}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer ml-auto"
                      >
                        <span>{isHoursExpanded ? 'Ocultar horários' : 'Ver semana'}</span>
                        {isHoursExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Horário de Hoje */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 pt-1 border-t border-slate-200/60">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-500 text-[11px]">Hoje:</span>
                      <span className={opStatus.isOpen ? 'font-bold text-emerald-700' : 'font-semibold text-slate-800'}>
                        {opStatus.todaySchedule}
                      </span>
                      {opStatus.detailText && opStatus.detailText !== opStatus.todaySchedule && (
                        <span className="text-[11px] text-slate-500">
                          • {opStatus.detailText}
                        </span>
                      )}
                    </div>

                    {/* Telefone para contato se disponível */}
                    {place.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-500 text-[11px]">Telefone:</span>
                        <a 
                          href={`tel:${place.phoneNumber.replace(/\s+/g, '')}`}
                          className="font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {place.phoneNumber}
                        </a>
                      </div>
                    )}

                    {/* Grade Semanal Expandida */}
                    {isHoursExpanded && (
                      <div className="mt-1 pt-2 border-t border-slate-200 text-xs space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400 flex justify-between pb-1 border-b border-slate-100">
                          <span>Dia da Semana</span>
                          <span>Horário</span>
                        </div>
                        {weekdaySchedules.map((schedule, sIdx) => (
                          <div
                            key={sIdx}
                            className={`flex justify-between items-center py-0.5 px-1.5 rounded ${
                              schedule.isToday ? 'bg-emerald-50 font-bold text-emerald-950' : 'text-slate-600'
                            }`}
                          >
                            <span className="capitalize text-[11px] flex items-center gap-1">
                              {schedule.dayName}
                              {schedule.isToday && (
                                <span className="text-[9px] bg-emerald-600 text-white font-bold px-1 rounded-sm uppercase">Hoje</span>
                              )}
                            </span>
                            <span className={`text-[11px] ${schedule.isClosed ? 'text-rose-600 font-semibold' : schedule.isToday ? 'text-emerald-700 font-bold' : 'text-slate-700 font-medium'}`}>
                              {schedule.hours}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            Mostrando <b>{sortedResults.length}</b> locais no raio de <b>{radiusFormatted}</b>
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
