// src/components/AddExpenditureSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

const EXPENSE_URL = `${API_BASE}/expenditures`;
const VEHICLE_URL = `${API_BASE}/vehicles`;
function AddExpenditureSidebar({ isOpen, onClose, onExpenseAdded }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        expenseName: '',
        price: '',
        expenseType: 'FUEL',
        expenseDate: new Date().toISOString().split('T')[0],
        details: '',
        vehicleNumber: ''
    });

    // Fetch vehicles for the dropdown
    useEffect(() => {
        if (isOpen) {
            const fetchVehicles = async () => {
                try {
                    const response = await fetch(VEHICLE_URL, {
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    const result = await response.json();
                    if (result.success) {
                        const activeVehicles = result.data.filter(v => v.active);
                        setVehicles(activeVehicles);
                    }
                } catch (error) {
                    toast.error("Failed to load vehicles for dropdown");
                }
            };
            fetchVehicles();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(EXPENSE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price)
                }),
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Expense recorded!");
                onExpenseAdded();
                onClose();
                setFormData({ expenseName: '', price: '', expenseType: 'FUEL', expenseDate: new Date().toISOString().split('T')[0], details: '', vehicleNumber: '' });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed top-0 right-0 w-96 h-full bg-white shadow-2xl transition-transform duration-300 z-50 p-6 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Record Expenditure</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XMarkIcon className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Vehicle</label>
                    <select name="vehicleNumber" required value={formData.vehicleNumber} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => (
                            <option key={v.vehicleNumber} value={v.vehicleNumber}>{v.vehicleNumber} - {v.vehicleName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">Expense Title</label>
                    <input name="expenseName" type="text" required value={formData.expenseName} onChange={handleChange} placeholder="e.g. Diesel Fill" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                        <input name="price" type="number" required value={formData.price} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <select name="expenseType" value={formData.expenseType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                            <option value="FUEL">Fuel</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <input name="expenseDate" type="date" required value={formData.expenseDate} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea name="details" rows="3" value={formData.details} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="Optional details..."></textarea>
                </div>

                <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Expense'}
                </button>
            </form>
        </div>
    );
}

export default AddExpenditureSidebar;