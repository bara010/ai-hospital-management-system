import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import BrandLogo from '../components/BrandLogo';
import { SPECIALIZATION_OPTIONS } from '../constants/medicalSpecializations';
import { useAuth } from '../hooks/useAuth';
import { capitalizeWordsInput } from '../utils/text';

const initialForm = {
  role: 'PATIENT',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  specialization: '',
  qualification: '',
  yearsExperience: '',
  dateOfBirth: '',
  bloodGroup: '',
  address: '',
  allergies: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const CAPITALIZE_KEYS = new Set([
  'firstName',
  'lastName',
  'specialization',
  'qualification',
  'bloodGroup',
  'address',
  'allergies',
  'emergencyContactName',
]);

export default function RegisterPage() {
  const { register, verifyRegistrationTotp } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [setup, setSetup] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (key, value) => {
    const nextValue = CAPITALIZE_KEYS.has(key) ? capitalizeWordsInput(value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        specialization: form.specialization?.trim() || null,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        dateOfBirth: form.dateOfBirth || null,
      };
      const response = await register(payload);
      setSetup(response);
      setSuccess('Registration successful. Scan QR and verify the TOTP code.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (!setup) return;

    setError('');
    setSuccess('');
    setVerifying(true);

    try {
      const response = await verifyRegistrationTotp({ email: setup.email, code: verificationCode });
      setSuccess(response.message || 'TOTP verified. You can now login.');
    } catch (err) {
      setError(err?.response?.data?.message || 'TOTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={onRegister} className="panel">
          <div className="mb-3 flex items-center gap-2">
            <BrandLogo to="/" iconSize={28} />
          </div>
          <h2 className="panel-title">Create HOSPITO Account</h2>
          <p className="mt-1 text-sm text-slate-500">Register as patient, doctor, or admin.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => onChange('role', e.target.value)}>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} required />
            </div>

            <div>
              <label className="label">Password</label>
              <input className="input" type="password" minLength={8} value={form.password} onChange={(e) => onChange('password', e.target.value)} required />
            </div>

            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
            </div>

            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} required />
            </div>

            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} required />
            </div>

            {form.role === 'DOCTOR' ? (
              <>
                <div>
                  <label className="label">Specialization</label>
                  <input className="input" list="specialization-options" value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Qualification</label>
                  <input className="input" value={form.qualification} onChange={(e) => onChange('qualification', e.target.value)} />
                </div>
                <div>
                  <label className="label">Years Experience</label>
                  <input className="input" type="number" min={0} value={form.yearsExperience} onChange={(e) => onChange('yearsExperience', e.target.value)} />
                </div>
              </>
            ) : null}

            {form.role === 'PATIENT' ? (
              <>
                <div>
                  <label className="label">Date of Birth</label>
                  <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <input className="input" value={form.bloodGroup} onChange={(e) => onChange('bloodGroup', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={(e) => onChange('address', e.target.value)} />
                </div>
                <div>
                  <label className="label">Allergies</label>
                  <input className="input" value={form.allergies} onChange={(e) => onChange('allergies', e.target.value)} />
                </div>
                <div>
                  <label className="label">Emergency Contact Name</label>
                  <input className="input" value={form.emergencyContactName} onChange={(e) => onChange('emergencyContactName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Emergency Contact Phone</label>
                  <input className="input" value={form.emergencyContactPhone} onChange={(e) => onChange('emergencyContactPhone', e.target.value)} />
                </div>
              </>
            ) : null}
          </div>

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
          {success ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{success}</p> : null}

          <button className="btn-primary mt-5 w-full" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <aside className="panel">
          <h2 className="panel-title">TOTP Setup</h2>
          <p className="mt-1 text-sm text-slate-500">Scan using Google Authenticator / Authy / Microsoft Authenticator.</p>

          {!setup ? <p className="mt-4 text-sm text-slate-500">QR code appears after successful registration.</p> : null}

          {setup ? (
            <div className="mt-4 space-y-4">
              <img src={setup.qrCodeDataUrl} alt="TOTP QR" className="mx-auto w-44 rounded-xl border border-slate-200" />
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <strong>Secret:</strong> {setup.totpSecret}
              </p>

              <form onSubmit={onVerify} className="space-y-3">
                <div>
                  <label className="label">Enter 6-digit code</label>
                  <input className="input" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} maxLength={6} pattern="[0-9]{6}" required />
                </div>
                <button className="btn-secondary w-full" type="submit" disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify TOTP'}
                </button>
              </form>
            </div>
          ) : null}
        </aside>
      </section>

      <datalist id="specialization-options">
        {SPECIALIZATION_OPTIONS.map((specialization) => (
          <option key={specialization} value={specialization} />
        ))}
      </datalist>
    </AppLayout>
  );
}
