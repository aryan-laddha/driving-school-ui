import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdEditNote, MdClose } from 'react-icons/md';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

// Standardized API configuration
//const API_BASE = 'http://localhost:8080/api'; 
const getToken = () => localStorage.getItem('jwtToken'); 

const AdjustPriceModal = ({ payment, onClose, onSave }) => {
    // State keys must align with your Backend DTO
    const [vals, setVals] = useState({
        newBasePrice: payment.basePrice || 0,
        newExtraCharges: payment.extraCharges || 0,
        newDiscount: payment.discount || 0
    });
    const [isSaving, setIsSaving] = useState(false);

    // Live Calculations for UI feedback
    const newTotal = Math.max(0, (Number(vals.newBasePrice) + Number(vals.newExtraCharges)) - Number(vals.newDiscount));
    const pendingBalance = newTotal - (payment.initialPayment || 0);

    const executeUpdate = async () => {
        setIsSaving(true);
        const loadToast = toast.loading("Updating payment structure...");
        
        try {
            const response = await fetch(`${API_BASE}/payments/${payment.id}/adjust-price`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}` 
                },
                body: JSON.stringify({
                    newBasePrice: Number(vals.newBasePrice),
                    newExtraCharges: Number(vals.newExtraCharges),
                    newDiscount: Number(vals.newDiscount)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to adjust price");
            }

            toast.success("Price structure updated successfully!", { id: loadToast });
            onSave(); // Refresh parent list
            onClose(); // Exit modal
        } catch (err) {
            console.error("API Error:", err);
            toast.error(err.message || "An error occurred", { id: loadToast });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden border-none animate-in fade-in zoom-in duration-200">
                
                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <MdEditNote className="text-3xl" />
                        <h2 className="text-xl font-bold tracking-wide">Adjust Price</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Customer & Balance Summary Card */}
                    <div className="bg-[#f0f7ff] rounded-2xl p-6 border border-blue-50 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">Customer</p>
                                <p className="text-slate-800 font-extrabold text-xl">
                                  {payment.customerName || "N/A"}

                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1">New Balance Due</p>
                                <p className="text-[#e11d48] font-black text-2xl">
                                    ₹ {pendingBalance.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between border-t border-blue-100 pt-4 text-sm">
                            <span className="text-slate-500 font-semibold">New Total: <b className="text-slate-800 ml-1">₹{newTotal}</b></span>
                            <span className="text-slate-500 font-semibold">Already Paid: <b className="text-emerald-600 ml-1">₹{payment.initialPayment || 0}</b></span>
                        </div>
                    </div>

                    {/* Input Fields */}
                    <div className="space-y-5 px-1">
                        <CustomInput 
                            label="Base Price (₹)" 
                            value={vals.newBasePrice} 
                            onChange={(v) => setVals({...vals, newBasePrice: v})} 
                        />
                        <CustomInput 
                            label="Extra Charges (₹)" 
                            value={vals.newExtraCharges} 
                            onChange={(v) => setVals({...vals, newExtraCharges: v})} 
                        />
                        <CustomInput 
                            label="Discount (₹)" 
                            value={vals.newDiscount} 
                            onChange={(v) => setVals({...vals, newDiscount: v})} 
                            isRed 
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onClick={executeUpdate}
                            disabled={isSaving}
                            className="flex-1 py-4 px-6 rounded-2xl bg-[#4f46e5] text-white font-bold hover:bg-[#4338ca] transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
                        >
                            {isSaving ? "Updating..." : "Confirm Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Input matching the "Add Payment Amount" design
const CustomInput = ({ label, value, onChange, isRed }) => (
    <div className="group">
        <label className={`text-xs font-bold mb-2 block transition-colors ${isRed ? 'text-red-500' : 'text-slate-600 group-focus-within:text-[#4f46e5]'}`}>
            {label}
        </label>
        <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 font-bold">₹</span>
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 font-bold text-slate-700 outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder="0"
            />
        </div>
    </div>
);

export default AdjustPriceModal;