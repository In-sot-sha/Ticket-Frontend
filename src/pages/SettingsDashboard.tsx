import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  ChevronRight,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Users,
  Receipt,
  Globe,
  Phone,
  Mail,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ── Reusable primitives ───────────────────────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-colors';

const labelCls = 'block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5';

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <div>
      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
      {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-rose-500' : 'bg-neutral-200 dark:bg-neutral-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const SaveButton = ({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={saving}
    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-60 transition-all active:scale-[0.98]"
  >
    {saving ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : saved ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <Save className="h-4 w-4" />
    )}
    {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
  </button>
);

// ── Section panels ────────────────────────────────────────────────────────────

const ProfilePanel = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName:   user?.firstName ?? '',
    lastName:    user?.lastName  ?? '',
    email:       user?.email     ?? '',
    phone:       user?.phone     ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await api.auth.updateProfile({
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone,
      });
      updateUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Profile information</h2>
        <p className="text-xs text-neutral-500 mt-1">Your personal details visible to attendees and your organisation.</p>
      </div>

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl font-extrabold shrink-0">
          {(form.firstName?.[0] ?? '?').toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            {form.firstName} {form.lastName}
          </p>
          <p className="text-xs text-neutral-500">{form.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First name</label>
          <input className={inputCls} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Last name</label>
          <input className={inputCls} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input className={`${inputCls} pl-9`} type="email" value={form.email} disabled />
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Email changes require support contact.</p>
        </div>
        <div>
          <label className={labelCls}>Phone number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input className={`${inputCls} pl-9`} type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+234 800 000 0000" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  );
};

const OrganisationPanel = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    businessName:  user?.organizerBusinessName ?? '',
    description:   user?.organizerDescription  ?? '',
    contactInfo:   user?.organizerContactInfo  ?? '',
    phone:         user?.phone                 ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await api.userRoles.updateOrganizerProfile({
        businessName: form.businessName,
        description:  form.description,
        contactInfo:  form.contactInfo,
        phone:        form.phone,
      });
      updateUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Organisation</h2>
          <p className="text-xs text-neutral-500 mt-1">Details shown on event pages and receipts.</p>
        </div>
        {user?.isOrganizerVerified && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified organiser
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Organisation / Business name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input className={`${inputCls} pl-9`} value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} placeholder="e.g. Kano Event Hub" />
          </div>
        </div>
        <div>
          <label className={labelCls}>About your organisation</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Short description shown on event pages…"
          />
        </div>
        <div>
          <label className={labelCls}>Public contact info</label>
          <input className={inputCls} value={form.contactInfo} onChange={e => setForm(p => ({ ...p, contactInfo: e.target.value }))} placeholder="Website, social handle, or email attendees can reach" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  );
};

const PayoutsPanel = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Payouts & Tax</h2>
      <p className="text-xs text-neutral-500 mt-1">Where your ticket revenue goes, and your tax details for receipts.</p>
    </div>

    {/* Payout account */}
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
      <div className="p-4">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Payout account</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Bank name</label>
            <input className={inputCls} placeholder="e.g. First Bank" />
          </div>
          <div>
            <label className={labelCls}>Account number</label>
            <input className={inputCls} placeholder="0123456789" maxLength={10} />
          </div>
          <div>
            <label className={labelCls}>Account name</label>
            <input className={inputCls} placeholder="As it appears on the account" />
          </div>
          <div>
            <label className={labelCls}>Payout schedule</label>
            <select className={inputCls}>
              <option>After each event</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tax */}
      <div className="p-4">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tax information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tax ID / TIN</label>
            <input className={inputCls} placeholder="Nigeria Tax ID or RC number" />
          </div>
          <div>
            <label className={labelCls}>VAT number (if registered)</label>
            <input className={inputCls} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Business address (for receipts)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Full address shown on tax receipts" />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex gap-2 text-xs text-amber-800 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Tax settings are saved locally for now. Full payout processing will be enabled when your organiser account is verified by the Eventify team.</p>
        </div>
      </div>

      {/* Service fee */}
      <div className="p-4">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Ticketing fees</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Platform service fee</span>
            <span className="font-bold">5% per ticket</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Payment processing</span>
            <span className="font-bold">1.5% + ₦100</span>
          </div>
          <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2 mt-2">
            <span className="font-semibold text-neutral-900 dark:text-white">You receive</span>
            <span className="font-extrabold text-rose-500">~93.5% of ticket price</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-400 mt-2">
          Fees are deducted automatically before payout. Free-ticket events have no fees.
        </p>
      </div>
    </div>

    <div className="flex justify-end">
      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all active:scale-[0.98]">
        <Save className="h-4 w-4" /> Save payout details
      </button>
    </div>
  </div>
);

