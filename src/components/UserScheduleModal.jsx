// src/components/UserScheduleModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/auth';
import toast from 'react-hot-toast';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'; // Imported icons
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';


// const API_BASE = 'http://localhost:8080/api'; 
// const SCHEDULE_URL = `${API_BASE}/schedules`; 

// Helper function to get status badge style
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

const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : 'N/A';
const formatDate = (dateString) => dateString || 'N/A';

// Helper to convert date object to YYYY-MM-DD string
const dateToIsoString = (date) => date.toISOString().split('T')[0];

function UserScheduleModal({ user, onClose }) {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // NEW STATE: Manage the date being viewed (initialized to today)
    const [currentDate, setCurrentDate] = useState(dateToIsoString(new Date()));

    // Fetch schedules based on user role (USER/INSTRUCTOR)
    const fetchUserSchedules = useCallback(async (dateString) => {
        setLoading(true);
        setError(null);
        const token = getToken();

        // Construct the API endpoint with the current date
        const endpoint = `${SCHEDULES_URL}/instructor/${user.username}`;
        const params = new URLSearchParams({ date: dateString }).toString();
        const fullUrl = `${endpoint}?${params}`;

        try {
            const response = await fetch(fullUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || "Failed to fetch schedules.");
            }

            const result = await response.json();
            setSchedules(result || []); 

        } catch (err) {
            console.error('Schedule fetch error:', err);
            setError(`Failed to load schedules: ${err.message}`);
            toast.error(`Error loading schedule for ${user.username}.`);
        } finally {
            setLoading(false);
        }
    }, [user.username]);

    // Effect to trigger fetch whenever currentDate changes
    useEffect(() => {
        fetchUserSchedules(currentDate);
    }, [currentDate, fetchUserSchedules]);

    // --- Date Navigation Handlers ---

    const handleDateChange = (event) => {
        setCurrentDate(event.target.value);
    };

    const handlePreviousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(dateToIsoString(newDate));
    };

    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(dateToIsoString(newDate));
    };


    // Tailwind Modal Structure
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                        🗓️ Schedule for {user.name} ({user.username})
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Date Selection Bar --- */}
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <button
                        onClick={handlePreviousDay}
                        className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition"
                        title="Previous Day"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    
                    <input
                        type="date"
                        value={currentDate}
                        onChange={handleDateChange}
                        className="mx-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-center font-semibold focus:ring-indigo-500 focus:border-indigo-500"
                    />

                    <button
                        onClick={handleNextDay}
                        className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition"
                        title="Next Day"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
                {/* --------------------------- */}


                {/* Modal Body: Schedule Table */}
                <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}> {/* Adjusted height for date bar */}
                    
                    {loading && (
                        <div className="text-center py-8 text-indigo-600">Loading schedules for **{currentDate}**...</div>
                    )}
                    {error && (
                        <div className="text-center py-8 text-red-600 font-medium">{error}</div>
                    )}
                    
                    {!loading && !error && schedules.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No schedules found for **{currentDate}**.</div>
                    )}

                    {!loading && !error && schedules.length > 0 && (
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {schedules.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <strong>{formatDate(schedule.date)}</strong><br/>
                                                <span className="text-xs text-gray-600">
                                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                                                {schedule.customerName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                                {schedule.vehicleName || 'N/A'} ({schedule.vehicleNumber || 'N/A'})
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                                {schedule.courseName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(schedule.status)}`}
                                                >
                                                    {schedule.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal Footer (Optional: close button) */}
                <div className="p-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserScheduleModal;
