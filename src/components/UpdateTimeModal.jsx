// src/components/UpdateTimeModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/constants';

const AVAILABLE_SLOTS_URL = `${API_BASE}/schedules/available-slots`;
const UPDATE_TIME_URL = `${API_BASE}/schedules/update-time/all`;

const formatDate = (date) => new Date(date).toISOString().split('T')[0];
const todayDate = formatDate(new Date());

function UpdateTimeModal({ schedule, onClose, onUpdateSuccess }) {
    const { token } = useAuth();
    // Use the *current* schedule date to query available slots for today, but the API logic 
    // is to update all PENDING days, not just today's.
    const dateForSlotQuery = todayDate; 
    const [selectedSlot, setSelectedSlot] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch available slots (querying for today's date for simplicity, assuming any slot is valid for pending days)
    useEffect(() => {
        const fetchSlots = async () => {
            if (!schedule.instructorId || !schedule.vehicleNumber || !schedule.courseId) return;

            setLoadingSlots(true);
            setAvailableSlots([]);
            setSelectedSlot('');
            setUpdateError('');

            try {
                const params = {
                    // This query only needs to ensure the slot is generally available for this resource group
                    instructorId: schedule.instructorId,
                    vehicleNumber: schedule.vehicleNumber,
                    date: dateForSlotQuery, // Query today's slots
                    slotDurationHours: schedule.durationPerDayHours || 1, 
                    courseId: schedule.courseId,
                    isPickAndDrop : schedule.pickAndDrop
               
                };
                
                const response = await axios.get(AVAILABLE_SLOTS_URL, { headers, params });
                
                setAvailableSlots(response.data);
                if (response.data.length > 0) {
                    setSelectedSlot(response.data[0]);
                }
            } catch (err) {
                console.error("Error fetching available slots:", err);
                // Catching errors to handle potentially problematic slot formats from the API
                setUpdateError('Failed to fetch slots. Please ensure slot data is correctly formatted (HH:mm or HH:mm - HH:mm).');
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [schedule, token, dateForSlotQuery]);

    const handleUpdateTime = async () => {
        if (!selectedSlot) {
            setUpdateError('Please select a new start time.');
            return;
        }

        setUpdateError('');

        try {
            // 🚀 CRITICAL FIX: Extract only the start time (HH:mm) from the selected slot value
            // This handles cases where the slot is a range (e.g., "15:00 - 16:00")
            const startTimeOnly = selectedSlot.split(' ')[0]; 

            // Format the time as HH:mm:ss for the LocalTime parameter in Spring
            const newStartTimeFormatted = startTimeOnly + ':00'; 

            const params = {
                vehicleNumber: schedule.vehicleNumber,
                newStartTime: newStartTimeFormatted,
                isPickAndDrop : schedule.pickAndDrop // Use the cleaned, formatted time
            };

            await axios.patch(UPDATE_TIME_URL, null, { headers, params });
            
            onUpdateSuccess(`Successfully updated the start time for all pending sessions on vehicle ${schedule.vehicleNumber} to ${startTimeOnly}.`);
            onClose();

        } catch (err) {
            console.error('Error updating time:', err);
            // Check for specific conversion error and provide a user-friendly message
            const apiError = err.response?.data?.message || 'Update failed. Please check the time format and server logs.';
            setUpdateError(apiError);
        }
    };

    if (!schedule) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-indigo-700">⏱️ Update Time for Pending Lessons</h2>
                
                <p className="mb-4 text-sm text-gray-600">
                    **Vehicle:** {schedule.vehicleNumber} ({schedule.vehicleName})
                </p>
                <p className="mb-4 text-sm text-red-600 font-medium">
                    This action will update the **start time** for ALL future, pending lessons associated with this vehicle.
                </p>

                <div className="space-y-4">
                    {/* Slot Picker */}
                    <div>
                        <label htmlFor="slot" className="block text-sm font-medium text-gray-700">
                            Select New Start Time
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

                {updateError && (
                    <p className="text-red-500 text-sm mt-3">{updateError}</p>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdateTime}
                        disabled={loadingSlots || !selectedSlot}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Confirm Update Time
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdateTimeModal;