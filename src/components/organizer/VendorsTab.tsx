import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Skeleton } from '../ui/skeleton';
import { useUpdateVendorStatus } from '../../hooks/queries/useVendors';
import { downloadCSV } from '../../lib/exportCSV';
import { useIsMobile } from '../../hooks/use-mobile';

interface VendorsTabProps {
  eventId: number;
  event: any;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ eventId, event }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const updateStatusMutation = useUpdateVendorStatus();

  const fetchApplications = () => {
    api
      .get<any[]>(`/vendors/applications?eventId=${eventId}`)
      .then((res) => setApplications(res.data || []))
      .catch((err) => console.error('Failed to load vendor applications:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [eventId]);

  const handleUpdateStatus = (id: number, status: 'APPROVED' | 'REJECTED') => {
    updateStatusMutation.mutate({
      id,
      applicationStatus: status
    }, {
      onSuccess: () => {
        fetchApplications();
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const pending = applications.filter(v => v.applicationStatus === 'PENDING' || !v.applicationStatus);
  const approved = applications.filter(v => v.applicationStatus === 'APPROVED');
  const rejected = applications.filter(v => v.applicationStatus === 'REJECTED');

  const StatCard = ({ label, value, icon, accent }: any) => (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</span>
        <span className={accent ? 'text-green-500' : 'text-neutral-400'}>{icon}</span>
      </div>
      <p className={`text-2xl font-extrabold ${accent ? 'text-green-500' : 'text-neutral-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Vendor Settings Banner */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-5">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Vendor Applications: {event?.allowVendors ? 'Open' : 'Closed'}</h3>
            {event?.vendorDeadline && (
              <p className="text-xs text-neutral-500 mt-1">
                Deadline: {new Date(event.vendorDeadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          {event?.vendorTypes?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.vendorTypes.map((vt: any) => (
                <span key={vt.id} className="text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {vt.name} ({vt.fee === 0 ? 'Free' : `₦${vt.fee.toLocaleString()}`})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={applications.length} icon={<AlertCircle className="h-4 w-4" />} />
        <StatCard label="Pending" value={pending.length} icon={<AlertCircle className="h-4 w-4" />} />
        <StatCard label="Approved" value={approved.length} icon={<CheckCircle className="h-4 w-4" />} accent />
        <StatCard label="Rejected" value={rejected.length} icon={<XCircle className="h-4 w-4" />} />
      </div>

      {applications.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              const rows = applications.map(a => [
                a.businessName || a.vendor?.businessName || 'N/A',
                a.businessEmail || a.vendor?.contactEmail || 'N/A',
                a.businessPhone || a.vendor?.contactPhone || 'N/A',
                a.category || a.vendor?.category || 'N/A',
                a.vendorType?.name || 'N/A',
                a.applicationStatus || 'PENDING',
                new Date(a.appliedAt || a.createdAt).toLocaleDateString('en-NG')
              ]);
              downloadCSV(['Business Name', 'Contact Email', 'Contact Phone', 'Category', 'Stall Type', 'Status', 'Applied At'], rows, `vendors_${eventId}.csv`);
            }}
            className="rounded-full text-xs font-bold gap-1.5 h-8 border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1 flex items-center shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Vendors CSV
          </button>
        </div>
      )}

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
          <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-neutral-900 dark:text-white">No vendor applications yet</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pending ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map((app) => (
                  <VendorApplicationCard 
                    key={app.id} 
                    app={app} 
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updateStatusMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Approved ({approved.length})
              </h3>
              <div className="space-y-3">
                {approved.map((app) => (
                  <VendorApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}

          {rejected.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Rejected ({rejected.length})
              </h3>
              <div className="space-y-3">
                {rejected.map((app) => (
                  <VendorApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900/50">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Business</th>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Contact</th>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Booth Type</th>
                <th className="px-4 py-3 text-center font-bold text-neutral-900 dark:text-white">Status</th>
                <th className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {applications.map((app) => {
                const bName = app.businessName || app.vendor?.businessName || 'N/A';
                const bEmail = app.businessEmail || app.vendor?.contactEmail || 'N/A';
                const bPhone = app.businessPhone || app.vendor?.contactPhone || 'N/A';
                const bCat = app.category || app.vendor?.category || 'N/A';
                const statusColor = 
                  app.applicationStatus === 'PENDING' || !app.applicationStatus ? 'bg-yellow-105 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-450 border border-yellow-200/50' :
                  app.applicationStatus === 'APPROVED' ? 'bg-green-105 text-green-700 dark:bg-green-900/30 dark:text-green-450 border border-green-200/50' :
                  'bg-red-105 text-red-700 dark:bg-red-900/30 dark:text-red-455 border border-red-200/50';

                return (
                  <tr key={app.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors text-xs">
                    <td className="px-4 py-4 align-top">
                      <div className="font-bold text-neutral-900 dark:text-white">{bName}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wider">{bCat}</div>
                      {(app.description || app.vendor?.description) && (
                        <p className="text-[11px] text-neutral-500 mt-1.5 max-w-sm line-clamp-2">
                          {app.description || app.vendor?.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-neutral-700 dark:text-neutral-300 font-medium">{bEmail}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{bPhone}</div>
                    </td>
                    <td className="px-4 py-4 align-top font-bold text-neutral-800 dark:text-neutral-200">
                      {app.vendorType?.name || 'General Stall'}
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                        {app.applicationStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      {app.applicationStatus === 'PENDING' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                          >
                            {updateStatusMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const VendorApplicationCard: React.FC<{ 
  app: any; 
  onUpdateStatus?: (id: number, status: 'APPROVED' | 'REJECTED') => void;
  isUpdating?: boolean;
}> = ({ app, onUpdateStatus, isUpdating }) => {
  const statusColor = 
    app.applicationStatus === 'PENDING' || !app.applicationStatus ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
    app.applicationStatus === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusText =
    app.applicationStatus === 'PENDING' || !app.applicationStatus ? 'PENDING' :
    app.applicationStatus === 'APPROVED' ? 'APPROVED' :
    'REJECTED';

  return (
    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            {app.vendor?.businessName || `${app.user?.firstName} ${app.user?.lastName}`}
          </h3>
          {app.vendorType && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              Stall Type: {app.vendorType.name}
            </span>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-NG')}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded shrink-0 ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
        {app.vendor?.contactEmail && <p>📧 {app.vendor.contactEmail}</p>}
        {app.vendor?.description && <p className="text-neutral-500 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-900 mt-2">{app.vendor.description}</p>}
      </div>

      {statusText === 'PENDING' && onUpdateStatus && (
        <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-850 justify-end">
          <button
            onClick={() => onUpdateStatus(app.id, 'REJECTED')}
            disabled={isUpdating}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={() => onUpdateStatus(app.id, 'APPROVED')}
            disabled={isUpdating}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
          </button>
        </div>
      )}
    </div>
  );
};
