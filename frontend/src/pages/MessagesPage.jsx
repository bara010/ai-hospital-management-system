import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ChatWindow from '../components/ChatWindow';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { messageApi } from '../services/hospitoApi';

export default function MessagesPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await messageApi.contacts();
      const list = Array.isArray(data) ? data : [];
      setContacts(list);
      if (!selected && list.length) {
        setSelected(list[0]);
      } else if (selected) {
        const updated = list.find((contact) => contact.userId === selected.userId);
        setSelected(updated || null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="panel min-h-[420px]">
          <h2 className="panel-title">Contacts</h2>
          {loading ? <div className="mt-3"><Loading label="Loading contacts..." /></div> : null}
          {error ? <p className="error-text mt-3">{error}</p> : null}

          <div className="mt-4 space-y-2">
            {contacts.map((contact) => (
              <button
                key={contact.userId}
                type="button"
                onClick={() => setSelected(contact)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  selected?.userId === contact.userId
                    ? 'border-primary bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="font-medium text-slate-900">{contact.fullName}</p>
                <p className="text-xs text-slate-500">{contact.specialization || contact.role}</p>
                {contact.latestMessage ? (
                  <p className="mt-1 truncate text-xs text-slate-400">{contact.latestMessage}</p>
                ) : null}
              </button>
            ))}
          </div>

          {!loading && contacts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No chat contacts yet. Contacts appear after appointments.</p>
          ) : null}
        </aside>

        <ChatWindow currentUser={user} selectedContact={selected} />
      </section>
    </AppLayout>
  );
}
