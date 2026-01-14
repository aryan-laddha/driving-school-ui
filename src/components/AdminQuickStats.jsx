import React, { useEffect, useState } from 'react';
import { Users, Car, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';

const AdminQuickStats = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!token) return;

        fetch(`${API_BASE}/admin/summary/counts`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Unauthorized or Server Error');
            return res.json();
        })
        .then(data => setStats(data))
        .catch(err => console.error("Error fetching summary stats:", err));
    }, [token]);

    if (!stats) return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-[25px]"></div>
            ))}
        </div>
    );

    const statItems = [
        { label: "Active Users", value: stats.totalActiveUsers, icon: <Users size={20}/>, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Pending Approval", value: stats.pendingApprovalUsers, icon: <Clock size={20}/>, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Active Vehicles", value: stats.activeVehicles, icon: <Car size={20}/>, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active Courses", value: stats.activeCourses, icon: <BookOpen size={20}/>, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statItems.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[25px] border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
                    
                    {/* 1. Heading Moved to the Top */}
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-black uppercase text-slate-500 tracking-widest leading-none">
                            {item.label}
                        </span>
                    </div>

                    {/* 2. Content Row: Icon and Large Number Side-by-Side */}
                    <div className="flex items-center justify-between">
                        <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm`}>
                            {item.icon}
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 leading-none">
                            {item.value}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminQuickStats;