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