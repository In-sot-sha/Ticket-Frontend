import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  QrCode,
  Store,
  Layers,
  Sparkles,
  TrendingUp,
  Ticket,
  Users,
  Smartphone,
  Banknote,
  ClipboardCheck,
  UserCog,
  ScanLine,
  CheckCircle2,
  PhoneCall,
  Watch,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCard, { Event } from '../components/EventCard';
import { useEvents } from '../hooks/queries/useEvents';
import { EventLink } from '../components/EventLink';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';

/** Platform fee per paid ticket: 6%, min ₦80, max ₦600 */
function platformFeePerTicket(ticketPrice: number): number {
  if (ticketPrice <= 0) return 0;
  return Math.min(600, Math.max(80, Math.round(ticketPrice * 0.06)));
}

const OrganizerPage: React.FC = () => {
  const [category, setCategory] = useState('Music');
  const [price, setPrice] = useState(5000);
  const [attendees, setAttendees] = useState(500);
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const { data: apiEvents = [], error } = useEvents({ limit: 10 });

  const mockEvents: Event[] = [
    {
      id: 901,
      title: 'Lagos Street Food Carnival',
      date: '2026-09-10',
      location: 'Kano Golf Club, Club Road, Kano, Nigeria',
      image:
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      ticketsAvailable: 150,
      category: 'Food',
      rating: 4.8,
      price: 5000,
    },
    {
      id: 902,
      title: 'Afrobeats Live Showcase',
      date: '2026-08-20',
      location: 'Sani Abacha Stadium, Kofar Mata, Kano, Nigeria',
      image:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      ticketsAvailable: 500,
      category: 'Music',
      rating: 4.9,
      price: 10000,
    },
    {
      id: 903,
      title: 'Kano Innovation Summit',
      date: '2026-07-15',
      location: 'BUK Convocation Arena, Kano, Nigeria',
      image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      ticketsAvailable: 250,
      category: 'Technology',
      rating: 4.8,
      price: 3000,
    },
  ];

  const showcaseEvents =
    error || apiEvents.length === 0
      ? mockEvents
      : apiEvents.slice(0, 4).map(mapApiEventToFrontendEvent);

  const feeEach = platformFeePerTicket(price);
  const grossEarnings = price * attendees;
  const platformFeeTotal = feeEach * attendees;
  const netEarnings = grossEarnings - platformFeeTotal;

  const whatWeDo = [
    {
      icon: Ticket,
      title: 'Sell tickets online',
      body: 'Publish a live event page, sell free or paid tiers, and get paid after the event from one dashboard.',
    },
    {
      icon: ScanLine,
      title: 'Gate & access control',
      body: 'QR scanning, guest lookup, walk-in sales, wristband flow, and live capacity on any phone.',
    },
    {
      icon: UserCog,
      title: 'On-site access team',
      body: 'Need people on the door? We can staff entrance, scanning, wristbands, and crowd entry for you.',
    },
    {
      icon: Store,
      title: 'Vendors & booths',
      body: 'Sell stall packages, review applications, and collect booth fees. Same platform fee as paid tickets.',
    },
  ];

  const accessServices = [
    'Staff at entrance',
    'QR code scanning',
    'Wristband issuance',
    'Crowd entry management',
    'Real-time attendance monitoring',
    'On-site technical support',
  ];

  const ticketOps = [
    'VIP, early-bird, and free tiers with quantity limits',
    'Guest checkout by phone or email with no forced app install',
    'QR passes guests can download or recover later',
    'Live sell-through and revenue in your dashboard',
  ];

  const serviceTiers = [
    {
      name: 'Self-Service',
      blurb: 'List, sell, and scan with your own team. Platform ticket fees apply as listed below.',
      points: [
        'Online ticket sales & QR passes',
        'Phone-based gate scanner',
        'Walk-in sales & guest recovery',
        'Live attendance dashboard',
      ],
      cta: 'Become an organizer',
      to: '/become-organizer',
      contactOnly: false,
    },
    {
      name: 'Managed Event',
      blurb: 'Same platform plus PartyStorm on-site for entry, scanning, and crowd flow.',
      points: [
        'Trained scanners & cashiers',
        'Wristband issuance support',
        'Real-time attendance monitoring',
        'Technical support on event day',
      ],
      cta: 'Contact for quote',
      to: '/contact',
      contactOnly: true,
    },
    {
      name: 'Enterprise',
      blurb: 'Concerts, festivals, and large conferences with a dedicated access plan.',
      points: [
        'Custom commercial terms',
        'Dedicated ops lead',
        'Multi-gate / multi-day coverage',
        'Volume-ready workflows',
      ],
      cta: 'Contact for quote',
      to: '/contact',
      contactOnly: true,
    },
  ];

  const faqData = [
    {
      q: 'How much does PartyStorm cost for tickets?',
      a: 'Paid tickets: 6% of ticket price per sale, with a minimum of ₦80 and a maximum of ₦600 per ticket. Free / RSVP events: ₦0 platform fee. Payment processing (~1.5% + ₦100) is charged separately by the payment provider.',
    },
    {
      q: 'What about vendor booths?',
      a: 'Same platform fee as paid tickets: 6% of the booth fee, minimum ₦80 and maximum ₦600 per booth payment. Plus payment processing. Free booths are ₦0.',
    },
    {
      q: 'Do you publish on-site staffing prices?',
      a: 'No. Managed gate staffing, wristband ops, and enterprise coverage are quoted per event. Contact us with expected attendance and we will send a clear quote.',
    },
    {
      q: 'What is on-site access management?',
      a: 'Our team can run the door: scanning, wristbands, entry flow, and live attendance. Charged separately from online ticket fees.',
    },
    {
      q: 'When do I get paid?',
      a: 'Payouts typically start within 24 hours after your event begins, sent by bank transfer to the account in your organizer settings.',
    },
    {
      q: 'Do I need special scanners?',
      a: 'No. Any smartphone browser works for QR check-in, whether your staff or PartyStorm ops are on the gate.',
    },
  ];

  const feeLabel = useMemo(() => {
    if (price === 0) return '₦0';
    return `₦${feeEach.toLocaleString()}`;
  }, [price, feeEach]);

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-900 py-10 sm:py-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(244,63,94,0.12),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(244,63,94,0.16),_transparent_45%)]"
        />
        <div className="relative container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Sparkles className="h-3.5 w-3.5" />
                Event access management
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-[3.25rem] leading-[1.08] text-balance">
                Tickets to gate: end-to-end access for Nigerian events
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
                Sell tickets, run the gate with QR, manage vendors, and optionally bring in PartyStorm
                staff for event day. Clear platform fees for tickets. On-site services quoted on request.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="h-12 rounded-full bg-rose-500 px-7 text-sm font-bold text-white hover:bg-rose-600"
                  asChild
                >
                  <Link to="/become-organizer">
                    Become an organizer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-neutral-300 px-7 text-sm font-bold dark:border-neutral-600"
                  asChild
                >
                  <Link to="/organizer/events/create">Create an event</Link>
                </Button>
              </div>
              <div className="grid max-w-md grid-cols-3 gap-4 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                <div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-white">₦0</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Setup fee</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-rose-500">6%</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Per ticket*</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-white">6%</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Vendor booths*</p>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">
                *6% of ticket or booth price, min ₦80 / max ₦600 each. Plus payment processing.
              </p>
            </div>

            {/* Earnings estimator */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
                <h2 className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">
                  Estimate your payout
                </h2>
                <p className="mb-6 text-xs text-neutral-500">
                  Platform fee only (before payment processing). Category: {category}.
                </p>

                <div className="mb-5">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Event type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <option value="Music">Music & festivals</option>
                    <option value="Technology">Conferences & tech</option>
                    <option value="Food">Food & nightlife</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Ticket price
                    </label>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50000}
                    step={500}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Expected tickets sold
                    </label>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {attendees.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={5000}
                    step={50}
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
                  <p className="text-xs font-semibold text-neutral-500">
                    Est. after platform fee ({feeLabel}/ticket)
                  </p>
                  <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">
                    ₦{netEarnings.toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMathDetails((v) => !v)}
                    className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-500"
                  >
                    {showMathDetails ? 'Hide' : 'Show'} breakdown
                    {showMathDetails ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {showMathDetails && (
                    <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Gross sales</span>
                        <span>₦{grossEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Platform fee ({feeLabel} × {attendees.toLocaleString()})
                        </span>
                        <span>-₦{platformFeeTotal.toLocaleString()}</span>
                      </div>
                      <p className="pt-1 text-[10px] leading-relaxed text-neutral-400">
                        Payment processing (~1.5% + ₦100) is charged separately by the payment
                        provider. On-site staffing is not included.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">What we do</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl text-balance">
              Everything from listing to last scan
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              PartyStorm is your access partner: sell online, control the door, manage vendors, and
              add on-site help when the crowd needs it.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whatWeDo.map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticket / platform pricing (published) */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Platform pricing</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Clear fees for tickets and vendors
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              No signup cost. You pay when paid tickets sell. On-site staffing is separate — contact us.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900 md:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Paid tickets</p>
              <p className="mt-3 text-4xl font-black text-neutral-900 dark:text-white">6%</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Per ticket · min ₦80 · max ₦600
              </p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Plus payment processing (~1.5% + ₦100). Free to create and publish the event.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Free / RSVP</p>
              <p className="mt-3 text-4xl font-black text-emerald-600">₦0</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">Platform fee</p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Collect RSVPs, issue QR passes, and scan at the door with zero PartyStorm fee.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Vendor booths</p>
              <p className="mt-3 text-4xl font-black text-sky-600">6%</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Per booth · min ₦80 · max ₦600
              </p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Same rate as tickets. Set booth tiers, review applicants, and get paid. Free booths: ₦0.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support levels — on-site contact only */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Support levels</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Self-serve or PartyStorm on site
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Ticket platform fees are published above. Managed and enterprise on-site support is
              quoted per event — contact us, we do not list those rates here.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {serviceTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
                  {tier.name}
                </p>
                {tier.contactOnly && (
                  <p className="mt-2 inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    Contact for pricing
                  </p>
                )}
                <p className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">{tier.blurb}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.contactOnly ? 'outline' : 'default'}
                  className={
                    tier.contactOnly
                      ? 'mt-6 h-10 w-full rounded-full text-xs font-bold'
                      : 'mt-6 h-10 w-full rounded-full bg-rose-500 text-xs font-bold text-white hover:bg-rose-600'
                  }
                  asChild
                >
                  <Link to={tier.to}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* On-site services — no prices */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                On-site ticketing service
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
                We can run the door so you can run the show
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Charged separately from online ticket fees. Scope depends on expected attendance.
                Wristbands can be organizer-supplied or provided at cost. Ask us for a quote.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {accessServices.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  className="h-11 rounded-full bg-rose-500 px-6 text-xs font-bold text-white hover:bg-rose-600"
                  asChild
                >
                  <Link to="/contact">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Discuss on-site support
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ClipboardCheck,
                  title: 'You run the gate',
                  body: 'Scan with your team’s phones. Same tools, your staff.',
                },
                {
                  icon: Users,
                  title: 'PartyStorm staffs it',
                  body: 'Assigned scanners and cashiers. Contact for a quote.',
                },
                {
                  icon: Watch,
                  title: 'Wristbands',
                  body: 'Bring yours, or ask us to supply Tyvek / fabric at cost.',
                },
                {
                  icon: QrCode,
                  title: 'Phone = scanner',
                  body: 'No dedicated hardware. Browser-based check-in.',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
                >
                  <card.icon className="mb-3 h-5 w-5 text-rose-500" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{card.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ticket management */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                Ticket management
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
                Sell, track, and control every pass
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Build the ticket menu your event needs, share one link, and watch sales update live
                before anyone reaches the gate.
              </p>
              <ul className="mt-8 space-y-3">
                {ticketOps.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Layers, title: 'Multi-tier tickets', body: 'VIP, regular, early bird, promo caps.' },
                { icon: Smartphone, title: 'Mobile-first checkout', body: 'Buyers finish on phone in minutes.' },
                { icon: TrendingUp, title: 'Live dashboard', body: 'Sales, views, and check-in rates.' },
                { icon: Banknote, title: 'Bank payouts', body: 'Funds after event start (~24h).' },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <card.icon className="mb-3 h-5 w-5 text-rose-500" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{card.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              How to get started
            </h2>
            <p className="mt-2 text-sm text-neutral-500">From blank page to gate in four steps.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                t: 'Create your org & event',
                d: 'Photos, venue, dates, description. Publish when ready.',
              },
              {
                n: '02',
                t: 'Set tickets & booths',
                d: 'Tiers, prices, limits. Optional vendor packages.',
              },
              {
                n: '03',
                t: 'Share & sell',
                d: 'Promote the event link. Guests pay and get QR passes.',
              },
              {
                n: '04',
                t: 'Scan & get paid',
                d: 'Check in with your team or PartyStorm staff. Payouts follow.',
              },
            ].map((s) => (
              <div key={s.n}>
                <p className="mb-2 text-3xl font-black text-rose-500/25">{s.n}</p>
                <h3 className="font-bold text-neutral-900 dark:text-white">{s.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Questions organizers ask
            </h2>
            <p className="mt-2 text-sm text-neutral-500">Fees, vendors, payouts, and staffing.</p>
          </div>
          <div className="space-y-3">
            {faqData.map((item, index) => {
              const open = activeFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
                      {item.q}
                    </span>
                    {open ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" />
                    )}
                  </button>
                  {open && (
                    <div className="border-t border-neutral-100 px-5 pb-4 pt-3 dark:border-neutral-800">
                      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live events */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">
                Live on PartyStorm
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                Events hosting with us
              </h2>
            </div>
            <Link
              to="/events"
              className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-rose-500 hover:text-rose-600"
            >
              Browse all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {showcaseEvents.map((event: Event) => (
              <EventLink key={event.id} eventId={event.id}>
                <EventCard event={event} showPrice showRating />
              </EventLink>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl text-balance">
            Ready to run your next event on PartyStorm?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
            Start free, sell tickets and booths, scan at the gate, and contact us when you need
            on-site staffing.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-full bg-rose-500 px-8 text-sm font-bold text-white hover:bg-rose-600"
              asChild
            >
              <Link to="/become-organizer">Become an organizer</Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border-neutral-300 px-8 text-sm font-bold dark:border-neutral-600"
              asChild
            >
              <Link to="/contact">Contact for on-site services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizerPage;
