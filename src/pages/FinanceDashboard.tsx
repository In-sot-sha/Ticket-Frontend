import React from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const FinanceDashboard = () => {
  // Mock data for financial metrics
  const financialData = {
    totalRevenue: 1600000,
    totalExpenses: 450000,
    netProfit: 1150000,
    pendingPayments: 250000
  };

  // Mock data for recent transactions
  const recentTransactions = [
    {
      id: 1,
      event: 'Tech Conference 2023',
      type: 'income',
      amount: 850000,
      date: '2023-12-15',
      status: 'completed'
    },
    {
      id: 2,
      event: 'Music Festival',
      type: 'income',
      amount: 750000,
      date: '2024-01-20',
      status: 'completed'
    },
    {
      id: 3,
      event: 'Venue Rental',
      type: 'expense',
      amount: 300000,
      date: '2024-01-18',
      status: 'completed'
    },
    {
      id: 4,
      event: 'Vendor Payments',
      type: 'expense',
      amount: 150000,
      date: '2024-01-22',
      status: 'pending'
    }
  ];

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your event finances and revenue
        </p>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</p>
              <p className="text-2xl font-bold">₦{financialData.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 mr-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</p>
              <p className="text-2xl font-bold">₦{financialData.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Profit</p>
              <p className="text-2xl font-bold">₦{financialData.netProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 mr-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Payments</p>
              <p className="text-2xl font-bold">₦{financialData.pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/organizer/events" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">View Events</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage your events</p>
        </Link>
        
        <Link to="/organizer/vendors" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">Manage Vendors</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Handle vendor payments</p>
        </Link>
        
        <Link to="/organizer/analytics" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">Revenue Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Detailed financial analytics</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Button variant="outline">View All</Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{transaction.event}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.date}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;