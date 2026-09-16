import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../../lib/utils';

export interface VendorStallType {
  id: string;
  name: string;
  price: number;
  maxStalls: number;
  description?: string;
}

export interface VendorSettings {
  allowVendors: boolean;
  stallTypes: VendorStallType[];
  allowedRoles: string[];
  approvalMode: 'auto' | 'manual' | 'vetted';
  applicationDeadline: number;
}

interface VendorSettingsStepProps {
  settings: VendorSettings;
  onSettingsChange: (settings: VendorSettings) => void;
}

interface StallForm {
  id: string;
  name: string;
  price: string;
  maxStalls: string;
  description: string;
}

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';

const VendorSettingsStep: React.FC<VendorSettingsStepProps> = ({ settings, onSettingsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StallForm | null>(null);
  const [showForm, setShowForm] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setFormData(null);
    setEditingId(null);
  };

  const handleAddStallType = () => {
    setEditingId(null);
    setFormData({ id: `stall_${Date.now()}`, name: '', price: '', maxStalls: '', description: '' });
    setShowForm(true);
  };

  const handleEditStallType = (stall: VendorStallType) => {
    setEditingId(stall.id);
    setFormData({
      id: stall.id,
      name: stall.name,
      price: stall.price === 0 ? '' : String(stall.price),
      maxStalls: String(stall.maxStalls),
      description: stall.description || '',
    });
    setShowForm(true);
  };

  const handleSaveStallType = () => {
    if (!formData || !formData.name.trim()) return;

    const price = formData.price.trim() === '' ? 0 : Number(formData.price);
    const maxStalls = formData.maxStalls.trim() === '' ? 10 : Number(formData.maxStalls);
    if (Number.isNaN(price) || price < 0) return;
    if (Number.isNaN(maxStalls) || maxStalls < 1) return;

    const stall: VendorStallType = {
      id: formData.id,
      name: formData.name.trim(),
      price,
      maxStalls,
      description: formData.description.trim() || undefined,
    };

    const updated =
      editingId === null
        ? [...settings.stallTypes, stall]
        : settings.stallTypes.map((s) => (s.id === editingId ? stall : s));

    onSettingsChange({ ...settings, stallTypes: updated });
    closeForm();
  };

  const handleDeleteStallType = (id: string) => {
    onSettingsChange({
      ...settings,
      stallTypes: settings.stallTypes.filter((s) => s.id !== id),
    });
  };

  if (!settings.allowVendors) return null;

  const approvalMode = settings.approvalMode === 'auto' ? 'auto' : 'manual';
  const deadlineValue =
    settings.applicationDeadline > 0 ? String(settings.applicationDeadline) : '';

  return (
    <>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Stall types</p>
          <button
            type="button"
            onClick={handleAddStallType}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
          >
            <Plus className="h-3.5 w-3.5" /> Add stall
          </button>
        </div>

        {settings.stallTypes.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-neutral-400">
            Add a stall type so vendors know what they can apply for.
          </p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {settings.stallTypes.map((stall) => (
              <div key={stall.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{stall.name}</p>
                  <p className="text-xs text-neutral-500">
                    {stall.price > 0 ? `₦${stall.price.toLocaleString()}` : 'Free'} · Max {stall.maxStalls}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditStallType(stall)}
                    className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label={`Edit ${stall.name}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStallType(stall.id)}
                    className="p-2 rounded-lg text-neutral-500 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    aria-label={`Remove ${stall.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">Approval</p>
            <div className="flex gap-2">
              {(['auto', 'manual'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, approvalMode: mode })}
                  className={cn(
                    'flex-1 h-10 rounded-lg border text-sm font-semibold capitalize transition-colors',
                    approvalMode === mode
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-rose-300'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">Close applications</p>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={deadlineValue}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    applicationDeadline: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                placeholder="5"
                className={cn(inputClass, 'pr-32')}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-neutral-400">
                days before event
              </span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{editingId ? 'Edit stall' : 'Add stall'}</DialogTitle>
            <DialogDescription className="text-xs">
              Vendors will see this as a booth they can apply for.
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Basic Booth"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                    Max stalls
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxStalls}
                    onChange={(e) => setFormData({ ...formData, maxStalls: e.target.value })}
                    placeholder="10"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Description <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What’s included with this stall"
                  rows={2}
                  className={cn(inputClass, 'h-auto py-2.5 resize-none')}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeForm} className="rounded-lg text-sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveStallType}
              disabled={!formData?.name.trim()}
              className="rounded-lg text-sm bg-rose-500 hover:bg-rose-600 text-white border-0"
            >
              {editingId ? 'Save' : 'Add stall'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorSettingsStep;
