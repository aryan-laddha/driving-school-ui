import React from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function UpdateModal({
  isOpen,
  onClose,
  editCustomer,
  instructors,
  vehiclesForModal,
  availableSlots,
  loadingSlots,
  isUpdating,
  handleModalChange,
  handleUpdateSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">Update Resources</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-5 rounded-r-md">
          <p className="text-xs md:text-sm text-blue-700">
            <strong>Heads up:</strong> Changes apply to all <strong>future</strong> classes for {editCustomer.name}.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Customer</label>
              <div className="text-sm font-medium text-gray-900">{editCustomer.name}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Contact</label>
              <div className="text-sm font-medium text-gray-900">{editCustomer.contact}</div>
            </div>
          </div>

          {/* Instructor Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Instructor</label>
            <select
              name="assignedInstructorId"
              value={editCustomer.assignedInstructorId}
              onChange={handleModalChange}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            >
              <option value="">Select Instructor</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Assigned</label>
            <select
              name="vehicleNumber"
              value={editCustomer.vehicleNumber}
              onChange={handleModalChange}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            >
              <option value="">Select Vehicle</option>
              {vehiclesForModal.map(vehicle => (
                <option key={vehicle.vehicleNumber} value={vehicle.vehicleNumber}>
                  {vehicle.model} ({vehicle.vehicleNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Pick & Drop */}
          <div
            className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => handleModalChange({ target: { name: 'pickAndDrop', type: 'checkbox', checked: !editCustomer.pickAndDrop } })}
          >
            <input
              id="pickAndDrop"
              name="pickAndDrop"
              type="checkbox"
              checked={editCustomer.pickAndDrop}
              onChange={handleModalChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor="pickAndDrop" className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer select-none">
              Opt for Pick & Drop Service (+30min buffer)
            </label>
          </div>

          {/* Time Slots */}
          {/* Time Slots */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between">
              <span>Available Time Slots</span>
              {loadingSlots && <span className="text-xs text-indigo-600 animate-pulse font-medium">Checking...</span>}
            </label>
            <select
              name="preferredStartTime"
              // This value ("07:00") will now match the option value ("07:00")
              value={editCustomer.preferredStartTime}
              onChange={handleModalChange}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
              disabled={loadingSlots}
            >
              <option value="">-- Select Time Slot --</option>

              {/* Display current time if not in the new available list */}
              {!loadingSlots && editCustomer.preferredStartTime && !availableSlots.some(s => s.startsWith(editCustomer.preferredStartTime)) && (
                <option value={editCustomer.preferredStartTime}>
                  {editCustomer.preferredStartTime} (Current)
                </option>
              )}

              {/* Map available slots */}
              {availableSlots.map(slot => {
                // Split the string here: 
                // cleanValue = "07:00"
                // displayLabel = "07:00 - 09:00"
                const cleanValue = slot.split(' ')[0];

                return (
                  <option key={slot} value={cleanValue}>
                    {slot}
                  </option>
                );
              })}
            </select>

            {!loadingSlots && availableSlots.length === 0 && (
              <p className="text-red-600 text-xs mt-1 font-medium">
                No slots available. Try changing Instructor or Vehicle.
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition flex items-center justify-center shadow-md"
              disabled={isUpdating || loadingSlots || availableSlots.length === 0}
            >
              {isUpdating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Updating...
                </>
              ) : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateModal;
