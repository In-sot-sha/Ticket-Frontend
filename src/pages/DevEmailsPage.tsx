import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Mail,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Eye,
  FileText,
  Pencil,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

const TEMPLATE_META: Record<string, { label: string; blurb: string }> = {
  otp: { label: 'OTP / verify email', blurb: 'One-time code for signup or verify' },
  welcome: { label: 'Welcome', blurb: 'After account creation' },
  ticket: { label: 'Ticket confirmation', blurb: 'Purchase receipt + QR details' },
  'password-reset': { label: 'Password reset', blurb: 'Reset link email' },
  vendor: { label: 'Vendor application', blurb: 'Stall application received' },
  'staff-invite': { label: 'Staff invite', blurb: 'Temp password + staff login' },
  'organizer-message': { label: 'Organizer message', blurb: 'Broadcast / reminder to attendees' },
  'support-received': { label: 'Support received', blurb: 'Ticket opened confirmation' },
  'support-reply': { label: 'Support reply', blurb: 'Admin reply to ticket' },
  'support-resolved': { label: 'Support resolved', blurb: 'Ticket closed notice' },
};

type PreviewPayload = {
  id: string;
  subject: string;
  html: string;
  text?: string;
};

type ViewMode = 'preview' | 'html' | 'text';

const isDevBuild = import.meta.env.DEV;

const DevEmailsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canAccess = isDevBuild || isAdmin;

  const [ids, setIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [sandboxHtml, setSandboxHtml] = useState('');
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<ViewMode>('preview');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'html' | 'subject' | null>(null);

  const displayHtml = dirty ? sandboxHtml : payload?.html ?? '';

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.get<{ templates: string[] }>('/emails/preview');
      const templates = res.data.templates ?? [];
      setIds(templates);
      setSelectedId((prev) => prev || templates[0] || '');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not load email templates. Is the API running?';
      setError(msg);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadPreview = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await api.get<PreviewPayload>(`/emails/preview/${id}`, {
        params: { format: 'json' },
      });
      setPayload(res.data);
      setSandboxHtml(res.data.html);
      setDirty(false);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to load template preview.';
      setError(msg);
      setPayload(null);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!canAccess) return;
    void loadList();
  }, [authLoading, canAccess, loadList]);

  useEffect(() => {
    if (!selectedId || !canAccess) return;
    void loadPreview(selectedId);
  }, [selectedId, canAccess, loadPreview]);

  const copy = async (kind: 'html' | 'subject', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const meta = useMemo(
    () => TEMPLATE_META[selectedId] ?? { label: selectedId, blurb: '' },
    [selectedId]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!isDevBuild && !isAuthenticated) {
    return <Navigate to="/login?redirect=/dev/emails" replace />;
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-5 w-5 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">Email templates</h1>
                <p className="text-[11px] text-neutral-500 truncate">
                  Preview from API · edits in{' '}
                  <code className="text-rose-600 dark:text-rose-400">backend/src/services/email.ts</code>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDevBuild && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Dev
              </span>
            )}
            {isAdmin && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                Admin
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadPreview(selectedId)}
              disabled={!selectedId || loadingPreview}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loadingPreview && 'animate-spin')} />
              Reload
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Template list */}
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Templates
              </p>
            </div>
            {loadingList ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[70vh] overflow-y-auto">
                {ids.map((id) => {
                  const m = TEMPLATE_META[id] ?? { label: id, blurb: '' };
                  const active = id === selectedId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(id)}
                        className={cn(
                          'w-full text-left px-4 py-3 transition-colors',
                          active
                            ? 'bg-rose-50 dark:bg-rose-950/40'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        )}
                      >
                        <p
                          className={cn(
                            'text-sm font-medium',
                            active ? 'text-rose-700 dark:text-rose-300' : ''
                          )}
                        >
                          {m.label}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{m.blurb || id}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="mt-3 text-[11px] text-neutral-500 leading-relaxed px-1">
            Change copy or layout in <code>email.ts</code>, save, then hit Reload.
            The sandbox below is local-only and does not change what users receive.
          </p>
        </aside>

        {/* Main pane */}
        <main className="lg:col-span-9 space-y-3">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2 justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{meta.label}</p>
                {payload?.subject && (
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    Subject: {payload.subject}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'preview' as const, icon: Eye, label: 'Preview' },
                    { id: 'html' as const, icon: Code2, label: 'HTML' },
                    { id: 'text' as const, icon: FileText, label: 'Text' },
                  ] as const
                ).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      view === id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
                {payload?.subject && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => void copy('subject', payload.subject)}
                  >
                    {copied === 'subject' ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Subject
                  </Button>
                )}
                {displayHtml && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => void copy('html', displayHtml)}
                  >
                    {copied === 'html' ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    HTML
                  </Button>
                )}
                {selectedId && (
                  <a
                    href={`${apiClientBase()}/emails/preview/${selectedId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600 px-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Raw
                  </a>
                )}
              </div>
            </div>

            {loadingPreview && !payload ? (
              <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : view === 'preview' ? (
              <div className="bg-neutral-200/60 dark:bg-neutral-950 p-3 sm:p-4">
                {dirty && (
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5">
                    <Pencil className="h-3 w-3 shrink-0" />
                    Sandbox edits (not saved). Reload to restore from backend.
                    <button
                      type="button"
                      className="ml-auto underline font-medium"
                      onClick={() => {
                        if (payload) {
                          setSandboxHtml(payload.html);
                          setDirty(false);
                        }
                      }}
                    >
                      Discard
                    </button>
                  </div>
                )}
                <iframe
                  title={`Email preview: ${selectedId}`}
                  srcDoc={displayHtml}
                  sandbox=""
                  className="w-full h-[70vh] rounded-xl bg-white border border-neutral-200 dark:border-neutral-800 shadow-sm"
                />
              </div>
            ) : view === 'html' ? (
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 px-1">
                  <Pencil className="h-3 w-3" />
                  Edit HTML here to preview changes locally. Persist by updating{' '}
                  <code className="text-rose-600 dark:text-rose-400">email.ts</code>.
                </div>
                <textarea
                  value={sandboxHtml}
                  onChange={(e) => {
                    setSandboxHtml(e.target.value);
                    setDirty(e.target.value !== (payload?.html ?? ''));
                  }}
                  spellCheck={false}
                  className="w-full h-[70vh] font-mono text-[11px] leading-relaxed rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-3 resize-y focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            ) : (
              <pre className="h-[70vh] overflow-auto p-4 text-xs whitespace-pre-wrap font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950">
                {payload?.text || '(no plain-text version)'}
              </pre>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

/** Resolve API base the same way api.ts does (includes /api). */
function apiClientBase(): string {
  const local =
    import.meta.env.VITE_API_URL || 'http://192.168.1.119:33333/api';
  const production = 'https://api.partystorm.ng/api';
  return import.meta.env.MODE === 'development' ? local : production;
}

export default DevEmailsPage;
