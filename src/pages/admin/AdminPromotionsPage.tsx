import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Search,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

interface EventAdminInfo {
  id: number;
  title: string;
  startDate: string;
  isPromoted: boolean;
  promotedUntil: string | null;
  organization?: {
    name: string;
  };
}

const AdminPromotionsPage: React.FC = () => {
  const [events, setEvents] = useState<EventAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Promotion modal state
  const [selectedEvent, setSelectedEvent] = useState<EventAdminInfo | null>(null);
  const [durationMode, setDurationMode] = useState<'1' | '7' | '30' | 'indefinite' | 'custom'>('7');
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    api.admin.getEvents({ search })
      .then((res) => {
        setEvents(res.data);
      })
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [search]);

  const handleOpenPromote = (event: EventAdminInfo) => {
    setSelectedEvent(event);
    if (event.isPromoted && event.promotedUntil) {
      setDurationMode('custom');
      setCustomDate(new Date(event.promotedUntil).toISOString().split('T')[0]);
    } else if (event.isPromoted) {
      setDurationMode('indefinite');
    } else {
      setDurationMode('7');
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    let promotedUntil: string | null = null;

    if (durationMode !== 'indefinite') {
      const now = new Date();
      if (durationMode === '1') {
        now.setDate(now.getDate() + 1);
        promotedUntil = now.toISOString();
      } else if (durationMode === '7') {
        now.setDate(now.getDate() + 7);
        promotedUntil = now.toISOString();
      } else if (durationMode === '30') {
        now.setDate(now.getDate() + 30);
        promotedUntil = now.toISOString();
      } else if (durationMode === 'custom') {
        if (!customDate) {
          setError('Please specify a custom end date.');
          setSaving(false);
          return;
        }
        promotedUntil = new Date(customDate + 'T23:59:59').toISOString();
      }
    }

    try {
      await api.admin.promoteEvent(selectedEvent.id, {
        isPromoted: true,
        promotedUntil,
      });

      setSuccess(`Successfully promoted "${selectedEvent.title}"`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPromotion = async (event: EventAdminInfo) => {
    if (!window.confirm(`Are you sure you want to stop promoting "${event.title}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      await api.admin.promoteEvent(event.id, {
        isPromoted: false,
        promotedUntil: null,
      });
      setSuccess(`Stopped promotion for "${event.title}"`);
      fetchEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to stop promotion.');
    }
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/admin" 
          className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
            Manage Promotions
          </h1>
          <p className="text-xs text-neutral-500 font-medium">Feature events in homepage hero carousel</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-600 dark:text-emerald-400">
          <Check className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-xs font-bold">{success}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search events to promote..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Events List */}
      <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner />
            </div>
          ) : events.length === 0 ? (
            <p className="py-20 text-center text-neutral-500 text-sm">No events found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Promoted Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800">
                {events.map((event) => {
                  const isCurrentlyPromoted = event.isPromoted && 
                    (!event.promotedUntil || new Date(event.promotedUntil) >= new Date());

                  return (
                    <tr key={event.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/25 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{event.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {event.organization?.name || 'No Organization'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCurrentlyPromoted ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                              Promoted
                            </span>
                            {event.promotedUntil ? (
                              <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                until {new Date(event.promotedUntil).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-medium">
                                Indefinite
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleOpenPromote(event)}
                            className="h-8 text-xs rounded-lg px-3 bg-purple-500 hover:bg-purple-600 text-white font-bold"
                          >
                            Promote
                          </Button>
                          {isCurrentlyPromoted && (
                            <Button
                              onClick={() => handleCancelPromotion(event)}
                              variant="outline"
                              className="h-8 text-xs rounded-lg px-3 text-rose-500 border-rose-200 hover:bg-rose-50 font-bold"
                            >
                              Stop
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Promotion Config Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-neutral-150 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Configure Promotion
              </h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>
            
            <p className="text-xs text-neutral-500 mb-6">
              You are promoting <strong>{selectedEvent.title}</strong>. This features the event on the main homepage carousel slide.
            </p>

            <form onSubmit={handleSavePromotion} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-3">
                  Promotion Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '1 Day', value: '1' },
                    { label: '7 Days', value: '7' },
                    { label: '30 Days', value: '30' },
                    { label: 'Indefinite', value: 'indefinite' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationMode(opt.value as any)}
                      className={`py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                        durationMode === opt.value
                          ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/30 dark:border-purple-900 dark:text-purple-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDurationMode('custom')}
                    className={`col-span-2 py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                      durationMode === 'custom'
                        ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/30 dark:border-purple-900 dark:text-purple-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    Custom End Date
                  </button>
                </div>
              </div>

              {durationMode === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-xl font-bold h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold h-11 px-5"
                >
                  {saving ? 'Saving...' : 'Confirm Promotion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;
