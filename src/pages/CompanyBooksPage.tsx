import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStaffAccess } from '../hooks/useStaffAccess';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn } from '../lib/utils';
import { formatNaira } from '../lib/eventOrganizer';

type BookType = 'INCOME' | 'EXPENSE';

type BookEntry = {
  id: number;
  type: BookType;
  amount: number;
  category: string;
  description?: string | null;
  occurredAt: string;
  paymentMethod?: string | null;
  recordedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
  };
};

const INCOME_CATEGORIES = ['Bank credit', 'Refund received', 'Other income'];
const EXPENSE_CATEGORIES = [
  'Fuel',
  'Ads',
  'Salary',
  'Venue ops',
  'Software',
  'Transport',
  'Other',
];

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'POS', label: 'POS' },
  { value: 'OTHER', label: 'Other' },
] as const;

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateInputValue(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return todayIsoDate();
  }
}

function formatDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Strip to digits + optional decimal, then add thousand commas. */
function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const firstDot = cleaned.indexOf('.');
  let intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  let decPart = firstDot === -1 ? '' : cleaned.slice(firstDot + 1).replace(/\./g, '');

  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  if (decPart.length > 2) decPart = decPart.slice(0, 2);

  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (firstDot !== -1) return `${withCommas}.${decPart}`;
  return withCommas;
}

