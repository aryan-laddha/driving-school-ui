// AdminScheduleView.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// NOTE: Ensure your paths are correct for API constants and components
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';
import RescheduleModal from '../components/RescheduleModal';
import UpdateTimeModal from '../components/UpdateTimeModal';
import ScheduleList from '../components/ScheduleList';


// API Endpoints
const CANCEL_ALL_URL = `${API_BASE}/schedules/cancel-all-upcoming`;
const CANCEL_SINGLE_URL = `${API_BASE}/schedules/cancel`;

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => new Date(date).toISOString().split('T')[0];
const todayDate = formatDate(new Date());

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'RESCHEDULED', label: 'Rescheduled' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' },
];

// Helper function to handle date navigation
const addDays = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return formatDate(date);
};

function AdminScheduleView() {
    const { token } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [users, setUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updateMessage, setUpdateMessage] = useState(null);

const [showFilters, setShowFilters] = useState(true); // New state to toggle visibility
    // --- Modal/Confirmation State ---
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [scheduleToReschedule, setScheduleToReschedule] = useState(null);
    const [showUpdateTimeModal, setShowUpdateTimeModal] = useState(false);
    const [scheduleToUpdateTime, setScheduleToUpdateTime] = useState(null);
    const [scheduleToCancelAll, setScheduleToCancelAll] = useState(null);
    const [scheduleToCancelSingle, setScheduleToCancelSingle] = useState(null);

    // --- Filter State ---
    const [selectedDate, setSelectedDate] = useState(todayDate);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedVehicleType, setSelectedVehicleType] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    // ---------------------------------------------------------------------
    // API CALL: Fetch Schedules (Refreshed when filters change)
    // ---------------------------------------------------------------------
    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError('');

        const params = {
            date: selectedDate,
            customerType: 'ALL',
            ...(selectedUser && { instructorId: selectedUser }),
            ...(selectedVehicleType && { vehicleNumber: selectedVehicleType }),
            ...(selectedCourse && { courseId: selectedCourse }),
            ...(selectedStatus && { status: selectedStatus }),
        };

        try {
            const response = await axios.get(
                `${API_BASE}/schedules/allschedule`,
                { headers, params }
            );

            const mappedSchedules = (response.data || []).map(schedule => ({
                ...schedule,
                startDate: schedule.courseStartDate || 'N/A',
                endDate: schedule.courseEndDate || 'N/A',
            }));

            setSchedules(mappedSchedules);

        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError('Failed to fetch schedules. Please try again.');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [token, selectedDate, selectedUser, selectedVehicleType, selectedCourse, selectedStatus]);

    // ---------------------------------------------------------------------
    // API CALL: Fetch Dropdown Data & Initial Schedule Fetch
    // ---------------------------------------------------------------------
    useEffect(() => {
        const fetchFiltersData = async () => {
            if (!token) return;

            try {
                // Fetch Users 
                const userRes = await axios.get(USERS_URL, { headers });
                const allUsers = userRes.data.data || [];
                setUsers([{ id: '', name: 'All Users', key: 'all-users', role: 'All' }, ...allUsers]);

                // Fetch Vehicles 
                const vehicleRes = await axios.get(VEHICLES_URL, { headers });
                const allVehicles = vehicleRes.data.data || [];
                setVehicles([{ vehicleNumber: '', vehicleName: 'All Vehicles', key: 'all-vehicles' }, ...allVehicles]);

                // Fetch Courses 
                const courseRes = await axios.get(COURSES_URL, { headers });
                const rawCourses = courseRes.data.data || [];

                const formattedCourses = rawCourses.map(course => ({
                    id: String(course.courseId),
                    name: course.courseName,
                    vehicleType: course.vehicleType
                }));

                setCourses([{ id: '', name: 'All Courses', key: 'all-courses' }, ...formattedCourses]);

            } catch (err) {
                console.error('Error fetching filter data:', err);
            }
        };

        fetchFiltersData();
    }, [token]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // ---------------------------------------------------------------------
    // ACTION HANDLERS (Simplified for brevity)
    // ---------------------------------------------------------------------

    const handleActionSuccess = (message) => {
        setUpdateMessage({ type: 'success', text: message });
        fetchSchedules();
        setTimeout(() => setUpdateMessage(null), 5000);
    }

    // Inside AdminScheduleView.jsx, find the updateScheduleStatus definition and replace it:

    const updateScheduleStatus = async (scheduleId, newStatus) => {
        // Construct the specific API endpoint URL
        const UPDATE_STATUS_URL = `${API_BASE}/schedules/update-status/${scheduleId}?status=${newStatus}`;

        // Use axios.patch (or axios.put, depending on your backend REST convention)
        // PATCH is generally appropriate for partial updates like status change.
        const response = await axios.patch(UPDATE_STATUS_URL, null, { headers });

        // Return the response data if successful
        return response.data;
    };

    // This function remains correct as it calls the updated updateScheduleStatus
    const handleUpdateStatus = async (scheduleId, currentStatus) => {
        if (['COMPLETED', 'CANCELLED'].includes(currentStatus)) {
            setUpdateMessage({ type: 'error', text: `Schedule is already ${currentStatus.toLowerCase()}.` });
            setTimeout(() => setUpdateMessage(null), 3000);
            return;
        }

        const newStatus = 'COMPLETED'; // <-- Sets the status to COMPLETED
        setLoading(true);

        try {
            // Calls the new API function defined above
            await updateScheduleStatus(scheduleId, newStatus);
            setUpdateMessage({ type: 'success', text: `Schedule ID ${scheduleId} marked as COMPLETED!` });
            await fetchSchedules(); // <-- Refreshes the schedule list
        } catch (err) {
            console.error("Update Status Error:", err); // Important for debugging
            setUpdateMessage({ type: 'error', text: 'Failed to update status. Check console for details.' });
        } finally {
            setLoading(false);
            setTimeout(() => setUpdateMessage(null), 3000);
        }
    };
    const handleRescheduleClick = (schedule) => {
        setScheduleToReschedule(schedule);
        setShowRescheduleModal(true);
    };

    const handleUpdateTimeClick = (schedule) => {
        setScheduleToUpdateTime(schedule);
        setShowUpdateTimeModal(true);
    };

    // Single Cancel Logic
    const handleCancelSingleClick = (schedule) => {
        if (['SCHEDULED', 'RESCHEDULED'].includes(schedule.status)) {
            setScheduleToCancelSingle(schedule);
        } else {
            setUpdateMessage({ type: 'error', text: `Cannot cancel a schedule that is already ${schedule.status.toLowerCase()}.` });
            setTimeout(() => setUpdateMessage(null), 3000);
        }
    };

    const confirmSingleCancellation = async () => {
        if (!scheduleToCancelSingle) return;

        const scheduleId = scheduleToCancelSingle.id;
        setLoading(true);
        setScheduleToCancelSingle(null);

        try {
            await axios.patch(`${CANCEL_SINGLE_URL}/${scheduleId}`, null, { headers });

            handleActionSuccess(`Schedule ID ${scheduleId} successfully CANCELLED.`);

        } catch (err) {
            const apiError = err.response?.data?.message || 'Failed to cancel schedule. Check server logs.';
            setUpdateMessage({ type: 'error', text: apiError });
            setTimeout(() => setUpdateMessage(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    // Full Cancellation Logic
    const handleCancelAllUpcoming = (schedule) => {
        setScheduleToCancelAll(schedule);
    };

    const confirmFullCancellation = async () => {
        if (!scheduleToCancelAll) return;

        const { customerId, customerName } = scheduleToCancelAll;
        setLoading(true);
        setScheduleToCancelAll(null);

        try {
            const params = { customerId };
            await axios.patch(CANCEL_ALL_URL, null, { headers, params });

            handleActionSuccess(`Successfully DELETED all upcoming schedules for ${customerName} and marked the customer INACTIVE.`);

        } catch (err) {
            const apiError = err.response?.data?.message || 'Failed to delete schedules. Check server logs.';
            setUpdateMessage({ type: 'error', text: apiError });
            setTimeout(() => setUpdateMessage(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const cancelFullConfirmation = () => setScheduleToCancelAll(null);
    const cancelSingleConfirmation = () => setScheduleToCancelSingle(null);

    // ---------------------------------------------------------------------
    // UTILITY LOGIC (Sorting and Filtering)
    // ---------------------------------------------------------------------
    const sortedAndFilteredSchedules = useMemo(() => {
        let currentSchedules = schedules;

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            currentSchedules = currentSchedules.filter(schedule =>
                schedule.customerName.toLowerCase().includes(lowerCaseSearch) ||
                schedule.instructorName.toLowerCase().includes(lowerCaseSearch) ||
                schedule.vehicleName.toLowerCase().includes(lowerCaseSearch) ||
                schedule.courseName.toLowerCase().includes(lowerCaseSearch)
            );
        }

        currentSchedules.sort((a, b) => {
            if (a.startTime < b.startTime) return -1;
            if (a.startTime > b.startTime) return 1;
            return 0;
        });

        return currentSchedules;
    }, [schedules, searchTerm]);

    const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '';

    const getStatusStyle = (status) => {
        switch (status) {
            case 'SCHEDULED':
            case 'RESCHEDULED':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------
    return (
        // Outermost container constrained to prevent page-wide horizontal scroll
        <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">

  
        <header className="flex-none bg-white border-b border-gray-200 z-30 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3">
                
                {/* Top Row: Title, Toggle, and Date */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <span className="mr-2">🗓️</span> Schedule Management
                        </h2>
                        
                        {/* THE TOGGLE BUTTON */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all border border-transparent hover:border-slate-200"
                        >
                            {showFilters ? '✕ Hide Filters' : '🔍 Show Filters'}
                        </button>
                    </div>

                    {/* Compact Date Navigation */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-300">
                        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="px-2 py-1 hover:bg-white rounded text-xs transition">←</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-[12px] font-bold focus:ring-0 p-0 w-24 text-center cursor-pointer"
                        />
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="px-2 py-1 hover:bg-white rounded text-xs transition">→</button>
                    </div>
                </div>

                {/* --- CONDITIONAL FILTER GRID --- */}
                {showFilters && (
                    <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        
                        {/* Search - Strict Width */}
                        <div className="flex flex-col w-[160px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Search</label>
                            <input
                                type="text"
                                placeholder="Customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Instructor - Strict Width */}
                        <div className="flex flex-col w-[140px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Instructor</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">All Users</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>

                        {/* Vehicle - Strict Width */}
                        <div className="flex flex-col w-[140px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Vehicle</label>
                            <select
                                value={selectedVehicleType}
                                onChange={(e) => setSelectedVehicleType(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">All Vehicles</option>
                                {vehicles.map(v => <option key={v.vehicleNumber} value={v.vehicleNumber}>{v.vehicleName}</option>)}
                            </select>
                        </div>

                        {/* Status - Strict Width */}
                        <div className="flex flex-col w-[130px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-indigo-500"
                            >
                                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        {/* Clear Button */}
                        <button
                            onClick={() => { setSelectedUser(''); setSelectedVehicleType(''); setSelectedStatus(''); setSearchTerm(''); }}
                            className="px-3 py-1.5 border border-red-200 text-red-600 font-bold rounded text-[10px] hover:bg-red-50 transition uppercase h-[34px]"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </header>

            {/* --- SCROLLABLE TABLE AREA --- */}
            {/* flex-1 tells it to take all remaining space, overflow-auto adds scrollbars ONLY here */}
            <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-w-full overflow-hidden">
                    <ScheduleList
                        schedules={sortedAndFilteredSchedules}
                        loading={loading}
                        error={error}
                        formatTime={formatTime}
                        getStatusStyle={getStatusStyle}
                        handleUpdateStatus={handleUpdateStatus}
                        handleRescheduleClick={handleRescheduleClick}
                        handleCancelSingleClick={handleCancelSingleClick}
                        handleUpdateTimeClick={handleUpdateTimeClick}
                        handleCancelAllUpcoming={handleCancelAllUpcoming}
                    />
                </div>
            </main>

            {showRescheduleModal && scheduleToReschedule && (
                <RescheduleModal
                    schedule={scheduleToReschedule}
                    onClose={() => setShowRescheduleModal(false)}
                    onRescheduleSuccess={handleActionSuccess}
                />
            )}

            {showUpdateTimeModal && scheduleToUpdateTime && (
                <UpdateTimeModal
                    schedule={scheduleToUpdateTime}
                    onClose={() => setShowUpdateTimeModal(false)}
                    onUpdateSuccess={handleActionSuccess}
                />
            )}


            {scheduleToCancelSingle && (
                <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-3 text-red-600">🛑 Confirm Single Cancellation</h3>
                        <p className="mb-4 text-sm text-gray-700">
                            Are you sure you want to **CANCEL this single lesson** on **{scheduleToCancelSingle.date}** for **{scheduleToCancelSingle.customerName}**?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelSingleConfirmation}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                No, Keep Scheduled
                            </button>
                            <button
                                onClick={confirmSingleCancellation}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Yes, Cancel Lesson
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {scheduleToCancelAll && (
                <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-3 text-red-700">🛑 Confirm Full Cancellation</h3>
                        <p className="mb-4 text-sm text-gray-700">
                            You are about to **DELETE all upcoming lessons** for **{scheduleToCancelAll.customerName}** and mark them as **INACTIVE**. Proceed?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelFullConfirmation}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Nevermind
                            </button>
                            <button
                                onClick={confirmFullCancellation}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800"
                            >
                                Yes, Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default AdminScheduleView;