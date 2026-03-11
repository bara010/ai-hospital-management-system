import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Loading from '../components/Loading';
import { SPECIALIZATION_OPTIONS } from '../constants/medicalSpecializations';
import { profileApi } from '../services/hospitoApi';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const MEDICAL_PROBLEM_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'Arthritis',
  'Migraine',
  'None',
  'Other',
];

function toNumericInput(value) {
  if (value === null || value === undefined || value === '') return '';
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? String(asNumber) : '';
}

function calculateAgeFromDob(dateOfBirth) {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age > 0 ? String(age) : '';
}

function normalizeProblemSelection(list = []) {
  const unique = [...new Set(list.filter((item) => MEDICAL_PROBLEM_OPTIONS.includes(item)))];
  if (unique.includes('None')) return ['None'];
  return unique;
}

function parseMedicalBundle(allergies, dateOfBirth) {
  const fallback = {
    medicalProblems: [],
    otherMedicalProblem: '',
    gender: '',
    age: calculateAgeFromDob(dateOfBirth),
    heightCm: '',
    weightKg: '',
    emergencyRelationship: '',
  };

  if (!allergies || !String(allergies).trim()) return fallback;
  const raw = String(allergies).trim();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { ...fallback, medicalProblems: normalizeProblemSelection(parsed.map(String)) };
    }

    if (parsed && typeof parsed === 'object') {
      const medicalProblems = normalizeProblemSelection(
        Array.isArray(parsed.medicalProblems) ? parsed.medicalProblems.map(String) : [],
      );
      const otherMedicalProblem = typeof parsed.otherMedicalProblem === 'string' ? parsed.otherMedicalProblem : '';
      return {
        medicalProblems: medicalProblems.length ? medicalProblems : (otherMedicalProblem ? ['Other'] : []),
        otherMedicalProblem,
        gender: GENDER_OPTIONS.includes(parsed.gender) ? parsed.gender : '',
        age: toNumericInput(parsed.age ?? fallback.age),
        heightCm: toNumericInput(parsed.heightCm),
        weightKg: toNumericInput(parsed.weightKg),
        emergencyRelationship:
          typeof parsed.emergencyRelationship === 'string' ? parsed.emergencyRelationship : '',
      };
    }
  } catch {
    return {
      ...fallback,
      medicalProblems: ['Other'],
      otherMedicalProblem: raw,
    };
  }

  return fallback;
}

function serializeMedicalBundle(form) {
  const selected = normalizeProblemSelection(form.medicalProblems || []);
  const otherMedicalProblem = selected.includes('Other') ? form.otherMedicalProblem?.trim() || '' : '';
  const bundle = {
    medicalProblems: selected,
    otherMedicalProblem,
    gender: form.gender || null,
    age: form.age === '' ? null : Number(form.age),
    heightCm: form.heightCm === '' ? null : Number(form.heightCm),
    weightKg: form.weightKg === '' ? null : Number(form.weightKg),
    emergencyRelationship: form.emergencyRelationship?.trim() || '',
  };
  return JSON.stringify(bundle);
}

function normalizeProfile(data) {
  const medical = parseMedicalBundle(data?.allergies, data?.dateOfBirth);
  return {
    ...data,
    dateOfBirth: data?.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
    yearsExperience: data?.yearsExperience ?? '',
    ...medical,
  };
}

