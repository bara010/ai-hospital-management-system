import React, { useState, useEffect } from 'react';
import { invoices as invoicesApi } from '../services/api';

// ── Sample Data ───────────────────────────────────────────────────────────────
const ALL_INVOICES = [
  {
    id: 'INV-2024-001', patient: 'Rahul Verma', patientId: 'PT-1001',
    date: '2026-02-20', doctor: 'Dr. Sharma', status: 'PAID',
    items: [
      { name: 'General Consultation', category: 'Consultation', qty: 1, price: 500 },
      { name: 'Complete Blood Count', category: 'Lab', qty: 1, price: 250 },
      { name: 'ECG', category: 'Diagnostics', qty: 1, price: 300 },
      { name: 'IV Drip Setup', category: 'Procedure', qty: 2, price: 350 },
      { name: 'Nursing Care (per hour)', category: 'Nursing', qty: 1, price: 200 },
    ],
  },
  {
    id: 'INV-2024-002', patient: 'Sunita Patel', patientId: 'PT-1002',
    date: '2026-02-18', doctor: 'Dr. Mehta', status: 'PENDING',
    items: [
      { name: 'Specialist Consultation', category: 'Consultation', qty: 1, price: 800 },
    ],
  },
  {
    id: 'INV-2024-003', patient: 'Mohammed Shaikh', patientId: 'PT-1003',
    date: '2026-02-15', doctor: 'Dr. Nair', status: 'PAID',
    items: [
      { name: 'General Consultation', category: 'Consultation', qty: 1, price: 500 },
      { name: 'X-Ray Chest', category: 'Imaging', qty: 1, price: 600 },
      { name: 'Ultrasound Abdomen', category: 'Imaging', qty: 1, price: 1200 },
      { name: 'HbA1c Test', category: 'Lab', qty: 1, price: 400 },
      { name: 'Dressing Change', category: 'Procedure', qty: 2, price: 150 },
      { name: 'Nursing Care (per hour)', category: 'Nursing', qty: 2, price: 200 },
    ],
  },
  {
    id: 'INV-2024-004', patient: 'Kavya Reddy', patientId: 'PT-1004',
    date: '2026-02-10', doctor: 'Dr. Sharma', status: 'OVERDUE',
    items: [
      { name: 'Specialist Consultation', category: 'Consultation', qty: 1, price: 800 },
      { name: 'Complete Blood Count', category: 'Lab', qty: 1, price: 250 },
    ],
  },
  {
    id: 'INV-2024-005', patient: 'Arjun Nair', patientId: 'PT-1005',
    date: '2026-01-28', doctor: 'Dr. Kumar', status: 'PAID',
    items: [
      { name: 'General Consultation', category: 'Consultation', qty: 2, price: 500 },
      { name: 'ECG', category: 'Diagnostics', qty: 1, price: 300 },
      { name: 'X-Ray Chest', category: 'Imaging', qty: 1, price: 600 },
      { name: 'IV Drip Setup', category: 'Procedure', qty: 1, price: 350 },
    ],
  },
  {
    id: 'INV-2024-006', patient: 'Priya Singh', patientId: 'PT-1006',
    date: '2026-01-20', doctor: 'Dr. Mehta', status: 'PAID',
    items: [
      { name: 'Specialist Consultation', category: 'Consultation', qty: 1, price: 800 },
      { name: 'HbA1c Test', category: 'Lab', qty: 2, price: 400 },
      { name: 'Nursing Care (per hour)', category: 'Nursing', qty: 3, price: 200 },
    ],
  },
];

const CATEGORY_COLORS = {
  Consultation: '#6c63ff',
  Lab:          '#10b981',
  Diagnostics:  '#f59e0b',
  Imaging:      '#3b82f6',
  Nursing:      '#ec4899',
  Procedure:    '#ef4444',
};