const NotificationsPanel = () => {
  const [prefs, setPrefs] = useState({
    newTicketSale:    true,
    eventReminder:    true,
    vendorApplication: true,
    checkInAlert:     false,
    weeklyDigest:     true,
    marketingEmails:  false,
  });
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // placeholder — wire to API when ready
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Notifications</h2>
        <p className="text-xs text-neutral-500 mt-1">Choose what emails and alerts you receive.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-4">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pt-4 pb-2">Event activity</p>
        <Toggle checked={prefs.newTicketSale} onChange={() => toggle('newTicketSale')} label="New ticket sale" description="Email when someone buys a ticket for your event" />
        <Toggle checked={prefs.vendorApplication} onChange={() => toggle('vendorApplication')} label="Vendor application" description="Email when a vendor applies to your event" />
        <Toggle checked={prefs.checkInAlert} onChange={() => toggle('checkInAlert')} label="Check-in milestone alerts" description="Alert at 25%, 50%, 75% and 100% capacity" />
        <Toggle checked={prefs.eventReminder} onChange={() => toggle('eventReminder')} label="Event reminders" description="24-hour reminder before your event starts" />

        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pt-5 pb-2">Digest & marketing</p>
        <Toggle checked={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} label="Weekly performance digest" description="Summary of sales and analytics every Monday" />
        <Toggle checked={prefs.marketingEmails} onChange={() => toggle('marketingEmails')} label="Tips & product updates" description="Feature announcements and hosting tips from Eventify" />
      </div>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  );
};

const SecurityPanel = () => {
  const [form, setForm]         = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]         = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const handleSave = async () => {
    if (!form.current || !form.next) { setError('All fields are required.'); return; }
    if (form.next !== form.confirm)  { setError('New passwords do not match.'); return; }
    if (form.next.length < 8)        { setError('Password must be at least 8 characters.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/users/change-password', { currentPassword: form.current, newPassword: form.next });
      setSaved(true);
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  const PasswordField = ({
    id, label, value, visible, onToggle, onChange
  }: {
    id: keyof typeof show; label: string; value: string;
    visible: boolean; onToggle: () => void; onChange: (v: string) => void;
  }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${inputCls} pr-10`}
          autoComplete="new-password"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Login & Security</h2>
        <p className="text-xs text-neutral-500 mt-1">Change your password and keep your account secure.</p>
      </div>

      <div className="space-y-4">
        <PasswordField
          id="current" label="Current password" value={form.current} visible={show.current}
          onToggle={() => setShow(p => ({ ...p, current: !p.current }))}
          onChange={v => setForm(p => ({ ...p, current: v }))}
        />
        <PasswordField
          id="next" label="New password" value={form.next} visible={show.next}
          onToggle={() => setShow(p => ({ ...p, next: !p.next }))}
          onChange={v => setForm(p => ({ ...p, next: v }))}
        />
        <PasswordField
          id="confirm" label="Confirm new password" value={form.confirm} visible={show.confirm}
          onToggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
          onChange={v => setForm(p => ({ ...p, confirm: v }))}
        />

        {/* Password strength hint */}
        {form.next && (
          <div className="text-xs text-neutral-500 space-y-1 pl-1">
            <p className={form.next.length >= 8 ? 'text-emerald-600' : 'text-rose-400'}>
              {form.next.length >= 8 ? '✓' : '✗'} At least 8 characters
            </p>
            <p className={/[A-Z]/.test(form.next) ? 'text-emerald-600' : 'text-neutral-400'}>
              {/[A-Z]/.test(form.next) ? '✓' : '○'} Uppercase letter
            </p>
            <p className={/\d/.test(form.next) ? 'text-emerald-600' : 'text-neutral-400'}>
              {/\d/.test(form.next) ? '✓' : '○'} Number
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated successfully.
        </div>
      )}

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      {/* 2FA placeholder */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">Two-factor authentication</p>
            <p className="text-xs text-neutral-500 mt-1">Add a second layer of protection. Coming soon.</p>
          </div>
          <button disabled className="text-xs font-bold px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 cursor-not-allowed">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamPanel = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Team & Staff access</h2>
      <p className="text-xs text-neutral-500 mt-1">
        Invite people to help manage your events — gate scanners, co-admins, finance reviewers.
      </p>
    </div>

    {/* Role overview */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { role: 'Admin',   colour: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',     desc: 'Manage events, view revenue, invite staff' },
        { role: 'Staff',   colour: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',     desc: 'Scan tickets at the gate only' },
        { role: 'Finance', colour: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400', desc: 'View analytics & payout reports only' },
      ].map(r => (
        <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${r.colour} shrink-0 mt-0.5`}>{r.role}</span>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">{r.desc}</p>
        </div>
      ))}
    </div>

    {/* Invite form */}
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Invite a team member</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input className={`${inputCls} pl-9`} type="email" placeholder="colleague@example.com" />
        </div>
        <select className={`${inputCls} sm:w-36`}>
          <option>Staff</option>
          <option>Admin</option>
          <option>Finance</option>
        </select>
        <button className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all active:scale-[0.98] whitespace-nowrap">
          Send invite
        </button>
      </div>
    </div>

    {/* Coming soon notice */}
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <Users className="h-5 w-5 text-neutral-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-neutral-900 dark:text-white">Team management — coming soon</p>
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
          Full invite flow with role-based access is on the roadmap. For now you can plan your team structure using the roles above. Gate staff will be able to log in with a PIN and access only the scanner.
        </p>
      </div>
    </div>
  </div>
);

