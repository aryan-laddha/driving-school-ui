// src/pages/ManageCourses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  BookOpenIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArrowUturnLeftIcon,
  TagIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'; 
import { getUserRole, getToken } from '../utils/auth'; 
import AddCourseSidebar from '../components/AddCourseSidebar'; 
import { VEHICLE_TYPES } from '../utils/constants';
import { API_BASE, COURSES_URL } from '../api/constants';

const BASE_URL = 'http://localhost:8080/api/courses'; 

const TABS = {
    ACTIVE: 'Active Courses', 
    INACTIVE: 'Inactive/Retired',
};

// --- API UTILITIES ---
const executeAction = async (endpoint, method = 'POST') => {
    const token = getToken();
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await fetch(`${COURSES_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) return result.message;
        else throw new Error(result.message || "Server error."); 
    } catch (error) {
        throw error;
    }
};

const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount || 0).toFixed(2)}`;
};

// --- COMPONENT: MOBILE COURSE CARD ---
const MobileCourseCard = ({ course, isAdmin, onEdit, onAction }) => {
    const isDeleted = !course.active;

    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4 ${isDeleted ? 'bg-gray-50' : ''}`}>
            {/* Header: Name and Status */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">{course.courseName}</h3>
                    <p className="text-xs text-gray-500">{course.vehicleSubCategory}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                    course.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {course.active ? 'Active' : 'Retired'}
                </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-indigo-50 p-2 rounded-lg flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">Type</span>
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <TagIcon className="w-3 h-3" /> {course.vehicleType.replace('_', '-')}
                    </span>
                </div>
                <div className="bg-green-50 p-2 rounded-lg flex flex-col items-center justify-center text-center">
                     <span className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Price</span>
                     <span className="font-bold text-green-700 flex items-center gap-1">
                        <CurrencyRupeeIcon className="w-3 h-3" /> {course.price}
                    </span>
                </div>
                <div className="col-span-2 bg-gray-50 p-2 rounded-lg flex items-center justify-between px-4 border border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase">Daily</span>
                        <span className="font-medium text-gray-700">{course.durationPerDayHours} hrs</span>
                    </div>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-400 font-bold uppercase">Duration</span>
                        <span className="font-medium text-gray-700">{course.totalDays} Days</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {!isDeleted ? (
                        <>
                            <button onClick={() => onEdit(course)} className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium text-sm hover:bg-indigo-100 transition">
                                Edit
                            </button>
                            <button onClick={() => onAction(course.courseId, 'soft-delete')} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg font-medium text-sm hover:bg-orange-100 transition">
                                Retire
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onAction(course.courseId, 'restore')} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-sm hover:bg-green-100 transition">
                                Restore
                            </button>
                            <button onClick={() => onAction(course.courseId, 'permanent-delete')} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-medium text-sm hover:bg-red-100 transition">
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
function ManageCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
    const [typeFilter, setTypeFilter] = useState('ALL'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editCourseData, setEditCourseData] = useState(null);

    const isAdmin = getUserRole() === 'ADMIN';

    // --- DATA FETCHING ---
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            toast.error("Authentication token missing.");
            return setLoading(false);
        }

        try {
            const response = await fetch(COURSES_URL, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch courses.");

            const result = await response.json();
            if (result.success) {
                setCourses(result.data.map(c => ({
                    ...c,
                    price: parseFloat(c.price) 
                })) || []);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Could not fetch course data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // --- FILTERING ---
    const filteredCourses = courses.filter(course => {
        if (typeFilter !== 'ALL' && course.vehicleType !== typeFilter) return false;
        
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            if (
                !course.courseName.toLowerCase().includes(term) &&
                !course.vehicleSubCategory.toLowerCase().includes(term) &&
                !course.description.toLowerCase().includes(term)
            ) return false;
        }

        if (activeTab === TABS.ACTIVE) return course.active;
        if (activeTab === TABS.INACTIVE) return !course.active;
        return true;
    });

    // --- ACTIONS ---
    const handleAction = async (courseId, actionType) => {
        if (!isAdmin) return toast.error("Permission denied.");

        let endpoint = '';
        let method = 'POST';
        let confirmationMessage = '';
        const courseName = courses.find(c => c.courseId === courseId)?.courseName || 'this course';

        switch (actionType) {
            case 'soft-delete': 
                endpoint = `/soft-delete/${courseId}`;
                method = 'DELETE'; 
                confirmationMessage = `Retire (soft-delete) course: ${courseName}?`;
                break;
            case 'permanent-delete':
                endpoint = `/hard-delete/${courseId}`;
                method = 'DELETE'; 
                confirmationMessage = `WARNING: Permanently delete ${courseName}? Cannot be undone.`;
                break;
            case 'restore':
                endpoint = `/restore/${courseId}`;
                method = 'POST';
                confirmationMessage = `Restore course ${courseName}?`;
                break;
            default: return;
        }

        toast((t) => (
            <div className="flex flex-col space-y-2">
                <p className="font-semibold text-gray-800">{confirmationMessage}</p>
                <div className="flex gap-2">
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        onClick={() => { toast.dismiss(t.id); executeActionLogic(endpoint, method, actionType, courseName); }}>
                        Confirm
                    </button>
                    <button className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                        onClick={() => toast.dismiss(t.id)}>Cancel</button>
                </div>
            </div>
        ), { duration: 5000, icon: '⚠️' });
    };

    const executeActionLogic = async (endpoint, method, actionType, courseName) => {
        try {
            await toast.promise(executeAction(endpoint, method), {
                loading: 'Processing...',
                success: (msg) => { fetchCourses(); return msg; },
                error: (err) => err.message
            });
        } catch (e) { console.error(e); }
    };

    const handleOpenAddSidebar = () => { setEditCourseData(null); setIsSidebarOpen(true); };
    const handleOpenEditSidebar = (course) => { setEditCourseData(course); setIsSidebarOpen(true); };

    return (
        // OUTER CONTAINER: h-screen prevents full page scroll, flex-col stacks layout
        <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans">
            <Toaster position="top-right" />
            
            {/* --- STATIC HEADER SECTION --- */}
            <header className="flex-none bg-white border-b border-gray-200 z-20 px-4 sm:px-8 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
                        <BookOpenIcon className="w-7 h-7 mr-2 text-indigo-600" /> Manage Courses
                    </h2>
                    
                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-indigo-500"
                        >
                            <option value="ALL">All Types</option>
                            {VEHICLE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                             <button onClick={fetchCourses} className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200" title="Refresh">
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                            {isAdmin && (
                                <button 
                                    onClick={handleOpenAddSidebar}
                                    className="flex-1 md:flex-none px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-semibold flex items-center justify-center whitespace-nowrap"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" /> Add Course
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex mt-6 space-x-6 border-b border-gray-100">
                    {Object.values(TABS).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                                activeTab === tab 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* --- SCROLLABLE CONTENT SECTION --- */}
            <main className="flex-1 overflow-hidden relative bg-gray-50">
                {/* Loader */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {/* Content Container with Padding */}
                <div className="h-full w-full p-4 sm:p-6 overflow-hidden flex flex-col">
                    
                    {!loading && filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <BookOpenIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No courses found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE VIEW: List of Cards (md:hidden) */}
                            <div className="block md:hidden h-full overflow-y-auto pb-20 no-scrollbar">
                                {filteredCourses.map(course => (
                                    <MobileCourseCard 
                                        key={course.courseId} 
                                        course={course} 
                                        isAdmin={isAdmin} 
                                        onEdit={handleOpenEditSidebar} 
                                        onAction={handleAction} 
                                    />
                                ))}
                            </div>

                            {/* DESKTOP VIEW: Table Wrapper (hidden md:block) 
                                KEY CHANGE HERE: Removed 'flex-1', added 'h-fit max-h-full'.
                                This allows the white box to shrink to content, but scroll if too big.
                            */}
                            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 h-fit max-h-full overflow-auto relative">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course Name</th> 
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hrs/Day</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Days</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredCourses.map((course) => {
                                            const isDeleted = !course.active;
                                            return (
                                                <tr key={course.courseId} className="hover:bg-indigo-50/50 transition">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{course.courseName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.vehicleSubCategory}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase ${
                                                            course.vehicleType === 'TWO_WHEELER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            {course.vehicleType.replace('_', '-')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-700 text-sm">
                                                        {formatCurrency(course.price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{course.durationPerDayHours}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{course.totalDays}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            course.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {course.active ? 'Active' : 'Retired'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        {isAdmin ? (
                                                            <div className="flex justify-center space-x-2">
                                                                {!isDeleted ? (
                                                                    <>
                                                                        <button onClick={() => handleOpenEditSidebar(course)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition" title="Edit">
                                                                            <PencilSquareIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => handleAction(course.courseId, 'soft-delete')} className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-1.5 rounded-md transition" title="Retire">
                                                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => handleAction(course.courseId, 'restore')} className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1.5 rounded-md transition" title="Restore">
                                                                            <ArrowPathIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => handleAction(course.courseId, 'permanent-delete')} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition" title="Permanently Delete">
                                                                            <TrashIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">Read-only</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Sidebar & Overlay */}
            <AddCourseSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onCourseAdded={fetchCourses}
                initialData={editCourseData}
            />
            {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30" onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default ManageCourses;