import React, { useEffect, useRef } from 'react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyAiq6cnKih8GmQCTXzAW0qu71u0ks';

// ── Google Maps script loader (singleton) ──
let loadingPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=geometry&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export default function DriverMap({ position, accuracy, deliveries, driverId }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const accuracyCircle = useRef(null);
  const deliveryMarkers = useRef([]);
  const followRef = useRef(true);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    loadGoogleMaps().then(() => {
      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: -28.7833, lng: 32.0167 },
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });
    });

    return () => {
      if (map.current) {
        map.current = null;
      }
    };
  }, []);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !position) return;

    const pos = { lat: position.lat, lng: position.lng };

    // Remove old accuracy circle
    if (accuracyCircle.current) {
      accuracyCircle.current.setMap(null);
      accuracyCircle.current = null;
    }

    // Add accuracy circle
    if (accuracy && accuracy > 0) {
      accuracyCircle.current = new google.maps.Circle({
        center: pos,
        radius: accuracy,
        map: map.current,
        fillColor: '#2563eb',
        fillOpacity: 0.08,
        strokeColor: '#2563eb',
        strokeOpacity: 0.2,
        strokeWeight: 1,
      });
    }

    // Update or create user marker
    if (userMarker.current) {
      userMarker.current.setPosition(pos);
    } else {
      userMarker.current = new google.maps.Marker({
        position: pos,
        map: map.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 1000,
        title: 'You',
      });
    }

    // Follow user — smooth pan
    if (followRef.current) {
      map.current.panTo(pos);
    }
  }, [position, accuracy]);

  // Update delivery markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    deliveryMarkers.current.forEach(m => m.setMap(null));
    deliveryMarkers.current = [];

    deliveries.forEach(d => {
      if (!d.lat || !d.lng) return;

      const color = statusColor(d.status);
      const pos = { lat: d.lat, lng: d.lng };

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="3"/>
        <text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="700">${d.id}</text>
      </svg>`;

      const marker = new google.maps.Marker({
        position: pos,
        map: map.current,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(svg),
          anchor: new google.maps.Point(14, 14),
        },
        title: d.customer_name,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:-apple-system,sans-serif;padding:4px;max-width:220px;">
            <strong>${escapeHtml(d.customer_name)}</strong><br/>
            ${escapeHtml(d.customer_address || '')}<br/>
            <span style="font-size:11px;text-transform:uppercase;color:#666;">
              ${d.status.replace('_', ' ')}
            </span>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
      });

      deliveryMarkers.current.push(marker);
    });
  }, [deliveries]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}

function statusColor(status) {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'en_route': return '#2563eb';
    case 'delivered': return '#22c55e';
    case 'problem': return '#ef4444';
    default: return '#94a3b8';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
