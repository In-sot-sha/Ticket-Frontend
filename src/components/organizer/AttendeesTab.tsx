import React, { useEffect, useState, useMemo } from 'react';
import { Users, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/Button';
import { useIsMobile } from '../../hooks/use-mobile';
import { downloadCSV } from '../../lib/exportCSV';

interface AttendeesTabProps {
  eventId?: number;
}

export const AttendeesTab: React.FC<AttendeesTabProps> = ({ eventId }) => {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.tickets
      .getEventAttendance(eventId)
      .then((res) => setAttendees(res.data || []))
      .catch(() => setError('Failed to load attendees'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const groupedAttendees = useMemo(() => {
    const map = new Map<string, any>();
    attendees.forEach(ticket => {
      const email = ticket.user?.email || ticket.buyerEmail || 'unknown';
      if (!map.has(email)) {
        map.set(email, {
          user: ticket.user,
          email: email,
          name: ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : (ticket.buyerName || 'Guest'),
          phone: ticket.user?.phone || ticket.buyerPhone || '—',
          ticketTypes: new Set<string>(),
          tickets: [],
          checkedInCount: 0,
        });
      }
      const group = map.get(email);
      group.tickets.push(ticket);
      if (ticket.ticketType?.name) {
        group.ticketTypes.add(ticket.ticketType.name);
      }
      if (ticket.status === 'USED') {
        group.checkedInCount++;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [attendees]);

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-8">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  if (groupedAttendees.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/20">
        <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">No attendees yet</p>
        <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
          It looks like no one has registered for this event yet. Share your event link to start gathering attendees!
        </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`);
              alert("Event link copied to clipboard!");
            }}
          >
            Copy Event Link
          </Button>
          <Link to={`/organizer/events/${eventId}/add-attendee`}>
            <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white border-0">
              Add Attendee Manually
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4 sm:px-0">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Attendee Database ({groupedAttendees.length})</h3>
        <Button
          onClick={() => {
            const rows = groupedAttendees.map(a => [
              a.name,
              a.email,
              a.phone,
              Array.from(a.ticketTypes).join(' | '),
              a.tickets.length,
              a.checkedInCount > 0 ? (a.checkedInCount === a.tickets.length ? 'All Checked In' : 'Partially Checked In') : 'Registered'
            ]);
            downloadCSV(['Name', 'Email', 'Phone', 'Ticket Types', 'Tickets Count', 'Status'], rows, `attendees_${eventId || 'event'}.csv`);
          }}
          variant="outline"
          size="sm"
          className="rounded-full text-xs gap-1.5 h-8 border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3 px-4 sm:px-0">
          {groupedAttendees.map((attendee, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">
                    {attendee.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{attendee.email}</p>
                  {attendee.phone !== '—' && (
                    <p className="text-xs text-neutral-500">{attendee.phone}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded shrink-0">
                  {attendee.tickets.length} {attendee.tickets.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 truncate max-w-[150px]">
                  {Array.from(attendee.ticketTypes).join(', ')}
                </span>
                {attendee.checkedInCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                    {attendee.checkedInCount} / {attendee.tickets.length} Checked In
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-neutral-500">Registered</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900/50">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Name</th>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Email</th>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Phone</th>
                <th className="px-4 py-3 text-center font-bold text-neutral-900 dark:text-white">Tickets</th>
                <th className="px-4 py-3 text-left font-bold text-neutral-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {groupedAttendees.map((attendee, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 text-neutral-900 dark:text-white font-medium">
                    {attendee.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                    {attendee.email}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {attendee.phone}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-neutral-900 dark:text-white">
                    <span className="inline-flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 w-6 h-6 rounded-full text-xs">
                      {attendee.tickets.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {attendee.checkedInCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        {attendee.checkedInCount === attendee.tickets.length ? '✓ All Checked In' : `${attendee.checkedInCount} / ${attendee.tickets.length} Checked In`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full">
                        Registered
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
