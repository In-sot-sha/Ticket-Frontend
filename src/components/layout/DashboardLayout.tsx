import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '../ui/Button';
import { Menu } from 'lucide-react';
import Header from './Header';
const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <Header/>
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden absolute top-4 left-4 z-40">
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default DashboardLayout;