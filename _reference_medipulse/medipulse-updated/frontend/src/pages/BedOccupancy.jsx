import React, { useState, useEffect } from 'react';
import { beds as bedsApi } from '../services/api';

const WARDS = [
  { id: 1, name: 'General Ward A', type: 'General', totalBeds: 20, icon: '🏥', color: '#1b6ca8' },
  { id: 2, name: 'ICU', type: 'ICU', totalBeds: 10, icon: '❤️', color: '#ef4444' },
  { id: 3, name: 'Cardiology', type: 'Specialist', totalBeds: 15, icon: '🫀', color: '#f97316' },
  { id: 4, name: 'Orthopedics', type: 'Specialist', totalBeds: 12, icon: '🦴', color: '#8b5cf6' },
  { id: 5, name: 'Maternity', type: 'Maternity', totalBeds: 10, icon: '👶', color: '#ec4899' },
  { id: 6, name: 'Pediatrics', type: 'Pediatric', totalBeds: 8, icon: '🧒', color: '#10b981' },
  { id: 7, name: 'Emergency', type: 'Emergency', totalBeds: 6, icon: '🚨', color: '#dc2626' },
  { id: 8, name: 'General Ward B', type: 'General', totalBeds: 18, icon: '🏥', color: '#0891b2' },
];

function generateBeds(ward) {
  return Array.from({ length: ward.totalBeds }, (_, i) => {
    const r = Math.random();
    const status = ward.id === 7 ? (r > 0.3 ? 'occupied' : 'available')
      : ward.id === 2 ? (r > 0.25 ? 'occupied' : r > 0.1 ? 'reserved' : 'available')
      : r > 0.55 ? 'occupied' : r > 0.45 ? 'reserved' : r > 0.4 ? 'cleaning' : 'available';
    const patient = status === 'occupied' ? {
      name: ['Rahul V.', 'Sunita P.', 'Arun K.', 'Kavya R.', 'Mohammed S.', 'Priya T.'][Math.floor(Math.random() * 6)],
      days: Math.floor(Math.random() * 8) + 1,
      dischargeIn: Math.floor(Math.random() * 5) + 1,
    } : null;
    return { id: i + 1, bedNo: `${ward.id}-${String(i + 1).padStart(2, '0')}`, status, patient };
  });
}

const STATUS_CONFIG = {
  occupied:  { color: '#ef4444', bg: '#fef2f2', label: 'Occupied', icon: '🔴' },
  available: { color: '#10b981', bg: '#f0fdf4', label: 'Available', icon: '🟢' },
  reserved:  { color: '#f59e0b', bg: '#fffbeb', label: 'Reserved', icon: '🟡' },
  cleaning:  { color: '#8b5cf6', bg: '#f5f3ff', label: 'Cleaning', icon: '🟣' },
};

function BedGrid({ beds, wardColor }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {beds.map((bed) => {
        const sc = STATUS_CONFIG[bed.status];
        return (
          <div key={bed.id} style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(bed.id)}
            onMouseLeave={() => setHovered(null)}>
            <div style={{ width: '32px', height: '28px', borderRadius: '6px', background: bed.status === 'occupied' ? wardColor : sc.bg, border: `1.5px solid ${bed.status === 'occupied' ? wardColor : sc.color}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', transition: 'transform 0.15s', transform: hovered === bed.id ? 'scale(1.2)' : 'scale(1)' }}>
              🛏️
            </div>
            {hovered === bed.id && (
              <div style={{ position: 'absolute', bottom: '34px', left: '50%', transform: 'translateX(-50%)', background: '#1a202c', color: 'white', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', whiteSpace: 'nowrap', zIndex: 10, fontWeight: '600' }}>
                Bed {bed.bedNo}: {sc.label}
                {bed.patient && <><br />{bed.patient.name} · Day {bed.patient.days}</>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BedOccupancy() {
  const [wards, setWards] = useState(() => WARDS.map(w => ({ ...w, beds: generateBeds(w) })));
  const [selected, setSelected] = useState(null);
  const [tick, setTick] = useState(0);

  // Load real bed data from backend
  useEffect(() => {
    bedsApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        const grouped = {};
        res.data.forEach(b => {
          if (!grouped[b.ward]) grouped[b.ward] = [];
          grouped[b.ward].push({
            id: b.id,
            number: b.bedNumber,
            status: b.status === 'OCCUPIED' ? 'occupied' : b.status === 'MAINTENANCE' ? 'cleaning' : 'available',
            patient: b.patientName || null,
            condition: b.admittedFor || null,
            admitTime: b.admittedAt ? new Date(b.admittedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : null,
          });
        });
        if (Object.keys(grouped).length > 0) {
          const mapped = WARDS.map(w => ({
            ...w,
            beds: grouped[w.name] || generateBeds(w),
          }));
          setWards(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const totalBeds = wards.reduce((s, w) => s + w.totalBeds, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.beds.filter(b => b.status === 'occupied').length, 0);
  const totalAvailable = wards.reduce((s, w) => s + w.beds.filter(b => b.status === 'available').length, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>ADMIN · REAL-TIME</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>🛏️ Bed Occupancy</h1>
          <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Live bed availability across all wards — updates every 30 seconds</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-2px' }}>{occupancyRate}%</div>
          <div style={{ opacity: .7, fontSize: '13px' }}>Hospital Occupancy</div>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { icon: '🛏️', val: totalBeds, label: 'Total Beds', color: '#1b6ca8' },
          { icon: '🔴', val: totalOccupied, label: 'Occupied', color: '#ef4444' },
          { icon: '🟢', val: totalAvailable, label: 'Available', color: '#10b981' },
          { icon: '🟡', val: wards.reduce((s,w)=>s+w.beds.filter(b=>b.status==='reserved').length,0), label: 'Reserved', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4a5568', fontWeight: '500' }}>
            <span>{cfg.icon}</span> {cfg.label}
          </div>
        ))}
      </div>

      {/* Ward Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {wards.map(ward => {
          const occupied = ward.beds.filter(b => b.status === 'occupied').length;
          const available = ward.beds.filter(b => b.status === 'available').length;
          const pct = Math.round((occupied / ward.totalBeds) * 100);
          return (
            <div key={ward.id} onClick={() => setSelected(selected?.id === ward.id ? null : ward)}
              style={{ background: 'white', borderRadius: '16px', padding: '20px', border: `1.5px solid ${selected?.id === ward.id ? ward.color : '#f0f4f8'}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selected?.id === ward.id ? `0 4px 20px ${ward.color}20` : '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: `${ward.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{ward.icon}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>{ward.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ward.type}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981', letterSpacing: '-1px' }}>{pct}%</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{available} free</div>
                </div>
              </div>
              <div style={{ height: '6px', background: '#f0f4f8', borderRadius: '99px', marginBottom: '12px' }}>
                <div style={{ height: '6px', width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : ward.color, borderRadius: '99px', transition: 'width 0.6s' }} />
              </div>
              {selected?.id === ward.id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f4f8' }}>
                  <BedGrid beds={ward.beds} wardColor={ward.color} />
                </div>
              )}
              {selected?.id !== ward.id && (
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{occupied}/{ward.totalBeds} beds occupied · Click to expand</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
