import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Avatar, IconButton, Tooltip
} from '@mui/material';
import {
  LocalShipping, Warning, CheckCircle, DirectionsBoat,
  Map, Logout, AddBox, Notifications, TrendingUp, Refresh
} from '@mui/icons-material';
import { getAllShipments } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RISK_COLORS = {
  high: { bg: '#ef444422', border: '#ef4444', text: '#ef4444', label: 'HIGH' },
  medium: { bg: '#f59e0b22', border: '#f59e0b', text: '#f59e0b', label: 'MEDIUM' },
  low: { bg: '#22c55e22', border: '#22c55e', text: '#22c55e', label: 'LOW' }
};

function getRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllShipments();
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  const stats = data?.stats || {};
  const shipments = data?.shipments || [];
  const highRisk = shipments.filter(s => parseFloat(s.risk_score) >= 70).length;

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 240, background: 'rgba(17,24,39,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', p: 2, gap: 0.5, flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <LocalShipping sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>ShipAlert</Typography>
        </Box>
        {[
          { label: 'Dashboard', icon: <TrendingUp />, path: '/dashboard', active: true },
          { label: 'Add Shipment', icon: <AddBox />, path: '/add-shipment' },
          { label: 'Alerts', icon: <Notifications />, path: '/alerts' },
          { label: 'Track Shipment', icon: <Map />, path: '/track' },
        ].map(item => (
          <Button key={item.label} startIcon={item.icon} onClick={() => navigate(item.path)}
            sx={{
              justifyContent: 'flex-start', color: item.active ? '#6366f1' : 'rgba(255,255,255,0.5)',
              background: item.active ? 'rgba(99,102,241,0.1)' : 'transparent',
              borderRadius: 2, py: 1.2, px: 2, gap: 1,
              '&:hover': { background: 'rgba(99,102,241,0.1)', color: '#6366f1' }
            }}>{item.label}</Button>
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Logged in as</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
          <Chip label="Admin" size="small" sx={{ mt: 0.5, background: '#6366f122', color: '#6366f1', height: 20 }} />
        </Box>
        <Button startIcon={<Logout />} onClick={logout} sx={{ color: '#ef4444', justifyContent: 'flex-start' }}>Logout</Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Command Center</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>Real-time shipment monitoring</Typography>
          </Box>
          <Tooltip title="Refresh"><IconButton onClick={fetchData} sx={{ color: '#6366f1' }}><Refresh /></IconButton></Tooltip>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Shipments', value: stats.total || 0, icon: <LocalShipping />, color: '#6366f1' },
            { label: 'In Transit', value: stats.inTransit || 0, icon: <DirectionsBoat />, color: '#3b82f6' },
            { label: 'Delayed', value: stats.delayed || 0, icon: <Warning />, color: '#ef4444' },
            { label: 'High Risk', value: highRisk, icon: <Notifications />, color: '#f59e0b' },
            { label: 'On Time', value: stats.onTime || 0, icon: <CheckCircle />, color: '#22c55e' },
          ].map((stat) => (
            <Grid item xs={12} sm={6} md={2.4} key={stat.label}>
              <Card sx={{
                background: 'rgba(17,24,39,0.9)', border: `1px solid ${stat.color}33`,
                '&:hover': { border: `1px solid ${stat.color}88`, transform: 'translateY(-2px)' },
                transition: 'all 0.2s'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</Typography>
                      <Typography variant="h4" sx={{ color: stat.color, fontWeight: 800 }}>{stat.value}</Typography>
                    </Box>
                    <Avatar sx={{ background: `${stat.color}22`, color: stat.color, width: 40, height: 40 }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Shipments Table */}
        <Card sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Active Shipments</Typography>
              <Button size="small" variant="outlined" onClick={() => navigate('/add-shipment')}
                startIcon={<AddBox />} sx={{ borderColor: '#6366f1', color: '#6366f1' }}>
                Add Shipment
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 12, py: 1.5 } }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Carrier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipments.map((s) => {
                    const riskScore = parseFloat(s.risk_score) || 0;
                    const level = getRiskLevel(riskScore);
                    const col = RISK_COLORS[level];
                    return (
                      <TableRow key={s.shipment_id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 700, color: '#6366f1', fontSize: 13 }}>{s.shipment_id}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.origin} → {s.destination}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{s.carrier}</TableCell>
                        <TableCell>
                          <Chip label={s.status} size="small" sx={{
                            fontSize: 10,
                            background: s.status === 'Delayed' ? '#ef444422' : s.status === 'On Time' ? '#22c55e22' : '#3b82f622',
                            color: s.status === 'Delayed' ? '#ef4444' : s.status === 'On Time' ? '#22c55e' : '#3b82f6'
                          }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{
                              px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700,
                              background: col.bg, color: col.text, border: `1px solid ${col.border}44`
                            }}>
                              {riskScore > 0 ? `${riskScore}%` : 'N/A'}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 150 }}>
                          {s.reason || '—'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button size="small" variant="outlined" onClick={() => navigate(`/shipment/${s.shipment_id}`)}
                              sx={{ fontSize: 10, py: 0.3, borderColor: '#6366f155', color: '#6366f1', minWidth: 0 }}>
                              View
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => navigate(`/map/${s.shipment_id}`)}
                              sx={{ fontSize: 10, py: 0.3, borderColor: '#3b82f655', color: '#3b82f6', minWidth: 0 }}>
                              Map
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
