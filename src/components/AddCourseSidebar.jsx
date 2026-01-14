// src/components/AddCourseSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VEHICLE_TYPES } from '../utils/constants';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

// const BASE_URL = 'http://localhost:8080/api/courses';

function AddCourseSidebar({ isOpen, onClose, onCourseAdded, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState(
    initialData || {
      courseName: '',
      description: '',
      vehicleType: VEHICLE_TYPES[0].value, 
      vehicleSubCategory: '',
      price: '',
      durationPerDayHours: 1,
      totalDays: 10,
      active: true,
    }
  );
  const [loading, setLoading] = useState(false);

  // Sync internal state when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Convert price back to string for input field
        price: initialData.price ? initialData.price.toString() : '',
      });
    } else {
      setFormData({
        courseName: '',
        description: '',
        vehicleType: VEHICLE_TYPES[0].value, 
        vehicleSubCategory: '',
        price: '',
        durationPerDayHours: 1,
        totalDays: 10,
        active: true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = getToken();

    // Prepare data, ensuring price is correctly formatted
    const dataToSend = {
      ...formData,
      price: parseFloat(formData.price),
    };

    let endpoint;
    let method;

    if (isEditing) {
      // Use courseId for update
      endpoint = `${COURSES_URL}/${formData.courseId}`;
      method = 'PUT';
    } else {
      // Use base URL for creation
      endpoint = COURSES_URL;
      method = 'POST';
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend), 
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Course ${isEditing ? 'updated' : 'added'} successfully!`);
        onCourseAdded(); 
        onClose();
      } else {
        // Use result.message from the backend if available
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'add'} course.`);
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Course submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 w-110 h-full bg-white shadow-2xl transition-transform duration-300 z-50 p-6 overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {isEditing ? 'Edit Course' : 'Add New Course'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Course Name Input */}
        <div className="space-y-1">
          <label htmlFor="courseName" className="text-sm font-medium text-gray-700">
            Course Name (e.g., 4 Wheeler Automatic)
          </label>
          <input
            id="courseName"
            name="courseName"
            type="text"
            required
            value={formData.courseName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Vehicle Type Select */}
        <div className="space-y-1">
          <label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">
            Vehicle Type
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            required
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            {VEHICLE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Vehicle Sub-Category Input */}
        <div className="space-y-1">
          <label htmlFor="vehicleSubCategory" className="text-sm font-medium text-gray-700">
            Vehicle Sub-Category (e.g., Automatic, Manual)
          </label>
          <input
            id="vehicleSubCategory"
            name="vehicleSubCategory"
            type="text"
            required
            value={formData.vehicleSubCategory}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Price Input */}
        <div className="space-y-1">
          <label htmlFor="price" className="text-sm font-medium text-gray-700">
            Price (₹)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Duration Inputs (in a flex container) */}
        <div className="flex space-x-4">
            {/* Total Days Input */}
            <div className="space-y-1 w-1/2">
                <label htmlFor="totalDays" className="text-sm font-medium text-gray-700">
                    Total Days
                </label>
                <input
                    id="totalDays"
                    name="totalDays"
                    type="number"
                    min="1"
                    required
                    value={formData.totalDays}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Hours per Day Input */}
            <div className="space-y-1 w-1/2">
                <label htmlFor="durationPerDayHours" className="text-sm font-medium text-gray-700">
                    Hours per Day
                </label>
                <input
                    id="durationPerDayHours"
                    name="durationPerDayHours"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.durationPerDayHours}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>

        {/* Active Status Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">
            Active Course
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isEditing ? 'Update Course' : 'Add Course')}
        </button>
      </form>
    </div>
  );
}

export default AddCourseSidebar;