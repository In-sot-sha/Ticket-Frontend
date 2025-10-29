import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const VendorsDashboard = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setVendors(data);
        } else {
          setError(data.message || 'Error fetching vendors');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendors();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isApproved: true })
      });

      const data = await response.json();

      if (response.ok) {
        setVendors(vendors.map(vendor => 
          vendor.id === id ? { ...vendor, isApproved: true } : vendor
        ));
      } else {
        alert(data.message || 'Error approving vendor');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setVendors(vendors.filter(vendor => vendor.id !== id));
      } else {
        const data = await response.json();
        alert(data.message || 'Error rejecting vendor');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center">
        <div className="text-lg">Loading vendors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage event vendors and applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Vendors</p>
              <p className="text-2xl font-bold">{vendors.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mr-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
              <p className="text-2xl font-bold">{vendors.filter(v => v.isApproved).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
              <p className="text-2xl font-bold">{vendors.filter(v => !v.isApproved).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Vendor Applications</h2>
        </div>
        
        {vendors.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No vendor applications to review</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Business
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vendors.map(vendor => (
                <tr key={vendor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.businessName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vendor.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.contactEmail}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.contactPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {vendor.eventName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendor.isApproved 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {vendor.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!vendor.isApproved && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApprove(vendor.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReject(vendor.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VendorsDashboard;