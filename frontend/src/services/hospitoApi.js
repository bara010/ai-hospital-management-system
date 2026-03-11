import { api, multipartApi } from './api';

export const authApi = {
  register: async (payload) => (await api.post('/auth/register', payload)).data,
  verifyRegistrationTotp: async (payload) => (await api.post('/auth/register/verify-totp', payload)).data,
  loginStart: async (payload) => (await api.post('/auth/login/start', payload)).data,
  loginVerify: async (payload) => (await api.post('/auth/login/verify-totp', payload)).data,
  setFcmToken: async (token) => (await api.post('/auth/fcm-token', { token })).data,
};

export const publicApi = {
  doctors: async (specialization = '') =>
    (
      await api.get('/public/doctors', {
        params: specialization ? { specialization } : {},
      })
    ).data,
  doctorRatings: async (doctorId) => (await api.get(`/public/doctors/${doctorId}/ratings`)).data,
  availableSlots: async (doctorId, date) =>
    (
      await api.get(`/public/doctors/${doctorId}/available-slots`, {
        params: { date },
      })
    ).data,
};

export const patientApi = {
  appointments: async () => (await api.get('/patients/me/appointments')).data,
  bookAppointment: async (payload) => (await api.post('/patients/me/appointments', payload)).data,
  cancelAppointment: async (appointmentId, reason = '') =>
    (
      await api.patch(`/patients/me/appointments/${appointmentId}/cancel`, null, {
        params: reason ? { reason } : {},
      })
    ).data,
  medicalRecords: async () => (await api.get('/patients/me/medical-records')).data,
  prescriptions: async () => (await api.get('/patients/me/prescriptions')).data,
  submitRating: async (payload) => (await api.post('/patients/me/ratings', payload)).data,

  medications: async () => (await api.get('/patients/me/medications')).data,
  takeMedicationDose: async (medicationPlanId) =>
    (await api.post(`/patients/me/medications/${medicationPlanId}/take`)).data,

  labOrders: async () => (await api.get('/patients/me/lab-orders')).data,

  bills: async () => (await api.get('/patients/me/billing')).data,
  payBill: async (billingId, amount = null) =>
    (await api.post(`/patients/me/billing/${billingId}/pay`, amount == null ? {} : { amount })).data,

  emergencySummary: async () => (await api.get('/patients/me/emergency-summary')).data,
};

export const doctorApi = {
  appointments: async () => (await api.get('/doctors/me/appointments')).data,
  updateAppointmentStatus: async (appointmentId, payload) =>
    (await api.put(`/doctors/me/appointments/${appointmentId}/status`, payload)).data,
  availability: async () => (await api.get('/doctors/me/availability')).data,
  updateAvailability: async (payload) => (await api.put('/doctors/me/availability', payload)).data,
  createMedicalRecord: async (payload) => (await api.post('/doctors/me/medical-records', payload)).data,
  medicalRecords: async () => (await api.get('/doctors/me/medical-records')).data,
  createPrescription: async (payload) => (await api.post('/doctors/me/prescriptions', payload)).data,
  prescriptions: async () => (await api.get('/doctors/me/prescriptions')).data,

  createMedicationPlan: async (payload) => (await api.post('/doctors/me/medications', payload)).data,
  medications: async () => (await api.get('/doctors/me/medications')).data,
  updateMedicationPlanStatus: async (medicationPlanId, active) =>
    (await api.patch(`/doctors/me/medications/${medicationPlanId}/status`, { active })).data,

  createLabOrder: async (payload) => (await api.post('/doctors/me/lab-orders', payload)).data,
  labOrders: async () => (await api.get('/doctors/me/lab-orders')).data,
  updateLabOrderStatus: async (labOrderId, payload) =>
    (await api.patch(`/doctors/me/lab-orders/${labOrderId}/status`, payload)).data,
  updateLabOrderResult: async (labOrderId, payload) =>
    (await api.put(`/doctors/me/lab-orders/${labOrderId}/result`, payload)).data,
};

export const adminApi = {
  dashboard: async () => (await api.get('/admin/dashboard')).data,
  doctors: async () => (await api.get('/admin/doctors')).data,
  updateDoctorApproval: async (doctorId, status) =>
    (await api.patch(`/admin/doctors/${doctorId}/approval`, { status })).data,
  patients: async () => (await api.get('/admin/patients')).data,
  appointments: async () => (await api.get('/admin/appointments')).data,

  labOrders: async () => (await api.get('/admin/lab-orders')).data,

  createBill: async (payload) => (await api.post('/admin/billing', payload)).data,
  bills: async () => (await api.get('/admin/billing')).data,
  updateBillStatus: async (billingId, payload) =>
    (await api.patch(`/admin/billing/${billingId}/status`, payload)).data,

  auditLogs: async (limit = 200) => (await api.get('/admin/audit-logs', { params: { limit } })).data,
};

export const notificationApi = {
  list: async () => (await api.get('/notifications/me')).data,
  unreadCount: async () => (await api.get('/notifications/me/unread-count')).data,
  markRead: async (notificationId) =>
    (await api.patch(`/notifications/me/${notificationId}/read`)).data,
};

export const profileApi = {
  me: async () => (await api.get('/profile/me')).data,
  update: async (payload) => (await api.put('/profile/me', payload)).data,
  uploadPhoto: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return (await multipartApi.post('/profile/me/photo', form)).data;
  },
};

export const fileApi = {
  uploadReport: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return (await multipartApi.post('/files/reports', form)).data;
  },
  uploadChatFile: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return (await multipartApi.post('/files/chat', form)).data;
  },
};

export const appointmentApi = {
  details: async (appointmentId) => (await api.get(`/appointments/${appointmentId}`)).data,
};

export const messageApi = {
  contacts: async () => (await api.get('/messages/contacts')).data,
  conversation: async (otherUserId) => (await api.get(`/messages/conversation/${otherUserId}`)).data,
  send: async (payload) => (await api.post('/messages', payload)).data,
};

export const aiApi = {
  symptomCheck: async (symptoms) => (await api.post('/ai/symptom-checker', { symptoms })).data,
  medicineInfo: async (name) => (await api.get('/ai/medicine-info', { params: { name } })).data,
};
