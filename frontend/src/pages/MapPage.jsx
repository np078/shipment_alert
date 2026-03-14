import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import { ArrowBack, LocalShipping, Warning } from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import { getShipment } from '../services/api';

mapboxgl.accessToken = 'pk.eyJ1IjoiYW5raXRyYXRob3JlMTgiLCJhIjoiY21tbTl0ZGtzMTJtaDJxc2I3N25idThnZSJ9.ijol3uzYPUkz7MDWvpLEGQ';

// City coordinates
const CITY_COORDS = {
  Mumbai: [72.8777, 19.0760], Delhi: [77.1025, 28.7041], Chennai: [80.2707, 13.0827],
  Bangalore: [77.5946, 12.9716], Kolkata: [88.3639, 22.5726], Hyderabad: [78.4867, 17.3850],
  Pune: [73.8567, 18.5204], Ahmedabad: [72.5714, 23.0225], Jaipur: [75.7873, 26.9124],
  Lucknow: [80.9462, 26.8467], Goa: [74.1240, 15.2993], Surat: [72.8311, 21.1702],
  Agra: [78.0081, 27.1767], Bhopal: [77.4126, 23.2599]
};

function getCoords(city) {
  return CITY_COORDS[city] || [78.9629, 20.5937];
}

// Generate intermediate truck waypoints along the route
function generateWaypoints(start, end, count = 10) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Add slight randomness for realistic path
    const jitter = (Math.random() - 0.5) * 0.5;
    pts.push([
      start[0] + (end[0] - start[0]) * t + jitter,
      start[1] + (end[1] - start[1]) * t + jitter * 0.5
    ]);
  }
  return pts;
}

export default function MapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [truckStep, setTruckStep] = useState(0);
  const [waypoints, setWaypoints] = useState([]);
  const animRef = useRef(null);

  useEffect(() => {
    getShipment(id).then(res => {
      setShipment(res.data.shipment);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!shipment || !mapContainer.current) return;

    const origin = getCoords(shipment.origin);
    const dest = getCoords(shipment.destination);
    const current = [parseFloat(shipment.current_lng), parseFloat(shipment.current_lat)];
    const pts = generateWaypoints(origin, dest);
    setWaypoints(pts);

    // Init map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: current,
      zoom: 5.5,
      pitch: 20
    });

    map.current.on('load', () => {
      // Route line
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: pts } }
      });
      map.current.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#6366f1', 'line-width': 3, 'line-opacity': 0.8 }
      });

      // Origin marker (green)
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat(origin)
        .setPopup(new mapboxgl.Popup().setHTML(`<b>📍 Origin</b><br>${shipment.origin}`))
        .addTo(map.current);

      // Destination marker (red)
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(dest)
        .setPopup(new mapboxgl.Popup().setHTML(`<b>🏁 Destination</b><br>${shipment.destination}`))
        .addTo(map.current);

      // Truck marker (custom)
      const el = document.createElement('div');
      el.innerHTML = '🚛';
      el.style.cssText = 'font-size:28px;cursor:pointer;filter:drop-shadow(0 0 8px #6366f1);animation:pulse 1.5s ease-in-out infinite;';
      const style = document.createElement('style');
      style.textContent = `@keyframes pulse{0%,100%{filter:drop-shadow(0 0 8px #6366f1)}50%{filter:drop-shadow(0 0 16px #6366f1)}}`;
      document.head.appendChild(style);

      marker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(pts[0])
        .setPopup(new mapboxgl.Popup().setHTML(`<b>🚛 Truck</b><br>${shipment.shipment_id}`))
        .addTo(map.current);

      // Animate truck VERY SLOWLY
      let step = 0;
      const animate = () => {
        if (step < pts.length - 1) {
          step++;
          setTruckStep(step);
          const currentPos = pts[step];
          marker.current.setLngLat(currentPos);
          
          // Update location in database every 5 steps
          if (step % 5 === 0) {
            fetch(`/api/shipments/${shipment.shipment_id}/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: currentPos[1], lng: currentPos[0] })
            }).catch(err => console.warn('Location sync failed:', err));
          }
          
          animRef.current = setTimeout(animate, 15000); // 15 seconds per move - VERY SLOW
        }
      };
      setTimeout(animate, 2000);
    });

    return () => {
      if (animRef.current) clearTimeout(animRef.current);
      if (map.current) map.current.remove();
    };
  }, [shipment]);

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  const progress = waypoints.length > 0 ? Math.round((truckStep / (waypoints.length - 1)) * 100) : 0;

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, p: 2,
        background: 'rgba(17,24,39,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)', zIndex: 10
      }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Back</Button>
        <LocalShipping sx={{ color: '#6366f1' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{id} – Live Tracking</Typography>
        <Chip label={`${progress}% Complete`} size="small" sx={{ background: '#6366f122', color: '#6366f1', fontWeight: 700 }} />
        {shipment?.status === 'Delayed' && (
          <Chip icon={<Warning />} label="DELAYED" size="small"
            sx={{ background: '#ef444422', color: '#ef4444', fontWeight: 700 }} />
        )}
      </Box>

      {/* Info strip */}
      <Box sx={{
        display: 'flex', gap: 3, px: 3, py: 1.5,
        background: 'rgba(11,17,28,0.95)', borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap'
      }}>
        {[
          { label: '📍 Origin', value: shipment?.origin },
          { label: '🏁 Destination', value: shipment?.destination },
          { label: '🚛 Carrier', value: shipment?.carrier },
          { label: '📏 Distance', value: `${shipment?.distance_km} km` },
          { label: '⏱ ETA', value: `${shipment?.eta_hours} hours` },
        ].map(item => (
          <Box key={item.label}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Map */}
      <Box ref={mapContainer} sx={{ flex: 1, minHeight: 500 }} />
    </Box>
  );
}
