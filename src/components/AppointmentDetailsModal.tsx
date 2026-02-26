// components/AppointmentDetailsModal.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, DollarSign, Phone, Mail, MapPin, FileText, CreditCard, UserCheck, Scissors, Tag, Info, X } from "lucide-react";
import { format } from "date-fns";

interface AppointmentDetails {
  id: string | number;
  customer: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
  branch: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Firebase specific fields
  bookingNumber?: string;
  bookingDate?: string;
  bookingTime?: string;
  staffId?: string;
  staffName?: string;
  staffRole?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string;
  serviceName?: string;
  serviceDuration?: number;
  servicePrice?: number;
  serviceId?: string;
  serviceCategory?: string;
  serviceCategoryId?: string;
  branchId?: string;
  userBranchId?: string;
  userBranchName?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  taxAmount?: number;
  tip?: number;
  totalTips?: number;
  totalDuration?: number;
  products?: any[];
  productsTotal?: number;
  services?: string[];
  servicesDetails?: any[];
  teamMembers?: any[];
  createdBy?: string;
  trnNumber?: string;
  cardLast4Digits?: string;
  pointsAwarded?: boolean;
  discount?: number;
  discountType?: string;
  discountAmount?: number;
  paymentAmounts?: {
    cash?: number;
    card?: number;
    wallet?: number;
    check?: number;
    digital?: number;
  };
  branches?: string[];
  branchNames?: string[];
  timeSlot?: string;
  originalTime?: string;
}

interface AppointmentDetailsModalProps {
  appointment: AppointmentDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (appointmentId: string | number, newStatus: string) => void;
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed": return "bg-green-500";
    case "in-progress": 
    case "in progress": return "bg-blue-500";
    case "scheduled": return "bg-yellow-500";
    case "approved": return "bg-purple-500";
    case "pending": return "bg-orange-500";
    case "cancelled": 
    case "rejected": 
    case "cancelled/rejected": return "bg-red-500";
    default: return "bg-gray-300";
  }
};

const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed": return "Completed";
    case "in-progress": 
    case "in progress": return "In Progress";
    case "scheduled": return "Scheduled";
    case "approved": return "Approved";
    case "pending": return "Pending";
    case "cancelled": return "Cancelled";
    case "rejected": return "Rejected";
    case "cancelled/rejected": return "Cancelled/Rejected";
    default: return status;
  }
};

const formatCurrency = (amount: number): string => {
  return `AED ${amount?.toFixed(2) || '0.00'}`;
};

const formatDateTime = (date: string | Date): string => {
  try {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return format(dateObj, 'PPpp');
  } catch (e) {
    return 'Invalid Date';
  }
};

