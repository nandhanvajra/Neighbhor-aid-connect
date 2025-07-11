import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, AlertCircle } from 'lucide-react';
import config from '../config/config';

const ServiceRequestModal = ({ isOpen, onClose, staffMember, onSubmit }) => {
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    address: '',
    urgency: 'medium',
    additionalNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.serviceType || !formData.description || !formData.preferredDate) {
        throw new Error(config.serviceRequestModal.requiredFieldText);
      }

      // Call the onSubmit function passed from parent
      await onSubmit({
        ...formData,
        staffMemberId: staffMember._id,
        staffMemberName: staffMember.name
      });

      // Reset form and close modal
      setFormData({
        serviceType: '',
        description: '',
        preferredDate: '',
        preferredTime: '',
        address: '',
        urgency: 'medium',
        additionalNotes: ''
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      serviceType: '',
      description: '',
      preferredDate: '',
      preferredTime: '',
      address: '',
      urgency: 'medium',
      additionalNotes: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{config.serviceRequestModal.title}</h2>
            <p className="text-gray-600">{config.serviceRequestModal.subtitle.replace('{name}', staffMember?.name)}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.serviceRequestModal.serviceTypeLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Select service type</option>
              {config.serviceCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.serviceRequestModal.descriptionLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={config.serviceRequestModal.descriptionPlaceholder}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.serviceRequestModal.preferredDateLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.serviceRequestModal.preferredTimeLabel}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.serviceRequestModal.addressLabel}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={config.serviceRequestModal.addressPlaceholder}
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.serviceRequestModal.urgencyLabel}
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {config.urgencyLevels.map((urgency) => (
                <option key={urgency.value} value={urgency.value}>
                  {urgency.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.serviceRequestModal.additionalNotesLabel}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={config.serviceRequestModal.additionalNotesPlaceholder}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {config.serviceRequestModal.cancelText}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? config.serviceRequestModal.submittingText : config.serviceRequestModal.submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestModal; 