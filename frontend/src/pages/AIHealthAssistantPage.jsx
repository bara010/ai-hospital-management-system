import AppLayout from '../components/AppLayout';
import MedicineInfoLookup from '../components/MedicineInfoLookup';
import SymptomChecker from '../components/SymptomChecker';

export default function AIHealthAssistantPage() {
  return (
    <AppLayout>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <SymptomChecker />
          <MedicineInfoLookup />
        </div>

        <aside className="panel">
          <h2 className="panel-title">How AI Assistant Works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Describe symptoms to get likely medical category and doctor suggestions.</li>
            <li>Search medicine names to view possible uses and safety information.</li>
            <li>Use recommendations to book specialist consultation quickly.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            AI output is for guidance only and is not a final diagnosis or prescription.
          </p>
        </aside>
      </section>
    </AppLayout>
  );
}