function parseAmountInput(formatted: string): number {
  const n = Number(String(formatted).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function amountToInput(n: number): string {
  if (!Number.isFinite(n)) return '';
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  return formatAmountInput(fixed);
}

function paymentLabel(code?: string | null) {
  if (!code) return null;
  return PAYMENT_OPTIONS.find((p) => p.value === code)?.label || code;
}

type FormState = {
  type: BookType;
  amount: string;
  category: string;
  customCategory: string;
  description: string;
  occurredAt: string;
  paymentMethod: string;
};

const emptyForm = (): FormState => ({
  type: 'EXPENSE',
  amount: '',
  category: 'Fuel',
  customCategory: '',
  description: '',
  occurredAt: todayIsoDate(),
  paymentMethod: 'TRANSFER',
});

const CompanyBooksPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { canFinance, isLoading: accessLoading } = useStaffAccess();
  const booksBase = isAdmin ? '/admin/books' : '/staff/books';
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<'all' | BookType>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BookEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const listParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (typeFilter !== 'all') params.type = typeFilter;
    if (from) params.from = from;
    if (to) params.to = to;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [typeFilter, from, to, search]);

  const summaryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [from, to, search]);

  const hasActiveFilters = typeFilter !== 'all' || !!from || !!to || !!search.trim();

  const clearFilters = () => {
    setTypeFilter('all');
    setFrom('');
    setTo('');
    setSearch('');
  };

  const { data: entries = [], isLoading: listLoading } = useQuery({
    queryKey: ['company-books', booksBase, listParams],
    queryFn: async () => {
      const res = await api.books.list(booksBase, listParams);
      return (res.data || []) as BookEntry[];
    },
    enabled: isAdmin || canFinance,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['company-books-summary', booksBase, summaryParams],
    queryFn: async () => {
      const res = await api.books.summary(booksBase, summaryParams);
      return res.data as {
        income: number;
        expense: number;
        net: number;
        incomeCount: number;
        expenseCount: number;
      };
    },
    enabled: isAdmin || canFinance,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['company-books'] });
    queryClient.invalidateQueries({ queryKey: ['company-books-summary'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const category =
        form.category === 'Other' || form.category === 'Other income'
          ? form.customCategory.trim() || form.category
          : form.category;
      if (
        (form.category === 'Other' || form.category === 'Other income') &&
        !form.customCategory.trim()
      ) {
        throw new Error('Please describe the category');
      }
      const amount = parseAmountInput(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Enter an amount greater than 0');
      }
      if (!category) throw new Error('Pick a category');
      if (!form.occurredAt) throw new Error('Pick a date');

      const payload = {
        type: form.type,
        amount,
        category,
        description: form.description.trim() || null,
        occurredAt: form.occurredAt,
        paymentMethod: form.paymentMethod || null,
      };

      if (editing) {
        return api.books.update(booksBase, editing.id, payload);
      }
      return api.books.create(booksBase, payload);
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
      setFormError(null);
      invalidate();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err?.message || 'Could not save entry');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.books.remove(booksBase, id),
    onSuccess: () => {
      setDeleteId(null);
      invalidate();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (entry: BookEntry) => {
    const cats = entry.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const known = cats.includes(entry.category);
    setEditing(entry);
    setForm({
      type: entry.type,
      amount: amountToInput(entry.amount),
      category: known ? entry.category : entry.type === 'INCOME' ? 'Other income' : 'Other',
      customCategory: known ? '' : entry.category,
      description: entry.description || '',
      occurredAt: toDateInputValue(entry.occurredAt),
      paymentMethod: entry.paymentMethod || 'TRANSFER',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const categoryOptions = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const needsCustom = form.category === 'Other' || form.category === 'Other income';

  if (!isAdmin) {
    if (accessLoading) {
      return (
        <div className="py-2 px-2 sm:px-3 max-w-7xl mx-auto space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      );
    }
    if (!canFinance) {
      return <Navigate to="/staff" replace />;
    }
  }

  const kpis = [
    {
      label: 'Income',
      value: summary?.income ?? 0,
      blurb: `${summary?.incomeCount ?? 0}`,
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Expense',
      value: summary?.expense ?? 0,
      blurb: `${summary?.expenseCount ?? 0}`,
      tone: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Net',
      value: summary?.net ?? 0,
      blurb: (summary?.net ?? 0) >= 0 ? '+' : '−',
      tone:
        (summary?.net ?? 0) >= 0
          ? 'text-neutral-900 dark:text-white'
          : 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="py-2 px-2 sm:px-3 max-w-7xl mx-auto pb-6 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="Company"
        accent="Books"
        description="PartyStorm cash in / out — not host ticket sales."
        actions={
          <Button
            size="sm"
            className="h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white border-0 text-[11px] font-bold px-2.5"
            onClick={openCreate}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Add
          </Button>
        }
      />

      {/* Compact KPI strip */}
      <div className="mb-2.5 grid grid-cols-3 divide-x divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {kpis.map((stat) => (
          <div key={stat.label} className="min-w-0 px-2.5 py-2 sm:px-3 sm:py-2">
            <p className="truncate text-[9px] font-bold uppercase tracking-wider text-neutral-400">
              {stat.label}
              <span className="ml-1 font-medium normal-case tracking-normal text-neutral-300 dark:text-neutral-600">
                · {stat.blurb}
              </span>
            </p>
            {summaryLoading ? (
              <Skeleton className="mt-1 h-5 w-14" />
            ) : (
              <p className={`mt-0.5 text-sm font-bold tabular-nums tracking-tight sm:text-base ${stat.tone}`}>
                {formatNaira(stat.value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Compact filters — one row on desktop */}
      <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 text-[11px] font-semibold self-start shrink-0">
          {([
            { id: 'all', label: 'All' },
            { id: 'INCOME', label: 'In' },
            { id: 'EXPENSE', label: 'Out' },
          ] as const).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setTypeFilter(mode.id)}
              className={cn(
                'px-2 py-1 rounded-md transition-all',
                typeFilter === mode.id
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            title="From"
            className="h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1.5 text-[11px] w-[8.5rem]"
          />
          <span className="text-[10px] text-neutral-400">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            title="To"
            className="h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1.5 text-[11px] w-[8.5rem]"
          />
          <div className="relative flex-1 min-w-[7rem]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-7 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-7 pr-2 text-[11px]"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Clear filters"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {listLoading ? (
          <div className="p-2.5 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Wallet className="h-6 w-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {hasActiveFilters ? 'No matches' : 'No entries yet'}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {hasActiveFilters ? 'Clear filters or change dates.' : 'Add income or an expense to start.'}
            </p>
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" className="mt-2.5 h-7 rounded-lg text-[11px]" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-2.5 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white border-0 text-[11px]"
                onClick={openCreate}
              >
                <Plus className="h-3 w-3 mr-0.5" />
                Add entry
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {entries.map((entry) => {
              const isIncome = entry.type === 'INCOME';
              const who = entry.recordedBy
                ? `${entry.recordedBy.firstName} ${entry.recordedBy.lastName}`.trim()
                : '—';
              const pay = paymentLabel(entry.paymentMethod);
              return (
                <li
                  key={entry.id}
                  className="px-2.5 py-2 flex items-center justify-between gap-2 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'shrink-0 rounded-md p-1',
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {entry.category}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded',
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          )}
                        >
                          {isIncome ? 'In' : 'Out'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {formatDateLabel(entry.occurredAt)}
                        {pay ? ` · ${pay}` : ''}
                        {` · ${who}`}
                        {entry.description ? ` · ${entry.description}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-0.5">
                    <p
                      className={cn(
                        'text-xs font-bold tabular-nums mr-1',
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-900 dark:text-white'
                      )}
                    >
                      {isIncome ? '+' : '−'}
                      {formatNaira(entry.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(entry.id)}
                      className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!isAdmin && (
        <p className="mt-2 text-[10px] text-neutral-400">
          Finance staff view.{' '}
          <Link to="/staff" className="text-rose-500 font-semibold hover:underline">
            Staff home
          </Link>
        </p>
      )}

      {/* Add / Edit — roomy dialog (page stays compact) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-base font-bold">
              {editing ? 'Edit entry' : 'Add entry'}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {form.type === 'INCOME'
                ? 'Money coming into PartyStorm (bank credit, refund, etc.).'
                : 'Money going out (fuel, ads, salary, etc.).'}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 pt-1"
            onSubmit={(e) => {
              e.preventDefault();
              setFormError(null);
              saveMutation.mutate();
            }}
          >
            <div className="inline-flex w-full rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 sm:p-1 text-[11px] sm:text-xs font-semibold">
              {([
                { id: 'EXPENSE' as const, label: 'Expense', hint: 'Cash out' },
                { id: 'INCOME' as const, label: 'Income', hint: 'Cash in' },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      type: t.id,
                      category: t.id === 'INCOME' ? 'Bank credit' : 'Fuel',
                      customCategory: '',
                    }))
                  }
                  className={cn(
                    'flex-1 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg transition-all',
                    form.type === t.id
                      ? t.id === 'INCOME'
                        ? 'bg-emerald-500 text-white shadow-sm font-bold'
                        : 'bg-rose-500 text-white shadow-sm font-bold'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  )}
                >
                  <span className="block">{t.label}</span>
                  <span
                    className={cn(
                      'hidden sm:block text-[9px] font-medium mt-0.5',
                      form.type === t.id ? 'text-white/80' : 'text-neutral-400'
                    )}
                  >
                    {t.hint}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Amount
              </label>
              <div className="mt-1.5 flex items-stretch overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-400">
                <span className="flex items-center px-3 text-sm font-bold text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-700">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: formatAmountInput(e.target.value) }))
                  }
                  className="flex-1 min-w-0 bg-transparent px-3 py-3 text-lg font-bold tabular-nums outline-none"
                  placeholder="0"
                  aria-label="Amount in naira"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Category
              </label>
              {/* Mobile: select · Desktop: chips */}
              <div className="mt-1.5 sm:hidden">
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, category: v, customCategory: '' }))
                  }
                >
                  <SelectTrigger className="w-full rounded-xl text-xs h-10">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-1.5 hidden sm:flex flex-wrap gap-1.5">
                {categoryOptions.map((c) => {
                  const selected = form.category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, category: c, customCategory: '' }))}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors',
                        selected
                          ? form.type === 'INCOME'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {needsCustom && (
                <input
                  value={form.customCategory}
                  onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                  placeholder="Describe category"
                  className="mt-2 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-xs"
                  autoFocus
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Date
                </label>
                <input
                  type="date"
                  value={form.occurredAt}
                  onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Payment
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {PAYMENT_OPTIONS.map((m) => {
                    const selected = form.paymentMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, paymentMethod: m.value }))}
                        className={cn(
                          'rounded-xl px-2 py-2 text-[11px] font-semibold border transition-colors',
                          selected
                            ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:text-neutral-900 dark:border-white'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Note <span className="font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-xs resize-none"
                placeholder="e.g. Filling station on Lekki–Epe for gate ops"
              />
            </div>

            {formError && (
              <p className="rounded-xl bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn(
                  'rounded-xl text-white border-0 text-xs font-bold',
                  form.type === 'INCOME'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-rose-500 hover:bg-rose-600'
                )}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : form.type === 'INCOME'
                      ? 'Record income'
                      : 'Record expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Delete this entry?</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              This permanently removes it from the books. You can’t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs font-bold"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId != null && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyBooksPage;
