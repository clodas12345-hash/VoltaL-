import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface StreetViewProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onPinLocation: (latLng: { lat: number; lng: number }) => void;
}

export function StreetView({ lat, lng, onClose, onPinLocation }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panorama, setPanorama] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState({ lat, lng });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !(window as any).google) return;

    const pano = new (window as any).google.maps.StreetViewPanorama(containerRef.current, {
      position: { lat, lng },
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: false,
      showRoadLabels: false,
    });

    setPanorama(pano);

    pano.addListener('position_changed', () => {
      const pos = pano.getPosition();
      if (pos) {
        setCurrentPos({ lat: pos.lat(), lng: pos.lng() });
      }
    });

    return () => {
      (window as any).google.maps.event.clearInstanceListeners(pano);
    };
  }, [lat, lng]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer: NodeJS.Timeout;
    const start = () => {
      timer = setTimeout(() => {
        // Trigger Pin Drop on long press!
        onPinLocation(currentPos);
        onClose();
      }, 600); // 600ms long press
    };

    const clear = () => {
      clearTimeout(timer);
    };

    el.addEventListener('touchstart', start, { capture: true });
    el.addEventListener('touchend', clear, { capture: true });
    el.addEventListener('touchmove', clear, { capture: true });
    el.addEventListener('mousedown', start, { capture: true });
    el.addEventListener('mouseup', clear, { capture: true });
    el.addEventListener('mousemove', clear, { capture: true });

    return () => {
      el.removeEventListener('touchstart', start, { capture: true });
      el.removeEventListener('touchend', clear, { capture: true });
      el.removeEventListener('touchmove', clear, { capture: true });
      el.removeEventListener('mousedown', start, { capture: true });
      el.removeEventListener('mouseup', clear, { capture: true });
      el.removeEventListener('mousemove', clear, { capture: true });
    };
  }, [currentPos, onPinLocation, onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fadeIn">
      <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <button
          onClick={onClose}
          className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors pointer-events-auto backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => {
            onPinLocation(currentPos);
            onClose();
          }}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-xl transition-all pointer-events-auto active:scale-95 border-2 border-white/20"
        >
          <MapPin className="w-5 h-5" />
          <span>Alfinetar Aqui</span>
        </button>
      </div>
      
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Toast for hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md whitespace-nowrap">
          Pressione e segure para alfinetar
        </div>
      </div>
    </div>
  );
}
