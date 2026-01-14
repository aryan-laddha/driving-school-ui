// src/pages/UserSchedulePage.jsx (Ensuring Schedule is within the container bounds)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getLoggedInUsername } from '../utils/auth';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

// --- Configuration ---
// const API_BASE_URL = 'http://localhost:8080/api/schedules';

// --- Icons (Using simple Unicode/Emoji for better portability and consistency) ---
const ICONS = {
    schedule: '🗓️',
    customer: '👤',
    address: '📍',
    contact: '📞',
    course: '📚',
    vehicle: '🚗',
    time: '⏱️',
    status: '✨',
    success: '✅',
    error: '❌',
    info: '💡'
};

// --- Utility Functions ---

const getTodayString = () => new Date().toISOString().split('T')[0];

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const formatTime = (time) => {
    try {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        // Use short form for American time (e.g., 9:00 AM)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return time;
    }
};

// --- Helper Component: Status Badge Mapping ---
const StatusBadge = ({ status }) => {
    const statusMap = {
        'SCHEDULED': { badge: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: ICONS.schedule },
        'COMPLETED': { badge: 'bg-teal-100 text-teal-700 border-teal-300', icon: ICONS.success },
        'CANCELLED': { badge: 'bg-slate-100 text-slate-700 border-slate-300', icon: ICONS.error },
        'RESCHEDULED': { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: ICONS.info },
        'DEFAULT': { badge: 'bg-gray-100 text-gray-700 border-gray-300', icon: ICONS.status }
    };

    const { badge, icon } = statusMap[status] || statusMap['DEFAULT'];

    return (
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge} transition-colors border shadow-sm flex items-center whitespace-nowrap`}>
            <span className="mr-1">{icon}</span> {status}
        </span>
    );
};


// --- Main Component: UserSchedulePage ---

const UserSchedulePage = () => {
    const { isAuthenticated } = useAuth();
    const username = getLoggedInUsername();

    // Calendar & Date State
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Data & Loading State
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [selectedVehicle, setSelectedVehicle] = useState('ALL');
    const [vehicleOptions, setVehicleOptions] = useState([]);

    // Modal State
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [newStartTime, setNewStartTime] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [updateMessage, setUpdateMessage] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Convert selectedDate object to YYYY-MM-DD string for API
    const apiDateString = useMemo(() =>
        selectedDate.toISOString().split('T')[0]
    , [selectedDate]);

    // --- Data Fetching Logic ---

    const fetchDailySchedules = useCallback(async (date) => {
        if (!isAuthenticated || !username) {
            setError("User is not authenticated or username is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setUpdateMessage(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const response = await axios.get(
                `${SCHEDULES_URL}/instructor/${username}`,
                {
                    params: { date: date },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSchedules(response.data);

            const uniqueVehicles = [...new Set(response.data.map(s => s.vehicleNumber))].filter(v => v);
            setVehicleOptions(uniqueVehicles);

        } catch (err) {
            console.error("Error fetching daily schedules:", err);
            setError("Failed to load schedule for the selected day. Please try again or check your network.");
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, username]);

    useEffect(() => {
        fetchDailySchedules(apiDateString);
    }, [apiDateString, fetchDailySchedules]);

    // --- Action Handlers (Update/Cancel/Status) ---

    // Handler for Time Update Modal
    const handleOpenTimeModal = (schedule) => {
        if (schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED') return;
        setSelectedSchedule(schedule);
        setNewStartTime(schedule.startTime);
        setAvailableSlots([]);
        setUpdateMessage(null);
        setIsTimeModalOpen(true);
    };

    // Handler for Status Update Modal
    const handleOpenStatusModal = (schedule) => {
        if (schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED') return;
        setSelectedSchedule(schedule);
        setNewStatus(schedule.status);
        setUpdateMessage(null);
        setIsStatusModalOpen(true);
    };

    const handleUpdateScheduleTime = async () => {
        if (!selectedSchedule || !newStartTime) return;

        setLoading(true);
        setUpdateMessage(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const response = await axios.patch(
                `${SCHEDULES_URL}/update-time/${selectedSchedule.id}`,
                null,
                {
                    params: { newStartTime: newStartTime },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setUpdateMessage({ type: 'success', text: response.data.message });
                setTimeout(() => {
                    setIsTimeModalOpen(false);
                    fetchDailySchedules(apiDateString);
                }, 1000);
            } else {
                setUpdateMessage({ type: 'error', text: response.data.message });
                if (response.data.availableSlots) {
                    setAvailableSlots(response.data.availableSlots);
                }
            }
        } catch (err) {
            setUpdateMessage({ type: 'error', text: err.response?.data?.message || "Time update failed due to a server error." });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateScheduleStatus = async () => {
        if (!selectedSchedule || !newStatus) return;

        const lessonDate = new Date(apiDateString);
        const today = new Date(getTodayString());

        if (newStatus === 'COMPLETED' && lessonDate > today) {
            setUpdateMessage({
                type: 'error',
                text: "Status cannot be set to 'COMPLETED' for a future day's lesson."
            });
            return;
        }

        setLoading(true);
        setUpdateMessage(null);

        try {
            const token = localStorage.getItem('jwtToken');
            const response = await axios.patch(
                `${SCHEDULES_URL}/update-status/${selectedSchedule.id}`,
                null,
                {
                    params: { newStatus: newStatus },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setUpdateMessage({ type: 'success', text: response.data.message });
                setTimeout(() => {
                    setIsStatusModalOpen(false);
                    fetchDailySchedules(apiDateString);
                }, 1000);
            } else {
                setUpdateMessage({ type: 'error', text: response.data.message });
            }
        } catch (err) {
            setUpdateMessage({ type: 'error', text: err.response?.data?.message || "Status update failed due to a server error." });
        } finally {
            setLoading(false);
        }
    };


    const handleCancelSchedule = async (scheduleId) => {
        if (!window.confirm("Are you sure you want to cancel this lesson? This action cannot be undone.")) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('jwtToken');
            await axios.patch(
                `${SCHEDULES_URL}/cancel/${scheduleId}`,
                null,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert("Lesson cancelled successfully!");
            fetchDailySchedules(apiDateString);
        } catch (err) {
            setError("Failed to cancel lesson. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    // --- Render Logic ---

    let filteredSchedules = schedules.filter(schedule =>
        selectedVehicle === 'ALL' || schedule.vehicleNumber === selectedVehicle
    );

    // Card Arrangement: Sort in ascending order by startTime
    filteredSchedules.sort((a, b) => {
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;
        return 0;
    });

    if (!isAuthenticated) {
        return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl shadow-md max-w-lg mx-auto mt-10">Please log in to view your schedule.</div>;
    }

    return (
        // Added max-w-7xl and ensured mx-auto and proper padding for the main container
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            
            {/* --- Header --- */}
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 pb-3 flex items-center">
                <span className="mr-3 text-indigo-600 text-5xl">{ICONS.schedule}</span> Driving Instructor Schedule
            </h1>

            {/* --- Date Picker & Filters --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start space-y-4 sm:space-y-0 sm:space-x-8 mb-8 border-b border-gray-200 pb-5">

                {/* Current Date Display */}
                <h2 className="text-xl font-bold text-gray-700 whitespace-nowrap">
                    <span className="text-gray-500 font-medium mr-1">Schedule for:</span> <span className="text-indigo-600">{formatDate(apiDateString)}</span>
                </h2>

                {/* Date Picker */}
                <div className="flex items-center space-x-2">
                    <label className="text-sm font-semibold text-gray-600">
                        Change Day:
                    </label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="dd MMMM yyyy"
                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-gray-800 cursor-pointer transition-colors w-40"
                    />
                </div>

                {/* Vehicle Filter */}
                <div className="flex items-center space-x-2">
                    <label htmlFor="vehicle-filter" className="text-sm font-semibold text-gray-600">
                        Filter Vehicle:
                    </label>
                    <select
                        id="vehicle-filter"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg shadow-sm w-32 bg-white text-sm font-medium text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                        <option value="ALL">All ({vehicleOptions.length + 1})</option>
                        {vehicleOptions.map(vehicleNumber => (
                            <option key={vehicleNumber} value={vehicleNumber}>
                                {vehicleNumber}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- Schedule List Header --- */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">
                Lessons Overview
            </h2>

            {loading && (
                <div className="text-center p-10 text-xl font-medium text-indigo-500 bg-indigo-50 rounded-xl shadow-inner">
                    <p>Loading your driving lessons, please wait...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-6 rounded-xl mb-6 shadow-md">
                    <p className="font-semibold text-lg">{ICONS.error} An error occurred:</p>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredSchedules.length === 0 && (
                <div className="bg-gray-100 border border-gray-200 text-gray-700 p-8 rounded-xl text-center shadow-inner">
                    <p className="font-bold text-xl">🎉 No lessons scheduled for this day!</p>
                    <p className="text-gray-600 mt-2">Enjoy your free time or select another day.</p>
                </div>
            )}

            {/* List of Schedule Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSchedules.map((schedule) => (
                    <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        onUpdateTimeClick={handleOpenTimeModal}
                        onUpdateStatusClick={handleOpenStatusModal}
                        onCancelClick={handleCancelSchedule}
                    />
                ))}
            </div>

            {/* Schedule Update Modals (Retained from previous versions) */}
            <UpdateScheduleTimeModal
                isOpen={isTimeModalOpen}
                onClose={() => { setIsTimeModalOpen(false); setAvailableSlots([]); setUpdateMessage(null); }}
                schedule={selectedSchedule}
                newStartTime={newStartTime}
                setNewStartTime={setNewStartTime}
                onSave={handleUpdateScheduleTime}
                loading={loading}
                message={updateMessage}
                availableSlots={availableSlots}
            />
            <UpdateScheduleStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => { setIsStatusModalOpen(false); setUpdateMessage(null); }}
                schedule={selectedSchedule}
                newStatus={newStatus}
                setNewStatus={setNewStatus}
                onSave={handleUpdateScheduleStatus}
                loading={loading}
                message={updateMessage}
                isFutureDay={new Date(apiDateString) > new Date(getTodayString())}
            />
        </div>
    );
};

// --- Helper Component: Schedule Card (Retained the refined design) ---
const ScheduleCard = ({ schedule, onUpdateTimeClick, onUpdateStatusClick, onCancelClick }) => {
    const statusColorMap = {
        'SCHEDULED': { accent: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
        'COMPLETED': { accent: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
        'CANCELLED': { accent: 'border-slate-500', bg: 'bg-slate-50', text: 'text-slate-700' },
        'RESCHEDULED': { accent: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
        'DEFAULT': { accent: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-700' }
    };

    const { accent, bg, text } = statusColorMap[schedule.status] || statusColorMap['DEFAULT'];
    const actionDisabled = (schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED');

    const handleActionClick = (handler, schedule) => {
        if (!actionDisabled) {
            handler(schedule);
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl border-l-4 ${accent} flex flex-col h-full`}>

            {/* Time & Status Header (Accent Background) */}
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${bg} rounded-t-xl`}>
                <div className={`text-xl font-extrabold ${text} flex items-center`}>
                    <span className="text-2xl mr-2">{ICONS.time}</span>
                    <span className="truncate">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </span>
                </div>
                <StatusBadge status={schedule.status} />
            </div>

            {/* Details Body */}
            <div className="p-5 space-y-4 flex-grow">

                {/* Customer Info Block */}
                <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2 text-indigo-400 text-lg">{ICONS.customer}</span> Customer:
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-snug mb-2">{schedule.customerName}</p>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                        {/* Address */}
                        <div className="flex items-start">
                            <span className="mr-2 text-md pt-1 text-red-400">{ICONS.address}</span>
                            {/* Ensured address content is truncated to prevent overflow */}
                            <p className="flex-1 truncate">{schedule.customerAddress || 'Address not provided'}</p>
                        </div>
                        {/* Contact */}
                        <div className="flex items-center">
                            <span className="mr-2 text-md text-green-400">{ICONS.contact}</span>
                            <p>{schedule.customerContact || 'Contact not provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Lesson & Vehicle Details (Side-by-Side look) */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    
                    {/* Course */}
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-500 font-medium flex items-center mb-1">
                            <span className="text-lg mr-1 text-orange-500">{ICONS.course}</span> Course
                        </div>
                        <p className="text-base font-semibold text-gray-700 truncate">{schedule.courseName}</p>
                    </div>

                    {/* Vehicle */}
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-500 font-medium flex items-center mb-1">
                            <span className="text-lg mr-1 text-slate-500">{ICONS.vehicle}</span> Vehicle
                        </div>
                        <p className="text-base font-semibold text-gray-700 truncate">{schedule.vehicleNumber}</p>
                    </div>
                </div>
            </div>

            {/* Footer / Actions (Using Outline/Ghost buttons for subtlety) */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                <div className="grid grid-cols-2 gap-3">
                    {/* Reschedule (Primary Ghost Button) */}
                    <button
                        onClick={() => handleActionClick(onUpdateTimeClick, schedule)}
                        disabled={actionDisabled}
                        className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2
                        ${actionDisabled 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' 
                            : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50 hover:shadow-md'
                        }`}
                    >
                        Reschedule
                    </button>
                    
                    {/* Mark Status (Secondary Ghost Button) */}
                    <button
                        onClick={() => handleActionClick(onUpdateStatusClick, schedule)}
                        disabled={actionDisabled}
                        className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2
                        ${actionDisabled 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' 
                            : 'bg-white text-teal-600 border-teal-600 hover:bg-teal-50 hover:shadow-md'
                        }`}
                    >
                        Mark Status
                    </button>
                    
                    {/* Cancel Lesson (Destructive Fill Button) */}
                    <button
                        onClick={() => handleActionClick(onCancelClick, schedule.id)}
                        disabled={actionDisabled}
                        className={`col-span-2 py-2 text-sm font-semibold rounded-lg transition-all duration-200 mt-2 shadow-md
                        ${actionDisabled 
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                    >
                        Cancel Lesson
                    </button>
                </div>
            </div>

        </div>
    );
};

// --- Helper Component: Update Schedule Time Modal ---
const UpdateScheduleTimeModal = ({
    isOpen, onClose, schedule, newStartTime, setNewStartTime,
    onSave, loading, message, availableSlots
}) => {
    if (!isOpen || !schedule) return null;

    const durationHours = useMemo(() => {
        try {
            const start = new Date(`2000/01/01 ${schedule.startTime}`);
            const end = new Date(`2000/01/01 ${schedule.endTime}`);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } catch {
            return 'N/A';
        }
    }, [schedule]);


    const slotOptions = useMemo(() => {
        const times = [];
        for (let h = 9; h <= 17; h++) {
            const time = `${h.toString().padStart(2, '0')}:00:00`;
            times.push(time);
        }
        return times;
    }, []);

    const isPending = schedule.status === 'SCHEDULED' || schedule.status === 'RESCHEDULED';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-7 relative transform transition-all scale-100 opacity-100 duration-300 ease-out">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-3xl transition-colors p-1">
                    &times;
                </button>

                <h3 className="text-3xl font-bold text-gray-800 border-b border-indigo-200 pb-3 mb-6">
                    Reschedule Lesson Time
                </h3>

                <p className="text-lg mb-5 text-gray-700 font-medium">
                    **{schedule.courseName}** with **{schedule.customerName}**
                </p>

                {!isPending && (
                    <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-5 shadow-sm">
                        <p className="font-semibold">{ICONS.info} This lesson is **{schedule.status}** and cannot be updated.</p>
                    </div>
                )}

                {isPending && (
                    <>
                        <div className="mb-6">
                            <label htmlFor="new-time" className="block text-sm font-semibold text-gray-700 mb-2">
                                New Start Time: <span className="text-indigo-600 font-bold">(Duration: {durationHours} hours)</span>
                            </label>
                            <select
                                id="new-time"
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white"
                            >
                                {slotOptions.map(time => (
                                    <option key={time} value={time}>{formatTime(time)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8 border-t border-gray-100 pt-4">
                            <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                disabled={loading}
                                className={`px-5 py-2 rounded-lg text-white font-semibold transition-all duration-200 shadow-md
                                        ${loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {loading ? 'Saving...' : 'Save New Time'}
                            </button>
                        </div>
                    </>
                )}

                {message && (
                    <div className={`mt-5 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} border shadow-sm`}>
                        <p className="font-semibold text-lg">{message.type === 'success' ? ICONS.success : ICONS.error} {message.text}</p>
                    </div>
                )}

                {availableSlots.length > 0 && message?.type === 'error' && (
                    <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                        <p className="font-bold text-gray-800 mb-3">{ICONS.info} Suggested Available Slots:</p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {availableSlots.map(slot => (
                                <span
                                    key={slot}
                                    onClick={() => setNewStartTime(slot.split(' - ')[0])}
                                    className="px-4 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full cursor-pointer hover:bg-indigo-200 transition-colors border border-indigo-200 font-medium"
                                >
                                    {formatTime(slot.split(' - ')[0])}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- Helper Component: Update Schedule Status Modal ---
const UpdateScheduleStatusModal = ({
    isOpen, onClose, schedule, newStatus, setNewStatus,
    onSave, loading, message, isFutureDay
}) => {
    if (!isOpen || !schedule) return null;

    const statusOptions = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'];

    const filteredStatusOptions = useMemo(() => {
        if (isFutureDay) {
            return statusOptions.filter(status => status !== 'COMPLETED');
        }
        return statusOptions;
    }, [isFutureDay, statusOptions]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-7 relative">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-3xl transition-colors p-1">
                    &times;
                </button>

                <h3 className="text-3xl font-bold text-gray-800 border-b border-teal-200 pb-3 mb-6">
                    Update Lesson Status
                </h3>

                <p className="text-lg mb-5 text-gray-700 font-medium">
                    **{schedule.courseName}** with **{schedule.customerName}**
                </p>

                <div className="mb-6">
                    <label htmlFor="new-status" className="block text-sm font-semibold text-gray-700 mb-2">
                        Select New Status:
                    </label>
                    <select
                        id="new-status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-base bg-white"
                    >
                        {filteredStatusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    {isFutureDay && newStatus === 'COMPLETED' && (
                        <p className="mt-2 text-sm text-red-600 font-medium">
                            <span className="font-bold">{ICONS.error} Error:</span> Cannot mark future lessons as 'COMPLETED'.
                        </p>
                    )}
                </div>

                <div className="flex justify-end space-x-3 mt-8 border-t border-gray-100 pt-4">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className={`px-5 py-2 rounded-lg text-white font-semibold transition-all duration-200 shadow-md
                                        ${loading ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                        {loading ? 'Saving...' : 'Save Status'}
                    </button>
                </div>

                {message && (
                    <div className={`mt-5 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} border shadow-sm`}>
                        <p className="font-semibold text-lg">{message.type === 'success' ? ICONS.success : ICONS.error} {message.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default UserSchedulePage;