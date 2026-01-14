// src/api/constants.js

/**
 * Base URL for all API calls.
 */
// export const API_BASE = 'http://localhost:8080/api';
export const API_BASE = 'https://driving-school-application.onrender.com/api';

/**
 * Endpoints for Customer Management.
 */
export const CUSTOMERS_URL = `${API_BASE}/customers`;

/**
 * Endpoints for Course, Vehicle, and User data needed for dropdowns.
 */
export const COURSES_URL = `${API_BASE}/courses`;
export const VEHICLES_URL = `${API_BASE}/vehicles`;
export const USERS_URL = `${API_BASE}/auth/users`;
export const SLOTS_URL = `${API_BASE}/schedules/available-slots`;
export const SCHEDULES_URL = `${API_BASE}/schedules`;