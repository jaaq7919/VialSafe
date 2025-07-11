
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const MapController = ({ onLocationSelect }: LocationPickerProps) => {
    const [marker, setMarker] = useState<L.LatLng | null>(null);
    
    const handleMapClick = useCallback(async (latlng: L.LatLng) => {
        setMarker(latlng);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
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
    }, [onLocationSelect]);

    useMapEvents({
        click(e) {
            handleMapClick(e.latlng);
        },
    });

    return marker ? <Marker position={marker}></Marker> : null;
}


export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
    useEffect(() => {
        // This is a common workaround for a known issue with Webpack and Leaflet's default icon.
        // It manually sets the paths for the marker icons.
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
        });
    }, []);

    const displayMap = useMemo(
        () => (
            <MapContainer center={defaultCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapController onLocationSelect={onLocationSelect} />
            </MapContainer>
        ),
        // By removing dependencies, we ensure this only runs once.
        // The onLocationSelect function is passed down to the controller.
        [onLocationSelect]
    );

    return (
        <div className="h-[400px] w-full rounded-md overflow-hidden bg-muted">
            {displayMap}
        </div>
    );
}
