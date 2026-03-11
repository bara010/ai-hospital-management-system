import { useEffect, useMemo, useRef, useState } from 'react';
import { fileApi, messageApi } from '../services/hospitoApi';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function ChatWindow({ currentUser, selectedContact }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);

  const loadConversation = async () => {
    if (!selectedContact) return;
    try {
      setError('');
      const data = await messageApi.conversation(selectedContact.userId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load conversation.');
    }
  };

  useEffect(() => {
    loadConversation();
  }, [selectedContact?.userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContact) loadConversation();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedContact?.userId]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages]);

  const grouped = useMemo(() => messages, [messages]);

  const sendMessage = async (payload) => {
    if (!selectedContact) return;
    setSending(true);
    try {
      await messageApi.send({
        recipientId: selectedContact.userId,
        message: payload.message || null,
        attachmentPath: payload.attachmentPath || null,
        attachmentName: payload.attachmentName || null,
      });
      setText('');
      await loadConversation();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const onSendText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ message: text.trim() });
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;

    setUploading(true);
    try {
      const uploaded = await fileApi.uploadChatFile(file);
      await sendMessage({
        message: text.trim() || null,
        attachmentPath: uploaded.path,
        attachmentName: file.name,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to upload attachment.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!selectedContact) {
    return (
      <div className="panel flex min-h-[420px] items-center justify-center text-sm text-slate-500">
        Select a contact to start messaging.
      </div>
    );
  }

  return (
    <div className="panel flex min-h-[420px] flex-col">
      <div className="border-b border-slate-200 pb-3">
        <p className="text-sm font-semibold text-slate-900">{selectedContact.fullName}</p>
        <p className="text-xs text-slate-500">{selectedContact.specialization || selectedContact.role}</p>
      </div>

      {error ? <p className="error-text mt-3">{error}</p> : null}

      <div ref={containerRef} className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {grouped.map((message) => {
          const mine = message.senderId === currentUser?.id;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800'}`}>
                {message.message ? <p className="whitespace-pre-wrap">{message.message}</p> : null}
                {message.attachmentUrl ? (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-1 inline-block text-xs underline ${mine ? 'text-blue-100' : 'text-primary'}`}
                  >
                    {message.attachmentName || 'Open attachment'}
                  </a>
                ) : null}
                <p className={`mt-1 text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                  {formatDate(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSendText} className="mt-3 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2">
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message"
          />
          <label className="btn-secondary cursor-pointer">
            {uploading ? 'Uploading...' : 'File'}
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading || sending} />
          </label>
          <button className="btn-primary" type="submit" disabled={sending || !text.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
