import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  CircularProgress, Alert, LinearProgress, Divider, Tooltip, 
  Stepper, Step, StepLabel, StepConnector, stepConnectorClasses
} from '@mui/material';
import {
  LocalShipping, Warning, CheckCircle, Map, Sms, ArrowBack,
  Route, AccessTime, Speed, WbSunny, TrendingUp, Info, 
  TrendingDown, Cloud, Navigation, Timer
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getShipment, getPrediction, sendSMSAlert } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Styled Stepper Connector
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: 'linear-gradient(90deg, #6366f1, #ec4899)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: '#22c55e',
  },
}));

// Styled Stepper Step Icon
const CustomStepIconRoot = styled('div')(({ ownerState, theme }) => ({
  display: 'flex',
  height: 22,
  alignItems: 'center',
  justifyContent: 'center',
  ...(ownerState.completed && {
    color: '#22c55e',
  }),
  ...(ownerState.active && {
    color: '#6366f1',
  }),
  ...(ownerState.error && {
    color: '#ef4444',
  }),
  '& .MuiStepIcon-text': {
    fill: 'currentColor',
  },
}));

const CustomStepIcon = (props) => {
  const { active, completed, error } = props;
  return (
    <CustomStepIconRoot ownerState={{ active, completed, error }}>
      {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : <div>{props.icon}</div>}
    </CustomStepIconRoot>
  );
};

