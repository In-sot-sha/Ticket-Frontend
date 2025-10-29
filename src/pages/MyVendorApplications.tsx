import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { User, Building, FileText, Phone, Mail, MapPin, Calendar, Check, X, PlusCircle } from 'lucide-react';

// Mock vendor applications data
const mockVendorApplications = [
  {
    id: 1,
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
    isApproved: true,
    isPaid: true,
    paymentAmount: 50000,
    createdAt: "2023-11-20T10:30:00Z"
  },
  {
    id: 2,
    eventId: 2,
    event: {
      id: 2,
      title: "Music Festival",
      date: "2024-01-20",
      location: "Abuja, Nigeria"
    },
    name: "John Doe",
    businessName: "Software Solutions",
    description: "Providing custom software development services",
    contactEmail: "info@softwaresolutions.com",
    contactPhone: "+234 802 345 6789",
    isApproved: false,
    isPaid: true,
    paymentAmount: 75000,
    createdAt: "2023-11-22T14:15:00Z"
  }
];

const MyVendorApplications = () => {
  const { user: currentUser } = useAuth();
  const [applications, setApplications] = useState(mockVendorApplications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/user-roles/my-vendor-applications', {
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

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Vendor Applications</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track the status of your vendor applications
          </p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Apply to Event
        </Button>
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
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Applications</p>
              <p className="text-2xl font-bold">{applications.length}</p>
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
              <p className="text-2xl font-bold">{applications.filter(a => a.isApproved).length}</p>
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
              <p className="text-2xl font-bold">{applications.filter(a => !a.isApproved).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Applications</h2>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">You haven't applied to any vendor opportunities yet</p>
            <Button className="mt-4">
              <PlusCircle className="h-4 w-4 mr-2" />
              Apply to an Event
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {applications.map((application) => (
              <div key={application.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-3">
                        <Building className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{application.businessName}</h3>
                        <p className="text-gray-600 dark:text-gray-300">For: {application.event.title}</p>
                        
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
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Event</p>
                      <p className="font-medium">{application.event.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(application.event.date).toLocaleDateString()} • {application.event.location}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVendorApplications;