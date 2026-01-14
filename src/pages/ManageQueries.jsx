import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  QueueListIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BellAlertIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/constants';

const API_URL = `${API_BASE}/queries`;

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString.substring(0, 10);
  }
};

function ManageQueries() {
  const { token, role, isAuthenticated, logout } = useAuth();
  
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [sortConfig, setSortConfig] = useState({ key: 'submissionDate', direction: 'descending' });

  const fetchQueries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }
      
      if (!response.ok) throw new Error("Failed to fetch queries.");

      const result = await response.json();
      setQueries(Array.isArray(result) ? result : result.data || []);
    } catch (e) {
      setError(e.message);
      if (!e.message.includes("Session expired")) toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (isAuthenticated) fetchQueries();
  }, [isAuthenticated, fetchQueries]);

  const handleUpdateStatus = async (id, field, value) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (response.ok) {
        toast.success('Updated successfully');
        setQueries(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const filteredAndSortedQueries = useMemo(() => {
    let result = queries.filter(q => {
      const matchesSearch = 
        q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.queryText?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'RESOLVED' && q.isResolved) ||
        (statusFilter === 'PENDING' && !q.isResolved);

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [queries, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <header className="flex-none bg-white border-b border-gray-200 z-20 px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center tracking-tight">
            <QueueListIcon className="w-7 h-7 mr-2 text-indigo-600" />
            Customer Queries
          </h2>
          
          <div className="bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-100 min-w-[140px]">
            <p className="text-[10px] text-indigo-500 font-bold uppercase leading-none">Total Queries</p>
            <p className="text-lg font-black text-indigo-700">{filteredAndSortedQueries.length}</p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-6">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers or messages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="lg:col-span-3 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select 
            className="lg:col-span-3 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium"
            onChange={(e) => requestSort(e.target.value)}
            value={sortConfig.key}
          >
            <option value="submissionDate">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        
        {loading ? (
          <div className="flex justify-center py-10 text-indigo-600 font-bold">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium border border-red-100">{error}</div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Message Details</th>
                      <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider">Follow-Up</th>
                      <th className="px-6 py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredAndSortedQueries.map((query) => (
                      <tr key={query.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 leading-none mb-1">{query.name}</div>
                          <div className="text-[10px] text-indigo-500 font-bold">{query.email}</div>
                          <div className="text-[10px] text-gray-400 italic">{query.phoneNumber || 'No Phone'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-sm font-bold text-black max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-200" 
                            title={query.queryText}
                          >
                            {query.queryText}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDateTime(query.submissionDate)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleUpdateStatus(query.id, 'isFollowUpRequired', !query.isFollowUpRequired)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm border ${
                              query.isFollowUpRequired 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}
                          >
                            {query.isFollowUpRequired ? <BellAlertIcon className="w-3.5 h-3.5"/> : <BellSlashIcon className="w-3.5 h-3.5"/>}
                            {query.isFollowUpRequired ? 'Required' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleUpdateStatus(query.id, 'isResolved', !query.isResolved)}
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all border ${
                              query.isResolved 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {query.isResolved ? 'Resolved' : 'Pending'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {filteredAndSortedQueries.map((query) => (
                <div key={query.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-black text-indigo-500 uppercase px-2 py-1 bg-indigo-50 rounded-lg">
                      {formatDateTime(query.submissionDate)}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${query.isResolved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {query.isResolved ? <CheckCircleIcon className="w-3 h-3"/> : <ExclamationCircleIcon className="w-3 h-3"/>}
                      {query.isResolved ? 'Resolved' : 'Pending'}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 leading-tight">{query.name}</h3>
                  <p className="text-[11px] text-indigo-600 font-bold mb-3">{query.email}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                    <p className="text-sm font-bold text-black leading-relaxed">"{query.queryText}"</p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleUpdateStatus(query.id, 'isFollowUpRequired', !query.isFollowUpRequired)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                        query.isFollowUpRequired 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}
                    >
                      {query.isFollowUpRequired ? 'Follow-up' : 'No Follow-up'}
                    </button>
                    
                    <button 
                      onClick={() => handleUpdateStatus(query.id, 'isResolved', !query.isResolved)}
                      className="text-[11px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      MARK AS {query.isResolved ? 'PENDING' : 'RESOLVED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ManageQueries;