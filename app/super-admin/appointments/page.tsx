'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  Phone, 
  Mail, 
  DollarSign, 
  RefreshCw,
  Building,
  CreditCard,
  Wallet,
  CalendarDays,
  Check,
  X,
  Users,
  TrendingUp
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== ZUSTAND STORE ====================
interface Booking {
  id: string;
  bookingDate: string;
  bookingNumber: string;
  bookingTime: string;
  timeSlot: string;
  branch: string;
  branchId: string;
  branchNames: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  createdAt: Timestamp;
  paymentMethod: string;
  paymentStatus: string;
  paymentAmounts: {
    cash: number;
    wallet: number;
    [key: string]: number;
  };
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceCategory: string;
  serviceCategoryId: string;
  serviceId: string;
  staffName: string;
  staffRole: string;
  staffId: string;
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  taxAmount: number;
  tip: number;
  totalAmount: number;
  status: string;
  source: string;
  notes: string;
  createdBy: string;
  teamMembers: Array<{
    name: string;
    role: string;
    staffId: string;
  }>;
  products: any[];
  productsTotal: number;
  totalDuration: number;
  totalTips: number;
  pointsAwarded: boolean;
  userBranchName: string;
  userBranchId: string;
  userRole: string;
  cardLast4Digits: string;
  trnNumber: string;
  services: string[];
  serviceCharges: number;
  serviceTip: number;
  date: string;
  branches: string[];
  updatedAt: Timestamp;
}

interface BookingsStore {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  
  fetchBookings: () => Promise<void>;
  updateBookingStatus: (bookingId: string, newStatus: string) => Promise<void>;
}

const useBookingsStore = create<BookingsStore>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchBookings: async () => {
    try {
      set({ isLoading: true });
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          bookingDate: data.bookingDate || '',
          bookingNumber: data.bookingNumber || `BOOK-${doc.id.substring(0, 8)}`,
          bookingTime: data.bookingTime || '',
          timeSlot: data.timeSlot || '',
          branch: data.branch || data.userBranchName || 'Unknown Branch',
          branchId: data.branchId || data.userBranchId || '',
          branchNames: data.branchNames || [],
          customerName: data.customerName || 'Unknown Customer',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          customerId: data.customerId || '',
          createdAt: data.createdAt || Timestamp.now(),
          paymentMethod: data.paymentMethod || 'unknown',
          paymentStatus: data.paymentStatus || 'pending',
          paymentAmounts: data.paymentAmounts || { cash: 0, wallet: 0 },
          serviceName: data.serviceName || data.services?.[0] || 'Unknown Service',
          servicePrice: Number(data.servicePrice) || 0,
          serviceDuration: Number(data.serviceDuration) || 0,
          serviceCategory: data.serviceCategory || '',
          serviceCategoryId: data.serviceCategoryId || '',
          serviceId: data.serviceId || '',
          staffName: data.staffName || '',
          staffRole: data.staffRole || '',
          staffId: data.staffId || '',
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          discountAmount: Number(data.discountAmount) || 0,
          tax: Number(data.tax) || 0,
          taxAmount: Number(data.taxAmount) || 0,
          tip: Number(data.tip) || 0,
          totalAmount: Number(data.totalAmount) || 0,
          status: data.status || 'pending',
          source: data.source || 'unknown',
          notes: data.notes || '',
          createdBy: data.createdBy || 'system',
          teamMembers: data.teamMembers || [],
          products: data.products || [],
          productsTotal: Number(data.productsTotal) || 0,
          totalDuration: Number(data.totalDuration) || 0,
          totalTips: Number(data.totalTips) || 0,
          pointsAwarded: Boolean(data.pointsAwarded) || false,
          userBranchName: data.userBranchName || data.branch || '',
          userBranchId: data.userBranchId || '',
          userRole: data.userRole || 'customer',
          cardLast4Digits: data.cardLast4Digits || '',
          trnNumber: data.trnNumber || '',
          services: data.services || [],
          serviceCharges: Number(data.serviceCharges) || 0,
          serviceTip: Number(data.serviceTip) || 0,
          date: data.date || '',
          branches: data.branches || [],
          updatedAt: data.updatedAt || Timestamp.now()
        });
      });
      
      set({ bookings: bookingsData, isLoading: false });
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set({ 
        error: 'Failed to load bookings. Please try again.', 
        isLoading: false 
      });
    }
  },

  updateBookingStatus: async (bookingId: string, newStatus: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      set(state => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      }));
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },
}));

// ==================== MODAL COMPONENT ====================
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
}

const BookingModal = ({ isOpen, onClose, booking }: BookingModalProps) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Booking Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="p-6">
          {/* Booking Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{booking.bookingNumber}</h3>
                <p className="text-gray-600">{booking.customerName}</p>
              </div>
              <Badge className={cn(
                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
              )}>
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Grid Layout for Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div>
                <h4 className="font-bold mb-2 text-gray-700">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{booking.customerName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{booking.customerEmail}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{booking.customerPhone}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Customer ID: {booking.customerId?.substring(0, 10) || 'N/A'}...
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-bold mb-2 text-gray-700">Booking Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Date: {booking.bookingDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Time: {booking.bookingTime} ({booking.timeSlot})</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Branch: {booking.branch}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Booking ID: {booking.id?.substring(0, 12) || 'N/A'}...
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Service Information */}
              <div>
                <h4 className="font-bold mb-2 text-gray-700">Service Information</h4>
                <div className="space-y-2">
                  <div className="font-medium">{booking.serviceName}</div>
                  <div className="text-sm text-gray-600">
                    Category: {booking.serviceCategory}
                  </div>
                  <div className="text-sm">
                    Price: ${booking.servicePrice?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm">
                    Duration: {booking.serviceDuration} minutes
                  </div>
                  <div className="text-sm text-gray-500">
                    Service ID: {booking.serviceId?.substring(0, 10) || 'N/A'}...
                  </div>
                </div>
              </div>

              {/* Staff Information */}
              <div>
                <h4 className="font-bold mb-2 text-gray-700">Staff Information</h4>
                <div className="space-y-2">
                  <div className="font-medium">{booking.staffName}</div>
                  <div className="text-sm text-gray-600">{booking.staffRole}</div>
                  <div className="text-sm text-gray-500">
                    Staff ID: {booking.staffId?.substring(0, 10) || 'N/A'}...
                  </div>
                  {booking.teamMembers?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Team Members:</p>
                      {booking.teamMembers.map((member: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 ml-2">
                          • {member.name} ({member.role})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-bold mb-3 text-gray-700">Financial Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-bold">AED {booking.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="text-lg font-bold flex items-center">
                  {booking.paymentMethod === 'cash' && <DollarSign className="w-4 h-4 mr-1" />}
                  {booking.paymentMethod === 'card' && <CreditCard className="w-4 h-4 mr-1" />}
                  {booking.paymentMethod === 'wallet' && <Wallet className="w-4 h-4 mr-1" />}
                  {booking.paymentMethod || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge className={cn(
                  booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {booking.paymentStatus}
                </Badge>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Discount</p>
                <p className="text-lg font-bold">${booking.discountAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== CALCULATE STATS FUNCTION ====================
const calculateStats = (bookings: Booking[], dateFilter: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Apply date filter
  let filteredBookings = bookings;
  if (dateFilter && dateFilter !== 'all') {
    if (dateFilter === 'today') {
      filteredBookings = bookings.filter(b => b.bookingDate === today);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filteredBookings = bookings.filter(b => b.bookingDate === yesterdayStr);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= weekAgo;
      });
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= monthAgo;
      });
    } else if (dateFilter === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= yearAgo;
      });
    } else if (dateFilter.includes('-') && dateFilter.length === 10) {
      // Custom date (YYYY-MM-DD format)
      filteredBookings = bookings.filter(b => b.bookingDate === dateFilter);
    }
  }

  const totalAppointments = filteredBookings.length;
  
  const todayAppointments = filteredBookings.filter(b => b.bookingDate === today).length;
  
  // Total Revenue = Sabhi bookings ki total services value (completed status wali)
  const totalRevenue = filteredBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, booking) => sum + (booking.servicePrice || 0), 0);
  
  const completedStatus = filteredBookings.filter(b => b.status === 'completed').length;
  const pendingStatus = filteredBookings.filter(b => b.status === 'pending').length;
  const rejectedStatus = filteredBookings.filter(b => b.status === 'cancelled' || b.status === 'no-show').length;

  return {
    totalAppointments,
    todayAppointments,
    totalRevenue,
    completedStatus,
    pendingStatus,
    rejectedStatus,
    filteredBookings
  };
};

// ==================== MAIN COMPONENT ====================
export default function SuperAdminAppointments() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use bookings store
  const { 
    bookings, 
    error, 
    fetchBookings, 
    updateBookingStatus
  } = useBookingsStore();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleViewClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      alert('Status updated successfully!');
    } catch (error) {
      alert('Failed to update booking status. Please try again.');
    }
  };

  // Calculate stats based on filters
  const stats = calculateStats(bookings, dateFilter);
  
  // Apply additional filters
  const filteredBookings = stats.filteredBookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.staffName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || booking.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const branches = Array.from(new Set(bookings.map(b => b.branch || 'Unknown Branch')));

  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Check
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    },
    'no-show': { 
      label: 'No Show', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: X
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last Year' }
  ];

  const handleCustomDateChange = (date: string) => {
    setCustomDate(date);
    setDateFilter(date); // Set the custom date as filter
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "h-screen overflow-y-auto flex-shrink-0 sticky top-0",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <AdminSidebar 
            role="super_admin"
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          "min-h-screen"
        )}>
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
                <p className="text-sm lg:text-base text-gray-600">View and manage all bookings</p>
              </div>
            
            </div>

            {/* STATS CARDS - As requested */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              {/* Total Appointments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    All time bookings
                  </p>
                </CardContent>
              </Card>

              {/* Today's Appointments */}
              
              {/* Total Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Completed services value
                  </p>
                </CardContent>
              </Card>

              {/* Completed Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Check className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completedStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    Successful bookings
                  </p>
                </CardContent>
              </Card>

              {/* Pending Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting confirmation
                  </p>
                </CardContent>
              </Card>

              {/* Rejected Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <X className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.rejectedStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    Cancelled + No Show
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Branch Filter */}
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Date Range Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Custom Date Input */}
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    placeholder="Custom Date (YYYY-MM-DD)"
                    className="w-full"
                  />
                </div>
                
                {/* Active filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {statusFilter !== 'all' && (
                    <Badge variant="outline" className="gap-2">
                      Status: {statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                      <button onClick={() => setStatusFilter('all')} className="text-gray-400 hover:text-gray-600">
                        ×
                      </button>
                    </Badge>
                  )}
                  {branchFilter !== 'all' && (
                    <Badge variant="outline" className="gap-2">
                      Branch: {branchFilter}
                      <button onClick={() => setBranchFilter('all')} className="text-gray-400 hover:text-gray-600">
                        ×
                      </button>
                    </Badge>
                  )}
                  {dateFilter !== 'all' && (
                    <Badge variant="outline" className="gap-2">
                      Date: {
                        dateOptions.find(opt => opt.value === dateFilter)?.label || 
                        (customDate || 'Custom Date')
                      }
                      <button onClick={() => {
                        setDateFilter('all');
                        setCustomDate('');
                      }} className="text-gray-400 hover:text-gray-600">
                        ×
                      </button>
                    </Badge>
                  )}
                  {(statusFilter !== 'all' || branchFilter !== 'all' || dateFilter !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setStatusFilter('all');
                        setBranchFilter('all');
                        setDateFilter('all');
                        setCustomDate('');
                        setSearchQuery('');
                      }}
                      className="text-xs"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
                
                {/* Stats Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {filteredBookings.length} bookings 
                    {dateFilter !== 'all' && ` for selected date range`}
                    {statusFilter !== 'all' && ` with status: ${statusFilter}`}
                    {branchFilter !== 'all' && ` at branch: ${branchFilter}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SIMPLE TABLE - As requested */}
            <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action & Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const status = statusConfig[booking.status as keyof typeof statusConfig];
                    const StatusIcon = status?.icon || AlertCircle;
                    
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        {/* Booking ID */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-bold text-primary">{booking.bookingNumber}</div>
                          <div className="text-xs text-gray-500">{booking.id.substring(0, 8)}...</div>
                        </td>
                        
                        {/* Time */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Clock className="w-3 h-3 mr-1 text-gray-400" />
                            {booking.bookingTime}
                          </div>
                          <div className="text-xs text-gray-500">{booking.timeSlot}</div>
                        </td>
                        
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {booking.bookingDate}
                          </div>
                        </td>
                        
                        {/* Email */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {booking.customerEmail}
                          </div>
                        </td>
                        
                        {/* Phone No */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {booking.customerPhone}
                          </div>
                        </td>
                        
                        {/* Customer Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <User className="w-3 h-3 mr-1 text-gray-400" />
                            {booking.customerName}
                          </div>
                        </td>
                        
                        {/* Service Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{booking.serviceName}</div>
                          <div className="text-xs text-gray-500">${booking.servicePrice.toFixed(2)}</div>
                        </td>
                        
                        {/* Staff Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{booking.staffName}</div>
                          <div className="text-xs text-gray-500">{booking.staffRole}</div>
                        </td>
                        
                        {/* Action & Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* View Icon */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewClick(booking)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {/* Status Badge */}
                            <Badge className={cn(
                              "gap-2 px-3 py-1 font-medium justify-center",
                              status?.color
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{status?.label || booking.status}</span>
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* No Results */}
              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('all');
                      setBranchFilter('all');
                      setDateFilter('all');
                      setCustomDate('');
                      setSearchQuery('');
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>

            {/* Total Results */}
            <div className="mt-6 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  Showing {filteredBookings.length} of {stats.totalAppointments} filtered bookings
                  {dateFilter !== 'all' && ` (${stats.totalAppointments} total in date range)`}
                </div>
                <div className="text-xs text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for View Details */}
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      </div>
    </ProtectedRoute>
  );
}