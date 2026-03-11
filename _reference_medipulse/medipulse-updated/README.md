# ✚ MediPulse — Health Intelligence Platform ULTIMATE
### Java 21 + PostgreSQL + React 18 + Python Flask + Claude AI

---

## 🚀 All Features — 25 Modules

### Patient Features (11 pages)
| Feature | Route | Description |
|---|---|---|
| Dashboard | `/` | AI Health Score, risk alerts, quick actions |
| Notifications | `/notifications` | Color-coded alerts with filters |
| Mood Check | `/mood` | Daily emoji + voice mood check-in |
| Symptom Checker | `/symptoms` | AI triage (Emergency / High / Medium / Low) |
| Health Timeline | `/timeline` | Full health history |
| **❤️ Vitals Tracker** | `/vitals` | Daily BP/sugar/SpO₂ logging + AI trend insights |
| **💊 Med Adherence** | `/adherence` | 12-week heatmap, streaks, daily dose logging |
| **🥗 Diet Planner** | `/diet` | AI generates 7-day personalized meal plan |
| **🔬 Report Reader** | `/reports` | AI explains every lab value in plain language |
| **📹 Telemedicine** | `/telemedicine` | HD video call UI with controls + history |
| **👨‍👩‍👧 Family Portal** | `/family` | Add caregivers who share your health alerts |
| **🆘 Emergency SOS** | `/sos` | One-tap alert with location + medical profile |
| Appointments | `/appointments` | 3-step booking wizard |
| Analytics | `/analytics` | Charts and notification breakdown |

### Doctor / Admin Features (11 pages)
| Feature | Route | Description |
|---|---|---|
| Discharge Summary | `/discharge` | AI-generated medical document |
| **🤖 Predictive Risk** | `/risk` | Per-patient readmission/mortality risk gauges |
| **💊 Drug Interactions** | `/interactions` | AI checks dangerous drug combinations |
| **👨‍⚕️ Doctor Performance** | `/doctors` | KPI dashboards, satisfaction scores |
| **🛏️ Bed Occupancy** | `/beds` | Live ward bed heatmap |
| **💰 Billing & Invoices** | `/billing` | GST invoice generator with print/PDF |
| **🏪 Pharmacy Inventory** | `/pharmacy` | Stock levels + AI reorder alerts |
| **🔏 HIPAA Audit Log** | `/audit` | Tamper-evident access log |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 — 25 pages |
| Backend | Spring Boot 3.2 + Java 21 |
| Database | PostgreSQL 15 |
| AI Service | Python Flask + scikit-learn |
| AI Chat | Claude AI (Anthropic) |

---

## Setup

**1. Create DB:**
```sql
CREATE DATABASE hospital_db;
```

**2. Set password in** `backend/src/main/resources/application.properties`

**3. Add Anthropic API key in** `frontend/src/components/Layout.jsx`

**4. Run:**
```bash
# Windows: Double-click START_ALL.bat
# Mac/Linux:
chmod +x start_all.sh && ./start_all.sh
```

**5. Load demo data:**
```bash
psql -U postgres -d hospital_db -f database/setup.sql
```

---

## Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@hospital.com | password123 |
| Doctor | doctor@hospital.com | password123 |
| Patient | patient@hospital.com | password123 |

---

## URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| AI Service | http://localhost:5001 |

