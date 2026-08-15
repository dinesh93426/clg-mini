import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="relative flex h-12 w-12">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-12 w-12 bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
};
export default AuthLayout;
