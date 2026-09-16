
import { Link } from 'react-router-dom';
import { PRIVACY_EMAIL, SUPPORT_ADDRESS, SUPPORT_EMAIL } from '../lib/contact';

const LAST_UPDATED = '1 July 2026';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Last updated: {LAST_UPDATED}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            This Policy explains how PartyStorm collects, uses, shares, and protects personal data when you use our
            Service. It should be read with our{' '}
            <Link to="/terms" className="text-rose-500 hover:underline">
              Terms of Service
            </Link>
            .
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Who we are</h2>
              <p className="mb-4">
                PartyStorm (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the PartyStorm events and
                ticketing platform at partystorm.ng and related apps and services (the &ldquo;Service&rdquo;). For privacy
                questions and data-subject requests under the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data
                Protection Regulation 2019 (NDPR) where still applicable, and related rules, contact us using the details
                in Section 12.
              </p>
              <p className="mb-4">
                Depending on the activity, we may act as a <strong>data controller</strong> (for example, account data and
                platform logs) or as a <strong>processor / service provider</strong> for Hosts (for example, Attendee lists
                used to run an event). Hosts who receive Attendee or Vendor data through PartyStorm must handle that data
                lawfully and only for legitimate event-related purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information we collect</h2>

              <h3 className="text-xl font-medium mb-3">2.1 Information you provide</h3>
              <p className="mb-4">We collect information you provide when you:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Create an account or update a profile (name, email, phone, photo, organisation details);</li>
                <li>Purchase tickets, hold inventory, or recover tickets (buyer contact and order details);</li>
                <li>Provide a guest email or phone for walk-in / gate sales;</li>
                <li>Apply as a Host or Vendor (business name, contacts, descriptions, documents you upload);</li>
                <li>Contact support or submit reports;</li>
                <li>Use Host tools (events, finance settings, gate PINs, staff assignments);</li>
                <li>Request or perform PartyStorm gate ops (organisers and assigned staff).</li>
              </ul>
              <p className="mb-4">
                Payment card details are typically collected and processed by our payment providers; we receive
                confirmation tokens, status, and limited billing metadata rather than full card numbers where the
                provider supports that model.
              </p>

              <h3 className="text-xl font-medium mb-3">2.2 Information collected automatically</h3>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>
                  <strong>Device and log data:</strong> IP address, browser type, device identifiers, pages viewed,
                  referring URLs, and timestamps;
                </li>
                <li>
                  <strong>Usage data:</strong> features used, search queries, checkout steps, scan events, and error logs;
                </li>
                <li>
                  <strong>Approximate location:</strong> derived from IP or information you choose to share;
                </li>
                <li>
                  <strong>Cookies and similar technologies:</strong> used for session, security, preferences, and
                  analytics. You can control cookies via your browser; some features may not work if cookies are blocked.
                </li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Information from third parties</h3>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Payment processors (transaction status, fraud signals);</li>
                <li>Identity or auth providers if you sign in with them;</li>
                <li>Hosts or staff entering walk-in guest details;</li>
                <li>Public or partner sources where lawful for fraud prevention or marketing attribution.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How we use your information</h2>
              <p className="mb-4">We use personal data to:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Provide, operate, secure, and improve the Service;</li>
                <li>Process orders, holds, payouts, refunds, and chargebacks;</li>
                <li>Deliver tickets, QR codes, and transactional messages (email/SMS/WhatsApp where you provided a number);</li>
                <li>Enable Hosts and authorised staff to check in Attendees and manage vendors;</li>
                <li>Personalise discovery and recommendations;</li>
                <li>Send service notices and, where permitted, marketing (you may opt out of marketing);</li>
                <li>Detect and prevent fraud, abuse, and security incidents;</li>
                <li>Comply with law, enforce our Terms, and respond to lawful requests;</li>
                <li>Analyse aggregated usage to improve products.</li>
              </ul>
              <p className="mb-4">
                Legal bases under Nigerian data-protection law may include performance of a contract, legitimate
                interests (platform security and improvement, balanced against your rights), consent (where required),
                and legal obligation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. How we share information</h2>

              <h3 className="text-xl font-medium mb-3">4.1 Event Hosts</h3>
              <p className="mb-4">
                When you buy tickets or register, we share relevant Attendee information with the Host (typically name,
                contact details, ticket type, and check-in status) so they can run the event and fulfil their contract
                with you. Walk-in guests&apos; contact details are shared for the same purpose.
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 Vendors and Hosts (applications)</h3>
              <p className="mb-4">
                Vendor application details are shared with the Host reviewing the application. Hosts must not misuse
                Vendor data.
              </p>

              <h3 className="text-xl font-medium mb-3">4.3 PartyStorm staff and gate ops</h3>
              <p className="mb-4">
                If a Host requests PartyStorm ops or we cover an organisation, assigned staff may access only the event
                and ticket data needed to scan, check in, or sell walk-in tickets for covered events.
              </p>

              <h3 className="text-xl font-medium mb-3">4.4 Service providers</h3>
              <p className="mb-4">We use processors such as:</p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Payment processors;</li>
                <li>Cloud hosting and databases;</li>
                <li>Email, SMS, or messaging providers;</li>
                <li>Analytics and error-monitoring tools;</li>
                <li>Customer-support tooling.</li>
              </ul>
              <p className="mb-4">
                These providers may process data only on our instructions and under appropriate contractual safeguards,
                except where they act as independent controllers (e.g. some payment institutions under their own rules).
              </p>

              <h3 className="text-xl font-medium mb-3">4.5 Legal and safety</h3>
              <p className="mb-4">
                We may disclose data if required by law, court order, or regulator, or to protect rights, safety, and
                integrity of users and the Service (including fraud investigations).
              </p>

              <h3 className="text-xl font-medium mb-3">4.6 Business transfers</h3>
              <p className="mb-4">
                If we are involved in a merger, acquisition, financing, or sale of assets, personal data may be
                transferred as part of that transaction under continued confidentiality commitments where required.
              </p>

              <p className="mb-4">
                We do not sell your personal data as a product. Hosts must not sell Attendee lists obtained via PartyStorm
                for unrelated marketing without a lawful basis and, where required, consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. International transfers</h2>
              <p className="mb-4">
                Our infrastructure or processors may store or process data outside Nigeria. Where we transfer personal
                data internationally, we take steps consistent with applicable Nigerian data-protection requirements
                (for example contractual clauses and choosing reputable providers).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Retention</h2>
              <p className="mb-4">
                We retain personal data only as long as needed for the purposes in this Policy, including providing the
                Service, resolving disputes, preventing fraud, and meeting legal, tax, and accounting requirements.
                Ticket and transaction records are often kept longer than marketing preferences. When retention ends, we
                delete or anonymise data where practicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
              <p className="mb-4">
                We implement technical and organisational measures appropriate to the risk (access controls, encryption
                in transit where applicable, monitoring). No method of transmission or storage is completely secure; you
                also help by protecting your passwords and devices. Notify us promptly of suspected account compromise.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Your rights</h2>
              <p className="mb-4">
                Subject to Nigerian data-protection law and applicable exceptions, you may have the right to:
              </p>
              <ul className="list-disc pl-8 mb-4 space-y-1">
                <li>Access and receive a copy of your personal data;</li>
                <li>Correct inaccurate data;</li>
                <li>Request deletion or restriction of processing;</li>
                <li>Object to certain processing (including direct marketing);</li>
                <li>Withdraw consent where processing is consent-based (without affecting prior lawful processing);</li>
                <li>Data portability where applicable.</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, email{' '}
                <a href={`mailto:${PRIVACY_EMAIL}`} className="text-rose-500 hover:underline">
                  {PRIVACY_EMAIL}
                </a>{' '}
                or use our{' '}
                <Link to="/contact" className="text-rose-500 hover:underline">
                  Contact
                </Link>{' '}
                form. We may need to verify your identity. You may also lodge a complaint with the relevant Nigerian data
                protection authority.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Children</h2>
              <p className="mb-4">
                The Service is directed at users 18 years and older. We do not knowingly collect personal data from
                children under 18 as account holders. If you believe we have collected such data, contact us and we will
                take appropriate steps to delete it. Hosts remain responsible for age policies at their events.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Hosts&apos; responsibilities</h2>
              <p className="mb-4">
                If you are a Host, you must comply with applicable privacy laws regarding Attendee and Vendor information
                you receive through PartyStorm. Use that information only to communicate about and operate your event
                (and related legal obligations), keep it secure, and honour opt-outs and deletion requests that apply to
                you. Do not upload unlawful or excessive personal data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to this Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will post the revised Policy on this page and
                update the &ldquo;Last updated&rdquo; date. Material changes may also be notified by email or in-product
                notice where appropriate. Continued use after the effective date constitutes acceptance where permitted
                by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                For privacy requests and questions about this Policy, email us. General product support can use Help or
                Contact — a phone number is not required on this page.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-base not-prose">
                <p className="font-medium text-gray-900 dark:text-white">PartyStorm — Privacy</p>
                <p className="text-gray-700 dark:text-gray-200">
                  Privacy requests:{' '}
                  <a href={`mailto:${PRIVACY_EMAIL}`} className="text-rose-500 hover:underline">
                    {PRIVACY_EMAIL}
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
              By using the Service, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
