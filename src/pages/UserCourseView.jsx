import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { getToken } from '../utils/auth'; 
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';

// const BASE_URL = 'http://localhost:8080/api/courses'; 

function UserCourseView() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            // Using a GET method to fetch the list of courses
            const response = await fetch(COURSES_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch courses. Server returned " + response.status);
            }

            const result = await response.json();
            
            if (result.success) {
                // Filter to show only active courses
                const activeCourses = result.data.filter(c => c.active);
                setCourses(activeCourses);
            } else {
                throw new Error(result.message || "Failed to retrieve course data.");
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setError(`Could not load courses: ${e.message}`);
            toast.error(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const renderTableBody = () => {
        if (loading) {
            return (<tr><td colSpan="4" className="py-8 text-center text-indigo-600 font-medium">Loading courses...</td></tr>);
        }
        if (error) {
            return (<tr><td colSpan="4" className="py-8 text-center text-red-600 font-medium">{error}</td></tr>);
        }
        if (courses.length === 0) {
            return (<tr><td colSpan="4" className="py-8 text-center text-gray-500 font-medium">No active courses found.</td></tr>);
        }

        return courses.map((course) => (
            <tr key={course.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="px-6 py-3 font-medium text-gray-900">{course.courseName}</td>
                <td className="px-6 py-3 text-gray-600">{course.vehicleType}</td>
                <td className="px-6 py-3 font-semibold text-indigo-600">
                    {course.cost ? `$${course.cost.toFixed(2)}` : 'Contact for Price'}
                </td>
                <td className="px-6 py-3 text-gray-700">
                    {course.description || "Comprehensive lessons covering essential driving skills."}
                </td>
            </tr>
        ));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl">
            <Toaster position="bottom-center" reverseOrder={false} />
            
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <BookOpenIcon className="w-8 h-8 mr-3 text-indigo-600" /> View Courses
            </h2>
            
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th> 
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
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

export default UserCourseView;