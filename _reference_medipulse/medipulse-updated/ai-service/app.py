from flask import Flask, request, jsonify
from flask_cors import CORS
from models.readmission import predict_readmission
from models.noshow import predict_noshow
from models.lab_alert import predict_lab_alert
from models.stock_alert import predict_stock_alert
from models.mood_analyzer import analyze_mood
import random

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'AI Service running ✅', 'port': 5001})

@app.route('/predict/readmission', methods=['POST'])
def readmission(): return jsonify(predict_readmission(request.json))

@app.route('/predict/noshow', methods=['POST'])
def noshow(): return jsonify(predict_noshow(request.json))

@app.route('/predict/lab-alert', methods=['POST'])
def lab_alert(): return jsonify(predict_lab_alert(request.json))

@app.route('/predict/stock-alert', methods=['POST'])
def stock_alert(): return jsonify(predict_stock_alert(request.json))

@app.route('/analyze/mood', methods=['POST'])
def mood(): return jsonify(analyze_mood(request.json))

@app.route('/generate/medicine-reminder', methods=['POST'])
def medicine_reminder():
    data = request.json
    name = data.get('patient_name', 'there')
    medicine = data.get('medicine_name', 'your medicine')
    dose = data.get('dose', '')
    tod = data.get('time_of_day', 'now')
    msgs = {
        'morning':   f"🌅 Good morning {name}! Time to take your {medicine} {dose}. Start your day healthy! 💊",
        'afternoon': f"☀️ Hey {name}! Don't forget your {medicine} {dose} — afternoon dose time! 💊",
        'evening':   f"🌆 Evening reminder {name}! Take your {medicine} {dose} before dinner 💊",
        'night':     f"🌙 Goodnight {name}! Last thing — take your {medicine} {dose} before sleep 💊",
    }
    return jsonify({'message': msgs.get(tod, f"💊 Hi {name}! Time to take your {medicine} {dose}!"), 'title': '💊 Medicine Reminder'})

if __name__ == '__main__':
    print("🚀 Hospital AI Service starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
