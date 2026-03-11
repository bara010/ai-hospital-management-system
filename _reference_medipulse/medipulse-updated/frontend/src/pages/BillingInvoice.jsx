import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { invoices as invoicesApi, audit } from '../services/api';

const SERVICES = [
  { id: 1, name: 'General Consultation', price: 500, category: 'Consultation' },
  { id: 2, name: 'Specialist Consultation', price: 800, category: 'Consultation' },
  { id: 3, name: 'ECG', price: 300, category: 'Diagnostics' },
  { id: 4, name: 'Complete Blood Count', price: 250, category: 'Lab' },
  { id: 5, name: 'HbA1c Test', price: 400, category: 'Lab' },
  { id: 6, name: 'X-Ray Chest', price: 600, category: 'Imaging' },
  { id: 7, name: 'Ultrasound Abdomen', price: 1200, category: 'Imaging' },
  { id: 8, name: 'Nursing Care (per hour)', price: 200, category: 'Nursing' },
  { id: 9, name: 'IV Drip Setup', price: 350, category: 'Procedure' },
  { id: 10, name: 'Dressing Change', price: 150, category: 'Procedure' },
];

const PAST_INVOICES = [
  { id: 'INV-2024-001', patient: 'Rahul Verma', date: 'Feb 20, 2026', total: 1850, status: 'PAID', doctor: 'Dr. Sharma' },
  { id: 'INV-2024-002', patient: 'Sunita Patel', date: 'Feb 18, 2026', total: 500, status: 'PENDING', doctor: 'Dr. Mehta' },
  { id: 'INV-2024-003', patient: 'Mohammed Shaikh', date: 'Feb 15, 2026', total: 3200, status: 'PAID', doctor: 'Dr. Nair' },
  { id: 'INV-2024-004', patient: 'Kavya Reddy', date: 'Feb 10, 2026', total: 750, status: 'OVERDUE', doctor: 'Dr. Sharma' },
];

const statusConfig = {
  PAID:    { color: '#10b981', bg: '#f0fdf4', label: '✅ Paid' },
  PENDING: { color: '#f59e0b', bg: '#fffbeb', label: '⏳ Pending' },
  OVERDUE: { color: '#ef4444', bg: '#fef2f2', label: '🚨 Overdue' },
};

