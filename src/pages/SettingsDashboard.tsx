import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
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
  Copy,
  X,
  Search,
  Zap,
  RefreshCw,
  Banknote,
  Camera,
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
  label = "Save changes"
}: { 
  saving: boolean; 
  saved: boolean; 
  onClick: () => void;
  label?: string;
}) => (
  <button 
    type="button"
    onClick={onClick}
    disabled={saving || saved}
    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-60 transition-all active:scale-[0.98]"
  >
    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 
     saved ? <CheckCircle2 className="h-4 w-4" /> : 
     <Save className="h-4 w-4" />}
    {saved ? 'Saved!' : label}
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
  const org = user?.ownedOrganizations?.[0];
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    businessName:  org?.name        ?? '',
    description:   org?.description ?? '',
    contactInfo:   org?.website     ?? '',
    phone:         user?.phone      ?? '',
  });
  const [logo, setLogo] = useState(org?.logo ?? '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    setLogo(org?.logo ?? '');
  }, [org?.logo]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org?.id) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setUploadingLogo(true);
    setError('');
    setSaved(false);
    try {
      const uploaded = await api.userRoles.uploadOrgLogo(file);
      const url = uploaded.data.url;
      await api.userRoles.updateOrganizerProfile({
        organizationId: org.id,
        businessName: form.businessName,
        description: form.description,
        contactInfo: form.contactInfo,
        phone: form.phone,
        logo: url,
      });
      setLogo(url);
      const profileRes = await api.auth.verify();
      if (profileRes.data) updateUser(profileRes.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not update the image.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await api.userRoles.updateOrganizerProfile({
        organizationId: org?.id,
        businessName: form.businessName,
        description:  form.description,
        contactInfo:  form.contactInfo,
        phone:        form.phone,
      });
      // The backend returns an updated organization, we need to refresh user profile to sync
      const profileRes = await api.auth.verify();
      if (profileRes.data) {
        updateUser(profileRes.data);
      }
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
        {user?.ownedOrganizations?.some(org => org.isVerified) && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified organiser
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xl font-extrabold text-white">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              (form.businessName?.[0] ?? 'H').toUpperCase()
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo || !org?.id}
            className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-neutral-900 p-1.5 text-white disabled:opacity-50 dark:border-neutral-950"
            aria-label="Change organisation image"
          >
            <Camera className="h-3 w-3" />
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">Host image</p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo || !org?.id}
            className="text-xs font-bold text-rose-500 disabled:opacity-50"
          >
            {uploadingLogo ? 'Uploading…' : logo ? 'Change image' : 'Upload image'}
          </button>
          <p className="mt-0.5 text-[10px] text-neutral-400">Shown on event pages. JPG or PNG, under 5MB.</p>
        </div>
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

const PayoutsPanel = () => {
  const { user, updateUser } = useAuth();
  const org = user?.ownedOrganizations?.[0];

  const [form, setForm] = useState({
    payoutBankName: org?.payoutBankName ?? '',
    payoutAccountNumber: org?.payoutAccountNumber ?? '',
    payoutAccountName: org?.payoutAccountName ?? '',
    payoutSchedule: org?.payoutSchedule ?? 'After each event',
    taxId: org?.taxId ?? '',
    vatNumber: org?.vatNumber ?? '',
    businessAddress: org?.businessAddress ?? '',
    absorbFee: org?.absorbFee ?? false,
  });

  const [banksList, setBanksList] = useState<Array<{ name: string; code: string }>>([]);
  const [bankQuery, setBankQuery] = useState(org?.payoutBankName ?? '');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(Boolean(org?.payoutAccountName && org?.payoutAccountNumber));
  const [verificationError, setVerificationError] = useState('');

  // Track if user explicitly edited so we NEVER verify automatically on initial page load
  const userEditedRef = useRef(false);
  // Track last verified key so we don't spam duplicate calls
  const lastResolvedKeyRef = useRef(
    org?.payoutAccountNumber && org?.payoutAccountName
      ? `${org.payoutAccountNumber}-${org.payoutBankName || ''}`
      : ''
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync if org loads asynchronously after initial mount
  useEffect(() => {
    if (org && !userEditedRef.current) {
      setForm((p) => ({
        ...p,
        payoutBankName: org.payoutBankName ?? p.payoutBankName,
        payoutAccountNumber: org.payoutAccountNumber ?? p.payoutAccountNumber,
        payoutAccountName: org.payoutAccountName ?? p.payoutAccountName,
        payoutSchedule: org.payoutSchedule ?? p.payoutSchedule,
        taxId: org.taxId ?? p.taxId,
        vatNumber: org.vatNumber ?? p.vatNumber,
        businessAddress: org.businessAddress ?? p.businessAddress,
        absorbFee: org.absorbFee ?? p.absorbFee,
      }));
      if (org.payoutBankName) setBankQuery(org.payoutBankName);
      if (org.payoutAccountNumber && org.payoutAccountName) {
        setAccountVerified(true);
        lastResolvedKeyRef.current = `${org.payoutAccountNumber}-${org.payoutBankName || ''}`;
      }
    }
  }, [org]);

  useEffect(() => {
    let isMounted = true;
    setLoadingBanks(true);
    api.userRoles.getBanks()
      .then((res) => {
        if (isMounted && res.data?.banks) {
          setBanksList(res.data.banks);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch Paystack banks:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBanks(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Match initial bank code from bank name if present
  useEffect(() => {
    if (banksList.length > 0 && form.payoutBankName && !selectedBankCode) {
      const match = banksList.find(
        (b) => b.name.toLowerCase() === form.payoutBankName.toLowerCase()
      );
      if (match) setSelectedBankCode(match.code);
    }
  }, [banksList, form.payoutBankName, selectedBankCode]);

  const filteredBanks = banksList.filter(
    (b) => b.name.toLowerCase().includes(bankQuery.toLowerCase()) || b.code.includes(bankQuery)
  );

  const handleSelectBank = (bankName: string, bankCode: string) => {
    userEditedRef.current = true;
    setForm((p) => ({ ...p, payoutBankName: bankName }));
    setBankQuery(bankName);
    setSelectedBankCode(bankCode);
    setShowBankDropdown(false);
    setAccountVerified(false);
    setVerificationError('');
  };

  // Perform resolution (100% Free of charge with Paystack NUBAN resolve)
  const resolveAccount = useCallback(async (accountNum?: string, bankCd?: string, bankNm?: string) => {
    const cleanNum = (accountNum ?? form.payoutAccountNumber).trim().replace(/\D/g, '');
    const code = bankCd ?? selectedBankCode;
    const name = bankNm ?? form.payoutBankName ?? bankQuery;

    // Must be exactly 10 digits before sending
    if (cleanNum.length !== 10) return;
    if (!code && !name) return;

    const resolveKey = `${cleanNum}-${code || name}`;
    if (resolveKey === lastResolvedKeyRef.current && accountVerified) {
      return;
    }

    setVerifyingAccount(true);
    setVerificationError('');
    try {
      const res = await api.userRoles.resolveBankAccount({
        accountNumber: cleanNum,
        bankCode: code || undefined,
        bankName: name || undefined,
      });
      if (res.data?.accountName) {
        setForm((p) => ({ ...p, payoutAccountName: res.data.accountName }));
        setAccountVerified(true);
        setVerificationError('');
        lastResolvedKeyRef.current = resolveKey;
      }
    } catch (err: any) {
      setAccountVerified(false);
      setVerificationError(
        err?.response?.data?.message || 'Could not verify account name with this bank.'
      );
    } finally {
      setVerifyingAccount(false);
    }
  }, [form.payoutAccountNumber, selectedBankCode, form.payoutBankName, bankQuery, accountVerified]);

  // Debounced auto-resolve: ONLY triggers if user actively edited AND number has reached 10 digits
  useEffect(() => {
    if (!userEditedRef.current) return;

    const cleanNum = form.payoutAccountNumber.trim().replace(/\D/g, '');
    const bankNameOrCode = selectedBankCode || form.payoutBankName || bankQuery;

    // Do NOT send until we have 10 digits and a bank
    if (cleanNum.length !== 10 || !bankNameOrCode) {
      return;
    }

    const resolveKey = `${cleanNum}-${bankNameOrCode}`;
    if (resolveKey === lastResolvedKeyRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      resolveAccount(cleanNum, selectedBankCode, form.payoutBankName || bankQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [form.payoutAccountNumber, selectedBankCode, form.payoutBankName, bankQuery, resolveAccount]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.userRoles.updateOrganizerProfile({
        organizationId: org.id,
        businessName: org.name,
        description: org.description ?? '',
        contactInfo: org.website ?? '',
        phone: user?.phone ?? '',
        payoutBankName: form.payoutBankName || bankQuery,
        payoutAccountNumber: form.payoutAccountNumber,
        payoutAccountName: form.payoutAccountName,
        payoutSchedule: form.payoutSchedule,
        taxId: form.taxId,
        vatNumber: form.vatNumber,
        businessAddress: form.businessAddress,
        absorbFee: form.absorbFee,
      });
      const profileRes = await api.auth.verify();
      if (profileRes.data) {
        updateUser(profileRes.data);
      }
      userEditedRef.current = false;
      lastResolvedKeyRef.current = `${form.payoutAccountNumber}-${form.payoutBankName || bankQuery}`;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save payout details.');
    } finally {
      setSaving(false);
    }
  };

  // Live example calculation (₦10,000 ticket)
  const examplePrice = 10000;
  const platformFee = Math.min(Math.max(100, examplePrice * 0.06), 2000); // ₦600
  const paystackFee = examplePrice * 0.015 + 100; // ₦250
  const totalFees = platformFee + paystackFee;
  const hostReceives = form.absorbFee ? examplePrice - totalFees : examplePrice;
  const buyerPays = form.absorbFee ? examplePrice : examplePrice + totalFees;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
          Payouts & Settlement
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Connect your Nigerian bank account to receive automatic split settlements after ticket sales.
        </p>
      </div>

      {/* Compact Settlement Bank Form */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Settlement Bank Account
          </p>
          <span className="text-[11px] text-neutral-400">
            Automated direct payout via Paystack
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Bank selector */}
          <div className="relative">
            <label className={labelCls}>Bank Name</label>
            <div className="relative">
              <input
                type="text"
                className={inputCls}
                value={bankQuery}
                onChange={(e) => {
                  userEditedRef.current = true;
                  setBankQuery(e.target.value);
                  setForm((p) => ({ ...p, payoutBankName: e.target.value }));
                  setSelectedBankCode('');
                  setShowBankDropdown(true);
                  setAccountVerified(false);
                  setVerificationError('');
                }}
                onFocus={() => setShowBankDropdown(true)}
                placeholder="Search bank (e.g. GTBank, Zenith, Kuda)"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {showBankDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl z-50 divide-y divide-neutral-100 dark:divide-neutral-800">
                {loadingBanks ? (
                  <div className="p-3 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" /> Loading banks...
                  </div>
                ) : filteredBanks.length === 0 ? (
                  <div className="p-3 text-xs text-neutral-500">
                    No matching bank found. You can type your bank name manually.
                  </div>
                ) : (
                  filteredBanks.slice(0, 30).map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => handleSelectBank(b.name, b.code)}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-between group"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-500">
                        {b.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                        {b.code}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Account Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                10-Digit NUBAN Account Number
              </label>
              {form.payoutAccountNumber.length > 0 && form.payoutAccountNumber.length < 10 && (
                <span className="text-[11px] font-mono text-neutral-400">
                  {form.payoutAccountNumber.length}/10 digits
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`${inputCls} pr-24 font-mono tracking-wide`}
                value={form.payoutAccountNumber}
                onChange={(e) => {
                  userEditedRef.current = true;
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm((p) => ({ ...p, payoutAccountNumber: val }));
                  if (val !== form.payoutAccountNumber) {
                    setAccountVerified(false);
                    setVerificationError('');
                  }
                }}
                placeholder="0123456789"
                maxLength={10}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {verifyingAccount ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-rose-500 font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : accountVerified ? (
                  <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Verified</span>
                  </div>
                ) : form.payoutAccountNumber.length === 10 ? (
                  <button
                    type="button"
                    onClick={() => {
                      userEditedRef.current = true;
                      resolveAccount(form.payoutAccountNumber, selectedBankCode, form.payoutBankName || bankQuery);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
                  >
                    Verify
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Account Name (Auto-resolved, read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Account Name
              </label>
              {verifyingAccount ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking bank...
                </span>
              ) : accountVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified by Paystack
                </span>
              ) : null}
            </div>
            <input
              type="text"
              readOnly
              className={`${inputCls} cursor-default select-none ${
                accountVerified
                  ? 'border-emerald-500/60 dark:border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10 font-semibold text-neutral-900 dark:text-white'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-500'
              }`}
              value={form.payoutAccountName}
              placeholder={
                verifyingAccount
                  ? 'Resolving account holder name...'
                  : 'Auto-resolved after entering 10 digits'
              }
            />
            {verificationError && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" /> {verificationError}
              </p>
            )}
          </div>

          {/* Payout Schedule */}
          <div>
            <label className={labelCls}>Payout Schedule</label>
            <select
              className={inputCls}
              value={form.payoutSchedule}
              onChange={(e) => setForm((p) => ({ ...p, payoutSchedule: e.target.value }))}
            >
              <option value="After each event">After each event (Paystack Direct Split)</option>
              <option value="Weekly">Weekly Digest Settlement</option>
              <option value="Monthly">Monthly Settlement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Split Settings & Compact Live Calculation */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
          <div>
            <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Fee Allocation
            </p>
            <p className="text-[11px] text-neutral-500">
              PartyStorm fee: 6% (min ₦100, max ₦2,000) · Paystack gateway: 1.5% + ₦100
            </p>
          </div>
          <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-900/40 self-start sm:self-auto">
            {form.absorbFee ? 'Host Absorbs Fees' : 'Buyer Pays Fees'}
          </span>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 cursor-pointer hover:bg-neutral-100/50 transition-colors">
          <input
            type="checkbox"
            checked={form.absorbFee}
            onChange={(e) => setForm((p) => ({ ...p, absorbFee: e.target.checked }))}
            className="mt-0.5 rounded text-rose-500 focus:ring-rose-500 h-4 w-4 shrink-0"
          />
          <div className="text-xs">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Absorb ticket platform & processing fees
            </span>
            <p className="text-neutral-500 text-[11px] mt-0.5">
              When checked, buyers pay exact ticket price. Fees are subtracted from your direct payout.
            </p>
          </div>
        </label>

        {/* Compact Simulation Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
          <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">
            Example ₦10,000 ticket: Buyer pays <strong className="text-neutral-900 dark:text-white">₦{buyerPays.toLocaleString()}</strong>
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">
            You receive ₦{hostReceives.toLocaleString()} direct to bank
          </span>
        </div>
      </div>

      {/* Compact Tax Details */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-3">
        <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-2">
          Tax & Billing Info <span className="font-normal text-neutral-400 lowercase">(optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tax ID / TIN</label>
            <input
              className={inputCls}
              value={form.taxId}
              onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
              placeholder="Tax ID or CAC RC number"
            />
          </div>
          <div>
            <label className={labelCls}>VAT Number</label>
            <input
              className={inputCls}
              value={form.vatNumber}
              onChange={(e) => setForm((p) => ({ ...p, vatNumber: e.target.value }))}
              placeholder="Optional VAT registration"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Business Address</label>
            <input
              className={inputCls}
              value={form.businessAddress}
              onChange={(e) => setForm((p) => ({ ...p, businessAddress: e.target.value }))}
              placeholder="Address printed on attendee receipts"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Save Settlement Details" />
      </div>
    </div>
  );
};

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
        <Toggle checked={prefs.marketingEmails} onChange={() => toggle('marketingEmails')} label="Tips & product updates" description="Feature announcements and hosting tips from PartyStorm" />
      </div>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  );
};

const SecurityPanel = () => {
  const { user, updateUser } = useAuth();
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
      const res = await api.post<{ user?: any }>('/users/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      if (res.data?.user && user) {
        updateUser({ ...user, ...res.data.user, mustChangePassword: false });
      } else if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
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

const TeamPanel = () => {
  const [name,    setName]    = React.useState('');
  const [entries, setEntries] = React.useState<Array<{ id: number; name: string; pin: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding,  setAdding]  = React.useState(false);
  const [error,   setError]   = React.useState('');
  const [copied,  setCopied]  = React.useState<string | null>(null);

  const gateUrl = `${window.location.origin}/scan-gate`;

  React.useEffect(() => {
    api.gatePins.list()
      .then(r => setEntries((r.data ?? []).map((e: any) => ({ id: e.id, name: e.staffName, pin: e.pin }))))
      .catch(() => setError('Could not load gate PINs.'))
      .finally(() => setLoading(false));
  }, []);

  const addScanner = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true); setError('');
    try {
      const r = await api.gatePins.create(trimmed);
      setEntries(prev => [{ id: r.data.id, name: r.data.staffName, pin: r.data.pin }, ...prev]);
      setName('');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not create PIN.');
    } finally { setAdding(false); }
  };

  const removeScanner = async (id: number) => {
    try {
      await api.gatePins.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch { setError('Could not revoke PIN.'); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Team & Gate staff</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Create a PIN for each gate scanner. They open{' '}
          <a href={gateUrl} target="_blank" rel="noreferrer" className="text-rose-500 underline font-bold">/scan-gate</a>
          {' '}on their phone and enter the PIN — no account needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { step: '1', text: 'Add a scanner name and click "Generate PIN".' },
          { step: '2', text: 'Share the link + PIN with your gate staff via WhatsApp or SMS.' },
          { step: '3', text: 'They enter the PIN on their phone and start scanning immediately.' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">{s.step}</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Add gate scanner</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              className={inputCls + ' pl-9'}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addScanner()}
              placeholder="e.g. Ahmed (Gate 1)"
            />
          </div>
          <button
            onClick={addScanner}
            disabled={!name.trim() || adding}
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-[0.98] whitespace-nowrap flex items-center gap-2"
          >
            {adding && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate PIN
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Shareable gate scanner link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-100 dark:border-neutral-800 truncate text-neutral-600 dark:text-neutral-400">
            {gateUrl}
          </code>
          <button
            onClick={() => copyText(gateUrl, 'url')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:border-rose-300 hover:text-rose-500 transition-colors shrink-0"
          >
            {copied === 'url' ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <>Copy link</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-rose-400" /></div>
      ) : entries.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active scanners ({entries.length})</p>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{entry.name}</p>
                    <p className="text-xs text-neutral-500">Gate staff</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyText(entry.pin, entry.pin)}
                    className="flex items-center gap-1.5 font-mono text-sm font-extrabold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors"
                    title="Click to copy PIN"
                  >
                    {entry.pin}
                    {copied === entry.pin
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3 w-3 text-neutral-400" />}
                  </button>
                  <button
                    onClick={() => removeScanner(entry.id)}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Revoke PIN"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No scanners added yet.</p>
          <p className="text-xs mt-1">Add a name above to generate the first PIN.</p>
        </div>
      )}
    </div>
  );
};


// ── Main settings page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Your profile',     desc: 'Name, email, and phone',                      icon: User },
  { id: 'organisation',  label: 'Organisation',     desc: 'Public name, image, about, and contact link', icon: Building2 },
  { id: 'payouts',       label: 'Payouts & bank',   desc: 'Where ticket money gets paid out',            icon: Receipt },
  { id: 'team',          label: 'Gate scanners',    desc: 'Create PINs for day-of gate staff phones',    icon: Users },
];

const PANEL: Record<string, React.ReactNode> = {
  profile:       <ProfilePanel />,
  organisation:  <OrganisationPanel />,
  payouts:       <PayoutsPanel />,
  team:          <TeamPanel />,
};

const SettingsDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organisation';
  const setTab = (t: string) => setSearchParams({ tab: t });

  const current = TABS.find((t) => t.id === activeTab) || TABS[1];

  return (
    <div className="py-4 sm:py-6 max-w-5xl mx-auto px-1 pb-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-xl">
          Keep your organiser profile, payouts, and gate staff ready for event day.
        </p>
      </div>

      {/* Mobile: horizontal pills */}
      <div className="lg:hidden mb-5 -mx-1 px-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1 min-w-max">
          {TABS.map((tile) => {
            const Icon = tile.icon;
            const active = activeTab === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => setTab(tile.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                  active
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tile.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop side nav */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {TABS.map((tile) => {
              const Icon = tile.icon;
              const active = activeTab === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setTab(tile.id)}
                  className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-colors ${
                    active
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-rose-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{tile.label}</span>
                    <span className="block text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      {tile.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">{current.label}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{current.desc}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-neutral-100 dark:border-neutral-800">
            {PANEL[activeTab] ?? (
              <p className="text-sm text-neutral-500">Panel not found.</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SettingsDashboard;
