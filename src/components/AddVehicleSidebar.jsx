// src/components/AddVehicleSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VEHICLES_URL } from '../api/constants';

function AddVehicleSidebar({ isOpen, onClose, onVehicleAdded, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleName: '',
    vehicleType: 'TWO_WHEELER',
    active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        vehicleNumber: '',
        vehicleName: '',
        vehicleType: 'TWO_WHEELER',
        active: true,
      });
    }
  }, [initialData, isOpen]); // Reset/Sync when opened or data changes

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
    const vehicleNumber = isEditing ? initialData.vehicleNumber : formData.vehicleNumber;

    let endpoint = isEditing ? `${VEHICLES_URL}/${vehicleNumber}` : VEHICLES_URL;
    let method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Vehicle ${isEditing ? 'updated' : 'added'} successfully!`);
        onVehicleAdded();
        onClose();
      } else {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'add'} vehicle.`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Overlay - Mobile Friendly */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-50 
          w-full sm:w-[450px] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Sticky on top */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fleet Management</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vehicle Number Input */}
          <div className="space-y-1.5">
            <label htmlFor="vehicleNumber" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              Registration Number
            </label>
            <input
              id="vehicleNumber"
              name="vehicleNumber"
              type="text"
              placeholder="e.g. MH 12 AB 1234"
              required
              value={formData.vehicleNumber}
              onChange={handleChange}
              readOnly={isEditing}
              className={`w-full p-3 rounded-2xl text-sm font-bold transition-all border outline-none
                ${isEditing 
                  ? 'bg-slate-50 text-slate-400 border-slate-100' 
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'}`}
            />
          </div>

          {/* Vehicle Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="vehicleName" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              Vehicle Model/Name
            </label>
            <input
              id="vehicleName"
              name="vehicleName"
              type="text"
              placeholder="e.g. Maruti Swift"
              required
              value={formData.vehicleName}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>

          {/* Vehicle Type Select */}
          <div className="space-y-1.5">
            <label htmlFor="vehicleType" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              Category
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              required
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 bg-white transition-all cursor-pointer"
            >
              <option value="TWO_WHEELER">Two-Wheeler</option>
              <option value="FOUR_WHEELER">Four-Wheeler</option>
            </select>
          </div>

          {/* Active Status Checkbox - Card Style */}
          <label 
            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Active Status</span>
              <span className="text-[10px] text-slate-400 uppercase font-black">Visible in enrollment</span>
            </div>
            <input
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 border-slate-300 rounded-lg focus:ring-indigo-500"
            />
          </label>
        </form>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl shadow-lg shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Processing...' : (isEditing ? 'Update Vehicle' : 'Register Vehicle')}
          </button>
        </div>
      </div>
    </>
  );
}

export default AddVehicleSidebar;