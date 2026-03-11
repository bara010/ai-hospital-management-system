import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctors as doctorsApi } from '../services/api';

const DEPT_META = {
  GENERAL_MEDICINE:      { icon: '🏥', label: 'General Medicine',          color: '#1b6ca8', bg: '#eff6ff' },
  GENERAL:               { icon: '🏥', label: 'General Medicine',          color: '#1b6ca8', bg: '#eff6ff' },
  CARDIOLOGY:            { icon: '❤️', label: 'Cardiology',                color: '#dc2626', bg: '#fef2f2' },
  CARDIAC_SURGERY:       { icon: '❤️‍🩹', label: 'Cardiac Surgery',          color: '#b91c1c', bg: '#fff1f1' },
  ORTHOPAEDICS:          { icon: '🦴', label: 'Orthopaedics',              color: '#d97706', bg: '#fffbeb' },
  ORTHOPEDICS:           { icon: '🦴', label: 'Orthopedics',               color: '#d97706', bg: '#fffbeb' },
  SPINE_SURGERY:         { icon: '🦴', label: 'Spine Surgery',             color: '#c2410c', bg: '#fff7ed' },
  PAEDIATRICS:           { icon: '👶', label: 'Paediatrics',               color: '#7c3aed', bg: '#f5f3ff' },
  PEDIATRICS:            { icon: '👶', label: 'Pediatrics',                color: '#7c3aed', bg: '#f5f3ff' },
  PEDIATRIC_SURGERY:     { icon: '🧒', label: 'Pediatric Surgery',         color: '#6d28d9', bg: '#f5f3ff' },
  NEONATOLOGY:           { icon: '👼', label: 'Neonatology',               color: '#8b5cf6', bg: '#f5f3ff' },
  DERMATOLOGY:           { icon: '🧴', label: 'Dermatology',               color: '#db2777', bg: '#fdf2f8' },
  NEUROLOGY:             { icon: '🧠', label: 'Neurology',                 color: '#059669', bg: '#f0fdf4' },
  NEUROSURGERY:          { icon: '🔬', label: 'Neurosurgery',              color: '#047857', bg: '#ecfdf5' },
  ENT:                   { icon: '👂', label: 'ENT',                       color: '#0891b2', bg: '#f0f9ff' },
  OPHTHALMOLOGY:         { icon: '👁️', label: 'Ophthalmology',             color: '#6d28d9', bg: '#f5f3ff' },
  GYNAECOLOGY:           { icon: '🌸', label: 'Gynaecology',               color: '#be185d', bg: '#fdf2f8' },
  GYNECOLOGY:            { icon: '🌸', label: 'Gynecology',                color: '#be185d', bg: '#fdf2f8' },
  PERINATOLOGY:          { icon: '🤰', label: 'Perinatology',              color: '#ec4899', bg: '#fdf2f8' },
  PSYCHIATRY:            { icon: '🧘', label: 'Psychiatry',                color: '#4338ca', bg: '#eef2ff' },
  GASTROENTEROLOGY:      { icon: '🔬', label: 'Gastroenterology',          color: '#0f766e', bg: '#f0fdfa' },
  HEPATOLOGY:            { icon: '🫀', label: 'Hepatology',                color: '#0d9488', bg: '#f0fdfa' },
  COLORECTAL_SURGERY:    { icon: '🏥', label: 'Colorectal Surgery',        color: '#065f46', bg: '#ecfdf5' },
  PULMONOLOGY:           { icon: '🫁', label: 'Pulmonology',               color: '#0284c7', bg: '#f0f9ff' },
  THORACIC_SURGERY:      { icon: '🫁', label: 'Thoracic Surgery',          color: '#0369a1', bg: '#eff6ff' },
  ENDOCRINOLOGY:         { icon: '⚗️', label: 'Endocrinology',             color: '#7c3aed', bg: '#f5f3ff' },
  UROLOGY:               { icon: '💊', label: 'Urology',                   color: '#0369a1', bg: '#f0f9ff' },
  UROSURGERY:            { icon: '⚕️', label: 'Urosurgery',                color: '#1d4ed8', bg: '#eff6ff' },
  NEPHROLOGY:            { icon: '🫘', label: 'Nephrology',                color: '#0e7490', bg: '#ecfeff' },
  DENTISTRY:             { icon: '🦷', label: 'Dentistry',                 color: '#0f4c75', bg: '#eff6ff' },
  ORAL_MAXILLOFACIAL:    { icon: '🦷', label: 'Oral & Maxillofacial',      color: '#1e40af', bg: '#eff6ff' },
  ONCOLOGY:              { icon: '🩺', label: 'Oncology',                  color: '#7f1d1d', bg: '#fef2f2' },
  HEMATOLOGY:            { icon: '🩸', label: 'Hematology',                color: '#991b1b', bg: '#fef2f2' },
  RHEUMATOLOGY:          { icon: '🦵', label: 'Rheumatology',              color: '#92400e', bg: '#fffbeb' },
  IMMUNOLOGY:            { icon: '🛡️', label: 'Immunology',                color: '#1e3a5f', bg: '#eff6ff' },
  ALLERGY_IMMUNOLOGY:    { icon: '🌿', label: 'Allergy & Immunology',      color: '#166534', bg: '#f0fdf4' },
  INFECTIOUS_DISEASE:    { icon: '🦠', label: 'Infectious Disease',        color: '#854d0e', bg: '#fefce8' },
  RADIOLOGY:             { icon: '📡', label: 'Radiology',                 color: '#374151', bg: '#f9fafb' },
  NUCLEAR_MEDICINE:      { icon: '☢️', label: 'Nuclear Medicine',           color: '#4b5563', bg: '#f9fafb' },
  PATHOLOGY:             { icon: '🔬', label: 'Pathology',                 color: '#374151', bg: '#f9fafb' },
  ANESTHESIOLOGY:        { icon: '💉', label: 'Anesthesiology',            color: '#1f2937', bg: '#f9fafb' },
  EMERGENCY_MEDICINE:    { icon: '🚨', label: 'Emergency Medicine',        color: '#b91c1c', bg: '#fff1f2' },
  CRITICAL_CARE:         { icon: '🏥', label: 'Critical Care / ICU',       color: '#7f1d1d', bg: '#fef2f2' },
  GERIATRICS:            { icon: '👴', label: 'Geriatrics',                color: '#78716c', bg: '#fafaf9' },
  SPORTS_MEDICINE:       { icon: '🏃', label: 'Sports Medicine',           color: '#15803d', bg: '#f0fdf4' },
  PALLIATIVE_CARE:       { icon: '🕊️', label: 'Palliative Care',           color: '#6b7280', bg: '#f9fafb' },
  PHYSICAL_MEDICINE:     { icon: '🦽', label: 'Physical Medicine & Rehab', color: '#0369a1', bg: '#f0f9ff' },
  PAIN_MANAGEMENT:       { icon: '💊', label: 'Pain Management',           color: '#7c3aed', bg: '#faf5ff' },
  SLEEP_MEDICINE:        { icon: '😴', label: 'Sleep Medicine',            color: '#4338ca', bg: '#eef2ff' },
  PLASTIC_SURGERY:       { icon: '✂️', label: 'Plastic Surgery',           color: '#db2777', bg: '#fdf2f8' },
  VASCULAR_SURGERY:      { icon: '🩻', label: 'Vascular Surgery',          color: '#0284c7', bg: '#f0f9ff' },
  ADOLESCENT_MEDICINE:   { icon: '🧑', label: 'Adolescent Medicine',       color: '#7c3aed', bg: '#f5f3ff' },
  OCCUPATIONAL_MEDICINE: { icon: '🏭', label: 'Occupational Medicine',     color: '#4b5563', bg: '#f9fafb' },
  FORENSIC_MEDICINE:     { icon: '🔍', label: 'Forensic Medicine',         color: '#374151', bg: '#f9fafb' },
  MEDICAL_GENETICS:      { icon: '🧬', label: 'Medical Genetics',          color: '#6d28d9', bg: '#f5f3ff' },
  CLINICAL_PHARMACOLOGY: { icon: '💊', label: 'Clinical Pharmacology',     color: '#0369a1', bg: '#eff6ff' },
  NUTRITION_DIETETICS:   { icon: '🥗', label: 'Nutrition & Dietetics',     color: '#16a34a', bg: '#f0fdf4' },
  PODIATRY:              { icon: '🦶', label: 'Podiatry',                  color: '#92400e', bg: '#fffbeb' },
};

