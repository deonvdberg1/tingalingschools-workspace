import React, { useState, useEffect, useRef, useCallback } from 'react';
import DriverMap from './DriverMap.jsx';
import DeliveryList from './DeliveryList.jsx';

// Use current origin — works on localhost and deployed
const API_BASE = window.location.origin;
const FOREGROUND_INTERVAL = 3000;  // 3 seconds
const BACKGROUND_INTERVAL = 30000; // 30 seconds

export default function App() {
  const [setup, setSetup] = useState(() => {
    try {
      const saved = localStorage.getItem('ae_driver_setup');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Starting GPS...');
  const [logs, setLogs] = useState([]);

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSentRef = useRef(null);
  const positionRef = useRef(null);

  // Page Visibility API
  useEffect(() => {
    const handler = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const addLog = useCallback((msg) => {
    setLogs(prev => {
      const next = [...prev, { time: new Date().toLocaleTimeString(), msg }];
      return next.slice(-50);
    });
  }, []);

  // Send position to server
  const sendPosition = useCallback((pos) => {
    if (!setup || !pos) return;

    const payload = {
      client_id: setup.clientId,
      driver_id: setup.driverId,
      lat: pos.lat,
      lng: pos.lng,
      speed: pos.speed || 0,
      accuracy: pos.accuracy || 0,
      timestamp: Date.now(),
    };

    fetch(`${API_BASE}/api/tracking/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(data => {
        lastSentRef.current = Date.now();
      })
      .catch(err => {
        // Silently fail — GPS will retry
      });
  }, [setup]);

  // Start/restart GPS watch
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS not available on this device');
      setStatusMessage('GPS not available');
      return;
    }

    setStatusMessage('Requesting location permission...');

    // Stop existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed || 0,
          accuracy: pos.coords.accuracy || 0,
          heading: pos.coords.heading,
        };
        setPosition(p);
        setAccuracy(pos.coords.accuracy);
        setGpsActive(true);
        setError(null);
        positionRef.current = p;
        setStatusMessage('GPS active');

        // Send immediately on first position
        if (!lastSentRef.current) {
          sendPosition(p);
        }
      },
      (err) => {
        const messages = {
          1: 'Permission denied — enable location in settings',
          2: 'GPS unavailable — check your device',
          3: 'GPS timed out — try again',
        };
        setError(messages[err.code] || `GPS error ${err.code}`);
        setGpsActive(false);
        setStatusMessage('GPS error');
        addLog(`GPS error: ${messages[err.code] || err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );
  }, [sendPosition, addLog]);

  // Periodic sending based on visibility
  useEffect(() => {
    if (!setup) return;

    // Start GPS watch
    startGPS();

    // Periodic send interval
    const interval = isVisible ? FOREGROUND_INTERVAL : BACKGROUND_INTERVAL;
    
    const tick = () => {
      if (positionRef.current) {
        sendPosition(positionRef.current);
        addLog(`Sent position (${isVisible ? 'foreground' : 'background'})`);
      }
    };

    intervalRef.current = setInterval(tick, interval);
    addLog(`Started ${isVisible ? '3s' : '30s'} interval`);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setup, isVisible, startGPS, sendPosition, addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch deliveries
  useEffect(() => {
    if (!setup) return;
    
    const fetchDeliveries = () => {
      fetch(`${API_BASE}/api/tracking/deliveries/${setup.clientId}`)
        .then(r => r.json())
        .then(data => setDeliveries(data))
        .catch(() => {});
    };

    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, [setup]);

  // Update delivery status
  const updateDeliveryStatus = (id, status, notes = '') => {
    fetch(`${API_BASE}/api/tracking/deliveries/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        driver_id: setup.driverId,
        notes,
      }),
    })
      .then(r => r.json())
      .then(updated => {
        setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
        addLog(`Delivery ${id} → ${status}`);
      })
      .catch(err => addLog(`Status update failed: ${err.message}`));
  };

  // Setup screen
  if (!setup) {
    return <SetupScreen onSetup={(s) => {
      localStorage.setItem('ae_driver_setup', JSON.stringify(s));
      setSetup(s);
    }} />;
  }

  return (
    <div className="app">
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${gpsActive ? '' : 'inactive'}`} />
          <span>{statusMessage}</span>
        </div>
        {accuracy && (
          <span className="accuracy-badge">±{Math.round(accuracy)}m</span>
        )}
      </div>

      {/* Map */}
      <div className="map-container">
        <DriverMap 
          position={position} 
          accuracy={accuracy}
          deliveries={deliveries}
          driverId={setup.driverId}
        />
      </div>

      {/* Delivery list */}
      <DeliveryList 
        deliveries={deliveries}
        onUpdateStatus={updateDeliveryStatus}
      />
    </div>
  );
}

function SetupScreen({ onSetup }) {
  const [clientId, setClientId] = useState('');
  const [driverId, setDriverId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId || !driverId) return;
    onSetup({
      clientId: parseInt(clientId),
      driverId: driverId.trim(),
    });
  };

  return (
    <div className="setup-screen">
      <div style={{ fontSize: 64, marginBottom: 8 }}>🚚</div>
      <h1>AutoEffortless<br />Driver</h1>
      <p>Enter your client code and driver ID to start tracking deliveries.</p>
      <form className="setup-form" onSubmit={handleSubmit}>
        <div>
          <label>Client Code</label>
          <input
            type="number"
            placeholder="e.g. 1"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label>Driver ID</label>
          <input
            type="text"
            placeholder="e.g. driver-1"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!clientId || !driverId}
        >
          Start Tracking
        </button>
      </form>
    </div>
  );
}
