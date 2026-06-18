import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  ArrowRight, 
  CheckCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  QrCode, 
  Users, 
  ShieldCheck, 
  Percent, 
  Store,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Star,
  Award,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCard, { Event } from '../components/EventCard';

const OrganizerPage: React.FC = () => {
  // Estimator State
  const [category, setCategory] = useState('Music');
  const [price, setPrice] = useState(10000);
  const [attendees, setAttendees] = useState(500);
  const [showMathDetails, setShowMathDetails] = useState(false);

  // FAQ State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Estimator Calculations
  const grossEarnings = price * attendees;
  const platformFee = price === 0 ? 0 : Math.round(grossEarnings * 0.035);
  const netEarnings = grossEarnings - platformFee;

  const faqData = [
    {
      q: "How much does it cost to use PartyStorm?",
      a: "It is completely free to create and publish events on PartyStorm. For paid tickets, we charge a simple, transparent flat fee of 3.5% per ticket sold. If your event is free, PartyStorm is 100% free to use."
    },
    {
      q: "When and how do I receive my payouts?",
      a: "Payouts are automatically initiated within 24 hours after the start of your event. They are sent securely via bank transfer to the payout details linked in your Organizer Dashboard."
    },
    {
      q: "Can I sell vendor booths or vendor spaces?",
      a: "Yes! PartyStorm offers a fully integrated vendor management system. You can create customized vendor booth tiers (e.g., Premium, Standard, Corner), set registration fees, review vendor profile submissions, and collect booth fee payments. The best part? PartyStorm charges a 0% commission on vendor payments, meaning you keep 100% of vendor sales!"
    },
    {
      q: "Do I need special hardware to scan tickets?",
      a: "No special hardware required! You can scan tickets directly using your smartphone's camera. Just log into your PartyStorm dashboard on any mobile browser, access your event, and tap the built-in mobile scanner to check in guests instantly."
    },
    {
      q: "Can I set up multiple ticket tiers?",
      a: "Absolutely. You can create VIP, Regular, Early Bird, Group, or customized promotional ticket tiers with specific quantities, pricing, and purchase limits."
    }
  ];

  const mockEvents: Event[] = [
    {
      id: 901,
      title: 'Lagos Street Food Carnival',
      date: '2026-09-10',
      location: 'Kano Golf Club, Club Road, Kano, Nigeria',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
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
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
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
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      ticketsAvailable: 250,
      category: 'Technology',
      rating: 4.8,
      price: 3000,
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      
      {/* ─── Hero & Estimator Section ─── */}
      <section className="relative overflow-hidden py-12 lg:py-24 border-b border-neutral-100 dark:border-neutral-900">
        {/* Simple Background without blobs */}

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Brand Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                PartyStorm Host Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.05]">
                Host your events <br className="hidden md:inline" />
                on <span className="text-rose-500">PartyStorm</span>
              </h1>
              
              <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
                Set your ticket tiers, manage vendors, and scan doors using your smartphone. With just a flat 3.5% fee on paid tickets and direct payouts in 24 hours.
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-md border-t border-neutral-100 dark:border-neutral-900">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">₦0</div>
                  <div className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Setup Fee</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-450">3.5%</div>
                  <div className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Flat Ticket Fee</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">24h</div>
                  <div className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Payout Speed</div>
                </div>
              </div>
            </div>

            {/* Right Estimator Card (Airbnb Style) */}
            <div className="lg:col-span-5">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 shadow-xl rounded-3xl p-6 md:p-8"
              >
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                  Estimate your ticket earnings
                </h3>

                {/* Event Category Select */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500 mb-2">
                    Event Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="Music">🎵 Music & Festivals</option>
                    <option value="Technology">💻 Conferences & Tech</option>
                    <option value="Food">🍔 Food & Drink Carnivals</option>
                    <option value="Arts">🎨 Arts & Exhibitions</option>
                    <option value="Wellness">🧘 Wellness & Sports</option>
                  </select>
                </div>

                {/* Ticket Price Slider */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                      Ticket Price
                    </label>
                    <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                      {price === 0 ? 'Free Event' : `₦${price.toLocaleString()}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1.5">
                    <span>₦0 (Free)</span>
                    <span>₦100,000</span>
                  </div>
                </div>

                {/* Estimated Guests Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                      Estimated Guests
                    </label>
                    <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                      {attendees.toLocaleString()} attendees
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1.5">
                    <span>10 guests</span>
                    <span>5,000 guests</span>
                  </div>
                </div>

                {/* Calculated Result */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-center mb-6">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                    Estimated Net Payout
                  </span>
                  <div className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white mb-1">
                    ₦{netEarnings.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    per event payout
                  </span>

                  {/* Toggle Math Details */}
                  <button 
                    onClick={() => setShowMathDetails(!showMathDetails)}
                    className="flex items-center gap-1 mx-auto mt-4 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-rose-500 transition-colors"
                  >
                    {showMathDetails ? 'Hide details' : 'Show details'}
                    {showMathDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  <AnimatePresence>
                    {showMathDetails && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-rose-100/50 dark:border-rose-900/30 space-y-2 text-left text-xs text-neutral-600 dark:text-neutral-400 overflow-hidden"
                      >
                        <div className="flex justify-between">
                          <span>Gross Ticket Sales:</span>
                          <span className="font-semibold text-neutral-800 dark:text-white">₦{grossEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 dark:text-rose-450">
                          <span>PartyStorm Fee (3.5%):</span>
                          <span>-₦{platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-rose-200/50 dark:border-rose-900/30 font-bold text-neutral-850 dark:text-neutral-200">
                          <span>Net Earnings:</span>
                          <span>₦{netEarnings.toLocaleString()}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA inside Card */}
                <Button className="w-full h-12 rounded-xl text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity active:scale-[0.98]" asChild>
                  <Link to="/events/create">
                    Create Event Page
                  </Link>
                </Button>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Transparent Pricing Section ─── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-3">
              Simple, Transparent Ticketing Fee
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No subscription fees, no platform sign-up costs, and no contract commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Paid Ticket Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-8 rounded-3xl text-center shadow-sm relative">
              <div className="absolute top-4 right-4 text-xs font-bold text-rose-500 uppercase tracking-widest">
                Paid Tiers
              </div>
              <div className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-2">
                3.5%
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-neutral-200 mb-3">Per Paid Ticket sold</h3>
              <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed">
                Charged automatically upon ticket sale. The remaining 96.5% is sent directly to your linked bank account.
              </p>
            </div>

            {/* Free Ticket Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-8 rounded-3xl text-center shadow-sm relative">
              <div className="absolute top-4 right-4 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                Free Tiers
              </div>
              <div className="text-4xl md:text-5xl font-black text-emerald-500 dark:text-emerald-450 mb-2">
                0%
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-neutral-200 mb-3">For Free events</h3>
              <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed">
                If your event has no entry cost, PartyStorm is 100% free. Create RSVPs, capture attendee data, and scan QR codes with no charges.
              </p>
            </div>

            {/* Vendor Fee Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-8 rounded-3xl text-center shadow-sm relative">
              <div className="absolute top-4 right-4 text-xs font-bold text-blue-500 uppercase tracking-widest">
                Vendor Booths
              </div>
              <div className="text-4xl md:text-5xl font-black text-blue-500 dark:text-blue-450 mb-2">
                ₦0
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-neutral-200 mb-3">On Vendor registration</h3>
              <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed">
                Accept applications and payments from vendors who want to set up stalls at your event. You retain 100% of vendor registration fees!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Platform Features Bento Grid ─── */}
      <section className="py-20 border-b border-neutral-100 dark:border-neutral-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block mb-2">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
              Powerful tools to curate, setup, <br />
              and run your experiences
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Vendor Registration - Span 7 */}
            <div className="md:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mb-6">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Vendor Space Application Portal
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                  Rent stall space to external vendors, merchants, or food trucks. Set up booth packages (Premium, VIP, Standard), collect booth payments, and review applications directly in your organizer dashboard.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs font-extrabold text-rose-500 hover:text-rose-600 cursor-pointer">
                Learn vendor features <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* QR Scanner - Span 5 */}
            <div className="md:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mb-6">
                  <QrCode className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Mobile Entry Ticket Scanning
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Scan attendee QR tickets directly through your mobile browser. There is no need to install external apps. Simply open the mobile dashboard check-in screen, point your camera, and swipe guests in.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold text-neutral-450 dark:text-neutral-550">
                Zero scanner hardware setup needed.
              </div>
            </div>

            {/* Ticket Tiers - Span 5 */}
            <div className="md:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mb-6">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Multi-Tier Ticketing
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Configure VIP tables, early-bird passes, standard entries, or bulk promo rates. Specify sales start times, end times, and absolute purchase limits per transaction.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold text-neutral-450 dark:text-neutral-550">
                Supports promo discount codes.
              </div>
            </div>

            {/* Real-time Analytics - Span 7 */}
            <div className="md:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mb-6">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Sales & Check-in Dashboard
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                  Keep tabs on page views, tickets sold, and revenue generated in real-time. Once your event begins, track the real-time ratio of checked-in guests versus total tickets sold.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs font-extrabold text-rose-500 hover:text-rose-600 cursor-pointer">
                View organizer dashboard demo <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── How It Works Stepper ─── */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900/20 border-b border-neutral-100 dark:border-neutral-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-3">
              How to get started
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Launch your ticketing and vendor portal in four quick steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-4xl font-black text-rose-500/20 dark:text-rose-500/10 mb-3">01</div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Create & Customize</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Add event photos, location maps, dates, description text, and set up your organizer profile.
              </p>
            </div>
            {/* Step 2 */}
            <div className="relative">
              <div className="text-4xl font-black text-rose-500/20 dark:text-rose-500/10 mb-3">02</div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Configure Tickets & Booths</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Specify ticket pricing tiers and configure booth packages if you are renting space to vendors.
              </p>
            </div>
            {/* Step 3 */}
            <div className="relative">
              <div className="text-4xl font-black text-rose-500/20 dark:text-rose-500/10 mb-3">03</div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Promote & Sell</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Publish your event page, share the link across socials, and accept secure payments immediately.
              </p>
            </div>
            {/* Step 4 */}
            <div className="relative">
              <div className="text-4xl font-black text-rose-500/20 dark:text-rose-500/10 mb-3">04</div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Scan & Receive Payouts</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Scan attendee QR tickets at check-in. Receive payouts to your bank account within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Collapsible FAQ Accordion ─── */}
      <section className="py-20 border-b border-neutral-100 dark:border-neutral-900">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Everything you need to know about hosting, payouts, and ticketing fees.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden transition-colors bg-white dark:bg-neutral-900"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-5 px-6 flex justify-between items-center text-left focus:outline-none"
                  >
                    <span className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                      {item.q}
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 shrink-0 ml-4">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 px-6 pt-0 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-850/60 pt-4">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Inspiring Events Section (Airbnb Style) ─── */}
      <section className="py-20 border-b border-neutral-100 dark:border-neutral-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block mb-2">
                Showcase
              </span>
              <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                Events hosting on PartyStorm
              </h2>
            </div>
            <Link to="/events" className="text-xs font-extrabold text-rose-500 hover:text-rose-600 flex items-center gap-1">
              Browse all listings <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockEvents.map((event) => (
              <div key={event.id} className="relative">
                <EventCard event={event} showPrice={true} showRating={true} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 md:p-16 text-center shadow-sm">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Ready to launch your experience?
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium max-w-lg mx-auto">
                Join hundreds of creators hosting conferences, concerts, exhibitions, and parties on PartyStorm.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="h-12 px-8 rounded-full text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 transition-all shadow-sm" asChild>
                  <Link to="/events/create">
                    Create Event Now
                  </Link>
                </Button>
                <Button variant="outline" className="h-12 px-8 rounded-full text-sm font-bold active:scale-95 transition-all" asChild>
                  <Link to="/organizer">
                    Organizer Portal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default OrganizerPage;
