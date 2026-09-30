import React, { Component, ReactNode, useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Polyline } from './Polyline';
import { motion, AnimatePresence } from 'motion/react';
import { ApiKeySplash } from './ApiKeySplash';
import { DemoMap } from './DemoMap';
import { SavedPlace, MapPin as MapPinType, PlaceCategory, RadarConfig, getZoomForRadius } from '../types';
import { getPlacePhoto } from '../utils/photoUtils';
import { useCachedPhoto } from '../utils/photoCache';
import { Star, MapPin as PinIcon, Navigation, Bookmark, ExternalLink, X, Volume2, VolumeX, CornerUpLeft, CornerUpRight, ArrowUp, Compass, LocateFixed, Plus, Minus, Radio, RefreshCw, List, RotateCcw, RotateCw } from 'lucide-react';
import { getDefaultOpeningHoursForCategory } from '../utils/openingHours';

export const DEFAULT_GOOGLE_MAPS_KEY = 'AIzaSyAIJinnkUYTK9D-JfUkvUci-c2vDOVaQDo';

export const getActiveGoogleMapsKey = (): string => {
  try {
    const saved = localStorage.getItem('user_custom_maps_api_key');
    if (saved && saved.trim().length > 10) return saved.trim();
  } catch (e) {}
  return (
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    DEFAULT_GOOGLE_MAPS_KEY
  );
};

export const isGoogleMapsConfigured = (): boolean => {
  const k = getActiveGoogleMapsKey();
  return Boolean(k) && k !== 'YOUR_API_KEY';
};

interface MapComponentProps {
  savedPlaces: SavedPlace[];
  searchQuery: string;
  userLocation: { lat: number; lng: number; heading?: number | null } | null;
  mapHeading?: number;
  isTrackingLocation?: boolean;
  onLocateUser?: () => void;
  selectedCategoryFilter: PlaceCategory | 'Todos';
  onSelectPlaceToView: (placeData: {
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
    priceLevel?: string;
    openingHours?: string[];
    googleMapsUri?: string;
    description?: string;
  }) => void;
  activeSelectedPlace: SavedPlace | MapPinType | null;
  onClearActiveSelect: () => void;
  onMapClickToAdd: (latLng: { lat: number; lng: number; exactAddress?: string }) => void;
  searchResults: MapPinType[];
  onSearchResultsUpdate: (results: MapPinType[]) => void;
  isDemoMode: boolean;
  onEnableDemo: () => void;
  focusLocationTrigger?: { lat: number; lng: number; zoom?: number; timestamp: number } | null;
  pendingPin?: { lat: number; lng: number } | null;
  onPendingPinDragEnd?: (latLng: { lat: number; lng: number }) => void;
  onMapDragStart?: () => void;
  onMapDoubleClick?: () => void;
  onStreetViewChange?: (isActive: boolean) => void;
  navigationTarget?: { lat: number; lng: number } | null;
  onStopNavigation?: () => void;
  resetNorthTrigger?: number;
  onMapHeadingChange?: (heading: number) => void;
  onRecenter?: () => void;
  onZoomChange?: (zoom: number) => void;
  radarConfig?: RadarConfig;
  onOpenRadar?: () => void;
  searchRadiusMeters?: number;
  showToast?: (message: string) => void;
  isPinningMode?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Padaria': '#f59e0b',     // amber
  'Restaurante': '#ef4444', // red
  'Cafeteria': '#84cc16',   // lime
  'Supermercado': '#3b82f6', // blue
  'Farmácia': '#10b981',    // emerald
  'Shopping': '#8b5cf6',    // purple
  'Boate': '#ec4899',       // pink
  'Automotivo': '#2563eb',  // royal blue
  'Outros': '#64748b',      // slate
};

const getManeuverIcon = (maneuver?: string, instructions?: string) => {
  const text = ((maneuver || '') + ' ' + (instructions || '')).toLowerCase();
  if (text.includes('left') || text.includes('esquerda')) {
    return <CornerUpLeft className="w-6 h-6 text-white" />;
  }
  if (text.includes('right') || text.includes('direita')) {
    return <CornerUpRight className="w-6 h-6 text-white" />;
  }
  if (text.includes('u-turn') || text.includes('retorno')) {
    return <CornerUpLeft className="w-6 h-6 text-white rotate-90" />;
  }
  return <ArrowUp className="w-6 h-6 text-white" />;
};

// Helper function to disperse overlapping markers slightly so every pin is distinct and clickable
const getOffsetForPlace = (lat: number, lng: number, allPlaces: Array<{ lat: number; lng: number }>, index: number) => {
  const cluster = allPlaces.filter((p) => Math.abs(p.lat - lat) < 0.00025 && Math.abs(p.lng - lng) < 0.00025);
  if (cluster.length <= 1) return { lat, lng };
  
  const clusterIndex = cluster.findIndex(p => Math.abs(p.lat - lat) < 0.00003 && Math.abs(p.lng - lng) < 0.00003);
  const activeIdx = clusterIndex >= 0 ? clusterIndex : index % cluster.length;
  
  const angle = (activeIdx / cluster.length) * 2 * Math.PI;
  const radiusOffset = 0.00024; // ~24 meters
  return {
    lat: lat + Math.sin(angle) * radiusOffset,
    lng: lng + Math.cos(angle) * (radiusOffset * 1.1),
  };
};

const getCategorySvgIcon = (category?: string, title?: string, isSaved?: boolean) => {
  if (isSaved) {
    return <path d="M17 9.5L18.8 13.2L23 13.8L20 16.7L20.7 20.8L17 18.8L13.3 20.8L14 16.7L11 13.8L15.2 13.2L17 9.5Z" fill="#ffffff" />;
  }

  const cat = (category || "").toLowerCase();
  const name = (title || "").toLowerCase();

  // Padaria / Bakery
  if (cat.includes("padaria") || name.includes("padaria") || name.includes("pao") || name.includes("confeitaria") || name.includes("panificadora")) {
    return (
      <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(8.5, 7.5) scale(0.72)">
        <path d="M2 12a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="#ffffff" fillOpacity="0.25"/>
        <path d="M7 8l2 6M12 8l1 6M17 8l-1 6"/>
      </g>
    );
  }

  // Restaurante / Food
  if (cat.includes("restaurante") || name.includes("restaurante") || name.includes("bar ") || name.includes("grill") || name.includes("sushi") || name.includes("pizz")) {
    return (
      <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(8.5, 7.5) scale(0.72)">
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v18M6 2v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M8 12v8" />
      </g>
    );
  }

  // Cafeteria / Coffee
  if (cat.includes("cafe") || name.includes("cafe") || name.includes("espresso") || name.includes("starbucks")) {
    return (
      <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(8.5, 7.5) scale(0.72)">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
      </g>
    );
  }

  // Farmacia / Drogaria
  if (cat.includes("farmacia") || name.includes("farmacia") || name.includes("drogaria") || name.includes("saude") || name.includes("remedio")) {
    return (
      <g fill="#ffffff" transform="translate(10.5, 9.5) scale(0.55)">
        <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
      </g>
    );
  }

  // Supermercado / Shopping
  if (cat.includes("mercado") || cat.includes("shopping") || name.includes("mercado") || name.includes("supermercado") || name.includes("shopping")) {
    return (
      <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(8.5, 7.5) scale(0.72)">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
      </g>
    );
  }

  // Automotivo / Oficina
  if (cat.includes("auto") || name.includes("auto") || name.includes("posto") || name.includes("mecanic") || name.includes("pneu")) {
    return (
      <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(8.5, 7.5) scale(0.72)">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </g>
    );
  }

  // Default Pin Point icon
  return (
    <g fill="#ffffff" transform="translate(10.5, 9.5) scale(0.55)">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </g>
  );
};

