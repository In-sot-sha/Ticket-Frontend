import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Building, FileText, Phone, CheckCircle, Mail } from 'lucide-react';
import { api } from '../services/api';

const ApplyAsVendor = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState(`${user?.firstName} ${user?.lastName}` || '');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [vendorTypes, setVendorTypes] = useState<{id: number, name: string, fee: number}[]>([]);
  const [selectedVendorType, setSelectedVendorType] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch event details and vendor types
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventResponse = await api.events.getById(Number(eventId));
        const event = eventResponse.data;

        if (event.vendorTypes && event.vendorTypes.length > 0) {
          setVendorTypes(event.vendorTypes);
          // Set the first vendor type as default selection
          if (event.vendorTypes.length > 0) {
            setSelectedVendorType(event.vendorTypes[0].id);
            setPaymentAmount(event.vendorTypes[0].fee);
          }
        } else {
          setError('No vendor types available for this event');
        }
      } catch (err) {
        setError('Failed to load event data. Please try again later.');
        console.error('Error fetching event data:', err);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

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

  // Submit vendor application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, get the user's vendor profiles
      const vendorProfilesResponse = await api.vendors.getAll();
      let vendorId = null;

      if (vendorProfilesResponse.data.length > 0) {
        // If user already has a vendor profile, use the first one
        vendorId = vendorProfilesResponse.data[0].id;
      } else {
        // If user doesn't have a vendor profile, create one
        const newVendorResponse = await api.vendors.create({
          businessName,
          description,
          contactEmail,
          contactPhone
        });
        vendorId = newVendorResponse.data.vendor.id;
      }

      // Submit the vendor application with the selected vendor type
      const response = await api.vendors.register({
        eventId: Number(eventId),
        vendorId,
        vendorTypeId: selectedVendorType,
        paymentAmount
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error submitting vendor application');
    } finally {
      setLoading(false);
    }
  };

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

            {/* Vendor Type Selection */}
            {vendorTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vendorTypes.map((vt) => (
                    <div 
                      key={vt.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedVendorType === vt.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                      onClick={() => {
                        setSelectedVendorType(vt.id);
                        setPaymentAmount(vt.fee);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{vt.name}</span>
                        <span className="text-sm">
                          {vt.fee ? `₦${vt.fee.toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVendorType && paymentAmount && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Application Fee</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Payment required for vendor application
                    </p>
                  </div>
                  <div className="text-lg font-bold">
                    ₦{paymentAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading || !selectedVendorType}
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