export type PlaceCategory = string;

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  placeId?: string;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  photoUrl?: string;
  notes?: string;
  openingHours?: string[];
  priceLevel?: string; // Ex: '$$', 'Moderado'
  peakHours?: string; // Ex: 'Pico das 12h às 14h'
  googleMapsUri?: string;
  customPhotos?: string[];
  createdAt: string;
  description?: string;
}

export interface MapPin {
  id: string;
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
  category?: PlaceCategory;
  openingHours?: string[];
  priceLevel?: string;
  peakHours?: string;
  googleMapsUri?: string;
  description?: string;
}

export interface RadarAlert {
  id: string;
  place: MapPin;
  distanceMeters: number;
  matchedKeyword: string;
  detectedAt: number;
}

export interface RadarConfig {
  isActive: boolean;
  keyword: string; // e.g. "Comida Mexicana", "Maniçoba"
  radiusMeters: number; // default 1000m (1 km)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}


