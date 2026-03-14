import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, Divider, Tabs, Tab
} from '@mui/material';
import { Email, Lock, LocalShipping, Security } from '@mui/icons-material';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.data.success) {
        loginSuccess(res.data.token, res.data.user);
        navigate(res.data.user.role === 'admin' ? '/dashboard' : '/track');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b3e 50%, #0a0e1a 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <Box sx={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        top: -100, left: -100, animation: 'pulse 4s ease-in-out infinite',
        '@keyframes pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } }
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
        bottom: -100, right: -50
      }} />

      <Card sx={{
        width: { xs: '90%', sm: 440 }, position: 'relative', zIndex: 1,
        background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex', p: 2, borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              mb: 2, boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
            }}>
              <LocalShipping sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>
              ShipAlert
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              AI-Powered Early Warning System
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
            Sign In to Your Account
          </Typography>

          <Tabs 
            value={loginMode} 
            onChange={(e, val) => {
              setLoginMode(val);
              setError('');
              setEmail('');
              setPassword('');
            }}
            centered
            sx={{ mb: 3, '& .MuiTabs-indicator': { backgroundColor: '#6366f1' } }}
          >
            <Tab label="User Login" value="user" sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: '#fff' } }} />
            <Tab label="Admin Login" value="admin" sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: '#fff' } }} />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth label="Email Address" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              sx={{
                py: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                boxShadow: '0 8px 20px rgba(99,102,241,0.4)'
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
            </Button>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
            
          </Box>

          <Divider sx={{ my: 3, color: 'rgba(255,255,255,0.2)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <Security sx={{ fontSize: 12, mr: 0.5 }} />Demo Credentials
            </Typography>
          </Divider>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
            {[
              { label: 'Admin Demo Credentials', email: 'admin@infinite.com', pass: 'admin123', color: '#6366f1', type: 'admin' },
              { label: 'User Demo Credentials', email: 'user@infinite.com', pass: 'user123', color: '#22c55e', type: 'user' }
            ].filter(cred => cred.type === loginMode).map(cred => (
              <Box key={cred.label} onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                  border: `1px solid ${cred.color}33`,
                  background: `${cred.color}11`,
                  '&:hover': { background: `${cred.color}22` }, transition: 'all 0.2s'
                }}>
                <Typography variant="caption" sx={{ color: cred.color, fontWeight: 700, display: 'block' }}>
                  {cred.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                  {cred.email}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
