// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearToken } from '../utils/auth';

// Component Imports
import FinancialOverview from '../components/FinancialOverview';
import AdminQuickStats from '../components/AdminQuickStats';
import ScheduleStackGraph from '../components/ScheduleStackGraph'; 
import CustomerAnalytics from '../components/CustomerAnalytics';
import ExpenditureOverview from '../components/ExpenditureOverview'; // 👈 Import the new comparison component

// Icons
import { MdLogout, MdDashboard, MdNotificationsNone } from 'react-icons/md';

function AdminDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/users/pending-count', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setPendingCount(data.count || 0))
    .catch(err => console.error("Error fetching alerts:", err));
  }, [token]);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Navbar */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
              <MdDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Admin Console</h1>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Driving School Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="relative p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all"
            >
              <MdNotificationsNone size={24} />
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                </span>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
            >
              <MdLogout /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* 1. Quick Stats Section (Top Cards) */}
        <AdminQuickStats />

        {/* 2. Primary Analytics (Schedules & Revenue) */}
        <div className="mt-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <ScheduleStackGraph />
               <FinancialOverview />
            </div>
        </div>

        {/* 3. Secondary Analytics (Customer Growth) */}
        <div className="mt-8">
            <CustomerAnalytics />
        </div>

        {/* 4. Deep Financial Comparison (Expenditure vs Income) */}
        <div className="mt-8 mb-16"> 
            <ExpenditureOverview />
        </div>

        {/* 5. Floating System Alert */}
        {pendingCount > 0 && (
          <div className="fixed bottom-8 right-8 z-50 animate-bounce cursor-pointer">
            <div 
              onClick={() => navigate('/admin/users')}
              className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-indigo-700 transition-all border-4 border-white"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <MdNotificationsNone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase opacity-80 leading-none mb-1">Action Required</p>
                <p className="font-black text-sm">{pendingCount} Pending Approvals</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;