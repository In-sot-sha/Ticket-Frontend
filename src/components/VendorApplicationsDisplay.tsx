import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Building, 
  CheckCircle, 
  Clock, 
  XCircle,
  Ticket
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface VendorApplication {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  location: string;
  businessName: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentAmount: number;
  createdAt: string;
}

const VendorApplicationsDisplay = () => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // In a real app, this would fetch from an API
  useEffect(() => {
    const fetchVendorApplications = async () => {
      try {
        // Mock data for demonstration
        const mockApplications: VendorApplication[] = [
          {
            id: 1,
            eventId: 101,
            eventTitle: "Tech Conference 2023",
            eventDate: "2023-12-15",
            location: "Lagos, Nigeria",
            businessName: "Tech Gadgets Ltd",
            description: "Selling the latest tech gadgets and accessories",
            status: 'APPROVED',
            paymentStatus: 'PAID',
            paymentAmount: 50000,
            createdAt: "2023-11-20T10:30:00Z"
          },
          {
            id: 2,
            eventId: 102,
            eventTitle: "Food & Wine Expo",
            eventDate: "2024-01-10",
            location: "Abuja, Nigeria",
            businessName: "Local Delicacies",
            description: "Traditional Nigerian foods and snacks",
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            paymentAmount: 30000,
            createdAt: "2023-11-25T14:15:00Z"
          },
          {
            id: 3,
            eventId: 103,
            eventTitle: "Art & Craft Fair",
            eventDate: "2024-02-05",
            location: "Port Harcourt, Nigeria",
            businessName: "Handmade Treasures",
            description: "Beautiful handmade crafts and souvenirs",
            status: 'REJECTED',
            paymentStatus: 'UNPAID',
            paymentAmount: 25000,
            createdAt: "2023-12-01T09:45:00Z"
          }
        ];

        // Simulate API call delay
        setTimeout(() => {
          setApplications(mockApplications);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to load vendor applications');
        setLoading(false);
      }
    };

    fetchVendorApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'UNPAID': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">Vendor Applications</h2>
      
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vendor applications</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven't applied to be a vendor at any events yet.
          </p>
          <Button>Browse Events</Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Business
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Applied On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{application.eventTitle}</div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(application.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{application.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{application.businessName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {application.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentColor(application.paymentStatus)}`}>
                        {application.paymentStatus}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ₦{application.paymentAmount.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {application.status === 'PENDING' && (
                        <Button variant="outline" size="sm">
                          Edit Application
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorApplicationsDisplay;