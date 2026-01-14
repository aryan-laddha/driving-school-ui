import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    PencilSquareIcon, TrashIcon, UserGroupIcon,
    ArrowPathIcon, CalendarDaysIcon, XMarkIcon,
    ClockIcon, PlusIcon, ExclamationTriangleIcon,
    FunnelIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getToken } from '../utils/auth';
import ScheduleModal from '../components/ScheduleModal';
import UpdateModal from '../components/UpdateModal';

// --- API and Utility Imports ---
import {
    CUSTOMERS_URL,
    COURSES_URL,
    VEHICLES_URL,
    USERS_URL
} from '../api/constants';
import { VEHICLE_TYPES } from '../utils/constants';

// Derive SCHEDULES_URL from CUSTOMERS_URL
const SCHEDULES_URL = CUSTOMERS_URL.replace(/\/customers\/?$/, '/schedules');

// --- Tab definitions for customer filtering ---
const TABS = {
    ACTIVE: 'Active Customers',
    INACTIVE: 'Inactive/Deactivated',
};

// Initial state for the customer being edited
const initialEditState = {
    id: null,
    name: '',
    contact: '',
    courseId: '',
    vehicleNumber: '',
    assignedInstructorId: '',
    pickAndDrop: false,
    preferredStartTime: ''
};

function ManageCustomers() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [instructors, setInstructors] = useState([]);

    const [loading, setLoading] = useState(true);

    // Filter States
    const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Update state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editCustomer, setEditCustomer] = useState(initialEditState);

    // Time Slot Logic
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ... existing state ...
    const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
    const [currentSchedules, setCurrentSchedules] = React.useState([]);
    const [isLoadingSchedules, setIsLoadingSchedules] = React.useState(false);
    const [selectedCustomerName, setSelectedCustomerName] = React.useState('');


    // --- Data Fetching ---
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const token = getToken();
        if (!token) return toast.error("Authentication required.");
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 1. Fetch Customers
            const customersRes = await fetch(CUSTOMERS_URL, { headers });
            const customersData = await customersRes.json();
            if (customersData.success) {
                setCustomers(customersData.data);
            } else {
                toast.error("Failed to load customers.");
            }

            // 2. Fetch Courses
            const coursesRes = await fetch(COURSES_URL, { headers });
            const coursesData = await coursesRes.json();
            if (coursesData.success) {
                setCourses(coursesData.data.filter(c => c.active));
            }

            // 3. Fetch Vehicles
            const vehiclesRes = await fetch(VEHICLES_URL, { headers });
            const vehiclesData = await vehiclesRes.json();
            if (vehiclesData.success) {
                setVehicles(vehiclesData.data.filter(v => v.active));
            }

            // 4. Fetch Instructors
            const usersRes = await fetch(USERS_URL, { headers });
            const usersData = await usersRes.json();
            if (usersData.success) {
                const instructorList = usersData.data.filter(u =>
                    (u.role === 'USER' || u.role === 'ADMIN') && u.access && !u.deleted
                );
                setInstructors(instructorList);
            }

        } catch (error) {
            console.error('Data fetch error:', error);
            toast.error('Error fetching data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);


    // --- Fetch Available Slots Logic ---
    const fetchAvailableSlots = useCallback(async () => {
        if (!editCustomer.id || !editCustomer.assignedInstructorId || !editCustomer.vehicleNumber) {
            return;
        }

        setLoadingSlots(true);
        const token = getToken();

        try {
            const response = await fetch(`${SCHEDULES_URL}/available-slots-for-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerId: editCustomer.id,
                    newInstructorId: editCustomer.assignedInstructorId,
                    newVehicleNumber: editCustomer.vehicleNumber,
                    pickAndDrop: editCustomer.pickAndDrop
                }),
            });

            if (response.ok) {
                const slots = await response.json();
                setAvailableSlots(slots);
            } else {
                console.error("Failed to fetch slots");
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [editCustomer.id, editCustomer.assignedInstructorId, editCustomer.vehicleNumber, editCustomer.pickAndDrop]);

    // Trigger slot fetch when dependencies change inside the modal
    useEffect(() => {
        if (isModalOpen) {
            fetchAvailableSlots();
        }
    }, [fetchAvailableSlots, isModalOpen]);


    // --- Filtering Logic ---
    const filteredCustomers = customers.filter(customer => {
        const course = courses.find(c => c.courseId === customer.courseId);

        // 1. Tab Filter
        if (activeTab === TABS.ACTIVE && !customer.active) return false;
        if (activeTab === TABS.INACTIVE && customer.active) return false;

        // 2. Course Filter
        if (courseFilter !== 'ALL' && customer.courseId !== Number(courseFilter)) return false;

        // 3. Vehicle Type Filter
        if (vehicleTypeFilter !== 'ALL' && course && course.vehicleType !== vehicleTypeFilter) return false;

        // 4. Search Filter
        const term = searchTerm.toLowerCase().trim();
        if (term.length > 0) {
            if (
                !customer.name.toLowerCase().includes(term) &&
                !customer.contact.toLowerCase().includes(term)
            ) return false;
        }

        return true;
    });

    // --- Handlers ---

    const handleEditClick = (customer) => {
        const course = courses.find(c => c.courseName === customer.courseName);
        const instructor = instructors.find(i => i.name === customer.assignedInstructorName);
        const vehicle = vehicles.find(v => v.vehicleNumber === customer.vehicleNumber);

        setEditCustomer({
            id: customer.id,
            name: customer.name,
            contact: customer.contact,
            courseId: course ? course.courseId : '',
            vehicleNumber: vehicle ? vehicle.vehicleNumber : '',
            assignedInstructorId: instructor ? instructor.id : '',
            pickAndDrop: customer.pickAndDrop || false,
            preferredStartTime: customer.preferredStartTime || ''
        });
        setIsModalOpen(true);
    };

    const handleModalChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditCustomer(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'assignedInstructorId' ? Number(value) : value),
        }));
    };

    const vehiclesForModal = editCustomer.courseId
        ? vehicles.filter(v =>
            v.vehicleType === courses.find(c => c.courseId === editCustomer.courseId)?.vehicleType
        )
        : vehicles;


    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const token = getToken();

        if (!editCustomer.assignedInstructorId || !editCustomer.vehicleNumber || !editCustomer.preferredStartTime) {
            toast.error("Please select Instructor, Vehicle, and a valid Time Slot.");
            setIsUpdating(false);
            return;
        }

        try {
            const response = await fetch(`${SCHEDULES_URL}/bulk-update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerId: editCustomer.id,
                    newInstructorId: editCustomer.assignedInstructorId,
                    newVehicleNumber: editCustomer.vehicleNumber,
                    newStartTime: editCustomer.preferredStartTime,
                    pickAndDrop: editCustomer.pickAndDrop
                }),
            });

            const textResult = await response.text();

            if (response.ok) {
                let successMsg = "Schedule updated successfully!";
                try {
                    const parsed = JSON.parse(textResult);
                    if (typeof parsed === 'object' && parsed.message) successMsg = parsed.message;
                    else if (typeof parsed === 'string') successMsg = parsed;
                    else if (textResult) successMsg = textResult;
                } catch (e) {
                    if (textResult) successMsg = textResult;
                }

                toast.success(successMsg);
                fetchAllData();
                setIsModalOpen(false);
            } else {
                let errorMsg = "Update failed. Conflict detected.";
                try {
                    const parsed = JSON.parse(textResult);
                    if (parsed && parsed.message) errorMsg = parsed.message;
                    else if (textResult) errorMsg = textResult;
                } catch (e) {
                    if (textResult) errorMsg = textResult;
                }
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('An unexpected error occurred during update.');
        } finally {
            setIsUpdating(false);
        }
    };

   const handleSoftDelete = async (id, name, isActive) => {
    const actionType = isActive ? 'deactivate' : 'reactivate';
    
    // 1. Create the custom confirmation toast
    toast((t) => (
        <span>
            <b>{isActive ? 'Deactivate' : 'Reactivate'} {name}?</b>
            {isActive && <p style={{ fontSize: '12px', margin: '5px 0' }}>All future schedules will be deleted.</p>}
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <button
                    onClick={async () => {
                        toast.dismiss(t.id); // Close confirmation toast
                        await executeSoftDelete(id, name, isActive); // Call execution logic
                    }}
                    style={{ background: '#ff4b4b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Confirm
                </button>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Cancel
                </button>
            </div>
        </span>
    ), { 
        position: 'top-center',
        }); // Give user time to read
};

// 2. Separate the API logic into its own function
const executeSoftDelete = async (id, name, isActive) => {
    const actionType = isActive ? 'deactivate' : 'reactivate';
    const token = getToken();
    const endpoint = `/soft-delete/${id}`;
    const loadingToast = toast.loading(`${isActive ? 'Deactivating' : 'Reactivating'}...`);

    try {
        const response = await fetch(`${CUSTOMERS_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const result = await response.json();

        if (result.success) {
            toast.success(`Customer ${name} ${isActive ? 'deactivated' : 'reactivated'}.`, { id: loadingToast });
            fetchAllData();
        } else {
            toast.error(result.message || `${actionType} failed.`, { id: loadingToast });
        }
    } catch (error) {
        console.error(`${actionType} error:`, error);
        toast.error(`An error occurred during ${actionType}.`, { id: loadingToast });
    }
};

    const handleHardDelete = async (id, name) => {
        const confirmationMessage = `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE customer: ${name}?`;
        if (!window.confirm(confirmationMessage)) return;

        const token = getToken();
        try {
            const response = await fetch(`${CUSTOMERS_URL}/${id}/hard-delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const result = await response.json();
            if (result.success) {
                toast.success(`Customer ${name} permanently deleted.`);
                fetchAllData();
            } else {
                toast.error(result.message || "Deletion failed.");
            }
        } catch (error) {
            console.error('Hard delete error:', error);
            toast.error('An error occurred.');
        }
    };

    const handleViewSchedule = async (customerId, customerName) => {
        // 1. Open Modal and set loading state
        setSelectedCustomerName(customerName);
        setIsScheduleModalOpen(true);
        setIsLoadingSchedules(true);
        setCurrentSchedules([]); // Clear previous data

        const token = getToken(); // Use your existing utility function

        // Ensure token exists before proceeding with an authenticated call
        if (!token) {
            toast.error("Authentication required to view schedules.");
            setIsLoadingSchedules(false);
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // 2. Fetch Data with Authorization Header
            const response = await fetch(`${CUSTOMERS_URL}/${customerId}/schedules`, {
                headers: headers
            });

            // Handle HTTP errors (like 401 Unauthorized)
            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `Failed to fetch schedules: HTTP ${response.status}`;

                try {
                    const parsedError = JSON.parse(errorText);
                    if (parsedError && parsedError.message) {
                        errorMsg = parsedError.message;
                    }
                } catch (e) {
                    // Ignore JSON parse error if response is not JSON
                    if (errorText) errorMsg = errorText;
                }

                toast.error(errorMsg);
                throw new Error(errorMsg);
            }

            const result = await response.json();

            if (result.success) {
                setCurrentSchedules(result.data);
            } else {
                console.error("Failed to fetch schedules:", result.message);
                toast.error(result.message || "Failed to load schedules.");
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
            // If the error wasn't already shown by toast.error, show a generic one
            if (!isScheduleModalOpen) {
                toast.error("An unexpected error occurred while fetching schedules.");
            }
        } finally {
            // 3. Stop loading
            setIsLoadingSchedules(false);
        }
    };


    const handleRedirectToEnroll = () => {
        navigate('/admin/enroll-customer');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        } catch (e) { return 'Invalid Date'; }
    };

    const formatTimeSlot = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A';
        try {
            const options = { hour: 'numeric', minute: '2-digit', hour12: true };
            const start = new Date(`2000/01/01 ${startTime}`);
            const end = new Date(`2000/01/01 ${endTime}`);
            return `${start.toLocaleTimeString('en-IN', options)} - ${end.toLocaleTimeString('en-IN', options)}`;
        } catch (e) { return 'Invalid Time'; }
    };


    // --- Render ---

    if (loading) {
        return <div className="p-8 text-center text-xl text-gray-600 font-medium animate-pulse">Loading customer data...</div>;
    }

    const COL_SPAN = 11; // Reduced by 1 since we removed the specific Schedule column


    const confirmAction = (message, onConfirm) => {
    toast.custom((t) => (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-indigo-600`}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            Confirm Action
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={() => {
                        onConfirm();
                        toast.dismiss(t.id);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                >
                    Yes
                </button>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                >
                    No
                </button>
            </div>
        </div>
    ), { duration: Infinity }); // Keeps it open until user interacts
};

    return (
        <div className="p-4 md:p-8 bg-white rounded-lg shadow-xl max-w-[100vw] overflow-hidden">
            <Toaster position="bottom-center" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                    <UserGroupIcon className="w-8 h-8 mr-3 text-indigo-600" /> Manage Customers
                </h2>
                <button
                    onClick={handleRedirectToEnroll}
                    className="w-full md:w-auto px-5 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center justify-center font-semibold shadow-sm"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Add New
                </button>
            </div>

            {/* Controls Section - Fully Responsive */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4 items-center">

                    {/* Search - Grows on large screens */}
                    <div className="relative w-full lg:flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                        />
                    </div>

                    {/* Filters & Actions - Stack on mobile, Row on large */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-48">
                            <FunnelIcon className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                            <select
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm appearance-none"
                            >
                                <option value="ALL">All Courses</option>
                                {courses.map(course => (
                                    <option key={course.courseId} value={course.courseId}>{course.courseName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-full sm:w-48">
                            <FunnelIcon className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                            <select
                                value={vehicleTypeFilter}
                                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm appearance-none"
                            >
                                <option value="ALL">All Types</option>
                                {VEHICLE_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={fetchAllData}
                            className="w-full sm:w-auto px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center justify-center font-medium shadow-sm"
                        >
                            <ArrowPathIcon className="w-4 h-4 mr-2 text-gray-500" /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs - Scrollable on Mobile */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
                    {Object.values(TABS).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                        >
                            {tab} <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                {tab === TABS.ACTIVE
                                    ? customers.filter(c => c.active).length
                                    : customers.filter(c => !c.active).length}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Customer Table - Horizontal Scroll Only */}

            <div className="relative bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                {/* Table scroll wrapper */}
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">ID</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Service & Address</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Course</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Instructor</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Vehicle</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Time Slot</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Dates</th>
                                <th className="px-3 py-3.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                                <th className="px-3 py-3.5 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={COL_SPAN} className="px-3 py-8 text-center text-gray-500 text-sm">
                                        No customers found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className={`hover:bg-gray-50 transition-colors ${customer.active ? '' : 'bg-red-50/40'}`}
                                    >
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">{customer.id}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{customer.name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{customer.contact}</td>
                                        <td className="px-3 py-4 text-sm text-gray-700 max-w-xs">
                                            <div className="flex flex-col gap-1">
                                                {/* Pick & Drop Badge */}
                                                {customer.pickAndDrop ? (
                                                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                                        🚗 Pick & Drop
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                                        📍 At Center
                                                    </span>
                                                )}

                                                {/* Address Text */}
                                                <span className="truncate hover:whitespace-normal transition-all" title={customer.address}>
                                                    {customer.address || <span className="text-gray-400 italic">No address</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{customer.courseName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">{customer.assignedInstructorName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                                            {customer.vehicleName} ({customer.vehicleNumber})
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                            <div className="flex items-center space-x-1">
                                                <span className="font-medium">
                                                    {formatTimeSlot(customer.preferredStartTime, customer.preferredEndTime)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                                            <div className="flex flex-col text-xs">
                                                <span className="text-green-700">S: {formatDate(customer.startDate)}</span>
                                                <span className="text-red-700">E: {formatDate(customer.endDate)}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span
                                                className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full ${customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {customer.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                            <div className="flex items-center justify-center space-x-3">
                                                {/* View Schedule */}
                                                <button
                                                    onClick={() => handleViewSchedule(customer.id, customer.name)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                    title="View Schedule"
                                                >
                                                    <CalendarDaysIcon className="w-5 h-5" />
                                                </button>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => handleEditClick(customer)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="Edit Resources"
                                                >
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                {/* Soft Delete / Reactivate */}
                                                <button
                                                    onClick={() => handleSoftDelete(customer.id, customer.name, customer.active)}
                                                    className={`${customer.active
                                                            ? 'text-orange-600 hover:text-orange-900'
                                                            : 'text-green-600 hover:text-green-900'
                                                        } transition-colors`}
                                                    title={customer.active ? 'Deactivate' : 'Reactivate'}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                                {/* Hard Delete (only if inactive) */}
                                                {!customer.active && (
                                                    <button
                                                        onClick={() => handleHardDelete(customer.id, customer.name)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Permanent Delete"
                                                    >
                                                        <ExclamationTriangleIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* --- UPDATE MODAL (Unchanged logic, slightly improved style) --- */}
            <UpdateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editCustomer={editCustomer}
                instructors={instructors}
                vehiclesForModal={vehiclesForModal}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                isUpdating={isUpdating}
                handleModalChange={handleModalChange}
                handleUpdateSubmit={handleUpdateSubmit}
            />

            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                schedules={currentSchedules}
                loading={isLoadingSchedules}
                customerName={selectedCustomerName}
            />
        </div>
    );
}

export default ManageCustomers;