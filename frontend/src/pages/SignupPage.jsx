import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, MenuItem
} from '@mui/material';
import { Email, Lock, Person, Phone, LocalShipping } from '@mui/icons-material';
import { signup } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signup(formData);
      if (res.data.success) {
        loginSuccess(res.data.token, res.data.user);
        navigate('/track');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b3e 50%, #0a0e1a 100%)',
      position: 'relative', overflow: 'hidden', py: 4
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              display: 'inline-flex', p: 1.5, borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              mb: 1.5, boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
            }}>
              <LocalShipping sx={{ fontSize: 30, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
              Create Account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSignup}>
            <TextField
              fullWidth label="Full Name" name="name" value={formData.name}
              onChange={handleChange} required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth label="Email Address" type="email" name="email" value={formData.email}
              onChange={handleChange} required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth label="Phone Number" type="tel" name="phone" value={formData.phone}
              onChange={handleChange} required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth label="Password" type="password" name="password" value={formData.password}
              onChange={handleChange} required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#6366f1' }} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth select label="Account Type" name="role" value={formData.role}
              onChange={handleChange} required
              sx={{ mb: 3 }}
              SelectProps={{
                MenuProps: { PaperProps: { sx: { bgcolor: '#111827', border: '1px solid #374151' } } }
              }}
            >
              <MenuItem value="user">Standard User</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </TextField>
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              sx={{
                py: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                boxShadow: '0 8px 20px rgba(99,102,241,0.4)'
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign Up'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>
                  Log in
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
