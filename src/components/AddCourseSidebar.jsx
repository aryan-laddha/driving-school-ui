// src/components/AddCourseSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VEHICLE_TYPES } from '../utils/constants';
import { COURSES_URL } from '../api/constants';

function AddCourseSidebar({ isOpen, onClose, onCourseAdded, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    courseName: '',
    description: '',
    vehicleType: VEHICLE_TYPES[0].value,
    vehicleSubCategory: '',
    price: '',
    durationPerDayHours: 1,
    totalDays: 10,
    active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
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
  }, [initialData, isOpen]);

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

    const dataToSend = {
      ...formData,
      price: parseFloat(formData.price),
    };

    const endpoint = isEditing ? `${COURSES_URL}/${formData.courseId}` : COURSES_URL;
    const method = isEditing ? 'PUT' : 'POST';

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
        throw new Error(result.message || "Failed to process course.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 z-[60] ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* 2. Responsive Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-[70] 
          w-full sm:w-[480px] flex flex-col max-h-screen overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {isEditing ? 'Edit Course' : 'Add New Course'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Curriculum Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form 
          id="course-form"
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white"
        >
          {/* Course Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Course Name</label>
            <input
              name="courseName"
              type="text"
              required
              value={formData.courseName}
              onChange={handleChange}
              placeholder="e.g. 4 Wheeler Automatic"
              className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Description (Optional)</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
            ></textarea>
          </div>

          {/* Type & Sub-Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Vehicle Type</label>
              <select
                name="vehicleType"
                required
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold bg-white outline-none focus:border-indigo-500"
              >
                {VEHICLE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Sub-Category</label>
              <input
                name="vehicleSubCategory"
                type="text"
                required
                value={formData.vehicleSubCategory}
                onChange={handleChange}
                placeholder="Manual/Auto"
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Price (₹)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Duration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Total Days</label>
              <input
                name="totalDays"
                type="number"
                min="1"
                required
                value={formData.totalDays}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Hours/Day</label>
              <input
                name="durationPerDayHours"
                type="number"
                min="1"
                required
                value={formData.durationPerDayHours}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 uppercase">Active Course</span>
            <input
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 border-slate-300 rounded-lg focus:ring-indigo-500"
            />
          </label>
        </form>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="submit"
            form="course-form"
            disabled={loading}
            className="w-full py-4 rounded-2xl shadow-lg shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isEditing ? 'Update Course' : 'Add Course')}
          </button>
        </div>
      </div>
    </>
  );
}

export default AddCourseSidebar;