// src/pages/ManageVehicles.jsx
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { TruckIcon, PlusIcon, ArrowPathIcon, CalendarDaysIcon, PencilSquareIcon, ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline'; 
import { getUserRole, getToken } from '../utils/auth'; 
import AddVehicleSidebar from '../components/AddVehicleSidebar'; 
import VehicleScheduleModal from '../components/VehicleScheduleModal'; 
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';

// const BASE_URL = 'http://localhost:8080/api/vehicles'; 

// --- Tab definitions for the vehicle filtering ---
const TABS = {
    ACTIVE: 'Active Vehicles', 
    INACTIVE: 'Inactive/Deleted',
};

// --- API Utility Function ---
const executeAction = async (endpoint, method = 'POST') => {
    const token = getToken();
    if (!token) {
        throw new Error("Authentication required. Please log in again.");
    }
    
    try {
        const response = await fetch(`${VEHICLES_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();
        
        if (result.success) {
            return result.message;
        } else {
            throw new Error(result.message || "Action failed due to server error."); 
        }
    } catch (error) {
        throw error;
    }
};

// --- Vehicle Card Component for Mobile View ---
const MobileVehicleCard = ({ vehicle, isAdmin, onEdit, onAction, onViewSchedule }) => {
    const isDeleted = !vehicle.active;
    const isTwoWheeler = vehicle.vehicleType === 'TWO_WHEELER';

    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm border mb-4 ${isDeleted ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-3 border-b pb-2 border-gray-100">
                <div>
                    <h3 className={`font-extrabold text-lg ${isDeleted ? 'text-red-700' : 'text-gray-900'}`}>{vehicle.vehicleNumber}</h3>
                    <p className="text-sm text-gray-600">{vehicle.vehicleName}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                    vehicle.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {vehicle.active ? 'Active' : 'Retired'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className={`p-2 rounded-lg text-center ${isTwoWheeler ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <span className="text-xs text-gray-500 font-bold uppercase block">Type</span>
                    <span className={`font-semibold ${isTwoWheeler ? 'text-blue-700' : 'text-green-700'}`}>
                        {vehicle.vehicleType.replace('_', '-')}
                    </span>
                </div>
                <button
                    onClick={() => onViewSchedule(vehicle)}
                    disabled={isDeleted}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CalendarDaysIcon className="w-4 h-4 mr-1 inline" /> Schedule
                </button>
            </div>

            {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {!isDeleted ? (
                        <>
                            <button onClick={() => onEdit(vehicle)} className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium text-sm hover:bg-indigo-100 transition">
                                <PencilSquareIcon className="w-4 h-4 mr-1 inline" /> Edit
                            </button>
                            <button onClick={() => onAction(vehicle.vehicleNumber, 'soft-delete')} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg font-medium text-sm hover:bg-orange-100 transition">
                                <ArrowUturnLeftIcon className="w-4 h-4 mr-1 inline" /> Retire
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onAction(vehicle.vehicleNumber, 'restore')} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-sm hover:bg-green-100 transition">
                                Restore
                            </button>
                            <button onClick={() => onAction(vehicle.vehicleNumber, 'permanent-delete')} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-medium text-sm hover:bg-red-100 transition">
                                Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
function ManageVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
    const [typeFilter, setTypeFilter] = useState('ALL'); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editVehicleData, setEditVehicleData] = useState(null);
    
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleVehicle, setScheduleVehicle] = useState(null);

    const isAdmin = getUserRole() === 'ADMIN';

    // --- fetchVehicles and other utility functions ---
    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            toast.error("Authentication token missing.");
            return setLoading(false);
        }

        try {
            const response = await fetch(VEHICLES_URL, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch vehicles.");

            const result = await response.json();
            if (result.success) {
                setVehicles(result.data || []);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Could not fetch vehicle data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const filteredVehicles = vehicles
        .filter(vehicle => {
            if (typeFilter !== 'ALL' && vehicle.vehicleType !== typeFilter) return false;
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                if (
                    !vehicle.vehicleName.toLowerCase().includes(term) &&
                    !vehicle.vehicleNumber.toLowerCase().includes(term)
                ) return false;
            }
            if (activeTab === TABS.ACTIVE) return vehicle.active;
            if (activeTab === TABS.INACTIVE) return !vehicle.active;
            return true;
        });

    // --- Action Handler remains the same ---
    const handleAction = async (vehicleNumber, actionType) => {
        if (!isAdmin) {
            toast.error("Permission denied. Only Admins can perform vehicle actions.");
            return;
        }
        let endpoint = '';
        let method = 'POST';
        let confirmationMessage = '';
        const vehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
        const vehicleName = vehicle?.vehicleName || 'this vehicle';

        switch (actionType) {
            case 'soft-delete': 
                endpoint = `/soft-delete/${vehicleNumber}`;
                method = 'DELETE'; 
                confirmationMessage = `Retire vehicle ${vehicleName} (${vehicleNumber})?`;
                break;
            case 'permanent-delete':
                endpoint = `/hard-delete/${vehicleNumber}`;
                method = 'DELETE'; 
                confirmationMessage = `WARNING: Permanently delete vehicle ${vehicleNumber}? Cannot be undone.`;
                break;
            case 'restore':
                endpoint = `/restore/${vehicleNumber}`;
                method = 'POST';
                confirmationMessage = `Restore vehicle ${vehicleNumber} to the active fleet?`;
                break;
            default: return;
        }

        const confirmation = new Promise((resolve, reject) => {
            toast((t) => (
                <div className="flex flex-col space-y-2">
                    <p className="font-semibold text-gray-800">{confirmationMessage}</p>
                    <div className="flex space-x-2">
                        <button
                            className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                            onClick={() => { toast.dismiss(t.id); resolve(true); }}
                        >
                            Confirm
                        </button>
                        <button
                            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
                            onClick={() => { toast.dismiss(t.id); reject(new Error("Action cancelled by user.")); }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ), { duration: 10000, icon: actionType === 'permanent-delete' ? '⚠️' : '❓' });
        });

        try {
            await confirmation;
            const executionPromise = executeAction(endpoint, method);
            await toast.promise(executionPromise, {
                loading: `Executing ${actionType} action...`,
                success: (message) => { fetchVehicles(); return `Success: ${message}`; },
                error: (error) => `Action Failed: ${error.message || error}`,
            });
        } catch (e) {
            if (e.message !== "Action cancelled by user.") {
                toast.error(e.message || "An unexpected error occurred.");
            }
        }
    };
    
    const handleOpenAddSidebar = () => { setEditVehicleData(null); setIsSidebarOpen(true); };
    const handleOpenEditSidebar = (vehicle) => { setEditVehicleData(vehicle); setIsSidebarOpen(true); };
    const handleViewSchedule = (vehicle) => { setScheduleVehicle(vehicle); setShowScheduleModal(true); };


    // --- Table Content Renderer ---
    const renderTableBody = () => {
        if (loading) {
            return (<tr><td colSpan="7" className="py-8 text-center text-gray-500 text-lg">
                <div className="animate-spin w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading vehicles...
            </td></tr>);
        }
        if (filteredVehicles.length === 0) {
            return (<tr><td colSpan="7" className="py-8 text-center text-gray-500 text-lg">No vehicles found for this selection.</td></tr>);
        }

        return filteredVehicles.map((vehicle) => {
            const isDeleted = !vehicle.active;
            const isTwoWheeler = vehicle.vehicleType === 'TWO_WHEELER';

            return (
                <tr key={vehicle.vehicleNumber} className="border-b hover:bg-gray-50 text-sm">
                    <td className="px-6 py-3 font-medium text-gray-900">{vehicle.vehicleNumber}</td>
                    <td className="px-6 py-3">{vehicle.vehicleName}</td>
                    <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                            isTwoWheeler ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                            {vehicle.vehicleType.replace('_', '-')}
                        </span>
                    </td>
                    <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                            vehicle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {vehicle.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    
                    {/* Schedule Column */}
                    <td className="px-6 py-3">
                        {!isDeleted && (
                            <button 
                                onClick={() => handleViewSchedule(vehicle)}
                                className="text-white bg-blue-500 hover:bg-blue-600 font-medium rounded-lg text-xs px-3 py-1 shadow-md flex items-center justify-center transition"
                            >
                                <CalendarDaysIcon className="w-3 h-3 mr-1" /> Schedule
                            </button>
                        )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-3 whitespace-nowrap">
                        {isAdmin ? (
                            <div className="inline-flex items-center gap-2">
                                {!isDeleted ? (
                                    <>
                                        <button
                                            onClick={() => handleOpenEditSidebar(vehicle)}
                                            className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md flex items-center transition"
                                        >
                                            <PencilSquareIcon className="w-3 h-3 mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleAction(vehicle.vehicleNumber, 'soft-delete')}
                                            className="text-white bg-orange-600 hover:bg-orange-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md flex items-center transition"
                                            title="Retire Vehicle"
                                        >
                                            <ArrowUturnLeftIcon className="w-3 h-3 mr-1" /> Retire
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAction(vehicle.vehicleNumber, 'restore')}
                                            className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleAction(vehicle.vehicleNumber, 'permanent-delete')}
                                            className="text-white bg-red-800 hover:bg-red-900 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition"
                                        >
                                            <TrashIcon className="w-3 h-3 mr-1" /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-500 italic text-xs">Read-only</span>
                        )}
                    </td>
                </tr>
            );
        });
    };

    return (
        // Use h-screen and flex-col for a proper full-page layout
        <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans">
            <Toaster position="top-right" />
            
            {/* --- HEADER (STATIC) --- */}
            <header className="flex-none bg-white border-b border-gray-200 z-20 px-4 sm:px-6 py-4">
                <h2 className="text-2xl font-extrabold text-gray-900 flex items-center mb-4">
                    <TruckIcon className="w-7 h-7 mr-2 text-indigo-600" /> Manage Vehicles
                </h2>
                
                {/* Controls Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <input
                        type="text"
                        placeholder="Search by number or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="ALL">All Types</option>
                            <option value="TWO_WHEELER">Two-Wheeler</option>
                            <option value="FOUR_WHEELER">Four-Wheeler</option>
                        </select>
                        
                        <button 
                            onClick={fetchVehicles} 
                            className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition" 
                            title="Refresh"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {isAdmin && (
                        <button 
                            onClick={handleOpenAddSidebar}
                            className="w-full md:w-auto px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold flex items-center justify-center whitespace-nowrap"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" /> Add New Vehicle
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex mt-4 space-x-8 border-b border-gray-100">
                    {Object.values(TABS).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 text-sm font-bold transition-colors border-b-2 ${
                                activeTab === tab 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab} ({
                                tab === TABS.ACTIVE 
                                    ? vehicles.filter(v => v.active).length
                                    : vehicles.filter(v => !v.active).length
                            })
                        </button>
                    ))}
                </div>
            </header>

            {/* --- SCROLLABLE CONTENT SECTION --- */}
            <main className="flex-1 overflow-hidden relative bg-gray-50 p-4 sm:p-6">
                
                {/* Loader Overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                )}
                
                {/* Content Area - Uses flex-col to stack cards on mobile */}
                <div className="h-full w-full overflow-y-auto">
                    
                    {!loading && filteredVehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <TruckIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No vehicles found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE VIEW: List of Cards (md:hidden) */}
                            <div className="block md:hidden pb-4">
                                {filteredVehicles.map(vehicle => (
                                    <MobileVehicleCard 
                                        key={vehicle.vehicleNumber} 
                                        vehicle={vehicle} 
                                        isAdmin={isAdmin} 
                                        onEdit={handleOpenEditSidebar} 
                                        onAction={handleAction} 
                                        onViewSchedule={handleViewSchedule}
                                    />
                                ))}
                            </div>

                            {/* DESKTOP VIEW: Table (hidden md:block) 
                                The table wrapper is set to overflow-auto to enable horizontal and vertical scrolling if needed.
                                Removed fixed height class to allow it to grow with content.
                            */}
                            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th> 
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Model</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {renderTableBody()}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Sidebar Component */}
            <AddVehicleSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onVehicleAdded={fetchVehicles}
                initialData={editVehicleData}
            />
            {/* Sidebar Overlay */}
            {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Vehicle Schedule Modal */}
            {showScheduleModal && scheduleVehicle && (
                <VehicleScheduleModal
                    vehicle={scheduleVehicle}
                    onClose={() => setShowScheduleModal(false)}
                />
            )}
        </div>
    );
}

export default ManageVehicles;