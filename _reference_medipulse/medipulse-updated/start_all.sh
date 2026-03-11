#!/bin/bash
echo "Hospital Management System — Java 21 + PostgreSQL"
echo "Make sure PostgreSQL is running and hospital_db exists!"
echo ""

cd ai-service && pip install -r requirements.txt && python app.py &
echo "AI Service starting..."
sleep 5

cd ../backend && mvn spring-boot:run &
echo "Backend starting..."
sleep 20

cd ../frontend && npm install && npm start &
echo "Frontend starting..."

echo ""
echo "Frontend:   http://localhost:3000"
echo "Backend:    http://localhost:8080"
echo "AI Service: http://localhost:5001/health"
echo "Login: patient@hospital.com / password123"
