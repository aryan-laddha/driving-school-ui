import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MdAccountBalanceWallet, MdTrendingUp } from 'react-icons/md'; // Icons for the cards
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';


const FinancialOverview = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE}/dashboard/finance-stats`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                if (result.success) setData(result.data);
            } catch (err) {
                toast.error("Failed to load financial data");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Analyzing Finances...</div>;
    if (!data) return null;

    const totalRevenueSum = data.totalPaidAmount + data.totalPendingAmount;
    const paidPercent = totalRevenueSum > 0 ? (data.totalPaidAmount / totalRevenueSum) * 100 : 0;
    const pendingPercent = totalRevenueSum > 0 ? (data.totalPendingAmount / totalRevenueSum) * 100 : 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md bg-opacity-90">
                    <p className="text-[11px] font-black text-indigo-300 uppercase mb-2 tracking-[0.2em]">{label}</p>
                    <div className="flex justify-between gap-8 items-center">
                        <span className="text-sm text-slate-400 font-medium">Revenue</span>
                        <span className="text-base font-black text-white">₹{payload[0].value.toLocaleString()}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-[35px] p-6 lg:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col h-full min-h-[550px]">
            
            {/* 1. Title Section (Matches Operational Overview) */}
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <MdTrendingUp size={20} />
                </div>
                <div>
                      <h2 className="text-xl font-black text-slate-800 leading-none">Revenue Analytics</h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Financial Performance Tracking</p>

                </div>
            </div>

            {/* 2. Status Cards Section (Matches Operational Overview layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Total Receivables Card */}
                <div className="bg-[#f4f7ff] p-5 rounded-[25px] flex items-center gap-4 border border-indigo-50/50">

                    <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200g-indigo-600 p-2.5 rounded-xl text-white shadow-md">
                        <MdAccountBalanceWallet size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Receivables</p>
                        <h3 className="text-2xl font-black text-slate-800">₹{totalRevenueSum.toLocaleString()}</h3>
                    </div>
                </div>

                {/* This Month Card */}
                <div className="    bg-[#f0fdf4] p-5 rounded-[25px] flex items-center gap-4 border border-emerald-50/50">
                    <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-md">
                        <MdTrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">This Month</p>
                        <h3 className="text-2xl font-black text-slate-800">₹{data.thisMonthIncome.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* 3. Subtitle for the chart */}
            <div className="mb-6">
                <p className="text-slate-800 font-black text-lg tracking-tight mb-4">3-Month Revenue Trend</p>
                
                {/* Progress Bar (Matches the sleek red/green style) */}
                <div className="flex justify-between text-[11px] font-black mb-3 uppercase tracking-widest">
                    <span className="text-emerald-500">PAID: ₹{data.totalPaidAmount.toLocaleString()}</span>
                    <span className="text-rose-500">PENDING: ₹{data.totalPendingAmount.toLocaleString()}</span>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded-full flex overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                        style={{ width: `${paidPercent}%` }} 
                        className="bg-emerald-500 transition-all duration-1000" 
                    />
                    <div 
                        style={{ width: `${pendingPercent}%` }} 
                        className="bg-rose-500 transition-all duration-1000 ml-0.5" 
                    />
                </div>
            </div>

            {/* 4. Responsive Bar Graph with full grid lines */}
            <div className="flex-grow w-full mt-4"> 
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={data.lastThreeMonths} 
                        margin={{ top: 30, right: 20, left: -20, bottom: 0 }} 
                    >
                        <defs>
                            <linearGradient id="activeBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                        </defs>
                        
                        {/* High-visibility Grid Lines matching Operational View */}
                        <CartesianGrid 
                            strokeDasharray="0" 
                            vertical={true} 
                            horizontal={true}
                            stroke="#f1f5f9" 
                            strokeWidth={1}
                        />
                        
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 12, fontWeight: 900 }} 
                            dy={15}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                        />
                        
                        <Tooltip 
                            cursor={{ fill: '#f8fafc', radius: 15 }} 
                            content={<CustomTooltip />} 
                        />
                        
                        <Bar 
                            dataKey="revenue" 
                            radius={[12, 12, 12, 12]}
                            barSize={60} 
                        >
                            <LabelList 
                                dataKey="revenue" 
                                position="top" 
                                formatter={(val) => `₹${val.toLocaleString()}`}
                                className="fill-slate-800 font-black text-[14px]"
                                offset={15}
                            />
                            {data.lastThreeMonths.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 2 ? "url(#activeBar)" : "#e2e8f0"} 
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinancialOverview;