import React, { useState, useEffect } from 'react';
import { SavedPlace, MapPin as MapPinType, PlaceCategory, RadarConfig, getZoomForRadius } from '../types';
import { Star, MapPin, Navigation, Bookmark, Plus, Minus, Search, Compass, Layers, LocateFixed, X, Radio } from 'lucide-react';
import { getDefaultOpeningHoursForCategory } from '../utils/openingHours';

interface DemoMapProps {
  savedPlaces: SavedPlace[];
  searchQuery: string;
  userLocation: { lat: number; lng: number } | null;
  isTrackingLocation?: boolean;
  onLocateUser?: () => void;
  selectedCategoryFilter: PlaceCategory | 'Todos';
  onSelectPlaceToView: (place: any) => void;
  onMapClickToAdd: (latLng: { lat: number; lng: number; exactAddress?: string }) => void;
  searchResults: MapPinType[];
  focusLocationTrigger?: { lat: number; lng: number; zoom?: number; timestamp: number } | null;
  onMapDragStart?: () => void;
  onMapDoubleClick?: () => void;
  onStreetViewChange?: (isActive: boolean) => void;
  navigationTarget?: { lat: number; lng: number } | null;
  onStopNavigation?: () => void;
  resetNorthTrigger?: number;
  onZoomChange?: (zoom: number) => void;
  radarConfig?: RadarConfig;
  onOpenRadar?: () => void;
  searchRadiusMeters?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Padaria': 'bg-amber-500',
  'Restaurante': 'bg-red-500',
  'Cafeteria': 'bg-lime-600',
  'Supermercado': 'bg-blue-600',
  'Farmácia': 'bg-emerald-500',
  'Shopping': 'bg-purple-600',
  'Boate': 'bg-pink-600',
  'Automotivo': 'bg-blue-700',
  'Outros': 'bg-slate-600',
};

