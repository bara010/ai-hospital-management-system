# 🤖 PulseBot AI Chatbot — Setup Guide

PulseBot is an LLM-powered chatbot built into MediPulse using the **Claude claude-sonnet-4-20250514** model via the Anthropic API. It automatically fetches your live hospital data and uses it as context when answering questions.

---

## ⚡ Quick Setup (Required)

### Step 1: Get your Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in → click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)

### Step 2: Add the key to the project
Open this file:
```
frontend/src/components/Layout.jsx
```

Find line 12:
```js
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
```

Replace with your key:
```js
const ANTHROPIC_API_KEY = 'sk-ant-api03-YOUR-ACTUAL-KEY';
```

### Step 3: Start the project normally
```bash
# Option A: Use the start script
./START_ALL.bat  (Windows)
./start_all.sh   (Mac/Linux)

# Option B: Manual
cd backend && mvn spring-boot:run
cd frontend && npm start
cd ai-service && python app.py
```

---

## 🧠 How PulseBot Works

When you open the chatbot, it automatically fetches your live data from the backend:

### For Patients:
| Data | API Endpoint |
|------|-------------|
| Latest Vitals Summary | `GET /api/vitals/patient/{id}/summary` |
| Upcoming Appointments | `GET /api/appointments/patient/{id}` |
| Unread Notifications | `GET /api/notifications/patient/{id}` |

### For Doctors/Admins:
| Data | API Endpoint |
|------|-------------|
| Hospital Analytics | `GET /api/analytics/summary` |
| Bed Occupancy | `GET /api/beds/summary` |
| Pharmacy Status | `GET /api/pharmacy/summary` |

All fetched data is injected into the Claude system prompt so the AI can give **personalized, accurate answers** about YOUR data.

---

## 💬 Example Conversations

### Patient
> **You:** "Explain my vitals"  
> **PulseBot:** "Your blood pressure of 118/76 mmHg is within the normal range — great news! Your heart rate of 74 bpm is also normal. Your SpO2 of 98% indicates excellent oxygen levels."

> **You:** "When is my next appointment?"  
> **PulseBot:** "You have an appointment with Dr. Sharma on March 5th at 10:30 AM (SCHEDULED). Remember to fast for 8 hours before your blood work!"

### Doctor/Admin
> **You:** "Hospital summary"  
> **PulseBot:** "Currently 142 active patients with 89% bed occupancy. There are 3 pharmacy low-stock alerts needing attention. Today you have 24 scheduled appointments."

---

## ✨ Features

- **Live Data Context** — Fetches real vitals, appointments, analytics on open
- **Role-Aware** — Different responses and quick actions for PATIENT vs DOCTOR/ADMIN
- **Quick Chips** — One-click common questions
- **Minimize** — Minimize to a floating bubble, keep chatting
- **Markdown Rendering** — Bold text and line breaks render properly
- **Typing Indicator** — Animated dots while AI responds
- **Data Loaded Banner** — Shows what data was successfully fetched
- **Graceful Fallback** — Works even if backend is offline (with general knowledge)

---

## 🔐 Security Note

For production deployment, do **NOT** expose your API key in frontend JavaScript. Instead:
1. Create a backend proxy endpoint (e.g. `POST /api/chat`)
2. Have that endpoint call the Anthropic API server-side
3. Update the `sendMessage` function in `Layout.jsx` to call your backend

This prevents your API key from being visible in browser dev tools.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API Error: Invalid API key" | Check your key in Layout.jsx line 12 |
| "Connection issue" | Check internet connection and API key format |
| Data shows "N/A" everywhere | Backend server is not running |
| Chatbot doesn't open | Check browser console for React errors |
