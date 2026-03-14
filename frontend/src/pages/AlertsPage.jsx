import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  CircularProgress, Alert, TextField, InputAdornment, IconButton
} from '@mui/material';
import { Warning, Sms, Map, ArrowBack, Refresh, Search, Close } from '@mui/icons-material';
import { getAllShipments, sendSMSAlert } from '../services/api';

export default function AlertsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState({});
  const [searchShipmentId, setSearchShipmentId] = useState('');
  const navigate = useNavigate();

  const normalizedQuery = searchShipmentId.trim().toUpperCase();
  const filteredShipments = shipments.filter((s) => {
    if (!normalizedQuery) return true;
    return String(s.shipment_id || '').toUpperCase().includes(normalizedQuery);
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllShipments();
      const highRisk = (res.data.shipments || []).filter(s => parseFloat(s.risk_score) >= 60);
      setShipments(highRisk);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSMS = async (s) => {
    setSmsStatus(prev => ({ ...prev, [s.shipment_id]: 'sending' }));
    try {
      const recipients = [s.customer_phone, s.driver_phone].filter(Boolean);
      await sendSMSAlert(recipients, s.shipment_id, s.reason, s.time_saved_hours || 3);
      setSmsStatus(prev => ({ ...prev, [s.shipment_id]: 'sent' }));
    } catch {
      setSmsStatus(prev => ({ ...prev, [s.shipment_id]: 'failed' }));
    }
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <CircularProgress sx={{ color: '#ef4444' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.5)' }}>Back</Button>
        <Warning sx={{ color: '#ef4444', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Delay Alerts</Typography>
        <Chip label={`${filteredShipments.length} / ${shipments.length} High Risk`} sx={{ background: '#ef444422', color: '#ef4444', fontWeight: 700 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<Refresh />} onClick={fetchData} sx={{ color: '#6366f1' }}>Refresh</Button>
      </Box>

      <Box sx={{ mb: 3, maxWidth: 420 }}>
        <TextField
          fullWidth
          size="small"
          value={searchShipmentId}
          onChange={(e) => setSearchShipmentId(e.target.value.toUpperCase())}
          placeholder="Search Shipment ID (e.g., SHP1003)"
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(17,24,39,0.9)',
              '& fieldset': { borderColor: '#6366f155' },
              '&:hover fieldset': { borderColor: '#6366f1aa' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1' }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
            endAdornment: searchShipmentId ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchShipmentId('')}
                  sx={{ color: 'rgba(255,255,255,0.6)' }}
                  aria-label="Clear shipment search"
                >
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>

      {shipments.length === 0 ? (
        <Alert severity="success" sx={{ maxWidth: 500 }}>No high-risk shipments currently. All good! ✅</Alert>
      ) : filteredShipments.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 500 }}>
          No high-risk shipment found for "{normalizedQuery}".
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 800 }}>
          {filteredShipments.map(s => {
            const riskScore = parseFloat(s.risk_score);
            const riskColor = riskScore >= 80 ? '#ef4444' : '#f59e0b';
            const sms = smsStatus[s.shipment_id];
            return (
              <Card key={s.shipment_id} sx={{
                background: 'rgba(17,24,39,0.9)', border: `1px solid ${riskColor}44`,
                boxShadow: `0 0 20px ${riskColor}11`
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Warning sx={{ color: riskColor, fontSize: 18 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: riskColor }}>{s.shipment_id}</Typography>
                        <Chip label={`${riskScore}% Risk`} size="small"
                          sx={{ background: `${riskColor}22`, color: riskColor, fontWeight: 800 }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.3 }}>
                        🛣️ {s.origin} → {s.destination} • {s.carrier}
                      </Typography>
                      <Typography variant="body2" sx={{ color: riskColor, fontWeight: 600, mb: 0.3 }}>
                        ⚠ Reason: {s.reason || 'High risk detected'}
                      </Typography>
                      {s.alternate_route && s.alternate_route !== 'N/A' && (
                        <Typography variant="caption" sx={{ color: '#22c55e' }}>
                          ✨ Suggested: {s.alternate_route}
                          {s.time_saved_hours > 0 ? ` (saves ${s.time_saved_hours}h)` : ''}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Button size="small" variant="outlined" startIcon={<Map />}
                        onClick={() => navigate(`/map/${s.shipment_id}`)}
                        sx={{ borderColor: '#6366f155', color: '#6366f1' }}>Map</Button>
                      <Button size="small" variant="contained" startIcon={<Sms />}
                        onClick={() => handleSMS(s)}
                        disabled={sms === 'sending' || sms === 'sent'}
                        sx={{ background: sms === 'sent' ? '#22c55e' : '#f59e0b', '&:hover': { opacity: 0.9 } }}>
                        {sms === 'sending' ? 'Sending...' : sms === 'sent' ? 'Sent ✓' : 'Send SMS'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
