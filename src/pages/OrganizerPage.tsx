import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCard, { Event } from '../components/EventCard';
import { useEvents } from '../hooks/queries/useEvents';
import { EventLink } from '../components/EventLink';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';
import { isEventPast } from '../lib/eventBadges';
import { buyerPaysForTicket, platformFeeForUnit } from '../lib/fees';

/** Lagos nightlife — Ben Iwara / Unsplash */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1767661667474-4f2a197c9a51?auto=format&fit=crop&w=2000&q=80';

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
  /** When true, guests pay the fee at checkout; you keep the full ticket price. */
  const [passFeeToBuyer, setPassFeeToBuyer] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

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
  const youKeep = passFeeToBuyer ? grossEarnings : netEarnings;
  const guestPaysEach = buyerPaysForTicket(price, !passFeeToBuyer);

  const whatYouGet = [
    {
      title: 'Sell tickets',
      body: 'Free or paid. Guests pay on the site and get a ticket on their phone.',
    },
    {
      title: 'Check people in',
      body: 'Scan tickets with any phone. You can also sell tickets at the door.',
    },
    {
      title: 'Add vendors',
      body: 'Sell booths, look at applications, and collect the booth fee.',
    },
    {
      title: 'Get help at the door',
      body: 'Need extra hands? We can send people to scan tickets on the day.',
    },
  ];

  const steps = [
    {
      title: 'Create your event',
      body: 'Add the date, the place, and a photo. Publish when you are ready.',
    },
    {
      title: 'Add tickets',
      body: 'Set the price. Free tickets are fine. You can also add booths.',
    },
    {
      title: 'Share the link',
      body: 'People pay online and get a ticket on their phone.',
    },
    {
      title: 'Check people in',
      body: 'Scan tickets at the door. We pay you after the event starts.',
    },
  ];

  const faqData = [
    {
      q: 'When do I get paid?',
      a: 'Payouts are T+1 — usually within one business day after your event starts. Money goes to the Nigerian bank account in your settings.',
    },
    {
      q: 'What is the fee?',
      a: 'One checkout fee: 7.5% + ₦100 on each paid ticket or booth. Free tickets are ₦0. No separate Paystack line for your guests.',
    },
    {
      q: 'Do you provide wristbands and door staff?',
      a: 'Yes. We can supply wristbands and send scanners, cashiers, or gate managers for event day. Tell us your crowd size and we will quote.',
    },
    {
      q: 'Do I need a special scanner?',
      a: 'No. Any phone can scan tickets. You can run the gate yourself or ask us to staff it.',
    },
  ];

  const feeLabel = useMemo(() => {
    if (price === 0) return '₦0';
    return `₦${feeEach.toLocaleString()}`;
  }, [price, feeEach]);

  const heroEase = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <section className="relative isolate min-h-[22rem] overflow-hidden text-white sm:min-h-[26rem]">
        <motion.div
          aria-hidden
          className="absolute inset-0"
          initial={reduceMotion ? false : { scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.1, ease: heroEase }}
        >
          <img
            src={HERO_IMAGE}
            alt="Nightlife crowd in Lagos, Nigeria"
            className="h-full w-full object-cover object-[center_30%]"
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-neutral-950/40"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.22),_transparent_55%)]"
        />

        <div className="relative mx-auto flex min-h-[22rem] max-w-5xl flex-col justify-center px-4 py-12 sm:min-h-[26rem] sm:px-6 sm:py-14">
          <motion.h1
            className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance"
            style={{ letterSpacing: '-0.03em' }}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: heroEase }}
          >
            Sell tickets for your event
          </motion.h1>
          <motion.p
            className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08, ease: heroEase }}
          >
            List your event, sell tickets, and check people in at the door. Free to start.
          </motion.p>
          <motion.div
            className="mt-6 flex w-full max-w-md flex-col gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.14, ease: heroEase }}
          >
            <Button
              className="h-11 w-full rounded-full bg-rose-500 px-6 text-sm font-semibold text-white hover:bg-rose-600 sm:w-auto sm:self-start"
              asChild
            >
              <Link to="/become-organizer">
                Start as an organizer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/organizer/events/create"
              className="text-sm font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-left"
            >
              Already have an account? Create an event
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Transparent pricing — immediately after hero */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
              Transparent pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
              What your tickets cost
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
              Creating an event is free. Paid tickets and booths use one fee:{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">7.5% + ₦100</span>.
              Free tickets stay ₦0. Nothing hidden at checkout.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                Guests see one Fee line — card processing is included.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                You choose who pays: guest or host.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                Payouts land T+1 after your event starts.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-7">
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Ticket price
                  </p>
                  <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">
                    {price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
                  <span className="text-sm font-semibold text-neutral-400">₦</span>
                  <span className="text-base font-semibold tabular-nums text-neutral-900 dark:text-white">
                    {price === 0 ? '0.00' : price.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={500}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="fee-range mt-3"
                  aria-label="Ticket price"
                />
              </div>

              <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Tickets you expect to sell
                  </p>
                  <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">
                    {attendees.toLocaleString()}
                  </p>
                </div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={attendees}
                  onChange={(e) => setAttendees(Number(e.target.value))}
                  className="fee-range"
                  aria-label="Expected tickets sold"
                />
              </div>

              <fieldset className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                <legend className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Who bears the fee?
                </legend>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="feeBearer"
                      checked={passFeeToBuyer}
                      onChange={() => setPassFeeToBuyer(true)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    Guest pays
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="feeBearer"
                      checked={!passFeeToBuyer}
                      onChange={() => setPassFeeToBuyer(false)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    You pay
                  </label>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  Fee is always <span className="font-semibold text-neutral-700 dark:text-neutral-300">7.5% + ₦100</span>
                  {price > 0 ? ` · ${feeLabel} on this ticket` : ''}.
                </p>
              </fieldset>

              <div className="rounded-xl bg-neutral-50 px-4 py-3.5 dark:bg-neutral-900">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">You keep</p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                      ₦{youKeep.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-right text-xs text-neutral-500 sm:text-sm">
                    {price > 0 ? (
                      <>
                        Guest pays ₦{guestPaysEach.toLocaleString()} each
                        <br />
                        {passFeeToBuyer
                          ? `Fee on guest · ${feeLabel}`
                          : `Fee from your payout · −₦${platformFeeTotal.toLocaleString()}`}
                      </>
                    ) : (
                      'Free tickets — no fee'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payouts T+1 */}
      <section className="border-b border-neutral-200 py-10 dark:border-neutral-800 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Payouts · T+1
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            After your event starts, sales usually hit your bank within one business day. Add your
            account once in settings — that is where every payout goes.
          </p>
        </div>
      </section>

      {/* Wristbands & event staff */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-10 dark:border-neutral-800 dark:bg-neutral-900/40 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Wristbands & door staff
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            Need bands for VIP or re-entry, or people to scan and sell at the gate? We can supply
            both. Quote is per event — tell us your crowd size.
          </p>
          <div className="mt-5">
            <Button
              className="h-10 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white hover:bg-rose-600"
              asChild
            >
              <Link to="/contact">Get a quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 py-12 dark:border-neutral-800 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            How it works
          </h2>
          <ol className="mt-6 grid gap-5 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/40 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            What you can do
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {whatYouGet.map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live events (not ended) */}
      {showcaseEvents.length > 0 && (
        <section className="border-b border-neutral-200 py-12 dark:border-neutral-800 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Events on PartyStorm
                </h2>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                  See what other people are hosting.
                </p>
              </div>
              <Link
                to="/events"
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4">
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
      <section className="border-b border-neutral-200 py-14 dark:border-neutral-800 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Common questions
          </h2>
          <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {faqData.map((item, index) => {
              const open = activeFaq === index;
              return (
                <div key={item.q} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
                    aria-expanded={open}
                  >
                    <span className="text-base font-bold text-neutral-900 dark:text-white sm:text-lg">
                      {item.q}
                    </span>
                    {open ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-neutral-400 sm:h-6 sm:w-6" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 sm:h-6 sm:w-6" />
                    )}
                  </button>
                  {open && (
                    <div className="pb-5 sm:pb-6">
                      <p className="max-w-3xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
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
      <section className="py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl text-balance">
            Ready to host?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Create your event for free. Ask us if you need people at the door.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              className="h-11 rounded-full bg-rose-500 px-6 text-sm font-semibold text-white hover:bg-rose-600"
              asChild
            >
              <Link to="/become-organizer">Start as an organizer</Link>
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-neutral-300 px-6 text-sm font-semibold dark:border-neutral-600"
              asChild
            >
              <Link to="/contact">Ask about door staff</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizerPage;
