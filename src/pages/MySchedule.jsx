// src/pages/MySchedule.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLoggedInUsername } from '../utils/auth';
import axios from 'axios';
import { FaCalendarAlt, FaCar, FaClock, FaUserGraduate, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaPhone, FaFilter, FaListAlt, FaExpand, FaTimes, FaTools, FaCheckCircle, FaExchangeAlt } from 'react-icons/fa';
// !!! IMPORTANT: You must install and import react-hot-toast !!!
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';


// Define the API base URL
const API_BASE_URL = `${API_BASE}`;

// --- Helper Component for Detail Rows ---
const DetailItem = ({ icon: Icon, label, value, isBlock = false }) => (
    <div className={isBlock ? 'block' : 'flex flex-col'}>
        <p className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Icon className="mr-2 w-4 h-4" /> {label}
        </p>
        <p className={`text-base font-semibold text-gray-900 ${isBlock ? 'ml-6' : ''}`}>
            {value}
        </p>
    </div>
);



// --- Schedule Detail Modal (UPDATED: Calls confirmation function directly) ---
const ScheduleDetailModal = ({ schedule, onClose, onReschedule, onCancelConfirm }) => {
    if (!schedule) return null;

    const isScheduled = schedule.status === 'SCHEDULED';
    const isCanceled = schedule.status === 'CANCELLED';
    const isRescheduled = schedule.status === 'RESCHEDULED';

    const showActionButtons = isScheduled || isRescheduled;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100">

                {/* Modal Header */}
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-blue-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <FaUserGraduate className="mr-3 text-blue-600" /> Session Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 transition p-2 rounded-full hover:bg-white"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">

                    <h4 className="text-2xl font-extrabold text-blue-800 border-b pb-2 mb-4">{schedule.customerName}</h4>

                    {/* Time & Course */}
                    <div className="grid grid-cols-2 gap-4 text-gray-700">
                        <DetailItem icon={FaClock} label="Time" value={`${schedule.startTime.substring(0, 5)} - ${schedule.endTime.substring(0, 5)}`} />
                        <DetailItem icon={FaCalendarAlt} label="Date" value={schedule.date} />
                        <DetailItem icon={FaCar} label="Vehicle" value={schedule.vehicleName} />
                        <DetailItem icon={FaListAlt} label="Status" value={schedule.status} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <h5 className="text-lg font-semibold text-gray-800">Booking Information</h5>
                        <DetailItem icon={FaUserGraduate} label="Instructor" value={schedule.instructorName} />
                        <DetailItem icon={FaTools} label="Course" value={schedule.courseName} />
                        <DetailItem icon={FaPhone} label="Contact" value={<a href={`tel:${schedule.customerContact}`} className="text-blue-600 hover:underline">{schedule.customerContact || 'N/A'}</a>} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <DetailItem icon={FaMapMarkerAlt} label="Address" value={schedule.customerAddress || 'N/A'} isBlock={true} />
                    </div>
                </div>

                {/* Modal Footer (Updated Actions) */}
                <div className="p-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                    >
                        Close
                    </button>

                    {showActionButtons && (
                        <div className="flex space-x-2">
                            {/* Reschedule/Update */}
                            <button
                                onClick={() => onReschedule(schedule)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
                            >
                                <FaExchangeAlt className='w-4 h-4 mr-2' /> Reschedule
                            </button>

                            {/* Cancel is only available for Scheduled sessions */}
                            {isScheduled && (
                                <button
                                    onClick={() => onCancelConfirm(schedule)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
                                >
                                    <FaTimes className='w-4 h-4 mr-2' /> Cancel
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Reschedule/Update Modal Component (Updated & Fixed) ---
const RescheduleModal = ({ schedule, onClose, onUpdate, token, instructorId }) => {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [newDate, setNewDate] = useState(schedule.date);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState(null);

    const slotDurationHours = 1;

    // FETCH AVAILABLE SLOTS
    const fetchSlots = useCallback(async (date) => {
        setLoadingSlots(true);
        setError(null);
        setAvailableSlots([]);
        setSelectedSlot("");

        if (!date || !schedule.vehicleNumber || !instructorId || !schedule.courseId) {
            setError("Missing required details to fetch slots.");
            setLoadingSlots(false);
            return;
        }

        try {
            const response = await axios.get(
                `${API_BASE_URL}/schedules/available-slots`,
                {
                    params: {
                        instructorId: instructorId,
                        vehicleNumber: schedule.vehicleNumber,
                        date: date,
                        slotDurationHours: slotDurationHours,
                        courseId: schedule.courseId,
                        isPickAndDrop: schedule.pickAndDrop   
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Fetched Slots:", response.data);

            // Backend returns simple array: ["10:00 - 11:00", ...]
            if (Array.isArray(response.data)) {
                setAvailableSlots(response.data);
                if (response.data.length === 0) {
                    setError("No available slots for this date.");
                }
            } else {
                setAvailableSlots([]);
                setError("Invalid response from server.");
            }
        } catch (err) {
            console.error("Error fetching slots:", err);
            setError("Failed to fetch slots.");
        } finally {
            setLoadingSlots(false);
        }
    }, [schedule.vehicleNumber, schedule.courseId, instructorId, token]);

    useEffect(() => {
        fetchSlots(newDate);
    }, [newDate, fetchSlots]);


    // HANDLE UPDATE
// Inside RescheduleModal component
const handleUpdate = () => {
    if (!selectedSlot) {
        alert("Please select a time slot.");
        return;
    }

    // 1. Split the main parts: "12:00" and "13:00 (Travel: 11:30 to 13:30)"
    const parts = selectedSlot.split(" - ");
    let startTime = parts[0].trim();
    let rawEndTime = parts[1].trim();

    // 2. Clean up endTime: Remove everything from the first space onwards 
    // This turns "13:00 (Travel: ...)" into just "13:00"
    let endTime = rawEndTime.split(" ")[0];

    // 3. Ensure they are exactly 5 characters (HH:mm) if needed
    // (Optional: extra safety for the backend parser)
    startTime = startTime.substring(0, 5);
    endTime = endTime.substring(0, 5);

    onUpdate(schedule.id, newDate, startTime, endTime);
};


    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">

                {/* Header */}
                <div className="p-5 border-b bg-yellow-50 rounded-t-xl flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                        Reschedule: {schedule.customerName}
                    </h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Info Block */}
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm font-semibold">Vehicle: {schedule.vehicleName}</p>
                        <p className="text-sm">
                            Current Slot: {schedule.date} ({schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)})
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-3">
                        <label className="font-medium">New Date:</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    {/* Slot Dropdown */}
                    <div>
                        <label className="font-medium block mb-2">Available Time Slots:</label>

                        {loadingSlots ? (
                            <p className="text-blue-500">Loading slots...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : (
                            <select
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md"
                            >
                                <option value="" disabled>
                                    Select a time slot
                                </option>

                                {availableSlots.map((slot, index) => (
                                    <option key={index} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleUpdate}
                        disabled={!selectedSlot}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Schedule Card Component (Updated to use onMarkCompletedConfirm) ---
const ScheduleCard = ({ schedule, onExpand, onMarkCompletedConfirm }) => {
    const statusStyling = {
        SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', badge: 'bg-blue-200' },
        COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-400', badge: 'bg-green-200' },
        CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-400', badge: 'bg-red-200' },
        RESCHEDULED: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-400', badge: 'bg-yellow-200' },
    };

    const styles = statusStyling[schedule.status] || statusStyling.SCHEDULED;



    const startTime = schedule.startTime.substring(0, 5);
    const endTime = schedule.endTime.substring(0, 5);

    return (
        <div className={`flex flex-col h-full p-4 rounded-xl shadow-md border-l-4 ${styles.border} ${styles.bg} transition duration-300 ease-in-out hover:shadow-lg`}>

            {/* 1. TOP HEADER: Customer Name and Status */}
            <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200">
                <div className="flex flex-col">
                    <h5 className="text-lg font-semibold text-gray-900 leading-tight">
                        {schedule.customerName}
                    </h5>
                    <p className="text-sm text-gray-500">{schedule.courseName}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles.badge} ${styles.text} whitespace-nowrap`}>
                    {schedule.status}
                </span>
            </div>

            <div className="flex-grow">
                {/* 2. TIME and CONTACT */}
                <div className="mb-4">
                    <div className="flex items-center text-lg font-semibold text-gray-700 mb-2">
                        <FaClock className={`mr-3 ${styles.text} w-4 h-4`} />
                        {startTime} - {endTime}
                    </div>

                    <div className="bg-blue-100/50 p-2 rounded-md ml-6 mr-1">
                        <p className="flex items-center text-sm font-medium text-blue-700">
                            <FaPhone className="mr-3 w-3 h-3 text-blue-600" />
                            <a href={`tel:${schedule.customerContact}`} className="hover:underline">
                                {schedule.customerContact || 'N/A'}
                            </a>
                        </p>
                    </div>
                </div>

                {/* 3. Secondary Details */}
                <div className="space-y-3 text-gray-700 text-sm">
                    <p className="flex items-center">
                        <FaUserGraduate className="mr-3 text-gray-500 w-4 h-4" />
                        <span className="font-medium">Instructor:</span> {schedule.instructorName}
                    </p>

                    <p className="flex items-center">
                        <FaCar className="mr-3 text-gray-500 w-4 h-4" />
                        <span className="font-medium">Vehicle:</span> {schedule.vehicleName}
                    </p>
                </div>

                {/* 4. Address */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-2">
                        {/* Pick & Drop Badge */}
                        <div className="flex items-center">
                            {schedule.pickAndDrop ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-700/10">
                                    🚗 Pick & Drop Included
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    📍 At Training Center
                                </span>
                            )}
                        </div>

                        {/* Address Text */}
                        <p className="flex items-start text-gray-700 text-sm">
                            <FaMapMarkerAlt className="mr-3 mt-1 text-gray-500 w-4 h-4 flex-shrink-0" />
                            <span className="font-medium mr-1">Address:</span>
                            <span className="line-clamp-2" title={schedule.customerAddress}>
                                {schedule.customerAddress || 'N/A'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons Section - Simplified */}
            <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center">

                {/* 1. View All (Expand) */}
                <button
                    onClick={() => onExpand(schedule)}
                    className="flex items-center bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-1 px-3 rounded text-xs transition"
                >
                    <FaExpand className="w-3 h-3 mr-1" /> View All
                </button>

                {/* 2. Mark Completed (If not already completed/cancelled) */}
                {schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELLED' && (
                    <button
                        onClick={() => onMarkCompletedConfirm(schedule)} // Use hot toast confirmation
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded text-xs transition flex items-center"
                    >
                        <FaCheckCircle className='w-3 h-3 mr-1' /> Mark Completed
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Main Component (MySchedule) ---
const MySchedule = () => {
    const [allSchedules, setAllSchedules] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedVehicle, setSelectedVehicle] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const username = getLoggedInUsername();

    // State for Modals
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // Hardcoded Instructor ID for API testing 
    const instructorId = 7;

    const statusOptions = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

    // --- Modal Handlers ---
    const handleExpand = (schedule) => {
        setSelectedSchedule(schedule);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    // Handlers for Reschedule Modal
    const handleOpenRescheduleModal = (schedule) => {
        setSelectedSchedule(schedule);
        setIsRescheduleModalOpen(true);
        setIsDetailModalOpen(false); // Close detail modal
    };

    const handleCloseRescheduleModal = () => {
        setIsRescheduleModalOpen(false);
        setSelectedSchedule(null);
    };

    // --- Core API Fetch ---
    const fetchSchedules = useCallback(async (date) => {
        if (!username || !token) {
            setError("User is not logged in or username is unavailable.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/schedules/instructor/${username}`, {
                params: { date },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setAllSchedules(response.data);

            if (response.data.length === 0) {
                setError(null);
            }

        } catch (err) {
            console.error("Error fetching schedule:", err);
            setError(`Failed to load schedule. Error: ${err.message}`);
            setAllSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [username, token]);

    useEffect(() => {
        if (selectedDate) {
            fetchSchedules(selectedDate);
            setSelectedVehicle('ALL');
            setSelectedStatus('ALL');
        }
    }, [selectedDate, fetchSchedules]);


    // --- Core Action Handler ---
    const handleAction = useCallback(async (scheduleId, actionType, payload = {}) => {
        if (!token) {
            toast.error("Authentication required.");
            return;
        }

        let toastId = toast.loading('Processing request...');

        try {
            let url = '';
            let params = {};
            let successMessage = '';

            switch (actionType) {
                case 'UPDATE_STATUS':
                    url = `${API_BASE_URL}/schedules/update-status/${scheduleId}`;
                    params = {
                        status: payload.status
                    };
                    successMessage = `Status successfully updated to ${payload.status}.`;
                    break;

                case 'RESCHEDULE_CONFIRM':
                    url = `${API_BASE_URL}/schedules/cancel-reschedule/${scheduleId}`;
                    params = {
                        newDate: payload.newDate,          // format: 'YYYY-MM-DD'
                        newStartTime: payload.newStartTime, // format: 'HH:mm'
                        newEndTime: payload.newEndTime      // format: 'HH:mm'
                    };
                    successMessage = `Session successfully rescheduled to ${payload.newDate} at ${payload.newStartTime}.`;
                    break;

                default:
                    return;
            }

            await axios.patch(url, null, {   // pass null as data
                headers: { Authorization: `Bearer ${token}` },
                params: params                 // pass query parameters here
            });

            toast.success(successMessage, { id: toastId });

            // Close modals and refresh data
            handleCloseRescheduleModal();
            handleCloseDetailModal();
            fetchSchedules(selectedDate);

        } catch (err) {
            console.error(`Error performing ${actionType}:`, err.response?.data || err.message);
            toast.error(`Action failed: ${err.response?.data?.message || 'Server error'}`, { id: toastId });
        }

    }, [token, selectedDate, fetchSchedules]);


    // --- Hot Toast Confirmation Handler ---
    const handleConfirmAction = useCallback((schedule, status) => {
        const actionText = status === 'COMPLETED' ? 'Mark Completed' : 'Cancel';
        const actionType = 'UPDATE_STATUS';

        toast.custom((t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            {status === 'COMPLETED' ? <FaCheckCircle className="w-6 h-6 text-green-500" /> : <FaTimes className="w-6 h-6 text-red-500" />}
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                Confirm Status Update
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Are you sure you want to **{actionText}** the session for {schedule.customerName}?
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            // Execute the final action
                            handleAction(schedule.id, actionType, { status });
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {actionText}
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        ), { duration: 60000 }); // Long duration until user clicks

        // Ensure detail modal closes if action came from there
        if (status === 'CANCELLED') {
            handleCloseDetailModal();
        }

    }, [handleAction]);


    // Derived state: Get unique vehicle names and filtered schedules
    const uniqueVehicles = useMemo(() => {
        const vehicles = allSchedules.map(s => s.vehicleName).filter(Boolean);
        return ['ALL', ...new Set(vehicles)].sort();
    }, [allSchedules]);

    const schedulesToDisplay = useMemo(() => {
        return allSchedules.filter(schedule => {
            const vehicleMatch = selectedVehicle === 'ALL' || schedule.vehicleName === selectedVehicle;
            const statusMatch = selectedStatus === 'ALL' || schedule.status === selectedStatus;
            return vehicleMatch && statusMatch;
        });
    }, [allSchedules, selectedVehicle, selectedStatus]);

    // --- Date Navigation Handlers ---
    const navigateDate = (days) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + days);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    // --- Render Logic ---

    if (loading) {
        return <div className="p-8 text-center text-lg text-blue-500">Loading schedule...</div>;
    }

    if (!username) {
        return <div className="p-8 text-center text-lg text-red-500">Error: User identity not found. Please relog.</div>;
    }


    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <Toaster position="bottom-right" reverseOrder={false} />
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FaCalendarAlt className="mr-3 text-blue-600 w-6 h-6" /> My Daily Schedule
            </h1>

            {/* Filter and Date Toolbar */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">

                {/* Date Picker Group */}
                <div className="flex items-center justify-center p-2 bg-white rounded-full shadow-md border border-gray-200 w-full sm:w-auto">
                    <button
                        onClick={() => navigateDate(-1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition rounded-full"
                    >
                        <FaChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center mx-3">
                        <FaCalendarAlt className="text-blue-500 mr-2 w-4 h-4" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-base font-semibold text-gray-800 border-none focus:ring-0 focus:outline-none p-1 bg-transparent cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => navigateDate(1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition rounded-full"
                    >
                        <FaChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Group */}
                <div className="flex space-x-3 w-full sm:w-auto justify-center">

                    {/* Status Filter */}
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-300">
                        <FaListAlt className="text-gray-500 w-4 h-4" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-white text-gray-700 text-sm focus:ring-0 focus:outline-none cursor-pointer"
                        >
                            {statusOptions.map(status => (
                                <option key={status} value={status}>
                                    {status === 'ALL' ? 'All Statuses' : status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vehicle Filter */}
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-300">
                        <FaCar className="text-gray-500 w-4 h-4" />
                        <select
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="bg-white text-gray-700 text-sm focus:ring-0 focus:outline-none cursor-pointer"
                        >
                            {uniqueVehicles.map(vehicle => (
                                <option key={vehicle} value={vehicle}>
                                    {vehicle === 'ALL' ? 'All Vehicles' : vehicle}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* List Heading */}
            <h2 className="text-lg font-bold text-gray-700 mb-4">
                {schedulesToDisplay.length} Session(s) for **{new Date(selectedDate).toDateString()}**
            </h2>

            {schedulesToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {schedulesToDisplay.map((schedule) => (
                        <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            onExpand={handleExpand}
                            onMarkCompletedConfirm={(schedule) => handleConfirmAction(schedule, 'COMPLETED')}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500 text-lg">
                        🎉 No scheduled sessions found based on your selection.
                    </p>
                    <p className="text-gray-400 mt-2">Try adjusting the date, status, or vehicle filters.</p>
                </div>
            )}

            {/* Render Modals */}
            {isDetailModalOpen && (
                <ScheduleDetailModal
                    schedule={selectedSchedule}
                    onClose={handleCloseDetailModal}
                    onCancelConfirm={(schedule) => handleConfirmAction(schedule, 'CANCELLED')}
                    onReschedule={handleOpenRescheduleModal}
                />
            )}
            {isRescheduleModalOpen && selectedSchedule && (
                <RescheduleModal
                    schedule={selectedSchedule}
                    onClose={handleCloseRescheduleModal}
                    onUpdate={(id, newDate, startTime, endTime) => handleAction(id, 'RESCHEDULE_CONFIRM', { newDate, newStartTime: startTime, newEndTime: endTime })}
                    token={token}
                    instructorId={instructorId}
                />
            )}
        </div>
    );
};

export default MySchedule;