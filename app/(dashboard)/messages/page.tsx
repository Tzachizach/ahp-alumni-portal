'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Message, Alumni } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Send, Inbox, PenSquare, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');

  // Compose form
  const [toEmail, setToEmail] = useState(searchParams.get('to') || '');
  const [toName, setToName] = useState(searchParams.get('name') || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const myEmail = session?.user?.email || '';

  // Auto-open compose if coming from profile page
  useEffect(() => {
    if (searchParams.get('to')) setComposing(true);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch('/api/messages').then((r) => r.json()),
      fetch('/api/alumni').then((r) => r.json()),
    ]).then(([msgs, alums]) => {
      setMessages(msgs);
      setAlumni(alums);
      setLoading(false);
    });
  }, []);

  async function openMessage(msg: Message) {
    setSelected(msg);
    if (!msg.read && msg.toEmail === myEmail) {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!toEmail || !body) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, toName, subject, body }),
      });
      if (!res.ok) throw new Error();
      const msg = await res.json();
      setMessages((prev) => [msg, ...prev]);
      setComposing(false);
      setToEmail(''); setToName(''); setSubject(''); setBody('');
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  const inbox = messages.filter((m) => m.toEmail === myEmail);
  const sent = messages.filter((m) => m.fromEmail === myEmail);
  const unreadCount = inbox.filter((m) => !m.read).length;
  const displayed = tab === 'inbox' ? inbox : sent;

  function MessageRow({ msg }: { msg: Message }) {
    const isUnread = !msg.read && msg.toEmail === myEmail;
    return (
      <button
        onClick={() => openMessage(msg)}
        className={`w-full text-left px-4 py-3 border-b border-ohio-gray-medium hover:bg-ohio-gray-light transition-colors flex items-start gap-3 ${
          selected?.id === msg.id ? 'bg-scarlet-light border-l-2 border-l-scarlet' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${isUnread ? 'font-bold text-ohio-gray-dark' : 'text-ohio-gray-dark'}`}>
              {tab === 'inbox' ? msg.fromName || msg.fromEmail : msg.toName || msg.toEmail}
            </p>
            <p className="text-xs text-ohio-gray flex-shrink-0">
              {msg.createdAt ? format(parseISO(msg.createdAt), 'MMM d') : ''}
            </p>
          </div>
          <p className={`text-sm truncate ${isUnread ? 'font-semibold' : 'text-ohio-gray'}`}>{msg.subject}</p>
          <p className="text-xs text-ohio-gray truncate mt-0.5">{msg.body.slice(0, 80)}</p>
        </div>
        {isUnread && <div className="w-2 h-2 rounded-full bg-scarlet mt-1.5 flex-shrink-0" />}
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark">Messages</h1>
        <button onClick={() => setComposing(true)} className="btn-primary flex items-center gap-2">
          <PenSquare size={16} /> New Message
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Left pane: list */}
          <div className="w-full sm:w-80 flex-shrink-0 flex flex-col border-r border-ohio-gray-medium">
            {/* Tabs */}
            <div className="flex border-b border-ohio-gray-medium">
              {(['inbox', 'sent'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelected(null); }}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                    tab === t ? 'text-scarlet border-b-2 border-scarlet' : 'text-ohio-gray hover:text-ohio-gray-dark'
                  }`}
                >
                  {t === 'inbox' ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Inbox size={14} /> Inbox {unreadCount > 0 && <span className="badge bg-scarlet text-white">{unreadCount}</span>}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5"><Send size={14} /> Sent</span>
                  )}
                </button>
              ))}
            </div>
            {/* Message list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-1">
                      <div className="h-3 bg-ohio-gray-medium rounded w-2/3" />
                      <div className="h-2 bg-ohio-gray-medium rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-12 text-ohio-gray text-sm">No messages</div>
              ) : (
                displayed.map((msg) => <MessageRow key={msg.id} msg={msg} />)
              )}
            </div>
          </div>

          {/* Right pane: detail or compose */}
          <div className="flex-1 overflow-y-auto hidden sm:flex flex-col">
            {composing ? (
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-ohio-gray-dark">New Message</h2>
                  <button onClick={() => setComposing(false)} className="text-ohio-gray hover:text-ohio-gray-dark">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="label">To</label>
                    <select
                      className="input"
                      value={toEmail}
                      onChange={(e) => {
                        const a = alumni.find((al) => al.email === e.target.value);
                        setToEmail(e.target.value);
                        setToName(a?.fullName || '');
                      }}
                      required
                    >
                      <option value="">Select recipient…</option>
                      {alumni
                        .filter((a) => a.email && a.email !== myEmail)
                        .sort((a, b) => a.fullName.localeCompare(b.fullName))
                        .map((a) => (
                          <option key={a.id} value={a.email}>{a.fullName}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="(optional)" />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea className="input resize-none" rows={8} value={body} onChange={(e) => setBody(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
                    <Send size={15} /> {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </div>
            ) : selected ? (
              <div className="flex-1 p-6">
                <h2 className="text-lg font-bold text-ohio-gray-dark mb-1">{selected.subject}</h2>
                <div className="text-sm text-ohio-gray mb-4">
                  <span>From: <span className="font-medium text-ohio-gray-dark">{selected.fromName || selected.fromEmail}</span></span>
                  <span className="mx-2">·</span>
                  <span>{selected.createdAt ? format(parseISO(selected.createdAt), 'MMM d, yyyy h:mm a') : ''}</span>
                </div>
                <div className="border-t border-ohio-gray-medium pt-4">
                  <p className="text-sm text-ohio-gray-dark whitespace-pre-wrap">{selected.body}</p>
                </div>
                {selected.fromEmail !== myEmail && (
                  <button
                    onClick={() => {
                      setToEmail(selected.fromEmail);
                      setToName(selected.fromName);
                      setSubject(`Re: ${selected.subject}`);
                      setComposing(true);
                    }}
                    className="btn-secondary mt-6 flex items-center gap-2 text-sm"
                  >
                    <Send size={14} /> Reply
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-ohio-gray">
                <div className="text-center">
                  <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a message or compose a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}
