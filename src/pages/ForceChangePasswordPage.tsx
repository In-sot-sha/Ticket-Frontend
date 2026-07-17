import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';

/**
 * Blocking screen when mustChangePassword is true (staff invite / reset).
 */
const ForceChangePasswordPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next) {
      setError('All fields are required.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (next.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post<{ user: any }>('/users/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      if (res.data?.user) {
        updateUser({ ...user!, ...res.data.user, mustChangePassword: false });
      } else if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
      navigate(user?.isStaff ? '/staff' : '/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
    visible,
    onToggle,
    onChange,
    autoComplete,
  }: {
    label: string;
    value: string;
    visible: boolean;
    onToggle: () => void;
    onChange: (v: string) => void;
    autoComplete: string;
  }) => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Set a new password</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              You signed in with a temporary password. Choose a new one to continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field
            label="Current (temporary) password"
            value={current}
            visible={show.current}
            onToggle={() => setShow((s) => ({ ...s, current: !s.current }))}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <Field
            label="New password"
            value={next}
            visible={show.next}
            onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
            onChange={setNext}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            value={confirm}
            visible={show.confirm}
            onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            onChange={setConfirm}
            autoComplete="new-password"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl h-11"
          >
            {saving ? 'Saving…' : 'Save and continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
