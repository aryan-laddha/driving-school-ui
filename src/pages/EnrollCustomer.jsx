import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlusIcon, CalendarDaysIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
// IMPORTANT: Relying on external definition of getToken() from ../utils/auth
import { getToken } from '../utils/auth';
import { API_BASE } from '../api/constants';

// API Base URLs
//const API_BASE = 'http://localhost:8080/api';
const CUSTOMER_ENROLL_URL = `${API_BASE}/customers/enroll`;
const USERS_URL = `${API_BASE}/auth/users`;
const COURSES_URL = `${API_BASE}/courses`;
const VEHICLES_URL = `${API_BASE}/vehicles`;
const SLOTS_URL = `${API_BASE}/schedules/available-slots`;
const CALCULATE_DISTANCE_URL = `${API_BASE}/customers/calculate-distance`;



// Payment Types for dropdown
const PAYMENT_TYPES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI/Online' },
    { value: 'CARD', label: 'Card' },
];

const ORS_API_KEY = '';

function EnrollCustomer() {
    // --- State Management ---
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        address: '',
        courseId: '',
        vehicleNumber: '',
        instructorId: '',
        startDate: '',
        preferredStartTime: '',
        // NEW FIELDS
        pickAndDrop: false,
        extraCharges: '',
        discount: '',
        initialPayment: '', // Required amount paid
        paymentType: '',    // CASH, UPI, CARD
    });
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]); // Will hold filtered instructors
    const [allVehicles, setAllVehicles] = useState([]); // Store all active vehicles
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotLoading, setSlotLoading] = useState(false);
    const [distanceKm, setDistanceKm] = useState(null);
    const [distanceLoading, setDistanceLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const debounceTimer = useRef(null);
    const DEFAULT_FROM = "Pune Station";



    const calculateDistance = async (toAddress) => {
        if (!toAddress || toAddress.trim() === "") {
            setDistanceKm(null);
            return;
        }

        setDistanceLoading(true);
        const token = getToken();

        try {
            const response = await fetch(CALCULATE_DISTANCE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: toAddress }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const km = result.data.distanceKm;
                setDistanceKm(km);

                // Auto-update extra charges if pick and drop is enabled
                if (formData.pickAndDrop) {
                    updatePickAndDropCharges(km);
                }
            } else {
                toast.error(result.message || "Failed to calculate distance");
                setDistanceKm(null);
            }
        } catch (error) {
            console.error('Distance calculation error:', error);
            toast.error("Network error while calculating distance");
        } finally {
            setDistanceLoading(false);
        }
    };

    const updatePickAndDropCharges = (km) => {
        let extra = 0;
        // Example Logic: If distance > 5km, charge 10 per extra km
        if (km > 5) {
            extra = Math.round((km - 5) * 10);
        }
        setFormData(prev => ({ ...prev, extraCharges: extra }));
    };

    // --- Derived State (Memoized for efficiency) ---
    const selectedCourse = useMemo(() => {
        return courses.find(c => c.courseId === Number(formData.courseId));
    }, [courses, formData.courseId]);


    const coursePrice = selectedCourse ? Number(selectedCourse.price) : 0; // NEW
    const extraCharges = formData.extraCharges ? Number(formData.extraCharges) : 0; // NEW
    const discount = formData.discount ? Number(formData.discount) : 0; // NEW

    const totalPrice = useMemo(() => {
        return coursePrice + extraCharges - discount;  // NEW
    }, [coursePrice, extraCharges, discount]);


    // Filtered Vehicles: Only show vehicles that match the selected course's vehicle type
    const filteredVehicles = useMemo(() => {
        if (!selectedCourse) {
            return [];
        }
        return allVehicles.filter(v => v.vehicleType === selectedCourse.vehicleType);
    }, [allVehicles, selectedCourse]);


    // --- Data Fetching (Dropdowns) ---
    const fetchDropdownData = useCallback(async () => {
        const token = getToken();
        if (!token) {
            toast.error("Authentication token missing. Please log in.");
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        // Helper function to handle fetch and error parsing
        const safeFetch = async (url, type) => {
            const res = await fetch(url, { headers });

            if (!res.ok) {
                let errorDetails = `Failed to fetch ${type} (Status: ${res.status}).`;
                try {
                    const errorJson = await res.json();
                    errorDetails = errorJson.message || errorDetails;
                } catch (e) {
                    // Fallback if response is not valid JSON
                }
                toast.error(errorDetails);
                throw new Error(errorDetails);
            }

            const data = await res.json();
            if (!data.success) {
                toast.error(`Failed to fetch ${type}: ${data.message || 'API reported failure.'}`);
                return null;
            }
            return data.data;
        };

        try {
            // Fetch Courses
            const courseData = await safeFetch(COURSES_URL, 'courses');
            if (courseData) {
                setCourses(courseData.filter(c => c.active));
            }

            // Fetch Instructors
            const userData = await safeFetch(USERS_URL, 'instructors');
            if (userData) {
                // Filter users to include only active 'USER' or 'ADMIN' roles
                setInstructors(userData.filter(u =>
                    (u.role === 'USER' || u.role === 'ADMIN') && u.access && !u.deleted
                ));
            }

            // Fetch Vehicles (store all)
            const vehicleData = await safeFetch(VEHICLES_URL, 'vehicles');
            if (vehicleData) {
                setAllVehicles(vehicleData.filter(v => v.active));
            }

        } catch (error) {
            console.error('Data fetch error:', error);
            // General catch for critical failure
        }
    }, []);


    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let newValue = type === 'checkbox' ? checked : value;

        let newFormData = { ...formData, [name]: newValue };

        // Reset schedule fields when course or vehicle/instructor/date changes
        const resetFields = [];
        if (['courseId'].includes(name)) {
            resetFields.push('vehicleNumber', 'startDate', 'preferredStartTime');
        }
        if (['vehicleNumber', 'instructorId', 'startDate'].includes(name)) {
            resetFields.push('preferredStartTime');
        }

        resetFields.forEach(field => {
            newFormData[field] = '';
        });

        setFormData(newFormData);

        if (resetFields.length > 0) {
            setAvailableSlots([]);
        }

        // Trigger distance calculation if address changed (with debounce)
        if (name === 'pickAndDrop') {
            if (newValue && distanceKm) {
                updatePickAndDropCharges(distanceKm);
            } else if (!newValue) {
                setFormData(prev => ({ ...prev, pickAndDrop: false, extraCharges: 0 }));
                return; // Exit to avoid double state setting
            }
        }

        if (name === 'address') {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => calculateDistance(newValue), 1000);
        }

    };

    // --- Slot Fetching Logic ---
    const fetchAvailableSlots = useCallback(async () => {
        const { vehicleNumber, instructorId, startDate, courseId, pickAndDrop } = formData;

        // 1. Check for required fields
        if (!selectedCourse || !vehicleNumber || !instructorId || !startDate || !courseId) {
            setAvailableSlots([]);
            return toast.error("Please select a Course, Vehicle, Instructor, and Start Date first.");
        }

        // 2. Determine slot duration
        const slotDurationHours = selectedCourse.durationPerDayHours;

        // 3. API Call Setup
        setSlotLoading(true);
        const token = getToken(); // Get the proper token
        if (!token) {
            setSlotLoading(false);
            return toast.error("Authentication token is missing. Cannot fetch slots.");
        }

        const url = new URL(SLOTS_URL, window.location.origin);
        url.searchParams.append('instructorId', instructorId);
        url.searchParams.append('vehicleNumber', vehicleNumber);
        url.searchParams.append('date', startDate);
        url.searchParams.append('slotDurationHours', slotDurationHours);
        url.searchParams.append('courseId', courseId); // Pass courseId
        url.searchParams.append('isPickAndDrop', pickAndDrop);

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(url.toString(), { headers });

            if (!response.ok) {
                // Robust error handling to catch 401 and extract detailed message
                let errorDetails = `Failed to fetch slots (Status: ${response.status}).`;
                try {
                    const errorBody = await response.json();
                    errorDetails = errorBody.message || errorBody.error || errorDetails;
                } catch (e) {
                    // Ignore JSON parsing errors if the response wasn't JSON
                }
                throw new Error(errorDetails);
            }

            const result = await response.json();

            // Assuming the result is an array of slots directly, or result.data
            const slots = Array.isArray(result) ? result : (result.data || []);
            setAvailableSlots(slots);

            if (slots.length === 0) {
                toast.success("No available slots found for the selected criteria.");
            } else {
                toast.success(`${slots.length} slot(s) loaded.`);
            }

        } catch (error) {
            console.error('Slot fetch error:', error);
            // Display the specific error message, including the 401 details
            toast.error(`Error fetching available time slots: ${error.message || 'Check network connection.'}`);
        } finally {
            setSlotLoading(false);
        }
    }, [formData, selectedCourse]);

    // Effect to auto-fetch slots when inputs change (excluding time slot itself)
    useEffect(() => {
        const { courseId, vehicleNumber, instructorId, startDate, preferredStartTime } = formData;
        if (courseId && vehicleNumber && instructorId && startDate && !preferredStartTime) {
            fetchAvailableSlots();
        }
    }, [formData.vehicleNumber, formData.instructorId, formData.startDate, formData.courseId, fetchAvailableSlots]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = getToken();

        // Basic client-side validation for required fields
        if (!selectedCourse) {
            toast.error("Invalid course data. Cannot enroll.");
            setSubmitting(false);
            return;
        }
        if (!token) {
            toast.error("Authentication token missing. Cannot enroll.");
            setSubmitting(false);
            return;
        }
        if (!formData.initialPayment || !formData.paymentType) {
            toast.error("Please fill out the required payment details (Initial Payment and Payment Type).");
            setSubmitting(false);
            return;
        }

        const initialAmt = Number(formData.initialPayment);
        if (initialAmt > totalPrice) {
            toast.error(`Initial payment (₹${initialAmt}) cannot be more than the total payable amount (₹${totalPrice.toFixed(2)}).`);
            setSubmitting(false);
            return;
        }
        // Prepare payload, converting strings to correct numeric types where applicable
        const payload = {
            name: formData.name,
            contact: formData.contact,
            address: formData.address,
            courseId: Number(formData.courseId),
            vehicleNumber: formData.vehicleNumber,
            instructorId: Number(formData.instructorId),
            startDate: formData.startDate,
            // Extract only the start time (e.g., '09:00') from the slot string ('09:00 - 11:00')
            preferredStartTime: formData.preferredStartTime.split(' - ')[0],
            // NEW FIELDS
            pickAndDrop: formData.pickAndDrop,
            // Convert to number, default to 0 if empty or invalid for optional fields
            extraCharges: formData.extraCharges ? Number(formData.extraCharges) : 0,
            discount: formData.discount ? Number(formData.discount) : 0,
            // Required field conversion
            initialPayment: Number(formData.initialPayment),
            paymentType: formData.paymentType,
            // NOTE: customerId is not generated on the client side, backend is assumed to handle it on new enrollment
        };

        try {
            const response = await fetch(CUSTOMER_ENROLL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(result.message);
                // Reset form after successful submission
                setFormData({
                    name: '', contact: '', address: '', courseId: '', vehicleNumber: '',
                    instructorId: '', startDate: '', preferredStartTime: '',
                    pickAndDrop: false, extraCharges: '', discount: '', initialPayment: '', paymentType: ''
                });
                setAvailableSlots([]);
            } else {
                toast.error(result.message || `Enrollment failed (Status: ${response.status}).`);
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            toast.error('An unexpected error occurred during enrollment.');
        } finally {
            setSubmitting(false);
        }
    };

    const isSlotFieldsComplete = formData.courseId && formData.vehicleNumber && formData.instructorId && formData.startDate;

    const isOverpaid = parseFloat(formData.initialPayment || 0) > totalPrice;


    return (
        // Use responsive padding and max-width for overall container
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto my-4 sm:my-8">
            <Toaster position="bottom-center" />

            <h2 className="text-2xl sm:text-4xl font-extrabold text-indigo-700 mb-6 flex items-center border-b pb-4">
                <UserPlusIcon className="w-7 h-7 sm:w-9 sm:h-9 mr-3 text-indigo-500" /> New Customer Enrollment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* --- Section 1: Customer Details --- */}
                    <div className="space-y-4 border border-gray-200 p-4 sm:p-6 rounded-xl bg-gray-50/70 shadow-inner">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2 mb-3">1. Customer Information</h3>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Name"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base"
                        />
                        <input
                            type="tel"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            placeholder="Contact Number (e.g., 9876543210)"
                            required
                            pattern="[0-9]{10}"
                            title="Contact must be a 10-digit number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base"
                        />
                        <div className="relative">
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Customer Address"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base pr-24"
                            />
                            <button
                                type="button"
                                onClick={() => calculateDistance(formData.address)}
                                disabled={distanceLoading || !formData.address}
                                className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md hover:bg-indigo-200 disabled:opacity-50"
                            >
                                {distanceLoading ? '...' : 'Recalculate'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                            {distanceLoading ? (
                                <p className="text-xs text-indigo-600 animate-pulse font-medium">📍 Calculating road distance...</p>
                            ) : distanceKm !== null ? (
                                <p className="text-xs text-gray-700">
                                    Distance: <span className="font-bold text-indigo-600">{distanceKm} km</span> from center.
                                </p>
                            ) : <p className="text-xs text-gray-400">Enter address for distance</p>}
                        </div>

                        <div className="flex items-center pt-2">
                            <input
                                id="pickAndDrop"
                                type="checkbox"
                                name="pickAndDrop"
                                checked={formData.pickAndDrop}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="pickAndDrop" className="ml-2 block text-sm font-medium text-gray-700 select-none">
                                Request Pick-up and Drop-off
                            </label>
                        </div>
                    </div>

                    {/* --- Section 2: Course Selection --- */}
                    <div className="space-y-4 border border-gray-200 p-4 sm:p-6 rounded-xl bg-gray-50/70 shadow-inner">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2 mb-3">2. Course Selection</h3>
                        <select
                            name="courseId"
                            value={formData.courseId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-base"
                        >
                            <option value="">-- Select Course --</option>
                            {courses.map(course => (
                                <option key={course.courseId} value={course.courseId}>
                                    {course.courseName} ({course.vehicleType.replace('_', ' ')}) - ₹{course.price.toFixed(0)}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500">
                            Vehicle Type Required:
                            <span className="font-semibold text-indigo-600 ml-1">
                                {selectedCourse ? selectedCourse.vehicleType.replace('_', ' ') : 'N/A'}
                            </span>
                        </p>

                        {selectedCourse && (
                            <p className="text-md text-indigo-700 font-semibold mt-3">
                                Course Price: ₹{selectedCourse.price.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>

                {/* --- Section 3: Schedule Planning --- */}
                <div className="border border-yellow-300 p-4 sm:p-6 rounded-xl bg-yellow-50/50 space-y-4 shadow-lg">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center border-b pb-2 mb-3">
                        <CalendarDaysIcon className="w-6 h-6 mr-2 text-indigo-600" /> 3. Schedule Setup
                    </h3>

                    {/* Adjusted grid for better mobile stacking: grid-cols-2 on mobile, grid-cols-4 on md and up */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Instructor Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                            <select
                                name="instructorId"
                                value={formData.instructorId}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            >
                                <option value="">-- Select Instructor --</option>
                                {instructors.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle Dropdown - NOW FILTERED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                            <select
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                                disabled={!selectedCourse}
                                className={`w-full px-3 py-3 border rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 text-base ${!selectedCourse ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            >
                                <option value="">
                                    {selectedCourse ? '-- Select Vehicle --' : '-- Select Course First --'}
                                </option>
                                {filteredVehicles.map(vehicle => (
                                    <option key={vehicle.vehicleNumber} value={vehicle.vehicleNumber}>
                                        {vehicle.vehicleNumber} ({vehicle.vehicleName})
                                    </option>
                                ))}
                                {selectedCourse && filteredVehicles.length === 0 && <option disabled>No vehicles of type {selectedCourse.vehicleType.replace('_', ' ')} available</option>}
                            </select>
                        </div>

                        {/* Start Date Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]} // Min date is today
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                            />
                        </div>

                        {/* Available Slots Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slot</label>
                            <select
                                name="preferredStartTime"
                                value={formData.preferredStartTime}
                                onChange={handleChange}
                                required
                                disabled={!isSlotFieldsComplete || slotLoading}
                                className={`w-full px-3 py-3 border rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 text-base ${slotLoading || !isSlotFieldsComplete ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                            >
                                <option value="">
                                    {slotLoading ? 'Loading slots...' : (isSlotFieldsComplete ? '-- Select Slot --' : '-- Fill Schedule Fields --')}
                                </option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchAvailableSlots}
                        disabled={!isSlotFieldsComplete || slotLoading}
                        className={`mt-2 w-full px-4 py-3 text-white font-semibold rounded-lg shadow-md transition duration-150 text-base ${isSlotFieldsComplete && !slotLoading
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {slotLoading ? 'Fetching...' : 'Check Availability'}
                    </button>
                    {selectedCourse && (
                        <p className="text-xs sm:text-sm text-yellow-700 mt-2 text-center">
                            * The system will search for a **{selectedCourse.durationPerDayHours}-hour slot** based on the selected criteria.
                        </p>
                    )}
                </div>

                {/* --- Section 4: Payment Details (NEW) --- */}
                <div className="border border-green-300 p-4 sm:p-6 rounded-xl bg-green-50/50 space-y-4 shadow-lg">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center border-b pb-2 mb-3">
                        <CurrencyDollarIcon className="w-6 h-6 mr-2 text-green-700" /> 4. Payment Details
                    </h3>
                    {/* Adjusted grid for better mobile stacking: grid-cols-1 on mobile, grid-cols-2 on sm and up */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="bg-white p-3 rounded-lg shadow mb-4 border">
                            <p className="text-lg font-bold text-gray-800">
                                Total Payable Amount:
                                <span className="ml-2 text-green-700">
                                    ₹{totalPrice.toFixed(2)}
                                </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                (Course Price + Extra Charges – Discount)
                            </p>
                        </div>
                        {/* Initial Payment (REQUIRED) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Initial Payment (₹) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="initialPayment"
                                value={formData.initialPayment}
                                onChange={handleChange}
                                placeholder="e.g., 5000"
                                required
                                min="0"
                                max={totalPrice} // HTML5 validation hint
                                step="any"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 text-base transition-colors ${isOverpaid
                                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                    }`}
                            />
                            {isOverpaid && (
                                <p className="text-red-600 text-xs mt-1 font-semibold animate-pulse">
                                    ⚠️ Initial payment cannot exceed ₹{totalPrice.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Payment Type (REQUIRED) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Payment Type <span className="text-red-500">*</span></label>
                            <select
                                name="paymentType"
                                value={formData.paymentType}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 text-base"
                            >
                                <option value="">-- Select Method --</option>
                                {PAYMENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Extra Charges (OPTIONAL) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Extra Charges (₹) (Optional)</label>
                            <input
                                type="number"
                                name="extraCharges"
                                value={formData.extraCharges}
                                onChange={handleChange}
                                placeholder="e.g., 500 (for P&D)"
                                min="0"
                                step="any"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-base"
                            />
                        </div>

                        {/* Discount (OPTIONAL) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹) (Optional)</label>
                            <input
                                type="number"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                placeholder="e.g., 200"
                                min="0"
                                step="any"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-base"
                            />
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 italic mt-3 text-right">
                        Note: The total course price is calculated by the backend.
                    </p>
                </div>


                {/* --- Submit Button --- */}
                <button
                    type="submit"
                    disabled={submitting || !isSlotFieldsComplete || !formData.preferredStartTime || !formData.initialPayment || !formData.paymentType}
                    className={`w-full px-6 py-4 text-lg sm:text-xl font-bold text-white rounded-xl transition duration-200 shadow-xl ${submitting || !isSlotFieldsComplete || !formData.preferredStartTime || !formData.initialPayment || !formData.paymentType
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800 transform hover:scale-[1.005]'
                        }`}
                >
                    {submitting ? 'Enrolling Customer...' : 'Complete Enrollment & Payment'}
                </button>
            </form>
        </div>
    );
}

export default EnrollCustomer;