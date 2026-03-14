import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Alert, CircularProgress, MenuItem, Select, InputLabel, FormControl, Chip
} from '@mui/material';
import { ArrowBack, AddBox, Map } from '@mui/icons-material';
import { createShipment, getRouteInfo } from '../services/api';

const CARRIERS = ['DHL', 'FedEx', 'BlueDart', 'DTDC', 'Ekart'];
const CITIES = ['Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Goa'];

export default function AddShipmentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    order_id: '', origin: 'Mumbai', destination: 'Delhi', carrier: 'DHL',
    distance_km: '', eta_hours: '', customer_phone: '', driver_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [routeMessage, setRouteMessage] = useState('');

  // Auto-fetch distance and ETA when origin, destination, or carrier changes
  useEffect(() => {
    if (form.origin && form.destination && form.origin !== form.destination) {
      const fetchRoute = async () => {
        setFetchingRoute(true);
        setRouteMessage('');
        try {
          const res = await getRouteInfo(form.origin, form.destination, form.carrier);
          if (res.data.success) {
            setForm(prev => ({
              ...prev,
              distance_km: res.data.distance_km,
              eta_hours: res.data.eta_hours
            }));
            setRouteMessage(`✅ Distance & ETA calculated for ${form.origin} → ${form.destination}`);
            setTimeout(() => setRouteMessage(''), 3000);
          } else {
            setError('Failed to calculate route');
          }
        } catch (err) {
          console.error('Route calculation error:', err);
        }
        setFetchingRoute(false);
      };
      
      // Add slight delay to avoid too many requests while typing
      const timer = setTimeout(fetchRoute, 500);
      return () => clearTimeout(timer);
    }
  }, [form.origin, form.destination, form.carrier]);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await createShipment(form);
      setSuccess(`✅ Shipment ${res.data.shipment.shipment_id} created successfully!`);
      setForm({
        order_id: '', origin: 'Mumbai', destination: 'Delhi', carrier: 'DHL',
        distance_km: '', eta_hours: '', customer_phone: '', driver_phone: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.5)' }}>Back</Button>
        <AddBox sx={{ color: '#6366f1' }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Add New Shipment</Typography>
      </Box>

      <Card sx={{ maxWidth: 600, background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <CardContent sx={{ p: 3 }}>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {routeMessage && (
            <Alert severity="info" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Map sx={{ fontSize: 18 }} /> {routeMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Order ID" value={form.order_id}
                  onChange={handleChange('order_id')} placeholder="ORD2024001" />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Origin</InputLabel>
                  <Select value={form.origin} onChange={handleChange('origin')} label="Origin">
                    {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Destination</InputLabel>
                  <Select value={form.destination} onChange={handleChange('destination')} label="Destination">
                    {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Carrier</InputLabel>
                  <Select value={form.carrier} onChange={handleChange('carrier')} label="Carrier">
                    {CARRIERS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Distance (km)" type="number" value={form.distance_km}
                  onChange={handleChange('distance_km')} required
                  disabled={fetchingRoute}
                  helperText={fetchingRoute ? "Calculating..." : form.distance_km ? "Auto-calculated ✓" : ""}
                  InputProps={{
                    endAdornment: fetchingRoute && <CircularProgress size={20} />,
                  }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="ETA (hours)" type="number" value={form.eta_hours}
                  onChange={handleChange('eta_hours')} required
                  disabled={fetchingRoute}
                  helperText={fetchingRoute ? "Calculating..." : form.eta_hours ? "Auto-calculated ✓" : ""}
                  InputProps={{
                    endAdornment: fetchingRoute && <CircularProgress size={20} />,
                  }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Customer Phone" value={form.customer_phone}
                  onChange={handleChange('customer_phone')} placeholder="9876543210" required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Driver Phone" value={form.driver_phone}
                  onChange={handleChange('driver_phone')} placeholder="9876543211" required />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  sx={{
                    py: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                  }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Shipment'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
