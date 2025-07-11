
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issue with Leaflet in React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface LocationPickerProps {
  onLocationSelect: (address: { prefix: string, street: string }) => void;
}

// Default coordinates for Florida, Valle del Cauca
const defaultCenter: L.LatLngExpression = [3.423, -76.324];

const addressPrefixMap: { [key: string]: string } = {
  road: 'CLL',
  footway: 'CLL',
  street: 'CLL',
  path: 'CLL',
  motorway: 'AUT',
  highway: 'CRA',
};

const extractAddress = (osmData: any): { prefix: string, street: string } | null => {
    if (!osmData.address) return null;

    const { road, highway, footway, street, path, house_number, suburb } = osmData.address;
    const streetName = road || highway || footway || street || path || '';
    const addressType = Object.keys(osmData.address).find(key => 
        ['road', 'highway', 'footway', 'street', 'path'].includes(key)
    ) as keyof typeof addressPrefixMap | undefined;
    
    const prefix = addressType ? addressPrefixMap[addressType] : 'CLL';
    
    let fullStreet = streetName;
    if (house_number) {
        fullStreet += ` #${house_number}`;
    }
    if (suburb && !streetName) {
        fullStreet = suburb; // Fallback to suburb if no street name
    }

    // A simple heuristic to format Colombian-style addresses if possible
    const parts = osmData.display_name.split(',');
    const simpleAddress = parts.length > 2 ? `${parts[0]}, ${parts[1]}` : parts[0];

    return { prefix, street: streetName ? fullStreet.trim() : simpleAddress };
};


export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    
    // Set default icon
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
        if (mapContainerRef.current && !mapRef.current) { // Only initialize map once
            const map = L.map(mapContainerRef.current).setView(defaultCenter, 15);
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            map.on('click', async (e: L.LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;

                if (markerRef.current) {
                    markerRef.current.setLatLng(e.latlng);
                } else {
                    markerRef.current = L.marker(e.latlng).addTo(map);
                }

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();
                    if (data) {
                        const address = extractAddress(data);
                        if(address) {
                            onLocationSelect(address);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching address from Nominatim:", error);
                }
            });
        }

        // Cleanup function to destroy the map instance
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [onLocationSelect]);

    return (
        <div 
            ref={mapContainerRef} 
            className="h-[400px] w-full rounded-md overflow-hidden bg-muted"
        >
        </div>
    );
}
