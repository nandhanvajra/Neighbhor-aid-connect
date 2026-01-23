import React, { useState } from 'react';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  MapPin, 
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import config from '../config/config';

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [userType, setUserType] = useState(''); // 'resident' or 'worker'
  const [job, setJob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Profession options based on user type
  const residentProfessions = [
    { value: 'lawyer', label: 'Lawyer' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' },
    { value: 'sales', label: 'Sales Representative' },
    { value: 'marketing', label: 'Marketing Specialist' }
  ];

  const workerProfessions = [
    { value: 'electrician', label: 'Electrician' },
    { value: 'plumber', label: 'Plumber' },
    { value: 'maid', label: 'Maid' },
    { value: 'cook', label: 'Cook' },
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'gardener', label: 'Gardener' },
    { value: 'security', label: 'Security Guard' },
    { value: 'maintenance', label: 'Maintenance Worker' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'other', label: 'Other' }
  ];

  // Get current profession options based on user type
  const getProfessionOptions = () => {
    if (userType === 'resident') return residentProfessions;
    if (userType === 'worker') return workerProfessions;
    return [];
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!userType) {
      setError('Please select whether you are a resident or a worker');
      return;
    }

    if (!job) {
      setError('Please select a profession');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, address, job, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      setSuccess(true);
      console.log('Signup successful', data);

      // Redirect to login after successful signup
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-orange-500 mb-2">{config.appName}</h1>
          <p className="text-gray-600">Create an account to join your local community</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">Account created successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <input
                  id="address"
                  type="text"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="123 Main St, Anytown, ST 12345"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-3">
                I am a:
              </label>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="resident"
                    checked={userType === 'resident'}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setJob(''); // Reset job when user type changes
                    }}
                    className="mr-2 text-orange-500 focus:ring-orange-500"
                    required
                  />
                  <span className="text-gray-700">Resident</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="worker"
                    checked={userType === 'worker'}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setJob(''); // Reset job when user type changes
                    }}
                    className="mr-2 text-orange-500 focus:ring-orange-500"
                    required
                  />
                  <span className="text-gray-700">Worker</span>
                </label>
              </div>
            </div>

            {userType && (
              <div className="mb-6">
                <label htmlFor="job" className="block text-gray-700 text-sm font-medium mb-2">
                  {userType === 'resident' ? 'Profession' : 'Service Type'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="job"
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    required
                  >
                    <option value="">Select {userType === 'resident' ? 'your profession' : 'your service type'}</option>
                    {getProfessionOptions().map(jobOption => (
                      <option key={jobOption.value} value={jobOption.value}>
                        {jobOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Password must be at least 4 characters</p>
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition duration-200 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                Log in
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center text-orange-500 hover:text-orange-600">
            <ChevronLeft size={16} className="mr-1" />
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}