const STATUS_CONFIG = {
  PAID:    { color: '#10b981', bg: '#f0fdf4', label: '✅ Paid' },
  PENDING: { color: '#f59e0b', bg: '#fffbeb', label: '⏳ Pending' },
  OVERDUE: { color: '#ef4444', bg: '#fef2f2', label: '🚨 Overdue' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const subtotalOf = (inv) => inv.items.reduce((s, i) => s + i.price * i.qty, 0);
const totalOf    = (inv) => { const sub = subtotalOf(inv); return sub + Math.round(sub * 0.05); };

// ── Mini Donut Chart (SVG) ────────────────────────────────────────────────────
function DonutChart({ segments, size = 160 }) {
  const r = size / 2 - 20;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let offset = 0;
  const slices = segments.map((seg) => {
    const dash = (seg.value / total) * circumference;
    const gap  = circumference - dash;
    const slice = { ...seg, dash, gap, offset, dashOffset: circumference - offset };
    offset += dash;
    return slice;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f4f8" strokeWidth="28" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="28"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={s.dashOffset}
          strokeLinecap="butt"
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.6s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: '14px', fontWeight: '800', fill: '#1a202c', fontFamily: "'Outfit',sans-serif" }}>
        ₹{(total / 1000).toFixed(1)}k
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: '9px', fill: '#94a3b8', fontFamily: "'Outfit',sans-serif" }}>
        TOTAL
      </text>
    </svg>
  );
}

