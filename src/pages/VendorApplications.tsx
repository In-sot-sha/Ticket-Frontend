import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Building, FileText, Phone, Mail, MapPin, Calendar, Check, X } from 'lucide-react';

// Mock vendor applications data
const mockVendorApplications = [
  {
    id: 1,
    userId: 101,
    user: {
      id: 101,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com"
    },
    eventId: 1,
    event: {
      id: 1,
      title: "Tech Conference 2023",
      date: "2023-12-15",
      location: "Lagos, Nigeria"
    },
    name: "John Doe",
    businessName: "Tech Gadgets Ltd",
    description: "Selling the latest tech gadgets and accessories",
    contactEmail: "contact@techgadgets.com",
    contactPhone: "+234 801 234 5678",
    isApproved: false,
    isPaid: true,
    paymentAmount: 50000,
    createdAt: "2023-11-20T10:30:00Z"
  },
  {
    id: 2,
    userId: 102,
    user: {
      id: 102,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com"
    },
    eventId: 1,
    event: {
      id: 1,
      title: "Tech Conference 2023",
      date: "2023-12-15",
      location: "Lagos, Nigeria"
    },
    name: "Jane Smith",
    businessName: "Software Solutions",
    description: "Providing custom software development services",
    contactEmail: "info@softwaresolutions.com",
    contactPhone: "+234 802 345 6789",
    isApproved: false,
    isPaid: true,
    paymentAmount: 50000,
    createdAt: "2023-11-22T14:15:00Z"
  },
  {
    id: 3,
    userId: 103,
    user: {
      id: 103,
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike@example.com"
    },
    eventId: 1,
    event: {
      id: 1,
      title: "Tech Conference 2023",
      date: "2023-12-15",
      location: "Lagos, Nigeria"
    },
    name: "Mike Johnson",
    businessName: "Cyber Security Pro",
    description: "Offering cybersecurity consultation and tools",
    contactEmail: "hello@cybersecuritypro.com",
    contactPhone: "+234 803 456 7890",
    isApproved: true,
    isPaid: true,
    paymentAmount: 50000,
    createdAt: "2023-11-25T09:45:00Z"
  }
];

const VendorApplications = () => {
  const { user: currentUser } = useAuth();
  const [applications, setApplications] = useState(mockVendorApplications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/user-roles/vendor-applications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setApplications(data);
        } else {
          setError(data.message || 'Error fetching applications');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    };
    fetchApplications();
  }, []);

  const handleApprove = async (id: number) => {
    setLoading(true);
    setError('');

    try {
      // In a real app, this would make an API call
      setApplications(applications.map(app => 
        app.id === id ? { ...app, isApproved: true } : app
      ));
    } catch (err) {
      setError('Error approving vendor application');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setLoading(true);
    setError('');

    try {
      // In a real app, this would make an API call
      setApplications(applications.filter(app => app.id !== id));
    } catch (err) {
      setError('Error rejecting vendor application');
    } finally {
      setLoading(false);
    }
  };

  // Filter to show only applications for events organized by the current user
  const filteredApplications = applications.filter(app => 
    app.eventId === 1 // In a real app, this would match events organized by current user
  );

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Applications</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Review and manage vendor applications for your events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mr-4">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Applications</p>
              <p className="text-2xl font-bold">{filteredApplications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 mr-4">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
              <p className="text-2xl font-bold">{filteredApplications.filter(a => a.isApproved).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 mr-4">
              <X className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
              <p className="text-2xl font-bold">{filteredApplications.filter(a => !a.isApproved).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Vendor Applications</h2>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No vendor applications to review</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredApplications.map((application) => (
              <div key={application.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-3">
                        <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{application.businessName}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{application.name}</p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{application.description}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{application.contactEmail}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{application.contactPhone}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Event</p>
                      <p className="font-medium">{application.event.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(application.event.date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.isApproved
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {application.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Fee</p>
                      <p className="font-medium">₦{application.paymentAmount?.toLocaleString()}</p>
                      <p className={`text-xs ${
                        application.isPaid 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {application.isPaid ? 'Paid' : 'Pending Payment'}
                      </p>
                    </div>
                  </div>
                  
                  {!application.isApproved && (
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(application.id)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(application.id)}
                        disabled={loading}
                        className="border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorApplications;