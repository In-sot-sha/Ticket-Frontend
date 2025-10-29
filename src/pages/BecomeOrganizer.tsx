import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Building, FileText, Phone, Mail } from 'lucide-react';

const BecomeOrganizer = () => {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user-roles/become-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ businessName, description, contactInfo })
      });

      const data = await response.json();

      if (response.ok) {
        // Update user context or show success message
        alert('Successfully requested organizer status. Please wait for verification.');
        navigate('/');
      } else {
        setError(data.message || 'Error requesting organizer status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already an organizer
  if (user?.role === 'ORGANIZER') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Already an Organizer</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You are already registered as an organizer.
          </p>
          <Button onClick={() => navigate('/organizer')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Become an Event Organizer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Apply to create and manage events on our platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              Business/Organization Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your business or organization name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your business or organization and the types of events you plan to host"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              Contact Information
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Phone number, email, or other contact method"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will be used for verification purposes
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/organizer')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Request Organizer Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BecomeOrganizer;