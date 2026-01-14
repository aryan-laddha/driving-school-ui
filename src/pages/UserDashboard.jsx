// src/pages/UserDashboard.jsx
import React from 'react';
import { getUserRole } from '../utils/auth';

function UserDashboard() {
  const role = getUserRole(); // Should be 'USER'
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border-l-4 border-blue-500">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Welcome Back, Staff Member!
      </h2>
      <p className="text-gray-600">
        This is your staff dashboard. Use the sidebar to access your schedule, student records, and request time off.
      </p>
      
      <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-medium text-gray-700 mb-3">Key Information</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-600">
              <li>Lessons Scheduled Today: 5</li>
              <li>Pending Time Off Requests: 0</li>
          </ul>
      </div>
    </div>
  );
}

export default UserDashboard;