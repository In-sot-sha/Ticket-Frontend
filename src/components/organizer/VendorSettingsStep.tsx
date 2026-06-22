import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

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

const VENDOR_ROLES = [
  { id: 'catering', label: 'Catering' },
  { id: 'photography', label: 'Photography/Videography' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'security', label: 'Security' },
  { id: 'sound_lighting', label: 'Sound & Lighting' },
  { id: 'other', label: 'Other' },
];

const VendorSettingsStep: React.FC<VendorSettingsStepProps> = ({ settings, onSettingsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VendorStallType> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddStallType = () => {
    setEditingId(null);
    setFormData({ id: `stall_${Date.now()}`, name: '', price: 0, maxStalls: 10, description: '' });
    setShowForm(true);
  };

  const handleEditStallType = (stall: VendorStallType) => {
    setEditingId(stall.id);
    setFormData({ ...stall });
    setShowForm(true);
  };

  const handleSaveStallType = () => {
    if (!formData || !formData.name || formData.price === undefined || formData.maxStalls === undefined) return;

    const updated = settings.stallTypes.map((s) =>
      s.id === editingId ? (formData as VendorStallType) : s
    );

    if (editingId === null) {
      updated.push(formData as VendorStallType);
    }

    onSettingsChange({ ...settings, stallTypes: updated });
    setShowForm(false);
    setFormData(null);
  };

  const handleDeleteStallType = (id: string) => {
    onSettingsChange({
      ...settings,
      stallTypes: settings.stallTypes.filter((s) => s.id !== id),
    });
  };

  const toggleRole = (roleId: string) => {
    const updated = settings.allowedRoles.includes(roleId)
      ? settings.allowedRoles.filter((r) => r !== roleId)
      : [...settings.allowedRoles, roleId];
    onSettingsChange({ ...settings, allowedRoles: updated });
  };

  if (!settings.allowVendors) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Enable vendor applications to configure vendor settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vendor Stall Types Section */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Vendor Stall Types</h3>
          <button
            type="button"
            onClick={handleAddStallType}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Stall
          </button>
        </div>

        {/* Stall Types List */}
        <div className="space-y-2">
          {settings.stallTypes.map((stall) => (
            <div
              key={stall.id}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/30"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-neutral-900 dark:text-white">{stall.name}</p>
                <p className="text-xs text-neutral-500">
                  ₦{stall.price.toLocaleString()} · Max {stall.maxStalls} stalls
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  type="button"
                  onClick={() => handleEditStallType(stall)}
                  className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStallType(stall.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {settings.stallTypes.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-4">No stall types yet. Add one to get started.</p>
          )}
        </div>
      </div>

      {/* Add/Edit Stall Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                {editingId ? 'Edit Stall Type' : 'Add New Stall Type'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(null);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded text-neutral-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g., Basic Booth"
              value={formData?.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                  Price (₦)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData?.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                  Max Stalls
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData?.maxStalls || 10}
                  onChange={(e) => setFormData({ ...formData, maxStalls: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <textarea
              placeholder="Description (optional)"
              value={formData?.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData(null);
                  setEditingId(null);
                }}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveStallType}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs"
              >
                {editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Allowed Vendor Roles */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Allowed Vendor Roles</h3>
        <p className="text-xs text-neutral-500">Select which vendor categories can apply</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VENDOR_ROLES.map((role) => (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <input
                type="checkbox"
                checked={settings.allowedRoles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
                className="rounded accent-rose-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{role.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Approval Flow */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Approval Flow</h3>

        <div className="space-y-2">
          {['auto', 'manual', 'vetted'].map((mode) => (
            <label
              key={mode}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
            >
              <input
                type="radio"
                name="approvalMode"
                value={mode}
                checked={settings.approvalMode === mode}
                onChange={(e) => onSettingsChange({ ...settings, approvalMode: e.target.value as any })}
                className="accent-rose-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {mode === 'auto' && 'Auto-approve all vendors'}
                {mode === 'manual' && 'Manual review required'}
                {mode === 'vetted' && 'Vetted vendors only'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Application Deadline */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
        <label className="text-sm font-bold text-neutral-900 dark:text-white block">
          Application Deadline
        </label>
        <p className="text-xs text-neutral-500">Days before event to close vendor registration</p>

        <input
          type="number"
          min={1}
          value={settings.applicationDeadline}
          onChange={(e) => onSettingsChange({ ...settings, applicationDeadline: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
    </div>
  );
};

export default VendorSettingsStep;
