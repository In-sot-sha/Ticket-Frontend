export type LastScan = {
  at?: string | null;
  scannedBy?: string | null;
};

export function LastScanNote({ lastScan }: { lastScan: LastScan | null }) {
  if (!lastScan?.at && !lastScan?.scannedBy) return null;
  const when = lastScan.at ? new Date(lastScan.at) : null;
  const time =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleString('en-NG', {
          timeZone: 'Africa/Lagos',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  return (
    <div className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">Last scanned</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">
        {time || 'Time not recorded'}
      </p>
      <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
        {lastScan.scannedBy ? `by ${lastScan.scannedBy}` : 'Scanner was not recorded'}
      </p>
    </div>
  );
}