// ── Bar Chart (SVG) ───────────────────────────────────────────────────────────
function BarChart({ bars, height = 120, maxVal }) {
  const barW = 36, gap = 14;
  const width = bars.length * (barW + gap) + gap;
  const max = maxVal || Math.max(...bars.map(b => b.value)) || 1;
  return (
    <svg width={width} height={height + 30} style={{ overflow: 'visible' }}>
      {bars.map((bar, i) => {
        const barH = Math.max(4, (bar.value / max) * height);
        const x = gap + i * (barW + gap);
        const y = height - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={bar.color || '#1b6ca8'} opacity={0.85} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle"
              style={{ fontSize: '9px', fontWeight: '700', fill: '#4a5568', fontFamily: "'Outfit',sans-serif" }}>
              ₹{bar.value >= 1000 ? (bar.value / 1000).toFixed(1) + 'k' : bar.value}
            </text>
            <text x={x + barW / 2} y={height + 16} textAnchor="middle"
              style={{ fontSize: '8.5px', fill: '#94a3b8', fontFamily: "'Outfit',sans-serif" }}>
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Summary Stat Card ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-14px', right: '-14px', width: '72px', height: '72px', borderRadius: '50%', background: color, opacity: 0.07 }} />
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a202c', marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

// ── Invoice Detail Modal ──────────────────────────────────────────────────────
function InvoiceDetail({ inv, onClose }) {
  const sub   = subtotalOf(inv);
  const tax   = Math.round(sub * 0.05);
  const total = sub + tax;

  // category breakdown
  const catMap = {};
  inv.items.forEach(item => {
    const key = item.category;
    catMap[key] = (catMap[key] || 0) + item.price * item.qty;
  });
  const catSegments = Object.entries(catMap).map(([cat, val]) => ({ label: cat, value: val, color: CATEGORY_COLORS[cat] || '#94a3b8' }));

  const sc = STATUS_CONFIG[inv.status];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', marginBottom: '4px' }}>INVOICE BREAKDOWN</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a202c' }}>{inv.id}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '2px' }}>{inv.patient} · {inv.doctor}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: sc.color, background: sc.bg, padding: '5px 12px', borderRadius: '20px' }}>{sc.label}</span>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafd', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568' }}>×</button>
          </div>
        </div>

        {/* Donut + Category Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '24px', marginBottom: '28px', background: '#f8fafd', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart segments={catSegments} size={160} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '12px' }}>COST BY CATEGORY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {catSegments.map(seg => {
                const pct = Math.round((seg.value / sub) * 100);
                return (
                  <div key={seg.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>{seg.label}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: seg.color }}>₹{seg.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height: '5px', background: '#e9ecef', borderRadius: '99px' }}>
                      <div style={{ height: '5px', width: `${pct}%`, background: seg.color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '10px' }}>ITEMISED CHARGES</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f4c75' }}>
                {['Service', 'Category', 'Qty', 'Unit Price', 'Amount', '% of Bill'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Qty' ? 'center' : h === 'Unit Price' || h === 'Amount' || h === '% of Bill' ? 'right' : 'left', fontSize: '10px', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => {
                const amt = item.price * item.qty;
                const pct = ((amt / sub) * 100).toFixed(1);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{item.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: CATEGORY_COLORS[item.category], background: `${CATEGORY_COLORS[item.category]}18`, padding: '2px 8px', borderRadius: '20px' }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: '#4a5568' }}>{item.qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#4a5568' }}>₹{item.price.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#1a202c' }}>₹{amt.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <div style={{ width: '40px', height: '4px', background: '#f0f4f8', borderRadius: '99px' }}>
                          <div style={{ width: `${pct}%`, height: '4px', background: CATEGORY_COLORS[item.category], borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', minWidth: '32px' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '260px' }}>
            {[['Subtotal', `₹${sub.toLocaleString()}`], ['GST (5%)', `₹${Math.round(sub * 0.05).toLocaleString()}`]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f4f8', fontSize: '13px', color: '#374151' }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#0f4c75', borderRadius: '12px', marginTop: '8px' }}>
              <span style={{ fontWeight: '800', color: 'white', fontSize: '14px' }}>TOTAL PAYABLE</span>
              <span style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BillingBreakdown() {
  const [invoices, setInvoices] = useState(invoices);
  useEffect(() => {
    invoicesApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(inv => {
          let items = [];
          try { items = JSON.parse(inv.itemsJson || '[]'); } catch(e) {}
          return {
            id: inv.invoiceNumber || inv.id,
            patient: inv.patientName, patientId: inv.patientIdCode || '',
            date: (inv.invoiceDate || '').slice(0, 10),
            doctor: inv.doctorName, status: inv.status, items,
          };
        });
        setInvoices(mapped);
      }
    }).catch(() => {});
  }, []);
  const [selectedInv, setSelectedInv] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDoctor, setFilterDoctor] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  // Aggregate stats
  const totalRevenue   = invoices.reduce((s, inv) => s + totalOf(inv), 0);
  const paid           = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + totalOf(i), 0);
  const pending        = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + totalOf(i), 0);
  const overdue        = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + totalOf(i), 0);

  // Category aggregation (all invoices)
  const allCatMap = {};
  invoices.forEach(inv =>
    inv.items.forEach(item => {
      allCatMap[item.category] = (allCatMap[item.category] || 0) + item.price * item.qty;
    })
  );
  const catSegments = Object.entries(allCatMap)
    .map(([cat, val]) => ({ label: cat, value: val, color: CATEGORY_COLORS[cat] || '#94a3b8' }))
    .sort((a, b) => b.value - a.value);

  // Doctor aggregation
  const doctorMap = {};
  invoices.forEach(inv => {
    doctorMap[inv.doctor] = (doctorMap[inv.doctor] || 0) + totalOf(inv);
  });
  const doctorBars = Object.entries(doctorMap).map(([d, v]) => ({
    label: d.replace('Dr. ', ''),
    value: v,
    color: '#1b6ca8',
  }));

  // Monthly aggregation (Jan, Feb)
  const monthMap = { Jan: 0, Feb: 0 };
  invoices.forEach(inv => {
    const m = new Date(inv.date).toLocaleString('en', { month: 'short' });
    if (monthMap[m] !== undefined) monthMap[m] += totalOf(inv);
  });
  const monthBars = Object.entries(monthMap).map(([m, v]) => ({ label: m, value: v, color: '#6c63ff' }));

  // Filtered list
  const doctors = ['ALL', ...new Set(invoices.map(i => i.doctor))];
  const filtered = invoices
    .filter(i => filterStatus === 'ALL' || i.status === filterStatus)
    .filter(i => filterDoctor === 'ALL' || i.doctor === filterDoctor)
    .sort((a, b) => {
      if (sortBy === 'date')   return new Date(b.date) - new Date(a.date);
      if (sortBy === 'amount') return totalOf(b) - totalOf(a);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const inputStyle = { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '12px', fontFamily: "'Outfit',sans-serif", outline: 'none', background: 'white', cursor: 'pointer', color: '#1a202c' };

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: 0.7, letterSpacing: '1px', marginBottom: '6px' }}>FINANCIAL ANALYTICS</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>📊 Billing Breakdown</h1>
        <p style={{ opacity: 0.8, fontSize: '14px', margin: 0 }}>Deep-dive analytics — revenue by category, doctor, and status</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon="💰" label="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}k`} sub={`${invoices.length} invoices`} color="#0f4c75" />
        <StatCard icon="✅" label="Collected" value={`₹${(paid / 1000).toFixed(1)}k`} sub={`${Math.round((paid / totalRevenue) * 100)}% of total`} color="#10b981" />
        <StatCard icon="⏳" label="Pending" value={`₹${(pending / 1000).toFixed(1)}k`} sub="Awaiting payment" color="#f59e0b" />
        <StatCard icon="🚨" label="Overdue" value={`₹${(overdue / 1000).toFixed(1)}k`} sub="Requires follow-up" color="#ef4444" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Category Donut */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '16px' }}>REVENUE BY CATEGORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <DonutChart segments={catSegments} size={160} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {catSegments.map(seg => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }} />
                    <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '600' }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a202c' }}>₹{seg.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Bar */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '16px' }}>REVENUE BY DOCTOR</div>
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <BarChart bars={doctorBars} height={110} />
          </div>
        </div>

        {/* Monthly Bar */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '16px' }}>MONTHLY REVENUE TREND</div>
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <BarChart bars={monthBars} height={110} />
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafd', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>COLLECTION RATE</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{Math.round((paid / totalRevenue) * 100)}%</div>
            <div style={{ height: '5px', background: '#e9ecef', borderRadius: '99px', marginTop: '6px' }}>
              <div style={{ height: '5px', width: `${Math.round((paid / totalRevenue) * 100)}%`, background: '#10b981', borderRadius: '99px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '16px' }}>PAYMENT STATUS DISTRIBUTION</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          {[
            { label: 'Paid', count: invoices.filter(i => i.status === 'PAID').length, amount: paid, color: '#10b981', bg: '#f0fdf4', icon: '✅' },
            { label: 'Pending', count: invoices.filter(i => i.status === 'PENDING').length, amount: pending, color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
            { label: 'Overdue', count: invoices.filter(i => i.status === 'OVERDUE').length, amount: overdue, color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '18px', border: `1.5px solid ${s.color}30` }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: s.color, letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', marginBottom: '2px' }}>₹{(s.amount / 1000).toFixed(1)}k</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.count} invoice{s.count !== 1 ? 's' : ''}</div>
              <div style={{ height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '99px', marginTop: '8px' }}>
                <div style={{ height: '4px', width: `${Math.round((s.amount / totalRevenue) * 100)}%`, background: s.color, borderRadius: '99px' }} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: s.color, marginTop: '4px' }}>
                {Math.round((s.amount / totalRevenue) * 100)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table with Filters */}
      <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c' }}>All Invoices — Click any row for full breakdown</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} style={inputStyle}>
              {doctors.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Doctors' : d}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px 100px 100px 110px', padding: '10px 22px', background: '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
          {['Invoice #', 'Patient', 'Doctor', 'Items', 'Date', 'Total', 'Status'].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No invoices match your filters.</div>
        )}

        {filtered.map((inv, i) => {
          const sc = STATUS_CONFIG[inv.status];
          const tot = totalOf(inv);
          // Top category for this invoice
          const iCatMap = {};
          inv.items.forEach(it => { iCatMap[it.category] = (iCatMap[it.category] || 0) + it.price * it.qty; });
          const topCat = Object.entries(iCatMap).sort((a, b) => b[1] - a[1])[0]?.[0];
          return (
            <div key={inv.id} onClick={() => setSelectedInv(inv)}
              style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px 100px 100px 110px', padding: '14px 22px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafd'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1b6ca8', fontWeight: '700' }}>{inv.id}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{inv.patient}</div>
                {topCat && <span style={{ fontSize: '10px', fontWeight: '700', color: CATEGORY_COLORS[topCat], background: `${CATEGORY_COLORS[topCat]}15`, padding: '1px 6px', borderRadius: '10px' }}>Top: {topCat}</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{inv.doctor}</div>
              <div style={{ fontSize: '12px', color: '#4a5568' }}>{inv.items.length}</div>
              <div style={{ fontSize: '12px', color: '#4a5568' }}>{new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f4c75' }}>₹{tot.toLocaleString()}</div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: sc.color, background: sc.bg, padding: '3px 8px', borderRadius: '20px', width: 'fit-content' }}>{sc.label}</span>
            </div>
          );
        })}

        {/* Footer totals */}
        <div style={{ padding: '14px 22px', background: '#0f4c75', display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px 100px 100px 110px', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', gridColumn: '1/5' }}>
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} shown
          </div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>
            ₹{filtered.reduce((s, i) => s + totalOf(i), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>TOTAL</div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInv && <InvoiceDetail inv={selectedInv} onClose={() => setSelectedInv(null)} />}
    </div>
  );
}
