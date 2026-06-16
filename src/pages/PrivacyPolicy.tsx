import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                PartyStorm ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, and share information about you when you use our website, 
                mobile applications, and related services (collectively, the "Service").
              </p>
              <p className="mb-4">
                This Privacy Policy applies to information we collect when you use our Service or otherwise interact with us, 
                as well as information we obtain from third parties and partners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">Information You Provide Directly</h3>
              <p className="mb-4">
                We collect information you provide directly to us when you:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Create an account or update your profile</li>
                <li>Purchase tickets or register for events</li>
                <li>Contact customer support</li>
                <li>Participate in surveys or promotions</li>
                <li>Communicate with other users through our Service</li>
              </ul>
              <p className="mb-4">
                This information may include your name, email address, phone number, payment information, 
                profile picture, and any other information you choose to provide.
              </p>

              <h3 className="text-xl font-medium mb-3">Information Collected Automatically</h3>
              <p className="mb-4">
                When you access or use our Service, we automatically collect information including:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Usage Information:</strong> Pages visited, time spent on pages, features used</li>
                <li><strong>Location Information:</strong> Approximate location based on IP address</li>
                <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies, web beacons, and similar technologies</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Information from Third Parties</h3>
              <p className="mb-4">
                We may receive information about you from third parties, such as:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Social media platforms when you connect your account</li>
                <li>Payment processors for transaction information</li>
                <li>Marketing partners with whom we collaborate</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send transactional communications</li>
                <li>Personalize your experience and recommend relevant events</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Analyze usage patterns and improve our Service</li>
                <li>Detect, prevent, and address technical issues or fraudulent activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
              <p className="mb-4">
                We may share your information with:
              </p>
              
              <h3 className="text-xl font-medium mb-3">Event Organizers</h3>
              <p className="mb-4">
                When you register for an event or purchase tickets, we share relevant information with the event organizer, 
                including your name, email address, and ticket details.
              </p>

              <h3 className="text-xl font-medium mb-3">Service Providers</h3>
              <p className="mb-4">
                We work with third-party service providers who help us operate our Service, including:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Payment processors for transaction processing</li>
                <li>Cloud hosting providers for data storage</li>
                <li>Email service providers for communications</li>
                <li>Analytics services for usage tracking</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Legal Requirements</h3>
              <p className="mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public 
                authorities (e.g., a court or government agency).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
                Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>The right to access and receive a copy of your personal data</li>
                <li>The right to correct inaccurate personal data</li>
                <li>The right to delete your personal data</li>
                <li>The right to restrict or object to processing</li>
                <li>The right to data portability</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="mb-4">
                Our Service is not directed to children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected personal information 
                from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and maintained on computers located outside of your state, 
                province, country, or other governmental jurisdiction where the data protection laws may differ from 
                those of your jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium">PartyStorm Privacy Team</p>
                <p>Email: privacy@partystorm.com</p>
                <p>Phone: +234 801 234 5678</p>
                <p className="mt-2">Address: 123 Event Street, Lagos, Nigeria</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              By using our Service, you acknowledge that you have read, understood, and agree to this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;