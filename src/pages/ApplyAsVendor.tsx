import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Building, FileText, Phone, CheckCircle, Mail } from 'lucide-react';

// Mock event data (in a real app, this would come from an API)
const mockEvent = {
  id: 1,
  title: "Tech Conference 2023",
  date: "2023-12-15",
  location: "Lagos, Nigeria",
  allowVendors: true,
  maxVendors: 50,
  vendorDeadline: "2023-12-01",
  stallType: "Tech Products",
  stallFee: 50000,
};

const ApplyAsVendor = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState(`${user?.firstName} ${user?.lastName}` || '');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Set payment amount based on event stall fee
  useEffect(() => {
    if (mockEvent.stallFee) {
      setPaymentAmount(mockEvent.stallFee);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId: parseInt(eventId as string),
          name,
          businessName,
          description,
          contactEmail,
          contactPhone,
          paymentAmount
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/events/${eventId}`);
        }, 2000);
      } else {
        setError(data.message || 'Error submitting vendor application');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your vendor application has been submitted successfully. 
            You'll be notified once it's reviewed.
          </p>
          <Button onClick={() => navigate(`/events/${eventId}`)}>
            Back to Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Apply as Vendor</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">{mockEvent.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <span>📅 {new Date(mockEvent.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <span>📍 {mockEvent.location}</span>
            </div>
            {mockEvent.stallFee && (
              <div className="flex items-center">
                <span>💰 ₦{mockEvent.stallFee.toLocaleString()}</span>
            </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Vendor Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Contact Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Business or brand name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Business Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your business, products, or services"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+234 XXX XXX XXXX"
                  required
                />
              </div>
            </div>

            {mockEvent.stallFee && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Stall Fee</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Payment required for vendor application
                    </p>
                  </div>
                  <div className="text-lg font-bold">
                    ₦{mockEvent.stallFee.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyAsVendor;