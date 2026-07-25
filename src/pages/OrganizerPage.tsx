import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Shield,
  Smartphone,
  Banknote,
  ClipboardCheck,
  UserCog,
  ScanLine,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCard, { Event } from '../components/EventCard';
import { useEvents } from '../hooks/queries/useEvents';
import { EventLink } from '../components/EventLink';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';

const PLATFORM_FEE = 0.05;

const OrganizerPage: React.FC = () => {
  const [category, setCategory] = useState('Music');
  const [price, setPrice] = useState(10000);
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

  const grossEarnings = price * attendees;
  const platformFee = price === 0 ? 0 : Math.round(grossEarnings * PLATFORM_FEE);
  const netEarnings = grossEarnings - platformFee;

  const whatWeDo = [
    {
      icon: Ticket,
      title: 'Sell tickets online',
      body: 'Publish a live event page, sell free or paid tiers, and get paid after the event, all from one dashboard.',
    },
    {
      icon: ScanLine,
      title: 'Run the gate',
      body: 'QR scan, guest lookup, walk-in sales, and capacity checks on any phone. No extra hardware.',
    },
    {
      icon: UserCog,
      title: 'Staff with PartyStorm',
      body: 'Need people on the door? Request ops and we assign scanners and cashiers for your org or event.',
    },
    {
      icon: Store,
      title: 'Manage vendors',
      body: 'Sell stall packages, review applications, and keep 100% of vendor fees with zero platform cut.',
    },
  ];

  const ticketOps = [
    'VIP, early-bird, and free tiers with quantity limits',
    'Guest checkout by phone or email with no forced app install',
    'QR passes guests can download or recover later',
    'Live sell-through and revenue in your dashboard',
    'Optional absorb-fee so buyers see a clean ticket price',
  ];

  const gateOps = [
    {
      title: 'You run the gate',
      points: [
        'Scan with your team’s phones',
        'Walk-in register & on-site sales',
        'Live check-in vs capacity',
        'Roles for org members you trust',
      ],
    },
    {
      title: 'PartyStorm staffs it',
      points: [
        'Request ops from your dashboard',
        'Assigned scanners & cashiers',
        'Coverage for your org or project',
        'Same tools, our trained staff',
      ],
    },
  ];

  const faqData = [
    {
      q: 'How much does PartyStorm cost?',
      a: 'Free to create and publish. Paid tickets: 5% platform fee per ticket sold, plus standard payment processing (~1.5% + ₦100). Free events are ₦0. Vendor booth fees: you keep 100%.',
    },
    {
      q: 'When do I get paid?',
      a: 'Payouts start within 24 hours after your event begins, sent by bank transfer to the account in your organizer settings.',
    },
    {
      q: 'Can PartyStorm staff my gate?',
      a: 'Yes. Request PartyStorm ops from your event or org dashboard. We create an ops project, assign staff with scan and walk-in capabilities, and they cover your org or that project.',
    },
    {
      q: 'Do I need special scanners?',
      a: 'No. Use any smartphone browser: open the gate scanner, point at the QR, and check guests in. Works for your staff and PartyStorm-assigned staff.',
    },
    {
      q: 'Can I sell vendor booths?',
      a: 'Yes. Set booth tiers, collect fees, and approve applications. PartyStorm takes 0% commission on vendor payments.',
    },
    {
      q: 'Do walk-in guests need an email?',
      a: 'Yes. Gate walk-in tickets need a guest email so the ticket is linked and recoverable later.',
    },
  ];

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
                For organizers
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-[3.25rem] leading-[1.08] text-balance">
                Tickets, gate, and staffing: one platform for event day
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
                PartyStorm helps you sell tickets, check guests in with QR, sell walk-ins on site, and
                when you need it, bring in PartyStorm staff to run the door. Built for concerts, conferences,
                and nightlife in Nigeria.
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
                  <p className="text-2xl font-black text-rose-500">5%</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Platform fee</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-neutral-900 dark:text-white">24h</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Payout start</p>
                </div>
              </div>
            </div>

            {/* Earnings estimator */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
              >
                <h2 className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">
                  Estimate your payout
                </h2>
                <p className="mb-6 text-xs text-neutral-500">
                  Before payment processing. Category: {category}.
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
                    <option value="Food">Food & drink</option>
                    <option value="Arts">Arts & exhibitions</option>
                    <option value="Wellness">Wellness & sports</option>
                  </select>
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Ticket price
                    </label>
                    <span className="text-sm font-extrabold">
                      {price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-100 accent-rose-500 dark:bg-neutral-800"
                  />
                </div>

                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Guests
                    </label>
                    <span className="text-sm font-extrabold">{attendees.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={5000}
                    step={10}
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-100 accent-rose-500 dark:bg-neutral-800"
                  />
                </div>

                <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
                  <p className="text-xs font-semibold text-neutral-500">Est. after 5% platform fee</p>
                  <p className="mt-1 text-3xl font-extrabold text-neutral-900 dark:text-white">
                    ₦{netEarnings.toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMathDetails((v) => !v)}
                    className="mx-auto mt-3 flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-rose-500 dark:text-neutral-400"
                  >
                    {showMathDetails ? 'Hide' : 'Show'} breakdown
                    {showMathDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {showMathDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-1.5 overflow-hidden border-t border-neutral-200 pt-3 text-left text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                      >
                        <div className="flex justify-between">
                          <span>Gross sales</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            ₦{grossEarnings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-rose-600 dark:text-rose-400">
                          <span>Platform fee (5%)</span>
                          <span>-₦{platformFee.toLocaleString()}</span>
                        </div>
                        <p className="pt-1 text-[10px] text-neutral-400">
                          Payment processing (~1.5% + ₦100) is charged separately by the payment provider.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  className="h-12 w-full rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900"
                  asChild
                >
                  <Link to="/organizer/events/create">Create event page</Link>
                </Button>
              </motion.div>
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
              PartyStorm is an event operations platform, not only a ticket link. Sell online, manage
              entry at the gate, and optionally hand door duty to our staff.
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

      {/* Pricing */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Pricing</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Simple fees. No monthly plan.
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              No signup cost, no lock-in. You pay when tickets sell.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Paid tickets</p>
              <p className="mt-3 text-4xl font-black text-neutral-900 dark:text-white">5%</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">Platform fee</p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Per paid ticket sold. Plus payment processing (~1.5% + ₦100). Free to create the event.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Free / RSVP</p>
              <p className="mt-3 text-4xl font-black text-emerald-600">0%</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">On free events</p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                Collect RSVPs, issue QR passes, and scan at the door with zero PartyStorm fee.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Vendor booths</p>
              <p className="mt-3 text-4xl font-black text-sky-600">₦0</p>
              <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-200">Platform cut</p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                You keep 100% of stall registration fees. Set tiers, review applicants, get paid.
              </p>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-neutral-500">
            <Shield className="mr-1 inline h-3.5 w-3.5 text-rose-400" />
            PartyStorm gate staffing is requested per event or org. Ask from your dashboard or{' '}
            <Link to="/contact" className="font-semibold text-rose-500 hover:underline">
              contact us
            </Link>{' '}
            for a quote.
          </p>
        </div>
      </section>

      {/* Ticket management */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
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
                  <li key={line} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Layers, title: 'Multi-tier pricing', body: 'VIP, regular, early bird, promo caps.' },
                { icon: Smartphone, title: 'Mobile-first checkout', body: 'Buyers finish on phone in minutes.' },
                { icon: TrendingUp, title: 'Live dashboard', body: 'Sales, views, and check-in rates.' },
                { icon: Banknote, title: 'Bank payouts', body: 'Funds after event start (~24h).' },
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

      {/* Gate & staffing */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-16 dark:border-neutral-900 dark:bg-neutral-900/40 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">
              Gate & staffing
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl text-balance">
              Run entry yourself, or let PartyStorm staff the door
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Same tools either way: scan, walk-in sale, and capacity. Choose who holds the phone.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {gateOps.map((col) => (
              <div
                key={col.title}
                className="rounded-3xl border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                    {col.title.startsWith('You') ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <ClipboardCheck className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{col.title}</h3>
                </div>
                <ul className="space-y-3">
                  {col.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
            <QrCode className="h-8 w-8 shrink-0 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Phone camera = scanner</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No dedicated hardware. Organizer staff and PartyStorm ops use the same gate tools.
              </p>
            </div>
            <Button
              className="h-10 shrink-0 rounded-full bg-rose-500 px-5 text-xs font-bold text-white hover:bg-rose-600"
              asChild
            >
              <Link to="/contact">Ask about staffing</Link>
            </Button>
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
                t: 'Set tickets (and booths)',
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
            <p className="mt-2 text-sm text-neutral-500">Fees, payouts, scanning, and staffing.</p>
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
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-neutral-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="border-b border-neutral-100 py-16 dark:border-neutral-900 sm:py-20">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Live on PartyStorm</p>
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
            Start free, sell tickets, scan at the gate, and call in PartyStorm staffing when event day
            needs more hands.
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
              <Link to="/contact">Talk to us about staffing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizerPage;
