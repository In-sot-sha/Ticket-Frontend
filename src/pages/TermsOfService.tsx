import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Eventify! These Terms of Service ("Terms") govern your access to and use of our website, 
                mobile applications, and related services (collectively, the "Service"). By accessing or using our Service, 
                you agree to be bound by these Terms and our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <p className="mb-4">
                You must be at least 18 years old to use our Service. By agreeing to these Terms, you represent and warrant 
                that you are of legal age to form a binding contract with Eventify.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="mb-4">
                To access certain features of the Service, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Event Creation and Management</h2>
              <p className="mb-4">
                As an event organizer, you are responsible for:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Ensuring all event information is accurate and lawful</li>
                <li>Complying with all applicable laws and regulations</li>
                <li>Obtaining necessary permits and licenses</li>
                <li>Managing ticket sales and attendee communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Ticket Purchases</h2>
              <p className="mb-4">
                When purchasing tickets through our Service:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>All sales are final unless otherwise specified</li>
                <li>You are responsible for providing accurate information</li>
                <li>Tickets are non-transferable unless explicitly allowed</li>
                <li>Eventify is not liable for event cancellations or changes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
              <p className="mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit viruses or malicious code</li>
                <li>Interfere with the operation of our Service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by Eventify and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property 
                or proprietary rights laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and access to our Service immediately, without prior notice, 
                for any reason whatsoever, including without limitation if you breach these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
              <p className="mb-4">
                Our Service is provided "as is" and "as available" without warranties of any kind, either express or 
                implied, including, but not limited to, implied warranties of merchantability, fitness for a particular 
                purpose, non-infringement, or course of performance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall Eventify, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your 
                access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will 
                provide notice of any significant changes by updating the "Last updated" date at the top of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium">Eventify Support</p>
                <p>Email: support@eventify.com</p>
                <p>Phone: +234 801 234 5678</p>
                <p className="mt-2">Address: 123 Event Street, Lagos, Nigeria</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;