import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  // Legacy (demo quick login - bypasses TOTP)
  login:              (data)          => API.post('/auth/login', data),
  me:                 ()              => API.get('/auth/me'),
  validateEmail:      (email)         => API.post('/auth/validate-email', { email }),
  // Google Authenticator TOTP Login
  loginSendOtp:       (data)          => API.post('/auth/login/send-otp', data),       // verify password
  loginVerifyOtp:     (data)          => API.post('/auth/login/verify-otp', data),     // verify TOTP code
  // Google Authenticator TOTP Register
  registerSendOtp:    (data)          => API.post('/auth/register/setup-totp', data),  // get QR code
  registerVerifyOtp:  (data)          => API.post('/auth/register/verify-totp', data), // verify first code
  // Admin: reset TOTP for a user
  resetTotp:          (userId)        => API.post('/auth/totp/reset/' + userId),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = {
  getAll:               ()     => API.get('/notifications'),
  getUnread:            ()     => API.get('/notifications/unread'),
  getCount:             ()     => API.get('/notifications/count'),
  getForPatient:        (id)   => API.get(`/notifications/patient/${id}`),
  getUnreadForPatient:  (id)   => API.get(`/notifications/patient/${id}/unread`),
  getCountForPatient:   (id)   => API.get(`/notifications/patient/${id}/count`),
  getDoctorUnread:      ()     => API.get('/notifications/doctor/unread'),
  markRead:             (id)   => API.put(`/notifications/${id}/read`),
  markAllRead:          ()     => API.put('/notifications/read-all'),
  markAllReadForPatient:(id)   => API.put(`/notifications/patient/${id}/read-all`),
  delete:               (id)   => API.delete(`/notifications/${id}`),
  submitMood:           (data) => API.post('/notifications/mood-response', data),
  sendHealthTip:        (data) => API.post('/notifications/health-tip', data),
  testMedicine:         (data) => API.post('/notifications/test/medicine-reminder', data),
  testMood:             (data) => API.post('/notifications/test/mood-check', data),
  testAppointment:      (data) => API.post('/notifications/test/appointment-reminder', data),
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointments = {
  getAll:         ()         => API.get('/appointments'),
  getByPatient:   (id)       => API.get(`/appointments/patient/${id}`),
  getByDoctor:    (id)       => API.get(`/appointments/doctor/${id}`),
  book:           (data)     => API.post('/appointments', data),
  updateStatus:   (id, data) => API.put(`/appointments/${id}/status`, data),
  cancel:         (id)       => API.delete(`/appointments/${id}`),
  upcomingCount:  ()         => API.get('/appointments/upcoming/count'),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analytics = {
  getSummary:   () => API.get('/analytics/summary'),
  getDashboard: () => API.get('/analytics/dashboard'),
};

// ── Patients ──────────────────────────────────────────────────────────────────
export const patients = {
  getAll:         ()         => API.get('/patients'),
  getById:        (id)       => API.get(`/patients/${id}`),
  getByUserId:    (uid)      => API.get(`/patients/user/${uid}`),
  getByStatus:    (status)   => API.get(`/patients/status/${status}`),
  getStats:       ()         => API.get('/patients/stats'),
  create:         (data)     => API.post('/patients', data),
  update:         (id, data) => API.put(`/patients/${id}`, data),
  updateStatus:   (id, data) => API.put(`/patients/${id}/status`, data),
};

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctors = {
  getAll:         ()         => API.get('/doctors'),
  getById:        (id)       => API.get(`/doctors/${id}`),
  getByDept:      (dept)     => API.get(`/doctors/department/${dept}`),
  getStats:       (id)       => API.get(`/doctors/${id}/stats`),
  create:         (data)     => API.post('/doctors', data),
  update:         (id, data) => API.put(`/doctors/${id}`, data),
};

// ── Vitals ────────────────────────────────────────────────────────────────────
export const vitals = {
  getByPatient:   (id) => API.get(`/vitals/patient/${id}`),
  getRecent:      (id) => API.get(`/vitals/patient/${id}/recent`),
  getSummary:     (id) => API.get(`/vitals/patient/${id}/summary`),
  log:            (data) => API.post('/vitals', data),
  delete:         (id)   => API.delete(`/vitals/${id}`),
};

// ── Mood ──────────────────────────────────────────────────────────────────────
export const mood = {
  getByPatient:   (id) => API.get(`/mood/patient/${id}`),
  getRecent:      (id) => API.get(`/mood/patient/${id}/recent`),
  getStats:       (id) => API.get(`/mood/patient/${id}/stats`),
  getAll:         ()   => API.get('/mood/all'),
  submit:         (data) => API.post('/mood', data),
};

// ── Medicines ─────────────────────────────────────────────────────────────────
export const medicines = {
  getByPatient:   (id)       => API.get(`/medicines/patient/${id}`),
  getActive:      ()         => API.get('/medicines/active'),
  create:         (data)     => API.post('/medicines', data),
  update:         (id, data) => API.put(`/medicines/${id}`, data),
  toggle:         (id)       => API.put(`/medicines/${id}/toggle`),
  delete:         (id)       => API.delete(`/medicines/${id}`),
};

// ── Invoices / Billing ────────────────────────────────────────────────────────
export const invoices = {
  getAll:       ()         => API.get('/invoices'),
  getById:      (id)       => API.get(`/invoices/${id}`),
  getByStatus:  (status)   => API.get(`/invoices/status/${status}`),
  getSummary:   ()         => API.get('/invoices/summary'),
  create:       (data)     => API.post('/invoices', data),
  updateStatus: (id, data) => API.put(`/invoices/${id}/status`, data),
  delete:       (id)       => API.delete(`/invoices/${id}`),
};

// ── Pharmacy ──────────────────────────────────────────────────────────────────
export const pharmacy = {
  getAll:         ()           => API.get('/pharmacy'),
  getById:        (id)         => API.get(`/pharmacy/${id}`),
  getAlerts:      ()           => API.get('/pharmacy/alerts'),
  getByCategory:  (cat)        => API.get(`/pharmacy/category/${cat}`),
  getSummary:     ()           => API.get('/pharmacy/summary'),
  create:         (data)       => API.post('/pharmacy', data),
  update:         (id, data)   => API.put(`/pharmacy/${id}`, data),
  restock:        (id, data)   => API.put(`/pharmacy/${id}/restock`, data),
  delete:         (id)         => API.delete(`/pharmacy/${id}`),
};

// ── Beds ──────────────────────────────────────────────────────────────────────
export const beds = {
  getAll:       ()         => API.get('/beds'),
  getByWard:    (ward)     => API.get(`/beds/ward/${ward}`),
  getSummary:   ()         => API.get('/beds/summary'),
  assign:       (id, data) => API.put(`/beds/${id}/assign`, data),
  discharge:    (id)       => API.put(`/beds/${id}/discharge`),
  maintenance:  (id)       => API.put(`/beds/${id}/maintenance`),
};

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const audit = {
  getRecent:    ()       => API.get('/audit'),
  getAll:       ()       => API.get('/audit/all'),
  getByUser:    (email)  => API.get(`/audit/user/${email}`),
  getByAction:  (action) => API.get(`/audit/action/${action}`),
  getSummary:   ()       => API.get('/audit/summary'),
  log:          (data)   => API.post('/audit', data),
};

export default API;

// ── Family / Caregiver Portal ──────────────────────────────────────────────────
export const family = {
  getByPatient: (id)       => API.get(`/family/patient/${id}`),
  add:          (data)     => API.post('/family', data),
  update:       (id, data) => API.put(`/family/${id}`, data),
  remove:       (id)       => API.delete(`/family/${id}`),
};

// ── Telemedicine ───────────────────────────────────────────────────────────────
export const telemedicine = {
  getByPatient: (id)       => API.get(`/telemedicine/patient/${id}`),
  getAll:       ()         => API.get('/telemedicine/all'),
  book:         (data)     => API.post('/telemedicine', data),
  complete:     (id, data) => API.put(`/telemedicine/${id}/complete`, data),
  cancel:       (id)       => API.put(`/telemedicine/${id}/cancel`),
};

// ── User Settings ──────────────────────────────────────────────────────────────
export const settings = {
  get:                 ()     => API.get('/settings'),
  updateProfile:       (data) => API.put('/settings/profile', data),
  updateNotifications: (data) => API.put('/settings/notifications', data),
  changePassword:      (data) => API.put('/settings/password', data),
};

// ── Discharge Summary ──────────────────────────────────────────────────────────
export const discharge = {
  getAll:       ()     => API.get('/discharge'),
  getByPatient: (id)   => API.get(`/discharge/patient/${id}`),
  save:         (data) => API.post('/discharge', data),
};

// ── Patient Health Analysis (NEW) ──────────────────────────────────────────────
export const healthAnalysis = {
  analyze:         (patientId, data)  => API.post(`/patients/${patientId}/analyze`, data),
  getAnalysis:     (patientId)        => API.get(`/patients/${patientId}/analysis`),
  getHistory:      (patientId)        => API.get(`/patients/${patientId}/history`),
  getRecommended:  (patientId)        => API.get(`/doctors/recommended/${patientId}`),
  getDoctorPatients:(doctorId)        => API.get(`/doctors/${doctorId}/patients`),
  getDoctorByUserId:(userId)          => API.get(`/doctors/for-user/${userId}`),
};

// ── Online Doctor Consult ──────────────────────────────────────────────────────
export const onlineConsult = {
  request:      (data)       => API.post('/online-consult/request', data),
  accept:       (id, data)   => API.put(`/online-consult/${id}/accept`, data),
  sendMessage:  (id, data)   => API.post(`/online-consult/${id}/message`, data),
  end:          (id)         => API.put(`/online-consult/${id}/end`),
  cancel:       (id)         => API.put(`/online-consult/${id}/cancel`),
  getById:      (id)         => API.get(`/online-consult/${id}`),
  byPatient:    (patientId)  => API.get(`/online-consult/patient/${patientId}`),
  waiting:      ()           => API.get('/online-consult/waiting'),
  byDoctor:     (doctorId)   => API.get(`/online-consult/doctor/${doctorId}`),
};

