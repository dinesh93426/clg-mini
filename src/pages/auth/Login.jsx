import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const data = await login(email, password);
      navigate(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setError('');
    const emails = {
      student: 'student@university.edu',
      organizer: 'sarah.organizer@university.edu',
      admin: 'dean.vance@university.edu'
    };
    try {
      const data = await login(emails[role], 'password123');
      navigate(`/${data.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError('Simulated sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      {/* Brand logo */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/30">
          <Sparkles size={24} className="text-white animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-center font-display text-3xl font-extrabold text-white tracking-tight">
        Sign in to EventIntel <span className="text-indigo-400">AI</span>
      </h2>
      <p className="mt-2 text-center text-sm text-slate-400">
        Or{' '}
        <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
          create an intelligent profile
        </Link>
      </p>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                University Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="alex.johnson@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Development Quick Access */}
          <div className="mt-8 pt-6 border-t border-slate-900">
            <span className="block text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Sandbox Test Credentials
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                disabled={loading}
                className="py-2 px-1 text-center rounded-lg text-[10px] font-bold bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/30 transition-all cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('organizer')}
                disabled={loading}
                className="py-2 px-1 text-center rounded-lg text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-900/50 hover:bg-purple-900/30 transition-all cursor-pointer"
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="py-2 px-1 text-center rounded-lg text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Dean (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
