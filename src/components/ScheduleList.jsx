import React from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  TruckIcon, 
  AcademicCapIcon,
  PhoneIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

// --- SUB-COMPONENT: MOBILE CARD ---
const MobileScheduleCard = ({ 
  schedule, 
  formatTime, 
  getStatusStyle, 
  loading, 
  onUpdateStatus, 
  onReschedule, 
  onCancelSingle, 
  onUpdateTime, 
  onCancelAll 
}) => {
  const isActionable = ['SCHEDULED', 'RESCHEDULED'].includes(schedule.status);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
      {/* Header: Date and Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <CalendarIcon className="w-5 h-5" />
          <span>{schedule.startDate}</span>
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${getStatusStyle(schedule.status)}`}>
          {schedule.status}
        </span>
      </div>

      {/* Info Grid */}
      <div className="space-y-3 mb-4">
        {/* Time and Course */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <AcademicCapIcon className="w-4 h-4 text-gray-400" />
            <span className="truncate">{schedule.courseName}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Customer & Instructor */}
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-bold text-gray-900">{schedule.customerName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <PhoneIcon className="w-3 h-3" /> {schedule.customerContact}
                </p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Instructor</p>
                <p className="text-sm text-gray-700">{schedule.instructorName}</p>
            </div>
        </div>

        {/* Vehicle */}
        <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-3">
            <TruckIcon className="w-5 h-5 text-indigo-500" />
            <div>
                <p className="text-sm font-medium text-gray-800">{schedule.vehicleName}</p>
                <p className="text-xs text-gray-500">{schedule.vehicleNumber}</p>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        {isActionable && (
          <>
            <button 
                onClick={() => onUpdateStatus(schedule.id, schedule.status)}
                disabled={loading}
                className="flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4" /> Done
            </button>
            <button 
                onClick={() => onReschedule(schedule)}
                className="flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
            >
              <ArrowPathRoundedSquareIcon className="w-4 h-4" /> Reschedule
            </button>
            <button 
                onClick={() => onUpdateTime(schedule)}
                className="flex items-center justify-center gap-1 bg-yellow-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-yellow-700"
            >
               Update Time
            </button>
            <button 
                onClick={() => onCancelSingle(schedule)}
                className="flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600"
            >
              <NoSymbolIcon className="w-4 h-4" /> Cancel
            </button>
          </>
        )}
        <button 
            onClick={() => onCancelAll(schedule)}
            className="col-span-2 mt-1 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-50"
        >
          Cancel All Future Lessons
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ScheduleList = ({ 
    schedules, 
    loading, 
    error, 
    formatTime, 
    getStatusStyle, 
    handleUpdateStatus, 
    handleRescheduleClick, 
    handleCancelSingleClick, 
    handleUpdateTimeClick, 
    handleCancelAllUpcoming 
}) => {

  if (loading && schedules.length === 0) {
    return <div className="p-8 text-center text-indigo-600 font-medium animate-pulse">Loading schedules...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 font-medium bg-red-50 rounded-lg m-4 border border-red-100">{error}</div>;
  }

  if (schedules.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <CalendarIcon className="w-12 h-12 mb-2 opacity-50" />
            <p>No schedules found.</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      
      {/* MOBILE VIEW (List of Cards) */}
      <div className="block md:hidden h-full overflow-y-auto p-4 pb-20 no-scrollbar">
        {schedules.map((schedule) => (
          <MobileScheduleCard 
            key={schedule.id}
            schedule={schedule}
            formatTime={formatTime}
            getStatusStyle={getStatusStyle}
            loading={loading}
            onUpdateStatus={handleUpdateStatus}
            onReschedule={handleRescheduleClick}
            onCancelSingle={handleCancelSingleClick}
            onUpdateTime={handleUpdateTimeClick}
            onCancelAll={handleCancelAllUpcoming}
          />
        ))}
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 h-fit max-h-full overflow-auto relative mx-6 mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dates</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time 🕒</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Instructor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Schedules Update 📝</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Time Update</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action 🛑</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-indigo-50/50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <span className="font-medium">S: {schedule.startDate}</span> <br/>
                  <span className="text-gray-400 text-xs">E: {schedule.endDate}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div className="font-bold">{schedule.customerName}</div>
                  <div className="text-xs text-gray-500">{schedule.customerContact}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {schedule.instructorName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div className="font-medium">{schedule.vehicleName}</div>
                  <div className="text-xs text-gray-400">({schedule.vehicleNumber})</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {schedule.courseName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase ${getStatusStyle(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </td>
                
                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-1">
                        {['SCHEDULED', 'RESCHEDULED'].includes(schedule.status) && (
                            <>
                                <button onClick={() => handleUpdateStatus(schedule.id, schedule.status)} disabled={loading} className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition disabled:opacity-50">Mark Completed</button>
                                <button onClick={() => handleRescheduleClick(schedule)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition">Reschedule</button>
                                <button onClick={() => handleCancelSingleClick(schedule)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition">Cancel</button>
                            </>
                        )}
                    </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                        onClick={() => handleUpdateTimeClick(schedule)} 
                        disabled={schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED'}
                        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition disabled:opacity-50"
                    >
                        Update Time
                    </button>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button onClick={() => handleCancelAllUpcoming(schedule)} className="px-3 py-1 bg-red-700 text-white text-xs rounded-md hover:bg-red-800 transition shadow-sm">
                        Cancel All
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleList;