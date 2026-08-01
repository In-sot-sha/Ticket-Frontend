import { Link } from 'react-router-dom';
import { LEGAL_EMAIL, SUPPORT_ADDRESS, SUPPORT_EMAIL } from '../lib/contact';

const LAST_UPDATED = '1 July 2026';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Please read these Terms carefully. By using PartyStorm you agree to them. If you do not agree, do not use the Service.
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-0">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction and acceptance</h2>
              <p className="mb-4">
                These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and the operator of the PartyStorm
                platform (&ldquo;PartyStorm,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of
                partystorm.ng, related apps, APIs, and services (collectively, the &ldquo;Service&rdquo;).
              </p>
              <p className="mb-4">
                By accessing or using the Service — including browsing events, creating an account, buying or selling
                tickets, applying as a vendor, hosting events, or using gate tools — you accept these Terms and our{' '}
                <Link to="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link>, which is incorporated by reference.
              </p>
              <p className="mb-4">
                If you use the Service on behalf of an organisation, you confirm you have authority to bind that
                organisation, and &ldquo;you&rdquo; includes that organisation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Who we are and our role</h2>
              <p className="mb-4">
                PartyStorm provides an events discovery, ticketing, vendor, and gate-operations platform. We are{' '}
                <strong>not</strong> the creator, organiser, or owner of events listed on the Service, and we are{' '}
                <strong>not</strong> the seller of tickets, registrations, booths, or merchandise — except where we
                expressly state otherwise (for example, optional PartyStorm-operated gate or walk-in services delivered
                under a separate arrangement).
              </p>
              <p className="mb-4">
                When a Host (organiser) lists an event, the contract for the event experience and for tickets or booths
                is between the Host and the Attendee or Vendor. PartyStorm provides technology and, where applicable,
                payment facilitation through third-party processors. We may direct Attendee questions about an event to
                the Host.
              </p>
              <ul className="list-disc pl-8 mb-4 space-y-2">
                <li>
                  <strong>Hosts / Organisers</strong> — create and manage events, ticket types, vendor openings, refunds
                  policies, and (where enabled) gate scanning.
                </li>
                <li>
                  <strong>Attendees / Guests</strong> — browse events and purchase or hold tickets (including as guests).
                </li>
                <li>
                  <strong>Vendors</strong> — apply for booth or service spots at events that accept applications.
                </li>
                <li>
                  <strong>Staff / gate operators</strong> — scan tickets, process walk-ins, or operate under Host or
                  PartyStorm ops coverage as permitted by the Host and our tools.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
              <p className="mb-4">
                The Service is intended for individuals who are at least 18 years old. By using the Service you represent
                that you are 18 or older and have capacity to enter a binding contract under the laws of the Federal
                Republic of Nigeria. Use by anyone under 18 is unauthorised.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Accounts and security</h2>
              <p className="mb-4">You agree to:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Provide true, accurate, current, and complete registration information (name, email and/or phone, and other details we request);</li>
                <li>Keep your credentials confidential and notify us promptly of unauthorised access;</li>
                <li>Accept responsibility for activity under your account, except where caused solely by our proven breach of security obligations;</li>
                <li>Update your details so ticket recovery, payouts, and notices remain reliable.</li>
              </ul>
              <p className="mb-4">
                We may request additional verification, decline registration, suspend access, or terminate accounts at
                our discretion where we reasonably believe these Terms, applicable law, or platform integrity are at risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Host obligations</h2>
              <p className="mb-4">If you create or manage events on PartyStorm, you are solely responsible for:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Accuracy and lawfulness of event content, pricing, capacity, age restrictions, and venue details;</li>
                <li>Obtaining all licences, permits, insurance, and consents required for your event;</li>
                <li>Delivering the event as described, or promptly updating the event page and notifying Attendees of cancellation, postponement, or material change;</li>
                <li>Setting and honouring your refund, exchange, and cancellation policies (and communicating them clearly);</li>
                <li>Primary customer support for your Attendees and Vendors (we may escalate platform issues, but event fulfilment is yours);</li>
                <li>Complying with tax, consumer-protection, advertising, and data-protection duties that apply to you as a Host;</li>
                <li>Gate operations you run yourself, including staff you authorise via gate PINs or accounts; and PartyStorm ops only where you have requested and we have agreed coverage.</li>
              </ul>
              <p className="mb-4">
                You agree not to refer Attendees to PartyStorm for issues that only the Host can resolve (e.g. event quality,
                entry policy, or Host refund decisions), except for genuine platform or payment-processing problems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Tickets, holds, and purchases</h2>
              <p className="mb-4">When you buy or hold tickets through the Service:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>You must provide accurate buyer details. Email (or other contact we require) is needed for confirmation and recovery.</li>
                <li>Inventory may be temporarily held during checkout; unpaid holds expire and may be released to others.</li>
                <li>Purchase limits, promo codes, and ticket types are set by the Host and/or our fraud and fairness controls.</li>
                <li>Sales are generally final except as required by law or as stated in the Host&apos;s refund policy or a written PartyStorm policy for a specific case.</li>
                <li>Attendee-to-attendee ticket transfer may be unavailable; until transfer features ship, the purchaser (or walk-in guest on file) remains the ticket holder of record.</li>
                <li>Walk-in / gate sales require a valid guest email (or other required contact) so the ticket can be linked and recovered.</li>
                <li>Digital tickets and QR codes are for personal use at the named event; resale may be restricted by the Host or by law.</li>
              </ul>
              <p className="mb-4">
                PartyStorm is not liable for Host cancellations, postponements, venue changes, denied entry by venue
                security, or Attendee failure to present a valid ticket.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Fees, payouts, and payments</h2>
              <p className="mb-4">
                Platform and payment-processing fees may apply to ticket and booth orders. The standard PartyStorm
                platform fee is 6% of the paid ticket or booth price (minimum ₦100, maximum ₦2,000 per unit); free or
                RSVP sales have no platform fee. By default, buyers pay a checkout Fee that covers the platform fee plus
                payment processing. Hosts may absorb fees so buyers pay the listed price only. PartyStorm fees are
                non-refundable. Current rates are also shown at checkout and on Host marketing pages and may change with
                notice by updating the Service or these Terms. Fees already charged on completed orders are not
                retrospectively altered except as required by law or our written agreement with you.
              </p>
              <p className="mb-4">
                Payments are processed by third-party providers. You agree to their terms where applicable. We are not a
                bank. Payout timing to Hosts depends on settlement, verification, chargebacks, holds for suspected fraud,
                and the bank details you provide. You are responsible for correct payout information and any taxes on
                amounts you receive.
              </p>
              <p className="mb-4">
                Chargebacks, payment disputes, and refunds may result in reversal of payouts, account holds, or recovery
                of amounts from you as Host.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Vendors</h2>
              <p className="mb-4">
                Vendor applications, booth fees, and on-site terms are primarily between the Vendor and the Host.
                PartyStorm may collect application or booth fees when configured on an event. Approval or rejection is
                the Host&apos;s decision unless we intervene for Terms or legal compliance. PartyStorm is not responsible
                for Vendor sales performance, Host–Vendor commercial disputes, or event-day logistics beyond tools we provide.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Gate scanning and PartyStorm ops</h2>
              <p className="mb-4">
                Smartphone scanning, walk-in tools, and gate PINs are provided to help Hosts and authorised staff check in
                Attendees. Optional PartyStorm-operated staffing or gate coverage (ops) is quoted and agreed separately;
                capabilities depend on coverage we assign, not on a special account type for every event.
              </p>
              <p className="mb-4">
                You must only share gate PINs and scanner access with people you trust. You are responsible for misuse by
                staff you authorise. Invalid, duplicated, or fraudulent tickets may be refused at the gate.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Prohibited uses</h2>
              <p className="mb-4">You must not:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Use the Service for illegal activity, fraud, money laundering, or financing of terrorism;</li>
                <li>Impersonate others, misrepresent affiliation, or submit false information;</li>
                <li>Scrape, harvest, or commercially reuse Site content without our written permission;</li>
                <li>Interfere with or overload our systems, or attempt unauthorised access;</li>
                <li>Post content you do not have rights to, or that is defamatory, discriminatory, or unlawful;</li>
                <li>Circumvent ticket limits, holds, payment flows, or security controls;</li>
                <li>Use Attendee or Vendor data obtained via the Service for spam or purposes unrelated to the event, except as allowed by law and our Privacy Policy.</li>
              </ul>
              <p className="mb-4">
                We may suspend or terminate access, remove content, withhold payouts, and cooperate with law enforcement
                where we reasonably suspect prohibited use. We are not liable for losses arising from your misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Your content and licence</h2>
              <p className="mb-4">
                You retain ownership of content you submit (event descriptions, images, logos, messages). You grant
                PartyStorm a worldwide, non-exclusive, royalty-free licence to host, display, reproduce, and distribute
                that content as needed to operate, promote, and improve the Service (including event listings and social
                previews). You represent you have all rights needed to grant this licence.
              </p>
              <p className="mb-4">
                The Service (software, design, trademarks, and PartyStorm branding) is owned by us or our licensors.
                You may not copy or exploit it except as allowed by these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Third-party services</h2>
              <p className="mb-4">
                The Service may rely on payment processors, hosting, messaging, analytics, and other providers. We do not
                control those services and are not responsible for their availability, errors, or privacy practices beyond
                what we commit in our Privacy Policy regarding processors we engage. Disputes with a third-party provider
                may need to be resolved under that provider&apos;s terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Availability</h2>
              <p className="mb-4">
                We aim for high availability but do not guarantee uninterrupted or error-free Service. Maintenance,
                outages, and third-party failures may occur. We may modify or discontinue features with or without notice.
                Your sole remedy for dissatisfaction with the Service is to stop using it (subject to surviving obligations
                such as fees already due).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Disclaimer of warranties</h2>
              <p className="mb-4 uppercase text-sm tracking-wide">
                The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent
                permitted by Nigerian law, we disclaim all warranties, express or implied, including merchantability,
                fitness for a particular purpose, and non-infringement. We do not warrant that event listings are accurate,
                that Hosts will perform, or that tickets will always be accepted at a venue.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Limitation of liability</h2>
              <p className="mb-4">
                We are not a party to disputes between Hosts, Attendees, and Vendors, and we do not pre-screen all users.
                To the fullest extent permitted by law, PartyStorm and its directors, officers, employees, and agents shall
                not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, or for
                loss of profits, revenue, goodwill, data, or business opportunity, arising from your use of or inability to
                use the Service, event cancellations, Host conduct, payment-provider failures, or unauthorised access to
                your account — even if advised of the possibility of such damages.
              </p>
              <p className="mb-4">
                Where liability cannot be excluded, our aggregate liability to you for claims arising out of the Service
                in any twelve-month period shall not exceed the greater of (a) the fees you paid to PartyStorm (excluding
                ticket face value remitted or payable to Hosts) in that period for the Service giving rise to the claim, or
                (b) ten thousand Naira (₦10,000).
              </p>
              <p className="mb-4">
                Nothing in these Terms excludes liability for death or personal injury caused by our negligence, fraud, or
                any other liability that cannot be limited under applicable law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">16. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify and hold harmless PartyStorm and its directors, officers, employees, and agents from
                and against claims, damages, losses, and expenses (including reasonable legal fees) arising out of: your
                use of the Service; your events, tickets, or vendor offerings; your content; your breach of these Terms or
                law; or disputes between you and Attendees, Vendors, or other third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">17. Termination</h2>
              <p className="mb-4">
                You may stop using the Service and, where available, delete or request deletion of your account. We may
                suspend or terminate access immediately for breach, suspected fraud, legal risk, non-payment, or misuse.
                Provisions that by nature should survive (including ownership, fees owed, indemnities, disclaimers,
                liability limits, and dispute resolution) will survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">18. Changes to these Terms</h2>
              <p className="mb-4">
                We may amend these Terms by posting an updated version and revising the &ldquo;Last updated&rdquo; date.
                Continued use after publication constitutes acceptance of the updated Terms. If you do not agree, stop
                using the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">19. Governing law and disputes</h2>
              <p className="mb-4">
                These Terms are governed by the laws of the Federal Republic of Nigeria. The parties shall first attempt
                in good faith to resolve disputes by mutual consultation within thirty (30) days. If unresolved, disputes
                shall be referred to arbitration under the Arbitration and Mediation Act, 2023 (or successor legislation).
                The seat of arbitration shall be Kano State, Nigeria (or Lagos State if the parties agree in writing),
                proceedings in English, before a sole arbitrator appointed jointly or, failing agreement within fourteen
                (14) days, by the Chairman of the Chartered Institute of Arbitrators (UK) Nigeria Branch. The award shall
                be final and binding. Notwithstanding the foregoing, PartyStorm may seek interim or injunctive relief in
                any court of competent jurisdiction in Nigeria to protect its intellectual property or platform integrity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">20. General</h2>
              <p className="mb-4">
                If any provision is unenforceable, the remainder stays in effect. Our failure to enforce a provision is
                not a waiver. You may not assign these Terms without our consent; we may assign them. These Terms, with
                the Privacy Policy and any Host-specific or ops agreements we enter with you, are the entire agreement
                regarding the Service and supersede prior understandings on the same subject.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">21. Notices and questions</h2>
              <p className="mb-4">
                For questions about these Terms or formal legal notices, email us. For product help, use Help or Contact —
                you do not need a separate phone number on this page.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-base not-prose">
                <p className="font-medium text-gray-900 dark:text-white">PartyStorm</p>
                <p className="text-gray-700 dark:text-gray-200">
                  Legal notices:{' '}
                  <a href={`mailto:${LEGAL_EMAIL}`} className="text-rose-500 hover:underline">
                    {LEGAL_EMAIL}
                  </a>
                </p>
                <p className="text-gray-700 dark:text-gray-200">
                  Support:{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-rose-500 hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                  {' · '}
                  <Link to="/contact" className="text-rose-500 hover:underline">
                    Contact form
                  </Link>
                  {' · '}
                  <Link to="/help" className="text-rose-500 hover:underline">
                    Help Center
                  </Link>
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{SUPPORT_ADDRESS}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              By using the Service, you acknowledge that you have read, understood, and agree to these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