const ThinPin = ({ color, isSaved, title, photoUrl, coords, category }: { color?: string; isSaved?: boolean; title?: string; photoUrl?: string; coords?: { lat: number, lng: number }; category?: string }) => {
  const pinColor = isSaved ? '#f59e0b' : (color || '#2563eb');
  const rawPhoto = getPlacePhoto(title, photoUrl, coords);
  const { src: cachedPhoto } = useCachedPhoto(rawPhoto);
  const [imgError, setImgError] = useState(false);
  const displayPhoto = (!imgError && cachedPhoto) ? cachedPhoto : undefined;
  
  return (
    <div 
      className="relative group cursor-pointer transform hover:scale-125 active:scale-95 transition-transform origin-bottom flex flex-col items-center select-none" 
      style={{ filter: 'drop-shadow(0px 6px 12px rgba(0,0,0,0.42))' }}
    >
      {/* Crisp Hover / Tap Tooltip Badge with full name */}
      {title && (
        <div className="absolute -top-9 px-2.5 py-1 bg-slate-900/95 text-white rounded-lg text-xs font-bold shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-1.5 backdrop-blur-xs">
          {isSaved && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
          <span>{title}</span>
        </div>
      )}

      <div className="relative flex flex-col items-center">
        {/* Needle Stem & Shadow Structure */}
        <div className="relative w-10 h-13 flex flex-col items-center">
          {/* Photo or Category Circle Head */}
          <div 
            className="w-10 h-10 rounded-full border-[2.5px] bg-white flex items-center justify-center overflow-hidden shadow-md relative z-10"
            style={{ borderColor: pinColor }}
          >
            {displayPhoto ? (
              <img 
                src={displayPhoto} 
                alt={title || ""} 
                className="w-full h-full object-cover rounded-full"
                onError={() => setImgError(true)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-white"
                style={{ backgroundColor: pinColor }}
              >
                <svg width="22" height="22" viewBox="0 0 34 46" fill="none" className="w-5 h-5">
                  {getCategorySvgIcon(category, title, isSaved)}
                </svg>
              </div>
            )}
          </div>

          {/* Stem needle */}
          <div className="w-1 h-3 -mt-0.5 bg-gradient-to-b from-slate-300 via-slate-500 to-slate-700 rounded-b shadow-sm z-0" />
          {/* Ground Contact Shadow */}
          <div className="w-3.5 h-1 bg-black/40 rounded-full blur-[0.5px] -mt-0.5" />
        </div>

        {/* Saved Star Badge */}
        {isSaved && (
          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-400 rounded-full border-1.5 border-white flex items-center justify-center shadow-md z-20">
            <Star className="w-2.5 h-2.5 fill-slate-900 text-slate-900" />
          </div>
        )}
      </div>
    </div>
  );
};

function InnerMapController({
  userLocation,
  searchQuery,
  searchResults,
  onSearchResultsUpdate,
  savedPlaces,
  selectedCategoryFilter,
  onSelectPlaceToView,
  activeSelectedPlace,
  onMapClickToAdd,
  onClearActiveSelect,
  focusLocationTrigger,
  pendingPin,
  onPendingPinDragEnd,
  onMapDragStart,
  onMapDoubleClick,
  onStreetViewChange,
  mapHeading,
  isTrackingLocation,
  onLocateUser,
  navigationTarget,
  onStopNavigation,
  resetNorthTrigger,
  onMapHeadingChange,
  onRecenter,
  onZoomChange,
  radarConfig,
  onOpenRadar,
  searchRadiusMeters = 1500,
  showToast,
  isPinningMode = false,
}: MapComponentProps & {
  navigationTarget?: { lat: number; lng: number } | null;
  onStopNavigation?: () => void;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const [currentStreetName, setCurrentStreetName] = useState<string | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState(false);

  // Sync scanning state with search execution or radar activity
  useEffect(() => {
    const timer = setInterval(() => {
      const active = isExecutingSearchRef.current || (radarConfig?.isActive ?? false);
      if (active !== isScanning) {
        setIsScanning(active);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [isScanning, radarConfig?.isActive]);

  // Static map mode (no automatic rotation or auto-following)
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);

  // Draw radius circle around exact user location (Radar mode or dynamic search radius)
  useEffect(() => {
    if (!map || !mapsLib || !userLocation) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
      return;
    }

    const center = { lat: userLocation.lat, lng: userLocation.lng };
    const isRadar = radarConfig?.isActive;
    const circleRadius = isRadar ? (radarConfig.radiusMeters || 1000) : searchRadiusMeters;
    const strokeColor = isRadar ? '#059669' : '#2563EB';
    const fillColor = isRadar ? '#10b981' : '#3B82F6';
    const fillOpacity = isRadar ? 0.14 : 0.08;

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = new mapsLib.Circle({
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: isRadar ? 2.5 : 1.5,
        fillColor,
        fillOpacity,
        map: map,
        center: center,
        radius: circleRadius,
        clickable: false,
        zIndex: 1,
      });
    } else {
      radiusCircleRef.current.setCenter(center);
      radiusCircleRef.current.setRadius(circleRadius);
      radiusCircleRef.current.setOptions({
        strokeColor,
        fillColor,
        fillOpacity,
        strokeWeight: isRadar ? 2.5 : 1.5,
      });
      radiusCircleRef.current.setMap(map);
    }

    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
    };
  }, [map, mapsLib, userLocation?.lat, userLocation?.lng, radarConfig?.isActive, radarConfig?.radiusMeters, searchRadiusMeters]);

  // Adjust map viewport and zoom automatically whenever searchRadiusMeters is changed
  const prevSearchRadiusRef = useRef<number>(searchRadiusMeters);
  useEffect(() => {
    if (!map) return;
    if (prevSearchRadiusRef.current !== searchRadiusMeters) {
      prevSearchRadiusRef.current = searchRadiusMeters;

      const centerCoords = userLocation 
        ? { lat: userLocation.lat, lng: userLocation.lng } 
        : (map.getCenter() ? { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() } : { lat: -23.5505, lng: -46.6333 });

      const targetZoom = getZoomForRadius(searchRadiusMeters || 1500);
      safePanTo(centerCoords);
      map.setZoom(targetZoom);
    }
  }, [searchRadiusMeters, map, userLocation]);

  // Keep following mode active when radar is on or tracking is requested
  useEffect(() => {
    if (radarConfig?.isActive || isTrackingLocation) {
      setIsFollowingUser(true);
      if (map && userLocation) {
        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      }
    }
  }, [radarConfig?.isActive, isTrackingLocation, map, userLocation?.lat, userLocation?.lng]);

  // Reset to following mode when navigation target starts
  useEffect(() => {
    if (navigationTarget) {
      setIsFollowingUser(true);
    }
  }, [navigationTarget]);

  const handleRecenter = () => {
    setIsFollowingUser(true);
    if (onRecenter) onRecenter();
    if (!map) return;

    // Center immediately to current known user position or navigation target
    const currentPos = userLocation || (navigationTarget ? { lat: navigationTarget.lat, lng: navigationTarget.lng } : null);
    if (currentPos) {
      map.setCenter({ lat: currentPos.lat, lng: currentPos.lng });
    }
    if (userLocation && navigationTarget) {
      const dist = getDistance(userLocation, navigationTarget);
      map.setZoom(getNavigationZoomByDistance(dist));
    } else {
      map.setZoom(17);
    }
    if (userLocation?.heading) {
      map.setHeading(userLocation.heading);
    }
    map.setTilt(45);

    // Query live real-time GPS position from device hardware to ensure exact real coordinates
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const realLat = pos.coords.latitude;
          const realLng = pos.coords.longitude;

          map.panTo({ lat: realLat, lng: realLng });
          if (navigationTarget) {
            const dist = getDistance({ lat: realLat, lng: realLng }, navigationTarget);
            map.setZoom(getNavigationZoomByDistance(dist));
          } else {
            map.setZoom(17);
          }
          if (pos.coords.heading) {
            map.setHeading(pos.coords.heading);
          }
          map.setTilt(45);
        },
        (err) => console.warn('Could not query direct GPS in handleRecenter:', err),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  };

  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  // Turn by turn navigation state
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const lastSpokenStepRef = useRef<number>(-1);
  const isRoutingInProgressRef = useRef(false);
  const lastRecalculateTimeRef = useRef<number>(0);

  // Helper function to strip HTML from directions
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Helper for coordinates distance
  function getDistance(p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) {
    const R = 6371e3;
    const φ1 = p1.lat * Math.PI/180;
    const φ2 = p2.lat * Math.PI/180;
    const Δφ = (p2.lat-p1.lat) * Math.PI/180;
    const Δλ = (p2.lng-p1.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Helper for perpendicular distance to route line segment (meters)
  function getDistanceToSegmentMeters(
    p: { lat: number; lng: number },
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    const latMid = ((a.lat + b.lat + p.lat) / 3) * (Math.PI / 180);
    const mPerLat = 111132;
    const mPerLng = 111320 * Math.cos(latMid);

    const px = (p.lng - a.lng) * mPerLng;
    const py = (p.lat - a.lat) * mPerLat;
    const bx = (b.lng - a.lng) * mPerLng;
    const by = (b.lat - a.lat) * mPerLat;

    const segLenSq = bx * bx + by * by;
    if (segLenSq === 0) {
      return Math.hypot(px, py);
    }

    const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
    const projX = t * bx;
    const projY = t * by;

    return Math.hypot(px - projX, py - projY);
  }

  // Calculate true minimum perpendicular distance from user to route path segments
  function getMinDistanceToRoutePath(
    user: { lat: number; lng: number },
    path: google.maps.LatLng[]
  ): number {
    if (!path || path.length === 0) return Infinity;
    if (path.length === 1) {
      return getDistance(user, { lat: path[0].lat(), lng: path[0].lng() });
    }

    let min = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = { lat: path[i].lat(), lng: path[i].lng() };
      const p2 = { lat: path[i + 1].lat(), lng: path[i + 1].lng() };
      const d = getDistanceToSegmentMeters(user, p1, p2);
      if (d < min) {
        min = d;
        if (min < 3) return min; // If within 3m of road center, user is perfectly on route
      }
    }
    return min;
  }

  // Dynamic zoom based on approach distance to destination (18, 19, 20)
  function getNavigationZoomByDistance(distanceMeters: number): number {
    if (distanceMeters <= 100) {
      return 20; // Chegada / muito próximo
    } else if (distanceMeters <= 400) {
      return 19; // Aproximação média
    } else {
      return 18; // Distância maior
    }
  }

  // Initialize directions service & renderer
  useEffect(() => {
    if (!routesLib || !map) return;
    if (!directionsService) setDirectionsService(new routesLib.DirectionsService());
    if (!directionsRenderer) {
      setDirectionsRenderer(new routesLib.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1d4ed8',
          strokeWeight: 10,
          strokeOpacity: 0.9,
          zIndex: 50
        }
      }));
    }
  }, [routesLib, map, directionsService, directionsRenderer]);

  const lastRoutedTargetRef = useRef<{lat: number, lng: number} | null>(null);

  // Handle routing with fast, low-threshold off-route recalculation
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!navigationTarget || !userLocation) {
      directionsRenderer.setDirections({ routes: [] });
      setDirectionsResult(null);
      lastRoutedTargetRef.current = null;
      setIsRecalculating(false);
      isRoutingInProgressRef.current = false;
      return;
    }

    // Check if target changed
    const targetChanged = (
      !lastRoutedTargetRef.current || 
      lastRoutedTargetRef.current.lat !== navigationTarget.lat || 
      lastRoutedTargetRef.current.lng !== navigationTarget.lng
    );

    // Precise segment-based off-route detection (threshold reduced to 16 meters for ultra-fast recalculation)
    let isOffRoute = false;
    if (directionsResult && directionsResult.routes[0]?.overview_path) {
      const path = directionsResult.routes[0].overview_path;
      const minSegmentDistance = getMinDistanceToRoutePath(userLocation, path);
      
      // If user is more than 16m away from the road polyline, trigger fast recalculation
      if (minSegmentDistance > 16) {
        isOffRoute = true;
      }
    }

    if (!targetChanged && !isOffRoute && directionsResult) {
      return;
    }

    // Avoid duplicate concurrent routing requests or flooding (cooldown: 1200ms)
    const now = Date.now();
    if (isRoutingInProgressRef.current && (now - lastRecalculateTimeRef.current < 4000)) {
      return;
    }
    if (!targetChanged && (now - lastRecalculateTimeRef.current < 1200)) {
      return;
    }

    lastRecalculateTimeRef.current = now;
    isRoutingInProgressRef.current = true;
    lastRoutedTargetRef.current = { lat: navigationTarget.lat, lng: navigationTarget.lng };

    if (isOffRoute) {
      setIsRecalculating(true);
      if (voiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const recalcUtterance = new SpeechSynthesisUtterance("Recalculando rota...");
        recalcUtterance.lang = 'pt-BR';
        recalcUtterance.rate = 1.1; // slightly faster for quick responsiveness
        window.speechSynthesis.speak(recalcUtterance);
      }
    }

    directionsService.route({
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { lat: navigationTarget.lat, lng: navigationTarget.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    }).then(response => {
      directionsRenderer.setDirections(response);
      setDirectionsResult(response);
      setCurrentStepIndex(0);
      lastSpokenStepRef.current = -1;
      setIsRecalculating(false);
      isRoutingInProgressRef.current = false;
    }).catch(e => {
      console.error("Routing error:", e);
      lastRoutedTargetRef.current = null; // allow retry
      setIsRecalculating(false);
      isRoutingInProgressRef.current = false;
      
      // Fallback: Try OSRM street routing if Google API is denied (billing issues)
      const errorStr = String(e).toUpperCase();
      if (errorStr.includes('REQUEST_DENIED') || errorStr.includes('BILLING') || errorStr.includes('NOT ALLOWED')) {
        const fetchOsrmRoute = async () => {
          try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${navigationTarget.lng},${navigationTarget.lat}?overview=full&geometries=geojson`);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes[0]) {
              const route = data.routes[0];
              const streetPath = route.geometry.coordinates.map((coord: [number, number]) => 
                new google.maps.LatLng(coord[1], coord[0])
              );
              
              const mockResponse: any = {
                routes: [{
                  legs: [{
                    distance: { text: (route.distance / 1000).toFixed(1) + " km", value: route.distance },
                    duration: { text: Math.ceil(route.duration / 60) + " min", value: route.duration },
                    steps: [{
                      instructions: "Siga o traçado das ruas (Navegação via OSRM - Use Google Maps externo para voz curva a curva)",
                      distance: { text: (route.distance / 1000).toFixed(1) + " km" },
                      duration: { text: Math.ceil(route.duration / 60) + " min" },
                      maneuver: "straight",
                      start_location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
                      end_location: new google.maps.LatLng(navigationTarget.lat, navigationTarget.lng),
                      polyline: null 
                    }],
                    start_location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
                    end_location: new google.maps.LatLng(navigationTarget.lat, navigationTarget.lng)
                  }],
                  overview_path: streetPath,
                  bounds: new google.maps.LatLngBounds(
                    new google.maps.LatLng(Math.min(userLocation.lat, navigationTarget.lat), Math.min(userLocation.lng, navigationTarget.lng)),
                    new google.maps.LatLng(Math.max(userLocation.lat, navigationTarget.lat), Math.max(userLocation.lng, navigationTarget.lng))
                  )
                }]
              };
              
              setDirectionsResult(mockResponse);
              directionsRenderer.setDirections({ routes: [] } as any);
              if (showToast) showToast('Rota pelas ruas carregada via serviço de backup');
              return;
            }
          } catch (osrmError) {
            console.error("OSRM fallback failed:", osrmError);
          }
          
          // Final fallback to straight line if OSRM also fails
          const straightLinePath = [
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(navigationTarget.lat, navigationTarget.lng)
          ];
          
          const mockResponse: any = {
            routes: [{
              legs: [{
                distance: { text: (getDistance(userLocation, navigationTarget) / 1000).toFixed(1) + " km", value: getDistance(userLocation, navigationTarget) },
                duration: { text: Math.ceil(getDistance(userLocation, navigationTarget) / 500) + " min", value: Math.ceil(getDistance(userLocation, navigationTarget) / 500) * 60 },
                steps: [{
                  instructions: "Siga em linha reta até o destino (Serviço de rotas Google indisponível)",
                  distance: { text: (getDistance(userLocation, navigationTarget) / 1000).toFixed(1) + " km" },
                  duration: { text: Math.ceil(getDistance(userLocation, navigationTarget) / 500) + " min" },
                  maneuver: "straight",
                  start_location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
                  end_location: new google.maps.LatLng(navigationTarget.lat, navigationTarget.lng),
                  polyline: null 
                }],
                start_location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
                end_location: new google.maps.LatLng(navigationTarget.lat, navigationTarget.lng)
              }],
              overview_path: straightLinePath,
              bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(Math.min(userLocation.lat, navigationTarget.lat), Math.min(userLocation.lng, navigationTarget.lng)),
                new google.maps.LatLng(Math.max(userLocation.lat, navigationTarget.lat), Math.max(userLocation.lng, navigationTarget.lng))
              )
            }]
          };
          
          setDirectionsResult(mockResponse);
          directionsRenderer.setDirections({ routes: [] } as any);
          if (showToast) showToast('Aviso: Mostrando linha direta (Serviço de ruas indisponível)');
        };

        fetchOsrmRoute();
      }
    });
  }, [navigationTarget, directionsService, directionsRenderer, userLocation?.lat, userLocation?.lng, voiceEnabled, showToast]);

  // Handle Pro Turn-by-Turn logic
  useEffect(() => {
    if (!directionsResult || !userLocation || !navigationTarget) return;
    
    const steps = directionsResult.routes[0]?.legs[0]?.steps;
    if (!steps || currentStepIndex >= steps.length) return;
    
    const currentStep = steps[currentStepIndex];
    if (!currentStep?.end_location) return;

    const stepEnd = { lat: currentStep.end_location.lat(), lng: currentStep.end_location.lng() };
    const distToStepEnd = getDistance(userLocation, stepEnd);

    // VOICE LOGIC: Proximity alerts
    if (voiceEnabled) {
      const stepText = stripHtml(currentStep.instructions);
      if (lastSpokenStepRef.current !== currentStepIndex) {
        lastSpokenStepRef.current = currentStepIndex;
        speakText(stepText);
      } else if (distToStepEnd < 150 && distToStepEnd > 120 && !lastSpokenProximityRef.current) {
        lastSpokenProximityRef.current = true;
        speakText(`Em 150 metros, ${stepText}`);
      }
    }

    if (distToStepEnd < 20 && currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      lastSpokenProximityRef.current = false;
    }
  }, [userLocation, directionsResult, currentStepIndex, voiceEnabled, navigationTarget]);

  const speakText = (text: string) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const [lastSpokenProximityRef, setLastSpokenProximityRef] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (!map) return;
    const sv = map.getStreetView();
    if (!sv) return;
    
    const listener = sv.addListener('visible_changed', () => {
      const isVisible = sv.getVisible();
      setIsStreetViewActive(isVisible);
      if (onStreetViewChange) {
        onStreetViewChange(isVisible);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !onZoomChange) return;
    const listener = map.addListener('zoom_changed', () => {
      const z = map.getZoom();
      if (z !== undefined) {
        onZoomChange(z);
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onZoomChange]);

  const isProgrammaticPanRef = useRef(false);

  const safePanTo = (latLng: { lat: number; lng: number }, withOffset = false) => {
    if (!map) return;
    isProgrammaticPanRef.current = true;
    
    if (withOffset) {
      // Offset center slightly south/down so user appears in the lower third for better ahead view
      try {
        const projection = map.getProjection();
        const zoom = map.getZoom() || 19;
        if (projection) {
          const point = projection.fromLatLngToPoint(new google.maps.LatLng(latLng.lat, latLng.lng));
          if (point) {
            const scale = Math.pow(2, zoom);
            // Screen divided into 3 parts vertically. Marker fixed on line between 2nd and 3rd section (66.7% down, so offset worldPoint downward by 1/6 of screen height in pixels)
            const mapDiv = map.getDiv();
            const height = mapDiv ? mapDiv.clientHeight : 800;
            const pixelOffsetDown = height * (1 / 6); 
            // Subtracting from y moves the world point north, which pans the map north, pushing the user marker DOWN on the screen
            const worldPoint = new google.maps.Point(point.x, point.y - (pixelOffsetDown / scale) * (scale / Math.pow(2, zoom)));
            const shiftedLatLng = projection.fromPointToLatLng(worldPoint);
            if (shiftedLatLng) {
              map.panTo(shiftedLatLng);
            } else {
              map.panTo(latLng);
            }
          } else {
            map.panTo(latLng);
          }
        } else {
          map.panTo(latLng);
        }
      } catch {
        map.panTo(latLng);
      }
    } else {
      map.panTo(latLng);
    }
    
    setTimeout(() => {
      isProgrammaticPanRef.current = false;
    }, 300);
  };

  // Native map listeners for drag start/movement
  useEffect(() => {
    if (!map) return;
    const handleDrag = () => {
      setIsFollowingUser(false);
      if (onMapDragStart) {
        onMapDragStart();
      }
    };

    const dragStartListener = map.addListener('dragstart', handleDrag);
    const dragListener = map.addListener('drag', handleDrag);

    return () => {
      google.maps.event.removeListener(dragStartListener);
      google.maps.event.removeListener(dragListener);
    };
  }, [map, onMapDragStart]);

  // Current map heading state
  const [currentMapHeading, setCurrentMapHeading] = useState(0);

  useEffect(() => {
    if (!map) return;
    const headingListener = map.addListener('heading_changed', () => {
      const h = map.getHeading() || 0;
      setCurrentMapHeading(Math.round(h));
      if (onMapHeadingChange) onMapHeadingChange(h);
    });
    return () => {
      google.maps.event.removeListener(headingListener);
    };
  }, [map, onMapHeadingChange]);

  // Align / reset map to North (pointing straight UP: 0° heading, 0° tilt)
  const resetToNorth = () => {
    if (!map) return;
    try {
      if (typeof (map as any).moveCamera === 'function') {
        (map as any).moveCamera({ heading: 0, tilt: 0 });
      }
      if (typeof map.setHeading === 'function') {
        map.setHeading(0);
      }
      if (typeof map.setTilt === 'function') {
        map.setTilt(0);
      }
    } catch (e) {
      console.error('Error resetting north:', e);
    }
    setCurrentMapHeading(0);
    if (onMapHeadingChange) onMapHeadingChange(0);
  };

  // Respond to resetNorthTrigger from Header or external trigger
  useEffect(() => {
    if (!map || !resetNorthTrigger) return;
    resetToNorth();
  }, [resetNorthTrigger, map]);

  // When a place is clicked/selected in the list, search or map, pan the map and zoom in closely to the establishment
  const lastSelectedPlaceIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!map || !activeSelectedPlace) return;
    const placeId = (activeSelectedPlace as any).id || (activeSelectedPlace as any).placeId || `${activeSelectedPlace.lat}_${activeSelectedPlace.lng}`;
    if (lastSelectedPlaceIdRef.current === placeId) return;
    lastSelectedPlaceIdRef.current = placeId;

    setIsFollowingUser(false);
    safePanTo({ lat: activeSelectedPlace.lat, lng: activeSelectedPlace.lng });
    map.setZoom(17);
  }, [activeSelectedPlace, map]);

  // Handle programmatic focus (like search selection or manual locate button)
  useEffect(() => {
    if (!map || !focusLocationTrigger) return;
    safePanTo({ lat: focusLocationTrigger.lat, lng: focusLocationTrigger.lng });
    if (focusLocationTrigger.zoom !== undefined) {
      map.setZoom(focusLocationTrigger.zoom);
    }
  }, [focusLocationTrigger, map]);

  // Dynamic map auto-centering & heading rotation following user location when isFollowingUser is active
  const lastAppliedHeadingRef = useRef<number>(-999);
  useEffect(() => {
    if (!map || !userLocation) return;

    if (isFollowingUser) {
      if (navigationTarget) {
        safePanTo({ lat: userLocation.lat, lng: userLocation.lng }, true);
        const dist = getDistance(userLocation, navigationTarget);
        const dynamicZoom = getNavigationZoomByDistance(dist);
        map.setZoom(dynamicZoom);
        map.setTilt(45);
      } else {
        safePanTo({ lat: userLocation.lat, lng: userLocation.lng }, false);
      }
      
      const effectiveHeading = mapHeading ?? userLocation.heading;
      if (effectiveHeading !== undefined && effectiveHeading !== null && !isNaN(effectiveHeading)) {
        if (Math.abs(effectiveHeading - lastAppliedHeadingRef.current) >= 0.5) {
          lastAppliedHeadingRef.current = effectiveHeading;
          if (typeof (map as any).moveCamera === 'function') {
            (map as any).moveCamera({ heading: effectiveHeading });
          } else if (typeof map.setHeading === 'function') {
            map.setHeading(effectiveHeading);
          }
        }
      }
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.heading, mapHeading, map, navigationTarget, isFollowingUser]);

  // Reverse geocode to get current street name and estimated right-side number
  useEffect(() => {
    if (!userLocation) return;

    const performReverseGeocode = async () => {
      try {
        // Fallback to free Nominatim (OSM) service to bypass Google billing issues for simple geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=18&addressdetails=1`, {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'VoltaLa-GKD-Mobility-App'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const street = data.address.road || data.address.pedestrian || data.address.suburb || '';
            const houseNumber = data.address.house_number;
            
            if (houseNumber) {
              let num = parseInt(houseNumber, 10);
              if (!isNaN(num)) {
                if (num % 2 !== 0) num += 1;
                setCurrentStreetName(`${street}, ${num}`);
              } else {
                setCurrentStreetName(street);
              }
            } else {
              const syntheticNum = Math.abs(Math.round((userLocation.lat * 10000 + userLocation.lng * 10000) % 900)) + 100;
              const rightSideNum = syntheticNum % 2 === 0 ? syntheticNum : syntheticNum + 1;
              setCurrentStreetName(street ? `${street}, ${rightSideNum}` : null);
            }
            return;
          }
        }

        // Final fallback: Synthetic number estimation if Nominatim fails
        // We avoid Google Geocoder entirely as it requires billing which is currently disabled on the project
        const syntheticNum = Math.abs(Math.round((userLocation.lat * 10000 + userLocation.lng * 10000) % 900)) + 100;
        const rightSideNum = syntheticNum % 2 === 0 ? syntheticNum : syntheticNum + 1;
        setCurrentStreetName(`Rua Estimada, ${rightSideNum}`);
      } catch (e) {
        console.log('Geocoding error:', e);
      }
    };

    performReverseGeocode();
  }, [userLocation?.lat, userLocation?.lng]);

  // Stable user location ref to prevent continuous GPS updates from re-triggering search
  const userLocationRef = useRef(userLocation);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Execute text search using Places API (New)
  const lastExecutedSearchRef = useRef<string>('');
  const isExecutingSearchRef = useRef<boolean>(false);

  useEffect(() => {
    if (!placesLib || !placesLib.Place || !map) return;
    
    if (!searchQuery) {
      onSearchResultsUpdate([]);
      lastExecutedSearchRef.current = '';
      return;
    }

    const searchKey = `${searchQuery.trim().toLowerCase()}_${searchRadiusMeters}`;
    if (lastExecutedSearchRef.current === searchKey) {
      return;
    }
    lastExecutedSearchRef.current = searchKey;
    isExecutingSearchRef.current = true;

    try {
      const currentUserPos = userLocationRef.current;
      const centerCoords = currentUserPos 
        ? { lat: currentUserPos.lat, lng: currentUserPos.lng } 
        : (map.getCenter() ? { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() } : { lat: -23.5505, lng: -46.6333 });

      const radius = searchRadiusMeters || 1500;
      const searchLatDelta = radius / 111320;
      const searchLngDelta = radius / (111320 * Math.cos((centerCoords.lat * Math.PI) / 180));

      const normalizedQuery = searchQuery.trim().toLowerCase();
      let queryText = searchQuery;
      if (normalizedQuery === 'boate' || normalizedQuery === 'boates') {
        queryText = 'boate balada casa noturna nightclub danceteria';
      } else if (normalizedQuery === 'balada' || normalizedQuery === 'baladas') {
        queryText = 'balada boate casa noturna nightclub';
      }

      placesLib.Place.searchByText({
        textQuery: queryText,
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'internationalPhoneNumber', 'websiteURI', 'photos', 'id', 'priceLevel', 'editorialSummary', 'types', 'regularOpeningHours', 'currentOpeningHours', 'googleMapsURI'],
        locationRestriction: {
          north: centerCoords.lat + searchLatDelta,
          south: centerCoords.lat - searchLatDelta,
          east: centerCoords.lng + searchLngDelta,
          west: centerCoords.lng - searchLngDelta,
        },
        maxResultCount: 20,
      }).then(({ places }) => {
        let validPlaces = places ? places.filter((p: any) => {
          if (!p.location) return false;
          const dist = getDistance(centerCoords, { lat: p.location.lat(), lng: p.location.lng() });
          if (dist > radius) return false;

          const nameLower = (p.displayName || '').toLowerCase();

          // Only apply negative exclusion filters if the query is a generic broad category search (not a specific business name like "Avelinos Car")
          const isGenericCategoryQuery = ['supermercado', 'mercado', 'posto', 'gasolina', 'bar', 'boteco', 'restaurante'].includes(normalizedQuery);
          if (isGenericCategoryQuery) {
            if (normalizedQuery === 'supermercado' || normalizedQuery === 'mercado') {
              if (nameLower.includes('posto') || nameLower.includes('gasolina') || nameLower.includes('bar') || nameLower.includes('boteco') || nameLower.includes('pub')) {
                return false;
              }
            }
            if (normalizedQuery === 'posto' || normalizedQuery === 'gasolina') {
              if (nameLower.includes('supermercado') || nameLower.includes('mercado') || nameLower.includes('bar') || nameLower.includes('restaurante')) {
                return false;
              }
            }
            if (normalizedQuery === 'bar') {
              if (nameLower.includes('supermercado') || nameLower.includes('mercado') || nameLower.includes('posto') || nameLower.includes('gasolina')) {
                return false;
              }
            }
          }

          return true;
        }) : [];

        // Fallback: If 0 places in strict geographic box or searching for a specific business by name, search with locationBias around center
        if (validPlaces.length === 0) {
          placesLib.Place.searchByText({
            textQuery: queryText,
            fields: ['displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'internationalPhoneNumber', 'websiteURI', 'photos', 'id', 'priceLevel', 'editorialSummary', 'types', 'regularOpeningHours', 'currentOpeningHours', 'googleMapsURI'],
            locationBias: {
              center: centerCoords,
              radius: Math.max(radius, 5000),
            },
            maxResultCount: 20,
          }).then(({ places: fallbackPlaces }) => {
            if (!fallbackPlaces || fallbackPlaces.length === 0) {
              onSearchResultsUpdate([]);
              return;
            }
            const fbValid = fallbackPlaces.filter((p: any) => Boolean(p.location));
            processSearchResults(fbValid);
          }).catch(console.error);
          return;
        }

        processSearchResults(validPlaces);
      }).catch(err => {
        console.error('Search by text error:', err);
      }).finally(() => {
        isExecutingSearchRef.current = false;
      });

      function processSearchResults(validPlaces: any[]) {
        const pins: MapPinType[] = validPlaces.map((p: any, idx: number) => {
          let photoUrl = undefined;
          try {
            if (p.photos && p.photos.length > 0) {
              const ph = p.photos[0] as any;
              if (typeof ph.getURI === "function") {
                photoUrl = ph.getURI({ maxWidth: 600, maxHeight: 400 });
              } else if (typeof ph.getUrl === "function") {
                photoUrl = ph.getUrl({ maxWidth: 600, maxHeight: 400 });
              }
            }
          } catch (e) {
            console.error("Error fetching photo URI", e);
          }

          // Map price level to Brazilian Real estimates
          let priceEst = 'R$ 30 - R$ 60 por pessoa';
          if (p.priceLevel) {
            const pl = String(p.priceLevel).toUpperCase();
            if (pl.includes('INEXPENSIVE') || pl === '1') priceEst = 'R$ 15 - R$ 30 por pessoa';
            else if (pl.includes('MODERATE') || pl === '2') priceEst = 'R$ 40 - R$ 80 por pessoa';
            else if (pl.includes('EXPENSIVE') || pl === '3' || pl === '4') priceEst = 'R$ 90 - R$ 200+ por pessoa';
          }

          // Determine category based on name, types, and search query
          let placeCategory: PlaceCategory = 'Outros';
          const nameStr = p.displayName?.text || p.displayName || p.name || '';
          const nameLower = String(nameStr).toLowerCase();
          
          // Enrich photoUrl with fallback if needed (using real lat/lng for Street View fallback)
          photoUrl = getPlacePhoto(nameStr, photoUrl, { lat: p.location?.lat() || 0, lng: p.location?.lng() || 0 });
          const types: string[] = p.types || [];

          if (
            nameLower.includes('car') || 
            nameLower.includes('auto') || 
            nameLower.includes('oficina') || 
            nameLower.includes('veículo') || 
            nameLower.includes('veiculo') || 
            nameLower.includes('mecânica') || 
            nameLower.includes('mecanica') || 
            nameLower.includes('estética automotiva') || 
            nameLower.includes('estetica automotiva') || 
            nameLower.includes('lava rápido') || 
            nameLower.includes('lava rapido') || 
            nameLower.includes('concessionária') || 
            nameLower.includes('concessionaria') || 
            types.includes('car_repair') || 
            types.includes('car_dealer') || 
            types.includes('car_wash')
          ) {
            placeCategory = 'Automotivo';
          } else if (normalizedQuery.includes('restaurante') || nameLower.includes('restaurante') || types.includes('restaurant') || types.includes('food')) {
            placeCategory = 'Restaurante';
          } else if (normalizedQuery.includes('padaria') || nameLower.includes('padaria') || types.includes('bakery')) {
            placeCategory = 'Padaria';
          } else if (normalizedQuery.includes('café') || normalizedQuery.includes('cafe') || normalizedQuery.includes('cafeteria') || nameLower.includes('café') || nameLower.includes('cafe') || types.includes('cafe')) {
            placeCategory = 'Cafeteria';
          } else if (normalizedQuery.includes('supermercado') || normalizedQuery.includes('mercado') || types.includes('supermarket') || types.includes('grocery_store')) {
            placeCategory = 'Supermercado';
          } else if (normalizedQuery.includes('farmácia') || normalizedQuery.includes('farmacia') || types.includes('pharmacy') || types.includes('drugstore')) {
            placeCategory = 'Farmácia';
          } else if (normalizedQuery.includes('posto') || nameLower.includes('posto') || types.includes('gas_station')) {
            placeCategory = 'Posto de Gasolina';
          } else if (normalizedQuery.includes('shopping') || types.includes('shopping_mall')) {
            placeCategory = 'Shopping';
          } else if (normalizedQuery.includes('bar') || nameLower.includes('bar') || types.includes('bar')) {
            placeCategory = 'Bar';
          } else if (normalizedQuery.includes('boate') || normalizedQuery.includes('balada') || nameLower.includes('boate') || types.includes('night_club')) {
            placeCategory = 'Boate';
          } else {
            placeCategory = 'Outros';
          }

          const extractedHours = (p.regularOpeningHours?.weekdayDescriptions && p.regularOpeningHours.weekdayDescriptions.length > 0)
            ? p.regularOpeningHours.weekdayDescriptions
            : (p.currentOpeningHours?.weekdayDescriptions && p.currentOpeningHours.weekdayDescriptions.length > 0)
              ? p.currentOpeningHours.weekdayDescriptions
              : getDefaultOpeningHoursForCategory(placeCategory, p.displayName);

          const stableId = p.id || `place_${p.location?.lat() || idx}_${p.location?.lng() || idx}`;

          return {
            id: stableId,
            name: String(nameStr) || 'Local sem nome',
            address: p.formattedAddress || '',
            lat: p.location?.lat() || 0,
            lng: p.location?.lng() || 0,
            category: placeCategory,
            rating: p.rating,
            userRatingsTotal: p.userRatingCount,
            phoneNumber: p.internationalPhoneNumber,
            website: p.websiteURI,
            priceLevel: priceEst,
            peakHours: 'Pico das 23h00 às 04h00',
            photoUrl,
            placeId: p.id,
            openingHours: extractedHours,
            googleMapsUri: p.googleMapsURI || (p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : undefined),
            description: p.editorialSummary ? (typeof p.editorialSummary === 'string' ? p.editorialSummary : p.editorialSummary.text) : undefined,
          };
        });

        onSearchResultsUpdate(pins);

        // Afastar e enquadrar o zoom no mapa perfeitamente conforme o raio de pesquisa escolhido
        setIsFollowingUser(false);
        const targetZoom = getZoomForRadius(searchRadiusMeters || 1500);
        safePanTo(centerCoords);
        map.setZoom(targetZoom);
      }
    } catch (e) {
      console.error('Error in searchByText execution:', e);
      isExecutingSearchRef.current = false;
    }
  }, [placesLib, searchQuery, searchRadiusMeters, map]);

  // Filter saved places by category if a specific category is selected
  const visibleSavedPlaces = selectedCategoryFilter === 'Todos' 
    ? savedPlaces 
    : savedPlaces.filter(p => p.category === selectedCategoryFilter);

  // 1 km region bounding calculation around user location or default center
  const centerLat = userLocation?.lat ?? -23.5505;
  const centerLng = userLocation?.lng ?? -46.6333;
  const latDelta = 1000 / 111320; // ~0.009 graus (1km)
  const lngDelta = 1000 / (111320 * Math.cos((centerLat * Math.PI) / 180)); // ~0.010 graus

  return (
    <>
      {/* Real-time Radar Scan Animation (Varredura) */}
      <AnimatePresence>
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.15, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="w-full h-full border-[20px] border-emerald-400 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, rgba(52, 211, 153, 0.4) 0deg, transparent 90deg)',
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
               <div className="bg-emerald-500/80 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md animate-pulse">
                 VARRENDO ÁREA...
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Map Click Listener to pin/save location */}
      <Map
        defaultCenter={{ lat: centerLat, lng: centerLng }}
        defaultZoom={19}
        defaultHeading={0}
        defaultTilt={0}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        options={{
          minZoom: 3,
          maxZoom: 21,
          tiltInteractionEnabled: true,
          headingInteractionEnabled: true,
          disableDoubleClickZoom: false,
          zoomControl: false,
          rotateControl: true,
          cameraControl: false,
          scaleControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          renderingType: "VECTOR"
        } as any}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100vh', cursor: isPinningMode ? 'crosshair' : 'grab' }}
        onDrag={() => {
          setIsFollowingUser(false);
          if (onMapDragStart) onMapDragStart();
        }}
        onDragStart={() => {
          setIsFollowingUser(false);
          if (onMapDragStart) onMapDragStart();
        }}
        styles={[
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.attraction",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.medical",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.place_of_worship",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "poi.sports_complex",
            stylers: [{ visibility: "off" }]
          }
        ]}
        onClick={(e) => {
          if (e.detail && e.detail.latLng) {
            const placeId = e.detail.placeId;
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;

            // Only intercept clicks on native points of interest
            // Do NOT trigger on blank map clicks to avoid annoying accidental pins
            // UNLESS pinning mode is ACTIVE, in which case we allow any click!
            if (placeId || isPinningMode) {
              try {
                if (typeof (e.detail as any).stop === 'function') {
                  (e.detail as any).stop();
                }
                if (e.detail && (e.detail as any).domEvent && typeof (e.detail as any).domEvent.preventDefault === 'function') {
                  (e.detail as any).domEvent.preventDefault();
                }
                if ((e as any).domEvent && typeof (e as any).domEvent.preventDefault === 'function') {
                  (e as any).domEvent.preventDefault();
                }
              } catch (err) {}
              
              // If it's a manual pin click on blank space
              if (!placeId && isPinningMode) {
                onMapClickToAdd({ lat, lng });
                return;
              }

              if (placesLib && placesLib.Place) {
                const place = new placesLib.Place({ id: placeId });
                place.fetchFields({ 
                  fields: ['displayName', 'formattedAddress', 'rating', 'userRatingCount', 'internationalPhoneNumber', 'websiteURI', 'photos', 'priceLevel', 'regularOpeningHours', 'currentOpeningHours', 'googleMapsURI', 'editorialSummary', 'types'] 
                }).then(() => {
                  let priceEst = 'R$ 30 - R$ 60 por pessoa';
                  if (place.priceLevel) {
                    const pl = String(place.priceLevel).toUpperCase();
                    if (pl.includes('INEXPENSIVE') || pl === '1') priceEst = 'R$ 15 - R$ 30 por pessoa';
                    else if (pl.includes('MODERATE') || pl === '2') priceEst = 'R$ 40 - R$ 80 por pessoa';
                    else if (pl.includes('EXPENSIVE') || pl === '3' || pl === '4') priceEst = 'R$ 90 - R$ 200+ por pessoa';
                  }

                  let photoUrl = undefined;
                  try {
                    if (place.photos && place.photos.length > 0) {
                      const ph = place.photos[0] as any;
                      if (typeof ph.getURI === "function") {
                        photoUrl = ph.getURI({ maxWidth: 600, maxHeight: 400 });
                      } else if (typeof ph.getUrl === "function") {
                        photoUrl = ph.getUrl({ maxWidth: 600, maxHeight: 400 });
                      }
                    }
                  } catch (err) {}

                  // Apply professional fallback (Street View) if no official photo
                  photoUrl = getPlacePhoto(place.displayName, photoUrl, { lat, lng });

                  const extractedHours = (place.regularOpeningHours?.weekdayDescriptions && place.regularOpeningHours.weekdayDescriptions.length > 0)
                    ? place.regularOpeningHours.weekdayDescriptions
                    : (place.currentOpeningHours?.weekdayDescriptions && place.currentOpeningHours.weekdayDescriptions.length > 0)
                      ? place.currentOpeningHours.weekdayDescriptions
                      : getDefaultOpeningHoursForCategory(undefined, place.displayName);

                  onSelectPlaceToView({
                    name: place.displayName || 'Local sem nome',
                    address: place.formattedAddress || '',
                    lat,
                    lng,
                    rating: place.rating,
                    userRatingsTotal: place.userRatingCount,
                    phoneNumber: place.internationalPhoneNumber,
                    website: place.websiteURI,
                    priceLevel: priceEst,
                    photoUrl,
                    placeId,
                    openingHours: extractedHours,
                    googleMapsUri: place.googleMapsURI || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
                    description: place.editorialSummary ? (typeof place.editorialSummary === 'string' ? place.editorialSummary : (place.editorialSummary as any).text) : undefined,
                  });
                }).catch(err => {
                  console.error('Error fetching POI details:', err);
                  onMapClickToAdd({ lat, lng });
                });
                return;
              }
            }

            // Normal map click (no specific POI selected)
            onClearActiveSelect();
            if (onMapDragStart) onMapDragStart();
          }
        }}
        onContextmenu={(e) => {
          if (e.detail && e.detail.latLng) {
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;
            
            const performContextGeocode = async () => {
              try {
                // Try free Nominatim first to avoid billing errors
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`, {
                  headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'VoltaLa-GKD-Mobility-App' }
                });
                
                if (resp.ok) {
                  const data = await resp.json();
                  if (data && data.display_name) {
                    onMapClickToAdd({ lat, lng, exactAddress: data.display_name });
                    return;
                  }
                }

                // If Nominatim fails, we skip Google Geocoding to avoid billing errors
                onMapClickToAdd({ lat, lng });
              } catch (err) {
                onMapClickToAdd({ lat, lng });
              }
            };

            performContextGeocode();
          }
        }}
      >
        {/* Fallback route line when Directions API fails */}
        {directionsResult && !directionsResult.routes[0]?.legs[0]?.steps[0]?.polyline && (
          <Polyline
            path={directionsResult.routes[0].overview_path}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 100
            }}
          />
        )}

        {/* User Current Location Marker */}
        {userLocation && (
          <AdvancedMarker position={userLocation} title="Sua Localização" zIndex={200}>
            <div className="relative flex items-center justify-center pointer-events-none">
              {/* Dynamic Directional Field-of-View Cone (Facing beam) */}
              {(mapHeading !== undefined || userLocation.heading !== undefined) && (
                <div 
                  className="absolute -top-14 w-28 h-28 pointer-events-none flex items-center justify-center transition-transform duration-75 ease-out"
                  style={{
                    transform: `rotate(${(mapHeading ?? userLocation.heading ?? 0) - currentMapHeading}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  <div 
                    className="w-full h-full opacity-60"
                    style={{
                      background: 'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.15) 45%, transparent 75%)',
                      clipPath: 'polygon(50% 50%, 15% 0%, 85% 0%)',
                    }}
                  />
                </div>
              )}

              <div className="absolute w-12 h-12 bg-emerald-500/40 rounded-full animate-ping" />

              {/* Distinctive Custom Shape: Glowing Emerald Shield / Diamond */}
              <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white rounded-2xl shadow-xl flex items-center justify-center relative z-10 rotate-45">
                <div className="w-3 h-3 bg-white rounded-full -rotate-45 shadow-inner" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Pending Custom Pin */}
        {pendingPin && (
          <AdvancedMarker 
            position={pendingPin} 
            draggable={true}
            onDragEnd={(e) => {
              if (e.latLng && onPendingPinDragEnd) {
                onPendingPinDragEnd({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              }
            }}
            zIndex={100}
          >
            <ThinPin color="#2563eb" />
          </AdvancedMarker>
        )}

        {/* Saved Favorite Places Markers */}
        {visibleSavedPlaces.map((place, idx) => {
          const color = CATEGORY_COLORS[place.category] || '#f59e0b';
          const pos = getOffsetForPlace(place.lat, place.lng, visibleSavedPlaces, idx);
          return (
            <AdvancedMarker
              key={`saved-${place.id}`}
              position={pos}
              title={place.name}
              zIndex={150}
              onClick={() => {
                onSelectPlaceToView(place);
              }}
            >
              <ThinPin 
                color={color} 
                isSaved={true} 
                title={place.name} 
                category={place.category}
                photoUrl={place.photoUrl} 
                coords={{ lat: place.lat, lng: place.lng }}
              />
            </AdvancedMarker>
          );
        })}

        {/* Search Result Markers */}
        {searchResults.map((pin, idx) => {
          // Check if already saved
          const isAlreadySaved = savedPlaces.some((s) => (s.placeId && pin.placeId && s.placeId === pin.placeId) || (Math.abs(s.lat - pin.lat) < 0.0001 && Math.abs(s.lng - pin.lng) < 0.0001));
          const pinCategory = pin.category || selectedCategoryFilter;
          const color = CATEGORY_COLORS[pinCategory as string] || '#2563eb';
          const pos = getOffsetForPlace(pin.lat, pin.lng, searchResults, idx);
          return (
            <AdvancedMarker
              key={`search-${pin.id}`}
              position={pos}
              title={pin.name}
              zIndex={isAlreadySaved ? 140 : 80}
              onClick={() => {
                onSelectPlaceToView(pin);
              }}
            >
              <ThinPin 
                color={isAlreadySaved ? '#f59e0b' : color} 
                isSaved={isAlreadySaved} 
                title={pin.name} 
                category={pinCategory}
                photoUrl={pin.photoUrl} 
                coords={{ lat: pin.lat, lng: pin.lng }}
              />
            </AdvancedMarker>
          );
        })}
      </Map>
      
      {/* Current Street Name Display - elevated above bottom attribution */}
      {currentStreetName && !isStreetViewActive && userLocation && !navigationTarget && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out max-w-[85vw]">
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-slate-700/70 flex items-center gap-1.5">
            <PinIcon className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-white font-medium text-xs truncate max-w-[65vw]">{currentStreetName}</span>
          </div>
        </div>
      )}

      {/* PRO-NAVIGATION HUD: Professional Google Maps Interface */}
      {navigationTarget && directionsResult && (
        <div className="absolute top-0 left-0 right-0 z-[300] pointer-events-none flex flex-col items-center">
          {/* Main Direction Card */}
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg bg-emerald-600 text-white shadow-2xl overflow-hidden pointer-events-auto border-b border-emerald-500/30"
          >
            <div className="p-4 flex items-center gap-4">
              {/* Maneuver Icon Box */}
              <div className="w-16 h-16 bg-emerald-800/40 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                {(() => {
                  const step = directionsResult.routes[0]?.legs[0]?.steps[currentStepIndex];
                  const instr = (step?.instructions || '').toLowerCase();
                  const maneuver = (step?.maneuver || '').toLowerCase();
                  
                  if (maneuver.includes('right') || instr.includes('direita')) return <div className="flex flex-col items-center"><Navigation className="w-9 h-9 rotate-90 text-white" /><span className="text-[8px] font-black mt-1">DIREITA</span></div>;
                  if (maneuver.includes('left') || instr.includes('esquerda')) return <div className="flex flex-col items-center"><Navigation className="w-9 h-9 -rotate-90 text-white" /><span className="text-[8px] font-black mt-1">ESQUERDA</span></div>;
                  if (maneuver.includes('u-turn') || instr.includes('retorno')) return <div className="flex flex-col items-center"><RotateCcw className="w-8 h-8 text-white" /><span className="text-[8px] font-black mt-1">RETORNO</span></div>;
                  if (instr.includes('rotatória') || instr.includes('roundabout')) return <div className="flex flex-col items-center"><RotateCw className="w-8 h-8 text-white" /><span className="text-[8px] font-black mt-1">ROTATÓRIA</span></div>;
                  if (instr.includes('reto') || instr.includes('straight')) return <div className="flex flex-col items-center"><Navigation className="w-8 h-8 text-white" /><span className="text-[8px] font-black mt-1">RETO</span></div>;
                  
                  return <div className="flex flex-col items-center"><Navigation className="w-9 h-9 text-white" /><span className="text-[8px] font-black mt-1">SIGA</span></div>;
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-100 text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                      {currentStepIndex === directionsResult.routes[0].legs[0].steps.length - 1 ? 'Chegada' : 'Siga'}
                    </span>
                    <span className="text-xl font-black tabular-nums">
                      {(() => {
                        const step = directionsResult.routes[0]?.legs[0]?.steps[currentStepIndex];
                        if (!step || !userLocation) return '--';
                        const dist = getDistance(userLocation, { lat: step.end_location.lat(), lng: step.end_location.lng() });
                        return dist < 1000 ? `${Math.round(dist)} m` : `${(dist/1000).toFixed(1)} km`;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`p-2 rounded-full transition-all ${voiceEnabled ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-100'}`}
                      title="Voz Ativada"
                    >
                      {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    {onStopNavigation && (
                      <button
                        onClick={onStopNavigation}
                        className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                        title="Parar Navegação"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[17px] font-bold leading-tight line-clamp-2 pr-2">
                  {directionsResult?.routes[0]?.legs[0]?.steps[currentStepIndex]?.instructions 
                    ? stripHtml(directionsResult.routes[0].legs[0].steps[currentStepIndex].instructions)
                    : 'Siga na direção indicada'}
                </div>
                
                <div className="flex items-center gap-3 mt-1.5">
                  <button 
                    onClick={() => setShowSteps(!showSteps)}
                    className="text-[9px] font-black text-emerald-100/60 flex items-center gap-1 hover:text-white transition-colors bg-black/10 px-2 py-0.5 rounded-full"
                  >
                    <List className="w-2.5 h-2.5" />
                    {showSteps ? 'OCULTAR PASSOS' : 'LISTA DE PASSOS'}
                  </button>
                  
                  {/* Manually trigger recalculation if user feels off-track */}
                  <button 
                    onClick={() => {
                      lastRoutedTargetRef.current = null;
                      setIsRecalculating(true);
                      if (onLocateUser) onLocateUser();
                    }}
                    className="text-[9px] font-black text-emerald-100/60 flex items-center gap-1 hover:text-white transition-colors bg-black/10 px-2 py-0.5 rounded-full"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    RECALCULAR
                  </button>
                </div>
              </div>
            </div>
            
            {/* Steps Panel */}
            <AnimatePresence>
              {showSteps && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="bg-emerald-800/90 backdrop-blur-md overflow-hidden"
                >
                  <div className="max-h-60 overflow-y-auto p-4 flex flex-col gap-3">
                    {directionsResult.routes[0].legs[0].steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-3 items-start p-2 rounded-xl transition-colors ${idx === currentStepIndex ? 'bg-emerald-500/30 border border-white/20' : 'opacity-60'}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <Navigation className={`w-4 h-4 ${idx === currentStepIndex ? 'text-white' : 'text-emerald-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs ${idx === currentStepIndex ? 'font-bold text-white' : 'text-emerald-100'}`}>
                            {stripHtml(step.instructions)}
                          </div>
                          <div className="text-[10px] text-emerald-300 mt-0.5">
                            {step.distance?.text} • {step.duration?.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-emerald-900/30">
              <motion.div 
                className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStepIndex + 1) / directionsResult.routes[0].legs[0].steps.length) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Secondary Stats Info Bar */}
          <div className="mt-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-2xl flex items-center gap-8 text-white pointer-events-auto">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Distância</span>
              <span className="text-base font-black">{directionsResult.routes[0].legs[0].distance?.text || '--'}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase text-emerald-400">Tempo</span>
              <span className="text-base font-black text-emerald-400">{directionsResult.routes[0].legs[0].duration?.text || '--'}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Chegada</span>
              <span className="text-base font-black">
                {(() => {
                  const now = new Date();
                  const durationSec = directionsResult.routes[0].legs[0].duration?.value || 0;
                  const arrival = new Date(now.getTime() + durationSec * 1000);
                  return arrival.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                })()}
              </span>
            </div>
          </div>
          
          {/* Recalculating Overlay */}
          <AnimatePresence>
            {isRecalculating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 bg-red-600/90 text-white px-6 py-2 rounded-2xl shadow-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest border border-red-500"
              >
                <RefreshCw className="w-5 h-5 animate-spin" />
                Recalculando Rota...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}



      {/* Small, discreet floating zoom, compass rose and tempo real buttons on the map */}
      {!isStreetViewActive && (
        <div className="absolute right-3 bottom-16 sm:right-4 sm:bottom-20 z-20 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Floating Compass Rose (Bússola / Indicador Norte) */}
          <button
            onClick={() => {
              if (currentMapHeading !== 0) {
                resetToNorth();
              } else if (mapHeading !== undefined && mapHeading !== 0) {
                // If already at North, align directly to phone compass
                if (map) {
                  if (typeof (map as any).moveCamera === 'function') {
                    (map as any).moveCamera({ heading: mapHeading });
                  } else {
                    map.setHeading(mapHeading);
                  }
                }
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm bg-white/95 hover:bg-white text-slate-700 border-slate-200 active:scale-95 transition-all cursor-pointer group"
            title={currentMapHeading !== 0 ? `Mapa inclinado a ${currentMapHeading}°. Clique para alinhar ao Norte.` : "Apontando para o Norte (0°)"}
            aria-label="Alinhar mapa ao Norte"
          >
            {/* Real-time rotating needle icon */}
            <div 
              className="relative w-4 h-4 flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `rotate(${-currentMapHeading}deg)`,
                transformOrigin: '50% 50%',
              }}
            >
              <div className="w-1 h-3.5 flex flex-col items-center">
                {/* Red North Point */}
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rose-600" />
                {/* Silver/Slate South Point */}
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-slate-400" />
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-800">
              {currentMapHeading === 0 ? 'Norte' : `${currentMapHeading}°`}
            </span>
          </button>

          <button
            onClick={() => {
              const nextVal = !isFollowingUser;
              setIsFollowingUser(nextVal);
              if (map) {
                if (nextVal) {
                  map.setTilt(45);
                  if (userLocation) {
                    const heading = mapHeading ?? userLocation?.heading ?? 0;
                    if (typeof (map as any).moveCamera === 'function') {
                      (map as any).moveCamera({ center: { lat: userLocation.lat, lng: userLocation.lng }, heading, tilt: 45 });
                    } else {
                      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                      map.setHeading(heading);
                    }
                  }
                } else {
                  map.setTilt(0);
                }
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm active:scale-95 transition-all cursor-pointer ${
              isFollowingUser 
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25' 
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
            }`}
            title="Alternar modo Tempo Real (Rotação dinâmica e auto-centralização)"
            aria-label="Ativar modo Tempo Real"
          >
            <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFollowingUser ? 'animate-spin text-white' : 'text-blue-600'}`} style={{ animationDuration: isFollowingUser ? '6s' : '0s' }} />
            <span>{isFollowingUser ? 'Tempo Real: Ativo' : 'Tempo Real: Fixo'}</span>
          </button>
          
          <button
            onClick={() => {
              if (onLocateUser) {
                onLocateUser();
              }
              if (map && userLocation) {
                safePanTo({ lat: userLocation.lat, lng: userLocation.lng }, false);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-sm active:scale-95 transition-all bg-white/95 text-slate-700 border-slate-200 hover:bg-white cursor-pointer"
            title="Centralizar na localização atual (zoom livre)"
            aria-label="Centralizar na localização atual"
          >
            <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span>Localizar</span>
          </button>

          {/* Explicit Floating Zoom In (+) and Zoom Out (-) Buttons */}
          <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => {
                if (map) {
                  const currentZ = map.getZoom() || 17;
                  map.setZoom(Math.min(21, currentZ + 1));
                }
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-lg sm:text-xl border-b border-slate-200 active:bg-slate-200 transition-all cursor-pointer select-none"
              title="Aproximar Zoom (+)"
              aria-label="Aproximar Zoom"
            >
              +
            </button>
            <button
              onClick={() => {
                if (map) {
                  const currentZ = map.getZoom() || 17;
                  map.setZoom(Math.max(3, currentZ - 1));
                }
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-lg sm:text-xl active:bg-slate-200 transition-all cursor-pointer select-none"
              title="Afastar Zoom (-)"
              aria-label="Afastar Zoom"
            >
              -
            </button>
          </div>
        </div>
      )}


    </>
  );
}

export function MapComponent(props: MapComponentProps & {
  navigationTarget?: { lat: number; lng: number } | null;
  onStopNavigation?: () => void;
}) {
  const [apiError, setApiError] = useState(false);
  const activeApiKey = getActiveGoogleMapsKey();
  const hasKey = Boolean(activeApiKey) && activeApiKey !== 'YOUR_API_KEY';

  if (!hasKey && !props.isDemoMode) {
    return <ApiKeySplash onEnableDemo={props.onEnableDemo} />;
  }

  if ((!hasKey && props.isDemoMode) || apiError) {
    return <DemoMap {...props} />;
  }

  return (
    <APIProvider 
      apiKey={activeApiKey} 
      version="weekly"
      onError={(err) => {
        console.warn('APIProvider error, falling back to DemoMap:', err);
        setApiError(true);
      }}
    >
      <div className="w-full h-screen relative">
        <InnerMapController {...props} />
      </div>
    </APIProvider>
  );
}
