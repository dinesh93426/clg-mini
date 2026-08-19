import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, BrainCircuit, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalRole, setPortalRole] = useState('student'); // student | organizer | admin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(email.trim(), password.trim(), portalRole);
      navigate(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setPortalRole(role);
    setLoading(true);
    setError('');
    const credentials = {
      student: { email: 'alex.johnson@university.edu', password: 'Test@12345' },
      organizer: { email: 'sarah.organizer@university.edu', password: 'Test@12345' },
      admin: { email: 'dean.vance@university.edu', password: 'Test@12345' }
    };
    const { email: testEmail, password: testPassword } = credentials[role];
    setEmail(testEmail);
    setPassword(testPassword);
    try {
      const data = await login(testEmail, testPassword, role);
      navigate(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Sign in failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand logo & header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#FF5A1F] text-white shadow-xs mb-3">
          <BrainCircuit size={22} />
        </div>
        <h2 className="text-2xl font-bold text-[#172033] tracking-tight">
          Sign in to EventIntel <span className="text-[#FF5A1F]">AI</span>
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          AI-Powered Campus Intelligence Platform
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Portal Selection Tabs */}
        <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] mb-6">
          {[
            { id: 'student', label: 'Student' },
            { id: 'organizer', label: 'Organizer' },
            { id: 'admin', label: 'Admin' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPortalRole(tab.id)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer
                ${portalRole === tab.id 
                  ? 'bg-[#FFFFFF] text-[#FF5A1F] shadow-xs' 
                  : 'text-[#64748B] hover:text-[#172033]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[#172033] mb-1.5">
              University Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Mail size={15} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="alex.johnson@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#172033] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Lock size={15} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#172033] cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#FF5A1F] focus:ring-[#FF5A1F]"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <a href="#" className="font-medium text-[#FF5A1F] hover:text-[#E94712]">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E94712] hover:shadow-[0_8px_20px_rgba(255,90,31,0.20)] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] disabled:opacity-50 transition-all shadow-xs cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Development Quick Access */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
          <span className="block text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">
            Sandbox Test Credentials
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              disabled={loading}
              className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold bg-[#F8FAFC] text-[#FF5A1F] border border-[#E2E8F0] hover:bg-[#FFF1EB] hover:border-[#FFD2C2] transition-colors cursor-pointer"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('organizer')}
              disabled={loading}
              className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold bg-[#F8FAFC] text-[#FF5A1F] border border-[#E2E8F0] hover:bg-[#FFF1EB] hover:border-[#FFD2C2] transition-colors cursor-pointer"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold bg-[#F8FAFC] text-[#FF5A1F] border border-[#E2E8F0] hover:bg-[#FFF1EB] hover:border-[#FFD2C2] transition-colors cursor-pointer"
            >
              Dean (Admin)
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[#64748B]">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-[#FF5A1F] hover:text-[#E94712]">
          Register profile
        </Link>
      </p>
    </div>
  );
};
export default Login;
