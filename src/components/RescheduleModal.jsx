// src/components/RescheduleModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/constants';

const AVAILABLE_SLOTS_URL = `${API_BASE}/schedules/available-slots`;
const RESCHEDULE_URL_BASE = `${API_BASE}/schedules/cancel-reschedule`; // Endpoint for rescheduling/canceling

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => new Date(date).toISOString().split('T')[0];
const todayDate = formatDate(new Date());

function RescheduleModal({ schedule, onClose, onRescheduleSuccess }) {
    const { token } = useAuth();
    const [newDate, setNewDate] = useState(todayDate);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch available slots whenever date changes
    useEffect(() => {
        const fetchSlots = async () => {
            // Check essential parameters before fetching
            if (!schedule.instructorId || !schedule.vehicleNumber || !schedule.courseId || !newDate) return;

            setLoadingSlots(true);
            setAvailableSlots([]);
            setSelectedSlot('');
            setRescheduleError('');

            try {
                const params = {
                    instructorId: schedule.instructorId,
                    vehicleNumber: schedule.vehicleNumber,
                    date: newDate,
                    slotDurationHours: schedule.durationPerDayHours || 1, // Use existing duration
                    courseId: schedule.courseId,
                    isPickAndDrop: schedule.pickAndDrop // Required for slot calculation
                };
                
                const response = await axios.get(AVAILABLE_SLOTS_URL, { headers, params });
                
                setAvailableSlots(response.data);
                if (response.data.length > 0) {
                    setSelectedSlot(response.data[0]);
                }
            } catch (err) {
                console.error("Error fetching available slots:", err);
                setRescheduleError('Failed to fetch slots. Check if parameters are correct.');
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [newDate, schedule, token]);

    const handleReschedule = async () => {
    if (!selectedSlot) {
        setRescheduleError('Please select an available time slot.');
        return;
    }

    setRescheduleError('');

    try {
        // 1. 🚀 CRITICAL FIX: Extract only the start time (HH:mm) from the selected slot value.
        // Assumes slot value is either "HH:mm" or "HH:mm - HH:mm"
        const startTimeOnly = selectedSlot.split(' ')[0]; // Takes "15:00" from "15:00 - 16:00"
        
        // Final start time format for the API (HH:mm:ss)
        const finalStartTime = startTimeOnly + ':00'; 

        // 2. Calculate newEndTime based on startTimeOnly and durationPerDayHours
        const [startHour, startMinute] = startTimeOnly.split(':').map(Number);
        const durationHours = schedule.durationPerDayHours || 1; 
        
        let endHour = startHour + durationHours;
        let endMinute = startMinute;

        if (endHour >= 24) {
            endHour %= 24; 
        }

        // Format newEndTime as HH:mm:ss
        const newEndTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`; 
        
        // 3. Define URL parameters for @RequestParam
        const params = {
            newDate: newDate,
            newStartTime: finalStartTime, // Use the cleaned start time
            newEndTime: newEndTime, 
        };
        
        // 4. Send the request
        await axios.patch(
            `${RESCHEDULE_URL_BASE}/${schedule.id}`, 
            null, 
            { 
                headers, 
                params
            }
        );
        
        onRescheduleSuccess(`Schedule ${schedule.id} successfully rescheduled to ${newDate} from ${startTimeOnly}.`);
        onClose();

    } catch (err) {
        console.error('Error rescheduling:', err);
        const apiError = err.response?.data?.message || 'Reschedule failed. Please try again.';
        setRescheduleError(apiError);
    }
};

    if (!schedule) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-indigo-700">📅 Reschedule Lesson (ID: {schedule.id})</h2>
                
                <p className="mb-4 text-sm text-gray-600">
                    **Current:** {schedule.date} at {schedule.startTime} with {schedule.instructorName}.
                </p>

                <div className="space-y-4">
                    {/* Date Picker */}
                    <div>
                        <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">
                            Choose New Date
                        </label>
                        <input
                            type="date"
                            id="newDate"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={todayDate}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1"
                        />
                    </div>

                    {/* Slot Picker */}
                    <div>
                        <label htmlFor="slot" className="block text-sm font-medium text-gray-700">
                            Select Available Time Slot (Duration: {schedule.durationPerDayHours || 1}hr)
                        </label>
                        <select
                            id="slot"
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={loadingSlots || availableSlots.length === 0}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1 disabled:bg-gray-100"
                        >
                            {loadingSlots ? (
                                <option>Loading slots...</option>
                            ) : availableSlots.length === 0 ? (
                                <option>No slots available</option>
                            ) : (
                                availableSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {rescheduleError && (
                    <p className="text-red-500 text-sm mt-3">{rescheduleError}</p>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReschedule}
                        disabled={loadingSlots || !selectedSlot}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Confirm Reschedule
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RescheduleModal;