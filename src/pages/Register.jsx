import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../api/constants';

const BASE_URL = `${API_BASE}/auth`;


function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    contact: '',
    licenseNumber: '',
    role: 'USER',
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper for validation logic
  const validateForm = () => {
    const { name, username, password, contact, licenseNumber } = formData;

    if (name.length < 2 || name.length > 30) {
      return "Name must be between 2 and 30 characters.";
    }
    if (username.length < 4 || username.length > 20) {
      return "Username must be between 4 and 20 characters.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    // Simple regex for 10-digit phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact)) {
      return "Contact must be a valid 10-digit phone number.";
    }
    if (licenseNumber && licenseNumber.length > 20) {
      return "License number cannot exceed 20 characters.";
    }
    return null; // No errors
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // 1. Run Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message || 'Registration successful!');
        setTimeout(() => navigate('/login'), 2000); 
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error or server unreachable.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white shadow-2xl rounded-lg p-8">
        <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-6">
          Create Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name Field with maxLength attribute */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={31} 
              required
              placeholder="Max 30 characters"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                maxLength={20}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min 6 characters"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Field */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact (Phone)</label>
              <input
                id="contact"
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                placeholder="10 digit number"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            {/* License Number Field */}
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">License Number</label>
              <input
                id="licenseNumber"
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                maxLength={20}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a/an</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white"
            >
              <option value="USER">Staff (User)</option>
              <option value="ADMIN">Owner (Admin)</option>
            </select>
          </div>

          {(error || message) && (
            <p className={`text-sm font-medium p-3 rounded-lg animate-fade-in ${error ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              {error || message}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;