// ── Main settings page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile',         desc: 'Name, contact details, avatar',               icon: User },
  { id: 'organisation',  label: 'Organisation',     desc: 'Business name, description, public info',     icon: Building2 },
  { id: 'payouts',       label: 'Payouts & Tax',    desc: 'Bank details, tax ID, fee summary',           icon: Receipt },
  { id: 'notifications', label: 'Notifications',    desc: 'Email and alert preferences',                 icon: Bell },
  { id: 'security',      label: 'Login & Security', desc: 'Password, 2FA',                              icon: Shield },
  { id: 'team',          label: 'Team & Staff',     desc: 'Invite gate scanners, admins, finance users', icon: Users },
];

const PANEL: Record<string, React.ReactNode> = {
  profile:       <ProfilePanel />,
  organisation:  <OrganisationPanel />,
  payouts:       <PayoutsPanel />,
  notifications: <NotificationsPanel />,
  security:      <SecurityPanel />,
  team:          <TeamPanel />,
};

const SettingsDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'menu';
  const setTab = (t: string) => setSearchParams(t === 'menu' ? {} : { tab: t });

  return (
    <div className="py-4 sm:py-6 max-w-4xl mx-auto px-1">

      {/* Back breadcrumb */}
      {activeTab !== 'menu' && (
        <button
          onClick={() => setTab('menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-rose-500 transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          All settings
        </button>
      )}

      {/* Menu grid */}
      {activeTab === 'menu' && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Organizer Settings</h1>
            <p className="text-sm text-neutral-500 mt-1.5">Manage your account, organisation, payouts and team.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABS.map(tile => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  onClick={() => setTab(tile.id)}
                  className="text-left p-5 border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900/50 transition-all group"
                >
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl w-fit mb-3 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/40 transition-colors">
                    <Icon className="h-5 w-5 text-rose-500" />
                  </div>
                  <p className="text-sm font-extrabold text-neutral-900 dark:text-white">{tile.label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{tile.desc}</p>
                  <div className="flex justify-end mt-3">
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
                      Manage <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Active panel */}
      {activeTab !== 'menu' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 shadow-sm border border-neutral-100 dark:border-neutral-800">
          {PANEL[activeTab] ?? (
            <p className="text-sm text-neutral-500">Panel not found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsDashboard;
