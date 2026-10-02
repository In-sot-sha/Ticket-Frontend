import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 pt-safe pb-safe">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;