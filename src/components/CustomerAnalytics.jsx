import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MdPeople, MdCheckCircle, MdPlayCircleFilled, MdTrendingUp } from 'react-icons/md';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';


const CustomerAnalytics = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE}/dashboard/customer-stats`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                if (result.success) setStats(result.data);
            } catch (err) {
                toast.error("Failed to load customer analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Analyzing Customers...</div>;
    if (!stats || !stats.enrollmentTrend) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-3 md:p-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md bg-opacity-90">
                    <p className="text-[10px] md:text-[11px] font-black text-indigo-300 uppercase mb-1 md:mb-2 tracking-wider">{label}</p>
                    <div className="flex justify-between gap-4 md:gap-8 items-center">
                        <span className="text-xs md:text-sm text-slate-400 font-medium">Enrolled</span>
                        <span className="text-sm md:text-base font-black text-white">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-[25px] md:rounded-[35px] p-4 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col h-full min-h-[500px] md:min-h-[550px]">
            
            {/* Header Section */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-indigo-600 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <MdPeople size={18} className="md:w-5 md:h-5" />
                </div>
                <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-800 leading-none">Customer Analytics</h2>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-wider">Enrollment & Status</p>
                </div>
            </div>

            {/* Responsive Status Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-[#f4f7ff] p-3 md:p-4 rounded-[20px] md:rounded-[25px] flex items-center gap-2 md:gap-3 border border-indigo-50/50">
                    <div className="hidden sm:block bg-indigo-600 p-2 rounded-xl text-white shadow-md"><MdPeople size={16} /></div>
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-800">{stats.totalRegistered}</h3>
                    </div>
                </div>

                <div className="bg-[#f0fdf4] p-3 md:p-4 rounded-[20px] md:rounded-[25px] flex items-center gap-2 md:gap-3 border border-emerald-50/50">
                    <div className="hidden sm:block bg-emerald-500 p-2 rounded-xl text-white shadow-md"><MdCheckCircle size={16} /></div>
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase tracking-widest">Done</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-800">{stats.totalCompleted}</h3>
                    </div>
                </div>

                <div className="bg-[#fff1f2] p-3 md:p-4 rounded-[20px] md:rounded-[25px] flex items-center gap-2 md:gap-3 border border-rose-50/50">
                    <div className="hidden sm:block bg-rose-500 p-2 rounded-xl text-white shadow-md"><MdPlayCircleFilled size={16} /></div>
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-rose-400 uppercase tracking-widest">Live</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-800">{stats.liveSchedules}</h3>
                    </div>
                </div>

                <div className="bg-[#fffbeb] p-3 md:p-4 rounded-[20px] md:rounded-[25px] flex items-center gap-2 md:gap-3 border border-amber-50/50">
                    <div className="hidden sm:block bg-amber-500 p-2 rounded-xl text-white shadow-md"><MdTrendingUp size={16} /></div>
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-amber-400 uppercase tracking-widest">New</p>
                        <h3 className="text-lg md:text-xl font-black text-slate-800">{stats.currentMonthEnrolled}</h3>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-slate-800 font-black text-base md:text-lg tracking-tight mb-1">Registration Trend</p>
                <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">Last 3 Months</p>
            </div>

            {/* Responsive Chart Container */}
            <div className="w-full h-[250px] md:h-[300px] mt-auto"> 
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={stats.enrollmentTrend} 
             
                        margin={{ top: 20, right: 10, left: -25, bottom: 30 }} 
                    >
                        <defs>
                            <linearGradient id="customerBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                            dy={10} // Moves label down slightly
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            allowDecimals={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip cursor={{ fill: '#f8fafc', radius: 10 }} content={<CustomTooltip />} />
                        <Bar 
                            dataKey="count" 
                            radius={[8, 8, 8, 8]}
                         
                            barSize={window.innerWidth < 768 ? 35 : 55} 
                        >
                            <LabelList 
                                dataKey="count" 
                                position="top" 
                                className="fill-slate-800 font-black text-[12px] md:text-[14px]"
                                formatter={(val) => (val > 0 ? val : '')}
                                offset={10}
                            />
                            {stats.enrollmentTrend.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? "url(#customerBar)" : "#f1f5f9"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomerAnalytics;