import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { AdministrationOutcome, MedicationAdministration, Patient, PrescriptionWithPatient, TreatmentPlan, UserProfile } from '../types';

type PlanResult = { plans?: TreatmentPlan[]; error?: string };

const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const dateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
const localNow = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'An unexpected error occurred';

function AdministrationForm({ prescription, profile, onSaved }: {
  prescription: PrescriptionWithPatient;
  profile: UserProfile | null;
  onSaved: (record: MedicationAdministration) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dose, setDose] = useState('');
  const [outcome, setOutcome] = useState<AdministrationOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const staffId = profile?.uid || profile?.id;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!staffId || !profile?.name?.trim()) {
      setError('Your staff identity is incomplete. Sign in again or contact an administrator.');
      return;
    }
    if (!dose.trim() || !outcome || !time || Number.isNaN(new Date(time).getTime())) {
      setError('Enter a dose, choose an outcome and provide a valid date and time.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const record = await apiService.recordAdministration(prescription.id, {
        dose: dose.trim(), outcome, notes: notes.trim() || undefined,
        administeredAt: new Date(time).toISOString(), staffId, staffName: profile.name,
      });
      onSaved(record);
      setOpen(false);
      setDose('');
      setOutcome('');
      setNotes('');
    } catch (err) {
      setError(`${errorMessage(err)}. Check the dose history using Refresh before retrying, in case the record was saved.`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return <button type="button" onClick={() => { setTime(localNow()); setError(''); setOpen(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Record dose outcome</button>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <h4 className="font-bold text-gray-900">Record dose outcome</h4>
      <p className="text-xs text-gray-600">Recorded by {profile?.name || 'Unknown staff'} {staffId ? `(${staffId})` : '— staff ID unavailable'}. Confirm the order and dose before recording.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-gray-700"><span>Dose (including units)</span><input className={fieldClass} value={dose} onChange={e => setDose(e.target.value)} required /></label>
        <label className="space-y-1 text-xs font-semibold text-gray-700"><span>Outcome</span><select className={fieldClass} value={outcome} onChange={e => setOutcome(e.target.value as AdministrationOutcome | '')} required><option value="">Select outcome</option><option value="administered">Administered</option><option value="held">Held</option><option value="refused">Refused</option></select></label>
        <label className="space-y-1 text-xs font-semibold text-gray-700"><span>Outcome date and time (local)</span><input type="datetime-local" className={fieldClass} value={time} onChange={e => setTime(e.target.value)} required /></label>
        <label className="space-y-1 text-xs font-semibold text-gray-700"><span>Notes (optional)</span><input className={fieldClass} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save outcome'}</button><button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button></div>
    </form>
  );
}

export default function Nursing() {
  const { profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanResult>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const canRecord = profile?.role === 'nurse' || profile?.role === 'admin';

  const load = async () => {
    setLoading(true);
    setErrors([]);
    setPlans({});
    try {
      const [prescriptionResult, patientResult] = await Promise.allSettled([
        apiService.getPrescriptions(), apiService.getPatients(),
      ]);
      const loadErrors: string[] = [];
      const prescriptionsData = prescriptionResult.status === 'fulfilled' && Array.isArray(prescriptionResult.value) ? prescriptionResult.value : [];
      const patientsData = patientResult.status === 'fulfilled' && Array.isArray(patientResult.value) ? patientResult.value : [];
      if (prescriptionResult.status === 'rejected') loadErrors.push(`Unable to load prescriptions: ${errorMessage(prescriptionResult.reason)}.`);
      else if (!Array.isArray(prescriptionResult.value)) loadErrors.push('The prescription response was invalid.');
      if (patientResult.status === 'rejected') loadErrors.push(`Unable to load patients: ${errorMessage(patientResult.reason)}. Treatment plans for patients without prescriptions may be missing.`);
      else if (!Array.isArray(patientResult.value)) loadErrors.push('The patient response was invalid. Treatment plans for patients without prescriptions may be missing.');
      setErrors(loadErrors);
      setPrescriptions(prescriptionsData);
      // Preserve prescription visibility if the patient list fails or is incomplete.
      const patientMap = new Map(patientsData.map(patient => [patient.id, patient]));
      prescriptionsData.forEach(rx => { if (rx.patient && !patientMap.has(rx.patientId)) patientMap.set(rx.patientId, rx.patient); });
      const activePatients = Array.from(patientMap.values()).filter(patient => patient.status !== 'discharged');
      setPatients(activePatients);
      const results = await Promise.all(activePatients.map(async patient => {
        try {
          const details = await apiService.getPatientById(patient.id);
          if (!Array.isArray(details.treatmentPlans)) throw new Error('Treatment plans were not included in patient details');
          return [patient.id, { plans: details.treatmentPlans }] as const;
        } catch (err) {
          return [patient.id, { error: errorMessage(err) }] as const;
        }
      }));
      setPlans(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const query = search.trim().toLowerCase();
  const visible = patients.flatMap(patient => {
    const orders = prescriptions.filter(rx => rx.patientId === patient.id && rx.patient && rx.status !== 'discontinued');
    const patientMatches = [patient.name, patient.id].some(value => value?.toLowerCase().includes(query));
    const matchingOrders = patientMatches ? orders : orders.filter(rx => rx.medication?.toLowerCase().includes(query));
    if (!patientMatches && matchingOrders.length === 0) return [];
    if (orders.length === 0 && !plans[patient.id]?.plans?.length && !plans[patient.id]?.error) return [];
    return [{ patient, orders: matchingOrders }];
  });
  const missingPatients = prescriptions.some(rx => !rx.patient);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600"><ClipboardList size={16} /> Nursing services</div><h1 className="text-2xl font-bold text-gray-900">Medication worklist</h1><p className="mt-1 text-sm text-gray-500">Review patient orders, treatment plans and recorded dose outcomes.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={15} /> Refresh</button>
      </header>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Prescriptions are shown regardless of patient workflow or pharmacy status. Treatment plans are clinical context, not medication orders. Verify the current order and patient before documenting an outcome.</div>
      {!canRecord && <p className="text-sm font-medium text-gray-600">Read-only view. Nurses and administrators can record dose outcomes.</p>}
      <label className="relative block"><span className="sr-only">Search patient or medication</span><Search size={17} className="absolute left-3 top-3 text-gray-400" /><input className={`${fieldClass} pl-10`} placeholder="Search patient, ID or medication" value={search} onChange={e => setSearch(e.target.value)} /></label>
      {loading ? <div role="status" className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading patients, prescriptions and treatment plans…</div> : <>
        {errors.map(message => <p key={message} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message} Refresh to retry.</p>)}
        {missingPatients && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Some prescriptions have no patient details and cannot be displayed. Refresh or contact support.</p>}
        {visible.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No matching prescriptions or treatment plans for current patients.</div>}
        <div className="space-y-4">{visible.map(({ patient, orders }) => <article key={patient.id} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div><Link to={`/patients/${encodeURIComponent(patient.id)}`} className="text-sm font-semibold text-blue-700 hover:underline">{patient.name}</Link><p className="mt-1 text-xs text-gray-500">Patient ID: {patient.id} · {patient.status}</p></div>
          <section className="border-t border-gray-100 pt-4"><h2 className="text-sm font-bold text-gray-900">Treatment plans</h2>{plans[patient.id]?.error ? <p role="alert" className="mt-2 text-sm text-red-700">Unable to load plans: {plans[patient.id].error}. Refresh to retry.</p> : plans[patient.id]?.plans?.length ? <ul className="mt-2 space-y-2">{plans[patient.id].plans!.map(plan => <li key={plan.id} className="rounded-lg bg-gray-50 p-3"><p className="whitespace-pre-wrap text-sm text-gray-700">{plan.content}</p><p className="mt-1 text-xs text-gray-500">{plan.authorName} · {dateTime(plan.createdAt)}</p></li>)}</ul> : <p className="mt-2 text-sm text-gray-500">No treatment plans recorded.</p>}</section>
          {orders.length === 0 ? <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">{errors.some(message => message.includes('prescription')) ? 'Prescriptions unavailable.' : 'No current prescriptions.'}</p> : orders.map(rx => <section key={rx.id} className="space-y-4 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg font-bold text-gray-900">{rx.medication}</h3><p className="mt-1 text-sm text-gray-600">{rx.dosage} · {rx.frequency} · {rx.duration}</p><p className="mt-1 text-xs text-gray-500">Ordered by {rx.authorName} · {dateTime(rx.createdAt)}</p></div><div><span className="text-xs font-medium text-gray-500">Prescription / pharmacy status</span><p className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{rx.status}</p></div></div>
            <div><h4 className="text-sm font-bold text-gray-900">Dose history</h4>{!Array.isArray(rx.administrations) ? <p role="alert" className="mt-2 text-sm text-red-700">Dose history unavailable. Refresh or contact support before recording an outcome.</p> : rx.administrations.length ? <ul className="mt-2 divide-y divide-gray-100">{[...rx.administrations].sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime()).map(record => <li key={record.id} className="py-2 text-sm text-gray-700"><span className="font-semibold capitalize">{record.outcome}</span> · {record.dose} · {dateTime(record.administeredAt)}<p className="text-xs text-gray-500">{record.staffName} ({record.staffId}){record.notes ? ` · ${record.notes}` : ''}</p></li>)}</ul> : <p className="mt-2 text-sm text-gray-500">No dose outcomes recorded.</p>}</div>
            {canRecord && Array.isArray(rx.administrations) && <AdministrationForm prescription={rx} profile={profile} onSaved={record => setPrescriptions(current => current.map(item => item.id === rx.id ? { ...item, administrations: [record, ...item.administrations] } : item))} />}
          </section>)}
        </article>)}</div>
      </>}
    </div>
  );
}
