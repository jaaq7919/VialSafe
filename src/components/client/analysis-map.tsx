
"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Import heatmap plugin
import { cn } from "@/lib/utils";

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface AnalysisMapProps {
  points: [number, number, number][]; // lat, lng, intensity
}

const defaultCenter: L.LatLngExpression = [3.423, -76.324];

export default function AnalysisMap({ points }: AnalysisMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const heatLayerRef = useRef<L.HeatLayer | null>(null);

    // Set up default icon
    useEffect(() => {
        const iconDefault = L.icon({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;
    }, []);

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                scrollWheelZoom: true,
                dragging: true,
                zoomControl: true,
            }).setView(defaultCenter, 15);

            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update heatmap when points change
    useEffect(() => {
        if (mapRef.current) {
            // Remove old layer
            if (heatLayerRef.current) {
                mapRef.current.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }

            if (points && points.length > 0) {
                const heatLayer = (L as any).heatLayer(points, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 18,
                }).addTo(mapRef.current);

                heatLayerRef.current = heatLayer;

                // Fit map to bounds of the points
                const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
                if (bounds.isValid()) {
                    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        }
    }, [points]);

    return (
        <div 
            ref={mapContainerRef} 
            className={cn("h-full w-full rounded-md overflow-hidden bg-muted")}
        >
        </div>
    );
}
