import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('shipAlert_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email, password) => API.post('/auth/login', { email, password });
export const signup = (userData) => API.post('/auth/signup', userData);

// Shipments
export const getAllShipments = () => API.get('/shipments');
export const getShipment = (id) => API.get(`/shipment/${id}`);
export const createShipment = (data) => API.post('/shipments', data);
export const updateLocation = (id, lat, lng) => API.put(`/shipments/${id}/location`, { lat, lng });
export const getUserShipments = (customerId) => API.get(`/shipments/user/${customerId}`);
export const getRouteInfo = (origin, destination, carrier) => 
  API.get('/route-info', { params: { origin, destination, carrier } });

// AI
export const getPrediction = (shipmentId) => API.get(`/ai/predict/${shipmentId}`);

// SMS
export const sendSMSAlert = (phoneOrPhones, shipmentId, reason, newEta) => {
  const payload = {
    shipmentId,
    reason,
    newEta,
    trackingUrl: 'http://shipalert.logistics.com'
  };

  if (Array.isArray(phoneOrPhones)) {
    payload.phones = phoneOrPhones;
  } else {
    payload.phone = phoneOrPhones;
  }

  return API.post('/sms/alert', payload);
};

export default API;
