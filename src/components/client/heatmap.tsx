"use client";

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';

// leaflet.heat depends on the global L object, so we need to handle it carefully
// We will import it dynamically inside a useEffect hook.

interface HeatmapLayerProps {
  data: [number, number, number][] | null;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    // Dynamically import leaflet.heat only on the client side
    require('leaflet.heat');

    // Clear existing heat layers to avoid duplication on re-render
    map.eachLayer((layer) => {
      if ((layer as any)._heat) {
        map.removeLayer(layer);
      }
    });

    if (data && data.length > 0) {
      // Extend the L (Leaflet) namespace to include the heatLayer type for TypeScript
      (L as any).heatLayer(data, {
          radius: 25,
          blur: 15,
          maxZoom: 18,
          gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(map);
    }
  }, [data, map]);

  return null;
};

interface HeatmapProps {
  data: [number, number, number][] | null;
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  // Default coordinates for Florida, Valle del Cauca
  const position: [number, number] = [3.423, -76.324];

  const displayMap = useMemo(
    () => (
      <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <HeatmapLayer data={data} />
      </MapContainer>
    ),
    [data]
  );

  return <>{displayMap}</>;
};

export default Heatmap;