// Sample mock POIs for demo search including Mexican, Maniçoba and other popular spots
const MOCK_POIS: MapPinType[] = [
  { 
    id: 'demo-car-1', 
    name: 'Avelinos Car - Centro Automotivo & Oficina', 
    address: 'Av. Conselheiro Carrão, 1420 - Vila Carrão, São Paulo - SP', 
    lat: -23.5480, 
    lng: -46.5360, 
    rating: 4.9, 
    userRatingsTotal: 340,
    category: 'Automotivo',
    phoneNumber: '+55 11 2092-1420',
    website: 'https://maps.google.com',
    priceLevel: 'R$ 80 - R$ 350 por serviço',
    peakHours: 'Pico das 09h00 às 17h00',
    photoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    description: 'Avelinos Car: oficina mecânica especializada, revisão preventiva, freios, suspensão, injeção eletrônica e troca de óleo.',
    openingHours: [
      'segunda-feira: 08:00 – 18:00',
      'terça-feira: 08:00 – 18:00',
      'quarta-feira: 08:00 – 18:00',
      'quinta-feira: 08:00 – 18:00',
      'sexta-feira: 08:00 – 18:00',
      'sábado: 08:00 – 13:00',
      'domingo: Fechado'
    ],
  },
  { 
    id: 'demo-car-2', 
    name: 'Avelino Auto Car & Estética Automotiva', 
    address: 'Rua Itinguçu, 1540 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5395, 
    lng: -46.5075, 
    rating: 4.8, 
    userRatingsTotal: 195,
    category: 'Automotivo',
    phoneNumber: '+55 11 2685-1540',
    website: 'https://maps.google.com',
    priceLevel: 'R$ 60 - R$ 250 por serviço',
    peakHours: 'Pico das 08h30 às 16h30',
    photoUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
    description: 'Serviços automotivos completos, funilaria rápida, polimento, cristalização e mecânica geral.',
    openingHours: [
      'segunda-feira: 08:00 – 18:00',
      'terça-feira: 08:00 – 18:00',
      'quarta-feira: 08:00 – 18:00',
      'quinta-feira: 08:00 – 18:00',
      'sexta-feira: 08:00 – 18:00',
      'sábado: 08:00 – 14:00',
      'domingo: Fechado'
    ],
  },
  { 
    id: 'demo-mex-1', 
    name: 'El Tranvía Taquería & Bar Mexicano', 
    address: 'R. Bela Cintra, 1850 - Consolação, São Paulo - SP', 
    lat: -23.5585, 
    lng: -46.6625, 
    rating: 4.8, 
    userRatingsTotal: 620,
    category: 'Restaurante',
    phoneNumber: '+55 11 3064-1850',
    website: 'https://www.eltranvia.com.br',
    priceLevel: 'R$ 55 - R$ 110 por pessoa',
    peakHours: 'Pico das 19h30 às 22h30',
    photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    description: 'Especialista em comida mexicana com tacos artesanais, quesadillas, guacamole fresco, burritos e drinks.',
    openingHours: [
      'segunda-feira: 12:00 – 15:00, 18:30 – 23:30',
      'terça-feira: 12:00 – 15:00, 18:30 – 23:30',
      'quarta-feira: 12:00 – 15:00, 18:30 – 23:30',
      'quinta-feira: 12:00 – 15:00, 18:30 – 00:00',
      'sexta-feira: 12:00 – 15:30, 18:30 – 01:00',
      'sábado: 12:00 – 01:00',
      'domingo: 12:00 – 22:30'
    ],
  },
  { 
    id: 'demo-mex-2', 
    name: 'Si Señor Cocina Mexicana & Grill', 
    address: 'Al. Santos, 1200 - Cerqueira César, São Paulo - SP', 
    lat: -23.5650, 
    lng: -46.6530, 
    rating: 4.7, 
    userRatingsTotal: 840,
    category: 'Restaurante',
    phoneNumber: '+55 11 3284-1200',
    priceLevel: 'R$ 60 - R$ 120 por pessoa',
    peakHours: 'Pico das 20h00 às 23h00',
    photoUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop&q=80',
    description: 'Pratos mexicanos e tex-mex, nachos supremos, tacos crocantes, fajitas e margaritas.',
    openingHours: [
      'segunda-feira: 11:30 – 15:00, 18:00 – 23:00',
      'terça-feira: 11:30 – 15:00, 18:00 – 23:00',
      'quarta-feira: 11:30 – 15:00, 18:00 – 23:30',
      'quinta-feira: 11:30 – 15:00, 18:00 – 00:00',
      'sexta-feira: 11:30 – 15:00, 18:00 – 01:00',
      'sábado: 12:00 – 01:00',
      'domingo: 12:00 – 22:00'
    ],
  },
  { 
    id: 'demo-mex-3', 
    name: 'Guacamole Cantina & Tacos', 
    address: 'Rua Augusta, 1400 - Consolação, São Paulo - SP', 
    lat: -23.5535, 
    lng: -46.6575, 
    rating: 4.8, 
    userRatingsTotal: 530,
    category: 'Restaurante',
    phoneNumber: '+55 11 3151-1400',
    priceLevel: 'R$ 50 - R$ 95 por pessoa',
    peakHours: 'Pico das 20h00 às 23h30',
    photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    description: 'Restaurante temático com o melhor da culinária mexicana: tacos, burritos, quesadillas e drinks.',
    openingHours: [
      'segunda-feira: 18:00 – 23:30',
      'terça-feira: 18:00 – 23:30',
      'quarta-feira: 18:00 – 00:00',
      'quinta-feira: 18:00 – 00:30',
      'sexta-feira: 18:00 – 01:30',
      'sábado: 17:00 – 01:30',
      'domingo: 17:00 – 23:00'
    ],
  },
  { 
    id: 'demo-man-1', 
    name: 'Tacacá do Norte - Culinária Paraense & Maniçoba', 
    address: 'Rua Vergueiro, 1045 - Paraíso, São Paulo - SP', 
    lat: -23.5740, 
    lng: -46.6430, 
    rating: 4.9, 
    userRatingsTotal: 920,
    category: 'Restaurante',
    phoneNumber: '+55 11 3288-1045',
    priceLevel: 'R$ 45 - R$ 85 por pessoa',
    peakHours: 'Pico das 12h00 às 15h00 e 18h00 às 21h00',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    description: 'Famoso pela Maniçoba tradicional cozida por 7 dias, Tacacá no tucupi com jambu e Pato no Tucupi.',
    openingHours: [
      'segunda-feira: 11:00 – 22:00',
      'terça-feira: 11:00 – 22:00',
      'quarta-feira: 11:00 – 22:00',
      'quinta-feira: 11:00 – 22:30',
      'sexta-feira: 11:00 – 23:00',
      'sábado: 11:00 – 23:00',
      'domingo: 11:00 – 21:00'
    ],
  },
  { 
    id: 'demo-man-2', 
    name: 'Restaurante Amazônia - Sabores do Pará & Maniçoba', 
    address: 'Rua Haddock Lobo, 950 - Cerqueira César, São Paulo - SP', 
    lat: -23.5570, 
    lng: -46.6620, 
    rating: 4.8, 
    userRatingsTotal: 710,
    category: 'Restaurante',
    phoneNumber: '+55 11 3085-0950',
    priceLevel: 'R$ 50 - R$ 90 por pessoa',
    peakHours: 'Pico das 12h30 às 15h00',
    photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    description: 'Maniçoba paraense com maniva moída, costelinha e carnes salgadas, peixes amazônicos e açaí autêntico.',
    openingHours: [
      'segunda-feira: 11:30 – 16:00, 18:30 – 22:30',
      'terça-feira: 11:30 – 16:00, 18:30 – 22:30',
      'quarta-feira: 11:30 – 16:00, 18:30 – 22:30',
      'quinta-feira: 11:30 – 16:00, 18:30 – 23:00',
      'sexta-feira: 11:30 – 16:00, 18:30 – 23:30',
      'sábado: 11:30 – 23:30',
      'domingo: 11:30 – 21:30'
    ],
  },
  { 
    id: 'demo-man-3', 
    name: 'Casa do Norte & Sabores do Pará', 
    address: 'Rua Itinguçu, 850 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5365, 
    lng: -46.5115, 
    rating: 4.8, 
    userRatingsTotal: 460,
    category: 'Restaurante',
    phoneNumber: '+55 11 2684-0850',
    priceLevel: 'R$ 35 - R$ 70 por pessoa',
    peakHours: 'Pico das 12h00 às 14h30',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    description: 'Comida paraense autêntica com Maniçoba fresca, tacacá no tucupi com jambu e farinha d água de Bragança.',
    openingHours: [
      'segunda-feira: 09:00 – 20:00',
      'terça-feira: 09:00 – 20:00',
      'quarta-feira: 09:00 – 20:00',
      'quinta-feira: 09:00 – 20:00',
      'sexta-feira: 09:00 – 21:00',
      'sábado: 09:00 – 21:00',
      'domingo: 09:00 – 17:00'
    ],
  },
  { 
    id: 'demo-b1', 
    name: 'Club Yacht (Boate & Balada)', 
    address: 'R. Treze de Maio, 703 - Bela Vista, São Paulo - SP', 
    lat: -23.5590, 
    lng: -46.6490, 
    rating: 4.6, 
    userRatingsTotal: 880,
    category: 'Boate',
    phoneNumber: '+55 11 3104-7030',
    priceLevel: 'R$ 70 - R$ 150 por pessoa',
    peakHours: 'Pico das 00h30 às 04h30',
    openingHours: [
      'segunda-feira: Fechado',
      'terça-feira: Fechado',
      'quarta-feira: 23:00 – 05:00',
      'quinta-feira: 23:00 – 05:00',
      'sexta-feira: 23:30 – 06:00',
      'sábado: 23:30 – 06:00',
      'domingo: Fechado'
    ],
  },
  { 
    id: 'demo-b2', 
    name: 'Tokyo 東 (Boate, Bar & Karaokê)', 
    address: 'R. Maj. Sertório, 110 - Vila Buarque, São Paulo - SP', 
    lat: -23.5460, 
    lng: -46.6480, 
    rating: 4.5, 
    userRatingsTotal: 1450,
    category: 'Boate',
    phoneNumber: '+55 11 3159-0110',
    priceLevel: 'R$ 60 - R$ 130 por pessoa',
    peakHours: 'Pico das 22h00 às 03h00',
    openingHours: [
      'segunda-feira: Fechado',
      'terça-feira: 18:00 – 04:00',
      'quarta-feira: 18:00 – 04:00',
      'quinta-feira: 18:00 – 04:00',
      'sexta-feira: 18:00 – 06:00',
      'sábado: 18:00 – 06:00',
      'domingo: 16:00 – 23:30'
    ],
  },
  { 
    id: 'demo-b3', 
    name: 'D-Edge (Boate Eletrônica)', 
    address: 'Av. Olavo Bilac, 980 - Barra Funda, São Paulo - SP', 
    lat: -23.5285, 
    lng: -46.6620, 
    rating: 4.7, 
    userRatingsTotal: 2100,
    category: 'Boate',
    phoneNumber: '+55 11 3665-9800',
    priceLevel: 'R$ 90 - R$ 200 por pessoa',
    peakHours: 'Pico das 01h00 às 05h30',
    openingHours: [
      'segunda-feira: Fechado',
      'terça-feira: Fechado',
      'quarta-feira: Fechado',
      'quinta-feira: 23:59 – 07:00',
      'sexta-feira: 23:59 – 08:00',
      'sábado: 23:59 – 09:00',
      'domingo: 17:00 – 02:00'
    ],
  },
  { 
    id: 'demo-1', 
    name: 'Mister Rock Bar in Sampa', 
    address: 'R. Palmeiras dos Índios, 32 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5350, 
    lng: -46.5120, 
    rating: 4.8, 
    userRatingsTotal: 310,
    category: 'Restaurante',
    phoneNumber: '+55 11 2682-0032',
    priceLevel: 'R$ 40 - R$ 80 por pessoa',
    peakHours: 'Pico das 20h00 às 00h00',
    openingHours: [
      'segunda-feira: Fechado',
      'terça-feira: 17:30 – 00:00',
      'quarta-feira: 17:30 – 00:00',
      'quinta-feira: 17:30 – 01:00',
      'sexta-feira: 17:30 – 02:00',
      'sábado: 16:00 – 02:00',
      'domingo: 16:00 – 23:00'
    ],
  },
  { 
    id: 'demo-2', 
    name: 'Costelaria e Churrascaria Radial', 
    address: 'Av. Calim Eid, 450 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5320, 
    lng: -46.5150, 
    rating: 4.7, 
    userRatingsTotal: 580,
    category: 'Restaurante',
    phoneNumber: '+55 11 2685-0450',
    priceLevel: 'R$ 55 - R$ 110 por pessoa',
    peakHours: 'Pico das 12h30 às 15h00',
    openingHours: [
      'segunda-feira: 11:30 – 16:00, 18:30 – 23:00',
      'terça-feira: 11:30 – 16:00, 18:30 – 23:00',
      'quarta-feira: 11:30 – 16:00, 18:30 – 23:00',
      'quinta-feira: 11:30 – 16:00, 18:30 – 23:30',
      'sexta-feira: 11:30 – 16:00, 18:30 – 00:00',
      'sábado: 11:30 – 00:00',
      'domingo: 11:30 – 22:00'
    ],
  },
  { 
    id: 'demo-3', 
    name: 'Chopperia & Espetinho do Juiz', 
    address: 'Rua Itinguçu, 1200 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5380, 
    lng: -46.5100, 
    rating: 4.6, 
    userRatingsTotal: 420,
    category: 'Restaurante',
    phoneNumber: '+55 11 2681-1200',
    priceLevel: 'R$ 35 - R$ 75 por pessoa',
    peakHours: 'Pico das 19h00 às 23h00',
    openingHours: [
      'segunda-feira: 16:00 – 00:00',
      'terça-feira: 16:00 – 00:00',
      'quarta-feira: 16:00 – 00:00',
      'quinta-feira: 16:00 – 01:00',
      'sexta-feira: 16:00 – 02:00',
      'sábado: 14:00 – 02:00',
      'domingo: 14:00 – 23:00'
    ],
  },
  { 
    id: 'demo-4', 
    name: 'Autorizada Brother ZL', 
    address: 'Rua Samuel Rubli, 45 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5360, 
    lng: -46.5080, 
    rating: 4.5, 
    userRatingsTotal: 95,
    category: 'Outros',
    phoneNumber: '+55 11 2682-4545',
    priceLevel: 'R$ 50 - R$ 150 por serviço',
    peakHours: 'Pico das 10h00 às 16h00',
    openingHours: [
      'segunda-feira: 08:30 – 18:00',
      'terça-feira: 08:30 – 18:00',
      'quarta-feira: 08:30 – 18:00',
      'quinta-feira: 08:30 – 18:00',
      'sexta-feira: 08:30 – 18:00',
      'sábado: 08:30 – 13:00',
      'domingo: Fechado'
    ],
  },
  { 
    id: 'demo-5', 
    name: 'Ateliê Paim & Design', 
    address: 'Rua Manuel Leiroz, 88 - Cidade Patriarca, São Paulo - SP', 
    lat: -23.5410, 
    lng: -46.5050, 
    rating: 4.9, 
    userRatingsTotal: 64,
    category: 'Outros',
    phoneNumber: '+55 11 2686-8800',
    priceLevel: 'R$ 40 - R$ 100 por pessoa',
    peakHours: 'Pico das 14h00 às 18h00',
    openingHours: [
      'segunda-feira: 09:00 – 18:00',
      'terça-feira: 09:00 – 18:00',
      'quarta-feira: 09:00 – 18:00',
      'quinta-feira: 09:00 – 18:00',
      'sexta-feira: 09:00 – 18:00',
      'sábado: 09:00 – 14:00',
      'domingo: Fechado'
    ],
  },
  { 
    id: 'demo-6', 
    name: 'Café Espresso Central', 
    address: 'Av. Paulista, 1200 - São Paulo', 
    lat: -23.5620, 
    lng: -46.6550, 
    rating: 4.7, 
    userRatingsTotal: 380,
    category: 'Cafeteria',
    phoneNumber: '+55 11 3285-1200',
    priceLevel: 'R$ 15 - R$ 40 por pessoa',
    peakHours: 'Pico das 08h00 às 10h00 e 15h00 às 17h00',
    openingHours: [
      'segunda-feira: 07:00 – 21:00',
      'terça-feira: 07:00 – 21:00',
      'quarta-feira: 07:00 – 21:00',
      'quinta-feira: 07:00 – 21:00',
      'sexta-feira: 07:00 – 21:30',
      'sábado: 08:00 – 20:00',
      'domingo: 08:30 – 19:00'
    ],
  },
  { 
    id: 'demo-7', 
    name: 'Restaurante Sabor Paulista', 
    address: 'Rua Augusta, 800 - São Paulo', 
    lat: -23.5540, 
    lng: -46.6610, 
    rating: 4.6, 
    userRatingsTotal: 520,
    category: 'Restaurante',
    phoneNumber: '+55 11 3255-0800',
    priceLevel: 'R$ 45 - R$ 90 por pessoa',
    peakHours: 'Pico das 12h00 às 14h30',
    openingHours: [
      'segunda-feira: 11:30 – 15:30, 18:30 – 23:00',
      'terça-feira: 11:30 – 15:30, 18:30 – 23:00',
      'quarta-feira: 11:30 – 15:30, 18:30 – 23:00',
      'quinta-feira: 11:30 – 15:30, 18:30 – 23:30',
      'sexta-feira: 11:30 – 15:30, 18:30 – 00:00',
      'sábado: 11:30 – 00:00',
      'domingo: 11:30 – 22:00'
    ],
  },
  { 
    id: 'demo-8', 
    name: 'Supermercado Dia & Noite', 
    address: 'Rua da Consolação, 1500 - São Paulo', 
    lat: -23.5510, 
    lng: -46.6590, 
    rating: 4.3, 
    userRatingsTotal: 340,
    category: 'Supermercado',
    phoneNumber: '+55 11 3120-1500',
    priceLevel: 'R$ 30 - R$ 80 por pessoa',
    peakHours: 'Pico das 17h30 às 20h00',
    openingHours: [
      'segunda-feira: 07:00 – 22:00',
      'terça-feira: 07:00 – 22:00',
      'quarta-feira: 07:00 – 22:00',
      'quinta-feira: 07:00 – 22:00',
      'sexta-feira: 07:00 – 22:30',
      'sábado: 07:00 – 22:30',
      'domingo: 08:00 – 20:00'
    ],
  },
  { 
    id: 'demo-9', 
    name: 'Padaria Pão Dourado', 
    address: 'Av. Brigadeiro Luís Antônio, 2000 - São Paulo', 
    lat: -23.5640, 
    lng: -46.6480, 
    rating: 4.9, 
    userRatingsTotal: 780,
    category: 'Padaria',
    phoneNumber: '+55 11 3288-2000',
    priceLevel: 'R$ 15 - R$ 40 por pessoa',
    peakHours: 'Pico das 07h00 às 09h30 e 17h00 às 19h00',
    openingHours: [
      'segunda-feira: 06:00 – 22:30',
      'terça-feira: 06:00 – 22:30',
      'quarta-feira: 06:00 – 22:30',
      'quinta-feira: 06:00 – 22:30',
      'sexta-feira: 06:00 – 23:00',
      'sábado: 06:00 – 23:00',
      'domingo: 06:30 – 22:00'
    ],
  },
  { 
    id: 'demo-10', 
    name: 'Shopping Center Paulista', 
    address: 'Pça. Honório Lessa, 100 - São Paulo', 
    lat: -23.5700, 
    lng: -46.6450, 
    rating: 4.5, 
    userRatingsTotal: 1890,
    category: 'Shopping',
    phoneNumber: '+55 11 3191-0100',
    priceLevel: 'R$ 50 - R$ 180 por pessoa',
    peakHours: 'Pico das 15h00 às 20h00',
    openingHours: [
      'segunda-feira: 10:00 – 22:00',
      'terça-feira: 10:00 – 22:00',
      'quarta-feira: 10:00 – 22:00',
      'quinta-feira: 10:00 – 22:00',
      'sexta-feira: 10:00 – 22:00',
      'sábado: 10:00 – 22:00',
      'domingo: 14:00 – 20:00'
    ],
  },
];

