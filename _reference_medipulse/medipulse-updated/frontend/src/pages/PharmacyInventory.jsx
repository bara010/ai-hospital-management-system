import React, { useState, useEffect } from 'react';
import { pharmacy as pharmacyApi } from '../services/api';

const INVENTORY = [
  { id: 1, name: 'Metformin 500mg', category: 'Diabetes', stock: 245, minStock: 100, unit: 'tablets', expiryDate: 'Dec 2026', supplier: 'Sun Pharma', unitCost: 2.5, monthlyUsage: 180, icon: '💊' },
  { id: 2, name: 'Lisinopril 10mg', category: 'Cardiology', stock: 82, minStock: 100, unit: 'tablets', expiryDate: 'Oct 2026', supplier: 'Cipla', unitCost: 3.8, monthlyUsage: 120, icon: '💊' },
  { id: 3, name: 'Atorvastatin 20mg', category: 'Cholesterol', stock: 18, minStock: 80, unit: 'tablets', expiryDate: 'Nov 2026', supplier: 'Dr. Reddys', unitCost: 5.2, monthlyUsage: 90, icon: '💊' },
  { id: 4, name: 'Insulin Glargine', category: 'Diabetes', stock: 24, minStock: 30, unit: 'vials', expiryDate: 'Apr 2026', supplier: 'Novo Nordisk', unitCost: 380, monthlyUsage: 20, icon: '💉' },
  { id: 5, name: 'Aspirin 75mg', category: 'Cardiac', stock: 512, minStock: 200, unit: 'tablets', expiryDate: 'Jan 2027', supplier: 'Bayer', unitCost: 0.8, monthlyUsage: 150, icon: '💊' },
  { id: 6, name: 'IV Normal Saline 500ml', category: 'IV Fluids', stock: 45, minStock: 50, unit: 'bags', expiryDate: 'Mar 2026', supplier: 'Baxter', unitCost: 85, monthlyUsage: 60, icon: '🧴' },
  { id: 7, name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 310, minStock: 150, unit: 'capsules', expiryDate: 'Aug 2026', supplier: 'Ranbaxy', unitCost: 4.5, monthlyUsage: 200, icon: '💊' },
  { id: 8, name: 'Omeprazole 20mg', category: 'GI', stock: 7, minStock: 80, unit: 'capsules', expiryDate: 'May 2026', supplier: 'Zydus', unitCost: 3.2, monthlyUsage: 70, icon: '💊' },
];

function getStockStatus(item) {
  if (item.stock <= 0) return 'out';
  if (item.stock <= item.minStock * 0.3) return 'critical';
  if (item.stock <= item.minStock) return 'low';
  return 'ok';
}

const STATUS_CONFIG = {
  ok:       { color: '#10b981', bg: '#f0fdf4', label: '✅ In Stock' },
  low:      { color: '#f59e0b', bg: '#fffbeb', label: '⚠️ Low Stock' },
  critical: { color: '#ef4444', bg: '#fef2f2', label: '🚨 Critical' },
  out:      { color: '#dc2626', bg: '#fff1f1', label: '❌ Out of Stock' },
};

const daysRemaining = (item) => Math.round(item.stock / (item.monthlyUsage / 30));

