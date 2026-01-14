import React, { useState, useEffect, useCallback, useMemo } from 'react';

import toast, { Toaster } from 'react-hot-toast';
import {
    CurrencyDollarIcon,
    CheckCircleIcon,
    ClockIcon,
    PencilSquareIcon,
    CalendarIcon,
    UserIcon,
    PhoneIcon
} from '@heroicons/react/24/outline';
import { API_BASE } from '../api/constants';


import AdjustPriceModal  from '../components/AdjustPriceModal';

// --- AUTHENTICATION UTILITIES ---
const getToken = () => localStorage.getItem('jwtToken');

// --- CONSTANTS ---
// const API_BASE = 'http://localhost:8080/api';
const ALL_PAYMENTS_URL = `${API_BASE}/payments`;
const UPDATE_PAYMENT_URL = (id) => `${API_BASE}/payments/${id}`;

// --- UTILS ---
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return `₹ ${numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

// --- COMPONENT: EDIT MODAL ---
const EditPaymentModal = ({ payment, onClose, onSave }) => {
    const [isCompleted, setIsCompleted] = useState(payment.paymentCompleted);
    const [extraPayment, setExtraPayment] = useState('');
    const [isSaving, setIsSaving] = useState(false);


    const [adjustingPayment, setAdjustingPayment] = useState(null);

    const balanceDue = payment.totalPrice - payment.initialPayment;

    const handleSave = () => {
        const amountToAdd = Number(extraPayment);

        if (extraPayment && (isNaN(amountToAdd) || amountToAdd < 0)) {
            toast.error("Please enter a valid positive payment amount.");
            return;
        }

        if (isCompleted && amountToAdd < balanceDue && balanceDue > 0.01) {
            toast.error(`Cannot mark complete. Balance due: ${formatCurrency(balanceDue)}`);
            return;
        }

        const payload = {
            id: payment.id,
            newPaymentAmount: amountToAdd,
            markCompleted: isCompleted,
        };

        const token = getToken();
        if (!token) {
            toast.error("Authentication failed.");
            return;
        }

        setIsSaving(true);

        // SIMULATED API CALL
        setTimeout(() => {
            console.log("PUT Payload:", payload);
            toast.success("Payment updated successfully!");
            const newLastPaymentDate = amountToAdd > 0 ? new Date().toISOString() : payment.lastPaymentDate;
            onSave(payment.id, isCompleted, payment.initialPayment + amountToAdd, newLastPaymentDate);
            setIsSaving(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <PencilSquareIcon className="w-6 h-6" /> Update Payment
                    </h3>
                    <button onClick={onClose} className="text-indigo-100 hover:text-white transition">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-indigo-50 rounded-xl p-4 grid grid-cols-2 gap-4 border border-indigo-100">
                        <div>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Customer</p>
                            <p className="font-semibold text-gray-900 truncate">{payment.customerName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Balance Due</p>
                            <p className={`text-lg font-bold ${balanceDue > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(balanceDue)}
                            </p>
                        </div>
                        <div className="col-span-2 flex justify-between border-t border-indigo-200 pt-3 mt-1">
                            <span className="text-sm text-gray-600">Total: <b>{formatCurrency(payment.totalPrice)}</b></span>
                            <span className="text-sm text-gray-600">Paid: <b className="text-emerald-600">{formatCurrency(payment.initialPayment)}</b></span>
                        </div>

                    </div>

                    {/* Input Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Add Payment Amount (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={extraPayment}
                                onChange={(e) => setExtraPayment(e.target.value)}
                                placeholder="0.00"
                                className="block w-full pl-8 pr-12 py-3 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            />
                        </div>
                    </div>

                    {/* Toggle Section */}
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(e) => setIsCompleted(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="ml-3 font-medium text-gray-900">Mark as Fully Completed</span>
                    </label>

                    {/* Actions */}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:bg-indigo-400 transition"
                        >
                            {isSaving ? 'Saving...' : 'Confirm Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: MOBILE CARD ITEM ---
// Renders data as a card on small screens
const MobilePaymentCard = ({ payment, isOverdue, onEdit }) => {
    const balanceDue = payment.totalPrice - payment.initialPayment;

    return (
        <div className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4 ${isOverdue ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-indigo-500'}`}>
            {/* Header: Name & Status */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {payment.customerName}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <PhoneIcon className="w-3 h-3 mr-1" /> {payment.customerContact}
                    </div>
                </div>
                {payment.paymentCompleted ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold flex items-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1" /> PAID
                    </span>
                ) : (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" /> PENDING
                    </span>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-50 mb-4">
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase">Total</p>
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(payment.totalPrice)}</p>
                </div>
                <div className="text-center border-l border-r border-gray-50">
                    <p className="text-xs text-gray-400 uppercase">Paid</p>
                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(payment.initialPayment)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase">Due</p>
                    <p className={`font-bold text-sm ${balanceDue > 0.01 ? 'text-rose-600' : 'text-green-600'}`}>
                        {formatCurrency(balanceDue)}
                    </p>
                </div>
            </div>

            {/* Dates & Action */}
            <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-700">Ends:</span> <span className={isOverdue ? "text-rose-600 font-bold" : ""}>{formatDate(payment.courseEndDate)}</span></p>
                    <p><span className="font-medium text-gray-700">Last Paid:</span> {formatDate(payment.lastPaymentDate)}</p>
                </div>

                {!payment.paymentCompleted && (
                    <div className="flex gap-2">

                        <button
                            onClick={() => onRemind(payment.id)}
                            className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition"
                        >
                            Remind
                        </button>
                        <button
                            onClick={() => onEdit(payment)}
                            className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
                        >
                            Update
                        </button>

                    </div>

                )}
            </div>


        </div>
    );
};

// --- MAIN COMPONENT ---
function PaymentManagement() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedPayment, setSelectedPayment] = useState(null);

    const [adjustingPayment, setAdjustingPayment] = useState(null);

    // --- DATA FETCHING ---
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setLoading(false);
            const authError = "Authentication token missing. Please log in.";
            setError(authError);
            toast.error(authError);
            return;
        }

        try {
            const response = await fetch(ALL_PAYMENTS_URL, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            const paymentData = Array.isArray(result) ? result : result.data || [];

            if (paymentData.length === 0) toast('No payments found.', { icon: 'ℹ️' });
  

            const sortedPayments = paymentData.sort((a, b) => (b.id || 0) - (a.id || 0));
            setPayments(sortedPayments);

        } catch (err) {
            console.error("Fetch error:", err.message);
            setError(`Failed to load payments: ${err.message}`);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // --- FILTERING ---
    const filteredPayments = useMemo(() => {
        const isPending = activeTab === 'pending';
        return payments.filter(p => (p.paymentCompleted || false) === !isPending);
    }, [payments, activeTab]);

    // --- STATE UPDATE HANDLER ---
    const handlePaymentUpdated = (paymentId, newCompletionStatus, updatedInitialPayment, newLastPaymentDate) => {
        setPayments(prevPayments => prevPayments.map(p => {
            if (p.id === paymentId) {
                return {
                    ...p,
                    paymentCompleted: newCompletionStatus,
                    initialPayment: updatedInitialPayment,
                    lastPaymentDate: newLastPaymentDate || p.lastPaymentDate
                };
            }
            return p;
        }));
        setSelectedPayment(null);
        toast.success("Record updated.");
    };


    const sendWhatsAppReminder = async (paymentId) => {
        const token = getToken();
        if (!token) {
            toast.error("Session expired. Please log in.");
            return;
        }

        const loadingToast = toast.loading("Sending WhatsApp reminder...");

        try {
            const response = await fetch(`${API_BASE}/payments/${paymentId}/send-reminder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Failed to send reminder");

            toast.success("WhatsApp reminder sent!", { id: loadingToast });
        } catch (err) {
            console.error("Reminder error:", err);
            toast.error("Could not send WhatsApp message", { id: loadingToast });
        }
    };

    const handleAdjustmentSuccess = () => {
        fetchPayments(); // Simply re-fetch to get the new calculated totals and status from DB
        setAdjustingPayment(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-10">
            <Toaster position="top-right" />

            {/* --- HEADER --- */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <CurrencyDollarIcon className="w-8 h-8" />
                                </div>
                                Payment Ledger
                            </h1>
                            <p className="text-sm text-gray-500 mt-1 ml-1">Manage customer fees and tracking</p>
                        </div>

                        {/* Stats Summary - Responsive Grid */}
                        <div className="flex gap-3 text-sm">
                            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex flex-col items-center">
                                <span className="font-bold text-xl">{payments.filter(p => !p.paymentCompleted).length}</span>
                                <span className="text-xs uppercase font-semibold">Pending</span>
                            </div>
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-100 flex flex-col items-center">
                                <span className="font-bold text-xl">{payments.filter(p => p.paymentCompleted).length}</span>
                                <span className="text-xs uppercase font-semibold">Cleared</span>
                            </div>
                        </div>
                    </div>

                    {/* --- TABS --- */}
                    <div className="mt-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <ClockIcon className="w-5 h-5" /> Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'completed'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <CheckCircleIcon className="w-5 h-5" /> Completed
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div>
                        <p className="text-gray-500 font-medium">Syncing Ledger...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                        <p className="font-bold text-red-700">Error Loading Data</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {!loading && !error && filteredPayments.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200 dashed">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Records Found</h3>
                        <p className="text-gray-500">There are no {activeTab} payments at the moment.</p>
                    </div>
                )}

                {!loading && !error && filteredPayments.length > 0 && (
                    <>
                        {/* 1. MOBILE VIEW: CARDS (Visible only on small screens) */}
                        <div className="block md:hidden">
                            {filteredPayments.map(p => {
                                const balanceDue = p.totalPrice - p.initialPayment;
                                const isOverdue = balanceDue > 0.01 && p.courseEndDate && new Date(p.courseEndDate) < new Date();
                                return (
                                    <MobilePaymentCard
                                        key={p.id}
                                        payment={p}
                                        isOverdue={isOverdue}
                                        onEdit={setSelectedPayment}
                                        onRemind={sendWhatsAppReminder}
                                    />
                                );
                            })}
                        </div>

                        {/* 2. DESKTOP VIEW: TABLE (Visible on medium screens and up) */}
                        <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Financials</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course Duration</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Payment</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPayments.map((p) => {
                                            const balanceDue = p.totalPrice - p.initialPayment;
                                            const isDue = balanceDue > 0.01;
                                            const isOverdue = isDue && p.courseEndDate && new Date(p.courseEndDate) < new Date();

                                            return (
                                                <tr key={p.id} className={`hover:bg-gray-50 transition duration-150 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                                {p.customerName.charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-bold text-gray-900">{p.customerName}</div>
                                                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                                    <PhoneIcon className="w-3 h-3 mr-1" /> {p.customerContact}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 font-medium">Total: {formatCurrency(p.totalPrice)}</div>
                                                        <div className="text-xs text-emerald-600 font-semibold mt-1">Paid: {formatCurrency(p.initialPayment)}</div>
                                                        {isDue && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                                                Due: {formatCurrency(balanceDue)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs text-gray-500 flex items-center mb-1">
                                                            <CalendarIcon className="w-3 h-3 mr-1" /> {formatDate(p.courseStartDate)}
                                                        </div>
                                                        <div className={`text-xs flex items-center font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                                            <CalendarIcon className="w-3 h-3 mr-1" /> {formatDate(p.courseEndDate)}
                                                        </div>
                                                        {isOverdue && <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide ml-4">Overdue</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(p.lastPaymentDate)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-row items-center justify-center gap-2">
                                                            {/* Update Button or Paid Badge */}
                                                            {p.paymentCompleted ? (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                                    <CheckCircleIcon className="w-4 h-4 mr-1" /> PAID
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setSelectedPayment(p)}
                                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition whitespace-nowrap"
                                                                >
                                                                    Update
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setAdjustingPayment(p)}
                                                                className="text-amber-600 hover:text-amber-900 font-semibold text-sm bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition border border-amber-100"
                                                            >
                                                                Adjust
                                                            </button>

                                                            {/* Remind Button - Only show if not completed */}
                                                            {!p.paymentCompleted && (
                                                                <button
                                                                    onClick={() => sendWhatsAppReminder(p.id)}
                                                                    className="flex items-center gap-1 text-emerald-700 hover:text-white font-semibold text-sm bg-emerald-50 hover:bg-emerald-600 px-3 py-2 rounded-lg border border-emerald-200 transition-all active:scale-95 whitespace-nowrap"
                                                                    title="Send WhatsApp Reminder"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                                    </svg>
                                                                    Remind
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Modal */}
            {selectedPayment && (
                <EditPaymentModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    onSave={handlePaymentUpdated}
                />
            )}

            {adjustingPayment && (
                <AdjustPriceModal 
                    payment={adjustingPayment} 
                    onClose={() => setAdjustingPayment(null)} 
                    onSave={handleAdjustmentSuccess} 
                />
            )}
        </div>
    );
}

export default PaymentManagement;