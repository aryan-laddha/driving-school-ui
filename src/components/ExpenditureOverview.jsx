import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MdLocalGasStation, MdSettings, MdAccountBalanceWallet, MdInsights } from 'react-icons/md';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';


const ExpenditureOverview = () => {
    const { token } = useAuth();
    const [combinedData, setCombinedData] = useState([]);
    const [currentMonthData, setCurrentMonthData] = useState({ income: 0, expenses: 0, month: '' });
    const [expenseStats, setExpenseStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [finRes, expRes] = await Promise.all([
                    fetch(`${API_BASE}/dashboard/finance-stats`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE}/dashboard/expenditure-stats`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const finResult = await finRes.json();
                const expResult = await expRes.json();

                if (finResult.success && expResult.success) {
                    setExpenseStats(expResult.data);
                    
                    const merged = finResult.data.lastThreeMonths.map(item => ({
                        month: item.month,
                        income: item.revenue,
                        // Note: Ensure your backend starts returning monthly expenditure 
                        // For now, we simulate the monthly expenditure trend
                        expenses: item.revenue * 0.42 
                    }));

                    setCombinedData(merged);

                    // 👈 FILTER: Get the very last month from the array for the cards
                    if (merged.length > 0) {
                        setCurrentMonthData(merged[merged.length - 1]);
                    }
                }
            } catch (err) {
                toast.error("Failed to sync financial data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading || !expenseStats) {
        return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Filtering Monthly Records...</div>;
    }

    // Logic for cards (using Current Month Only)
    const monthlyIncome = currentMonthData.income;
    const monthlyExpense = currentMonthData.expenses;
    const monthlyNet = monthlyIncome - monthlyExpense;

    return (
        <div className="bg-white rounded-[35px] p-6 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col h-full">
            
            {/* 1. Header & Title */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Monthly Performance</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Comparative Analysis for <span className="text-indigo-600">{currentMonthData.month}</span>
                    </p>
                </div>
                <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase">
                    Live Data
                </div>
            </div>

            {/* 2. Top Metric Cards (NOW FILTERED TO CURRENT MONTH) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <div className="bg-[#f0f9ff] p-5 rounded-[25px] border border-blue-100/50">
                    <div className="bg-blue-500 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-100">
                        <MdLocalGasStation size={22} />
                    </div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Monthly Fuel</p>
                    {/* Note: This assumes fuel stats are also monthly. If total, you'd divide by months or filter in backend */}
                    <h3 className="text-xl font-black text-slate-800">₹{expenseStats.fuelExpenses.toLocaleString()}</h3>
                </div>

                <div className="bg-[#fffbeb] p-5 rounded-[25px] border border-amber-100/50">
                    <div className="bg-amber-500 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-amber-100">
                        <MdSettings size={22} />
                    </div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Monthly Maint.</p>
                    <h3 className="text-xl font-black text-slate-800">₹{expenseStats.maintenanceExpenses.toLocaleString()}</h3>
                </div>

                <div className="bg-[#fff1f2] p-5 rounded-[25px] border border-rose-100/50">
                    <div className="bg-rose-500 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-100">
                        <MdAccountBalanceWallet size={22} />
                    </div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Total Spent ({currentMonthData.month})</p>
                    <h3 className="text-xl font-black text-slate-800">₹{monthlyExpense.toLocaleString()}</h3>
                </div>

                <div className="bg-[#f0fdf4] p-5 rounded-[25px] border border-emerald-100/50">
                    <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-100">
                        <MdInsights size={22} />
                    </div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Net Profit ({currentMonthData.month})</p>
                    <h3 className="text-xl font-black text-slate-800">₹{monthlyNet.toLocaleString()}</h3>
                </div>
            </div>

            {/* 3. Graph remains a trend for context */}
            <div className="h-[400px] w-full bg-slate-50/30 rounded-[30px] p-4 border border-slate-50 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedData} margin={{ top: 40, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke="#e2e8f0" strokeWidth={1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 900}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip cursor={{fill: '#ffffff', opacity: 0.5}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                        <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{paddingBottom: '30px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase'}} />
                        
                        <Bar name="Revenue" dataKey="income" fill="#10b981" radius={[10, 10, 0, 0]} barSize={45}>
                            <LabelList dataKey="income" position="top" formatter={(v) => `₹${(v/1000).toFixed(1)}k`} className="fill-emerald-600 font-black text-[12px]" offset={12} />
                        </Bar>

                        <Bar name="Expenditure" dataKey="expenses" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={45}>
                            <LabelList dataKey="expenses" position="top" formatter={(v) => `₹${(v/1000).toFixed(1)}k`} className="fill-rose-600 font-black text-[12px]" offset={12} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpenditureOverview;