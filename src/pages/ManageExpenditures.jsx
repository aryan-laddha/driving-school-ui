import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  BanknotesIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

import { getToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import AddExpenditureSidebar from '../components/AddExpenditureSidebar';

import { API_BASE, USERS_URL, VEHICLES_URL, COURSES_URL } from '../api/constants';

// const BASE_URL = 'http://localhost:8080/api/expenditures';
// const VEHICLE_URL = 'http://localhost:8080/api/vehicles';

function ManageExpenditures() {
  const { role } = useAuth();
  const token = getToken();

  // Data States
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [periodPreset, setPeriodPreset] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = useMemo(() => {
    const r = role?.toUpperCase();
    return r === 'ADMIN' || r === 'ROLE_ADMIN';
  }, [role]);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(VEHICLE_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setVehicles(result.data || []);
    } catch (error) {
      console.error("Error fetching vehicles", error);
    }
  }, [token]);

  const fetchExpenses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const result = await response.json();
      if (result.success) setExpenses(result.data || []);
    } catch (error) {
      toast.error('Session expired');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchExpenses();
      fetchVehicles();
    }
  }, [token, fetchExpenses, fetchVehicles]);

  const handlePeriodChange = (val) => {
    setPeriodPreset(val);
    const today = new Date();
    let start = new Date();
    if (val === 'DAY') start = new Date();
    else if (val === 'WEEK') start.setDate(today.getDate() - 7);
    else if (val === 'MONTH') start.setMonth(today.getMonth() - 1);
    else if (val === 'YEAR') start.setFullYear(today.getFullYear() - 1);
    else { setDateRange({ start: '', end: '' }); return; }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.expenseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || exp.expenseType === typeFilter;
      const matchesVehicle = vehicleFilter === 'ALL' || exp.vehicleNumber === vehicleFilter;
      const matchesDate = (!dateRange.start || exp.expenseDate >= dateRange.start) &&
                          (!dateRange.end || exp.expenseDate <= dateRange.end);
      return matchesSearch && matchesType && matchesVehicle && matchesDate;
    });
  }, [expenses, searchTerm, typeFilter, vehicleFilter, dateRange]);

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleExport = () => {
    const headers = ["Date", "Vehicle", "Name", "Type", "Amount", "Details"];
    const csv = [headers.join(","), ...filteredExpenses.map(e => 
      [e.expenseDate, e.vehicleNumber, e.expenseName, e.expenseType, e.price, `"${e.details || ''}"`].join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Expenditures.csv";
    link.click();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      <Toaster position="top-right" />

      <header className="flex-none bg-white border-b border-gray-200 z-20 px-4 sm:px-6 py-4 shadow-sm">
        {/* TOP ROW: Title & Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center tracking-tight">
            <BanknotesIcon className="w-7 h-7 mr-2 text-indigo-600" />
            Expenditures
          </h2>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all font-bold text-sm">
               <ArrowDownTrayIcon className="w-4 h-4" /> Export
             </button>
             <div className="bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-100 text-right min-w-[120px]">
                <p className="text-[10px] text-indigo-500 font-bold uppercase leading-none">Total Sum</p>
                <p className="text-lg font-black text-indigo-700">₹{totalAmount.toLocaleString()}</p>
             </div>
             {isAdmin && (
                <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all">
                  <PlusIcon className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>

        {/* FILTER BAR: Responsive Grid to prevent screen overflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-3">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="lg:col-span-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="FUEL">Fuel</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OTHER">Other</option>
          </select>

          <select 
            className="lg:col-span-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="ALL">All Vehicles</option>
            {vehicles.map(v => <option key={v.vehicleNumber} value={v.vehicleNumber}>{v.vehicleNumber}</option>)}
          </select>

          <select 
            className="lg:col-span-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold"
            value={periodPreset}
            onChange={(e) => handlePeriodChange(e.target.value)}
          >
            <option value="ALL">Quick Period</option>
            <option value="DAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="YEAR">This Year</option>
          </select>

          <div className="lg:col-span-3 flex gap-2">
             <input type="date" className="w-1/2 px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})}/>
             <input type="date" className="w-1/2 px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})}/>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        
        {/* TABLE VIEW (Hidden on Mobile) */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px]">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-900 whitespace-nowrap">{exp.expenseDate}</td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-gray-900 leading-none mb-1">{exp.vehicleNumber}</div>
                       <div className="text-[10px] text-indigo-500 font-bold uppercase">{exp.vehicleName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{exp.expenseName}</td>
                    <td className="px-6 py-4 text-sm text-400 italic max-w-xs truncate" title={exp.details}>
                        {exp.details || '-'}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                          exp.expenseType === 'FUEL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                          {exp.expenseType}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right text-base font-black text-gray-900">₹{exp.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD VIEW (Shown on Mobile) */}
        <div className="md:hidden space-y-4">
           {filteredExpenses.map((exp) => (
              <div key={exp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-black text-indigo-500 uppercase px-2 py-1 bg-indigo-50 rounded-lg">{exp.expenseDate}</div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">{exp.expenseType}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{exp.expenseName}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4 italic">"{exp.details || 'N/A'}"</p>
                <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                   <div>
                      <div className="text-sm font-bold text-gray-800">{exp.vehicleNumber}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{exp.vehicleName}</div>
                   </div>
                   <div className="text-xl font-black text-gray-900 tracking-tighter">₹{exp.price.toLocaleString()}</div>
                </div>
              </div>
           ))}
        </div>
      </main>

      <AddExpenditureSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onExpenseAdded={fetchExpenses} />
    </div>
  );
}

export default ManageExpenditures;