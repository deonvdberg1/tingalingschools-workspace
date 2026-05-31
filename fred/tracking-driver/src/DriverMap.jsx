import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Use OpenFreeMap style JSON directly — the tile URL approach doesn't work
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_CENTER = [32.0167, -28.7833]; // Richards Bay — MapLibre uses [lng, lat] order
const DEFAULT_ZOOM = 14;

export default function DriverMap({ position, accuracy, deliveries, driverId }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const accuracyCircle = useRef(null);
  const deliveryMarkers = useRef([]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update user position marker
  useEffect(() => {
    if (!map.current || !position) return;

    const { lat, lng } = position;

    // Remove old accuracy circle
    if (accuracyCircle.current) {
      accuracyCircle.current.remove();
      accuracyCircle.current = null;
    }

    // Add accuracy circle
    if (accuracy && accuracy > 0) {
      accuracyCircle.current = new maplibregl.Marker({
        element: createAccuracyElement(accuracy),
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Update or create user marker
    if (userMarker.current) {
      userMarker.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div style="
          width: 20px; height: 20px; 
          background: #2563eb; 
          border: 3px solid white; 
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
        "></div>
      `;
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Smoothly pan to follow user
    map.current.panTo([lng, lat], { duration: 500 });
  }, [position, accuracy]);

  // Update delivery markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    deliveryMarkers.current.forEach(m => m.remove());
    deliveryMarkers.current = [];

    deliveries.forEach(d => {
      if (!d.lat || !d.lng) return;

      const color = statusColor(d.status);
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 24px; height: 24px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${d.id}</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([d.lng, d.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <strong>${d.customer_name}</strong><br/>
              ${d.customer_address || ''}<br/>
              <span style="font-size:11px;text-transform:uppercase;color:#666">
                ${d.status.replace('_', ' ')}
              </span>
            `)
        )
        .addTo(map.current);

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

function createAccuracyElement(radius) {
  const el = document.createElement('div');
  const size = Math.min(Math.max(radius * 2, 20), 400);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.background = 'rgba(37, 99, 235, 0.1)';
  el.style.border = '1px solid rgba(37, 99, 235, 0.3)';
  el.style.pointerEvents = 'none';
  el.style.transform = `translate(-50%, -50%)`;
  return el;
}
