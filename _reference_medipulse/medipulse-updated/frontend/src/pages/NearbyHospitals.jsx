import React, { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP: Add your Google Maps API key below
//  1. Go to https://console.cloud.google.com
//  2. Enable: "Maps JavaScript API" and "Places API"
//  3. Create an API key and paste it here:
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // ← Replace with real key

export default function NearbyHospitals() {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef([]);

  const [location,     setLocation]     = useState(null);
  const [hospitals,    setHospitals]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [selected,     setSelected]     = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Dynamically load Google Maps script
  useEffect(() => {
    if (window.google) { setScriptLoaded(true); return; }
    if (document.getElementById('gmap-script')) {
      document.getElementById('gmap-script').onload = () => setScriptLoaded(true);
      return;
    }
    const s = document.createElement('script');
    s.id      = 'gmap-script';
    s.src     = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    s.async   = true;
    s.onload  = () => setScriptLoaded(true);
    s.onerror = () => setError('Failed to load Google Maps. Check your API key and make sure Maps JavaScript API + Places API are enabled.');
    document.head.appendChild(s);
  }, []);

  const detectLocation = () => {
    setLoading(true); setError(''); setHospitals([]);
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.'); setLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        initMap(loc);
        searchHospitals(loc);
      },
      () => { setError('Location access denied. Please allow location access in your browser.'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const initMap = (loc) => {
    if (!window.google || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: loc, zoom: 13,
      mapTypeControl: false, streetViewControl: false,
    });
    mapInstance.current = map;
    new window.google.maps.Marker({
      position: loc, map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10, fillColor: '#3b82f6', fillOpacity: 1,
        strokeColor: 'white', strokeWeight: 3,
      },
      title: 'Your Location',
      animation: window.google.maps.Animation.BOUNCE,
    });
  };

  const searchHospitals = (loc) => {
    if (!window.google || !mapInstance.current) return;
    const svc = new window.google.maps.places.PlacesService(mapInstance.current);
    svc.nearbySearch(
      {
        location: new window.google.maps.LatLng(loc.lat, loc.lng),
        radius: 5000,
        type: ['hospital'],
      },
      (results, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
          const list = results.map(r => ({
            id:          r.place_id,
            name:        r.name,
            address:     r.vicinity,
            rating:      r.rating ?? null,
            ratingCount: r.user_ratings_total ?? 0,
            isOpen:      r.opening_hours?.open_now ?? null,
            lat:         r.geometry.location.lat(),
            lng:         r.geometry.location.lng(),
            distance:    haversine(loc.lat, loc.lng, r.geometry.location.lat(), r.geometry.location.lng()),
          })).sort((a, b) => a.distance - b.distance).slice(0, 12);
          setHospitals(list);
          addMarkers(list);
        } else {
          setError('No hospitals found nearby. Try again or check your API key.');
        }
      }
    );
  };

  const addMarkers = (list) => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    list.forEach((h, i) => {
      const marker = new window.google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map: mapInstance.current,
        label:     { text: `${i + 1}`, color: 'white', fontWeight: 'bold', fontSize: '12px' },
        icon: {
          path:         window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale:        8,
          fillColor:    '#dc2626',
          fillOpacity:  1,
          strokeColor:  'white',
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP,
        title:     h.name,
      });
      const iw = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;max-width:200px;padding:4px">
          <b style="font-size:13px">${h.name}</b><br/>
          <span style="color:#6b7280;font-size:12px">${h.address}</span><br/>
          ${h.rating ? `<span style="color:#f59e0b">⭐ ${h.rating}</span> ` : ''}
          <span style="font-size:12px;color:${h.isOpen === true ? '#16a34a' : h.isOpen === false ? '#dc2626' : '#94a3b8'}">${h.isOpen === true ? '✅ Open' : h.isOpen === false ? '❌ Closed' : ''}</span><br/>
          <span style="font-size:12px;color:#3b82f6">📍 ${h.distance.toFixed(1)} km away</span>
        </div>`,
      });
      marker.addListener('click', () => { setSelected(h); iw.open(mapInstance.current, marker); });
      markersRef.current.push(marker);
    });
  };

  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const focusHospital = (h) => {
    setSelected(h);
    if (mapInstance.current) { mapInstance.current.panTo({ lat: h.lat, lng: h.lng }); mapInstance.current.setZoom(15); }
  };

  const navigate = (h) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}&travelmode=driving`, '_blank');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 108px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>

      {/* ── Sidebar list ── */}
      <div style={{ width: 340, background: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f4f8' }}>

        {/* Header */}
        <div style={{ padding: '18px 16px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>📍 Nearby Hospitals</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Powered by Google Maps</div>
        </div>

        {/* Detect button */}
        <div style={{ padding: 14, borderBottom: '1px solid #f0f4f8' }}>
          <button
            onClick={detectLocation}
            disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? '🔍 Searching…' : '📡 Detect Location & Find Hospitals'}
          </button>
          {error && (
            <div style={{ marginTop: 8, color: '#dc2626', fontSize: 12, background: '#fef2f2', padding: '8px 10px', borderRadius: 8 }}>
              {error}
            </div>
          )}
          {GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' && (
            <div style={{ marginTop: 8, color: '#92400e', fontSize: 11, background: '#fffbeb', padding: '8px 10px', borderRadius: 8, border: '1px solid #fde68a' }}>
              ⚠️ Add your Google Maps API key in <code>NearbyHospitals.jsx</code>
            </div>
          )}
        </div>

        {/* Empty state */}
        {hospitals.length === 0 && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#94a3b8', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 52 }}>🏥</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Click above to find hospitals near you</div>
            <div style={{ fontSize: 12 }}>Searches within 5 km using Google Places API</div>
          </div>
        )}

        {/* Hospital list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {hospitals.map((h, i) => (
            <div
              key={h.id}
              onClick={() => focusHospital(h)}
              style={{ padding: '12px 14px', borderBottom: '1px solid #f8fafd', cursor: 'pointer', background: selected?.id === h.id ? '#eff6ff' : 'white', transition: 'background 0.15s' }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dc2626', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1a202c', marginBottom: 2 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{h.address}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {h.rating && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⭐ {h.rating}</span>}
                    <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>📍 {h.distance.toFixed(1)} km</span>
                    {h.isOpen !== null && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: h.isOpen ? '#16a34a' : '#dc2626' }}>
                        {h.isOpen ? '✅ Open' : '❌ Closed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selected?.id === h.id && (
                <button
                  onClick={e => { e.stopPropagation(); navigate(h); }}
                  style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  🗺️ Get Directions
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!scriptLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 12 }}>
            <div style={{ fontSize: 52 }}>🗺️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>Loading Google Maps…</div>
            <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, textAlign: 'center' }}>
              Make sure your API key is added and Maps JavaScript API + Places API are enabled.
            </div>
          </div>
        )}
        {scriptLoaded && !location && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 12 }}>
            <div style={{ fontSize: 64 }}>📍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Map Ready</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Click "Detect Location" to show hospitals on map</div>
          </div>
        )}
      </div>
    </div>
  );
}
