// src/components/AddExpenditureSidebar.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getToken } from '../utils/auth';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE, VEHICLES_URL } from '../api/constants';

const EXPENSE_URL = `${API_BASE}/expenditures`;

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
                    const response = await fetch(VEHICLES_URL, {
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
        <>
            {/* Backdrop Overlay - Crucial for mobile UX */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 z-[60] ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div 
                className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-[70] 
                w-full sm:w-[450px] flex flex-col max-h-screen overflow-hidden ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header - Sticky */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Record Expenditure</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Finance Tracking</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <form 
                    onSubmit={handleSubmit} 
                    className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
                >
                    {/* Vehicle Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Vehicle</label>
                        <select 
                            name="vehicleNumber" 
                            required 
                            value={formData.vehicleNumber} 
                            onChange={handleChange} 
                            className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 bg-white transition-all cursor-pointer"
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles.map(v => (
                                <option key={v.vehicleNumber} value={v.vehicleNumber}>
                                    {v.vehicleNumber} - {v.vehicleName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Expense Title */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Expense Title</label>
                        <input 
                            name="expenseName" 
                            type="text" 
                            required 
                            value={formData.expenseName} 
                            onChange={handleChange} 
                            placeholder="e.g. Diesel Fill" 
                            className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all" 
                        />
                    </div>

                    {/* Amount & Type Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Amount (₹)</label>
                            <input 
                                name="price" 
                                type="number" 
                                required 
                                value={formData.price} 
                                onChange={handleChange} 
                                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Type</label>
                            <select 
                                name="expenseType" 
                                value={formData.expenseType} 
                                onChange={handleChange} 
                                className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 bg-white transition-all cursor-pointer"
                            >
                                <option value="FUEL">Fuel</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Date</label>
                        <input 
                            name="expenseDate" 
                            type="date" 
                            required 
                            value={formData.expenseDate} 
                            onChange={handleChange} 
                            className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Description</label>
                        <textarea 
                            name="details" 
                            rows="3" 
                            value={formData.details} 
                            onChange={handleChange} 
                            className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                            placeholder="Optional details..."
                        />
                    </div>
                </form>

                {/* Footer - Fixed at bottom */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        form="expense-form" // If you wrap the whole thing or just keep the button inside
                        onClick={(e) => {
                            // Since button is outside <form> if using flex layout, trigger form submit manually
                            const form = document.querySelector('form');
                            if(form) form.requestSubmit();
                        }}
                        className="w-full py-4 px-6 rounded-2xl shadow-lg shadow-indigo-100 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Expense'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default AddExpenditureSidebar;