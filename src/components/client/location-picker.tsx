
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface LocationPickerProps {
  onLocationSelect: (location: { prefix: string, street: string, lat: number, lng: number }) => void;
  initialCenter?: [number, number];
  readOnly?: boolean;
}

const defaultCenter: L.LatLngExpression = [3.325515, -76.236995];

const addressPrefixMap: { [key: string]: string[] } = {
    CLL: ['calle', 'cll', 'cl'],
    CRA: ['carrera', 'cra', 'cr', 'carr'],
    AV: ['avenida', 'av', 'ave'],
    DG: ['diagonal', 'dg'],
    TR: ['transversal', 'tr', 'trv', 'tv'],
    AUT: ['autopista', 'aut'],
    KM: ['kilómetro', 'km'],
    AC: ['avenida calle', 'ac'],
    AK: ['avenida carrera', 'ak'],
    BLV: ['bulevar', 'blv', 'bv'],
};

const extractAddress = (osmData: any): { prefix: string, street: string } | null => {
    if (!osmData || !osmData.address) return null;

    const { road, highway, suburb, house_number, neighbourhood, intersection } = osmData.address;

    let mainStreet = road || highway || intersection || neighbourhood || suburb || '';
    if (!mainStreet) {
       // Fallback to display name if no specific road info
       const displayNameParts = osmData.display_name?.split(',');
       if(displayNameParts && displayNameParts.length > 0) {
           mainStreet = displayNameParts[0];
       } else {
           return null;
       }
    }
    
    // Capitalize words function
    const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    mainStreet = capitalize(mainStreet);

    let prefix = 'CLL'; // Default prefix

    // Find prefix from the main street name
    const mainStreetLower = mainStreet.toLowerCase();
    for (const [key, keywords] of Object.entries(addressPrefixMap)) {
        if (keywords.some(kw => mainStreetLower.startsWith(kw))) {
            prefix = key;
            break; 
        }
    }

    // Clean up the street name from prefixes
    mainStreet = mainStreet.replace(/^(Calle|Carrera|Avenida|Diagonal|Transversal|Autopista|Kilómetro|Bulevar|Cll|Cra|Cr|Av|Ave|Dg|Tr|Trv|Tv|Aut|Km|Ac|Ak|Blv|Bv)\s+/i, '').trim();

    // If there's an intersection in the data, it's more reliable
    if (intersection) {
        mainStreet = capitalize(intersection.replace(' y ', ' con '));
    } else if (osmData.display_name) {
        // Fallback to display_name for intersections
        const displayName = osmData.display_name.toLowerCase();
        const parts = displayName.split(',').map(p => p.trim());
        const streetParts = parts.filter(p => /\d/.test(p) && (p.includes('calle') || p.includes('carrera') || p.includes('avenida')));
        
        if (streetParts.length > 1) {
             const cleanedParts = streetParts.map(p => capitalize(p.replace(/^(calle|carrera|avenida)\s+/i, ''))).slice(0, 2);
             mainStreet = cleanedParts.join(' con ');
        }
    }


    if(house_number) {
        mainStreet = `${mainStreet} #${house_number}`;
    }

    return { prefix, street: mainStreet };
};


export default function LocationPicker({ onLocationSelect, initialCenter, readOnly = false }: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    
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

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) { 
            const center = initialCenter ? (initialCenter as L.LatLngExpression) : defaultCenter;
            const map = L.map(mapContainerRef.current, {
                scrollWheelZoom: !readOnly,
                dragging: !readOnly,
                zoomControl: !readOnly,
            }).setView(center, 16);

            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            if (initialCenter) {
                markerRef.current = L.marker(initialCenter as L.LatLngExpression).addTo(map);
            }

            if (!readOnly) {
                map.on('click', async (e: L.LeafletMouseEvent) => {
                    const { lat, lng } = e.latlng;

                    if (markerRef.current) {
                        markerRef.current.setLatLng(e.latlng);
                    } else {
                        markerRef.current = L.marker(e.latlng).addTo(map);
                    }

                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
                        const data = await response.json();
                        
                        if (data) {
                            const address = extractAddress(data);
                            if(address) {
                                onLocationSelect({ ...address, lat, lng });
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching address from Nominatim:", error);
                    }
                });
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onLocationSelect, initialCenter, readOnly]);

    return (
        <div 
            ref={mapContainerRef} 
            className={cn("h-full w-full rounded-md overflow-hidden bg-muted", readOnly && "cursor-not-allowed")}
        >
        </div>
    );
}

    
