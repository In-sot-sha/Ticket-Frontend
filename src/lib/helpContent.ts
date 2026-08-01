import type { LucideIcon } from 'lucide-react';
import { Users, Ticket, Store, Calendar, CreditCard, User, QrCode } from 'lucide-react';

export type HelpRole = 'user' | 'organizer' | 'vendor';

export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  steps?: string[];
  category: string;
  role: HelpRole;
  popular?: boolean;
  cta?: { label: string; to: string };
};

export type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  role: HelpRole;
  articleIds: string[];
};

export type HelpFaq = {
  id: string;
  question: string;
  answer: string;
  role: HelpRole;
  relatedArticleId?: string;
};

export const HELP_ARTICLES: HelpArticle[] = [
  // —— Guests ——
  {
    id: 'create-account',
    title: 'How to create an account',
    summary: 'Sign up with email or phone in a few steps.',
    category: 'Getting Started',
    role: 'user',
    popular: true,
    body: [
      'You can create a PartyStorm account with your email or a Nigerian phone number.',
      'After registering, complete your profile so tickets and recoveries stay linked to you.',
    ],
    steps: [
      'Go to Register from the site menu',
      'Choose Email or Phone',
      'Enter your details and create a password (or complete OTP if prompted)',
      'Open Profile to add your name and phone',
    ],
    cta: { label: 'Create account', to: '/register' },
  },
  {
    id: 'find-events',
    title: 'Finding events near you',
    summary: 'Browse and search events on the home and events pages.',
    category: 'Finding Events',
    role: 'user',
    popular: true,
    body: [
      'Discover events from the home page or the Events list. Open an event for date, venue, tickets, and vendor options.',
    ],
    steps: [
      'Open Home or Events',
      'Browse featured events or search by name',
      'Open an event to see ticket types and details',
    ],
    cta: { label: 'Browse events', to: '/events' },
  },
  {
    id: 'buy-tickets',
    title: 'Purchasing your first tickets',
    summary: 'Select tickets, enter your details, and pay.',
    category: 'Purchasing Tickets',
    role: 'user',
    popular: true,
    body: [
      'You can buy as a guest or while logged in. Email is required so we can send your confirmation and QR tickets.',
      'After payment succeeds, tickets appear under My Tickets and in your confirmation email.',
    ],
    steps: [
      'Open an event and choose ticket type and quantity',
      'Continue to checkout and enter your name and email (phone optional)',
      'Complete payment',
      'Open My Tickets or your email for the QR code',
    ],
    cta: { label: 'Browse events', to: '/events' },
  },
  {
    id: 'my-tickets',
    title: 'Managing your ticket collection',
    summary: 'View and show digital tickets with QR codes.',
    category: 'Managing Your Tickets',
    role: 'user',
    popular: true,
    body: [
      'Digital tickets live in My Tickets when you are logged in. Each ticket has a QR code for gate scanning.',
      'If you bought as a guest, use Recover Tickets with the same email or phone used at checkout.',
    ],
    steps: [
      'Go to My Tickets (or Recover Tickets if you are not logged in)',
      'Open the event pass you need',
      'Show the QR code at the gate',
    ],
    cta: { label: 'My Tickets', to: '/my-tickets' },
  },
  {
    id: 'recover-tickets',
    title: 'Recover lost tickets',
    summary: 'Look up valid tickets by email or phone.',
    category: 'Managing Your Tickets',
    role: 'user',
    popular: true,
    body: [
      'If you lost access to your account or bought as a guest, recover tickets with the email or phone used when purchasing.',
    ],
    steps: [
      'Open Recover Tickets',
      'Choose Email or Phone',
      'Enter the contact used at checkout',
      'View and save your valid tickets',
    ],
    cta: { label: 'Recover tickets', to: '/recover-ticket' },
  },
  {
    id: 'discount-codes',
    title: 'Using discount codes',
    summary: 'Apply a promo code during checkout when the host offers one.',
    category: 'Purchasing Tickets',
    role: 'user',
    popular: true,
    body: [
      'If an event has a promo code, enter it on the booking/checkout screen before paying. Invalid or expired codes will not apply.',
    ],
    cta: { label: 'Browse events', to: '/events' },
  },
  {
    id: 'refunds',
    title: 'Refunds and cancellations',
    summary: 'Refund rules depend on the event and host.',
    category: 'Payments',
    role: 'user',
    body: [
      'Refund policies for ticket face value are set by each event host. Check the event page for details.',
      'PartyStorm fees shown at checkout are non-refundable.',
      'For payment issues or disputes, contact PartyStorm support with your order email and event name.',
    ],
    cta: { label: 'Contact support', to: '/contact' },
  },
  {
    id: 'ticket-transfer',
    title: 'Ticket transfer (coming soon)',
    summary: 'Transfers are not available yet.',
    category: 'Managing Your Tickets',
    role: 'user',
    body: [
      'Ticket transfer between accounts is coming soon. Until then, the buyer keeps the ticket QR and can show it for the guest at the gate, or contact the host for advice.',
    ],
    cta: { label: 'Contact support', to: '/contact' },
  },
  {
    id: 'update-profile',
    title: 'Updating your profile',
    summary: 'Change name, phone, and photo from Profile or Settings.',
    category: 'Account Management',
    role: 'user',
    body: [
      'Keep your email and phone accurate so ticket recovery and notifications work.',
    ],
    steps: [
      'Open Profile or Settings',
      'Update your name, phone, or photo',
      'Save changes',
    ],
    cta: { label: 'Open profile', to: '/profile' },
  },
  {
    id: 'notifications',
    title: 'Setting up notifications',
    summary: 'Manage how PartyStorm reaches you.',
    category: 'Account Management',
    role: 'user',
    popular: true,
    body: [
      'Notification preferences live in your account settings. Adjust email preferences there when available, or contact support if you need help unsubscribing.',
    ],
    cta: { label: 'Open profile', to: '/profile' },
  },
  {
    id: 'payments-guest',
    title: 'Payment methods accepted',
    summary: 'Pay securely at checkout with supported Nigerian payment options.',
    category: 'Payments',
    role: 'user',
    body: [
      'Checkout uses PartyStorm’s payment partners. You may see a Fee line at checkout — that covers platform service and payment processing. PartyStorm fees are non-refundable.',
      'Complete payment on the secure checkout page; do not send money outside the platform for tickets.',
    ],
  },

  // —— Hosts ——
  {
    id: 'become-organizer',
    title: 'Becoming a host',
    summary: 'Apply to create and manage events on PartyStorm.',
    category: 'Getting Started',
    role: 'organizer',
    popular: true,
    body: [
      'Hosts (organizers) apply with brand details. After approval you can create events, sell tickets, manage vendors, and run gate scanning.',
    ],
    steps: [
      'Sign in to your account',
      'Open Become a Host / organizer application',
      'Submit your organisation details',
      'Wait for review (typically 1–2 business days)',
    ],
    cta: { label: 'Apply as host', to: '/become-organizer' },
  },
  {
    id: 'create-event',
    title: 'Creating your first event',
    summary: 'Publish an event with tickets and details.',
    category: 'Creating Events',
    role: 'organizer',
    popular: true,
    body: [
      'From the organizer dashboard, create an event with title, date, location, image, and ticket types. Publish when ready for sales.',
    ],
    steps: [
      'Open the organizer dashboard',
      'Click Create Event',
      'Fill in details and upload a cover image',
      'Add ticket types and prices',
      'Enable vendor applications if needed',
      'Review and publish',
    ],
    cta: { label: 'Create event', to: '/events/create' },
  },
  {
    id: 'ticket-sales',
    title: 'Setting up ticket sales',
    summary: 'Create ticket types, prices, and limits.',
    category: 'Ticketing',
    role: 'organizer',
    popular: true,
    body: [
      'Each event can have multiple ticket types with different prices and quantities. Monitor sales from your organizer events and analytics views.',
    ],
    cta: { label: 'Organizer events', to: '/organizer/events' },
  },
  {
    id: 'vendor-mgmt',
    title: 'Vendor registration process',
    summary: 'Open booth applications and review vendors.',
    category: 'Vendor Management',
    role: 'organizer',
    popular: true,
    body: [
      'Enable vendor types on your event, set capacity and fees, then review applications in your vendor applications inbox.',
    ],
    cta: { label: 'Vendor applications', to: '/organizer/vendors-applications' },
  },
  {
    id: 'gate-scanning',
    title: 'Smartphone ticket scanning',
    summary: 'Scan QR tickets at the gate from any phone browser.',
    category: 'Gate & PartyStorm ops',
    role: 'organizer',
    popular: true,
    body: [
      'Gate staff can scan with a smartphone browser — no special hardware required. You can also create gate PINs for day staff without full accounts.',
      'For managed PartyStorm gate staffing, contact us for a quote.',
    ],
    steps: [
      'Open Scan from the organizer tools',
      'Or share a gate PIN link with day staff',
      'Scan each guest QR to check them in',
    ],
    cta: { label: 'Open scanner', to: '/organizer/scan' },
  },
  {
    id: 'walk-ins',
    title: 'Walk-in sales',
    summary: 'Sell or register guests at the gate with email required.',
    category: 'Gate & PartyStorm ops',
    role: 'organizer',
    body: [
      'Walk-in flows let you add attendees on event day. An email is required so the guest can still receive ticket details.',
    ],
    cta: { label: 'Host tools', to: '/for-organizers' },
  },
  {
    id: 'payouts',
    title: 'Payment and payout information',
    summary: 'Fees and payouts for ticket sales.',
    category: 'Payments',
    role: 'organizer',
    popular: true,
    body: [
      'PartyStorm takes 6% of each paid ticket or booth (minimum ₦100, maximum ₦2,000 per unit). Free / RSVP is ₦0.',
      'By default, buyers pay a checkout Fee that covers the PartyStorm platform fee plus payment processing. You can absorb fees so buyers only pay the ticket or booth price — then both fees come from your payout.',
      'PartyStorm fees are non-refundable. Configure payout bank details in organizer settings. Finance views show sales and payout-related info.',
    ],
    cta: { label: 'Finance', to: '/organizer/finance' },
  },
  {
    id: 'promote-event',
    title: 'Promoting your event',
    summary: 'Share your public event link and flier assets.',
    category: 'Marketing & Promotion',
    role: 'organizer',
    popular: true,
    body: [
      'Share your event page link on WhatsApp, Instagram, and socials. Use ticket flier tools where available so posts look sharp in stories and chats.',
    ],
    cta: { label: 'Learn about hosting', to: '/for-organizers' },
  },
  {
    id: 'analytics',
    title: 'Analyzing event performance',
    summary: 'Track sales and attendance from your dashboard.',
    category: 'Analytics & Reports',
    role: 'organizer',
    popular: true,
    body: [
      'Use organizer analytics and finance pages to track ticket sales, revenue, and event performance over time.',
    ],
    cta: { label: 'Analytics', to: '/organizer/analytics' },
  },

  // —— Vendors ——
  {
    id: 'vendor-profile',
    title: 'Creating your vendor profile',
    summary: 'Set up business info so hosts can review you.',
    category: 'Getting Started',
    role: 'vendor',
    popular: true,
    body: [
      'Complete your vendor profile with business name, contact email/phone, and description. Hosts see this when you apply to events.',
    ],
    steps: [
      'Open Profile',
      'Fill in vendor / business details',
      'Save your profile',
    ],
    cta: { label: 'Open profile', to: '/profile' },
  },
  {
    id: 'apply-vendor',
    title: 'Applying to your first event',
    summary: 'Submit a booth application on events that accept vendors.',
    category: 'Applying to Events',
    role: 'vendor',
    popular: true,
    body: [
      'Find an event that lists vendor opportunities, choose a vendor category, and submit your application. Track status from your applications list.',
    ],
    cta: { label: 'Browse events', to: '/events' },
  },
  {
    id: 'manage-applications',
    title: 'Managing your applications',
    summary: 'Track pending, approved, and rejected applications.',
    category: 'Managing Applications',
    role: 'vendor',
    popular: true,
    body: [
      'Check application status regularly. If rejected, read feedback and apply to other events that fit your offering.',
    ],
  },
  {
    id: 'vendor-event-day',
    title: 'Preparing for event day',
    summary: 'Coordinate logistics with the host before you arrive.',
    category: 'At the Event',
    role: 'vendor',
    popular: true,
    body: [
      'Confirm booth location, load-in time, and payment terms with the host. Bring any documents the host requested in your approval message.',
    ],
  },
  {
    id: 'vendor-payments',
    title: 'Setting up vendor payments',
    summary: 'Booth fees and payouts are between you and the host.',
    category: 'Account & Payments',
    role: 'vendor',
    popular: true,
    body: [
      'Vendor booth fees and how you get paid are defined by the host’s vendor terms. PartyStorm may collect application/booth fees when configured on the event; otherwise settle directly as agreed.',
    ],
    cta: { label: 'Contact support', to: '/contact' },
  },
  {
    id: 'vendor-best-practices',
    title: 'Best practices for vendors',
    summary: 'Win more bookings with a clear profile and follow-up.',
    category: 'Best Practices',
    role: 'vendor',
    popular: true,
    body: [
      'Keep photos and contact details current, apply early, and reply quickly to host messages. A clear description of what you sell helps approval odds.',
    ],
  },
];

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'user-getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using PartyStorm',
    icon: Users,
    role: 'user',
    articleIds: ['create-account', 'update-profile', 'notifications'],
  },
  {
    id: 'user-finding',
    title: 'Finding Events',
    description: 'Discover and browse events',
    icon: Calendar,
    role: 'user',
    articleIds: ['find-events'],
  },
  {
    id: 'user-buying',
    title: 'Purchasing Tickets',
    description: 'Buy and manage event tickets',
    icon: Ticket,
    role: 'user',
    articleIds: ['buy-tickets', 'discount-codes', 'refunds'],
  },
  {
    id: 'user-managing',
    title: 'Managing Your Tickets',
    description: 'Access and use your tickets',
    icon: Ticket,
    role: 'user',
    articleIds: ['my-tickets', 'recover-tickets', 'ticket-transfer'],
  },
  {
    id: 'user-account',
    title: 'Account Management',
    description: 'Manage your profile and settings',
    icon: User,
    role: 'user',
    articleIds: ['update-profile', 'notifications'],
  },
  {
    id: 'user-payments',
    title: 'Payments',
    description: 'Learn about payment processing',
    icon: CreditCard,
    role: 'user',
    articleIds: ['payments-guest', 'refunds'],
  },
  {
    id: 'org-getting-started',
    title: 'Getting Started',
    description: 'Set up your host account',
    icon: Users,
    role: 'organizer',
    articleIds: ['become-organizer'],
  },
  {
    id: 'org-creating',
    title: 'Creating Events',
    description: 'Set up and manage your events',
    icon: Calendar,
    role: 'organizer',
    articleIds: ['create-event', 'ticket-sales'],
  },
  {
    id: 'org-ticketing',
    title: 'Ticketing',
    description: 'Sell and manage tickets',
    icon: Ticket,
    role: 'organizer',
    articleIds: ['ticket-sales', 'payouts'],
  },
  {
    id: 'org-vendors',
    title: 'Vendor Management',
    description: 'Manage vendor applications',
    icon: Store,
    role: 'organizer',
    articleIds: ['vendor-mgmt'],
  },
  {
    id: 'org-gate',
    title: 'Gate & PartyStorm ops',
    description: 'Scanning, walk-ins, and staffing',
    icon: QrCode,
    role: 'organizer',
    articleIds: ['gate-scanning', 'walk-ins'],
  },
  {
    id: 'org-marketing',
    title: 'Marketing & Promotion',
    description: 'Promote your event',
    icon: Users,
    role: 'organizer',
    articleIds: ['promote-event'],
  },
  {
    id: 'org-analytics',
    title: 'Analytics & Reports',
    description: 'Track your event performance',
    icon: Users,
    role: 'organizer',
    articleIds: ['analytics'],
  },
  {
    id: 'vendor-getting-started',
    title: 'Getting Started',
    description: 'Set up your vendor profile',
    icon: Store,
    role: 'vendor',
    articleIds: ['vendor-profile'],
  },
  {
    id: 'vendor-applying',
    title: 'Applying to Events',
    description: 'Apply to events as a vendor',
    icon: Calendar,
    role: 'vendor',
    articleIds: ['apply-vendor'],
  },
  {
    id: 'vendor-managing',
    title: 'Managing Applications',
    description: 'Track your vendor applications',
    icon: Store,
    role: 'vendor',
    articleIds: ['manage-applications'],
  },
  {
    id: 'vendor-at-event',
    title: 'At the Event',
    description: 'Vendor event day experience',
    icon: Store,
    role: 'vendor',
    articleIds: ['vendor-event-day'],
  },
  {
    id: 'vendor-payments',
    title: 'Account & Payments',
    description: 'Manage your vendor account',
    icon: CreditCard,
    role: 'vendor',
    articleIds: ['vendor-payments'],
  },
  {
    id: 'vendor-best',
    title: 'Best Practices',
    description: 'Vendor success tips',
    icon: Users,
    role: 'vendor',
    articleIds: ['vendor-best-practices'],
  },
];

