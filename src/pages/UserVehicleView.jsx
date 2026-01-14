import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { TruckIcon } from '@heroicons/react/24/outline';
import { getToken } from '../utils/auth'; 
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

// const BASE_URL = `${API_BASE}/vehicles`; 

function UserVehicleView() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            // Using a GET method to fetch the list of vehicles
            const response = await fetch(VEHICLES_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch vehicles. Server returned " + response.status);
            }

            const result = await response.json();
            
            if (result.success) {
                // Filter to show only active vehicles, as is typical for a view-only user list
                const activeVehicles = result.data.filter(v => v.active);
                setVehicles(activeVehicles);
            } else {
                throw new Error(result.message || "Failed to retrieve vehicle data.");
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setError(`Could not load vehicles: ${e.message}`);
            toast.error(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const renderTableBody = () => {
        if (loading) {
            return (<tr><td colSpan="4" className="py-8 text-center text-indigo-600 font-medium">Loading vehicles...</td></tr>);
        }
        if (error) {
            return (<tr><td colSpan="4" className="py-8 text-center text-red-600 font-medium">{error}</td></tr>);
        }
        if (vehicles.length === 0) {
            return (<tr><td colSpan="4" className="py-8 text-center text-gray-500 font-medium">No active vehicles found.</td></tr>);
        }

        return vehicles.map((vehicle) => (
            <tr key={vehicle.vehicleNumber} className="border-b hover:bg-gray-50 text-sm">
                <td className="px-6 py-3 font-medium text-gray-900">{vehicle.vehicleNumber}</td>
                <td className="px-6 py-3">{vehicle.vehicleName}</td>
                <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                        vehicle.vehicleType === 'TWO_WHEELER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {vehicle.vehicleType.replace('_', '-')}
                    </span>
                </td>
                <td className="px-6 py-3 text-gray-600 italic">
                    {/* Displaying a relevant piece of info, e.g., capacity or last service date if available */}
                    {vehicle.description || "N/A"}
                </td>
            </tr>
        ));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl">
            <Toaster position="bottom-center" reverseOrder={false} />
            
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <TruckIcon className="w-8 h-8 mr-3 text-indigo-600" /> View Fleet
            </h2>
            
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th> 
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Model</th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserVehicleView;