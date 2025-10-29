import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  Ticket, 
  User,
  TrendingUp
} from 'lucide-react';

const AnalyticsDashboard = () => {
  // Mock analytics data
  const stats = [
    {
      title: "Total Events",
      value: "12",
      change: "+2.5%",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
    },
    {
      title: "Total Tickets Sold",
      value: "1,248",
      change: "+12.3%",
      icon: <Ticket className="h-6 w-6 text-primary" />,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300"
    },
    {
      title: "Total Revenue",
      value: "₦4,245,000",
      change: "+8.2%",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
    },
    {
      title: "Total Attendees",
      value: "987",
      change: "+5.7%",
      icon: <User className="h-6 w-6 text-primary" />,
      color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300"
    }
  ];

  // Mock chart data
  const chartData = [
    { month: "Jan", events: 4, tickets: 240 },
    { month: "Feb", events: 5, tickets: 340 },
    { month: "Mar", events: 3, tickets: 180 },
    { month: "Apr", events: 6, tickets: 420 },
    { month: "May", events: 4, tickets: 280 },
    { month: "Jun", events: 7, tickets: 510 },
  ];

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View insights and analytics for your events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Events and Tickets Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Events & Tickets Trends</h2>
          <div className="h-64 flex items-end space-x-2 justify-center pt-8 border-b">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{data.month}</div>
                <div className="flex items-end">
                  <div 
                    className="w-6 bg-blue-500 rounded-t hover:bg-blue-600" 
                    style={{ height: `${data.events * 20}px` }}
                  ></div>
                  <div 
                    className="w-6 bg-green-500 rounded-t hover:bg-green-600 ml-1" 
                    style={{ height: `${data.tickets / 10}px` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-xs">Events</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-xs">Tickets</span>
            </div>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Events</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <h3 className="font-medium">Tech Conference 2023</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Jan 15, 2024</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">142 Tickets</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">₦420,000</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-start pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                <Ticket className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">John Doe</span> purchased a ticket for 
                  <span className="font-medium"> Tech Conference 2023</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;