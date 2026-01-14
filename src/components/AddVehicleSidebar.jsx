// src/components/AddVehicleSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

const BASE_URL = 'http://localhost:8080/api/vehicles';

function AddVehicleSidebar({ isOpen, onClose, onVehicleAdded, initialData }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState(
    initialData || {
      vehicleNumber: '',
      vehicleName: '',
      vehicleType: 'TWO_WHEELER', 
      active: true,
    }
  );
  const [loading, setLoading] = useState(false);

  // Sync internal state when initialData changes (for editing)
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
    const isUpdate = isEditing;
    const vehicleNumber = isUpdate ? initialData.vehicleNumber : formData.vehicleNumber;

    let endpoint = isUpdate ? `${VEHICLES_URL}/${vehicleNumber}` : VEHICLES_URL;
    let method = isUpdate ? 'PUT' : 'POST';

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
        toast.success(result.message || `Vehicle ${isUpdate ? 'updated' : 'added'} successfully!`);
        onVehicleAdded(); 
        onClose();
      } else {
        throw new Error(result.message || `Failed to ${isUpdate ? 'update' : 'add'} vehicle.`);
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Vehicle submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 w-110 h-full bg-white shadow-2xl transition-transform duration-300 z-50 p-6 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vehicle Number Input (Editable only for Add) */}
        <div className="space-y-1">
          <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
            Vehicle Number (Registration)
          </label>
          <input
            id="vehicleNumber"
            name="vehicleNumber"
            type="text"
            required
            value={formData.vehicleNumber}
            onChange={handleChange}
            readOnly={isEditing} 
            className={`w-full p-2 border rounded-md text-sm ${
              isEditing ? 'bg-gray-100 text-gray-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Vehicle Name Input */}
        <div className="space-y-1">
          <label htmlFor="vehicleName" className="text-sm font-medium text-gray-700">
            Vehicle Name/Model
          </label>
          <input
            id="vehicleName"
            name="vehicleName"
            type="text"
            required
            value={formData.vehicleName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
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
            <option value="TWO_WHEELER">Two-Wheeler</option>
            <option value="FOUR_WHEELER">Four-Wheeler</option>
          </select>
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
            Active in Fleet
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
        </button>
      </form>
    </div>
  );
}

export default AddVehicleSidebar;