export function DemoMap({
  savedPlaces,
  searchQuery,
  userLocation,
  selectedCategoryFilter,
  onSelectPlaceToView,
  onMapClickToAdd,
  searchResults,
  focusLocationTrigger,
  onMapDragStart,
  onMapDoubleClick,
  onStreetViewChange,
  navigationTarget,
  onStopNavigation,
  isTrackingLocation,
  onLocateUser,
  resetNorthTrigger,
  onZoomChange,
  radarConfig,
  onOpenRadar,
  searchRadiusMeters = 1500,
}: DemoMapProps) {
  const [zoom, setZoom] = useState(19);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const hasDraggedFarRef = React.useRef(false);
  const initialPinchDistRef = React.useRef<number | null>(null);
  const initialPinchZoomRef = React.useRef<number>(19);
  const lastTapRef = React.useRef<number>(0);
  const lastProcessedFocusTimestampRef = React.useRef<number>(0);

  // Global mouse up / touch end listeners to guarantee dragging state is never stuck
  useEffect(() => {
    const handleGlobalRelease = () => {
      setIsDragging(false);
      initialPinchDistRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, []);

  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(zoom);
    }
  }, [zoom, onZoomChange]);

  useEffect(() => {
    if (navigationTarget) {
      setIsFollowing(true);
      setPanOffset({ x: 0, y: 0 });
      setZoom(18);
    }
  }, [navigationTarget]);

  useEffect(() => {
    if (resetNorthTrigger) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [resetNorthTrigger]);

  useEffect(() => {
    if (focusLocationTrigger && focusLocationTrigger.timestamp !== lastProcessedFocusTimestampRef.current) {
      lastProcessedFocusTimestampRef.current = focusLocationTrigger.timestamp;
      setIsFollowing(false);
      setPanOffset({ x: 0, y: 0 });
      if (focusLocationTrigger.zoom !== undefined) {
        setZoom(focusLocationTrigger.zoom);
      }
    }
  }, [focusLocationTrigger]);

  // Adjust zoom dynamically whenever searchRadiusMeters changes
  const prevRadiusRef = React.useRef<number>(searchRadiusMeters);
  useEffect(() => {
    if (prevRadiusRef.current !== searchRadiusMeters) {
      prevRadiusRef.current = searchRadiusMeters;
      const targetZoom = getZoomForRadius(searchRadiusMeters || 1500);
      setZoom(targetZoom);
    }
  }, [searchRadiusMeters]);

  const lastSearchQueryRef = React.useRef<string>('');
  useEffect(() => {
    if (!searchQuery) {
      lastSearchQueryRef.current = '';
      return;
    }
    const searchKey = `${searchQuery.trim().toLowerCase()}_${searchRadiusMeters}`;
    if (lastSearchQueryRef.current === searchKey) return;
    lastSearchQueryRef.current = searchKey;

    // Quando pesquisa um estabelecimento, afastar e enquadrar o zoom conforme o raio escolhido
    setIsFollowing(false);
    setPanOffset({ x: 0, y: 0 });
    const targetZoom = getZoomForRadius(searchRadiusMeters || 1500);
    setZoom(targetZoom);
  }, [searchQuery, searchRadiusMeters]);

  // Filter saved places
  const visibleSaved = savedPlaces.filter(
    (p) => selectedCategoryFilter === 'Todos' || p.category === selectedCategoryFilter
  );

  // Filter mock POIs by search query, radius and category filter

function getDynamicSearchPins(query: string, center: { lat: number; lng: number }, radiusMeters: number): MapPinType[] {
  const qLower = query.toLowerCase().trim();
  const qCapitalized = query.charAt(0).toUpperCase() + query.slice(1);
  const count = 8; // Generate up to 8 pins to make the map look beautifully populated!
  const pins: MapPinType[] = [];
  const radiusKm = radiusMeters / 1000;

  // Check query domain
  const isConstruction = 
    qLower.includes('constru') || 
    qLower.includes('material') || 
    qLower.includes('ferragem') || 
    qLower.includes('madeira') || 
    qLower.includes('tinta') || 
    qLower.includes('gesso') || 
    qLower.includes('cimento') || 
    qLower.includes('tijolo') || 
    qLower.includes('encanamento') || 
    qLower.includes('reforma') || 
    qLower.includes('ferramenta') || 
    qLower.includes('obra') ||
    qLower.includes('hidraul') ||
    qLower.includes('eletric');

  const isFood = 
    qLower.includes('restaurante') || 
    qLower.includes('comida') || 
    qLower.includes('almoço') || 
    qLower.includes('jantar') || 
    qLower.includes('pizz') || 
    qLower.includes('sushi') || 
    qLower.includes('burg') || 
    qLower.includes('lanche') || 
    qLower.includes('churras');

  const isBakery = 
    qLower.includes('padaria') || 
    qLower.includes('pão') || 
    qLower.includes('pao') || 
    qLower.includes('cafe') || 
    qLower.includes('café');

  const isPharmacy = 
    qLower.includes('farmacia') || 
    qLower.includes('farmácia') || 
    qLower.includes('drogaria') || 
    qLower.includes('remedio');

  const isAutomotive = 
    qLower.includes('oficina') || 
    qLower.includes('mecanic') || 
    qLower.includes('car ') || 
    qLower.includes('auto') || 
    qLower.includes('peça') || 
    qLower.includes('lava') || 
    qLower.includes('posto');

  // Realistic business datasets
  const constructionData = [
    { name: "Depósito de Materiais Silva & Filhos", desc: "Depósito completo com cimento, tijolo, areia, brita, ferro e materiais básicos do alicerce ao telhado.", photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3966-2244", cat: "Outros" },
    { name: "Ferragens e Ferramentas Casa Verde", desc: "Grande variedade de ferramentas elétricas, manuais, parafusos, fechaduras e ferragens em geral.", photo: "https://images.unsplash.com/photo-1530124560072-aae84ca2dd78?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3858-1515", cat: "Outros" },
    { name: "Tintas Premium & Acabamentos", desc: "Especialistas em tintas imobiliárias, vernizes, pincéis, solventes e preparação de cores personalizadas.", photo: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3951-8080", cat: "Outros" },
    { name: "Madeireira e Material de Construção Progresso", desc: "Tudo em madeiras brutas e aparelhadas, compensados, telhas e materiais pesados para cobertura.", photo: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3961-3030", cat: "Outros" },
    { name: "Hidráulica, Elétrica & Utilidades Central", desc: "Tubos e conexões de PVC, fios, cabos, disjuntores, tomadas e todo material hidráulico e elétrico.", photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3857-4545", cat: "Outros" },
    { name: "Cimento & Tijolo Distribuidora Baruel", desc: "Cimento CP-II, blocos de concreto, canaletas, tijolos baianos e materiais de alvenaria com entrega rápida.", photo: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3965-7070", cat: "Outros" },
    { name: "Gesso, Drywall e Decorações São Paulo", desc: "Placas de gesso, perfis de drywall, molduras, massas e ferramentas especiais para gesseiros e decoradores.", photo: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3855-6060", cat: "Outros" },
    { name: "Lojão da Reforma & Construção Inteligente", desc: "O maior estoque da região para reformas rápidas, pisos, revestimentos, argamassas e louças sanitárias.", photo: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3955-9090", cat: "Outros" }
  ];

  const foodData = [
    { name: "Churrascaria e Grelhados Pampa", desc: "Carnes nobres na brasa, buffet completo de saladas e pratos quentes em ambiente acolhedor.", photo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3289-4040", cat: "Restaurante" },
    { name: "Pizzaria Bella Itália", desc: "Pizzas artesanais assadas em forno a lenha, massas frescas e carta de vinhos selecionados.", photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3256-5050", cat: "Restaurante" },
    { name: "Sabor da Roça - Self Service", desc: "O melhor da comida caseira e mineira no fogão a lenha, variedade de pratos quentes e doces caseiros.", photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3120-6060", cat: "Restaurante" },
    { name: "Sushi House - Culinária Japonesa", desc: "Combinados frescos, temakis, sashimis, pratos quentes e rodízio completo em ambiente moderno.", photo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3259-7070", cat: "Restaurante" },
    { name: "Artesanal Burger & Fries", desc: "Hambúrgueres grelhados no fogo forte, batata frita rústica crocante e milkshakes artesanais deliciosos.", photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3150-8080", cat: "Restaurante" },
    { name: "Cantina di Napoli", desc: "Tradicional cantina italiana com rodízio de massas caseiras, lasanhas, canelones e galeto assado.", photo: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3123-9090", cat: "Restaurante" },
    { name: "Tacos & Beers Cocina Mexicana", desc: "Tacos crocantes, burritos recheados, quesadillas, margaritas e chopp gelado para happy hour.", photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3111-2020", cat: "Restaurante" },
    { name: "Restaurante Vegetariano Vida Verde", desc: "Pratos saudáveis, buffet de saladas orgânicas, sucos naturais e sobremesas sem açúcar.", photo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3222-3030", cat: "Restaurante" }
  ];

  const bakeryData = [
    { name: "Padaria Realeza da Casa Verde", desc: "Pães quentinhos a toda hora, confeitaria fina, salgados, cafés especiais e buffet de café da manhã completo.", photo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3966-1010", cat: "Padaria" },
    { name: "Café Gourmet Ponto Alto", desc: "Cafés espressos premiados, cappuccinos, bolos caseiros, pães de queijo e croissants recheados.", photo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3858-2020", cat: "Cafeteria" },
    { name: "Panificadora e Doceria Elite", desc: "Pão francês crocante, sonhos recheados, bolos de festa personalizados e salgados fritos na hora.", photo: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3951-3030", cat: "Padaria" },
    { name: "Empório do Pão Artesanal", desc: "Pães de fermentação natural (levain), baguetes tradicionais, croissants franceses e geleias orgânicas.", photo: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3961-4040", cat: "Padaria" }
  ];

  const pharmacyData = [
    { name: "Drogaria São Paulo Central", desc: "Medicamentos genéricos, perfumaria, higiene, dermocosméticos e atendimento farmacêutico personalizado.", photo: "https://images.unsplash.com/photo-1631549916768-4119b2e55c26?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3965-8080", cat: "Farmácia" },
    { name: "Farmácia de Manipulação BioFórmula", desc: "Manipulação precisa de receitas, cosméticos naturais, homeopatia e suplementação esportiva.", photo: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3855-9090", cat: "Farmácia" },
    { name: "Drogaria Mais Barata - Plantão 24h", desc: "Descontos imbatíveis em medicamentos contínuos, fraldas, leites infantis e perfumaria básica. Aberta 24 horas.", photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3955-1010", cat: "Farmácia" },
    { name: "Farmácia e Perfumaria Preço Justo", desc: "Medicamentos populares, testes rápidos, aferição de pressão e aplicação de injetáveis.", photo: "https://images.unsplash.com/photo-1587854692152-cbe660db0969?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3966-5050", cat: "Farmácia" }
  ];

  const automotiveData = [
    { name: "Centro Automotivo & Mecânica Baruel", desc: "Manutenção de motores, suspensão, freios, troca de óleo, alinhamento e balanceamento computadorizado.", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3966-3300", cat: "Automotivo" },
    { name: "Lava Rápido e Estética Car Brilho", desc: "Lavagem detalhada, higienização interna, polimento técnico, cristalização e revitalização de plásticos.", photo: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3857-4400", cat: "Automotivo" },
    { name: "Auto Peças & Baterias Casa Verde", desc: "Amplo estoque de peças nacionais e importadas, óleos, filtros, baterias automotivas e palhetas.", photo: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3951-5500", cat: "Automotivo" },
    { name: "Oficina de Escapamentos e Suspensão Rápida", desc: "Troca de amortecedores, escapamentos originais e esportivos, molas e diagnóstico de ruídos gratuitos.", photo: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&auto=format&fit=crop&q=80", phone: "+55 11 3961-6600", cat: "Automotivo" }
  ];

  // Pick dataset
  let dataset = [];
  if (isConstruction) dataset = constructionData;
  else if (isFood) dataset = foodData;
  else if (isBakery) dataset = bakeryData;
  else if (isPharmacy) dataset = pharmacyData;
  else if (isAutomotive) dataset = automotiveData;

  // Neighborhood and street lists for realistic address synthesization
  const neighborhoods = [
    "Vila Baruel, São Paulo - SP",
    "Casa Verde, São Paulo - SP",
    "Imirim, São Paulo - SP",
    "Santana, São Paulo - SP",
    "Jardim das Laranjeiras, São Paulo - SP",
    "Limão, São Paulo - SP"
  ];
  const streets = [
    "Av. Baruel",
    "R. Relíquia",
    "Av. Casa Verde",
    "R. Dr. César Castiglioni Júnior",
    "R. Alfredo Pujol",
    "Av. Imirim",
    "R. Voluntários da Pátria"
  ];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.15;
    const distOffset = (0.2 + (i * 0.14)) * Math.min(radiusKm, 1.8);
    const latDelta = (distOffset / 111.32) * Math.cos(angle);
    const lngDelta = (distOffset / (111.32 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
    
    const lat = center.lat + latDelta;
    const lng = center.lng + lngDelta;

    const hash = Math.abs(Math.floor((lat + lng) * 100000));
    
    let nameStr = "";
    let descStr = "";
    let photoStr = "";
    let phoneStr = "";
    let categoryStr: PlaceCategory = "Outros";

    if (dataset.length > 0) {
      const dataItem = dataset[i % dataset.length];
      nameStr = dataItem.name;
      descStr = dataItem.desc;
      photoStr = dataItem.photo;
      phoneStr = dataItem.phone;
      categoryStr = dataItem.cat;
    } else {
      // Fallback generic business generation
      const suffixes = ["Central", "Express", "Especializado", "Matriz", "Comércio & Serviços", "Fins & Reformas", "Premium", "Prático"];
      const suffix = suffixes[i % suffixes.length];
      nameStr = `${qCapitalized} ${suffix} ${i+1}`;
      descStr = `Estabelecimento especializado em ${query}. Produtos, materiais, atendimento profissional e entrega rápida.`;
      photoStr = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80";
      phoneStr = `+55 11 3${(i + 400)} ${(i + 6000)}-${(i + 3000)}`;
      categoryStr = "Outros";
    }

    const street = streets[(hash + i) % streets.length];
    const number = ((hash + i) % 850) + 42;
    const neighborhood = neighborhoods[(hash + i) % neighborhoods.length];
    const addressStr = `${street}, ${number} - ${neighborhood}`;

    pins.push({
      id: `dynamic-${qLower.replace(/\s+/g, "-")}-${i+1}`,
      name: nameStr,
      address: addressStr,
      lat,
      lng,
      category: categoryStr,
      rating: Number((4.4 + ((hash % 6) * 0.1)).toFixed(1)),
      userRatingsTotal: 30 + i * 28 + (hash % 120),
      priceLevel: isConstruction ? "R$ 40 - R$ 180 por produto/serviço" : "R$ 30 - R$ 75 por pessoa",
      phoneNumber: phoneStr,
      website: "https://maps.google.com",
      photoUrl: photoStr,
      description: descStr,
      openingHours: [
        "segunda-feira: 08:00 – 18:00",
        "terça-feira: 08:00 – 18:00",
        "quarta-feira: 08:00 – 18:00",
        "quinta-feira: 08:00 – 18:00",
        "sexta-feira: 08:00 – 18:00",
        "sábado: 08:00 – 14:00",
        "domingo: Fechado"
      ]
    });
  }
  return pins;
}
  let displayedPois = MOCK_POIS.filter(p => {
    const center = userLocation || { lat: -23.5505, lng: -46.6333 };
    const distKm = Math.hypot((p.lat - center.lat) * 111.32, (p.lng - center.lng) * 111.32 * Math.cos(center.lat * Math.PI / 180));
    const maxDistKm = (searchRadiusMeters || 1500) / 1000;

    const isCategoryQuery = searchQuery === selectedCategoryFilter;
    let matchesQuery = true;
    let isSpecificDirectNameMatch = false;

    if (searchQuery && !isCategoryQuery) {
      const q = searchQuery.toLowerCase().trim();
      const nameLower = p.name.toLowerCase();
      const catLower = (p.category || '').toLowerCase();
      const addressLower = p.address.toLowerCase();

      // Check if user is searching directly for a specific business name (e.g. "Avelinos Car", "El Tranvía", "Tacacá")
      if (nameLower.includes(q) || q.split(' ').some(word => word.length > 3 && nameLower.includes(word))) {
        isSpecificDirectNameMatch = true;
        matchesQuery = true;
      } else {
        const isGenericCategory = ['supermercado', 'mercado', 'posto', 'gasolina', 'bar', 'boteco', 'restaurante'].includes(q);
        if (isGenericCategory) {
          if (q.includes('supermercado') || q.includes('mercado')) {
            if (nameLower.includes('posto') || nameLower.includes('bar') || catLower.includes('posto') || catLower.includes('bar')) return false;
          }
          if (q.includes('posto') || q.includes('gasolina')) {
            if (nameLower.includes('supermercado') || nameLower.includes('bar') || catLower.includes('supermercado') || catLower.includes('bar')) return false;
          }
          if (q.includes('bar')) {
            if (nameLower.includes('supermercado') || nameLower.includes('posto') || catLower.includes('supermercado') || catLower.includes('posto')) return false;
          }
        }

        const isBoateSearch = q.includes('boate') || q.includes('balada') || q.includes('club') || q.includes('noturn');
        if (isBoateSearch && p.category === 'Boate') {
          matchesQuery = true;
        } else {
          matchesQuery = nameLower.includes(q) || addressLower.includes(q) || catLower.includes(q);
        }
      }
    }

    // Direct business searches can be found across the city, broad categories respect radius
    if (!isSpecificDirectNameMatch && distKm > maxDistKm) {
      return false;
    }

    const matchesCategory = selectedCategoryFilter === 'Todos' || p.category === selectedCategoryFilter;
    return matchesQuery && matchesCategory;
  });

  if (searchQuery && selectedCategoryFilter === 'Todos' && displayedPois.length === 0) {
    const center = userLocation || { lat: -23.5505, lng: -46.6333 };
    displayedPois = getDynamicSearchPins(searchQuery, center, searchRadiusMeters || 1500);
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsFollowing(false);
    hasDraggedFarRef.current = false;
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    onMapDragStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    if (Math.abs(newX - panOffset.x) > 4 || Math.abs(newY - panOffset.y) > 4) {
      hasDraggedFarRef.current = true;
    }
    setPanOffset({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoom;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        setZoom((z) => Math.min(z + 1, 21));
      }
      lastTapRef.current = now;
      setIsDragging(true);
      setIsFollowing(false);
      hasDraggedFarRef.current = false;
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
      onMapDragStart?.();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current;
      const zoomDelta = Math.round(Math.log2(ratio));
      const nextZoom = Math.max(3, Math.min(21, initialPinchZoomRef.current + zoomDelta));
      setZoom(nextZoom);
    } else if (isDragging && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      if (Math.abs(newX - panOffset.x) > 4 || Math.abs(newY - panOffset.y) > 4) {
        hasDraggedFarRef.current = true;
      }
      setPanOffset({
        x: newX,
        y: newY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (hasDraggedFarRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;
    
    const lat = -23.5505 - clickY * 0.00005;
    const lng = -46.6333 + clickX * 0.00005;

    onMapClickToAdd({ lat, lng });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 1, 21));
    } else {
      setZoom((z) => Math.max(z - 1, 3));
    }
  };

  return (
    <div 
      className="w-full h-screen relative bg-slate-200 overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleMapClick}
      onDoubleClick={onMapDoubleClick}
      onWheel={handleWheel}
    >
      {/* Interactive Grid Background mimicking a map */}
      <div 
        className={`absolute inset-[-50%] w-[200%] h-[200%] opacity-80 pointer-events-none ${isDragging ? 'transition-none' : 'transition-transform duration-100 ease-out'}`}
        style={{
          backgroundImage: `
            linear-gradient(to right, #cbd5e1 1px, transparent 1px),
            linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
          `,
          backgroundSize: `${40 * (zoom / 14)}px ${40 * (zoom / 14)}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <div className="absolute top-1/4 left-1/3 w-64 h-48 bg-emerald-100/60 rounded-3xl blur-sm" />
        <div className="absolute top-1/2 right-1/4 w-96 h-32 bg-blue-100/50 rounded-full rotate-12 blur-sm" />
      </div>

      {/* Demo Mode Notice Banner */}
      <div className="absolute top-24 left-4 z-10 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto border border-amber-400 text-xs sm:text-sm">
        <Compass className="w-4 h-4 animate-spin" />
        <span>Modo Demonstração Interativo Ativo (Adicione sua chave de API do Google Maps nas configurações para usar o mapa real)</span>
      </div>

      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isDragging ? 'transition-none' : 'transition-transform duration-200 ease-out'}`}
        style={{ 
          transform: isFollowing ? `translate(${panOffset.x}px, ${panOffset.y}px) perspective(1000px) rotateX(30deg) scale(1.1)` : `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformStyle: isFollowing ? 'preserve-3d' : 'flat'
        }}
      >
        {userLocation && (
          <div 
            className="absolute z-25 pointer-events-auto cursor-pointer flex items-center justify-center"
            style={{ transform: `translate(-20px, -20px)` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlaceToView({
                name: 'Sua Localização Atual (GPS)',
                address: 'Coordenadas obtidas via geolocalização',
                lat: userLocation.lat,
                lng: userLocation.lng,
              });
            }}
          >
            {/* Radius circle representation (Radar or Search Radius) */}
            <div 
              className={`absolute rounded-full pointer-events-none transition-all ${
                radarConfig?.isActive
                  ? 'border-2 border-emerald-500 bg-emerald-500/15 shadow-2xl shadow-emerald-500/20'
                  : 'border border-blue-500/50 bg-blue-500/10'
              }`}
              style={{ 
                width: `${Math.max(zoom * 12 * ((radarConfig?.isActive ? (radarConfig.radiusMeters || 1000) : (searchRadiusMeters || 1500)) / 1000), 80)}px`, 
                height: `${Math.max(zoom * 12 * ((radarConfig?.isActive ? (radarConfig.radiusMeters || 1000) : (searchRadiusMeters || 1500)) / 1000), 80)}px`,
                transform: 'translate(-50%, -50%)',
                left: '20px',
                top: '20px',
              }}
            >
              {radarConfig?.isActive && (
                <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-30" />
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-emerald-500/40 rounded-full animate-ping" />
              <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
                <div className="w-3 h-3 bg-white rounded-full -rotate-45 shadow-inner" />
              </div>
            </div>
          </div>
        )}

        {visibleSaved.map((place, idx) => {
          const offsetX = (idx * 65 - 120);
          const offsetY = ((idx % 2 === 0 ? 1 : -1) * 75);
          return (
            <div
              key={`demo-saved-${place.id}`}
              className="absolute z-20 pointer-events-auto cursor-pointer group"
              style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlaceToView(place);
              }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg border-2 border-white whitespace-nowrap mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span>{place.name}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white transform group-hover:scale-125 transition-transform relative">
                  <Star className="w-5 h-5 fill-white text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border border-white flex items-center justify-center shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-white text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {displayedPois.map((poi, idx) => {
          const offsetX = (idx * 90 - 180);
          const offsetY = ((idx % 2 === 0 ? -1 : 1) * 110);
          return (
            <div
              key={`demo-poi-${poi.id}`}
              className="absolute z-15 pointer-events-auto cursor-pointer group"
              style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlaceToView(poi);
              }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-slate-900/90 text-white px-2 py-0.5 rounded-md text-[11px] font-medium shadow border border-slate-700 whitespace-nowrap mb-1">
                  {poi.name}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white transform group-hover:scale-125 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Top Route Instructions Card */}
      {navigationTarget && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50 pointer-events-auto transition-all animate-slideDown">
          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <Navigation className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    250 m • Siga em frente
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isFollowing && (
                      <button
                        onClick={() => {
                          setIsFollowing(true);
                          setPanOffset({ x: 0, y: 0 });
                          setZoom(18);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded-md font-semibold transition-all text-[11px] flex items-center gap-1 shadow-sm"
                        title="Centralizar mapa"
                      >
                        <LocateFixed className="w-3 h-3" />
                        <span>Centralizar</span>
                      </button>
                    )}
                    {onStopNavigation && (
                      <button 
                        onClick={onStopNavigation}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-lg transition-colors text-xs font-semibold"
                        title="Encerrar navegação"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 mt-0.5">
                  Continue em direção ao destino selecionado
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">5 min</span>
                <span>•</span>
                <span>1.4 km restantes</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {isFollowing ? 'Navegação Ativa' : 'Modo livre (zoom/pan)'}
              </span>
            </div>
          </div>
        </div>
      )}





      {/* Zoom and Tempo Real Controls at bottom-right */}
      <div className="absolute right-3 bottom-6 sm:right-4 sm:bottom-8 z-20 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
        <button
          onClick={() => {
            const nextVal = !isFollowing;
            setIsFollowing(nextVal);
            if (nextVal) {
              setPanOffset({ x: 0, y: 0 });
              if (onLocateUser) onLocateUser();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm active:scale-95 transition-all cursor-pointer ${
            (isFollowing || radarConfig?.isActive) 
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25 ring-2 ring-emerald-400/50' 
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
          }`}
          title="Alternar modo Tempo Real (GPS dinâmico)"
          aria-label="Ativar modo Tempo Real"
        >
          <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${(isFollowing || radarConfig?.isActive) ? 'animate-spin text-white' : 'text-blue-600'}`} style={{ animationDuration: (isFollowing || radarConfig?.isActive) ? '6s' : '0s' }} />
          <span>{(isFollowing || radarConfig?.isActive) ? 'Tempo Real: Ativo' : 'Tempo Real: Fixo'}</span>
        </button>

        <button
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            if (onLocateUser) onLocateUser();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm active:scale-95 transition-all bg-white/95 text-slate-700 border-slate-200 hover:bg-white cursor-pointer"
          title="Centralizar na localização atual (zoom livre)"
          aria-label="Centralizar na localização atual"
        >
          <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          <span>Localizar</span>
        </button>

        <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/90 overflow-hidden">
          <button
            onClick={() => setZoom(z => Math.min(21, z + 1))}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 text-slate-700 font-bold text-lg sm:text-xl border-b border-slate-200 active:bg-slate-200 transition-all cursor-pointer select-none"
            title="Aproximar Zoom (+)"
            aria-label="Aproximar Zoom"
          >
            +
          </button>
          <button
            onClick={() => setZoom(z => Math.max(3, z - 1))}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 text-slate-700 font-bold text-lg sm:text-xl active:bg-slate-200 transition-all cursor-pointer select-none"
            title="Afastar Zoom (-)"
            aria-label="Afastar Zoom"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
