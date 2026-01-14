import React from 'react';
import {
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    TruckIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

/**
 * Renders the schedule data for a specific customer in a modal.
 * * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {function} props.onClose - Function to close the modal.
 * @param {Array<object>} props.schedules - List of schedule objects to display.
 * @param {boolean} props.loading - Loading state for the data fetch.
 * @param {string} props.customerName - Name of the customer.
 */
const ScheduleModal = ({ isOpen, onClose, schedules, loading, customerName }) => {
    if (!isOpen) return null;

    // --- Utility Functions for Formatting ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
            });
        } catch (e) { return 'Invalid Date'; }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const options = { hour: 'numeric', minute: '2-digit', hour12: true };
            const date = new Date(`2000/01/01 ${timeString}`);
            return date.toLocaleTimeString('en-IN', options);
        } catch (e) { return 'Invalid Time'; }
    };

    // Helper for table display
    const formatTimeSlot = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A';
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    /**
     * Determines the appropriate Tailwind CSS classes for the status badge.
     * @param {string} status - The status string from the schedule object.
     * @returns {string} Tailwind classes for background and text color.
     */
    const getStatusClasses = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'RESCHEDULED':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'SCHEDULED': // Assuming SCHEDULED is the initial active state
            case 'CONFIRMED':
            default:
                // Use blue for active, confirmed, or unrecognized statuses
                return 'bg-blue-100 text-blue-800';
        }
    };

    // --- Render Logic ---
    const isScheduleEmpty = !loading && schedules && schedules.length === 0;

    return (
        <div 
            className="fixed inset-0 bg-transparent z-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            {/* Modal Content container - Stop closing when clicking inside */}
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mt-12 mb-12 transform transition-all duration-300 scale-100"
                onClick={e => e.stopPropagation()} // Prevents closing when clicking inside modal
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <CalendarDaysIcon className="w-6 h-6 mr-2 text-indigo-600" />
                        Schedule for: {customerName}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 md:p-6">
                    {loading && (
                        <div className="flex items-center justify-center p-10 text-lg text-indigo-600">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading schedules...
                        </div>
                    )}

                    {isScheduleEmpty && (
                        <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg text-gray-600">
                            <InformationCircleIcon className="w-8 h-8 text-indigo-500 mb-3" />
                            <p className="font-semibold">No Future Schedules Found</p>
                            <p className="text-sm text-center">This customer currently does not have any pending future classes.</p>
                        </div>
                    )}

                    {!loading && schedules.length > 0 && (
                        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Date / Day
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Time Slot
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Instructor
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Vehicle
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schedules.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {formatDate(schedule.date)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                <div className='flex items-center space-x-1'>
                                                    <ClockIcon className="w-4 h-4 text-indigo-600" />
                                                    <span>{formatTimeSlot(schedule.startTime, schedule.endTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <div className='flex items-center space-x-1'>
                                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                                    <span>{schedule.instructorName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <div className='flex items-center space-x-1'>
                                                    <TruckIcon className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{schedule.vehicleNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span 
                                                    className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full ${getStatusClasses(schedule.status)}`}
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

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;