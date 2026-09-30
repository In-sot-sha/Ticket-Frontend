import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  Instagram,
  Phone,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { TikTokIcon } from '../components/icons/TikTokIcon';
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_INSTAGRAM_HANDLE,
  SUPPORT_INSTAGRAM_URL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_TIKTOK_HANDLE,
  SUPPORT_TIKTOK_URL,
  mailtoHref,
  telHref,
  whatsappHref,
} from '../lib/contact';

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
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 pb-24">

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Contact <span className="text-rose-500">Us</span>
          </h1>
        </div>

        {/* Lost tickets banner */}
        <div className="mb-8 p-5 md:p-6 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 dark:from-rose-950/20 dark:via-pink-950/10 dark:to-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-500">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white text-sm md:text-base">
                Lost your tickets?
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                Recover valid tickets with the email or phone used at checkout.
              </p>
            </div>
          </div>
          <Link
            to="/recover-ticket"
            className="shrink-0 w-full sm:w-auto text-center bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold px-5 py-2.5 shadow-sm hover:shadow hover:opacity-95 transition-all active:scale-[0.98]"
          >
            Recover Tickets
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-stretch">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-6 md:p-8 shadow-sm h-full flex flex-col">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-1">
                Contact information
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Reach out to us directly through any of our official channels.
              </p>
              <ul className="space-y-5 flex-1 flex flex-col justify-between">
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</p>
                    <a
                      href={mailtoHref()}
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors break-all"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#25D366]/15 dark:bg-[#25D366]/10 flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">WhatsApp</p>
                    <a
                      href={whatsappHref('Hi PartyStorm, I need help with…')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-[#25D366] transition-colors inline-flex items-center gap-1.5"
                    >
                      Chat on WhatsApp
                    </a>
                    <p className="text-xs text-neutral-500 mt-0.5">{SUPPORT_PHONE_DISPLAY}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center shrink-0">
                    <Instagram className="h-4 w-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Instagram</p>
                    <a
                      href={SUPPORT_INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors"
                    >
                      {SUPPORT_INSTAGRAM_HANDLE}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <TikTokIcon className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">TikTok</p>
                    <a
                      href={SUPPORT_TIKTOK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors"
                    >
                      {SUPPORT_TIKTOK_HANDLE}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Phone</p>
                    <a
                      href={telHref()}
                      className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-rose-500 transition-colors"
                    >
                      {SUPPORT_PHONE_DISPLAY}
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
                      {SUPPORT_ADDRESS}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6 md:p-8 h-full flex flex-col">
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
