
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface LocationPickerProps {
  onLocationSelect: (address: { prefix: string, street: string }) => void;
}

const defaultCenter: L.LatLngExpression = [3.423, -76.324];

const addressPrefixMap: { [key: string]: string[] } = {
    CLL: ['calle', 'cll'],
    CRA: ['carrera', 'cra', 'cr', 'carr'],
    AV: ['avenida', 'av', 'ave'],
    DG: ['diagonal', 'dg'],
    TR: ['transversal', 'tr', 'trv', 'tv'],
    AUT: ['autopista', 'aut'],
    KM: ['kilómetro', 'km'],
    AC: ['avenida calle', 'ac'],
    AK: ['avenida carrera', 'ak'],
};

const extractAddress = (osmData: any): { prefix: string, street: string } | null => {
    if (!osmData || !osmData.display_name) return null;

    const displayName = osmData.display_name.toLowerCase();
    const parts = displayName.split(',').map(p => p.trim());
    
    // Find parts that look like streets/avenues
    const streetParts = parts.filter(p => /\d/.test(p) && (p.includes('calle') || p.includes('carrera') || p.includes('avenida')));

    let prefix = 'CLL'; 
    let street = parts[0] || ''; 
    
    if (streetParts.length >= 1) {
        street = streetParts.join(' con ');
        // Clean up street names
        street = street.replace(/calle/g, 'Calle')
                       .replace(/carrera/g, 'Carrera')
                       .replace(/avenida/g, 'Avenida')
                       .replace(/\s+/g, ' ').trim();
        
        // Determine prefix based on the first street part
        const firstStreet = streetParts[0];
        for (const [key, keywords] of Object.entries(addressPrefixMap)) {
            if (keywords.some(kw => firstStreet.includes(kw))) {
                prefix = key;
                break;
            }
        }
    } else if (osmData.address) {
        const { road, highway, suburb } = osmData.address;
        street = road || highway || suburb || street;
        if (highway) prefix = 'CRA';
    }

    // Capitalize words
    street = street.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


    return { prefix, street };
};


export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
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
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
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
