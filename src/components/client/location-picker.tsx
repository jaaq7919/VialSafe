"use client";

import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

// Default coordinates for Florida, Valle del Cauca
const defaultCenter = {
  lat: 3.423,
  lng: -76.324
};

// Define address component types for geocoding response
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodingResult {
  address_components: AddressComponent[];
  formatted_address: string;
}

interface LocationPickerProps {
  onLocationSelect: (address: { prefix: string, street: string }) => void;
  apiKey: string;
}

const addressPrefixMap: { [key: string]: string } = {
    'street_number': '',
    'route': 'CLL',
    'intersection': 'CRA',
    'political': '',
    'country': '',
    'administrative_area_level_1': '',
    'administrative_area_level_2': '',
    'locality': '',
    'postal_code': '',
    'neighborhood': '',
};

const extractAddress = (place: GeocodingResult): { prefix: string, street: string } | null => {
    if (!place.address_components) return null;

    let streetName = '';
    let streetNumber = '';
    let route = '';
    
    // A simplified approach to find a common street name format
    const routeComponent = place.address_components.find(c => c.types.includes('route'));
    if (routeComponent) {
        // Try to match common patterns like "Calle X" or "Carrera Y"
        const match = routeComponent.long_name.match(/^(Calle|Carrera|Avenida|Transversal|Diagonal)\s*(.*)/i);
        if (match) {
            const prefixLookup: { [key: string]: string } = {
                'calle': 'CLL',
                'carrera': 'CRA',
                'avenida': 'AV',
                'transversal': 'TR',
                'diagonal': 'DG',
            };
            const prefix = prefixLookup[match[1].toLowerCase()] || 'CLL';
            const restOfAddress = match[2];
            return { prefix, street: restOfAddress };
        }
    }
    
    // Fallback if no clear pattern is found, use formatted address minus city/country
    const formatted = place.formatted_address.split(',')[0];
    return { prefix: 'CLL', street: formatted || 'Dirección no encontrada' };
};


export default function LocationPicker({ onLocationSelect, apiKey }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarker({ lat, lng });

    // Use Geocoding API to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = extractAddress(results[0]);
        if(address) {
            onLocationSelect(address);
        }
      } else {
        console.error('Geocoder failed due to: ' + status);
      }
    });
  }, [onLocationSelect]);

  if (loadError) {
    return <div>Error al cargar el mapa. Verifique la clave de API de Google Maps.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={15}
      onClick={handleMapClick}
    >
      {marker && <Marker position={marker} />}
    </GoogleMap>
  ) : <div className="h-[400px] w-full bg-muted rounded-md flex items-center justify-center">Cargando mapa...</div>;
}
