'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlumniEvent } from '@/lib/types';
import { format, parseISO, isPast } from 'date-fns';
import { Calendar, MapPin, Users, CheckCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myEmail = session?.user?.email || '';
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  // New event form
  const [form, setForm] = useState({ title: '', description: '', eventDate: '', location: '' });

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); });
  }, []);

  async function handleRsvp(event: AlumniEvent) {
    const alreadyRsvpd = event.rsvpList.includes(myEmail);
    const updated = alreadyRsvpd
      ? event.rsvpList.filter((e) => e !== myEmail)
      : [...event.rsvpList, myEmail];

    setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, rsvpList: updated } : e));

    try {
      await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, rsvpList: updated }),
      });
      toast.success(alreadyRsvpd ? 'RSVP cancelled' : "You're going!");
    } catch {
      toast.error('Failed to update RSVP');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setEvents((prev) => [...prev, created].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
      setForm({ title: '', description: '', eventDate: '', location: '' });
      setShowForm(false);
      toast.success('Event created!');
    } catch {
      toast.error('Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Event deleted.');
    } catch {
      toast.error('Failed to delete event.');
    }
  }

  const upcoming = events.filter((e) => !isPast(parseISO(e.eventDate)));
  const past = events.filter((e) => isPast(parseISO(e.eventDate)));

  function EventCard({ event }: { event: AlumniEvent }) {
    const gone = isPast(parseISO(event.eventDate));
    const rsvpd = event.rsvpList.includes(myEmail);
    return (
      <div className={`card ${gone ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-ohio-gray-dark text-lg">{event.title}</h3>
              {rsvpd && !gone && (
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle size={12} /> Going
                </span>
              )}
              {gone && <span className="badge bg-ohio-gray-light text-ohio-gray">Past</span>}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-ohio-gray">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-scarlet" />
                {format(parseISO(event.eventDate), 'EEEE, MMMM d, yyyy')}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-scarlet" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-scarlet" />
                {event.rsvpList.length} {event.rsvpList.length === 1 ? 'attendee' : 'attendees'}
              </span>
            </div>

            {event.description && (
              <p className="mt-3 text-sm text-ohio-gray-dark">{event.description}</p>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => handleDelete(event.id)}
              className="text-ohio-gray hover:text-scarlet transition-colors p-1"
              title="Delete event"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {!gone && (
          <div className="mt-4 pt-4 border-t border-ohio-gray-medium">
            <button
              onClick={() => handleRsvp(event)}
              className={rsvpd ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
            >
              {rsvpd ? 'Cancel RSVP' : 'RSVP'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">Events</h1>
          <p className="text-ohio-gray mt-1">Alumni gatherings and program events</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      {/* Create event form (admin only) */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Create New Event</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Event Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="City, State or Virtual" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating…' : 'Create Event'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-32" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-ohio-gray">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No events yet</p>
          {isAdmin && <p className="text-sm mt-1">Create the first event above!</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ohio-gray uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-4">
                {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ohio-gray uppercase tracking-wide mb-3">Past Events</h2>
              <div className="space-y-4">
                {past.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
