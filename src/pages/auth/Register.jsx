import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, User, Building, GraduationCap, AlertCircle, BrainCircuit } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('1');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !department) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await register({
        name,
        email,
        password,
        role,
        department,
        year: role === 'student' ? parseInt(year, 10) : undefined
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/${data.user.role.toLowerCase()}/dashboard`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#4F46E5] text-white shadow-xs mb-3">
          <BrainCircuit size={22} />
        </div>
        <h2 className="text-2xl font-bold text-[#172033] tracking-tight">
          Create Campus Account
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Join the EventIntel AI University Platform
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold text-center">
            Account created successfully! Redirecting...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-[#172033] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <User size={15} />
              </div>
              <input
                id="name"
                type="text"
                required
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
              />
            </div>
          </div>

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
                type="email"
                required
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
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
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#172033]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#172033] mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="student">Student</option>
                <option value="organizer">Event Organizer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172033] mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Mechanical Engineering">ME</option>
                <option value="Business Administration">MBA</option>
              </select>
            </div>
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-xs font-medium text-[#172033] mb-1.5">
                Academic Year
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <GraduationCap size={15} />
                </div>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-none focus:border-[#4F46E5]"
                >
                  <option value="1">1st Year (Freshman)</option>
                  <option value="2">2nd Year (Sophomore)</option>
                  <option value="3">3rd Year (Junior)</option>
                  <option value="4">4th Year (Senior)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:opacity-50 transition-colors shadow-xs cursor-pointer mt-4"
          >
            {loading ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-[#64748B]">
        Already have a profile?{' '}
        <Link to="/login" className="font-semibold text-[#4F46E5] hover:text-[#4338CA]">
          Sign in
        </Link>
      </p>
    </div>
  );
};
export default Register;
