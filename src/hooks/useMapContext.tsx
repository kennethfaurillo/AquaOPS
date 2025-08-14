import { Map as LMap } from 'leaflet';
import { createContext, useContext, useState, ReactNode } from 'react';

// Define the map type with toggleFullscreen
type LeafletMap = LMap & { toggleFullscreen: () => void };

interface MapContextType {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  focusPosition: (lat: number, lng: number, zoom?: number) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const focusPosition = (lat: number, lng: number, zoom?: number) => {
    if (!map) return;
    map.flyTo([lat, lng], zoom || map.getZoom());
  };

  return (
    <MapContext.Provider value={{ map, setMap, focusPosition }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}