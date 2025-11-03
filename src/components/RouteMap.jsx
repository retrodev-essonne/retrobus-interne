import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box } from '@chakra-ui/react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for route visualization
const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const waypointIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to fit bounds
function FitBounds({ waypoints }) {
  const map = useMap();
  
  useEffect(() => {
    if (waypoints && waypoints.length > 0) {
      const coords = waypoints.map(wp => [wp.lat, wp.lng]);
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [waypoints, map]);

  return null;
}

/**
 * RouteMap - Visualize itinerary on interactive map
 * Shows waypoints, route path, and distance calculation
 */
export default function RouteMap({ route }) {
  if (!route || !route.waypoints || route.waypoints.length === 0) {
    return (
      <Box p={4} bg="gray.50" borderRadius="md" textAlign="center" color="gray.500">
        Pas de waypoints à afficher
      </Box>
    );
  }

  const waypoints = route.waypoints.sort((a, b) => a.order - b.order);
  const coordinates = waypoints.map(wp => [wp.lat, wp.lng]);

  return (
    <Box borderRadius="md" overflow="hidden" boxShadow="md" h="500px">
      <MapContainer
        center={[waypoints[0].lat, waypoints[0].lng]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Route line */}
        <Polyline
          positions={coordinates}
          color="purple"
          weight={4}
          opacity={0.8}
          dashArray="5, 5"
        />

        {/* Waypoints markers */}
        {waypoints.map((wp, idx) => (
          <Marker
            key={wp.order}
            position={[wp.lat, wp.lng]}
            icon={idx === 0 ? startIcon : idx === waypoints.length - 1 ? endIcon : waypointIcon}
          >
            <Popup>
              <div style={{ fontSize: '12px', minWidth: '150px' }}>
                <strong>{wp.name}</strong><br />
                Lat: {wp.lat.toFixed(4)}, Lng: {wp.lng.toFixed(4)}<br />
                {wp.stopTime > 0 && <span>Arrêt: {wp.stopTime} min<br /></span>}
                <small>Point {idx + 1}/{waypoints.length}</small>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Auto-fit bounds */}
        <FitBounds waypoints={waypoints} />
      </MapContainer>
    </Box>
  );
}
