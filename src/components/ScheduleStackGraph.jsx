import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { MdEventNote, MdCheckCircle, MdBarChart } from 'react-icons/md';
import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL , SCHEDULES_URL} from '../api/constants';


const ScheduleStackGraph = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/admin/analytics/schedules`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(json => setData(json));
    }, [token]);

    if (!data) return <div className="h-96 bg-white rounded-[32px] animate-pulse" />;

    return (
        <div className="bg-white p-4 md:p-8 rounded-[24px] md:rounded-[35px] border border-slate-100 shadow-sm">
            
            {/* 1. Main Section Title */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                    <MdBarChart size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 leading-none">Operational Overview</h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Schedule performance tracking</p>
                </div>
            </div>

            {/* 2. Header Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 border border-indigo-100/50">
                    <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
                        <MdEventNote size={20}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Today's Total</p>
                        <p className="text-2xl font-black text-indigo-900 leading-tight">{data.todayTotal}</p>
                    </div>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-4 border border-emerald-100/50">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-200">
                        <MdCheckCircle size={20}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Today Completed</p>
                        <p className="text-2xl font-black text-emerald-900 leading-tight">{data.todayCompleted}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-sm font-black text-slate-500 mb-6 px-1 uppercase tracking-tighter">7-Day Schedule Load</h3>

            <div className="h-[350px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data.lastSevenDays}
                        margin={{ left: -10, right: 30, top: 0, bottom: 0 }}
                    >
                        {/* FIX: Darkened the grid lines. 
                            stroke="#e2e8f0" is a standard Slate-200.
                            strokeOpacity={1} ensures it is fully visible.
                        */}
                        <CartesianGrid 
                            strokeDasharray="0" 
                            horizontal={true} 
                            vertical={true} 
                            stroke="#cbd5e1" 
                            strokeOpacity={0.6}
                        />
                        
                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                        
                        <YAxis 
                            dataKey="date" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            width={70}
                            tick={{fontSize: 11, fontWeight: 800, fill: '#475569'}} // Darker font for Y-axis
                        />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{
                                borderRadius: '15px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Legend 
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle" 
                            wrapperStyle={{paddingTop: '20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase'}} 
                        />
                        
                        {/* Added stroke="#fff" and strokeWidth={0.5} to bars to make them pop against the grid */}
                        <Bar dataKey="completed" stackId="a" fill="#10b981" barSize={35} name="Completed" stroke="#fff" strokeWidth={0.5}>
                            <LabelList dataKey="completed" position="center" fill="#fff" style={{ fontSize: '10px', fontWeight: 'bold', pointerEvents: 'none' }} />
                        </Bar>
                        
                        <Bar dataKey="incomplete" stackId="a" fill="#f59e0b" name="Incomplete" stroke="#fff" strokeWidth={0.5}>
                            <LabelList dataKey="incomplete" position="center" fill="#fff" style={{ fontSize: '10px', fontWeight: 'bold', pointerEvents: 'none' }} />
                        </Bar>
                        
                        <Bar dataKey="cancelled" stackId="a" fill="#f43f5e" radius={[0, 10, 10, 0]} name="Cancelled" stroke="#fff" strokeWidth={0.5}>
                            <LabelList dataKey="cancelled" position="center" fill="#fff" style={{ fontSize: '10px', fontWeight: 'bold', pointerEvents: 'none' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ScheduleStackGraph;