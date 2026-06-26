'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Send, Lightbulb, MessageCircle, Bug, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';

type Category = 'Suggestion' | 'Comment' | 'Bug' | 'Compliment';

const CATEGORY_OPTIONS: Array<{ value: Category; label: string; hint: string; icon: React.ElementType }> = [
  { value: 'Suggestion', label: 'Suggestion', hint: 'An idea for an improvement', icon: Lightbulb },
  { value: 'Comment',    label: 'Comment',    hint: 'General thoughts',          icon: MessageCircle },
  { value: 'Bug',        label: 'Bug',        hint: "Something isn't working",   icon: Bug },
  { value: 'Compliment', label: 'Compliment', hint: "What's working well",       icon: ThumbsUp },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('Suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setServerError(msg);
        toast.error(msg);
        return;
      }
      toast.success('Thanks — your feedback has been sent.');
      router.push('/directory');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error — please try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-scarlet/10 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} className="text-scarlet" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">Send Feedback</h1>
        </div>
        <p className="text-ohio-gray text-sm">
          Comments, suggestions, or bugs — anything that helps us improve the
          portal. Your feedback goes directly to the program administrators.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
        {serverError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="feedback-category" className="label">Category</label>
          <select
            id="feedback-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.hint}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback-subject" className="label">Subject <span className="text-ohio-gray font-normal">(optional)</span></label>
          <input
            id="feedback-subject"
            type="text"
            className="input"
            placeholder="One-line summary"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
          />
        </div>

        <div>
          <label htmlFor="feedback-message" className="label">Your message</label>
          <textarea
            id="feedback-message"
            className="input resize-none"
            rows={8}
            placeholder="Share what's on your mind…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={5000}
            aria-describedby="feedback-message-hint"
          />
          <p id="feedback-message-hint" className="text-xs text-ohio-gray mt-1">
            {message.length > 0 && `${message.length} / 5000 characters`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/directory" className="btn-ghost text-sm">Cancel</Link>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Send size={16} aria-hidden="true" />
            {submitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>
      </form>

      <p className="text-xs text-ohio-gray text-center mt-4">
        We read everything. Replies (when needed) come back as a direct message in your inbox.
      </p>
    </div>
  );
}
