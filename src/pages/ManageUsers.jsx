// src/pages/ManageUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getToken, getLoggedInUsername } from '../utils/auth'; 
import { 
  UserGroupIcon, 
  ArrowPathIcon, 
  CalendarDaysIcon, 
  MagnifyingGlassIcon,
  TrashIcon, 
  CheckCircleIcon,
  NoSymbolIcon,
  ArrowUturnLeftIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import UserScheduleModal from '../components/UserScheduleModal'; 
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';


const BASE_URL = '${API_BASE}/auth'; 

// --- Tab definitions ---
const TABS = {
  PENDING: 'Pending Approval', 
  APPROVED: 'Approved Users',    
  DELETED: 'Deleted Users',      
};

// --- API Utility Function ---
const executeAction = async (endpoint, method = 'POST') => {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in again."); 

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (result.success) return result.message; 
  else throw new Error(result.message || "Action failed."); 
};

// --- Mobile User Card Component ---
const MobileUserCard = ({ user, loggedInUsername, onAction, onViewSchedule, activeTab }) => {
    const isSelf = user.username === loggedInUsername && user.role === 'ADMIN';
    const isAdmin = user.role === 'ADMIN';

    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm border mb-4 ${user.deleted ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-3 border-b pb-2 border-gray-100">
                <div>
                    <h3 className="font-extrabold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                    isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                    {user.role}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-bold uppercase block">Contact</span>
                    <span className="font-semibold text-gray-700 truncate block">{user.contact}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 font-bold uppercase block">License</span>
                    <span className="font-semibold text-gray-700 truncate block">{user.licenseNumber || 'N/A'}</span>
                </div>
            </div>

            {/* Schedule Button */}
            {user.access && !user.deleted && (
                 <button
                    onClick={() => onViewSchedule(user)}
                    className="w-full mb-3 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-sm transition flex items-center justify-center"
                >
                    <CalendarDaysIcon className="w-4 h-4 mr-1" /> View Schedule
                </button>
            )}

             {/* Locked Action Message */}
             {isSelf && (
                <div className="text-center pt-2 border-t border-gray-100">
                    <span className="text-gray-400 italic text-xs flex items-center justify-center">
                        <LockClosedIcon className="w-3 h-3 mr-1"/> Action Restricted
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            {!isSelf && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {activeTab === TABS.PENDING && (
                        <>
                            <button onClick={() => onAction(user.username, 'approve')} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-sm hover:bg-green-100">
                                Approve
                            </button>
                            <button onClick={() => onAction(user.username, 'soft-delete')} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-medium text-sm hover:bg-red-100">
                                Reject
                            </button>
                        </>
                    )}
                    {activeTab === TABS.APPROVED && (
                        <button onClick={() => onAction(user.username, 'revoke')} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg font-medium text-sm hover:bg-orange-100 flex items-center justify-center">
                            <NoSymbolIcon className="w-4 h-4 mr-1"/> Revoke Access
                        </button>
                    )}
                    {activeTab === TABS.DELETED && (
                        <>
                            <button onClick={() => onAction(user.username, 'restore')} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-sm hover:bg-green-100">
                                Restore
                            </button>
                            <button onClick={() => onAction(user.username, 'permanent-delete')} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-medium text-sm hover:bg-red-100">
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
function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.PENDING);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- MODAL STATE ---
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleUser, setScheduleUser] = useState(null); 

  const loggedInUsername = getLoggedInUsername(); 

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
        toast.error("Authentication token missing.");
        return setLoading(false);
    }
    try {
      const response = await fetch(`${BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) setUsers(result.data || []);
      else toast.error(result.message);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Could not fetch user data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // --- Filtering Logic ---
  const filteredUsers = users.filter(user => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        if (!user.name.toLowerCase().includes(term) && !user.username.toLowerCase().includes(term)) return false;
      }
      if (activeTab === TABS.PENDING) return !user.access && !user.deleted && user.role === 'USER';
      else if (activeTab === TABS.APPROVED) return user.access && !user.deleted;
      else if (activeTab === TABS.DELETED) return user.deleted;
      return true;
  });

  const handleViewSchedule = (user) => {
    setScheduleUser(user);
    setShowScheduleModal(true);
  };

  const handleAction = async (username, actionType) => {
    if (username === loggedInUsername) {
        toast.error("Action restricted: You cannot perform this action on your own account.");
        return;
    }
      
    let endpoint = '';
    let method = 'POST';
    let confirmationMessage = '';

    switch (actionType) {
      case 'approve': endpoint = `/approve/${username}`; method = 'POST'; confirmationMessage = `Approve access for ${username}?`; break;
      case 'revoke': endpoint = `/soft-delete/${username}`; method = 'DELETE'; confirmationMessage = `Revoke access for ${username}?`; break;
      case 'soft-delete': endpoint = `/soft-delete/${username}`; method = 'DELETE'; confirmationMessage = `Reject/Soft-delete ${username}?`; break;
      case 'permanent-delete': endpoint = `/hard-delete/${username}`; method = 'DELETE'; confirmationMessage = `PERMANENTLY delete ${username}? This cannot be undone.`; break;
      case 'restore': endpoint = `/restore/${username}`; method = 'POST'; confirmationMessage = `Restore ${username}'s account?`; break;
      default: return;
    }

    const confirmation = new Promise((resolve, reject) => {
      toast((t) => (
        <div className="flex flex-col space-y-2">
          <p className="font-semibold text-gray-800">{confirmationMessage}</p>
          <div className="flex space-x-2">
            <button className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700" onClick={() => { toast.dismiss(t.id); resolve(true); }}>Confirm</button>
            <button className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300" onClick={() => { toast.dismiss(t.id); reject(new Error("Action cancelled.")); }}>Cancel</button>
          </div>
        </div>
      ), { duration: 10000, icon: actionType === 'permanent-delete' ? '⚠️' : '❓' });
    });

    try {
      await confirmation;
      const executionPromise = executeAction(endpoint, method);
      await toast.promise(executionPromise, {
        loading: 'Processing...',
        success: (msg) => { fetchUsers(); return msg; },
        error: (err) => err.message,
      });
    } catch (e) { /* silent catch */ }
  };

  // --- Table Content Renderer (Desktop) ---
  const renderTableBody = () => {
    if (loading) {
      return (<tr><td colSpan="7" className="py-8 text-center text-gray-500 text-lg">
          <div className="animate-spin w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading users...
      </td></tr>);
    }
    if (filteredUsers.length === 0) {
      return (<tr><td colSpan="7" className="py-8 text-center text-gray-500 text-lg">No users found for this selection.</td></tr>);
    }

    return filteredUsers.map((user) => {
      const isSelf = user.username === loggedInUsername && user.role === 'ADMIN'; 

      return (
        <tr key={user.id} className="border-b hover:bg-gray-50 text-sm transition-colors"> 
          <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
          <td className="px-6 py-4 text-gray-500">{user.username}</td>
          <td className="px-6 py-4">
              <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${ 
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                  {user.role}
              </span>
          </td>
          <td className="px-6 py-4 text-gray-500">{user.contact}</td>
          <td className="px-6 py-4 text-gray-500">{user.licenseNumber || 'N/A'}</td>

          {/* Schedule Button */}
          <td className="px-6 py-4">
            {user.access && !user.deleted && (
              <button 
                onClick={() => handleViewSchedule(user)} 
                className="text-white bg-indigo-500 hover:bg-indigo-600 font-medium rounded-lg text-xs px-3 py-1.5 shadow-md flex items-center justify-center transition" 
              >
                <CalendarDaysIcon className="w-3 h-3 mr-1" /> Schedule
              </button>
            )}
          </td>

          {/* Actions Column */}
          <td className="px-6 py-4 whitespace-nowrap">
            {isSelf ? ( 
              <span className="text-gray-400 italic text-xs flex items-center"> 
                <LockClosedIcon className="w-3 h-3 mr-1" /> Locked
              </span>
            ) : (
                <div className="inline-flex items-center gap-2">
                {activeTab === TABS.PENDING && (
                  <>
                    <button onClick={() => handleAction(user.username, 'approve')} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition flex items-center">
                      <CheckCircleIcon className="w-3 h-3 mr-1"/> Approve
                    </button>
                    <button onClick={() => handleAction(user.username, 'soft-delete')} className="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition flex items-center">
                      <NoSymbolIcon className="w-3 h-3 mr-1"/> Reject
                    </button>
                  </>
                )}
                {activeTab === TABS.APPROVED && (
                  <button onClick={() => handleAction(user.username, 'revoke')} className="text-white bg-orange-600 hover:bg-orange-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition flex items-center">
                    <ArrowUturnLeftIcon className="w-3 h-3 mr-1"/> Revoke
                  </button>
                )}
                {activeTab === TABS.DELETED && (
                  <>
                    <button onClick={() => handleAction(user.username, 'restore')} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition flex items-center">
                       Restore
                    </button>
                    <button onClick={() => handleAction(user.username, 'permanent-delete')} className="text-white bg-red-800 hover:bg-red-900 font-medium rounded-lg text-xs px-2 py-1 shadow-md transition flex items-center">
                       <TrashIcon className="w-3 h-3 mr-1"/> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    // FIX APPLIED HERE:
    // We use h-[calc(100vh-4rem)] assuming your top navbar is roughly 64px (4rem).
    // If your top navbar is larger, adjust '4rem' to '5rem' or '6rem'.
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-gray-50 font-sans">
      <Toaster position="top-right" /> 
      
      {/* --- HEADER (STATIC - Fixed within the flex container) --- */}
      <header className="flex-none bg-white border-b border-gray-200 z-20 px-4 sm:px-6 py-4">
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center mb-4">
            <UserGroupIcon className="w-7 h-7 mr-2 text-indigo-600" /> Manage Users
        </h2>

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
             <div className="relative flex-grow md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
             </div>

             <div className="flex gap-3 w-full md:w-auto">
                 <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="flex-grow md:w-40 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                 >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="USER">Staff</option>
                 </select>

                 <button 
                    onClick={fetchUsers} 
                    className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition" 
                    title="Refresh Data"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
             </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 space-x-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${ 
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} ({
                tab === TABS.PENDING 
                    ? users.filter(u => !u.access && !u.deleted && u.role === 'USER').length
                    : tab === TABS.APPROVED 
                    ? users.filter(u => u.access && !u.deleted).length
                    : users.filter(u => u.deleted).length
              })
            </button>
          ))}
        </div>
      </header>

      {/* --- SCROLLABLE CONTENT SECTION --- */}
      {/* flex-1 allows this div to take remaining height, overflow-y-auto enables internal scrolling */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50 p-4 sm:p-6">
         
         {/* Loader Overlay */}
         {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                 <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
             </div>
         )}

         <div className="min-h-full">
            {!loading && filteredUsers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <UserGroupIcon className="w-12 h-12 mb-2 opacity-50" />
                    <p>No users found matching your criteria.</p>
                 </div>
            ) : (
                <>
                    {/* MOBILE VIEW: List of Cards (md:hidden) */}
                    <div className="block md:hidden pb-4">
                        {filteredUsers.map(user => (
                            <MobileUserCard 
                                key={user.id} 
                                user={user} 
                                loggedInUsername={loggedInUsername}
                                onAction={handleAction}
                                onViewSchedule={handleViewSchedule}
                                activeTab={activeTab}
                            />
                        ))}
                    </div>

                    {/* DESKTOP VIEW: Table (hidden md:block) */}
                    <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th> 
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {renderTableBody()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
         </div>
      </main>

      {/* --- RENDER SCHEDULE MODAL --- */}
      {showScheduleModal && scheduleUser && (
        <UserScheduleModal
          user={scheduleUser}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

export default ManageUsers;