export const HELP_FAQS: HelpFaq[] = [
  {
    id: 'faq-buy',
    role: 'user',
    question: 'How do I purchase tickets?',
    answer:
      'Open an event, choose ticket type and quantity, enter your details (email required), and complete payment. Your QR tickets appear in My Tickets and your confirmation email.',
    relatedArticleId: 'buy-tickets',
  },
  {
    id: 'faq-transfer',
    role: 'user',
    question: 'Can I transfer my tickets to someone else?',
    answer:
      'Ticket transfer is coming soon. For now, the original buyer can show the QR at the gate for the guest, or contact the host for guidance.',
    relatedArticleId: 'ticket-transfer',
  },
  {
    id: 'faq-refund',
    role: 'user',
    question: 'How do I get a refund for my tickets?',
    answer:
      'Refund policies vary by event. Check the event page or contact the host. For payment problems, reach PartyStorm support with your order email.',
    relatedArticleId: 'refunds',
  },
  {
    id: 'faq-access',
    role: 'user',
    question: 'How do I access my digital tickets?',
    answer:
      'Signed-in users: open My Tickets. Guests or locked-out accounts: use Recover Tickets with the same email or phone used at purchase.',
    relatedArticleId: 'my-tickets',
  },
  {
    id: 'faq-profile',
    role: 'user',
    question: 'How do I update my account information?',
    answer: 'Open Profile or Settings to update your name, phone, and photo. Keep contact details accurate for recovery.',
    relatedArticleId: 'update-profile',
  },
  {
    id: 'faq-recover',
    role: 'user',
    question: 'I lost my tickets — what do I do?',
    answer:
      'Use Recover Tickets with the email or phone from checkout. You will see valid tickets linked to that contact.',
    relatedArticleId: 'recover-tickets',
  },
  {
    id: 'faq-create-event',
    role: 'organizer',
    question: 'How do I create an event?',
    answer:
      'After your host account is approved, open Create Event, add details and ticket types, then publish when ready.',
    relatedArticleId: 'create-event',
  },
  {
    id: 'faq-fees',
    role: 'organizer',
    question: 'What fees does PartyStorm charge?',
    answer:
      'Platform fee is 6% per paid ticket or booth (min ₦100, max ₦2,000). Free events are ₦0. Buyers usually pay a checkout Fee (platform + processing); you can absorb fees so they pay face price only. PartyStorm fees are non-refundable. Contact us for on-site staffing quotes.',
    relatedArticleId: 'payouts',
  },
  {
    id: 'faq-vendors-org',
    role: 'organizer',
    question: 'How do I manage vendor applications?',
    answer:
      'Enable vendor types on the event, then review applications in Vendor applications. Approve or reject from your organizer dashboard.',
    relatedArticleId: 'vendor-mgmt',
  },
  {
    id: 'faq-scan',
    role: 'organizer',
    question: 'How do I check in attendees?',
    answer:
      'Use smartphone QR scanning from Organizer → Scan, or share a gate PIN with day staff. No dedicated scanner hardware required.',
    relatedArticleId: 'gate-scanning',
  },
  {
    id: 'faq-payout',
    role: 'organizer',
    question: 'How do I access my payouts?',
    answer:
      'Add your bank details in organizer settings. Track sales in Finance; payouts follow the schedule for your account.',
    relatedArticleId: 'payouts',
  },
  {
    id: 'faq-promote',
    role: 'organizer',
    question: 'How can I promote my event?',
    answer:
      'Share your public event link on WhatsApp and socials. Use flier/story assets when available so shares look professional.',
    relatedArticleId: 'promote-event',
  },
  {
    id: 'faq-become-vendor',
    role: 'vendor',
    question: 'How do I become a vendor?',
    answer:
      'Complete your vendor business profile, then apply to events that accept vendor applications.',
    relatedArticleId: 'vendor-profile',
  },
  {
    id: 'faq-apply',
    role: 'vendor',
    question: 'How do I apply to events?',
    answer:
      'Open an event with vendor spots, submit an application for the right category, and wait for the host to approve or reject.',
    relatedArticleId: 'apply-vendor',
  },
  {
    id: 'faq-vendor-paid',
    role: 'vendor',
    question: 'How do I get paid as a vendor?',
    answer:
      'Payment terms are usually between you and the host. Follow the agreement in your approval message or vendor terms.',
    relatedArticleId: 'vendor-payments',
  },
  {
    id: 'faq-multi-apply',
    role: 'vendor',
    question: 'Can I apply to multiple events?',
    answer: 'Yes. Submit a separate application for each event you want to work.',
    relatedArticleId: 'manage-applications',
  },
  {
    id: 'faq-vendor-update',
    role: 'vendor',
    question: 'How do I update my vendor profile?',
    answer: 'Open Profile and edit your business contact details, description, and related fields, then save.',
    relatedArticleId: 'vendor-profile',
  },
  {
    id: 'faq-rejected',
    role: 'vendor',
    question: 'What should I do if an application is rejected?',
    answer:
      'Review any feedback from the host, improve your profile if needed, and apply to other events that fit your offer.',
    relatedArticleId: 'manage-applications',
  },
];

export function articlesForRole(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.role === role);
}

export function categoriesForRole(role: HelpRole): HelpCategory[] {
  return HELP_CATEGORIES.filter((c) => c.role === role);
}

export function faqsForRole(role: HelpRole): HelpFaq[] {
  return HELP_FAQS.filter((f) => f.role === role);
}

export function popularArticles(role: HelpRole): HelpArticle[] {
  return articlesForRole(role).filter((a) => a.popular);
}

export function getArticle(id: string | null | undefined): HelpArticle | undefined {
  if (!id) return undefined;
  return HELP_ARTICLES.find((a) => a.id === id);
}

export function searchArticles(role: HelpRole, query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return articlesForRole(role).filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.body.some((p) => p.toLowerCase().includes(q)) ||
      a.steps?.some((s) => s.toLowerCase().includes(q))
  );
}
