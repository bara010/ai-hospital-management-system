import pickle, numpy as np, os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODELS_DIR, exist_ok=True)

def _load_or_train(path, trainer):
    if os.path.exists(path):
        return pickle.load(open(path, 'rb'))
    model = trainer()
    pickle.dump(model, open(path, 'wb'))
    return model

def _readmission_trainer():
    np.random.seed(42); n = 1500
    age=np.random.randint(18,90,n); prev=np.random.randint(0,10,n); stay=np.random.randint(1,30,n)
    meds=np.random.randint(1,20,n); diag=np.random.randint(1,10,n); chronic=np.random.randint(0,2,n)
    X=np.column_stack([age,prev,stay,meds,diag,chronic])
    y=np.clip(((age>65)&(prev>2)|(chronic==1)&(diag>3)).astype(int)+np.random.randint(0,2,n),0,1)
    m=RandomForestClassifier(n_estimators=100,random_state=42); m.fit(X,y); return m

def _noshow_trainer():
    np.random.seed(7); n=1500
    age=np.random.randint(18,85,n); dist=np.random.uniform(1,50,n); prev=np.random.randint(0,5,n)
    days=np.random.randint(1,30,n); hour=np.random.randint(8,18,n)
    X=np.column_stack([age,dist,prev,days,hour])
    y=np.clip(((dist>30)|(prev>1)|(days>14)).astype(int)+np.random.randint(0,2,n),0,1)
    m=GradientBoostingClassifier(n_estimators=100,random_state=42); m.fit(X,y); return m

def predict_readmission(data):
    model = _load_or_train(os.path.join(MODELS_DIR,'readmission.pkl'), _readmission_trainer)
    prob=float(model.predict_proba([[data.get('age',50),data.get('num_prev_admissions',0),data.get('length_of_stay',3),data.get('num_medications',2),data.get('num_diagnoses',1),data.get('has_chronic_disease',0)]])[0][1])
    risk='HIGH' if prob>0.7 else 'MEDIUM' if prob>0.4 else 'LOW'
    return {'risk_level':risk,'probability':round(prob,2),'notify':prob>0.4,'message':f'Patient has {risk} readmission risk ({int(prob*100)}%). Please schedule a follow-up.'}

def predict_noshow(data):
    model = _load_or_train(os.path.join(MODELS_DIR,'noshow.pkl'), _noshow_trainer)
    prob=float(model.predict_proba([[data.get('age',35),data.get('distance_km',5),data.get('prev_noshow_count',0),data.get('days_until_appt',3),data.get('appointment_hour',10)]])[0][1])
    return {'noshow_risk':round(prob,2),'notify':prob>0.5,'message':f'Patient has {int(prob*100)}% chance of missing appointment. Send a reminder!'}

def predict_lab_alert(data):
    ranges={'hemoglobin':(12,17.5,'g/dL'),'glucose':(70,140,'mg/dL'),'creatinine':(0.6,1.2,'mg/dL'),'wbc':(4,11,'K/uL'),'platelets':(150,400,'K/uL'),'sodium':(136,145,'mEq/L'),'potassium':(3.5,5,'mEq/L'),'oxygen_sat':(95,100,'%')}
    alerts=[]
    for test,(low,high,unit) in ranges.items():
        v=data.get(test)
        if v is not None:
            v=float(v)
            if v<low: alerts.append({'test':test.replace('_',' ').title(),'value':v,'status':'LOW','normal_range':f'{low}-{high} {unit}'})
            elif v>high: alerts.append({'test':test.replace('_',' ').title(),'value':v,'status':'HIGH','normal_range':f'{low}-{high} {unit}'})
    return {'alerts':alerts,'notify':len(alerts)>0,'critical':len(alerts)>0,'message':f'🚨 {len(alerts)} abnormal lab result(s)! Immediate review required.' if alerts else '✅ All lab results normal.'}

def predict_stock_alert(data):
    medicines=data.get('medicines',[])
    alerts=[]
    for med in medicines:
        stock=float(med.get('current_stock',0)); usage=float(med.get('daily_usage_avg',1))
        days=round(stock/usage,1) if usage>0 else 999
        if days<=3: alerts.append({'medicine':med.get('name'),'days_left':days,'severity':'CRITICAL'})
        elif days<=7: alerts.append({'medicine':med.get('name'),'days_left':days,'severity':'WARNING'})
    return {'alerts':alerts,'notify':len(alerts)>0,'message':f'⚠️ {len(alerts)} medicine(s) need restocking.' if alerts else '✅ Stock adequate.'}

def analyze_mood(data):
    score=data.get('mood_score',3); name=data.get('patient_name','Patient'); note=data.get('note','')
    moods={1:('Very Bad 😢','#e74c3c',True),2:('Bad 😕','#e67e22',True),3:('Okay 😐','#f39c12',False),4:('Good 😊','#2ecc71',False),5:('Great 😄','#27ae60',False)}
    label,color,alert=moods.get(score,moods[3])
    doc_msg=f"⚠️ {name} reported feeling '{label}' today. Please check in." + (f' Note: "{note}"' if note else '') if alert else None
    responses={1:"We're sorry you're feeling that way 😢. Your doctor has been notified. You're not alone! 💙",2:"Sorry to hear you're not great 😕. Your doctor will be in touch. Take care! 💙",3:"Thanks for sharing! Hope your day gets better 😊",4:"Great to hear you're feeling good! 😊 Keep it up! 💚",5:"Wonderful! So happy you're feeling great! 😄 🌟"}
    return {'mood_label':label,'mood_color':color,'needs_doctor_alert':alert,'doctor_notification':doc_msg,'patient_response':responses.get(score,'Thank you!'),'notify_doctor':alert}
