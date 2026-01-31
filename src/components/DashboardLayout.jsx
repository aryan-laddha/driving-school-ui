import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';
import toast, { Toaster } from 'react-hot-toast';
// Added icons for a better look and necessary toggle icons
import { 
    Home, Users, Calendar, BookOpen, Truck, Settings, DollarSign, Mail, Menu, X, Pen 
} from 'lucide-react'; 

// Define navigation items based on the role with icons
const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Customer Enrollment', path: '/admin/enroll-customer', icon: Users },
    { name: 'My Schedule', path: '/admin/myschedule', icon: Calendar },
    { name: 'Manage Schedules', path: '/admin/schedule', icon: Calendar },
    { name: 'Manage Customers', path: '/admin/customers', icon: Users }, 
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Manage Vehicles', path: '/admin/vehicles', icon: Truck },
    { name: 'Manage Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Manage Payments', path: '/admin/payments', icon: DollarSign },
    { name: 'Manage Queries', path: '/admin/queries', icon: Mail },
    { name: 'Manage Expenditures', path: '/admin/expenditure', icon: Pen },
];

const userLinks = [
    { name: 'Dashboard', path: '/user/dashboard', icon: Home },
    { name: 'My Schedule', path: '/user/schedule', icon: Calendar },
    { name: 'View Courses', path: '/user/courses', icon: BookOpen },
    { name: 'View Vehicles', path: '/user/vehicles', icon: Truck },
];

// Define the sidebar width and responsive margin classes
const SIDEBAR_WIDTH_CLASS = 'w-64'; 
const MAIN_CONTENT_MARGIN_CLASS = 'lg:ml-64'; 

function DashboardLayout({ role }) {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

    const navLinks = useMemo(() => role === 'ADMIN' ? adminLinks : userLinks, [role]);

    const linkBaseStyle = "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors font-medium text-sm";
    const linkDefaultStyle = "text-gray-700 hover:bg-gray-100 hover:text-indigo-600";
    const linkActiveStyle = "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"; 

    const handleLogout = () => {
        // Show a custom confirmation toast
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-medium text-gray-800">
                    Are you sure you want to logout?
                </span>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            performLogout();
                        }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
            style: {
                minWidth: '300px',
                borderRadius: '12px',
                background: '#fff',
                color: '#333',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
        });
    };

    const performLogout = () => {
        clearToken();
        navigate('/login');
    };
    
    const handleLinkClick = () => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* 0. TOASTER - Positioned globally with high Z-Index to avoid being hidden by Header */}
            <Toaster 
                position="top-center"
                containerStyle={{ zIndex: 99999 }} 
            />
            
            {/* 1. Fixed Top Navbar (Header) */}
            <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 text-gray-800 h-16 flex items-center justify-between px-4 lg:px-6 shadow-xl`}>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-1 text-gray-600 hover:text-indigo-600 transition-colors rounded-md"
                        aria-label="Toggle menu"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    
                    <NavLink
                        to={`/${role.toLowerCase()}/dashboard`}
                        className="text-xl font-extrabold text-indigo-700 hover:text-indigo-800 transition-colors"
                    >
                        Welcome Driving School
                    </NavLink>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-500 text-xs hidden lg:block uppercase font-bold tracking-wider px-3 py-1 bg-indigo-100 rounded-full">{role} ROLE</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg text-sm hover:bg-red-700 transition duration-150 shadow-md"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* 2. Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* 3. Fixed Side Navbar - Responsive Visibility */}
            <nav className={`
                fixed left-0 top-16 bottom-0 ${SIDEBAR_WIDTH_CLASS} bg-white shadow-2xl p-4 space-y-4 border-r border-gray-100 z-40 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                lg:translate-x-0 lg:block 
                transition-transform duration-300 ease-in-out
            `}>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mt-2 mb-4 tracking-wider border-b pb-2">
                    {role === 'ADMIN' ? 'Administration Menu' : 'Staff Menu'}
                </h3>
                <ul className="space-y-1">
                    {navLinks.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                    `${linkBaseStyle} ${isActive ? linkActiveStyle : linkDefaultStyle}`
                                }
                            >
                                <link.icon className="w-5 h-5" /> 
                                <span>{link.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* 4. Main Content Area - Responsive Margin */}
            <main className={`flex-1 ${MAIN_CONTENT_MARGIN_CLASS} pt-20 pb-8`}>
                <div className="container mx-auto max-w-7xl px-4 lg:px-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;
