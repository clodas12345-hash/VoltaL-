import { StreetView } from "./StreetView";
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Star, MapPin, Phone, Globe, Bookmark, Check, Sparkles, Navigation, 
  Clock, DollarSign, Users, MessageCircle, ChevronDown, ChevronUp, 
  AlertCircle, Camera, Trash2, ImagePlus, Plus, FileText, File, 
  Download, Eye, Paperclip, Copy, ExternalLink, FileSpreadsheet, FileArchive, FileCode, CheckCheck 
} from 'lucide-react';
import { PlaceCategory, SavedPlace } from '../types';
import { getOpeningStatus, getWeekdaySchedules, getDefaultOpeningHoursForCategory } from '../utils/openingHours';
import { 
  FileAttachment, 
  isValidAttachment, 
  parseAttachment, 
  processUploadedFile, 
  downloadAttachment,
  getAttachmentCategory 
} from '../utils/fileAttachment';

interface PlaceDetailModalProps {
  place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
    userRatingsTotal?: number;
    phoneNumber?: string;
    website?: string;
    photoUrl?: string;
    placeId?: string;
    openingHours?: string[];
    priceLevel?: string;
    peakHours?: string;
    googleMapsUri?: string;
    description?: string;
  };
  onClose: () => void;
  onSave: (savedData: { name: string; category: PlaceCategory; notes: string; customPhotos?: string[]; rating?: number }) => void;
  existingSaved?: SavedPlace;
  userLocation?: { lat: number; lng: number } | null;
  categories: PlaceCategory[];
  onPinFromStreetView?: (latLng: { lat: number; lng: number }) => void;
  onAddCategory?: (newCategory: string) => void;
  onNavigate?: () => void;
  onOpenWebsite?: (url: string) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export function PlaceDetailModal({
  place,
  onClose,
  onSave,
  existingSaved,
  userLocation,
  categories,
  onAddCategory,
  onPinFromStreetView,
  onNavigate,
  onOpenWebsite,
}: PlaceDetailModalProps) {
  const [name, setName] = useState(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).name;
    } catch (e) {}
    return existingSaved?.name || place.name;
  });
  const [category, setCategory] = useState<PlaceCategory>(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).category;
    } catch (e) {}
    return existingSaved?.category || 'Restaurante';
  });
  const [notes, setNotes] = useState(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).notes;
    } catch (e) {}
    return existingSaved?.notes || '';
  });
  const [personalRating, setPersonalRating] = useState<number>(() => {
    return existingSaved?.rating || 0;
  });
  const [customPhotos, setCustomPhotos] = useState<string[]>(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) {
        const photos = JSON.parse(draft).customPhotos;
        if (Array.isArray(photos)) {
          return photos.filter(isValidAttachment);
        }
      }
    } catch (e) {}
    return (existingSaved?.customPhotos || []).filter(isValidAttachment);
  });

  useEffect(() => {
    try {
      const validOnly = customPhotos.filter(isValidAttachment);
      const draft = { name, category, notes, customPhotos: validOnly };
      sessionStorage.setItem(`draft_${place.placeId || place.lat}`, JSON.stringify(draft));
    } catch (e) {
      try {
        const draftNoPhotos = { name, category, notes, customPhotos: [] };
        sessionStorage.setItem(`draft_${place.placeId || place.lat}`, JSON.stringify(draftNoPhotos));
      } catch (e2) {}
    }
  }, [name, category, notes, customPhotos, place.placeId, place.lat]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [showHours, setShowHours] = useState(false);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [viewingTextAttachment, setViewingTextAttachment] = useState<FileAttachment | null>(null);
  const [viewingDocAttachment, setViewingDocAttachment] = useState<FileAttachment | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showMainPhotoOptions, setShowMainPhotoOptions] = useState(false);
  const [viewingMainPhotoFullscreen, setViewingMainPhotoFullscreen] = useState(false);
  const [viewingStreetView, setViewingStreetView] = useState(false);
  
  const effectiveOpeningHours = (place.openingHours && place.openingHours.length > 0)
    ? place.openingHours
    : getDefaultOpeningHoursForCategory(category || (place as any).category, name || place.name);

  const openingStatus = getOpeningStatus(effectiveOpeningHours);
  const weekdaySchedules = getWeekdaySchedules(effectiveOpeningHours);
  const todayDescription = openingStatus.todaySchedule;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files) as File[];
    setIsProcessingPhoto(true);
    setProcessingCount(fileList.length);
    
    try {
      // Process all selected files (photos, PDF, TXT, DOC, etc.) in parallel
      const results = await Promise.all(
        fileList.map((file) => processUploadedFile(file))
      );

      const validFiles = results.filter((item): item is string => !!item && isValidAttachment(item));
      
      if (validFiles.length > 0) {
        setCustomPhotos((prev) => [...prev.filter(isValidAttachment), ...validFiles]);
      }
    } catch (err) {
      console.error('Error uploading files in batch:', err);
    } finally {
      setIsProcessingPhoto(false);
      setProcessingCount(0);
      try {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (photoInputRef.current) photoInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      } catch (e) {}
    }
  };

  const removeAttachment = (index: number) => {
    setCustomPhotos(prev => prev.filter((_, i) => i !== index));
    if (viewingPhotoIndex === index) {
      setViewingPhotoIndex(null);
    }
  };

  const handleCopyText = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const getSmartPeakHours = (p: any) => {
    const pName = (p.name || '').toLowerCase();
    const d = new Date();
    const hour = d.getHours();
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday

    let isLikelyClosed = false;
    const is24h = todayDescription.toLowerCase().includes('24 horas') || todayDescription.toLowerCase().includes('24h') || pName.includes('24h');

    if (todayDescription.toLowerCase().includes('fechado')) {
      isLikelyClosed = true;
    } else if (!is24h && todayDescription) {
      // Parse todayDescription format, e.g., "sábado: 10:00 – 18:00"
      const match = todayDescription.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/g);
      if (match) {
        let isOpenNow = false;
        for (const timeRange of match) {
          const parts = timeRange.split(/[–-]/).map(p => p.trim());
          if (parts.length === 2) {
            const openHour = parseInt(parts[0].split(':')[0], 10);
            let closeHour = parseInt(parts[1].split(':')[0], 10);
            
            if (closeHour <= openHour && closeHour < 12) {
              closeHour += 24; // Handles past midnight closing
            }
            
            let currentHourAdjusted = hour;
            if (hour < 6 && closeHour > 24) {
              currentHourAdjusted += 24;
            }
            
            if (currentHourAdjusted >= openHour && currentHourAdjusted < closeHour) {
              isOpenNow = true;
              break;
            }
          }
        }
        if (!isOpenNow) {
          isLikelyClosed = true;
        }
      }
    } else if (!is24h) {
      if (hour >= 23 || hour < 6) {
        if (!pName.includes('bar') && !pName.includes('club') && !pName.includes('pub') && !pName.includes('lanchonete') && !pName.includes('farmácia')) {
          isLikelyClosed = true;
        }
      } else if (hour >= 6 && hour < 10) {
        if (pName.includes('restaurante') || pName.includes('pizzaria') || pName.includes('sushi') || pName.includes('burger')) {
          isLikelyClosed = true;
        }
      }
    }

    if (isLikelyClosed) return 'Fechado (Sem movimento)';

    if (pName.includes('padaria') || pName.includes('pão') || pName.includes('cafe') || pName.includes('café') || pName.includes('panificadora')) {
      if (hour >= 6 && hour <= 9) return 'Agora: Pico do café da manhã';
      if (hour >= 15 && hour <= 18) return 'Agora: Pico do café da tarde';
      return 'Pico normal: 07h–09h e 16h–18h';
    }
    
    if (pName.includes('restaurante') || pName.includes('churrascaria') || pName.includes('sushi') || pName.includes('pizzaria') || pName.includes('burger') || pName.includes('lanchonete')) {
      if (hour >= 11 && hour <= 14) return 'Agora: Pico do almoço';
      if (hour >= 19 && hour <= 22) return 'Agora: Pico do jantar';
      return 'Pico normal: 12h–14h e 19h–21h';
    }

    if (pName.includes('supermercado') || pName.includes('mercado') || pName.includes('atacado')) {
      if (hour >= 17 && hour <= 20) return 'Agora: Pico pós-expediente';
      if (day === 0 || day === 6) return 'Movimento alto (Fim de semana)';
      return 'Pico normal: 18h–20h';
    }

    if (pName.includes('farmácia') || pName.includes('drogaria')) {
      return 'Pico normal: 17h–19h';
    }

    if (pName.includes('bar') || pName.includes('pub') || pName.includes('cervejaria')) {
      if (hour >= 19 || hour < 2) return 'Agora: Pico noturno';
      return 'Pico normal: 20h–01h';
    }

    if (pName.includes('shopping') || pName.includes('mall')) {
      if (hour >= 15 && hour <= 19) return 'Agora: Pico de movimento';
      if (day === 0 || day === 6) return 'Pico normal de fim de semana';
      return 'Pico normal: 16h–19h';
    }

    if (hour >= 12 && hour <= 14) return 'Agora: Possível pico de almoço';
    if (hour >= 18 && hour <= 20) return 'Agora: Possível pico de fim de dia';
    return 'Movimento moderado no momento';
  };

  const smartPeakHours = getSmartPeakHours(place);

  // Calculate distance if user location is available
  let distanceText = '';
  if (userLocation) {
    const R = 6371; // Earth radius in km
    const dLat = (place.lat - userLocation.lat) * (Math.PI / 180);
    const dLng = (place.lng - userLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) *
        Math.cos(place.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // in km
    distanceText = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  }

  // Format WhatsApp link if phone exists
  const cleanPhone = place.phoneNumber ? place.phoneNumber.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, notes, customPhotos, rating: personalRating || place.rating });
    setSavedSuccess(true);
    // Remove auto-close so the user can see their photo was saved, they can close manually
  };

  const googleReviewUrl = place.placeId 
    ? `https://search.google.com/local/writereview?placeid=${place.placeId}`
    : (place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name || place.name} ${place.address || ''}`)}`);

  return (
    <>
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Photo Header if available */}
        {place.photoUrl ? (
          <div className="relative h-64 w-full bg-slate-100 group overflow-hidden shrink-0">
            <div 
              onClick={() => setShowMainPhotoOptions(true)}
              className="absolute inset-0 block cursor-pointer"
            >
              <img 
                src={place.photoUrl} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-white/20 shadow-xl">
                  <MapPin className="w-4 h-4" />
                  <span>Ver Opções</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none z-10 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold drop-shadow-sm">{name}</h2>
                {distanceText && (
                  <div className="flex items-center gap-1 text-xs text-blue-200 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Aprox. {distanceText} de você</span>
                  </div>
                )}
              </div>
              {onNavigate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-colors flex items-center gap-2 text-sm pointer-events-auto"
                >
                  <Navigation className="w-4 h-4" />
                  Ir agora
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detalhes do Local</h2>
              {distanceText && (
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 font-medium">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Aprox. {distanceText} de você</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={onNavigate}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2.5 rounded-full transition-colors flex items-center shadow-sm"
                  title="Ir agora"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Editable Name & Address */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do local..."
                className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400"
                required
              />
            </div>

            <div className="flex items-start justify-between gap-2 text-sm text-slate-600 px-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{place.address || 'Endereço não informado'}</span>
              </div>
              <div className="shrink-0 bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-lg border border-blue-200">
                {(() => {
                  const match = place.address.match(/n[º°]\s*(\d+)/i) || place.address.match(/,\s*(\d+)/);
                  if (match) return `Nº ${match[1]}`;
                  return `Nº ${Math.floor(Math.abs((place.lat + place.lng) * 100000) % 950) + 50}`;
                })()}
              </div>
            </div>

            {place.description && (
              <div className="text-sm text-slate-700 mt-3 px-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {place.description}
              </div>
            )}

            <button 
              type="button"
              onClick={() => setViewingStreetView(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-blue-100"
            >
              <Navigation className="w-4 h-4" />
              <span>Explorar no Street View</span>
            </button>
          </div>

          {/* Google Details info (Rating, Price, Peak hours, Phone, WhatsApp) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-sm">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avaliação Google</span>
              <div className="flex items-center gap-2.5">
                {typeof place.rating === 'number' && (
                  <div className="flex items-center text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                    <span>{place.rating.toFixed(1)}</span>
                    {typeof place.userRatingsTotal === 'number' && (
                      <span className="text-xs text-slate-400 ml-1">({place.userRatingsTotal})</span>
                    )}
                  </div>
                )}
                <a 
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold border border-amber-300 transition-colors shadow-xs active:scale-95"
                  title="Escrever avaliação no Google"
                >
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Avaliar</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Média de Preço</span>
              <div className="flex items-center text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                <span>{place.priceLevel || '$$ • Moderado'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Horário de Pico</span>
              <div className={`flex items-center font-medium text-xs px-2 py-0.5 rounded-full border ${smartPeakHours.includes('Fechado') ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200'}`}>
                <Users className="w-3.5 h-3.5 mr-1" />
                <span>{smartPeakHours}</span>
              </div>
            </div>

            {/* Horário de Funcionamento - Card em Destaque */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${openingStatus.isOpen ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Horário de Funcionamento</span>
                  </div>
                  
                  {/* Status Aberto / Fechado / Fecha em breve */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    openingStatus.badgeColor === 'emerald'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : openingStatus.badgeColor === 'amber'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      openingStatus.badgeColor === 'emerald'
                        ? 'bg-emerald-500 animate-pulse'
                        : openingStatus.badgeColor === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`} />
                    {openingStatus.statusText}
                  </span>
                </div>

                {/* Horário de Hoje */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-medium text-xs">Hoje:</span>
                    <span className={openingStatus.isOpen ? 'text-emerald-700 font-bold' : 'text-slate-800 font-semibold'}>
                      {openingStatus.todaySchedule}
                    </span>
                    {openingStatus.detailText && (
                      <span className="text-xs text-slate-500 font-normal">
                        • {openingStatus.detailText}
                      </span>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowHours(!showHours)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-semibold text-xs gap-1 shrink-0 ml-2 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <span>{showHours ? 'Ocultar semana' : 'Ver semana inteira'}</span>
                    {showHours ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Grade Semanal Completa */}
                {showHours && (
                  <div className="mt-2 text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-200 flex justify-between items-center">
                      <span>Dias da Semana</span>
                      <span>Horário</span>
                    </div>
                    {weekdaySchedules.map((schedule, idx) => (
                      <div 
                        key={idx} 
                        className={`flex justify-between items-center py-1 px-2 rounded-md transition-colors ${
                          schedule.isToday 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200 shadow-xs' 
                            : 'border-b border-slate-200/50 last:border-0'
                        }`}
                      >
                        <span className={`capitalize flex items-center gap-1.5 ${schedule.isToday ? 'text-emerald-900 font-bold' : 'text-slate-600'}`}>
                          {schedule.dayName}
                          {schedule.isToday && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Hoje
                            </span>
                          )}
                        </span>
                        <span className={`font-semibold ${
                          schedule.isClosed 
                            ? 'text-rose-600' 
                            : schedule.isToday 
                            ? 'text-emerald-700 font-bold' 
                            : 'text-slate-700'
                        }`}>
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {place.phoneNumber && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 uppercase">Contato</span>
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${place.phoneNumber}`} 
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium border border-blue-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Ligar</span>
                  </a>
                  {whatsappUrl && (
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium border border-emerald-200 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {place.website && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 truncate">
                <span className="text-xs font-semibold text-slate-500 uppercase shrink-0">Website</span>
                {onOpenWebsite ? (
                  <button onClick={() => onOpenWebsite(place.website!)} className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">
                    {place.website}
                  </button>
                ) : (
                  <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">
                    {place.website}
                  </a>
                )}
              </div>
            )}

            {place.googleMapsUri && (
              <div className="pt-2 mt-1 border-t border-slate-200/60 flex justify-center">
                <a 
                  href={place.googleMapsUri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Encontrou um erro? Sugerir alteração no Google</span>
                </a>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Form to Save / Edit Category & Notes */}
          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Categoria do Estabelecimento
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                
                {onAddCategory && (
                  isAddingCategory ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nova categoria"
                        className="py-1.5 px-3 rounded-xl text-xs font-medium border border-blue-300 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm w-32"
                        onBlur={() => {
                          if (!newCategoryName.trim()) setIsAddingCategory(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryName.trim()) {
                              onAddCategory(newCategoryName.trim());
                              setCategory(newCategoryName.trim());
                              setNewCategoryName('');
                              setIsAddingCategory(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            onAddCategory(newCategoryName.trim());
                            setCategory(newCategoryName.trim());
                          }
                          setNewCategoryName('');
                          setIsAddingCategory(false);
                        }}
                        className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="py-2 px-3 text-xs font-medium rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Sua Avaliação Pessoal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Sua Avaliação do Local</span>
                {personalRating > 0 && (
                  <span className="text-amber-600 font-bold text-xs">{personalRating} de 5 estrelas</span>
                )}
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPersonalRating(personalRating === star ? 0 : star)}
                    className="p-1 hover:scale-125 transition-transform"
                    title={`${star} estrelas`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= personalRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2">
                  {personalRating === 0 ? 'Toque para avaliar' : `${personalRating}/5`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Anotações Pessoais
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pedir o prato executivo, ótimo atendimento..."
                rows={2}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fotos e Arquivos</span>
                  {customPhotos.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {customPhotos.length} {customPhotos.length === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:bg-emerald-100 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 transition-colors shadow-sm active:scale-95"
                    title="Tirar foto com a câmera"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Câmera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-1 text-xs text-blue-700 font-medium hover:bg-blue-100 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-sm active:scale-95"
                    title="Fotos e imagens da galeria"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Fotos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-1 text-xs text-indigo-700 font-medium hover:bg-indigo-100 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-200 transition-colors shadow-sm active:scale-95"
                    title="PDF, TXT, Documentos, Planilhas e outros"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF / TXT / Docs</span>
                  </button>
                </div>
              </div>
              
              {/* Hidden file inputs for versatile uploads */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="*/*" 
                multiple
                className="hidden" 
              />
              <input 
                type="file" 
                ref={photoInputRef} 
                onChange={handleFileUpload} 
                accept="image/*,.heic,.heif" 
                multiple
                className="hidden" 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />

              {isProcessingPhoto && (
                <div className="w-full py-3 px-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-blue-700 text-xs font-medium animate-pulse mb-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {processingCount > 1
                      ? `Processando ${processingCount} arquivos ao mesmo tempo...`
                      : 'Processando e salvando anexo...'}
                  </span>
                </div>
              )}
              
              {customPhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {customPhotos.map((rawItem, idx) => {
                    const att = parseAttachment(rawItem);
                    
                    if (att.category === 'image') {
                      return (
                        <div 
                          key={idx} 
                          className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-sm"
                        >
                          <img 
                            src={att.dataUrl} 
                            alt={att.name || `Foto ${idx + 1}`} 
                            onClick={() => setViewingPhotoIndex(idx)}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                          />
                          <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                            FOTO
                          </div>
                          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadAttachment(att);
                              }}
                              className="p-1 bg-black/60 hover:bg-blue-600 text-white rounded-full transition-colors shadow"
                              title="Baixar imagem"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAttachment(idx);
                              }}
                              className="p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors shadow"
                              title="Remover anexo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // For non-image files (PDF, TXT, DOC, XLS, ZIP, etc.)
                    const isPdf = att.category === 'pdf';
                    const isText = att.category === 'text';
                    const isSpreadsheet = att.category === 'spreadsheet';
                    const isDoc = att.category === 'document';
                    const isArchive = att.category === 'archive';

                    const cardBg = isPdf 
                      ? 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400' 
                      : isText 
                      ? 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400'
                      : isSpreadsheet
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400'
                      : isDoc
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:border-indigo-400'
                      : isArchive
                      ? 'bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-400'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400';

                    const iconColor = isPdf
                      ? 'bg-rose-100 text-rose-600'
                      : isText
                      ? 'bg-amber-100 text-amber-600'
                      : isSpreadsheet
                      ? 'bg-emerald-100 text-emerald-600'
                      : isDoc
                      ? 'bg-indigo-100 text-indigo-600'
                      : isArchive
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-slate-200 text-slate-700';

                    const badgeLabel = isPdf ? 'PDF' : isText ? 'TXT' : isSpreadsheet ? 'XLS/CSV' : isDoc ? 'DOC' : isArchive ? 'ZIP' : 'ARQUIVO';

                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          if (isText) {
                            setViewingTextAttachment(att);
                          } else {
                            setViewingDocAttachment(att);
                          }
                        }}
                        className={`relative aspect-square rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all shadow-sm group ${cardBg}`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${iconColor}`}>
                            {isPdf ? <FileText className="w-4 h-4" /> : isText ? <FileCode className="w-4 h-4" /> : isSpreadsheet ? <FileSpreadsheet className="w-4 h-4" /> : isArchive ? <FileArchive className="w-4 h-4" /> : <File className="w-4 h-4" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadAttachment(att);
                              }}
                              className="p-1 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAttachment(idx);
                              }}
                              className="p-1 bg-black/10 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                              title="Remover anexo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="w-full">
                          <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">
                            {badgeLabel}
                          </span>
                          <p className="text-[11px] font-semibold truncate leading-tight mt-0.5" title={att.name}>
                            {att.name || 'Arquivo anexado'}
                          </p>
                          <span className="text-[9px] opacity-60 block mt-0.5 font-mono">
                            {att.sizeFormatted || 'Arquivo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                    title="Adicionar mais arquivos ou fotos"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">+ Anexar</span>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 px-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-2 cursor-pointer hover:bg-slate-50 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-700 block">Adicionar fotos ou arquivos</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Suporta fotos (JPG, PNG, HEIC), PDF, TXT, DOC, planilhas e mais</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-medium bg-slate-100 group-hover:bg-blue-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">📷 Fotos</span>
                    <span className="text-[10px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">📄 PDF</span>
                    <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">📝 TXT</span>
                    <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">📁 Qualquer arquivo</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savedSuccess}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5 text-amber-300" />
                  <span>{existingSaved ? 'Atualizar Favorito' : 'Salvar nos Favoritos'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>

      {/* Photo Fullscreen Viewer Modal */}
      {viewingPhotoIndex !== null && customPhotos[viewingPhotoIndex] && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex flex-col animate-fadeIn">
          {(() => {
            const att = parseAttachment(customPhotos[viewingPhotoIndex]);
            return (
              <>
                <div className="flex justify-between items-center p-4 bg-black/40 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-white text-sm font-medium truncate max-w-[60%]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingPhotoIndex(null); }}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors mr-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <span className="truncate">{att.name || `Foto ${viewingPhotoIndex + 1}`}</span>
                    {att.sizeFormatted && (
                      <span className="text-xs text-slate-400 font-mono">({att.sizeFormatted})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAttachment(att);
                      }}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-3"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAttachment(viewingPhotoIndex); }}
                      className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-colors flex items-center gap-1.5 text-xs font-medium px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                  <img 
                    src={att.dataUrl} 
                    alt={att.name || `Foto ${viewingPhotoIndex + 1}`} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Text File Reader Modal */}
      {viewingTextAttachment && (
        <div className="fixed inset-0 z-[165] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setViewingTextAttachment(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{viewingTextAttachment.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{viewingTextAttachment.sizeFormatted || 'Arquivo de texto'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyText(viewingTextAttachment.rawText || '')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  title="Copiar todo o texto"
                >
                  {copySuccess ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAttachment(viewingTextAttachment)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Baixar arquivo"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTextAttachment(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed select-text whitespace-pre-wrap rounded-b-3xl">
              {viewingTextAttachment.rawText || 'Nenhum conteúdo de texto encontrado.'}
            </div>
          </div>
        </div>
      )}

      {/* PDF / Document Viewer Modal */}
      {viewingDocAttachment && (
        <div className="fixed inset-0 z-[165] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setViewingDocAttachment(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  viewingDocAttachment.category === 'pdf' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{viewingDocAttachment.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{viewingDocAttachment.sizeFormatted || 'Documento'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadAttachment(viewingDocAttachment)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDocAttachment(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50 overflow-y-auto min-h-[300px]">
              {viewingDocAttachment.category === 'pdf' && viewingDocAttachment.dataUrl ? (
                <div className="w-full h-full flex flex-col items-center gap-4">
                  <iframe 
                    src={viewingDocAttachment.dataUrl} 
                    title={viewingDocAttachment.name}
                    className="w-full h-[55vh] rounded-xl border border-slate-200 shadow-inner bg-white"
                  />
                  <div className="flex gap-3">
                    <a 
                      href={viewingDocAttachment.dataUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir PDF em tela cheia / nova aba
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <File className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{viewingDocAttachment.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Este tipo de arquivo pode ser baixado diretamente para visualização em seu computador ou celular.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(viewingDocAttachment)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar ({viewingDocAttachment.sizeFormatted || 'Arquivo'})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Photo Options Modal */}
      {showMainPhotoOptions && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowMainPhotoOptions(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">O que deseja fazer?</h3>
              <button
                onClick={() => setShowMainPhotoOptions(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button 
                onClick={() => {
                  setShowMainPhotoOptions(false);
                  setViewingStreetView(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Ir para o Street View</div>
                  <div className="text-xs text-slate-500">Abrir a localização no mapa 3D</div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowMainPhotoOptions(false);
                  setViewingMainPhotoFullscreen(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Ver foto em tela cheia</div>
                  <div className="text-xs text-slate-500">Expandir a imagem da fachada</div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowMainPhotoOptions(false)}
                className="w-full py-3 mt-2 font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Photo Fullscreen Viewer */}
      {viewingMainPhotoFullscreen && place.photoUrl && (
        <div className="fixed inset-0 z-[170] bg-black/95 flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => setViewingMainPhotoFullscreen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            <img 
              src={place.photoUrl} 
              alt={place.name} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
      {/* Street View Embedded Fullscreen */}
      {viewingStreetView && API_KEY && (
        <StreetView
          lat={place.lat}
          lng={place.lng}
          onClose={() => setViewingStreetView(false)}
          onPinLocation={(latLng) => {
            setViewingStreetView(false);
            if (onPinFromStreetView) {
              onPinFromStreetView(latLng);
            }
          }}
        />
      )}
    </>
  );
}

