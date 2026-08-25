import React, { useState } from 'react';
import { X, Radio, MapPin, Navigation, Star, Sparkles, UtensilsCrossed, Volume2, VolumeX, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { RadarConfig, MapPin as MapPinType } from '../types';

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  radarConfig: RadarConfig;
  onUpdateRadarConfig: (newConfig: RadarConfig) => void;
  detectedPlaces: { place: MapPinType; distanceMeters: number }[];
  onSelectPlace: (place: MapPinType) => void;
  onNavigate: (place: MapPinType) => void;
}

const QUICK_SUGGESTIONS = [
  { label: 'Comida Mexicana', icon: '🌮' },
  { label: 'Maniçoba / Paraense', icon: '🥘' },
  { label: 'Hambúrguer Artesanal', icon: '🍔' },
  { label: 'Pizza & Massas', icon: '🍕' },
  { label: 'Culinária Japonesa (Sushi)', icon: '🍣' },
  { label: 'Churrascaria & Carnes', icon: '🥩' },
  { label: 'Cafeteria & Doces', icon: '☕' },
  { label: 'Padaria & Lanches', icon: '🥐' },
  { label: 'Pastelaria', icon: '🥟' },
  { label: 'Açaí & Sorvetes', icon: '🍨' },
  { label: 'Farmácia 24h', icon: '💊' },
];

export function RadarModal({
  isOpen,
  onClose,
  radarConfig,
  onUpdateRadarConfig,
  detectedPlaces,
  onSelectPlace,
  onNavigate,
}: RadarModalProps) {
  const [keyword, setKeyword] = useState(radarConfig.keyword || 'Comida Mexicana');
  const [radiusMeters, setRadiusMeters] = useState(radarConfig.radiusMeters || 1000);
  const [soundEnabled, setSoundEnabled] = useState(radarConfig.soundEnabled !== false);
  const [vibrationEnabled, setVibrationEnabled] = useState(radarConfig.vibrationEnabled !== false);

  if (!isOpen) return null;

  const handleToggleRadar = () => {
    const nextActive = !radarConfig.isActive;
    onUpdateRadarConfig({
      isActive: nextActive,
      keyword: keyword.trim() || 'Comida Mexicana',
      radiusMeters,
      soundEnabled,
      vibrationEnabled,
    });
  };

  const handleApplyConfig = (activate = true) => {
    onUpdateRadarConfig({
      isActive: activate,
      keyword: keyword.trim() || 'Comida Mexicana',
      radiusMeters,
      soundEnabled,
      vibrationEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${radarConfig.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Radio className={`w-6 h-6 ${radarConfig.isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Radar Proativo</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${radarConfig.isActive ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-slate-800 text-slate-400'}`}>
                  {radarConfig.isActive ? 'Ligado' : 'Desligado'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Avisa com pop-up e foto quando você passar perto (raio de 1 km)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main Activation Banner */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${radarConfig.isActive ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">
                {radarConfig.isActive ? 'Radar está rastreando em tempo real' : 'Ativar monitoramento de proximidade'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {radarConfig.isActive 
                  ? `Buscando "${radarConfig.keyword}" enquanto você caminha ou dirige no raio de ${radiusMeters / 1000} km.`
                  : 'Defina o tipo de comida ou local abaixo e ligue o radar.'}
              </p>
            </div>
            <button
              onClick={handleToggleRadar}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer ${
                radarConfig.isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {radarConfig.isActive ? 'Desligar' : 'Ligar Radar'}
            </button>
          </div>

          {/* Search Input for Food/Dish/Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              O que você quer que o radar encontre?
            </label>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ex: Comida Mexicana, Maniçoba, Hambúrguer, Pizza..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all pr-10"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-2">
              Sugestões rápidas de busca:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setKeyword(item.label.split(' / ')[0])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                    keyword.toLowerCase().includes(item.label.toLowerCase().split(' / ')[0])
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Radius Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Raio de Alcance do Radar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '500 m', value: 500 },
                { label: '1 km (Padrão)', value: 1000 },
                { label: '1.5 km', value: 1500 },
                { label: '2 km', value: 2000 },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRadiusMeters(r.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    radiusMeters === r.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound and Vibration Toggles */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Aviso sonoro ao detectar</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Vibração no celular</span>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Detected Places list in Radar Range */}
          {detectedPlaces.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Detectados no Raio ({detectedPlaces.length})
                </span>
                <span className="text-[11px] text-slate-500">Ordenados por proximidade</span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {detectedPlaces.map(({ place, distanceMeters }) => {
                  const distText = distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
                  return (
                    <div
                      key={place.id}
                      className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {place.photoUrl ? (
                          <img
                            src={place.photoUrl}
                            alt={place.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{place.name}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-semibold text-emerald-600">{distText}</span>
                            <span>•</span>
                            <span className="truncate">{place.address}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            onSelectPlace(place);
                            onClose();
                          }}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onNavigate(place);
                            onClose();
                          }}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          title="Navegar"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleApplyConfig(true)}
            className="w-2/3 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Salvar e Ligar Radar (1 km)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
