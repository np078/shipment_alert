import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import TrackShipmentPage from './pages/TrackShipmentPage';
import ShipmentDetailsPage from './pages/ShipmentDetailsPage';
import MapPage from './pages/MapPage';
import AlertsPage from './pages/AlertsPage';
import AddShipmentPage from './pages/AddShipmentPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    success: { main: '#22c55e' },
    background: { default: '#0a0e1a', paper: '#111827' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 12 },
      },
    },
  },
});

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/track" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/dashboard' : '/track'} />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to={user.role === 'admin' ? '/dashboard' : '/track'} />} />
      <Route path="/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/track" element={<ProtectedRoute><TrackShipmentPage /></ProtectedRoute>} />
      <Route path="/shipment/:id" element={<ProtectedRoute><ShipmentDetailsPage /></ProtectedRoute>} />
      <Route path="/map/:id" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute adminOnly><AlertsPage /></ProtectedRoute>} />
      <Route path="/add-shipment" element={<ProtectedRoute adminOnly><AddShipmentPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/dashboard' : '/track') : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
