import { useLocation } from 'react-router-dom';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { whatsappHref } from '../lib/contact';

const HIDDEN_PREFIXES = ['/admin', '/organizer', '/staff', '/scan-gate', '/change-password'];

/** Pages with a full-width sticky mobile CTA above the tab bar (Get Ticket / Continue). */
function hasStickyMobileCta(pathname: string): boolean {
  if (pathname.startsWith('/book/') || pathname.startsWith('/booking/')) return true;
  // Public event detail: /events/:slug (not /events list)
  if (/^\/events\/[^/]+\/?$/.test(pathname)) return true;
  return false;
}

/**
 * Floating WhatsApp button — opens a chat with PartyStorm support.
 * Sits clear of the tab bar and sticky Get Ticket / checkout bars on mobile.
 */
const WhatsAppFloat = () => {
  const { pathname } = useLocation();
  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hidden) return null;

  const liftForCta = hasStickyMobileCta(pathname);
  // Tab bar (~3.5rem) + safe area, then either clear the sticky CTA (~5.25rem) or a small gap.
  const mobileBottom = liftForCta
    ? 'bottom-[calc(3.5rem+max(env(safe-area-inset-bottom),12px)+5.25rem)]'
    : 'bottom-[calc(3.5rem+max(env(safe-area-inset-bottom),12px)+0.75rem)]';

  return (
    <a
      href={whatsappHref('Hi PartyStorm, I need help with…')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Support on WhatsApp"
      className={`fixed left-4 z-[45] ${mobileBottom} md:left-auto md:right-6 md:bottom-6 inline-flex h-11 md:h-12 items-center gap-2 rounded-full bg-[#25D366] px-3.5 md:px-4 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95`}
    >
      <WhatsAppIcon className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
      <span className="text-sm font-bold tracking-tight">Support</span>
    </a>
  );
};

export default WhatsAppFloat;
