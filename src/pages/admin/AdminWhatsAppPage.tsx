import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';

type Config = {
  enabled: boolean;
  sendTickets: boolean;
  sendOtp: boolean;
  ticketTemplate: string;
  otpTemplate: string;
  templateLanguage: string;
  currency: string;
  ticketPrice: number;
  otpPrice: number;
  credentialsConfigured: boolean;
  phoneNumberIdSet: boolean;
  businessAccountIdSet: boolean;
  appIdSet: boolean;
  webhookVerifyTokenSet: boolean;
  appSecretSet: boolean;
  apiVersion: string;
};

type MessageRow = {
  id: number;
  kind: string;
  toPhone: string;
  templateName: string;
  status: string;
  attempts: number;
  lastError: string | null;
  price?: number;
  currency?: string;
  createdAt: string;
};

const statusClass: Record<string, string> = {
  SENT: 'text-sky-700 bg-sky-50',
  DELIVERED: 'text-emerald-700 bg-emerald-50',
  READ: 'text-emerald-800 bg-emerald-50',
  FAILED: 'text-rose-700 bg-rose-50',
  QUEUED: 'text-amber-800 bg-amber-50',
};

export default function AdminWhatsAppPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [cfg, rows] = await Promise.all([
      api.admin.getWhatsAppConfig(),
      api.admin.getWhatsAppMessages(),
    ]);
    setConfig(cfg.data);
    setMessages(Array.isArray(rows.data) ? rows.data : []);
  };

  useEffect(() => {
    load().catch(() => setError('Could not load WhatsApp settings.'));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.admin.updateWhatsAppConfig({
        enabled: config.enabled,
        sendTickets: config.sendTickets,
        sendOtp: config.sendOtp,
        ticketTemplate: config.ticketTemplate,
        otpTemplate: config.otpTemplate,
        templateLanguage: config.templateLanguage,
        currency: config.currency,
        ticketPrice: Number(config.ticketPrice),
        otpPrice: Number(config.otpPrice),
      });
      setConfig(res.data);
      setNotice('WhatsApp settings saved.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.admin.testWhatsApp();
      setNotice(
        res.data.ok
          ? `Connected${res.data.verifiedName ? ` as ${res.data.verifiedName}` : ''}${
              res.data.displayPhoneNumber ? ` (${res.data.displayPhoneNumber})` : ''
            }.`
          : res.data.message
      );
      if (!res.data.ok) setError(res.data.message);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  const retry = async (id: number) => {
    setError(null);
    try {
      await api.admin.retryWhatsAppMessage(id);
      setNotice('Retry sent.');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Retry failed.');
    }
  };

  if (!config) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        {error || 'Loading WhatsApp settings…'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <PageHeader
        title="WhatsApp"
        description="Ticket and OTP delivery through the Meta Cloud API."
      />

      {notice && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm font-bold">Server credentials</p>
        <p className="mt-1 text-xs text-neutral-500">
          Tokens stay in the server environment. Delivery settings below are stored in the database.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Access token and phone number ID: {config.credentialsConfigured ? 'configured' : 'missing'}</li>
          <li>Business account ID: {config.businessAccountIdSet ? 'configured' : 'missing'}</li>
          <li>Meta app ID: {config.appIdSet ? 'configured' : 'missing'}</li>
          <li>App secret: {config.appSecretSet ? 'configured' : 'missing'}</li>
          <li>Webhook verify token: {config.webhookVerifyTokenSet ? 'configured' : 'missing'}</li>
          <li>Graph version: {config.apiVersion}</li>
        </ul>
        <Button type="button" className="mt-3" onClick={test} disabled={testing}>
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          Enable WhatsApp delivery
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.sendTickets}
            onChange={(e) => setConfig({ ...config, sendTickets: e.target.checked })}
          />
          Send ticket QR after payment
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.sendOtp}
            onChange={(e) => setConfig({ ...config, sendOtp: e.target.checked })}
          />
          Send recovery codes on WhatsApp
        </label>
        <label className="block text-xs font-bold text-neutral-500">
          Ticket template
          <input
            value={config.ticketTemplate}
            onChange={(e) => setConfig({ ...config, ticketTemplate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-bold text-neutral-500">
          OTP template
          <input
            value={config.otpTemplate}
            onChange={(e) => setConfig({ ...config, otpTemplate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-bold text-neutral-500">
          Template language
          <input
            value={config.templateLanguage}
            onChange={(e) => setConfig({ ...config, templateLanguage: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-bold text-neutral-500">
            Currency
            <input
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value.toUpperCase() })}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </label>
          <label className="block text-xs font-bold text-neutral-500">
            Ticket message price
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.ticketPrice}
              onChange={(e) => setConfig({ ...config, ticketPrice: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </label>
          <label className="block text-xs font-bold text-neutral-500">
            OTP message price
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.otpPrice}
              onChange={(e) => setConfig({ ...config, otpPrice: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          Nigeria utility and authentication messages are about ₦10 each. These prices are saved in the database and stamped on each delivery.
        </p>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="mb-3 text-sm font-bold">Recent deliveries</p>
        <div className="space-y-2">
          {messages.length === 0 && <p className="text-sm text-neutral-500">No messages yet.</p>}
          {messages.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
              <div className="min-w-0">
                <p className="font-semibold">
                  {row.kind} · {row.toPhone}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {row.templateName} · {row.currency || config.currency} {Number(row.price || 0).toLocaleString()} · {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
                  {row.lastError ? ` · ${row.lastError}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass[row.status] || ''}`}>
                  {row.status}
                </span>
                {row.status === 'FAILED' && row.kind === 'TICKET' && (
                  <button type="button" onClick={() => retry(row.id)} className="text-xs font-bold text-rose-600">
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
