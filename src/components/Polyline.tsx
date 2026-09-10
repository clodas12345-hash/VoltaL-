import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface PolylineProps {
  path: google.maps.LatLng[] | google.maps.LatLngLiteral[];
  options?: google.maps.PolylineOptions;
}

export function Polyline({ path, options }: PolylineProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path,
        ...options
      });
    } else {
      polylineRef.current.setPath(path);
      if (options) {
        polylineRef.current.setOptions(options);
      }
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, options]);

  return null;
}
