import React, { useState, useEffect } from 'react';
import { Store, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface VendorApplicationsTabProps {
  eventId: number;
  vendorSettings?: {
    stallTypes: any[];
  };
}

const VendorApplicationsTab: React.FC<VendorApplicationsTabProps> = ({ eventId }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [eventId]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>(`/vendors/applications?eventId=${eventId}`);
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to load vendor applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: number) => {
    setActionLoading(appId);
    try {
      await api.put(`/vendors/applications/${appId}`, { applicationStatus: true });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, applicationStatus: true } : a));
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: number) => {
    setActionLoading(appId);
    try {
      await api.put(`/vendors/applications/${appId}`, { applicationStatus: false });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, applicationStatus: false } : a));
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.applicationStatus === null).length,
    approved: applications.filter(a => a.applicationStatus === true).length,
    rejected: applications.filter(a => a.applicationStatus === false).length,
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">No vendor applications</p>
        <p className="text-xs text-neutral-500">Vendor applications will appear here once vendors submit their requests.</p>
      </div>
    );
  }

  const pending = applications.filter(a => a.applicationStatus === null);
  const approved = applications.filter(a => a.applicationStatus === true);
  const rejected = applications.filter(a => a.applicationStatus === false);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <Store className="h-4 w-4" /> },
          { label: 'Pending', value: stats.pending, icon: <AlertCircle className="h-4 w-4" /> },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle className="h-4 w-4" />, accent: true },
          { label: 'Rejected', value: stats.rejected, icon: <XCircle className="h-4 w-4" /> },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase text-neutral-400">{card.label}</span>
              <span className={card.accent ? 'text-green-500' : 'text-neutral-400'}>{card.icon}</span>
            </div>
            <p className={`text-lg font-extrabold ${card.accent ? 'text-green-500' : 'text-neutral-900 dark:text-white'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            Pending ({pending.length})
          </h3>
          <div className="grid gap-3">
            {pending.map(app => <VendorCard key={app.id} app={app} loading={actionLoading === app.id} onApprove={() => handleApprove(app.id)} onReject={() => handleReject(app.id)} />)}
          </div>
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Approved ({approved.length})
          </h3>
          <div className="grid gap-3">
            {approved.map(app => <VendorCard key={app.id} app={app} />)}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Rejected ({rejected.length})
          </h3>
          <div className="grid gap-3">
            {rejected.map(app => <VendorCard key={app.id} app={app} />)}
          </div>
        </div>
      )}
    </div>
  );
};

const VendorCard: React.FC<{ app: any; loading?: boolean; onApprove?: () => void; onReject?: () => void }> = ({ app, loading, onApprove, onReject }) => {
  const statusColor = 
    app.applicationStatus === null ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
    app.applicationStatus === true ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusText = app.applicationStatus === null ? 'PENDING' : app.applicationStatus === true ? 'APPROVED' : 'REJECTED';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{app.vendor?.businessName || app.user?.firstName} {app.user?.lastName}</h3>
          <p className="text-xs text-neutral-500">Applied {new Date(app.createdAt).toLocaleDateString('en-NG')}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusColor}`}>{statusText}</span>
      </div>

      <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
        {app.vendor?.contactEmail && <p>📧 {app.vendor.contactEmail}</p>}
        {app.vendor?.description && <p className="line-clamp-1">📝 {app.vendor.description}</p>}
        <p>📅 {app.event?.title}</p>
      </div>

      {app.applicationStatus === null && onApprove && onReject && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onReject} disabled={loading} className="flex-1 text-xs text-red-600 border-red-200 h-8 rounded-lg">
            Reject
          </Button>
          <Button size="sm" onClick={onApprove} disabled={loading} className="flex-1 text-xs bg-green-600 h-8 rounded-lg">
            {loading ? '...' : 'Approve'}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default VendorApplicationsTab;
