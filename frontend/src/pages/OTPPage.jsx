import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Alert,
  CircularProgress, InputBase
} from '@mui/material';
import { LockOpen, LocalShipping, Refresh } from '@mui/icons-material';
import { verifyOTP, resendOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const phone = sessionStorage.getItem('otpPhone') || '';
  const userId = sessionStorage.getItem('otpUserId') || '';
  const role = sessionStorage.getItem('otpRole') || 'user';
  const name = sessionStorage.getItem('otpName') || 'User';

  useEffect(() => {
    refs.current[0]?.focus();
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInput = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(phone, code, userId, role, name);
      if (res.data.success) {
        loginSuccess(res.data.token, res.data.user);
        navigate(role === 'admin' ? '/dashboard' : '/track');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendOTP(phone, name);
      setSuccess('OTP resent! Check your phone or the server console.');
      setCountdown(60);
    } catch { setError('Failed to resend OTP'); }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b3e 50%, #0a0e1a 100%)'
    }}>
      <Card sx={{
        width: { xs: '90%', sm: 420 },
        background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{
            display: 'inline-flex', p: 2, borderRadius: 3, mb: 2,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>
            <LockOpen sx={{ fontSize: 36, color: '#fff' }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Enter OTP</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
            A 6-digit code was sent to
          </Typography>
          <Typography variant="body1" sx={{ color: '#6366f1', fontWeight: 600, mb: 0.5 }}>
            +91 ••••••{phone.slice(-4)}
          </Typography>
          <Typography variant="caption" sx={{
            display: 'block', mb: 3, color: 'rgba(255,255,255,0.4)',
            background: 'rgba(99,102,241,0.1)', borderRadius: 1, p: 0.5
          }}>
            💡 OTP also visible in server console (fallback)
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          {/* OTP Input Boxes */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3 }}>
            {otp.map((digit, idx) => (
              <Box key={idx} sx={{
                width: 52, height: 60, borderRadius: 2,
                border: `2px solid ${digit ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                background: digit ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: digit ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
              }}>
                <InputBase
                  inputRef={el => refs.current[idx] = el}
                  value={digit}
                  onChange={e => handleInput(e.target.value, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  inputProps={{
                    maxLength: 1, style: {
                      textAlign: 'center', fontSize: 24, fontWeight: 700,
                      color: '#fff', padding: 0, width: '100%'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>

          <Button
            variant="contained" fullWidth size="large"
            onClick={handleVerify} disabled={loading}
            sx={{
              py: 1.5, mb: 2,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify & Login'}
          </Button>

          <Button
            startIcon={<Refresh />} onClick={handleResend}
            disabled={countdown > 0 || loading}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
