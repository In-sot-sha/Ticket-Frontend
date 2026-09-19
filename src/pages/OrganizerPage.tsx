import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
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

  const serviceTiers = [
    {
      name: 'Do it yourself',
      blurb: 'You sell tickets and scan them with your own team. You only pay the ticket fee.',
      points: [
        'Sell tickets online',
        'Scan with a phone',
        'Sell tickets at the door',
        'See who has checked in',
      ],
      cta: 'Start as an organizer',
      to: '/become-organizer',
      contactOnly: false,
    },
    {
      name: 'We help at the door',
      blurb: 'Same tools, plus our team on the day. We scan tickets and help people in.',
      points: [
        'People to scan tickets',
        'Cashiers if you need them',
        'Wristbands if you use them',
        'Help on the day of the event',
      ],
      cta: 'Ask for a price',
      to: '/contact',
      contactOnly: true,
    },
    {
      name: 'Big events',
      blurb: 'For concerts, festivals, and conferences. We plan the door with you.',
      points: [
        'A price that fits the event',
        'One person in charge',
        'More than one gate or day',
        'Ready for a large crowd',
      ],
      cta: 'Ask for a price',
      to: '/contact',
      contactOnly: true,
    },
  ];

  const faqData = [
    {
      q: 'When do I get paid?',
      a: 'We usually pay you within a day after your event starts. The money goes to the bank account in your settings.',
    },
    {
      q: 'Do I need a special scanner?',
      a: 'No. Any phone can scan the ticket.',
    },
    {
      q: 'How much does door staff cost?',
      a: 'We do not list one price. Tell us how many people you expect and we will send a quote.',
    },
    {
      q: 'Who pays the fees?',
      a: 'Guests usually pay a small extra at checkout. You can choose to pay it instead, so they pay only the ticket price. Our fee is not refunded.',
    },
  ];

  const feeLabel = useMemo(() => {
    if (price === 0) return '₦0';
    return `₦${feeEach.toLocaleString()}`;
  }, [price, feeEach]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <section className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="max-w-xl text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl text-balance">
              Sell tickets for your event
            </h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
              List your event, sell tickets, and check people in at the door. It costs nothing to start.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="h-11 rounded-full bg-rose-500 px-6 text-sm font-semibold text-white hover:bg-rose-600"
                asChild
              >
                <Link to="/become-organizer">
                  Start as an organizer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link
                to="/organizer/events/create"
                className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:text-rose-600 hover:underline dark:text-neutral-300"
              >
                Already set up? Create an event
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">What you pay</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <li>Creating an event is free.</li>
              <li>Paid tickets: 6% of the price. At least ₦100. At most ₦2,000.</li>
              <li>Free tickets cost nothing.</li>
              <li>Door staff is priced per event. Ask us.</li>
            </ul>
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

      <section className="border-b border-neutral-200 py-12 dark:border-neutral-800 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            What it costs
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            It is free to create an event. We only charge when a paid ticket or booth sells.
          </p>

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
                        Our fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Paid tickets
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        6%. At least ₦100. At most ₦2,000.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Free tickets
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        Nothing
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Vendor booths
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        6%. At least ₦100. At most ₦2,000.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Creating an event
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        5%. At most ₦2,000.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3.5 text-neutral-800 dark:text-neutral-200">
                        Door staff
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 dark:text-white">
                        Ask us for a price
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                Guests usually pay a small extra at checkout. If you want them to pay only the ticket
                price, you can cover that fee yourself.
              </p>
            </div>

            {/* Estimator */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-7">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  See what you keep
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  This is after our fee. It does not include door staff.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
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
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Tickets you expect to sell
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
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    You keep ({feeLabel} fee per ticket)
                  </p>
                  <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">
                    ₦{netEarnings.toLocaleString()}
                  </p>
                  <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Ticket sales</span>
                      <span>₦{grossEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Our fee ({feeLabel} × {attendees.toLocaleString()})
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

      <section className="border-b border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/40 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Need people at the door?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            You can run the event yourself, or ask us to send people. Door staff is priced per event.
          </p>

          <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {serviceTiers.map((tier) => (
              <div
                key={tier.name}
                className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
              >
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{tier.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {tier.blurb}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {tier.points.join(' · ')}
                  </p>
                </div>
                <Button
                  variant={tier.contactOnly ? 'outline' : 'default'}
                  className={
                    tier.contactOnly
                      ? 'h-10 rounded-full px-5 text-sm font-semibold sm:w-auto'
                      : 'h-10 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white hover:bg-rose-600 sm:w-auto'
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
      <section className="border-b border-neutral-200 py-12 dark:border-neutral-800 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Common questions
          </h2>
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
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
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