function PrintableInvoice({ invoice, ref: _ref }) {
  const { items, patientName, patientId, doctorName, invoiceDate, invoiceNo } = invoice;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  return (
    <div id="printable-invoice" style={{ background: 'white', padding: '40px', maxWidth: '700px', margin: '0 auto', fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #0f4c75' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px' }}>✚</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f4c75' }}>MediPulse Hospital</div>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>123 Healthcare Ave, Medical District</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>GST: 22AAAAA0000A1Z5 | Tel: +91 98765 43210</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f4c75', marginBottom: '4px' }}>INVOICE</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8' }}>{invoiceNo}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{invoiceDate}</div>
        </div>
      </div>

      {/* Patient / Doctor Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '14px', background: '#f8fafd', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '6px' }}>BILLED TO</div>
          <div style={{ fontWeight: '700', color: '#1a202c' }}>{patientName}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Patient ID: {patientId}</div>
        </div>
        <div style={{ padding: '14px', background: '#f8fafd', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '6px' }}>ATTENDING DOCTOR</div>
          <div style={{ fontWeight: '700', color: '#1a202c' }}>{doctorName}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Date: {invoiceDate}</div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#0f4c75', color: 'white' }}>
            {['#', 'Service / Description', 'Category', 'Qty', 'Unit Price', 'Total'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: h === '#' || h === 'Qty' ? 'center' : h === 'Unit Price' || h === 'Total' ? 'right' : 'left', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? 'white' : '#f8fafd' }}>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>{i + 1}</td>
              <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{item.name}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#94a3b8' }}>{item.category}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: '#1a202c' }}>{item.qty}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#1a202c' }}>₹{item.price.toLocaleString()}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#1a202c' }}>₹{(item.price * item.qty).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '260px' }}>
          {[['Subtotal', `₹${subtotal.toLocaleString()}`], ['GST (5%)', `₹${tax.toLocaleString()}`]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f4f8', fontSize: '13px', color: '#374151' }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f4c75', borderRadius: '10px', marginTop: '8px' }}>
            <span style={{ fontWeight: '800', color: 'white', fontSize: '14px' }}>TOTAL</span>
            <span style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f0f4f8', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Thank you for choosing MediPulse Hospital. For billing queries: billing@medipulse.com | +91 98765 43210
      </div>
    </div>
  );
}

export default function BillingInvoice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [pastInvoices, setPastInvoices] = useState(PAST_INVOICES);

  useEffect(() => {
    invoicesApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(inv => ({
          id: inv.invoiceNumber,
          patient: inv.patientName,
          date: new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          total: inv.total,
          status: inv.status,
          doctor: inv.doctorName,
        }));
        setPastInvoices(mapped);
      }
    }).catch(() => {});
  }, []);
  const [selectedServices, setSelectedServices] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Sharma');
  const [preview, setPreview] = useState(null);

  const addService = (svc) => {
    setSelectedServices(prev => {
      const ex = prev.find(s => s.id === svc.id);
      if (ex) return prev.map(s => s.id === svc.id ? { ...s, qty: s.qty + 1 } : s);
      return [...prev, { ...svc, qty: 1 }];
    });
  };

  const removeService = (id) => setSelectedServices(prev => prev.filter(s => s.id !== id));
  const updateQty = (id, qty) => setSelectedServices(prev => prev.map(s => s.id === id ? { ...s, qty: Math.max(1, qty) } : s));

  const subtotal = selectedServices.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const generateInvoice = async () => {
    if (!patientName || selectedServices.length === 0) return;
    const invoiceNo = 'INV-' + Date.now().toString().slice(-6);
    const pidCode = patientId || 'PT-' + Math.floor(Math.random() * 9000 + 1000);
    setPreview({
      items: selectedServices,
      patientName,
      patientId: pidCode,
      doctorName,
      invoiceDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      invoiceNo,
    });
    // Persist to backend
    try {
      await invoicesApi.create({
        invoiceNumber: invoiceNo,
        patientName,
        patientIdCode: pidCode,
        doctorName,
        itemsJson: JSON.stringify(selectedServices),
        subtotal,
        tax,
        status: 'PENDING',
      });
      audit.log({ userEmail: user?.email, userName: user?.name, userRole: user?.role, action: 'GENERATE_INVOICE', resource: `Invoice ${invoiceNo}`, status: 'SUCCESS', details: `Generated invoice for ${patientName}` }).catch(() => {});
      // Refresh history list
      invoicesApi.getAll().then(res => {
        if (res.data) {
          setPastInvoices(res.data.map(inv => ({
            id: inv.invoiceNumber, patient: inv.patientName,
            date: new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            total: inv.total, status: inv.status, doctor: inv.doctorName,
          })));
        }
      }).catch(() => {});
    } catch (e) { /* local state already set */ }
  };

  const printInvoice = () => window.print();

  return (
    <div>
      <style>{`@media print { body > * { display: none; } #printable-invoice { display: block !important; } }`}</style>
      <div style={{ background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>BILLING SYSTEM</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>💰 Billing & Invoices</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Generate professional GST invoices and track payment status</p>
        <div style={{ marginTop: '14px' }}>
          <button onClick={() => navigate('/billing-breakdown')}
            style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            📊 View Revenue Breakdown →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #f0f4f8' }}>
        {[{ id: 'create', label: '➕ Create Invoice' }, { id: 'history', label: '📋 Invoice History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px', border: 'none', background: tab === t.id ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#f8fafd', color: tab === t.id ? 'white' : '#4a5568', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>{t.label}</button>
        ))}
      </div>

      {tab === 'create' && !preview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Patient Info */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '14px' }}>Patient Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>PATIENT NAME *</label>
                  <input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full Name"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>PATIENT ID</label>
                  <input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Auto-generated if blank"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>DOCTOR</label>
                  <select value={doctorName} onChange={e => setDoctorName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'white', boxSizing: 'border-box' }}>
                    {['Dr. Sharma', 'Dr. Mehta', 'Dr. Nair', 'Dr. Kumar'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Services */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a202c', marginBottom: '14px' }}>Add Services</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {SERVICES.map(svc => (
                  <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #f0f4f8', background: '#fafafa' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{svc.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{svc.category}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f4c75' }}>₹{svc.price}</div>
                    <button onClick={() => addService(svc)} style={{ padding: '5px 12px', background: '#eff6ff', color: '#1b6ca8', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>+ Add</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ background: 'white', borderRadius: '18px', padding: '22px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a202c', marginBottom: '16px' }}>📋 Invoice Summary</div>
              {selectedServices.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>No services added yet</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {selectedServices.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a202c' }}>{s.name}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => updateQty(s.id, s.qty - 1)} style={{ width: '22px', height: '22px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                          <span style={{ fontSize: '12px', fontWeight: '700', width: '20px', textAlign: 'center' }}>{s.qty}</span>
                          <button onClick={() => updateQty(s.id, s.qty + 1)} style={{ width: '22px', height: '22px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f4c75', width: '60px', textAlign: 'right' }}>₹{(s.price * s.qty).toLocaleString()}</div>
                        <button onClick={() => removeService(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #f0f4f8', paddingTop: '12px' }}>
                    {[['Subtotal', `₹${subtotal.toLocaleString()}`], ['GST (5%)', `₹${tax.toLocaleString()}`]].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}><span>{l}</span><span>{v}</span></div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0f4c75', borderRadius: '10px', marginTop: '8px' }}>
                      <span style={{ fontWeight: '800', color: 'white', fontSize: '14px' }}>TOTAL</span>
                      <span style={{ fontWeight: '800', color: 'white', fontSize: '15px' }}>₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={generateInvoice} disabled={!patientName}
                    style={{ width: '100%', marginTop: '14px', padding: '12px', background: patientName ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : '#e2e8f0', color: patientName ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: patientName ? 'pointer' : 'not-allowed', fontFamily: "'Outfit',sans-serif" }}>
                    📄 Generate Invoice
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'create' && preview && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button onClick={printInvoice} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#0f4c75,#1b6ca8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>🖨️ Print / Save PDF</button>
            <button onClick={() => setPreview(null)} style={{ padding: '10px 20px', background: 'white', color: '#4a5568', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>← New Invoice</button>
          </div>
          <div style={{ border: '1px solid #f0f4f8', borderRadius: '18px', overflow: 'hidden' }}>
            <PrintableInvoice invoice={preview} />
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px 100px 100px', gap: 0, padding: '12px 20px', background: '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
            {['Invoice #', 'Patient', 'Doctor', 'Date', 'Amount', 'Status'].map(h => <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{h.toUpperCase()}</div>)}
          </div>
          {pastInvoices.map((inv, i) => {
            const sc = statusConfig[inv.status];
            return (
              <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px 100px 100px', gap: 0, padding: '14px 20px', borderBottom: i < pastInvoices.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1b6ca8', fontWeight: '700' }}>{inv.id}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{inv.patient}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.doctor}</div>
                <div style={{ fontSize: '12px', color: '#4a5568' }}>{inv.date}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f4c75' }}>₹{inv.total.toLocaleString()}</div>
                <div><span style={{ fontSize: '11px', fontWeight: '700', color: sc.color, background: sc.bg, padding: '3px 8px', borderRadius: '20px' }}>{sc.label}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
