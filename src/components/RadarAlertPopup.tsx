import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X, Navigation, Star, MapPin, Eye, Radio, UtensilsCrossed, MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { RadarAlert, MapPin as MapPinType } from '../types';

interface RadarAlertPopupProps {
  alert: RadarAlert | null;
  detectedPlaces?: { place: MapPinType; distanceMeters: number }[];
  onClose: () => void;
  onViewDetails: (place: MapPinType) => void;
  onNavigate: (place: MapPinType) => void;
}

export function RadarAlertPopup({
  alert,
  detectedPlaces = [],
  onClose,
  onViewDetails,
  onNavigate,
}: RadarAlertPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Normalize place list
  const placesList: { place: MapPinType; distanceMeters: number }[] = 
    detectedPlaces && detectedPlaces.length > 0 
      ? detectedPlaces 
      : alert 
        ? [{ place: alert.place, distanceMeters: alert.distanceMeters }] 
        : [];

  const totalCount = placesList.length;

  // Reset index when alert or places list updates
  useEffect(() => {
    setCurrentIndex(0);
  }, [alert?.id, detectedPlaces.length]);

  if (!alert || totalCount === 0) return null;

  const safeIndex = Math.min(Math.max(0, currentIndex), totalCount - 1);
  const currentItem = placesList[safeIndex] || { place: alert.place, distanceMeters: alert.distanceMeters };
  const { place, distanceMeters } = currentItem;
  const matchedKeyword = alert.matchedKeyword;

  const distText = distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
  const walkMinutes = Math.max(1, Math.round(distanceMeters / 80));

  const handleNext = () => {
    if (safeIndex < totalCount - 1) {
      setSwipeDirection('left');
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setSwipeDirection('right');
      setCurrentIndex(prev => prev - 1);
    } else {
      onClose();
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 45;
    if (info.offset.x < -threshold || info.velocity.x < -200) {
      handleNext();
    } else if (info.offset.x > threshold || info.velocity.x > 200) {
      handlePrev();
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const diff = e.touches[0].clientX - touchStartXRef.current;
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -45) {
      handleNext();
    } else if (dragOffset > 45) {
      handlePrev();
    }
    setDragOffset(0);
    touchStartXRef.current = null;
  };

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[95] pointer-events-auto">
      {/* Radar Category Alert Header Pill */}
      <div className="flex items-center justify-between bg-emerald-950/95 backdrop-blur-md text-emerald-200 px-3.5 py-1.5 rounded-t-2xl border-t border-x border-emerald-500/60 shadow-lg text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
            <Radio className="w-3.5 h-3.5 text-emerald-400 relative z-10" />
          </div>
          <span className="font-bold text-white truncate">
            Radar: "{matchedKeyword}"
          </span>
          <span className="text-[10px] bg-emerald-800/80 text-emerald-300 px-2 py-0.5 rounded-full shrink-0 font-medium">
            Raio 1 km
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {totalCount > 1 && (
            <span className="text-[11px] font-bold text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
              {safeIndex + 1}/{totalCount}
            </span>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Restaurant Card */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={place.id || `${place.name}-${safeIndex}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            initial={{ opacity: 0, x: swipeDirection === 'left' ? 40 : -40, scale: 0.96 }}
            animate={{ 
              opacity: 1, 
              x: dragOffset, 
              scale: 1 
            }}
            exit={{ opacity: 0, x: swipeDirection === 'left' ? -40 : 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="bg-slate-900/98 backdrop-blur-lg text-white rounded-b-2xl rounded-tr-none p-4 shadow-2xl border-b border-x border-emerald-500/50 shadow-emerald-950/40 flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Top Swipe Instruction Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <MoveHorizontal className="w-3 h-3 animate-pulse" />
                <span>Deslize o cartão para ver o próximo</span>
              </div>
              {totalCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={safeIndex === 0}
                    className={`p-0.5 rounded ${safeIndex === 0 ? 'text-slate-700' : 'text-slate-300 hover:text-white cursor-pointer'}`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={safeIndex === totalCount - 1}
                    className={`p-0.5 rounded ${safeIndex === totalCount - 1 ? 'text-slate-700' : 'text-slate-300 hover:text-white cursor-pointer'}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Restaurant Card Body */}
            <div className="flex gap-3 items-center">
              {/* Photo Banner */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/90 shrink-0 relative shadow-md">
                {place.photoUrl ? (
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-emerald-400 bg-gradient-to-br from-emerald-950 to-slate-800 p-2 text-center">
                    <UtensilsCrossed className="w-7 h-7 mb-1" />
                    <span className="text-[9px] font-semibold text-slate-300">Restaurante</span>
                  </div>
                )}
                
                {/* Walking Time Badge */}
                <div className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                  ~{walkMinutes} min
                </div>
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    A {distText} de você
                  </span>
                </div>

                <h3 className="text-base font-bold text-white truncate leading-tight mt-0.5">
                  {place.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  {place.rating && (
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-medium text-[11px] truncate">
                    {place.category || 'Restaurante'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{place.address}</span>
                </p>
              </div>
            </div>

            {/* Pagination Dots */}
            {totalCount > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                {placesList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwipeDirection(idx > safeIndex ? 'left' : 'right');
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex 
                        ? 'w-6 bg-emerald-400' 
                        : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Ver restaurante ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons for this specific restaurant card */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onViewDetails(place);
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Detalhes</span>
              </button>

              <button
                onClick={() => {
                  onNavigate(place);
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>Como Chegar</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