export function AppointmentDetailsModal({ 
  appointment, 
  isOpen, 
  onClose,
  onStatusChange 
}: AppointmentDetailsModalProps) {
  if (!isOpen || !appointment) return null;

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && appointment.id) {
      onStatusChange(appointment.id, newStatus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">
                Appointment Details
              </h2>
              <Badge className={`${getStatusColor(appointment.status)} text-white`}>
                {getStatusText(appointment.status)}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            <div className="mb-4 text-sm text-gray-500">
              Booking #{appointment.bookingNumber || appointment.id}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{appointment.customerName || appointment.customer || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium ml-auto">{appointment.customerPhone || appointment.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium ml-auto">{appointment.customerEmail || appointment.email || "N/A"}</span>
                    </div>
                    {appointment.customerId && (
                      <div className="text-sm text-gray-500">
                        Customer ID: {appointment.customerId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Service Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{appointment.serviceName || appointment.service || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {appointment.serviceDuration || appointment.totalDuration || appointment.duration || "N/A"}
                      </span>
                    </div>
                    {appointment.serviceCategory && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{appointment.serviceCategory}</span>
                      </div>
                    )}
                    {appointment.services && appointment.services.length > 0 && (
                      <div>
                        <span className="text-gray-600 block mb-1">Services:</span>
                        <div className="flex flex-wrap gap-1">
                          {appointment.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Staff Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Staff:</span>
                      <span className="font-medium">{appointment.staffName || appointment.barber || "N/A"}</span>
                    </div>
                    {appointment.staffRole && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium">{appointment.staffRole}</span>
                      </div>
                    )}
                    {appointment.staffId && (
                      <div className="text-sm text-gray-500">
                        Staff ID: {appointment.staffId}
                      </div>
                    )}
                    {appointment.teamMembers && appointment.teamMembers.length > 0 && (
                      <div>
                        <span className="text-gray-600 block mb-1">Team Members:</span>
                        <div className="space-y-1">
                          {appointment.teamMembers.map((member, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{member.name || member.staffName || "Unknown"}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.role || "Staff"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Booking & Payment Info */}
              <div className="space-y-4">
                {/* Booking Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Booking Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium ml-auto">
                        {appointment.bookingDate || appointment.date || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium ml-auto">
                        {appointment.originalTime || appointment.bookingTime || appointment.timeSlot || appointment.time || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Branch:</span>
                      <span className="font-medium ml-auto">
                        {appointment.branch || appointment.userBranchName || "N/A"}
                      </span>
                    </div>
                    {appointment.source && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Source:</span>
                        <Badge variant="outline">
                          {appointment.source === 'customer_app' ? 'Customer App' : 
                           appointment.source === 'admin_panel' ? 'Admin Panel' : 
                           appointment.source}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-sm">
                        {formatDateTime(appointment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-sm">
                        {formatDateTime(appointment.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(appointment.totalAmount || appointment.price || 0)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(appointment.subtotal || 0)}</span>
                      </div>
                      {appointment.taxAmount && appointment.taxAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tax ({appointment.tax || 0}%):</span>
                          <span>{formatCurrency(appointment.taxAmount)}</span>
                        </div>
                      )}
                      {appointment.tip && appointment.tip > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tip:</span>
                          <span>{formatCurrency(appointment.tip)}</span>
                        </div>
                      )}
                      {appointment.discountAmount && appointment.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span>Discount ({appointment.discountType || 'fixed'}):</span>
                          <span>-{formatCurrency(appointment.discountAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Payment Method:</span>
                        <Badge variant="outline" className="capitalize">
                          {appointment.paymentMethod || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge variant={appointment.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {appointment.paymentStatus || 'Pending'}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment Amounts Breakdown */}
                    {appointment.paymentAmounts && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium mb-2">Payment Breakdown:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(appointment.paymentAmounts).map(([method, amount]) => (
                            amount > 0 && (
                              <div key={method} className="flex items-center justify-between">
                                <span className="text-gray-600 capitalize">{method}:</span>
                                <span>{formatCurrency(amount)}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {appointment.products && appointment.products.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium mb-2">Products:</h4>
                        <div className="space-y-2">
                          {appointment.products.map((product, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium">{product.productName || product.name}</span>
                                <span className="text-gray-500 ml-2">x{product.quantity || 1}</span>
                              </div>
                              <span>{formatCurrency(product.total || product.price || 0)}</span>
                            </div>
                          ))}
                          {appointment.productsTotal && appointment.productsTotal > 0 && (
                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="text-gray-600">Products Total:</span>
                              <span className="font-medium">{formatCurrency(appointment.productsTotal)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes and Additional Info */}
                {(appointment.notes || appointment.trnNumber) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Additional Information
                    </h3>
                    <div className="space-y-3">
                      {appointment.notes && (
                        <div>
                          <span className="text-gray-600 block mb-1">Notes:</span>
                          <p className="text-sm bg-white p-2 rounded border">{appointment.notes}</p>
                        </div>
                      )}
                      {appointment.trnNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">TRN Number:</span>
                          <span className="font-medium">{appointment.trnNumber}</span>
                        </div>
                      )}
                      {appointment.cardLast4Digits && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Card Last 4 Digits:</span>
                          <span className="font-medium">**** {appointment.cardLast4Digits}</span>
                        </div>
                      )}
                      {appointment.pointsAwarded !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Points Awarded:</span>
                          <Badge variant={appointment.pointsAwarded ? "default" : "outline"}>
                            {appointment.pointsAwarded ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap gap-2 justify-between items-center p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              ID: {appointment.id} | Booking: {appointment.bookingNumber || 'N/A'}
            </div>
            
            <div className="flex gap-2">
              {onStatusChange && (
                <div className="flex gap-2">
                  {appointment.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('completed')}
                      className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    >
                      Mark as Completed
                    </Button>
                  )}
                  {appointment.status !== 'cancelled' && appointment.status !== 'cancelled/rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('cancelled')}
                      className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}