const FALLBACK = { icon: '⚕️', label: 'Department', color: '#6b7280', bg: '#f8fafd' };

function DoctorCard({ doctor, deptColor, deptBg }) {
  const initials = (doctor.name || 'D').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 18,
      border: '1px solid #f0f4f8',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      display: 'flex', gap: 14, alignItems: 'center',
      transition: 'all 0.2s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${deptColor}22, ${deptColor}44)`,
        border: `2px solid ${deptColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 18, color: deptColor,
      }}>
        {initials}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c', marginBottom: 2 }}>
          {doctor.name || 'Doctor'}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
          {doctor.specialization}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          🕐 {doctor.availability}
        </div>
      </div>
      {/* Fee */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: deptColor }}>
          ₹{doctor.consultationFee}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>per visit</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          {doctor.qualification}
        </div>
      </div>
    </div>
  );
}

function DepartmentSection({ dept, doctors }) {
  const meta = DEPT_META[dept] || { ...FALLBACK, label: dept };
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      border: '1px solid #f0f4f8', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      marginBottom: 18,
    }}>
      {/* Department header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '18px 22px', cursor: 'pointer',
          background: meta.bg,
          borderBottom: expanded ? `1px solid ${meta.color}22` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `${meta.color}22`, border: `1.5px solid ${meta.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: meta.color }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `${meta.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta.color, fontWeight: 700, fontSize: 14,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▾
        </div>
      </div>

      {/* Doctors list */}
      {expanded && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {doctors.map(doc => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              deptColor={meta.color}
              deptBg={meta.bg}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Departments() {
  const [grouped,  setGrouped]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('ALL');

  useEffect(() => {
    doctorsApi.getAll().then(res => {
      const doctors = res.data || [];
      const g = {};
      doctors.forEach(doc => {
        const dept = (doc.department || 'GENERAL_MEDICINE').toUpperCase();
        if (!g[dept]) g[dept] = [];
        g[dept].push(doc);
      });
      setGrouped(g);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const departments = Object.keys(grouped);

  // Filter by search or dept tab
  const displayed = departments.filter(dept => {
    if (filter !== 'ALL' && dept !== filter) return false;
    if (search) {
      const meta = DEPT_META[dept] || FALLBACK;
      const matchesDept = meta.label.toLowerCase().includes(search.toLowerCase()) || dept.toLowerCase().includes(search.toLowerCase());
      const matchesDoc  = grouped[dept].some(d =>
        (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.specialization || '').toLowerCase().includes(search.toLowerCase())
      );
      return matchesDept || matchesDoc;
    }
    return true;
  });

  const totalDoctors = departments.reduce((sum, d) => sum + grouped[d].length, 0);

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)',
        borderRadius: 22, padding: '26px 30px', marginBottom: 24, color: 'white',
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600 }}>Hospital</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🏥 Departments</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {departments.length} departments · {totalDoctors} doctors
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18, display: 'flex', gap: 10 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search department or doctor name..."
          style={{
            flex: 1, padding: '11px 16px',
            border: '1.5px solid #e2e8f0', borderRadius: 12,
            fontSize: 14, outline: 'none', fontFamily: 'inherit',
            background: 'white',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Dept filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setFilter('ALL')}
          style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === 'ALL' ? '#1b6ca8' : '#f0f4f8',
            color: filter === 'ALL' ? 'white' : '#4a5568',
            fontWeight: 600, fontSize: 12,
          }}>
          All ({departments.length})
        </button>
        {departments.map(dept => {
          const meta = DEPT_META[dept] || FALLBACK;
          return (
            <button key={dept}
              onClick={() => setFilter(filter === dept ? 'ALL' : dept)}
              style={{
                padding: '6px 12px', borderRadius: 20,
                border: `1.5px solid ${filter === dept ? meta.color : '#e2e8f0'}`,
                cursor: 'pointer',
                background: filter === dept ? meta.color : 'white',
                color: filter === dept ? 'white' : meta.color,
                fontWeight: 600, fontSize: 12,
              }}>
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✚</div>
          <div>Loading departments...</div>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 18, color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No departments found</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {search ? 'Try a different search term' : 'No verified doctors registered yet in this department'}
          </div>
        </div>
      ) : (
        displayed.map(dept => (
          <DepartmentSection key={dept} dept={dept} doctors={grouped[dept]} />
        ))
      )}
    </div>
  );
}
