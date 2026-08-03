const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const buildHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const apiRequest = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {}
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};

export const requestOtp   = (payload)       => apiRequest('/api/auth/request-otp',  { method: 'POST', body: payload });
export const verifyOtp    = (payload)       => apiRequest('/api/auth/verify-otp',   { method: 'POST', body: payload });
export const getMe        = (token)         => apiRequest('/api/auth/me',            { token });

export const fetchPharmacies      = ()                        => apiRequest('/api/pharmacies');
export const fetchMyPharmacy      = (token)                   => apiRequest('/api/pharmacies/me',          { token });
export const updateMyPharmacy     = (payload, token)          => apiRequest('/api/pharmacies/me',          { method: 'PATCH', body: payload, token });
export const fetchPharmaciesAdmin = (token)                   => apiRequest('/api/pharmacies/admin/all',   { token });
export const approvePharmacy      = (id, payload, token)      => apiRequest(`/api/pharmacies/${id}/approval`, { method: 'PATCH', body: payload, token });
export const updatePharmacyAdmin  = (id, payload, token)      => apiRequest(`/api/pharmacies/${id}`, { method: 'PATCH', body: payload, token });
export const deletePharmacyAdmin  = (id, token)               => apiRequest(`/api/pharmacies/${id}`, { method: 'DELETE', token });

export const fetchMedicines   = (q)                   => apiRequest(`/api/medicines${q ? `?q=${encodeURIComponent(q)}` : ''}`);
export const updateMedicine   = (id, payload, token)  => apiRequest(`/api/medicines/${id}`, { method: 'PATCH', body: payload, token });
export const createMedicine   = (payload, token)      => apiRequest('/api/medicines',       { method: 'POST',  body: payload, token });
export const deleteMedicine   = (id, token)           => apiRequest(`/api/medicines/${id}`, { method: 'DELETE', token });

export const fetchReservations  = (token)                    => apiRequest('/api/reservations',      { token });
export const trackOrderByRef     = (reference)  => apiRequest(`/api/reservations/track?reference=${encodeURIComponent(reference)}`);
export const trackEmergencyByRef = (reference)  => apiRequest(`/api/emergency/track?reference=${encodeURIComponent(reference)}`);
export const createReservation  = (payload, token)           => apiRequest('/api/reservations',      { method: 'POST',   body: payload, token });
export const updateReservation  = (id, payload, token)       => apiRequest(`/api/reservations/${id}`, { method: 'PATCH',  body: payload, token });
export const deleteReservation  = (id, token)                => apiRequest(`/api/reservations/${id}`, { method: 'DELETE', token });

export const fetchEmergencyOrders  = (token)           => apiRequest('/api/emergency',      { token });
export const createEmergencyOrder  = (payload)         => apiRequest('/api/emergency',      { method: 'POST', body: payload });
export const updateEmergencyOrder  = (id, payload, token) => apiRequest(`/api/emergency/${id}`, { method: 'PATCH', body: payload, token });

export const askAssistant    = (payload)             => apiRequest('/api/ai/ask',           { method: 'POST', body: payload });

export const registerUser    = (payload)             => apiRequest('/api/auth/register',          { method: 'POST', body: payload });
export const registerPharmacy= (payload)             => apiRequest('/api/auth/register-pharmacy', { method: 'POST', body: payload });
export const updateProfile   = (payload, token)      => apiRequest('/api/auth/profile',           { method: 'PATCH', body: payload, token });

export const submitContact       = (payload)        => apiRequest('/api/contact',          { method: 'POST', body: payload });
export const fetchContactMessages= (token)          => apiRequest('/api/contact',          { token });
export const markContactRead     = (id, token)      => apiRequest(`/api/contact/${id}/read`, { method: 'PATCH', token });
