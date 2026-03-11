import React, { useState } from 'react';

const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

const CONDITIONS = ['Type 2 Diabetes', 'Hypertension', 'Obesity', 'High Cholesterol', 'CKD', 'Heart Disease', 'GERD/Acid Reflux', 'Anemia', 'Thyroid Disorder', 'PCOS'];
const PREFERENCES = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian', 'Gluten-Free', 'Lactose-Free', 'Low-Carb', 'Low-Sodium', 'High-Protein'];
const MEALS = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
const MEAL_ICONS = { 'Breakfast': '🌅', 'Mid-Morning Snack': '🍎', 'Lunch': '☀️', 'Evening Snack': '🌤️', 'Dinner': '🌙' };

export default function DietPlanner() {
  const [conditions, setConditions] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [calories, setCalories] = useState('1800');
  const [allergies, setAllergies] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);

  const toggleArr = (arr, setArr, val) => setArr(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  const generate = async () => {
    setError(''); setLoading(true); setPlan(null);
    const prompt = `Create a personalized 7-day diet plan for a patient with the following profile. Return ONLY valid JSON, no markdown.

Patient Profile:
- Medical Conditions: ${conditions.length ? conditions.join(', ') : 'None specified'}
- Dietary Preferences: ${preferences.length ? preferences.join(', ') : 'No restrictions'}
- Target Calories: ${calories} kcal/day
- Allergies/Avoid: ${allergies || 'None'}

Return this exact JSON structure:
{
  "weeklyOverview": "2-sentence overview of the diet plan approach",
  "dailyCalories": ${calories},
  "macros": {"carbs": "Xg", "protein": "Xg", "fat": "Xg"},
  "days": [
    {
      "day": "Monday",
      "meals": [
        {"name": "Breakfast", "items": ["item 1", "item 2"], "calories": 400, "notes": "brief tip"},
        {"name": "Mid-Morning Snack", "items": ["item"], "calories": 150, "notes": "tip"},
        {"name": "Lunch", "items": ["item 1", "item 2", "item 3"], "calories": 550, "notes": "tip"},
        {"name": "Evening Snack", "items": ["item"], "calories": 100, "notes": "tip"},
        {"name": "Dinner", "items": ["item 1", "item 2"], "calories": 500, "notes": "tip"}
      ],
      "waterIntake": "2.5L",
      "specialTip": "condition-specific tip for this day"
    }
  ],
  "foodsToAvoid": ["food 1", "food 2", "food 3"],
  "superfoods": [{"food": "name", "benefit": "why it helps their condition"}],
  "disclaimer": "short medical disclaimer"
}

Make all 7 days (Monday through Sunday) unique and varied. All recommendations must be safe for the listed conditions.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setPlan(parsed);
    } catch { setError('Failed to generate plan. Check your Anthropic API key in Layout.jsx.'); }
    setLoading(false);
  };

  const today = plan?.days?.[selectedDay];

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>AI NUTRITION</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>🥗 AI Diet Planner</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Get a personalized 7-day meal plan tailored to your medical conditions</p>
      </div>

      {!plan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '4px' }}>Your Medical Conditions</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Select all that apply</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => toggleArr(conditions, setConditions, c)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${conditions.includes(c) ? '#10b981' : '#e2e8f0'}`, background: conditions.includes(c) ? '#f0fdf4' : '#fafafa', color: conditions.includes(c) ? '#10b981' : '#4a5568', cursor: 'pointer', fontWeight: conditions.includes(c) ? '700' : '500', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>
                  {conditions.includes(c) ? '✓ ' : ''}{c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '14px' }}>Dietary Preferences & Details</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {PREFERENCES.map(p => (
                <button key={p} onClick={() => toggleArr(preferences, setPreferences, p)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${preferences.includes(p) ? '#10b981' : '#e2e8f0'}`, background: preferences.includes(p) ? '#f0fdf4' : '#fafafa', color: preferences.includes(p) ? '#10b981' : '#4a5568', cursor: 'pointer', fontWeight: preferences.includes(p) ? '700' : '500', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>
                  {preferences.includes(p) ? '✓ ' : ''}{p}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>DAILY CALORIE TARGET</label>
                <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="1800"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>ALLERGIES / FOODS TO AVOID</label>
                <input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. peanuts, shellfish, dairy..."
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626', fontSize: '13px', border: '1px solid #fecaca' }}>⚠️ {error}</div>}

          <button onClick={generate} disabled={loading}
            style={{ padding: '15px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            {loading ? '🤖 Generating your personalized 7-day plan...' : '🥗 Generate My 7-Day Meal Plan'}
          </button>
        </div>
      ) : (
        <div>
          {/* Overview */}
          <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #f0f4f8', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '8px' }}>🌿 Your Personalized Plan</div>
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7', margin: 0 }}>{plan.weeklyOverview}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'Calories', val: `${plan.dailyCalories} kcal`, color: '#f59e0b' },
                  { label: 'Carbs', val: plan.macros?.carbs, color: '#3b82f6' },
                  { label: 'Protein', val: plan.macros?.protein, color: '#10b981' },
                  { label: 'Fat', val: plan.macros?.fat, color: '#f97316' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '12px 16px', borderRadius: '12px', background: '#f8fafd', border: '1px solid #f0f4f8' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
            {plan.days?.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                style={{ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${selectedDay === i ? '#10b981' : '#e2e8f0'}`, background: selectedDay === i ? '#f0fdf4' : 'white', color: selectedDay === i ? '#10b981' : '#4a5568', fontWeight: selectedDay === i ? '700' : '500', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>
                {d.day}
              </button>
            ))}
          </div>

          {/* Day meals */}
          {today && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {today.meals?.map((meal, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: '1px solid #f0f4f8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{MEAL_ICONS[meal.name] || '🍽️'}</span>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>{meal.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>{meal.calories} kcal</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {meal.items?.map((item, j) => (
                      <span key={j} style={{ padding: '4px 10px', background: '#f0fdf4', borderRadius: '20px', fontSize: '12px', color: '#374151', border: '1px solid #bbf7d0' }}>{item}</span>
                    ))}
                  </div>
                  {meal.notes && <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>💡 {meal.notes}</div>}
                </div>
              ))}
              {today.specialTip && (
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '14px 18px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#16a34a' }}>
                  🌟 <strong>Today's Tip:</strong> {today.specialTip} | 💧 Water: {today.waterIntake}
                </div>
              )}
            </div>
          )}

          {/* Superfoods & Avoid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '12px' }}>⭐ Superfoods for Your Condition</div>
              {plan.superfoods?.map((s, i) => (
                <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < plan.superfoods.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a202c' }}>{s.food}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.benefit}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fef2f2', borderRadius: '16px', padding: '20px', border: '1px solid #fecaca' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626', marginBottom: '12px' }}>🚫 Foods to Avoid</div>
              {plan.foodsToAvoid?.map((f, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#ef4444' }}>×</span> {f}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>⚠️ {plan.disclaimer}</p>
          <button onClick={() => setPlan(null)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>← Generate New Plan</button>
        </div>
      )}
    </div>
  );
}