export default function PharmacyInventory() {
  const [inventory, setInventory] = useState(INVENTORY);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [tab, setTab] = useState('inventory');
  const [reorders, setReorders] = useState([]);

  // Load from backend
  useEffect(() => {
    pharmacyApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          stock: item.stock,
          minStock: item.minStock,
          unit: item.unit || 'units',
          expiryDate: item.expiryDate || 'N/A',
          supplier: item.supplier,
          unitCost: item.unitPrice,
          monthlyUsage: item.minStock * 2, // estimated
          icon: '💊',
          stockStatus: item.stockStatus,
        }));
        setInventory(mapped);
      }
    }).catch(() => {});
  }, []);

  const filtered = inventory.filter(item => {
    const s = getStockStatus(item);
    if (filterStatus !== 'ALL' && s !== filterStatus) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const criticalItems = inventory.filter(i => ['critical', 'out'].includes(getStockStatus(i)));
  const lowItems = inventory.filter(i => getStockStatus(i) === 'low');
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.unitCost, 0);

  const addReorder = (item) => {
    const qty = item.monthlyUsage * 2;
    setReorders(prev => {
      if (prev.find(r => r.id === item.id)) return prev;
      return [...prev, { ...item, orderQty: qty, status: 'PENDING', ordered: new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' }) }];
    });
    setTab('orders');
  };

  const placeAllOrders = () => {
    setReorders(prev => prev.map(r => ({ ...r, status: 'ORDERED' })));
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderRadius: '20px', padding: '28px 32px', marginBottom: '24px', color: 'white' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', opacity: .7, letterSpacing: '1px', marginBottom: '6px' }}>PHARMACY ADMIN · PRO</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px' }}>🏪 Pharmacy Inventory</h1>
        <p style={{ opacity: .8, fontSize: '14px', margin: 0 }}>Real-time stock levels, AI-predicted reorder alerts, and supplier management</p>
      </div>

      {/* Alerts banner */}
      {criticalItems.length > 0 && (
        <div style={{ background: '#fef2f2', borderRadius: '14px', padding: '14px 20px', border: '1.5px solid #fecaca', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#dc2626' }}>{criticalItems.length} items at critical/zero stock — immediate reorder required</div>
            <div style={{ fontSize: '11px', color: '#b91c1c' }}>{criticalItems.map(i => i.name).join(', ')}</div>
          </div>
          <button onClick={() => criticalItems.forEach(addReorder)} style={{ padding: '7px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>Reorder All →</button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { icon: '📦', val: inventory.length, label: 'Total SKUs', color: '#8b5cf6' },
          { icon: '🚨', val: criticalItems.length + lowItems.length, label: 'Need Reorder', color: '#ef4444' },
          { icon: '✅', val: inventory.filter(i => getStockStatus(i) === 'ok').length, label: 'In Stock', color: '#10b981' },
          { icon: '💰', val: `₹${Math.round(totalValue).toLocaleString()}`, label: 'Stock Value', color: '#f59e0b' },
        ].map((s,i) => (
          <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid #f0f4f8' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'white', padding: '8px', borderRadius: '14px', border: '1px solid #f0f4f8' }}>
        {[{ id: 'inventory', label: '📦 Inventory' }, { id: 'orders', label: `🛒 Reorders (${reorders.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px', border: 'none', background: tab === t.id ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : '#f8fafd', color: tab === t.id ? 'white' : '#4a5568', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "'Outfit',sans-serif" }}>{t.label}</button>
        ))}
      </div>

      {tab === 'inventory' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search medicines..."
              style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
            {['ALL', 'critical', 'low', 'ok'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '9px 16px', borderRadius: '20px', border: `1.5px solid ${filterStatus === s ? '#8b5cf6' : '#e2e8f0'}`, background: filterStatus === s ? '#f5f3ff' : 'white', color: filterStatus === s ? '#8b5cf6' : '#4a5568', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 100px 80px 80px 100px', gap: 0, padding: '12px 20px', background: '#f8fafd', borderBottom: '1px solid #f0f4f8' }}>
              {['Medicine', 'Stock', 'Min', 'Days Left', 'Status', 'Value', 'Action'].map(h => (
                <div key={h} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>{h.toUpperCase()}</div>
              ))}
            </div>
            {filtered.map((item, i) => {
              const s = getStockStatus(item);
              const sc = STATUS_CONFIG[s];
              const days = daysRemaining(item);
              return (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 100px 80px 80px 100px', gap: 0, padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafd' : 'none', alignItems: 'center', background: s === 'critical' || s === 'out' ? '#fff8f8' : 'white' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{item.icon} {item.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.category} · {item.supplier}</div>
                    <div style={{ height: '4px', background: '#f0f4f8', borderRadius: '99px', marginTop: '6px', width: '140px' }}>
                      <div style={{ height: '4px', width: `${Math.min(100, (item.stock / (item.minStock * 3)) * 100)}%`, background: sc.color, borderRadius: '99px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: sc.color }}>{item.stock} <span style={{ fontSize: '10px', fontWeight: '500', color: '#94a3b8' }}>{item.unit}</span></div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.minStock}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: days <= 7 ? '#ef4444' : days <= 14 ? '#f59e0b' : '#10b981' }}>{days} days</div>
                  <div><span style={{ fontSize: '10px', fontWeight: '700', color: sc.color, background: sc.bg, padding: '3px 7px', borderRadius: '20px' }}>{s === 'ok' ? '✅' : s === 'low' ? '⚠️' : '🚨'}</span></div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>₹{Math.round(item.stock * item.unitCost).toLocaleString()}</div>
                  <div>
                    {s !== 'ok' && (
                      <button onClick={() => addReorder(item)} style={{ padding: '5px 10px', background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>Reorder</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {reorders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'white', borderRadius: '18px', border: '1px solid #f0f4f8' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛒</div>
              No reorders queued. Go to Inventory and click "Reorder" on low-stock items.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                <button onClick={placeAllOrders} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  📤 Place All Orders ({reorders.filter(r => r.status === 'PENDING').length} pending)
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reorders.map((r, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', border: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '24px' }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.supplier} · Ordered: {r.ordered}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#8b5cf6' }}>{r.orderQty}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{r.unit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a202c' }}>₹{Math.round(r.orderQty * r.unitCost).toLocaleString()}</div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: r.status === 'ORDERED' ? '#10b981' : '#f59e0b', background: r.status === 'ORDERED' ? '#f0fdf4' : '#fffbeb', padding: '2px 8px', borderRadius: '20px' }}>
                        {r.status === 'ORDERED' ? '✅ Ordered' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
