import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Plus, Compass, Star, Search, X, Settings, Radio, Sliders, Power, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { PlaceCategory, RadarConfig } from '../types';
import { GKDLogo } from './GKDLogo';

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '1,5 km', value: 1500 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
];

interface HeaderProps {
  isTrackingLocation?: boolean;
  onLocateUser: () => void;
  onResetNorth?: () => void;
  mapHeading?: number;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenAddCustomPin: () => void;
  onOpenProximityList: () => void;
  onOpenRadar: () => void;
  onTurnOffRadar?: () => void;
  radarConfig: RadarConfig;
  radarDetectedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onFilterClick?: (category: string | null) => void;
  categories: PlaceCategory[];
  onOpenSettings: () => void;
  searchRadiusMeters?: number;
  onSearchRadiusChange?: (radiusMeters: number) => void;
}

export function Header({
  isTrackingLocation,
  onLocateUser,
  onResetNorth,
  mapHeading = 0,
  savedCount,
  onOpenSaved,
  onOpenAddCustomPin,
  onOpenProximityList,
  onOpenRadar,
  onTurnOffRadar,
  radarConfig,
  radarDetectedCount,
  searchQuery,
  onSearchChange,
  onFilterClick,
  categories,
  onOpenSettings,
  searchRadiusMeters = 1500,
  onSearchRadiusChange,
}: HeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isRadiusSelectorOpen, setIsRadiusSelectorOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce logic for precision searching - optimized to 280ms for instant feel
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchChange(localSearch);
    }, 280);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    inputRef.current?.blur();
    setIsSearchFocused(false);
    onSearchChange(localSearch);
  };

  const radiusFormatted = searchRadiusMeters >= 1000 
    ? `${(searchRadiusMeters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` 
    : `${searchRadiusMeters} m`;

  // If RADAR IS ACTIVATED: Completely hide the search bar and categories row,
  // showing only the clean, non-intrusive Radar Mode Top Bar!
  if (radarConfig.isActive) {
    return (
      <header className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 flex flex-col gap-2 pointer-events-none max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900/95 backdrop-blur-md rounded-full shadow-2xl flex items-center p-2 pointer-events-auto border-2 border-emerald-500/80 w-full gap-2 px-3 text-white"
        >
          {/* Settings icon */}
          <button 
            onClick={onOpenSettings} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full shrink-0 transition-colors cursor-pointer"
            title="Configurações e Ajuda"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="shrink-0 bg-white/90 px-2 py-0.5 rounded-full flex items-center">
            <GKDLogo />
          </div>

          <div className="w-px h-6 bg-slate-700 mx-0.5 shrink-0" />

          {/* Active Radar Info Pill */}
          <button
            onClick={onOpenRadar}
            className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer group hover:opacity-90 transition-opacity"
            title="Toque para alterar comida ou raio do radar"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <Radio className="w-4 h-4 text-emerald-400 relative z-10" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-black text-emerald-400 truncate">
                  {radarConfig.keyword}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-400/40 shrink-0">
                  {radarConfig.radiusMeters >= 1000 ? `${(radarConfig.radiusMeters / 1000).toFixed(1)} km` : `${radarConfig.radiusMeters} m`}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                {radarDetectedCount > 0 
                  ? `⚡ ${radarDetectedCount} local(is) no raio!` 
                  : 'Varrendo GPS em tempo real...'}
              </p>
            </div>
          </button>

          {/* Quick Adjust Button */}
          <button
            onClick={onOpenRadar}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1"
            title="Configurar Radar"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Ajustar</span>
          </button>

          {/* Turn Off Radar Button */}
          <button
            onClick={() => {
              if (onTurnOffRadar) {
                onTurnOffRadar();
              }
            }}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded-full transition-colors cursor-pointer shrink-0 border border-slate-700 hover:border-rose-500/50"
            title="Desligar radar e voltar à busca"
          >
            <Power className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Floating Quick Action Buttons while in Radar Mode */}
        <div className="flex items-center gap-2 pointer-events-auto justify-end mt-0">
          <button 
            onClick={onOpenAddCustomPin} 
            className="bg-white/95 shadow-md p-2.5 rounded-full text-emerald-600 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Adicionar Local"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenSaved} 
            className="bg-white/95 shadow-md p-2.5 rounded-full text-blue-600 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Locais Salvos"
          >
            <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
          </button>
        </div>
      </header>
    );
  }

  // STANDARD MODE: Radar is OFF -> Show full Search Bar + Radius Config + Categories Row
  return (
    <header className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 flex flex-col gap-1.5 sm:gap-2 pointer-events-none max-w-xl mx-auto">
      {/* Top Search Bar Pill */}
      <div className={`bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center p-1 sm:p-1.5 pointer-events-auto border transition-all duration-200 w-full gap-1.5 sm:gap-2 px-2 sm:px-3 ${
        isSearchFocused ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-slate-200'
      }`}>
        <button 
          onClick={onOpenSettings} 
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shrink-0 transition-colors cursor-pointer"
          title="Configurações e Ajuda"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <GKDLogo />

        <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 shrink-0" />
        
        {/* Search Input wrapped in Form for Virtual Keyboard 'Ir' / Enter Submission */}
        <form 
          action=""
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center px-1 min-w-0"
        >
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            className="w-full bg-transparent border-none outline-none text-slate-800 text-sm sm:text-base py-1.5 placeholder:text-slate-400 truncate"
            placeholder={isSearchFocused ? "Digite o nome (ex: Avelinos Car)..." : `Buscar (${radiusFormatted})...`}
            value={localSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit(e);
              }
            }}
          />
          {localSearch && (
            <button 
              type="button"
              onClick={() => { 
                setLocalSearch(''); 
                onSearchChange(''); 
                inputRef.current?.focus();
              }} 
              className="p-1 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Quick Radius Selector Trigger Button */}
        <button
          type="button"
          onClick={() => setIsRadiusSelectorOpen(!isRadiusSelectorOpen)}
          className={`px-2 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer border ${
            isRadiusSelectorOpen
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="Alterar raio de pesquisa no mapa"
        >
          <span>{radiusFormatted}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isRadiusSelectorOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Search execute button (Ir / Buscar) */}
        <button 
          type="button"
          onClick={() => handleSearchSubmit()} 
          className="bg-blue-600 text-white p-2 sm:p-2.5 rounded-full shrink-0 shadow-md hover:bg-blue-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Pesquisar (ou pressione 'Ir' no teclado)"
        >
          <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>

      {/* Expandable Radius Selection Bar */}
      <AnimatePresence>
        {isRadiusSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-700/80 pointer-events-auto flex flex-col gap-1.5 text-white"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                Escolha o Raio de Pesquisa
              </span>
              <button
                onClick={() => setIsRadiusSelectorOpen(false)}
                className="text-[11px] text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Fechar
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = searchRadiusMeters === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (onSearchRadiusChange) {
                        onSearchRadiusChange(opt.value);
                      }
                      setIsRadiusSelectorOpen(false);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-300/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Horizontal Scroll Row - automatically collapses when typing to avoid overlapping */}
      {!isSearchFocused && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="w-full overflow-x-auto no-scrollbar pointer-events-auto"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 px-0.5">
            <button
              onClick={() => {
                if (onFilterClick) onFilterClick(null);
                setLocalSearch('');
              }}
              className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition-colors border cursor-pointer ${
                searchQuery === ''
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const isActive = searchQuery === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (onFilterClick) onFilterClick(cat);
                    setLocalSearch(searchQuery === cat ? '' : cat);
                  }}
                  className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition-colors border cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Action Buttons Row - automatically collapses when typing to prevent overlapping */}
      {!isSearchFocused && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto justify-end mt-0"
        >
          {/* Radar Button with active pulse */}
          <button
            onClick={onOpenRadar}
            className="shadow-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-100"
            title="Ligar Radar Proativo"
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>Radar</span>
          </button>

          {searchQuery !== '' && (
            <button 
              onClick={onOpenProximityList} 
              className="bg-white shadow-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-slate-700 font-semibold text-xs border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-1.5 animate-fadeIn cursor-pointer"
              title="Lista de Locais"
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 animate-spin-slow" />
              <span>Lista</span>
            </button>
          )}
          <button 
            onClick={onOpenAddCustomPin} 
            className="bg-white shadow-md p-2 sm:p-2.5 rounded-full text-emerald-600 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Adicionar Local"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={onOpenSaved} 
            className="bg-white shadow-md p-2 sm:p-2.5 rounded-full text-blue-600 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Locais Salvos"
          >
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-blue-600 text-blue-600" />
          </button>
        </motion.div>
      )}
    </header>
  );
}
