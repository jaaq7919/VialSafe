"use client";

import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import React, { useEffect } from 'react';
import type L from 'leaflet';

// Extend the L (Leaflet) namespace to include the heatLayer type
declare module 'leaflet' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function heatLayer(latlngs: any[], options?: any): any;
}

interface HeatmapLayerProps {
  data: [number, number, number][] | null;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    // Clear existing heat layers
    map.eachLayer((layer) => {
      if ((layer as any)._heat) {
        map.removeLayer(layer);
      }
    });

    if (data && data.length > 0) {
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

  return (
    <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <HeatmapLayer data={data} />
    </MapContainer>
  );
};

export default Heatmap;
