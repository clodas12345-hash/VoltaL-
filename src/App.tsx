import React, { useState, useEffect, useRef } from 'react';
import { MapComponent } from './components/MapComponent';
import { Header } from './components/Header';
import { SavedPlacesSidebar } from './components/SavedPlacesSidebar';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { SearchProximityListModal } from './components/SearchProximityListModal';
import { RadarModal } from './components/RadarModal';
import { RadarAlertPopup } from './components/RadarAlertPopup';
import { SavedPlace, MapPin as MapPinType, PlaceCategory, RadarConfig, RadarAlert, getZoomForRadius } from './types';
import { Compass, Navigation, Bookmark, Plus, MapPin, X, Radio } from 'lucide-react';
import { InAppBrowser } from './components/InAppBrowser';
import { playRadarDetectionChime } from './utils/audio';
import { getDistanceMeters, normalizeText, generateDemoRadarPlaces } from './utils/radarScanner';
import { isValidAttachment } from './utils/fileAttachment';

const REAL_SP_ESTABLISHMENTS = [
  // Mexican food establishments
  { 
    name: 'El Tranvía Taquería & Bar Mexicano', 
    address: 'R. Bela Cintra, 1850 - Consolação, São Paulo - SP', 
    lat: -23.5585, 
    lng: -46.6625, 
    category: 'Restaurante', 
    rating: 4.8, 
    price: 'R$ 45 - R$ 90 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    description: 'Autêntica culinária mexicana com tacos artesanais, quesadillas, guacamole fresco, burritos e drinks.'
  },
  { 
    name: 'Si Señor Cocina Mexicana & Grill', 
    address: 'Al. Santos, 1200 - Cerqueira César, São Paulo - SP', 
    lat: -23.5650, 
    lng: -46.6530, 
    category: 'Restaurante', 
    rating: 4.7, 
    price: 'R$ 60 - R$ 110 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop&q=80',
    description: 'Pratos mexicanos e tex-mex, nachos supremos, tacos crocantes, fajitas e margaritas.'
  },
  { 
    name: 'Guacamole Cantina & Tacos', 
    address: 'Rua Augusta, 1400 - Consolação, São Paulo - SP', 
    lat: -23.5535, 
    lng: -46.6575, 
    category: 'Restaurante', 
    rating: 4.8, 
    price: 'R$ 50 - R$ 95 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    description: 'Restaurante temático com tacos, burritos, quesadillas, tequilas e ambiente mexicano.'
  },

  // Maniçoba & Pará Food establishments
  { 
    name: 'Tacacá do Norte - Culinária Paraense & Maniçoba', 
    address: 'Rua Vergueiro, 1045 - Paraíso, São Paulo - SP', 
    lat: -23.5740, 
    lng: -46.6430, 
    category: 'Restaurante', 
    rating: 4.9, 
    price: 'R$ 40 - R$ 85 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    description: 'Famoso pela Maniçoba paraense cozida por 7 dias, Tacacá no tucupi com jambu e Pato no Tucupi.'
  },
  { 
    name: 'Restaurante Amazônia - Sabores do Pará & Maniçoba', 
    address: 'Rua Haddock Lobo, 950 - Cerqueira César, São Paulo - SP', 
    lat: -23.5570, 
    lng: -46.6620, 
    category: 'Restaurante', 
    rating: 4.8, 
    price: 'R$ 55 - R$ 110 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    description: 'Pratos tradicionais de Belém: Maniçoba fresca com paio e costelinha, peixes amazônicos e açaí.'
  },
  { 
    name: 'Casa do Norte & Sabores do Pará', 
    address: 'Rua Itinguçu, 850 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5365, 
    lng: -46.5115, 
    category: 'Restaurante', 
    rating: 4.8, 
    price: 'R$ 35 - R$ 75 por pessoa',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    description: 'Comida paraense com Maniçoba caseira, tacacá no tucupi com jambu e farinha d água.'
  },

  { name: 'Padaria Bella Paulista', address: 'Rua Haddock Lobo, 354 - Cerqueira César, São Paulo - SP', lat: -23.5558, lng: -46.6558, category: 'Padaria', rating: 4.6, price: 'R$ 30 - R$ 60 por pessoa' },
  { name: 'MASP (Museu de Arte de São Paulo)', address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', lat: -23.5614, lng: -46.6559, category: 'Outros', rating: 4.8, price: 'R$ 30 - R$ 50 por pessoa' },
  { name: 'Club Yacht (Boate & Balada)', address: 'R. Treze de Maio, 703 - Bela Vista, São Paulo - SP', lat: -23.5590, lng: -46.6490, category: 'Boate', rating: 4.6, price: 'R$ 60 - R$ 120 por pessoa' },
  { name: 'D-Edge Club (Boate Eletrônica)', address: 'Av. Olavo Bilac, 980 - Barra Funda, São Paulo - SP', lat: -23.5285, lng: -46.6620, category: 'Boate', rating: 4.7, price: 'R$ 80 - R$ 150 por pessoa' },
  { name: 'Tokyo 東 (Boate, Bar & Karaokê)', address: 'R. Maj. Sertório, 110 - Vila Buarque, São Paulo - SP', lat: -23.5460, lng: -46.6480, category: 'Boate', rating: 4.5, price: 'R$ 50 - R$ 110 por pessoa' },
  { name: 'Shopping Center Paulista', address: 'Rua Treze de Maio, 1947 - Bela Vista, São Paulo - SP', lat: -23.5701, lng: -46.6453, category: 'Shopping', rating: 4.5, price: 'R$ 50 - R$ 120 por pessoa' },
  { name: 'Restaurante Spot', address: 'Min. Rocha Azevedo, 72 - Cerqueira César, São Paulo - SP', lat: -23.5572, lng: -46.6582, category: 'Restaurante', rating: 4.7, price: 'R$ 90 - R$ 180 por pessoa' },
  { name: 'Starbucks Avenida Paulista', address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', lat: -23.5630, lng: -46.6525, category: 'Cafeteria', rating: 4.4, price: 'R$ 15 - R$ 35 por pessoa' },
  { name: 'Supermercado St. Marche', address: 'Rua da Consolação, 2467 - Consolação, São Paulo - SP', lat: -23.5532, lng: -46.6601, category: 'Supermercado', rating: 4.6, price: 'R$ 50 - R$ 110 por pessoa' },
  { name: 'Drogaria São Paulo', address: 'Av. Paulista, 900 - Bela Vista, São Paulo - SP', lat: -23.5635, lng: -46.6510, category: 'Farmácia', rating: 4.3, price: 'R$ 20 - R$ 60 por pessoa' },
  { name: 'Mister Rock Bar in Sampa', address: 'R. Palmeiras dos Índios, 32 - Cidade Patriarca, São Paulo - SP', lat: -23.5350, lng: -46.5120, category: 'Restaurante', rating: 4.8, price: 'R$ 40 - R$ 90 por pessoa' },
  { name: 'Costelaria e Churrascaria Radial', address: 'Av. Calim Eid, 450 - Cidade Patriarca, São Paulo - SP', lat: -23.5320, lng: -46.5150, category: 'Restaurante', rating: 4.7, price: 'R$ 60 - R$ 130 por pessoa' },
  { name: 'Chopperia & Espetinho do Juiz', address: 'Rua Itinguçu, 1200 - Cidade Patriarca, São Paulo - SP', lat: -23.5380, lng: -46.5100, category: 'Restaurante', rating: 4.6, price: 'R$ 30 - R$ 70 por pessoa' },
  { name: 'Autorizada Brother ZL', address: 'Rua Samuel Rubli, 45 - Cidade Patriarca, São Paulo - SP', lat: -23.5360, lng: -46.5080, category: 'Outros', rating: 4.5, price: 'R$ 50 - R$ 150 por serviço' },
  { name: 'Ateliê Paim & Design', address: 'Rua Manuel Leiroz, 88 - Cidade Patriarca, São Paulo - SP', lat: -23.5410, lng: -46.5050, category: 'Outros', rating: 4.9, price: 'R$ 40 - R$ 100 por pessoa' },
  { name: 'Café Espresso Central', address: 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP', lat: -23.5620, lng: -46.6550, category: 'Cafeteria', rating: 4.7, price: 'R$ 15 - R$ 40 por pessoa' },
  { name: 'Restaurante Sabor Paulista', address: 'Rua Augusta, 800 - Consolação, São Paulo - SP', lat: -23.5540, lng: -46.6610, category: 'Restaurante', rating: 4.6, price: 'R$ 45 - R$ 95 por pessoa' },
  { name: 'Farmácia Saúde Total', address: 'Al. Santos, 500 - Cerqueira César, São Paulo - SP', lat: -23.5680, lng: -46.6500, category: 'Farmácia', rating: 4.4, price: 'R$ 20 - R$ 55 por pessoa' },
  { name: 'Supermercado Dia & Noite', address: 'Rua da Consolação, 1500 - Consolação, São Paulo - SP', lat: -23.5510, lng: -46.6590, category: 'Supermercado', rating: 4.3, price: 'R$ 35 - R$ 80 por pessoa' },
  { name: 'Padaria Pão Dourado', address: 'Av. Brigadeiro Luís Antônio, 2000 - Bela Vista, São Paulo - SP', lat: -23.5640, lng: -46.6480, category: 'Padaria', rating: 4.9, price: 'R$ 15 - R$ 35 por pessoa' },
  { name: 'Beco do Batman (Grafites)', address: 'Rua Gonçalo Afonso - Vila Madalena, São Paulo - SP', lat: -23.5562, lng: -46.6882, category: 'Outros', rating: 4.8, price: 'Gratuito' },
  { name: 'Parque Ibirapuera (Portão 7)', address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP', lat: -23.5874, lng: -46.6576, category: 'Outros', rating: 4.9, price: 'Gratuito' },
  { name: 'Mercado Municipal de São Paulo (Mercadão)', address: 'Rua da Cantareira, 306 - Centro Histórico, São Paulo - SP', lat: -23.5447, lng: -46.6281, category: 'Restaurante', rating: 4.7, price: 'R$ 40 - R$ 90 por pessoa' },
  { name: 'Pinacoteca de São Paulo', address: 'Praça da Luz, 2 - Luz, São Paulo - SP', lat: -23.5332, lng: -46.6322, category: 'Outros', rating: 4.8, price: 'R$ 15 - R$ 30 por pessoa' },
  { name: 'Teatro Municipal de São Paulo', address: 'Praça Ramos de Azevedo, s/n - República, São Paulo - SP', lat: -23.5448, lng: -46.6388, category: 'Outros', rating: 4.8, price: 'R$ 20 - R$ 80 por pessoa' },
];

const STORAGE_KEY = 'google_maps_favoritos_places_v1';
const RADAR_CONFIG_KEY = 'voltala_radar_config_v1';

const DEFAULT_RADAR_CONFIG: RadarConfig = {
  isActive: false,
  keyword: 'Comida Mexicana',
  radiusMeters: 1000,
  soundEnabled: true,
  vibrationEnabled: true,
};

const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  {
    id: 'default-1',
    name: 'Padaria Artesanal Bella Roma',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    lat: -23.5616,
    lng: -46.6560,
    category: 'Padaria',
    rating: 4.8,
    userRatingsTotal: 342,
    phoneNumber: '+55 11 3289-0000',
    priceLevel: 'R$ 20 - R$ 45 por pessoa',
    peakHours: 'Pico das 07h30 às 09h30',
    notes: 'Melhor pão de queijo e cappuccino da região.',
    openingHours: [
      'segunda-feira: 06:00 – 22:30',
      'terça-feira: 06:00 – 22:30',
      'quarta-feira: 06:00 – 22:30',
      'quinta-feira: 06:00 – 22:30',
      'sexta-feira: 06:00 – 23:00',
      'sábado: 06:00 – 23:00',
      'domingo: 06:30 – 22:00'
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    name: 'Restaurante Fogo & Brasa',
    address: 'R. Augusta, 1500 - Consolação, São Paulo - SP',
    lat: -23.5558,
    lng: -46.6620,
    category: 'Restaurante',
    rating: 4.6,
    userRatingsTotal: 1205,
    phoneNumber: '+55 11 3256-1111',
    priceLevel: 'R$ 60 - R$ 130 por pessoa',
    peakHours: 'Pico das 12h30 às 14h30 e 20h00 às 22h00',
    notes: 'Ótimo rodízio de carnes no almoço de domingo.',
    openingHours: [
      'segunda-feira: 11:30 – 15:30, 18:30 – 23:00',
      'terça-feira: 11:30 – 15:30, 18:30 – 23:00',
      'quarta-feira: 11:30 – 15:30, 18:30 – 23:00',
      'quinta-feira: 11:30 – 15:30, 18:30 – 23:30',
      'sexta-feira: 11:30 – 15:30, 18:30 – 00:00',
      'sábado: 11:30 – 00:00',
      'domingo: 11:30 – 22:00'
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-3',
    name: 'Café do Metrô',
    address: 'R. da Consolação, 2000 - Consolação, São Paulo - SP',
    lat: -23.5520,
    lng: -46.6580,
    category: 'Cafeteria',
    rating: 4.5,
    userRatingsTotal: 180,
    phoneNumber: '+55 11 3123-4567',
    priceLevel: 'R$ 15 - R$ 35 por pessoa',
    peakHours: 'Pico das 15h00 às 17h00',
    notes: 'Ambiente tranquilo para trabalhar com notebook.',
    openingHours: [
      'segunda-feira: 07:00 – 21:00',
      'terça-feira: 07:00 – 21:00',
      'quarta-feira: 07:00 – 21:00',
      'quinta-feira: 07:00 – 21:00',
      'sexta-feira: 07:00 – 21:30',
      'sábado: 08:00 – 20:00',
      'domingo: 08:30 – 19:00'
    ],
    createdAt: new Date().toISOString(),
  }
];

export default function App() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedPlace[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ({
            ...p,
            customPhotos: (p.customPhotos || []).filter(isValidAttachment),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load saved places', e);
    }
    return DEFAULT_SAVED_PLACES;
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; heading?: number | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapPinType[]>([]);
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
  const [selectedPlaceToView, setSelectedPlaceToView] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem('pinpoint_pending_place_view');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      if (selectedPlaceToView) {
        sessionStorage.setItem('pinpoint_pending_place_view', JSON.stringify(selectedPlaceToView));
      } else {
        sessionStorage.removeItem('pinpoint_pending_place_view');
      }
    } catch (e) {}
  }, [selectedPlaceToView]);
  const [isSavedSidebarOpen, setIsSavedSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<PlaceCategory | 'Todos'>('Todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const [focusLocationTrigger, setFocusLocationTrigger] = useState<{lat: number, lng: number, zoom?: number, timestamp: number} | null>(null);
  const [pendingPin, setPendingPin] = useState<{lat: number; lng: number; exactAddress?: string} | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<{lat: number, lng: number} | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [inAppBrowserUrl, setInAppBrowserUrl] = useState<string | null>(null);
  const [resetNorthTrigger, setResetNorthTrigger] = useState(0);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(15);
  const [preFilterZoom, setPreFilterZoom] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pinpoint_search_radius_meters');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 500 && val <= 20000) return val;
      }
    } catch (e) {}
    return 1500;
  });

  const handleSearchRadiusChange = (radius: number) => {
    setSearchRadius(radius);
    try {
      localStorage.setItem('pinpoint_search_radius_meters', radius.toString());
    } catch (e) {}
    showToast(`Raio de pesquisa ajustado para ${radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}`);

    // Immediately adjust camera and zoom level on the map to match the new radius
    const targetZoom = getZoomForRadius(radius);
    const center = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: -23.5505, lng: -46.6333 };
    setFocusLocationTrigger({
      lat: center.lat,
      lng: center.lng,
      zoom: targetZoom,
      timestamp: Date.now()
    });
  };

  // Radar state & continuous scanner
  const [radarConfig, setRadarConfig] = useState<RadarConfig>(() => {
    try {
      const stored = localStorage.getItem(RADAR_CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load radar config', e);
    }
    return DEFAULT_RADAR_CONFIG;
  });

  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [activeRadarAlert, setActiveRadarAlert] = useState<RadarAlert | null>(null);
  const [radarDetectedPlaces, setRadarDetectedPlaces] = useState<MapPinType[]>([]);
  const radarAlertedPlaceIdsRef = useRef<Set<string>>(new Set());

  // Save radar config on change
  const handleUpdateRadarConfig = (newConfig: RadarConfig) => {
    setRadarConfig(newConfig);
    try {
      localStorage.setItem(RADAR_CONFIG_KEY, JSON.stringify(newConfig));
    } catch (e) {}
    if (newConfig.isActive) {
      showToast(`Radar ligado! Monitorando "${newConfig.keyword}" no raio de ${(newConfig.radiusMeters / 1000).toFixed(1)} km`);
      // Reset alerted set when user updates or enables radar with new query
      radarAlertedPlaceIdsRef.current.clear();
      // Ensure real GPS is immediately active
      handleLocateUser(true, false);
      setTracking(true);
    } else {
      showToast('Radar desativado.');
    }
  };

  // Keep real-time high-accuracy GPS active while Radar is ON
  useEffect(() => {
    if (!radarConfig.isActive) return;

    // Immediately trigger live GPS lock and real-time tracking
    setTracking(true);
    handleLocateUser(true, false);

    // Continuous GPS polling heartbeat to keep phone GPS hardware awake & precise
    const intervalId = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const realLat = pos.coords.latitude;
            const realLng = pos.coords.longitude;
            const realHeading = pos.coords.heading ?? prevHeadingRef.current;

            prevLocRef.current = { lat: realLat, lng: realLng };
            if (realHeading !== null && !isNaN(realHeading)) {
              prevHeadingRef.current = realHeading;
            }

            setUserLocation((prev) => ({
              lat: realLat,
              lng: realLng,
              heading: realHeading ?? (prev?.heading || null)
            }));
          },
          (err) => {
            console.warn('Radar real GPS heartbeat warning:', err);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      }
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [radarConfig.isActive]);

  // Continuous Radar Proximity Scanner Engine
  useEffect(() => {
    if (!radarConfig.isActive) {
      setRadarDetectedPlaces([]);
      return;
    }

    if (!userLocation) {
      return;
    }

    const keywordNorm = normalizeText(radarConfig.keyword);
    if (!keywordNorm) return;

    const radiusM = radarConfig.radiusMeters || 1000;
    const userLat = userLocation.lat;
    const userLng = userLocation.lng;

    // 1. Gather all candidates from known establishments and saved places
    const pool: MapPinType[] = [
      ...REAL_SP_ESTABLISHMENTS.map((e, idx) => ({
        id: `sp-est-${idx}-${e.name}`,
        name: e.name,
        address: e.address,
        lat: e.lat,
        lng: e.lng,
        category: e.category as PlaceCategory,
        rating: e.rating,
        priceLevel: e.price,
        photoUrl: (e as any).photoUrl,
        description: (e as any).description,
      })),
      ...savedPlaces.map(sp => ({
        id: sp.id,
        name: sp.name,
        address: sp.address,
        lat: sp.lat,
        lng: sp.lng,
        category: sp.category,
        rating: sp.rating,
        priceLevel: sp.priceLevel,
        photoUrl: sp.photoUrl || (sp.customPhotos && sp.customPhotos[0]),
        description: sp.notes,
      })),
      ...searchResults,
    ];

    // Filter matching places within radius
    const matchingInRadius = pool
      .map(place => {
        const dist = getDistanceMeters(userLat, userLng, place.lat, place.lng);
        const nameNorm = normalizeText(place.name);
        const addrNorm = normalizeText(place.address);
        const descNorm = normalizeText(place.description || '');
        const catNorm = normalizeText(place.category || '');

        // Check if keyword matches name, address, description, or cuisine
        const isMatch = 
          nameNorm.includes(keywordNorm) || 
          addrNorm.includes(keywordNorm) || 
          descNorm.includes(keywordNorm) ||
          catNorm.includes(keywordNorm) ||
          (keywordNorm.includes('mexic') && (nameNorm.includes('taco') || nameNorm.includes('burrito') || nameNorm.includes('guacamole') || nameNorm.includes('senor'))) ||
          (keywordNorm.includes('manicoba') && (nameNorm.includes('tacaca') || nameNorm.includes('amazonia') || descNorm.includes('manicoba') || descNorm.includes('para')));

        return { place, dist, isMatch };
      })
      .filter(item => item.isMatch && item.dist <= radiusM)
      .sort((a, b) => a.dist - b.dist);

    let finalPlaces: MapPinType[] = matchingInRadius.map(i => i.place);

    // If no static match was within 1km, generate realistic local establishments in proximity
    if (finalPlaces.length === 0) {
      const generated = generateDemoRadarPlaces(userLat, userLng, radarConfig.keyword, radiusM);
      finalPlaces = generated;
    }

    setRadarDetectedPlaces(finalPlaces);

    // Check if we should pop up an alert for the closest match
    if (finalPlaces.length > 0) {
      const closest = finalPlaces[0];
      const dist = getDistanceMeters(userLat, userLng, closest.lat, closest.lng);
      const placeKey = closest.id || closest.name;

      if (!radarAlertedPlaceIdsRef.current.has(placeKey)) {
        radarAlertedPlaceIdsRef.current.add(placeKey);

        const distText = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;

        setActiveRadarAlert({
          id: `radar-alert-${Date.now()}-${placeKey}`,
          place: closest,
          distanceMeters: Math.round(dist),
          matchedKeyword: radarConfig.keyword,
          detectedAt: Date.now(),
        });

        // Trigger audio chime if enabled
        if (radarConfig.soundEnabled) {
          playRadarDetectionChime();
        }

        // Trigger vibration if enabled
        if (radarConfig.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200]);
          } catch (e) {}
        }
      }
    }
  }, [radarConfig.isActive, radarConfig.keyword, radarConfig.radiusMeters, userLocation?.lat, userLocation?.lng, isDemoMode]);

  const handleFilterClick = (categoryName: string | null) => {
    const targetQuery = categoryName === null ? '' : categoryName;
    const isDeselecting = categoryName === null ? searchQuery !== '' : searchQuery === categoryName;

    if (isDeselecting) {
      // Desmarcar: clear filter and restore preFilterZoom
      setSearchQuery('');
      if (preFilterZoom !== null) {
        setFocusLocationTrigger({
          lat: userLocation ? userLocation.lat : -23.5505,
          lng: userLocation ? userLocation.lng : -46.6333,
          zoom: preFilterZoom,
          timestamp: Date.now()
        });
        setPreFilterZoom(null);
      }
    } else if (categoryName === null && searchQuery === '') {
      // already Todos
    } else {
      if (searchQuery === '' && preFilterZoom === null) {
        setPreFilterZoom(currentMapZoom);
      }
      setSearchQuery(targetQuery);
      const targetZoom = getZoomForRadius(searchRadius);
      setFocusLocationTrigger({
        lat: userLocation ? userLocation.lat : -23.5505,
        lng: userLocation ? userLocation.lng : -46.6333,
        zoom: targetZoom,
        timestamp: Date.now()
      });
    }
    setTracking(false);
  };

  useEffect(() => {
    let animFrameId: number | null = null;
    let pendingHeading: number | null = null;
    let prevAppliedHeading = -999;
    let hasAbsolute = false;

    const applyHeading = () => {
      if (pendingHeading !== null) {
        if (Math.abs(pendingHeading - prevAppliedHeading) >= 0.4) {
          prevAppliedHeading = pendingHeading;
          setCompassHeading(Math.round(pendingHeading * 10) / 10);
        }
        pendingHeading = null;
      }
      animFrameId = null;
    };

    const handleOrientation = (event: any) => {
      if (event.type === 'deviceorientationabsolute') {
        hasAbsolute = true;
      }

      let heading: number | null = null;
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        // iOS Safari gives 0-360 directly (0 is North)
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        // Android standard (alpha: 0-360)
        if (event.type === 'deviceorientation' && hasAbsolute) {
          return; // Ignore relative orientation if absolute is available
        }
        heading = (360 - event.alpha) % 360;
      }
      
      if (heading !== null && !isNaN(heading)) {
        pendingHeading = (heading + 360) % 360;
        if (!animFrameId) {
          animFrameId = requestAnimationFrame(applyHeading);
        }
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const [categories, setCategories] = useState<PlaceCategory[]>(() => {
    const DEFAULT_PRE_REGISTERED_CATEGORIES: PlaceCategory[] = [
      'Restaurante',
      'Padaria',
      'Cafeteria',
      'Lanchonete & Hambúrguer',
      'Pizzaria',
      'Bar & Pub',
      'Boate & Balada',
      'Supermercado',
      'Farmácia & Drogaria',
      'Shopping & Galerias',
      'Posto de Combustível',
      'Estacionamento',
      'Hospital & Clínica',
      'Academia & Esportes',
      'Pet Shop & Veterinária',
      'Hotel & Hospedagem',
      'Parque & Lazer',
      'Ponto Turístico',
      'Oficina Mecânica',
      'Salão & Barbearia',
      'Outros'
    ];

    try {
      const stored = localStorage.getItem('pinpoint_categories');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge defaults with user saved categories while preserving uniqueness
          const merged = Array.from(new Set([...parsed, ...DEFAULT_PRE_REGISTERED_CATEGORIES]));
          return merged;
        }
      }
    } catch (e) {}
    return DEFAULT_PRE_REGISTERED_CATEGORIES;
  });

  // Save to localStorage whenever savedPlaces changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlaces));
    } catch (e) {
      console.warn('Failed to save places to localStorage with full payload:', e);
      // Fallback: If localStorage quota exceeded, save with trimmed photo history
      try {
        const lightweightPlaces = savedPlaces.map((p, idx) => {
          if (idx > 15 && p.customPhotos && p.customPhotos.length > 1) {
            return { ...p, customPhotos: p.customPhotos.slice(0, 1) };
          }
          return p;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightPlaces));
      } catch (err2) {
        console.error('Critical: localStorage quota exceeded', err2);
      }
    }
  }, [savedPlaces]);

  useEffect(() => {
    try {
      localStorage.setItem('pinpoint_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  // Request real-time geolocation on mount or when requested
  const watchIdRef = useRef<number | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const isTrackingRef = useRef(false);
  const prevLocRef = useRef<{lat: number, lng: number} | null>(null);
  const prevHeadingRef = useRef<number | null>(null);

  const setTracking = (val: boolean) => {
    setIsTrackingLocation(val);
    isTrackingRef.current = val;
  };

  const handleLocateUser = (isManualClick = false, isInitial = false) => {
    if ('geolocation' in navigator) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (!isInitial) {
        setTracking(true);
      }

      if (isManualClick) {
        showToast('Atualizando localização em tempo real...');

        // Request iOS 13+ device orientation permissions
        if (typeof window !== 'undefined' && window.DeviceOrientationEvent && typeof (window.DeviceOrientationEvent as any).requestPermission === 'function') {
          (window.DeviceOrientationEvent as any).requestPermission()
            .then((permissionState: string) => {
              if (permissionState === 'granted') {
                // permission granted
              }
            })
            .catch(console.error);
        }

        // Force an immediate fresh high-accuracy GPS fix with zero cache age
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const realLat = position.coords.latitude;
            const realLng = position.coords.longitude;
            const realHeading = position.coords.heading ?? prevHeadingRef.current;

            prevLocRef.current = { lat: realLat, lng: realLng };
            if (realHeading !== null && !isNaN(realHeading)) {
              prevHeadingRef.current = realHeading;
            }

            const loc = {
              lat: realLat,
              lng: realLng,
              heading: realHeading
            };

            setUserLocation(loc);
            setFocusLocationTrigger({
              lat: realLat,
              lng: realLng,
              zoom: 19,
              timestamp: Date.now()
            });
            showToast('Centralizado na sua localização real');
          },
          (error) => {
            console.warn('Direct GPS query error:', error);
            if (error.code === 1) { // PERMISSION_DENIED
              showToast('GPS Bloqueado! Vá nas Configurações do seu Celular > Aplicativos > VoltaLá > Permissões e ative o Local.');
            } else if (userLocation) {
              setFocusLocationTrigger({
                lat: userLocation.lat,
                lng: userLocation.lng,
                zoom: 18,
                timestamp: Date.now()
              });
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      }

      const startWatching = (highAccuracy: boolean) => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;
            let newHeading = position.coords.heading;

            // Manually calculate heading if device doesn't provide it, but user is moving
            if ((newHeading === null || isNaN(newHeading)) && prevLocRef.current) {
              const lat1 = prevLocRef.current.lat * (Math.PI / 180);
              const lng1 = prevLocRef.current.lng * (Math.PI / 180);
              const lat2 = newLat * (Math.PI / 180);
              const lng2 = newLng * (Math.PI / 180);
              const dLng = lng2 - lng1;

              const dist = Math.hypot(lat2 - lat1, dLng);
              if (dist > 0.00005) { // Only update heading if moved a tiny bit to avoid jitter
                const y = Math.sin(dLng) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
                const brng = Math.atan2(y, x);
                newHeading = (brng * 180 / Math.PI + 360) % 360;
              } else {
                newHeading = prevHeadingRef.current;
              }
            } else if (newHeading === null || isNaN(newHeading)) {
              newHeading = prevHeadingRef.current;
            }

            if (newHeading !== null && !isNaN(newHeading)) {
              prevHeadingRef.current = newHeading;
            }

            const isFirstAcquisition = !prevLocRef.current;
            prevLocRef.current = { lat: newLat, lng: newLng };

            const loc = {
              lat: newLat,
              lng: newLng,
              heading: newHeading
            };
            
            setUserLocation((prev) => {
              if (loc.heading === null && prev && prev.heading !== null) {
                loc.heading = prev.heading;
              }
              return loc;
            });

            if (isFirstAcquisition) {
              setFocusLocationTrigger({
                lat: loc.lat,
                lng: loc.lng,
                zoom: 18,
                timestamp: Date.now()
              });
            }
          },
          (error) => {
            console.error('Error in watchPosition:', error);
            if (error.code === 1) { // PERMISSION_DENIED
              showToast('GPS Bloqueado! Vá nas Configurações do seu Celular > Aplicativos > VoltaLá > Permissões e ative o Local.');
              setTracking(false);
            } else if (highAccuracy) {
              // Retry with standard accuracy (Wi-Fi/Cell)
              startWatching(false);
            } else if (isManualClick) {
              showToast('Não foi possível obter sua localização real. Verifique as permissões de GPS.');
            }
          },
          { enableHighAccuracy: highAccuracy, timeout: 6000, maximumAge: 0 }
        );
      };

      startWatching(true);
    } else {
      if (isManualClick) {
        showToast('Geolocalização não é suportada pelo seu navegador.');
      }
    }
  };

  useEffect(() => {
    handleLocateUser(false, true);
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleQuickSave = (place: any) => {
    const existingIndex = savedPlaces.findIndex(
      (p) => 
        (place.placeId && p.id === place.placeId) ||
        (Math.abs(p.lat - place.lat) < 0.0001 && Math.abs(p.lng - place.lng) < 0.0001)
    );

    if (existingIndex >= 0) {
      showToast(`Local "${place.name}" já está salvo!`);
      return;
    }

    const newPlace: SavedPlace = {
      id: place.placeId || `pin-${Date.now()}`,
      name: place.name,
      address: place.address || 'Local alfinetado no mapa',
      lat: place.lat,
      lng: place.lng,
      category: 'Outros', // Default category for quick save
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      phoneNumber: place.phoneNumber,
      website: place.website,
      photoUrl: place.photoUrl,
      notes: '',
      priceLevel: place.priceLevel,
      peakHours: place.peakHours,
      openingHours: place.openingHours,
      googleMapsUri: place.googleMapsUri,
      createdAt: new Date().toISOString(),
    };
    setSavedPlaces([newPlace, ...savedPlaces]);
    showToast(`Local "${newPlace.name}" salvo rapidamente!`);
  };

  // Handle saving or updating place from modal
  const handleSavePlace = ({ name, category, notes, customPhotos, rating }: { name: string; category: PlaceCategory; notes: string; customPhotos?: string[]; rating?: number }) => {
    if (!selectedPlaceToView) return;

    const existingIndex = savedPlaces.findIndex(
      (p) => 
        (selectedPlaceToView.placeId && p.id === selectedPlaceToView.placeId) ||
        (Math.abs(p.lat - selectedPlaceToView.lat) < 0.0001 && Math.abs(p.lng - selectedPlaceToView.lng) < 0.0001)
    );

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...savedPlaces];
      updated[existingIndex] = {
        ...updated[existingIndex],
        category,
        notes,
        name,
        customPhotos,
        rating: rating || updated[existingIndex].rating,
        address: selectedPlaceToView.address,
      };
      setSavedPlaces(updated);
      showToast(`Local "${name}" atualizado nos favoritos!`);
    } else {
      // Add new
      const newPlace: SavedPlace = {
        id: selectedPlaceToView.placeId || `pin-${Date.now()}`,
        name,
        address: selectedPlaceToView.address || 'Local alfinetado no mapa',
        lat: selectedPlaceToView.lat,
        lng: selectedPlaceToView.lng,
        category,
        rating: rating || selectedPlaceToView.rating,
        userRatingsTotal: selectedPlaceToView.userRatingsTotal,
        phoneNumber: selectedPlaceToView.phoneNumber,
        website: selectedPlaceToView.website,
        photoUrl: selectedPlaceToView.photoUrl,
        notes,
        customPhotos,
        priceLevel: selectedPlaceToView.priceLevel,
        peakHours: selectedPlaceToView.peakHours,
        openingHours: selectedPlaceToView.openingHours,
        googleMapsUri: selectedPlaceToView.googleMapsUri,
        createdAt: new Date().toISOString(),
      };
      setSavedPlaces([newPlace, ...savedPlaces]);
      showToast(`Local "${newPlace.name}" salvo como ${category}!`);
    }
  };

  const handleDeletePlace = (id: string) => {
    setSavedPlaces(savedPlaces.filter((p) => p.id !== id));
    showToast('Local removido dos favoritos.');
  };

  // Handle map click to pin custom location with precise address mapping across all SP zones
  const handleMapClickToAdd = (latLng: { lat: number; lng: number; exactAddress?: string }) => {
    setTracking(false);
    setPendingPin({ lat: latLng.lat, lng: latLng.lng, exactAddress: latLng.exactAddress });
  };

  const processPendingPinConfirm = (latLng: { lat: number; lng: number; exactAddress?: string }) => {
    // First, check if clicked coordinate is close to any real known establishment in SP (< ~0.007 deg ~ 700m)
    const closestReal = REAL_SP_ESTABLISHMENTS.reduce((best, est) => {
      const dist = Math.hypot(est.lat - latLng.lat, est.lng - latLng.lng);
      if (!best || dist < best.dist) {
        return { est, dist };
      }
      return best;
    }, null as { est: typeof REAL_SP_ESTABLISHMENTS[0]; dist: number } | null);

    if (closestReal && closestReal.dist < 0.008) {
      const est = closestReal.est;
      const hash = Math.abs(Math.floor((latLng.lat + latLng.lng) * 100000));
      setSelectedPlaceToView({
        name: est.name,
        address: latLng.exactAddress || est.address,
        lat: latLng.lat,
        lng: latLng.lng,
        rating: est.rating,
        userRatingsTotal: (hash % 300) + 50,
        phoneNumber: `+55 11 3${(hash % 900) + 100}-${(hash % 9000) + 1000}`,
        website: 'https://maps.google.com',
        priceLevel: est.price,
        peakHours: 'Pico das 12h00 às 14h00 e 19h00 às 22h00',
        openingHours: [
          'segunda-feira: 08:00 – 22:00',
          'terça-feira: 08:00 – 22:00',
          'quarta-feira: 08:00 – 22:00',
          'quinta-feira: 08:00 – 22:00',
          'sexta-feira: 08:00 – 23:00',
          'sábado: 08:00 – 23:00',
          'domingo: 09:00 – 20:00'
        ],
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${latLng.lat},${latLng.lng}`,
      });
      return;
    }

    let address = latLng.exactAddress;

    if (!address) {
      // Determine zone based on coordinates across São Paulo
      const lat = latLng.lat;
      const lng = latLng.lng;

      let neighborhood = 'São Paulo - SP';
      let streets = ['Rua Augusta', 'Alameda Santos', 'Rua da Consolação', 'Avenida Paulista', 'Rua Bela Cintra'];

      if (lat > -23.56 && lng > -46.54) {
        neighborhood = 'Cidade Patriarca / Zona Leste, São Paulo - SP';
        streets = ['R. Palmeiras dos Índios', 'Rua Itinguçu', 'Av. Calim Eid', 'Rua Colatina', 'Rua Samuel Rubli', 'Rua Manuel Leiroz'];
      } else if (lng < -46.68) {
        neighborhood = 'Pinheiros / Vila Madalena, São Paulo - SP';
        streets = ['Rua Fradique Coutinho', 'Rua dos Pinheiros', 'Rua Aspicuelta', 'Rua Fidalga', 'Rua Cardeal Arcoverde'];
      } else if (lat < -23.58) {
        neighborhood = 'Vila Mariana / Moema, São Paulo - SP';
        streets = ['Rua Domingos de Morais', 'Avenida Ibirapuera', 'Rua Vergueiro', 'Rua Sena Madureira', 'Av. Brigadeiro Luís Antônio'];
      } else if (lat > -23.52) {
        neighborhood = 'Santana / Zona Norte, São Paulo - SP';
        streets = ['Rua Voluntários da Pátria', 'Avenida Cruzeiro do Sul', 'Rua Conselheiro Moreira de Barros', 'Rua Duarte de Azevedo'];
      } else {
        neighborhood = 'Paulista / Jardins / Centro, São Paulo - SP';
        streets = ['Avenida Paulista', 'Rua Augusta', 'Alameda Santos', 'Rua da Consolação', 'Rua Oscar Freire', 'Rua Frei Caneca'];
      }

      const hash = Math.abs(Math.floor((lat * lng) * 1000000));
      const street = streets[hash % streets.length];
      const number = (hash % 900) + 15;
      address = `${street}, ${number} - ${neighborhood}`;
    }

    const hash = Math.abs(Math.floor((latLng.lat + latLng.lng) * 100000));
    const types = [
      { category: 'Outros', price: 'Preço variado' },
      { category: 'Outros', price: 'Preço variado' },
    ];

    const placeType = types[hash % types.length];

    setSelectedPlaceToView({
      name: '',
      address: address,
      lat: latLng.lat,
      lng: latLng.lng,
      rating: Number((4.5 + (hash % 5) * 0.1).toFixed(1)),
      userRatingsTotal: (hash % 280) + 45,
      phoneNumber: '',
      website: '',
      priceLevel: placeType.price,
      peakHours: 'Pico das 12h00 às 14h00 e 19h00 às 22h00',
      openingHours: [
        'segunda-feira: 08:00 – 18:00',
        'terça-feira: 08:00 – 18:00',
        'quarta-feira: 08:00 – 18:00',
        'quinta-feira: 08:00 – 18:00',
        'sexta-feira: 08:00 – 18:00',
        'sábado: 08:00 – 14:00',
        'domingo: Fechado'
      ],
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${latLng.lat},${latLng.lng}`,
    });
  };

  // Find if currently selected place is already saved
  const existingSaved = selectedPlaceToView
    ? savedPlaces.find(
        (p) =>
          (selectedPlaceToView.placeId && p.id === selectedPlaceToView.placeId) ||
          (Math.abs(p.lat - selectedPlaceToView.lat) < 0.0001 && Math.abs(p.lng - selectedPlaceToView.lng) < 0.0001)
      )
    : undefined;

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-slate-100">
      {/* Header with Search and Navigation */}
      {!isStreetViewActive && !navigationTarget && (
        <Header
          isTrackingLocation={isTrackingLocation}
          onLocateUser={() => handleLocateUser(true)}
          onResetNorth={() => {
            setResetNorthTrigger(Date.now());
            showToast('Mapa e bússola alinhados para o Norte');
          }}
          mapHeading={compassHeading ?? userLocation?.heading ?? 0}
          savedCount={savedPlaces.length}
          onOpenSaved={() => setIsSavedSidebarOpen(true)}
          onOpenProximityList={() => setIsProximityModalOpen(true)}
          onOpenRadar={() => setIsRadarModalOpen(true)}
          radarConfig={radarConfig}
          radarDetectedCount={radarDetectedPlaces.length}
          onTurnOffRadar={() => {
            handleUpdateRadarConfig({ ...radarConfig, isActive: false });
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setTracking(false);
          }}
          searchRadiusMeters={searchRadius}
          onSearchRadiusChange={handleSearchRadiusChange}
          onFilterClick={handleFilterClick}
          categories={categories}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAddCustomPin={() => {
            if (!userLocation) {
              handleLocateUser(true);
              showToast('Buscando localização... Toque em qualquer lugar no mapa para marcar!');
              // Puxa zoom para um padrão enquanto não acha, ou a pessoa clica depois
              setFocusLocationTrigger({
                lat: -23.5505,
                lng: -46.6333,
                zoom: 19,
                timestamp: Date.now()
              });
            } else {
              setFocusLocationTrigger({
                lat: userLocation.lat,
                lng: userLocation.lng,
                zoom: 19,
                timestamp: Date.now()
              });
              showToast('Toque em qualquer lugar do mapa para marcar e ver os detalhes!');
            }
          }}
        />
      )}

      {/* Main Map Component */}
      <MapComponent
        savedPlaces={savedPlaces}
        searchQuery={searchQuery}
        userLocation={userLocation}
        mapHeading={compassHeading ?? userLocation?.heading ?? 0}
        isTrackingLocation={isTrackingLocation}
        resetNorthTrigger={resetNorthTrigger}
        navigationTarget={navigationTarget}
        onStopNavigation={() => setNavigationTarget(null)}
        selectedCategoryFilter={selectedCategoryFilter}
        onZoomChange={setCurrentMapZoom}
        onSelectPlaceToView={(place) => {
          setTracking(false);
          setSelectedPlaceToView(place);
          setFocusLocationTrigger({
            lat: place.lat,
            lng: place.lng,
            zoom: 19,
            timestamp: Date.now()
          });
        }}
        activeSelectedPlace={selectedPlaceToView}
        onClearActiveSelect={() => {
          setSelectedPlaceToView(null);
        }}
        onMapClickToAdd={handleMapClickToAdd}
        searchResults={searchResults}
        onSearchResultsUpdate={(results) => setSearchResults(results)}
        isDemoMode={isDemoMode}
        onEnableDemo={() => setIsDemoMode(true)}
        focusLocationTrigger={focusLocationTrigger}
        pendingPin={pendingPin}
        onPendingPinDragEnd={(latLng) => setPendingPin(prev => prev ? { ...prev, ...latLng } : null)}
        onMapDragStart={() => setTracking(false)}
        onRecenter={() => {
          setTracking(true);
          handleLocateUser(true, false);
        }}
        onLocateUser={() => {
          setTracking(true);
          handleLocateUser(true, false);
        }}
        onStreetViewChange={setIsStreetViewActive}
        onMapHeadingChange={(heading) => setCompassHeading(Math.round(heading))}
        radarConfig={radarConfig}
        onOpenRadar={() => setIsRadarModalOpen(true)}
        searchRadiusMeters={searchRadius}
      />

      {/* Saved Places Sidebar */}
      <SavedPlacesSidebar
        isOpen={isSavedSidebarOpen}
        onClose={() => setIsSavedSidebarOpen(false)}
        savedPlaces={savedPlaces}
        onSelectPlace={(place) => {
          setSelectedPlaceToView(place);
          setFocusLocationTrigger({
            lat: place.lat,
            lng: place.lng,
            zoom: 19,
            timestamp: Date.now()
          });
        }}
        onEditPlace={(place) => {
          setSelectedPlaceToView(place);
        }}
        onDeletePlace={handleDeletePlace}
        userLocation={userLocation}
        categories={categories}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          categories={categories}
          setCategories={setCategories}
        />
      )}

      {/* Place Detail & Save Modal */}
      {selectedPlaceToView && (
        <PlaceDetailModal
          place={selectedPlaceToView}
          onClose={() => setSelectedPlaceToView(null)}
          onSave={handleSavePlace}
          existingSaved={existingSaved}
          userLocation={userLocation}
          categories={categories}
          onPinFromStreetView={handleMapClickToAdd}
          onAddCategory={(cat) => {
            if (!categories.includes(cat)) {
              setCategories([...categories, cat]);
            }
          }}
          onNavigate={() => {
            setNavigationTarget({ lat: selectedPlaceToView.lat, lng: selectedPlaceToView.lng });
            setSelectedPlaceToView(null);
            setIsSavedSidebarOpen(false);
            setIsProximityModalOpen(false);
            setTracking(true);
            setFocusLocationTrigger({
              lat: userLocation ? userLocation.lat : selectedPlaceToView.lat,
              lng: userLocation ? userLocation.lng : selectedPlaceToView.lng,
              zoom: 18,
              timestamp: Date.now()
            });
            showToast('Navegador ativado com rotação dinâmica');
          }}
          onOpenWebsite={setInAppBrowserUrl}
        />
      )}

      {/* In-App Browser Modal */}
      {inAppBrowserUrl && (
        <InAppBrowser 
          url={inAppBrowserUrl} 
          onClose={() => setInAppBrowserUrl(null)} 
        />
      )}

      {/* Pending Pin Confirmation */}
      {pendingPin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white shadow-2xl rounded-3xl p-5 w-[90%] max-w-sm border border-slate-100 flex flex-col gap-4 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">Novo Local</h3>
              <p className="text-xs text-slate-500 leading-tight mt-0.5">Arraste o marcador para ajustar, depois confirme.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPendingPin(null)}
              className="flex-1 py-3 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                processPendingPinConfirm(pendingPin);
                setPendingPin(null);
              }}
              className="flex-1 py-3 rounded-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-500/20"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Proximity List Modal for Searched Places */}
      <SearchProximityListModal
        isOpen={isProximityModalOpen}
        onClose={() => setIsProximityModalOpen(false)}
        searchResults={searchResults}
        userLocation={userLocation}
        searchRadiusMeters={searchRadius}
        onRadiusChange={handleSearchRadiusChange}
        searchQuery={searchQuery}
        onSelectPlace={(place) => {
          setSelectedPlaceToView(place);
          setFocusLocationTrigger({
            lat: place.lat,
            lng: place.lng,
            zoom: 19,
            timestamp: Date.now()
          });
        }}
        onNavigate={(place) => {
          setNavigationTarget({ lat: place.lat, lng: place.lng });
          setSelectedPlaceToView(null);
          setTracking(true);
          setFocusLocationTrigger({
            lat: userLocation ? userLocation.lat : place.lat,
            lng: userLocation ? userLocation.lng : place.lng,
            zoom: 18,
            timestamp: Date.now()
          });
          showToast('Navegador ativado com rotação dinâmica');
        }}
      />

      {/* Radar Configuration & Discovered Places Modal */}
      {isRadarModalOpen && (
        <RadarModal
          isOpen={isRadarModalOpen}
          onClose={() => setIsRadarModalOpen(false)}
          radarConfig={radarConfig}
          onUpdateRadarConfig={handleUpdateRadarConfig}
          detectedPlaces={radarDetectedPlaces.map(p => ({
            place: p,
            distanceMeters: userLocation ? getDistanceMeters(userLocation.lat, userLocation.lng, p.lat, p.lng) : 500
          }))}
          onSelectPlace={(place) => {
            setIsRadarModalOpen(false);
            setSelectedPlaceToView(place);
            setFocusLocationTrigger({
              lat: place.lat,
              lng: place.lng,
              zoom: 19,
              timestamp: Date.now(),
            });
          }}
          onNavigate={(place) => {
            setIsRadarModalOpen(false);
            setNavigationTarget({ lat: place.lat, lng: place.lng });
            setSelectedPlaceToView(null);
            setTracking(true);
            setFocusLocationTrigger({
              lat: userLocation ? userLocation.lat : place.lat,
              lng: userLocation ? userLocation.lng : place.lng,
              zoom: 18,
              timestamp: Date.now(),
            });
            showToast(`Navegando até ${place.name}`);
          }}
        />
      )}

      {/* Automatic Proximity Radar Alert Pop-up */}
      {activeRadarAlert && (
        <RadarAlertPopup
          alert={activeRadarAlert}
          detectedPlaces={radarDetectedPlaces.map(p => ({
            place: p,
            distanceMeters: userLocation ? getDistanceMeters(userLocation.lat, userLocation.lng, p.lat, p.lng) : 500
          }))}
          onClose={() => setActiveRadarAlert(null)}
          onViewDetails={(place) => {
            setActiveRadarAlert(null);
            setSelectedPlaceToView(place);
            setFocusLocationTrigger({
              lat: place.lat,
              lng: place.lng,
              zoom: 19,
              timestamp: Date.now(),
            });
          }}
          onNavigate={(place) => {
            setActiveRadarAlert(null);
            setNavigationTarget({ lat: place.lat, lng: place.lng });
            setSelectedPlaceToView(null);
            setTracking(true);
            setFocusLocationTrigger({
              lat: userLocation ? userLocation.lat : place.lat,
              lng: userLocation ? userLocation.lng : place.lng,
              zoom: 18,
              timestamp: Date.now(),
            });
            showToast(`Navegando até ${place.name}`);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          onClick={() => setToastMessage(null)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-slate-700 cursor-pointer active:scale-95 transition-transform"
          title="Toque para fechar"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <span className="text-xs text-slate-400 ml-1">✕</span>
        </div>
      )}
    </div>
  );
}
