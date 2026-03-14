import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Card, CardContent,
  CircularProgress, Alert, InputAdornment
} from '@mui/material';
import { Search, LocalShipping, Logout, Map, Dashboard } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function TrackShipmentPage() {
  const [shipmentId, setShipmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleTrack = (e) => {
    e.preventDefault();
    if (!shipmentId.trim()) { setError('Enter a Shipment ID'); return; }
    setError('');
    navigate(`/shipment/${shipmentId.trim().toUpperCase()}`);
  };

  const demoIds = ['SHP1001', 'SHP1003', 'SHP1008', 'SHP1013'];

  return (
    <Box sx={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Top bar */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping sx={{ color: '#6366f1' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>ShipAlert</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isAdmin && (
            <Button startIcon={<Dashboard />} onClick={() => navigate('/dashboard')} size="small"
              sx={{ color: '#6366f1' }}>Dashboard</Button>
          )}
          <Button startIcon={<Logout />} onClick={logout} size="small" sx={{ color: '#ef4444' }}>Logout</Button>
        </Box>
      </Box>

      {/* Background glow */}
      <Box sx={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)'
      }} />

      <Card sx={{
        width: { xs: '90%', sm: 500 }, position: 'relative', zIndex: 1,
        background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex', p: 2.5, borderRadius: 3, mb: 2,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%,100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-6px)' }
              }
            }}>
              <LocalShipping sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Track Your Shipment</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5 }}>
              Hello {user?.name}! Enter your shipment ID below.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleTrack}>
            <TextField
              fullWidth label="Shipment ID" placeholder="e.g. SHP1001"
              value={shipmentId} onChange={e => setShipmentId(e.target.value.toUpperCase())}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: '#6366f1' }} /></InputAdornment>,
                style: { fontSize: 18, fontWeight: 600, letterSpacing: 2 }
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{
                py: 1.5, mb: 3,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
              }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Track Shipment'}
            </Button>
          </Box>

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mb: 1 }}>
            Quick Demo IDs:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {demoIds.map(id => (
              <Button key={id} size="small" onClick={() => setShipmentId(id)}
                sx={{
                  fontSize: 11, px: 1.5, py: 0.5,
                  border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1',
                  borderRadius: 1, '&:hover': { background: 'rgba(99,102,241,0.1)' }
                }}>
                {id}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
