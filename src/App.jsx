// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages and Components
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';

import EnrollCustomer from './pages/EnrollCustomer'
import ManageCustomers from './pages/ManageCustomers';

import ManageUsers from './pages/ManageUsers';
import ManageVehicles from './pages/ManageVehicles';
import ManageCourses from './pages/ManageCourses';
import MySchedule from './pages/MySchedule';
import AdminScheduleView from './pages/AdminScheduleView';
import UserVehicleView from './pages/UserVehicleView';
import UserCourseView from './pages/UserCourseView';
import ManageQueries from './pages/ManageQueries';
import PaymentManagement from './pages/PaymentManagement';
import ManageExpenditures from './pages/ManageExpenditures';



// --- Placeholder Components for Admin Links ---
const AdminApprovals = () => ( /* ... content ... */
  <div className="bg-white p-6 rounded-lg shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Approvals</h2>
    <p>Admin content for managing new users.</p>
  </div>
);

const AdminSettings = () => ( /* ... content ... */
  <div className="bg-white p-6 rounded-lg shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Settings</h2>
    <p>Admin content for system configuration.</p>
  </div>
);

// --- Placeholder Components for User Links ---
const UserSchedule = () => ( /* ... content ... */
  <div className="bg-white p-6 rounded-lg shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Schedule</h2>
    <p>User content for viewing lesson schedules.</p>
  </div>
);

const UserStudents = () => ( /* ... content ... */
  <div className="bg-white p-6 rounded-lg shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Student Records</h2>
    <p>User content for managing student data.</p>
    <p>NOTE: This is a placeholder component.</p>
  </div>
);

const UserRequests = () => ( /* ... content ... */
  <div className="bg-white p-6 rounded-lg shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Time Off Request</h2>
    <p>User content for submitting requests.</p>
  </div>
);


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Protected Routes */}
      <Route element={<PrivateRoute allowedRole="ADMIN" />}>
        <Route element={<DashboardLayout role="ADMIN" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/enroll-customer" element={<EnrollCustomer />} />
          {/* <Route path="/user/schedule" element={<MySchedule />} /> */}

          {/* <Route path="/user/schedule" element={<MySchedule />} /> */}

          {/* NEW: Manage Customers Component */}
          <Route path="/admin/customers" element={<ManageCustomers />} />
          <Route path="/admin/schedule" element={<AdminScheduleView />} />

           <Route path="/admin/myschedule" element={<MySchedule />} />

          {/* Manage Users */}
          <Route path="/admin/users" element={<ManageUsers />} />

          {/* Manage Vehicles Component */}
          <Route path="/admin/vehicles" element={<ManageVehicles />} />

          {/* Manage Courses Component */}
          <Route path="/admin/courses" element={<ManageCourses />} />
          <Route path="/admin/payments" element={<PaymentManagement />} />
          <Route path="/admin/queries" element={<ManageQueries />} />
           <Route path="/admin/expenditure" element={<ManageExpenditures />} />


          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* User Protected Routes */}
      <Route element={<PrivateRoute allowedRole="USER" />}>
        {/* Use DashboardLayout, passing the role as a prop */}
        <Route element={<DashboardLayout role="USER" />}>

          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/schedule" element={<MySchedule />} />

          {/* New User paths */}

          <Route path="/user/courses" element={<UserCourseView />} />
          <Route path="/user/vehicles" element={<UserVehicleView />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <h1 className="text-3xl font-bold text-gray-700">404 - Not Found</h1>
        </div>
      } />
    </Routes>
  );
}

export default App;