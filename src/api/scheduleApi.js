// src/api/scheduleApi.js
import axios from 'axios';
import { getToken } from '../utils/auth';
import { API_BASE } from './constants';

const API_URL = 'http://localhost:8080/api/schedules';

// Helper function to get authorization headers
const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
});

/**
 * Fetches the daily schedule for a specific instructor.
 * @param {number} instructorId - The ID of the instructor (logged-in user).
 * @param {string} date - The date in YYYY-MM-DD format (e.g., "2025-11-22").
 * @returns {Promise<Array>} A promise that resolves to the list of schedule items.
 */
export const fetchInstructorDailySchedule = async (instructorId, date) => {
  try {
    const response = await axios.get(
      `${API_URL}/instructor/${instructorId}`,
      {
        params: { date },
        headers: authHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching instructor schedule:', error);
    // You might want to throw a custom error or handle specific status codes
    throw new Error('Could not retrieve instructor schedule.');
  }
};


/**
 * Updates the status of a specific schedule entry.
 * Corresponds to PATCH /api/schedules/update-status/{scheduleId}?status={status}
 * @param {number} scheduleId - The ID of the schedule entry to update.
 * @param {string} status - The new status (e.g., "COMPLETED", "CANCELLED").
 * @returns {Promise<Object>} A promise that resolves to the updated schedule object.
 */
export const updateScheduleStatus = async (scheduleId, status) => {
    try {
        const response = await axios.patch(
            `${API_URL}/update-status/${scheduleId}`,
            null, // Request body is null for this PATCH
            {
                params: { status },
                headers: authHeader(),
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating status for schedule ID ${scheduleId}:`, error);
        throw new Error('Could not update schedule status.');
    }
};