@echo off
echo ============================================
echo  Hospital Management System
echo  Java 21 + PostgreSQL + React + AI
echo ============================================
echo.
echo Make sure PostgreSQL is running first!
echo Make sure hospital_db database exists!
echo.

echo [1/3] Starting AI Service (port 5001)...
start "AI Service" cmd /k "cd ai-service && pip install -r requirements.txt && python app.py"
timeout /t 5 /nobreak > nul

echo [2/3] Starting Spring Boot Backend (port 8080)...
start "Backend" cmd /k "cd backend && mvn spring-boot:run"
timeout /t 20 /nobreak > nul

echo [3/3] Starting React Frontend (port 3000)...
start "Frontend" cmd /k "cd frontend && npm install && npm start"

echo.
echo ============================================
echo  All services starting in separate windows!
echo.
echo  Frontend:   http://localhost:3000
echo  Backend:    http://localhost:8080
echo  AI Service: http://localhost:5001/health
echo.
echo  Login: patient@hospital.com / password123
echo         doctor@hospital.com  / password123
echo         admin@hospital.com   / password123
echo ============================================
pause