export default function ShipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsDone, setSmsDone] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (shipment?.eta_hours) {
        const etaMs = shipment.eta_hours * 3600 * 1000;
        const now = Date.now();
        const remaining = etaMs - (Date.now() % (24 * 3600 * 1000));
        
        if (remaining > 0) {
          const hrs = Math.floor(remaining / 3600000);
          const mins = Math.floor((remaining % 3600000) / 60000);
          setTimeRemaining(`${hrs}h ${mins}m`);
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [shipment]);

  useEffect(() => { fetchShipment(); }, [id]);

  // Fetch prediction only once on component load
  useEffect(() => { 
    if (shipment) fetchPrediction(); 
  }, [id]); // Only on id change, not on every shipment update

  const fetchShipment = async () => {
    setLoading(true);
    try {
      const res = await getShipment(id);
      const data = res.data.shipment;
      setShipment({
        ...data,
        distance_km: parseFloat(data.distance_km) || 0,
        eta_hours: parseFloat(data.eta_hours) || 0,
        risk_score: parseFloat(data.risk_score) || 0,
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Shipment not found');
    }
    setLoading(false);
  };

  const fetchPrediction = async () => {
    setPredLoading(true);
    try {
      const res = await getPrediction(id);
      const pred = res.data.prediction;
      // Ensure proper parsing of numeric values
      setPrediction({
        ...pred,
        risk_score: parseFloat(pred.risk_score) || 0,
        confidence: parseFloat(pred.confidence) || 0,
        traffic_level: parseFloat(pred.traffic_level) || 25,
        time_saved_hours: parseFloat(pred.time_saved_hours) || 0,
      });
    } catch (err) { 
      console.error('Prediction fetch error:', err);
      setPrediction(null); 
    }
    setPredLoading(false);
  };

  useEffect(() => { if (shipment) fetchPrediction(); }, [shipment]);

  const handleSendSMS = async () => {
    console.log('🔴 Alert button clicked!', { shipment: shipment?.shipment_id, smsLoading, user: user?.role });
    if (!shipment) {
      console.error('❌ No shipment data');
      return;
    }
    setSmsLoading(true);
    try {
      const riskData = prediction || shipment;
      console.log('📤 Sending SMS with:', { 
        phone: shipment.customer_phone, 
        shipmentId: shipment.shipment_id, 
        reason: riskData.reason, 
        eta: riskData.time_saved_hours 
      });
      
      const res = await sendSMSAlert(
        shipment.customer_phone,
        shipment.shipment_id,
        riskData.reason || 'High Risk Detected',
        riskData.time_saved_hours || 3
      );
      
      console.log('✅ SMS API Response:', res.data);
      setSmsDone('✅ SMS alert sent! Check server console for details.');
    } catch (err) { 
      console.error('❌ SMS Error:', err);
      setSmsDone('❌ Failed to send alert. Check console.');
    }
    setSmsLoading(false);
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', flexDirection: 'column', gap: 2 }}>
      <Alert severity="error" sx={{ maxWidth: 400 }}>{error}</Alert>
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBack />}>Go Back</Button>
    </Box>
  );

  const riskScore = prediction ? parseFloat(prediction.risk_score) || 0 : parseFloat(shipment?.risk_score || 0);
  const isHighRisk = riskScore >= 70;
  const isMedRisk = riskScore >= 40 && riskScore < 70;
  const riskColor = isHighRisk ? '#ef4444' : isMedRisk ? '#f59e0b' : '#22c55e';
  const riskLabel = isHighRisk ? 'HIGH RISK' : isMedRisk ? 'MEDIUM RISK' : 'LOW RISK';
  const delayReason = prediction?.reason || shipment?.reason || 'Analysing...';
  const altRoute = prediction?.alternate_route || shipment?.alternate_route || 'N/A';
  const timeSaved = parseFloat(prediction?.time_saved_hours || shipment?.time_saved_hours || 0);
  const confidence = parseFloat(prediction?.confidence || 0);
  const onTimePercentage = Math.max(0, Math.min(100, 100 - Math.round(riskScore)));

  // Risk factor breakdown (mock data - replace with real data)
  const riskFactors = [
    { name: 'Weather', severity: prediction?.weather_condition ? 'medium' : 'low', value: prediction?.weather_condition || 'Clear', icon: <WbSunny /> },
    { name: 'Traffic', severity: (prediction?.traffic_level || 25) > 60 ? 'high' : (prediction?.traffic_level || 25) > 30 ? 'medium' : 'low', value: `${parseFloat(prediction?.traffic_level || 25)}%`, icon: <Speed /> },
    { name: 'Distance', severity: (shipment?.distance_km || 500) > 1000 ? 'high' : (shipment?.distance_km || 500) > 500 ? 'medium' : 'low', value: `${parseFloat(shipment?.distance_km || 500)} km`, icon: <Navigation /> },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6366f1';
    }
  };

  const getProgressStep = () => {
    const status = shipment?.status || 'In Transit';
    const steps = { 'Pickup': 0, 'In Transit': 1, 'Near Destination': 2, 'Delivered': 3 };
    return steps[status] || 1;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0e1a', p: { xs: 2, md: 3 } }}>
      {/* Header with Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Back</Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{shipment?.shipment_id}</Typography>
          <Chip label={shipment?.status} sx={{
            background: shipment?.status === 'Delayed' ? '#ef444422' : shipment?.status === 'On Time' ? '#22c55e22' : '#3b82f622',
            color: shipment?.status === 'Delayed' ? '#ef4444' : shipment?.status === 'On Time' ? '#22c55e' : '#3b82f6',
            fontWeight: 700
          }} />
        </Box>
        {timeRemaining && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6366f1', fontSize: 12 }}>
            <Timer sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{timeRemaining} remaining</Typography>
          </Box>
        )}
      </Box>

      {/* High Risk Alert Banner */}
      {isHighRisk && (
        <Alert severity="error" icon={<Warning />} sx={{ mb: 3, borderRadius: 2, border: '1px solid #ef444444' }}
          action={
            user?.role === 'admin' && (
              <Button color="error" size="small" onClick={handleSendSMS} disabled={smsLoading} startIcon={<Sms />}>
                {smsLoading ? '...' : 'Alert'}
              </Button>
            )
          }>
          <strong>⚠ DELAY WARNING:</strong> {delayReason} — Risk Score: {riskScore}%
        </Alert>
      )}

      {smsDone && <Alert severity="success" sx={{ mb: 2 }}>{smsDone}</Alert>}

      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>Risk Score</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 0.5 }}>{riskScore.toFixed(0)}%</Typography>
              <Chip label={riskLabel} size="small" sx={{ background: riskColor, color: '#fff', fontWeight: 700 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>Time Saved</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{timeSaved.toFixed(1)}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>hours</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>Confidence</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{confidence > 0 ? confidence.toFixed(0) : 'N/A'}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>prediction</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: 'none', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>On-Time %</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{onTimePercentage}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>likelihood</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Journey Progress */}
      <Card sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.06)', mb: 3, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Shipment Journey</Typography>
        <Stepper activeStep={getProgressStep()} connector={<CustomConnector />}>
          {['Pickup', 'In Transit', 'Near Destination', 'Delivered'].map((label, idx) => (
            <Step key={label} completed={getProgressStep() > idx}>
              <StepLabel StepIconComponent={CustomStepIcon}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      <Grid container spacing={2}>
        {/* Shipment Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping sx={{ color: '#6366f1' }} /> Shipment Info
              </Typography>
              {[
                { label: 'Order ID', value: shipment?.order_id },
                { label: 'Origin', value: shipment?.origin },
                { label: 'Destination', value: shipment?.destination },
                { label: 'Carrier', value: shipment?.carrier },
                { label: 'Distance', value: `${shipment?.distance_km} km` },
                { label: 'ETA', value: `${shipment?.eta_hours} hours` },
                { label: 'Current Location', value: shipment?.current_lat && shipment?.current_lng ? `${shipment.current_lat.toFixed(4)}, ${shipment.current_lng.toFixed(4)}` : 'Updating...' },
                { label: 'Customer Phone', value: `+91 ${shipment?.customer_phone}` },
              ].map(item => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>{item.value}</Typography>
                </Box>
              ))}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" startIcon={<Map />} onClick={() => navigate(`/map/${id}`)}
                  sx={{ borderColor: '#6366f155', color: '#6366f1' }}>View Map</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Assessment with Factor Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(17,24,39,0.9)', border: `1px solid ${riskColor}33`, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: riskColor }} /> AI Risk Assessment
              </Typography>

              {predLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={30} sx={{ color: '#6366f1' }} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.4)' }}>
                    Analysing live data...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, color: riskColor }}>
                      {riskScore.toFixed(0)}%
                    </Typography>
                    <Chip label={riskLabel} sx={{
                      background: `${riskColor}22`, color: riskColor, fontWeight: 800, mt: 0.5
                    }} />
                  </Box>
                  <LinearProgress variant="determinate" value={riskScore}
                    sx={{ height: 8, borderRadius: 4, mb: 2, backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { background: riskColor } }} />

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1, fontWeight: 600 }}>
                    Risk Factors
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    {riskFactors.map(factor => (
                      <Box key={factor.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1, background: 'rgba(255,255,255,0.03)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: getSeverityColor(factor.severity), fontSize: 16 }}>{factor.icon}</Box>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{factor.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{factor.value}</Typography>
                          <Chip label={factor.severity} size="small" sx={{ height: 18, fontSize: 10, background: `${getSeverityColor(factor.severity)}22`, color: getSeverityColor(factor.severity) }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

                  <Box sx={{ py: 1 }}>
                    {[
                      { label: 'Reason', value: delayReason, icon: <Info sx={{ fontSize: 14 }} /> },
                      { label: 'Confidence', value: confidence > 0 ? `${confidence.toFixed(0)}%` : 'Calculating...', icon: <TrendingUp sx={{ fontSize: 14 }} /> },
                    ].map(item => (
                      <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.4)' }}>
                          {item.icon}
                          <Typography variant="caption">{item.label}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', maxWidth: 120, textAlign: 'right' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Route Recommendation */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Route sx={{ color: '#22c55e' }} /> Route Recommendation
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}>Current Route</Typography>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {shipment?.origin} → {shipment?.destination}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    {shipment?.distance_km} km • ETA: {shipment?.eta_hours}h
                  </Typography>
                </Box>
              </Box>

              {isHighRisk && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#22c55e', display: 'block', mb: 0.5, fontWeight: 700 }}>
                    ✨ AI Suggested Route
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 2, background: '#22c55e11', border: '1px solid #22c55e33' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>{altRoute}</Typography>
                    {timeSaved > 0 && (
                      <Chip label={`⏱ Saves ${timeSaved} hours`} size="small"
                        sx={{ mt: 1, background: '#22c55e22', color: '#22c55e', fontWeight: 700 }} />
                    )}
                  </Box>
                </Box>
              )}

              {!isHighRisk && (
                <Box sx={{ p: 2, borderRadius: 2, background: '#22c55e11', border: '1px solid #22c55e33', textAlign: 'center' }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 600 }}>Route is clear!</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No rerouting needed</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

              {user?.role === 'admin' && (
                <Button fullWidth variant="contained" startIcon={<Sms />}
                  onClick={handleSendSMS} disabled={smsLoading}
                  sx={{ background: '#f59e0b', '&:hover': { background: '#d97706' } }}>
                  {smsLoading ? 'Sending...' : 'Send SMS Alert'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