export default function ProfilePage() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get('section');

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isMedicalDropdownOpen, setIsMedicalDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.me();
      const normalized = normalizeProfile(data);
      setProfile(normalized);
      setForm(normalized);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isMedicalDropdownOpen) return undefined;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMedicalDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMedicalDropdownOpen]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleMedicalProblem = (option) => {
    setForm((prev) => {
      const existing = Array.isArray(prev.medicalProblems) ? prev.medicalProblems : [];

      if (option === 'None') {
        return { ...prev, medicalProblems: existing.includes('None') ? [] : ['None'], otherMedicalProblem: '' };
      }

      const withoutNone = existing.filter((item) => item !== 'None');
      const hasOption = withoutNone.includes(option);
      const next = hasOption ? withoutNone.filter((item) => item !== option) : [...withoutNone, option];

      return {
        ...prev,
        medicalProblems: next,
        otherMedicalProblem: option === 'Other' && hasOption ? '' : prev.otherMedicalProblem,
      };
    });
  };

  const medicalProblemsSummary = useMemo(() => {
    const selected = form.medicalProblems || [];
    if (!selected.length) return 'Select conditions';
    return selected.join(', ');
  }, [form.medicalProblems]);

  const validatePatientForm = () => {
    if (!form.bloodGroup) return 'Blood Group is required.';
    if (!form.gender) return 'Gender is required.';

    const ageNumber = Number(form.age);
    if (form.age === '' || !Number.isInteger(ageNumber) || ageNumber <= 0 || ageNumber > 130) {
      return 'Age is required and must be a valid number between 1 and 130.';
    }

    if ((form.medicalProblems || []).includes('Other') && !(form.otherMedicalProblem || '').trim()) {
      return 'Please describe the Other medical condition.';
    }

    const serialized = serializeMedicalBundle(form);
    if (serialized.length > 1000) {
      return 'Medical details are too long. Please shorten the "Other" condition.';
    }

    return '';
  };

  const save = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (profile?.role === 'PATIENT') {
      const validationError = validatePatientForm();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      const encodedMedicalBundle =
        profile?.role === 'PATIENT' ? serializeMedicalBundle(form) : form.allergies;

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        bloodGroup: form.bloodGroup,
        allergies: encodedMedicalBundle,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        dateOfBirth: form.dateOfBirth || null,
        specialization: form.specialization?.trim() || null,
        qualification: form.qualification,
        yearsExperience: form.yearsExperience === '' ? null : Number(form.yearsExperience),
        bio: form.bio,
        availabilityNotes: form.availabilityNotes,
      };
      const updated = await profileApi.update(payload);
      const normalized = normalizeProfile(updated);
      setProfile(normalized);
      setForm(normalized);
      setMessage('Profile updated successfully.');
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await profileApi.uploadPhoto(file);
      const normalized = normalizeProfile(updated);
      setProfile(normalized);
      setForm(normalized);
      setMessage('Profile photo updated.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload photo.');
    }
  };

  return (
    <AppLayout>
      {loading ? <Loading label="Loading profile..." /> : null}
      {error ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}

      {section === 'settings' ? (
        <section className="panel max-w-3xl">
          <h2 className="panel-title">Settings</h2>
          <p className="mt-2 text-sm text-slate-600">
            Keep your account secure by using strong password hygiene and authenticator backup codes.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-3">TOTP is enabled for your account login.</li>
            <li className="rounded-xl bg-slate-50 p-3">Profile updates are audited for compliance.</li>
            <li className="rounded-xl bg-slate-50 p-3">Use a current phone number for reminder delivery.</li>
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel">
          <h2 className="panel-title">Profile Overview</h2>
          {profile ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <img
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
                src={profile.profilePictureUrl || 'https://via.placeholder.com/120x120?text=Profile'}
                alt="Profile"
              />
              <input type="file" accept="image/*" onChange={uploadPhoto} className="text-sm" />
              <p className="font-semibold text-slate-900">{profile.firstName} {profile.lastName}</p>
              <p>{profile.email}</p>
              <p className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{profile.role}</p>
            </div>
          ) : null}
        </aside>

        <form onSubmit={save} className="panel">
          <h2 className="panel-title">Edit Profile</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="First Name" value={form.firstName || ''} onChange={(e) => onChange('firstName', e.target.value)} />
            <input className="input" placeholder="Last Name" value={form.lastName || ''} onChange={(e) => onChange('lastName', e.target.value)} />
            <input className="input" placeholder="Phone" value={form.phone || ''} onChange={(e) => onChange('phone', e.target.value)} />

            {profile?.role === 'PATIENT' ? (
              <>
                <div className="sm:col-span-2 mt-1 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5v14" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">Medical Problems / Health Conditions</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 relative" ref={dropdownRef}>
                      <label className="label">Select Conditions</label>
                      <button
                        type="button"
                        className="input flex items-center justify-between text-left"
                        onClick={() => setIsMedicalDropdownOpen((prev) => !prev)}
                      >
                        <span className={(form.medicalProblems || []).length ? 'text-slate-900' : 'text-slate-400'}>
                          {medicalProblemsSummary}
                        </span>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {isMedicalDropdownOpen ? (
                        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                          {MEDICAL_PROBLEM_OPTIONS.map((option) => (
                            <label
                              key={option}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                                checked={(form.medicalProblems || []).includes(option)}
                                onChange={() => toggleMedicalProblem(option)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {(form.medicalProblems || []).includes('Other') ? (
                      <div className="sm:col-span-2">
                        <label className="label">Other Condition</label>
                        <input
                          className="input"
                          placeholder="Enter custom condition"
                          value={form.otherMedicalProblem || ''}
                          onChange={(e) => onChange('otherMedicalProblem', e.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10Z" />
                        <path d="M9.5 11.5h5" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">Additional Medical Information</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Blood Group *</label>
                      <select
                        className="input"
                        value={form.bloodGroup || ''}
                        onChange={(e) => onChange('bloodGroup', e.target.value)}
                      >
                        <option value="">Select blood group</option>
                        {BLOOD_GROUP_OPTIONS.map((group) => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Gender *</label>
                      <select className="input" value={form.gender || ''} onChange={(e) => onChange('gender', e.target.value)}>
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((gender) => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Age *</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        max="130"
                        placeholder="Enter age"
                        value={form.age || ''}
                        onChange={(e) => onChange('age', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Height (cm)</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        placeholder="e.g. 170"
                        value={form.heightCm || ''}
                        onChange={(e) => onChange('heightCm', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Weight (kg)</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        placeholder="e.g. 70"
                        value={form.weightKg || ''}
                        onChange={(e) => onChange('weightKg', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Date of Birth</label>
                      <input
                        className="input"
                        type="date"
                        value={form.dateOfBirth || ''}
                        onChange={(e) => onChange('dateOfBirth', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label">Address</label>
                      <input
                        className="input"
                        placeholder="Enter address"
                        value={form.address || ''}
                        onChange={(e) => onChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-2 3-3-6-2 3H2" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">Emergency Contact</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Contact Name</label>
                      <input
                        className="input"
                        placeholder="Contact full name"
                        value={form.emergencyContactName || ''}
                        onChange={(e) => onChange('emergencyContactName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <input
                        className="input"
                        placeholder="Contact phone"
                        value={form.emergencyContactPhone || ''}
                        onChange={(e) => onChange('emergencyContactPhone', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label">Relationship</label>
                      <input
                        className="input"
                        placeholder="e.g. Spouse, Parent, Sibling"
                        value={form.emergencyRelationship || ''}
                        onChange={(e) => onChange('emergencyRelationship', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {profile?.role === 'DOCTOR' ? (
              <>
                <input className="input" list="specialization-options" placeholder="Specialization" value={form.specialization || ''} onChange={(e) => onChange('specialization', e.target.value)} />
                <input className="input" placeholder="Qualification" value={form.qualification || ''} onChange={(e) => onChange('qualification', e.target.value)} />
                <input className="input" type="number" placeholder="Years Experience" value={form.yearsExperience || ''} onChange={(e) => onChange('yearsExperience', e.target.value)} />
                <textarea className="input sm:col-span-2 min-h-24" placeholder="Bio" value={form.bio || ''} onChange={(e) => onChange('bio', e.target.value)} />
                <input className="input sm:col-span-2" placeholder="Availability Notes" value={form.availabilityNotes || ''} onChange={(e) => onChange('availabilityNotes', e.target.value)} />
              </>
            ) : null}
          </div>
          <button className="btn-primary mt-4" type="submit">Save Profile</button>
        </form>
      </section>

      <datalist id="specialization-options">
        {SPECIALIZATION_OPTIONS.map((specialization) => (
          <option key={specialization} value={specialization} />
        ))}
      </datalist>
    </AppLayout>
  );
}
