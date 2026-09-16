import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Store,
  Ticket,
  UserCog,
  ScanLine,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCard, { Event } from '../components/EventCard';
import { useEvents } from '../hooks/queries/useEvents';
import { EventLink } from '../components/EventLink';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';
import { isEventPast } from '../lib/eventBadges';
import { platformFeeForUnit } from '../lib/fees';

function isLiveEvent(e: Event) {
  return !isEventPast(e.date, e.endDate);
}

const FALLBACK_EVENTS: Event[] = [
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
    date: '2026-10-15',
    location: 'BUK Convocation Arena, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 250,
    category: 'Technology',
    rating: 4.8,
    price: 3000,
  },
];

const OrganizerPage: React.FC = () => {
  const [price, setPrice] = useState(5000);
  const [attendees, setAttendees] = useState(500);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const { data: apiEvents = [], error } = useEvents({ limit: 12, upcoming: 'true' });

  const showcaseEvents = useMemo(() => {
    const source =
      error || apiEvents.length === 0
        ? FALLBACK_EVENTS
        : apiEvents.map(mapApiEventToFrontendEvent);
    return source.filter(isLiveEvent).slice(0, 4);
  }, [apiEvents, error]);

  const feeEach = platformFeeForUnit(price);
  const grossEarnings = price * attendees;
  const platformFeeTotal = feeEach * attendees;
  const netEarnings = grossEarnings - platformFeeTotal;

  const whatYouGet = [
    {
      icon: Ticket,
      title: 'Sell tickets',
      body: 'Free or paid tiers, guest checkout, QR passes, live sell-through.',
    },
    {
      icon: ScanLine,
      title: 'Run the gate',
      body: 'Phone QR scan, walk-ins, guest lookup, and live capacity.',
    },
    {
      icon: Store,
      title: 'Vendors & booths',
      body: 'Sell stall packages, review applicants, collect booth fees.',
    },
    {
      icon: UserCog,
      title: 'Optional on-site staff',
      body: 'Need people on the door? PartyStorm can staff scanning and entry.',
    },
  ];

  const serviceTiers = [
    {
      name: 'Self-Service',
      blurb: 'List, sell, and scan with your own team. Platform ticket fees apply as listed above.',
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
      q: 'When do I get paid?',
      a: 'Payouts typically start within 24 hours after your event begins, sent by bank transfer to the account in your organizer settings.',
    },
    {
      q: 'Do I need special scanners?',
      a: 'No. Any smartphone browser works for QR check-in, whether your staff or PartyStorm ops are on the gate.',
    },
    {
      q: 'Do you publish on-site staffing prices?',
      a: 'No. Managed gate staffing, wristband ops, and enterprise coverage are quoted per event. Contact us with expected attendance and we will send a clear quote.',
    },
    {
      q: 'What about payment processing?',
      a: 'By default, buyers pay a checkout Fee that covers the PartyStorm platform fee plus payment processing. You can absorb fees so buyers pay the ticket price only — then both come out of your payout. PartyStorm fees are non-refundable.',
    },
  ];

  const feeLabel = useMemo(() => {
    if (price === 0) return '₦0';
    return `₦${feeEach.toLocaleString()}`;
  }, [price, feeEach]);

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-900 py-12 sm:py-16 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(244,63,94,0.12),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(244,63,94,0.16),_transparent_45%)]"
        />
        <div className="relative container mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl leading-[1.1] text-balance">
            Sell tickets. Run the gate. Get paid.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
            PartyStorm helps Nigerian organizers publish, sell, and scan. Use the platform yourself,
            or add our team on site. Fees below; staffing is quoted per event.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              className="h-12 rounded-full bg-rose-500 px-8 text-sm font-bold text-white hover:bg-rose-600"
              asChild
            >
              <Link to="/become-organizer">
                Become an organizer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/organizer/events/create"
              className="text-sm font-bold text-neutral-600 underline-offset-4 hover:text-rose-500 hover:underline dark:text-neutral-400"
            >
              Already set up? Create an event
            </Link>
          </div>
          <p className="mt-6 text-xs text-neutral-500">
            Setup ₦0 · Paid tickets 6% (min ₦100 / max ₦2,000) · Free events ₦0
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-neutral-100 py-14 dark:border-neutral-900 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
              How to get started
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              From blank page to gate in four steps.
            </p>
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
                <p className="mb-2 text-3xl font-black text-rose-500/30">{s.n}</p>
                <h3 className="font-bold text-neutral-900 dark:text-white">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-14 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
              Everything from listing to last scan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              One system for sales, the door, vendors, and optional on-site help.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whatYouGet.map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing + estimator */}
      <section className="border-b border-neutral-100 py-14 dark:border-neutral-900 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
              Clear fees for tickets and vendors
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              No signup cost. You pay when paid tickets sell. On-site staffing is separate; see
              below.
            </p>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-12">
            {/* Fee table */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
                      <th className="px-4 py-3 font-bold text-neutral-700 dark:text-neutral-300">
                        Item
                      </th>
                      <th className="px-4 py-3 font-bold text-neutral-700 dark:text-neutral-300">
                        Platform fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Paid tickets
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        6% · min ₦100 · max ₦2,000
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Free / RSVP
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600">₦0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Vendor booths
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        6% · min ₦100 · max ₦2,000
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Create & publish
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        ₦0
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        On-site staffing
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-amber-700 dark:text-amber-400">
                        Contact for quote
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Buyers usually pay a checkout Fee (platform + processing). Absorb fees if you want
                them to pay the ticket price only — then processing comes from your payout.
              </p>
            </div>

            {/* Estimator */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-7">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Estimate your payout
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  When buyers pay the Fee (default). Your cut is the platform fee only — before
                  on-site staffing.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Ticket price
                      </label>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100000}
                      step={500}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full accent-rose-500"
                      aria-label="Ticket price"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
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
                      aria-label="Expected tickets sold"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
                  <p className="text-xs font-semibold text-neutral-500">
                    Est. after platform fee ({feeLabel}/ticket)
                  </p>
                  <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">
                    ₦{netEarnings.toLocaleString()}
                  </p>
                  <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* On-site staffing */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-14 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
              Need people on the door?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Ticket fees are published above. Managed and enterprise on-site support is quoted per
              event. Contact us with expected attendance.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {serviceTiers.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-500">
                    {tier.name}
                  </p>
                  {tier.contactOnly && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      Contact for pricing
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {tier.blurb}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
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

      {/* Live events (not ended) */}
      {showcaseEvents.length > 0 && (
        <section className="border-b border-neutral-100 py-14 dark:border-neutral-900 sm:py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                  Events hosting with us
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Upcoming and live on PartyStorm right now.
                </p>
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
      )}

      {/* FAQ */}
      <section className="border-b border-neutral-100 py-14 dark:border-neutral-900 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Questions organizers ask
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Payouts, scanners, staffing quotes, and processing fees.
            </p>
          </div>
          <div className="space-y-2">
            {faqData.map((item, index) => {
              const open = activeFaq === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden border-b border-neutral-200 dark:border-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                    aria-expanded={open}
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
                    <div className="pb-4">
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

      {/* CTA */}
      <section className="py-14 sm:py-16">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl text-balance">
            Ready for your next event?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Start free, sell tickets and booths, scan at the gate, and contact us when you need
            on-site staffing.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
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
