
"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";
import type { CriticalZone } from '@/app/dashboard/analysis/actions';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface AnalysisMapProps {
  zones: CriticalZone[];
}

const defaultCenter: L.LatLngExpression = [3.523316, -76.234978];

const getColor = (accidentCount: number) => {
    if (accidentCount >= 5) return '#ef4444'; // red-500
    if (accidentCount >= 3) return '#f97316'; // orange-500
    return '#eab308'; // yellow-500
};

const getRadius = (accidentCount: number) => {
    return 30 + Math.log(accidentCount) * 15;
};

export default function AnalysisMap({ zones }: AnalysisMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.LayerGroup | null>(null);

    // Set up default icon for markers
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
            }).setView(defaultCenter, 16);

            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            layersRef.current = L.layerGroup().addTo(map);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update circles when zones change
    useEffect(() => {
        const map = mapRef.current;
        const layers = layersRef.current;
        if (!map || !layers) return;

        // Clear previous layers
        layers.clearLayers();
        const allPoints: L.LatLng[] = [];

        if (zones && zones.length > 0) {
            zones.forEach(zone => {
                const color = getColor(zone.accidentCount);
                const radius = getRadius(zone.accidentCount);

                const circle = L.circle(zone.center as L.LatLngExpression, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    radius: radius,
                }).addTo(layers);

                circle.bindPopup(`
                    <b>${zone.location}</b><br>
                    ${zone.accidentCount} accidentes<br>
                    Razón: ${zone.reason}
                `);
                
                zone.points.forEach(p => allPoints.push(L.latLng(p[0], p[1])));
            });

            if(allPoints.length > 0) {
                const bounds = L.latLngBounds(allPoints);
                 if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } else {
                 map.setView(defaultCenter, 16);
            }
        } else {
             map.setView(defaultCenter, 16);
        }

    }, [zones]);

    return (
        <div 
            ref={mapContainerRef} 
            className={cn("h-full w-full rounded-md overflow-hidden bg-muted")}
        >
        </div>
    );
}
