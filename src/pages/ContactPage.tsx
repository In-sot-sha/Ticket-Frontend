import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Instagram,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General inquiry' },
  { value: 'BILLING', label: 'Billing & payments' },
  { value: 'TICKETS', label: 'Tickets & bookings' },
  { value: 'HOSTING', label: 'Hosting events' },
  { value: 'TECHNICAL', label: 'Technical issue' },
  { value: 'OTHER', label: 'Other' },
];

const ContactPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = useState(
    user ? `${user.firstName} ${user.lastName}`.trim() : ''
  );
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        subject,
        body: message,
        category,
        contactEmail: email,
        contactName: name,
      };

      if (isAuthenticated) {
        await api.support.createTicket(payload);
      } else {
        await api.support.createContact(payload);
      }

      setSubmitted(true);
      setSubject('');
      setMessage('');
      setCategory('GENERAL');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xl p-10">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-3">
            Message sent!
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8">
            Thanks for reaching out. Our team typically responds within 24–48 hours on business days.
            {isAuthenticated && (
              <> You can track your request in <Link to="/support" className="text-rose-500 font-semibold hover:underline">My Support</Link>.</>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => setSubmitted(false)} className="rounded-full">
              Send another message
            </Button>
            <Link to="/">
              <Button className="rounded-full w-full sm:w-auto">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 pb-24">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold mb-4">
            <MessageSquare className="h-3.5 w-3.5" />
            Get in touch
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Contact <span className="text-rose-500">Us</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-3 max-w-lg mx-auto text-sm md:text-base">
            Questions about tickets, hosting, or your account? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-5">
                Contact information
              </h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</p>
                    <a
                      href="mailto:support@partystorm.com"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors"
                    >
                      support@partystorm.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Office</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Floor 1, 2G6V+C4F, Sani Abacha Way, Fagge, Kano 700211, Nigeria
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Hours</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Mon – Fri, 9:00 AM – 6:00 PM WAT
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Instagram className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Social</p>
                    <a
                      href="https://www.instagram.com/partyst0rm/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors"
                    >
                      @partyst0rm
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-6 text-white">
              <HelpCircle className="h-6 w-6 text-rose-400 mb-3" />
              <h3 className="font-extrabold text-base mb-1">Need a quick answer?</h3>
              <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
                Browse our Help Center for guides on tickets, refunds, and becoming a host.
              </p>
              <Link
                to="/help"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Visit Help Center <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-1">
                Send us a message
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Fill out the form and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Full name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Topic</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">Message</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more about your question or issue…"
                    rows={5}
                    className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto gap-2 rounded-xl h-11 px-8 font-extrabold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
