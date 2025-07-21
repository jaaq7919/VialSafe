
"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

import { cn } from "@/lib/utils";
import { type Accident } from '@/services/accidents';
import { type InventoryItem } from '@/types/inventory';
import { type Recommendation } from '@/services/recommendations';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { format } from 'date-fns';

interface UnifiedMapProps {
  accidents: Accident[];
  inventoryItems: InventoryItem[];
  recommendations: Recommendation[];
}

const defaultCenter: L.LatLngExpression = [3.325515, -76.236995];

// Custom icon definitions
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const accidentIcon = createIcon('red');
const inventoryIcon = createIcon('blue');
const recommendationIcon = createIcon('green');

export default function UnifiedMap({ accidents, inventoryItems, recommendations }: UnifiedMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef({
        accidents: L.layerGroup(),
        inventory: L.layerGroup(),
        recommendations: L.layerGroup()
    });

    useEffect(() => {
        L.Marker.prototype.options.icon = createIcon('grey');
    }, []);

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 16,
                scrollWheelZoom: true,
                dragging: true,
                zoomControl: true,
            });

            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const overlayMaps = {
                "<span style='color:red; font-weight: bold;'>Accidentes</span>": layersRef.current.accidents,
                "<span style='color:blue; font-weight: bold;'>Inventario</span>": layersRef.current.inventory,
                "<span style='color:green; font-weight: bold;'>Recomendaciones</span>": layersRef.current.recommendations
            };

            L.control.layers(undefined, overlayMaps).addTo(map);

            // Add layers to map by default
            layersRef.current.accidents.addTo(map);
            layersRef.current.inventory.addTo(map);
            layersRef.current.recommendations.addTo(map);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Function to add markers to a cluster group
    const updateMarkers = (
        items: any[],
        layerGroup: L.LayerGroup,
        icon: L.Icon,
        popupContentFn: (item: any) => string
    ) => {
        layerGroup.clearLayers();
        if (!mapRef.current) return;
        
        const markers = L.markerClusterGroup({
             maxClusterRadius: 40,
        });

        items.forEach(item => {
            if (item.latitude && item.longitude) {
                const marker = L.marker([item.latitude, item.longitude], { icon })
                    .bindPopup(popupContentFn(item));
                markers.addLayer(marker);
            }
        });
        layerGroup.addLayer(markers);
    };

    useEffect(() => {
        updateMarkers(accidents, layersRef.current.accidents, accidentIcon, item => `
            <b>Accidente: ${item.type}</b><br>
            Ubicación: ${item.location}<br>
            Fecha: ${format(new Date(item.dateTime), 'dd/MM/yyyy HH:mm')}<br>
            Causa: ${item.cause}
        `);
    }, [accidents]);

    useEffect(() => {
        updateMarkers(inventoryItems, layersRef.current.inventory, inventoryIcon, item => `
            <b>Inventario: ${item.type}</b><br>
            Subtipo: ${item.subtype}<br>
            Ubicación: ${item.locationDescription}<br>
            Estado: ${item.status}
        `);
    }, [inventoryItems]);

     useEffect(() => {
        updateMarkers(recommendations, layersRef.current.recommendations, recommendationIcon, item => `
            <b>Recomendación: ${item.type}</b><br>
            Descripción: ${item.description}<br>
            Ubicación: ${item.location}<br>
            Estado: ${item.status}
        `);
    }, [recommendations]);


    return (
        <div 
            ref={mapContainerRef} 
            className={cn("h-full w-full rounded-md overflow-hidden bg-muted")}
        />
    );
}

    