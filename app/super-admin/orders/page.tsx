'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Building, Phone, Mail, DollarSign, Loader2, RefreshCw, ChevronDown, MapPin, Package, ShoppingBag, Truck, CreditCard, Home, Globe, CalendarDays, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

// ==================== TYPES ====================
interface OrderProduct {
  price: number;
  productBranchNames: string[];
  productBranches: string[];
  productCategory: string;
  productCategoryId: string;
  productCost: number;
  productId: string;
  productImage: string;
  productName: string;
  productSku: string;
  quantity: number;
}

interface Order {
  id: string;
  branchNames: string[];
  createdAt: Timestamp;
  customerEmail: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  expectedDeliveryDate: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  pointsAwarded: boolean;
  products: OrderProduct[];
  pickupBranch: string;
  pickupBranchAddress: string;
  pickupBranchPhone: string;
  pickupBranchTiming: string;
  status: 'upcoming' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  totalAmount: number;
  transactionId: string;
  updatedAt: Timestamp;
}

interface OrdersStore {
  // Data
  orders: Order[];
  error: string | null;
  stats: {
    total: number;
    upcoming: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    totalRevenue: number;
    todayOrders: number;
    thisMonthOrders: number;
    thisYearOrders: number;
  };
  
  // Actions
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
  calculateStats: () => void;
  setupRealtimeUpdates: () => () => void;
}

const useOrdersStore = create<OrdersStore>((set, get) => ({
  // Initial state
  orders: [],
  error: null,
  stats: {
    total: 0,
    upcoming: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    totalRevenue: 0,
    todayOrders: 0,
    thisMonthOrders: 0,
    thisYearOrders: 0
  },

  // Fetch all orders
  fetchOrders: async () => {
    set({ error: null });
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          createdAt: data.createdAt || Timestamp.now(),
          customerEmail: data.customerEmail || 'No Email',
          customerId: data.customerId || 'guest',
          customerName: data.customerName || 'Unknown Customer',
          customerPhone: data.customerPhone || '',
          expectedDeliveryDate: data.expectedDeliveryDate || '',
          orderDate: data.orderDate || '',
          paymentMethod: data.paymentMethod || 'Unknown',
          paymentStatus: data.paymentStatus || 'pending',
          pointsAwarded: Boolean(data.pointsAwarded) || false,
          products: Array.isArray(data.products) ? data.products.map((p: any) => ({
            price: Number(p.price) || 0,
            productBranchNames: Array.isArray(p.productBranchNames) ? p.productBranchNames : [],
            productBranches: Array.isArray(p.productBranches) ? p.productBranches : [],
            productCategory: p.productCategory || '',
            productCategoryId: p.productCategoryId || '',
            productCost: Number(p.productCost) || 0,
            productId: p.productId || '',
            productImage: p.productImage || p.productImage || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
            productName: p.productName || 'Unknown Product',
            productSku: p.productSku || '',
            quantity: Number(p.quantity) || 1
          })) : [],
          pickupBranch: data.pickupBranch || '',
          pickupBranchAddress: data.pickupBranchAddress || '',
          pickupBranchPhone: data.pickupBranchPhone || '',
          pickupBranchTiming: data.pickupBranchTiming || '',
          status: (data.status as Order['status']) || 'upcoming',
          totalAmount: Number(data.totalAmount) || 0,
          transactionId: data.transactionId || '',
          updatedAt: data.updatedAt || Timestamp.now()
        });
      });
      
      set({ orders: ordersData });
      get().calculateStats();
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: 'Failed to load orders. Please try again.' 
      });
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update local state
      set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: Timestamp.now() } : order
        )
      }));

      // Recalculate stats
      get().calculateStats();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Calculate statistics
  calculateStats: () => {
    const state = get();
    const orders = state.orders;
    
    const total = orders.length;
    const upcoming = orders.filter(o => o.status === 'upcoming').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const refunded = orders.filter(o => o.status === 'refunded').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate today's, this month's and this year's orders
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const todayOrders = orders.filter(o => {
      const orderDate = o.createdAt.toDate().toISOString().split('T')[0];
      return orderDate === today;
    }).length;

    const thisMonthOrders = orders.filter(o => {
      const orderDate = o.createdAt.toDate();
      return orderDate.getFullYear() === currentYear && 
             orderDate.getMonth() + 1 === currentMonth;
    }).length;

    const thisYearOrders = orders.filter(o => {
      const orderDate = o.createdAt.toDate();
      return orderDate.getFullYear() === currentYear;
    }).length;

    set({
      stats: {
        ...state.stats,
        total,
        upcoming,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        cancelled,
        refunded,
        totalRevenue,
        todayOrders,
        thisMonthOrders,
        thisYearOrders
      }
    });
  },

  // Setup real-time updates
  setupRealtimeUpdates: () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            createdAt: data.createdAt || Timestamp.now(),
            customerEmail: data.customerEmail || 'No Email',
            customerId: data.customerId || 'guest',
            customerName: data.customerName || 'Unknown Customer',
            customerPhone: data.customerPhone || '',
            expectedDeliveryDate: data.expectedDeliveryDate || '',
            orderDate: data.orderDate || '',
            paymentMethod: data.paymentMethod || 'Unknown',
            paymentStatus: data.paymentStatus || 'pending',
            pointsAwarded: Boolean(data.pointsAwarded) || false,
            products: Array.isArray(data.products) ? data.products.map((p: any) => ({
              price: Number(p.price) || 0,
              productBranchNames: Array.isArray(p.productBranchNames) ? p.productBranchNames : [],
              productBranches: Array.isArray(p.productBranches) ? p.productBranches : [],
              productCategory: p.productCategory || '',
              productCategoryId: p.productCategoryId || '',
              productCost: Number(p.productCost) || 0,
              productId: p.productId || '',
              productImage: p.productImage || p.productImage || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
              productName: p.productName || 'Unknown Product',
              productSku: p.productSku || '',
              quantity: Number(p.quantity) || 1
            })) : [],
            pickupBranch: data.pickupBranch || '',
            pickupBranchAddress: data.pickupBranchAddress || '',
            pickupBranchPhone: data.pickupBranchPhone || '',
            pickupBranchTiming: data.pickupBranchTiming || '',
            status: (data.status as Order['status']) || 'upcoming',
            totalAmount: Number(data.totalAmount) || 0,
            transactionId: data.transactionId || '',
            updatedAt: data.updatedAt || Timestamp.now()
          });
        });
        
        set({ orders: ordersData });
        get().calculateStats();
      }, (error) => {
        console.error('Error in real-time update:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      return () => {};
    }
  },
}));

// Date range selector component
function DateRangeSelector({ 
  selectedDateRange, 
  onDateRangeChange 
}: { 
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
}) {
  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <Select value={selectedDateRange} onValueChange={onDateRangeChange}>
      <SelectTrigger className="w-full sm:w-48">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <SelectValue placeholder="Select date range" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {dateRanges.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Year selector component
function YearSelector({ 
  selectedYear, 
  onYearChange 
}: { 
  selectedYear: string;
  onYearChange: (year: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Select value={selectedYear} onValueChange={onYearChange}>
      <SelectTrigger className="w-full sm:w-32">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Years</SelectItem>
        {years.map(year => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Month selector component
function MonthSelector({ 
  selectedMonth, 
  onMonthChange 
}: { 
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}) {
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  return (
    <Select value={selectedMonth} onValueChange={onMonthChange}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map(month => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Calendar view component
function CalendarView({ 
  orders, 
  selectedYear, 
  selectedMonth 
}: { 
  orders: Order[];
  selectedYear: string;
  selectedMonth: string;
}) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Filter orders by selected year and month
  const filteredOrders = orders.filter(order => {
    const orderDate = order.createdAt.toDate();
    const orderYear = orderDate.getFullYear().toString();
    const orderMonth = (orderDate.getMonth() + 1).toString();
    
    const matchesYear = selectedYear === 'all' || orderYear === selectedYear;
    const matchesMonth = selectedMonth === 'all' || orderMonth === selectedMonth;
    
    return matchesYear && matchesMonth;
  });

  // Group orders by date
  const ordersByDate: Record<string, Order[]> = {};
  filteredOrders.forEach(order => {
    const dateStr = order.createdAt.toDate().toISOString().split('T')[0];
    if (!ordersByDate[dateStr]) {
      ordersByDate[dateStr] = [];
    }
    ordersByDate[dateStr].push(order);
  });

  // Get dates for the selected month
  const getMonthDates = () => {
    if (selectedMonth === 'all' || selectedYear === 'all') {
      return Object.keys(ordersByDate).sort().reverse();
    }

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    
    return dates.reverse();
  };

  const monthDates = getMonthDates();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Calendar View</h3>
        <Badge variant="outline">
          {filteredOrders.length} orders
        </Badge>
      </div>
      
      <div className="space-y-3">
        {monthDates.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found for selected period</p>
          </div>
        ) : (
          monthDates.map(dateStr => {
            const date = new Date(dateStr);
            const ordersOnDate = ordersByDate[dateStr] || [];
            const isExpanded = expandedDates.has(dateStr);
            
            return (
              <div key={dateStr} className="border rounded-lg overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(dateStr)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-gray-900">
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {date.toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ordersOnDate.length} order{ordersOnDate.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-white">
                      AED {ordersOnDate.reduce((sum, order) => sum + order.totalAmount, 0)}
                    </Badge>
                    {isExpanded ? (
                      <Minus className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                
                {/* Orders List */}
                {isExpanded && ordersOnDate.length > 0 && (
                  <div className="border-t p-4 bg-white">
                    <div className="space-y-4">
                      {ordersOnDate.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">Order #{order.transactionId}</div>
                              <div className="text-sm text-gray-500">{order.customerName}</div>
                            </div>
                            <Badge variant="outline" className={
                              order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                              order.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                              order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-50 text-gray-700'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="font-medium ml-2">AED {order.totalAmount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Payment:</span>
                              <span className="font-medium ml-2">{order.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Branch:</span>
                              <span className="font-medium ml-2">{order.pickupBranch}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <span className="font-medium ml-2">
                                {format(order.createdAt.toDate(), 'hh:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function SuperAdminOrders() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { 
    orders, 
    error, 
    stats,
    fetchOrders, 
    updateOrderStatus
  } = useOrdersStore();

  // Fetch data on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get date range boundaries
  const getDateRangeBoundaries = () => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (selectedDateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case 'thisWeek':
        const firstDayOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekDay = lastWeek.getDay();
        const lastWeekDiff = lastWeek.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1);
        startDate = new Date(lastWeek.setDate(lastWeekDiff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = new Date(lastMonth);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const { startDate, endDate } = getDateRangeBoundaries();
    const orderDate = order.createdAt.toDate();
    
    // Search filter
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some(p => 
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productSku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Payment filter
    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (startDate && endDate) {
      matchesDateRange = orderDate >= startDate && orderDate <= endDate;
    }
    
    // Year filter
    let matchesYear = true;
    if (selectedYear !== 'all') {
      matchesYear = orderDate.getFullYear().toString() === selectedYear;
    }
    
    // Month filter
    let matchesMonth = true;
    if (selectedMonth !== 'all') {
      matchesMonth = (orderDate.getMonth() + 1).toString() === selectedMonth;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDateRange && matchesYear && matchesMonth;
  });

  // Get unique payment methods
  const paymentMethods = Array.from(new Set(orders.map(order => order.paymentMethod)));

  // Status configuration
  const statusConfig = {
    upcoming: { 
      label: 'Upcoming', 
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: CalendarDays,
      badgeColor: 'bg-blue-500',
      description: 'Order placed, waiting for processing'
    },
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: AlertCircle,
      badgeColor: 'bg-yellow-500',
      description: 'Order received, waiting for confirmation'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: CheckCircle,
      badgeColor: 'bg-green-500',
      description: 'Order confirmed, preparing for processing'
    },
    processing: { 
      label: 'Processing', 
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      icon: Package,
      badgeColor: 'bg-purple-500',
      description: 'Order is being processed'
    },
    shipped: { 
      label: 'Shipped', 
      color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      icon: Truck,
      badgeColor: 'bg-indigo-500',
      description: 'Order has been shipped'
    },
    delivered: { 
      label: 'Delivered', 
      color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      icon: CheckCircle,
      badgeColor: 'bg-emerald-500',
      description: 'Order delivered successfully'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: XCircle,
      badgeColor: 'bg-red-500',
      description: 'Order has been cancelled'
    },
    refunded: { 
      label: 'Refunded', 
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      icon: DollarSign,
      badgeColor: 'bg-gray-500',
      description: 'Order has been refunded'
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Payment method icons
  const paymentIcons = {
    cod: DollarSign,
    wallet: DollarSign,
    cash: DollarSign,
    card: CreditCard,
    credit: CreditCard,
    debit: CreditCard,
    online: Globe
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      alert('Failed to update order status. Please try again.');
    }
  };

  // Function to get payment method icon
  const getPaymentIcon = (method: string) => {
    const normalizedMethod = method.toLowerCase();
    for (const [key, Icon] of Object.entries(paymentIcons)) {
      if (normalizedMethod.includes(key)) {
        return Icon;
      }
    }
    return CreditCard;
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar - Always Visible */}
        <AdminSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "hidden lg:block transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0"
          )}
        />

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              <AdminMobileSidebar
                role="super_admin"
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
                  <p className="text-sm text-gray-600">Manage product orders with proper Firebase data</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setShowCalendarView(!showCalendarView)}
                  variant="outline" 
                  className="gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  {showCalendarView ? 'List View' : 'Calendar View'}
                </Button>
                <Button 
                  onClick={fetchOrders}
                  variant="outline" 
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.email}
                </span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      All time orders
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.thisMonthOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Orders this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      Placed today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">AED {stats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      From delivered orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div 
                    key={status} 
                    className={cn(
                      "p-4 rounded-lg border flex flex-col items-center justify-center",
                      config.color.replace('hover:bg-', 'bg-').split(' ')[0]
                    )}
                  >
                    <div className="text-2xl font-bold">
                      {stats[status as keyof typeof stats] || 0}
                    </div>
                    <div className="text-xs font-medium text-center mt-1">
                      {config.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by customer, email, phone, product or order ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${statusConfig[option.value as keyof typeof statusConfig].badgeColor}`}></div>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Payment Filter */}
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        {paymentMethods.map(method => {
                          const PaymentIcon = getPaymentIcon(method);
                          return (
                            <SelectItem key={method} value={method}>
                              <div className="flex items-center gap-2">
                                <PaymentIcon className="w-4 h-4" />
                                {method.toUpperCase()}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Date Range */}
                    <DateRangeSelector 
                      selectedDateRange={selectedDateRange}
                      onDateRangeChange={setSelectedDateRange}
                    />

                    {/* Year Selector */}
                    <YearSelector 
                      selectedYear={selectedYear}
                      onYearChange={setSelectedYear}
                    />

                    {/* Month Selector */}
                    <MonthSelector 
                      selectedMonth={selectedMonth}
                      onMonthChange={setSelectedMonth}
                    />
                  </div>
                  
                  {/* Active filters indicator */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {statusFilter !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Status: {statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                        <button onClick={() => setStatusFilter('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {paymentFilter !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Payment: {paymentFilter}
                        <button onClick={() => setPaymentFilter('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedDateRange !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Date Range: {selectedDateRange}
                        <button onClick={() => setSelectedDateRange('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedYear !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Year: {selectedYear}
                        <button onClick={() => setSelectedYear('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedMonth !== 'all' && (
                      <Badge variant="outline" className="gap-2">
                        Month: {
                          new Date(2000, parseInt(selectedMonth) - 1, 1)
                            .toLocaleDateString('en-US', { month: 'long' })
                        }
                        <button onClick={() => setSelectedMonth('all')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="outline" className="gap-2">
                        Search: {searchQuery}
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </Badge>
                    )}
                    {(statusFilter !== 'all' || paymentFilter !== 'all' || selectedDateRange !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setStatusFilter('all');
                          setPaymentFilter('all');
                          setSelectedDateRange('all');
                          setSelectedYear('all');
                          setSelectedMonth('all');
                          setSearchQuery('');
                        }}
                        className="text-xs"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar View or List View */}
              {showCalendarView ? (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <CalendarView 
                      orders={orders}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                    />
                  </CardContent>
                </Card>
              ) : (
                /* Orders List View */
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    const StatusIcon = status?.icon || AlertCircle;
                    const PaymentIcon = getPaymentIcon(order.paymentMethod);
                    const isExpanded = expandedOrder === order.id;
                    
                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          {/* Order Header */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                            {/* Order Info */}
                            <div className="flex items-start gap-4 flex-1">
                              {/* Order ID & Date */}
                              <div className="text-center min-w-[100px]">
                                <div className="text-sm font-medium text-gray-500">Order ID</div>
                                <div className="text-lg font-bold text-primary truncate">
                                  {order.transactionId}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {format(order.createdAt.toDate(), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(order.createdAt.toDate(), 'hh:mm a')}
                                </div>
                              </div>
                              
                              {/* Customer Details */}
                              <div className="border-l pl-4 flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {order.customerName}
                                  </h3>
                                  <Badge className={cn(
                                    "text-xs",
                                    order.customerId === 'guest' 
                                      ? 'bg-gray-100 text-gray-800' 
                                      : 'bg-green-100 text-green-800'
                                  )}>
                                    {order.customerId === 'guest' ? 'Guest' : 'Registered'}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  {/* Email */}
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate max-w-[200px]">
                                      {order.customerEmail}
                                    </span>
                                  </div>
                                  
                                  {/* Phone */}
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span className="font-medium">
                                      {order.customerPhone}
                                    </span>
                                  </div>
                                  
                                  {/* Payment Method */}
                                  <div className="flex items-center gap-1">
                                    <PaymentIcon className="w-3 h-3" />
                                    <span>
                                      {order.paymentMethod.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status & Amount */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[250px]">
                              {/* Amount */}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  AED {order.totalAmount}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <Badge className={cn(
                                "gap-2 px-3 py-1.5 font-medium min-w-[120px] justify-center",
                                status?.color
                              )}>
                                <StatusIcon className="w-4 h-4" />
                                <span>{status?.label || order.status}</span>
                              </Badge>
                            </div>
                          </div>

                          {/* Branch & Pickup Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">Pickup Branch</span>
                              </div>
                              <div className="text-sm">
                                <div className="font-semibold">{order.pickupBranch}</div>
                                <div className="text-gray-600 mt-1">{order.pickupBranchAddress}</div>
                                <div className="text-gray-500 mt-1">
                                  <Phone className="w-3 h-3 inline mr-1" />
                                  {order.pickupBranchPhone}
                                </div>
                                <div className="text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {order.pickupBranchTiming}
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">Order Dates</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <div className="text-gray-500">Order Date:</div>
                                  <div className="font-medium">{order.orderDate}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Expected Delivery:</div>
                                  <div className="font-medium">{order.expectedDeliveryDate}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-gray-500">Payment Status:</div>
                                  <Badge className={
                                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }>
                                    {order.paymentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expand/Collapse Button */}
                          <Button
                            variant="ghost"
                            className="w-full mb-4"
                            onClick={() => toggleOrderExpansion(order.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                View Details ({order.products.length} products)
                              </>
                            )}
                          </Button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t pt-6 space-y-6">
                              {/* Products List */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Products ({order.products.length})
                                </h4>
                                
                                <div className="space-y-4">
                                  {order.products.map((product, index) => (
                                    <div 
                                      key={`${product.productId}-${index}`}
                                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                                    >
                                      {/* Product Image */}
                                      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border">
                                        <img 
                                          src={product.productImage} 
                                          alt={product.productName}
                                          className="w-full h-full object-cover"
                                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="font-medium text-gray-900">
                                              {product.productName}
                                            </h5>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                              <span>SKU: {product.productSku}</span>
                                              <span>Category: {product.productCategory}</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-lg font-bold text-primary">
                                              AED {product.price * product.quantity}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              AED {product.price} × {product.quantity}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Additional Product Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                          <div>
                                            <span className="text-gray-500">Cost:</span>
                                            <span className="font-medium ml-2">AED {product.productCost}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Profit:</span>
                                            <span className="font-medium text-green-600 ml-2">
                                              AED {(product.price - product.productCost).toFixed(2)}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Margin:</span>
                                            <span className="font-medium text-green-600 ml-2">
                                              {(((product.price - product.productCost) / product.productCost) * 100).toFixed(1)}%
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Branches:</span>
                                            <span className="font-medium ml-2">
                                              {product.productBranchNames.length}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Product ID */}
                                        <div className="mt-2 text-xs text-gray-400">
                                          Product ID: {product.productId}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Summary */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-500">Subtotal</div>
                                    <div className="text-lg font-semibold">
                                      AED {order.totalAmount}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Payment Status</div>
                                    <Badge className={
                                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }>
                                      {order.paymentStatus}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Points Awarded</div>
                                    <Badge className={
                                      order.pointsAwarded ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }>
                                      {order.pointsAwarded ? 'Yes' : 'No'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Status Control */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Update Order Status</h4>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => 
                                    handleStatusChange(order.id, value as Order['status'])
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${status?.badgeColor}`}></div>
                                      <span>Change Status</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map(option => {
                                      const optionStatus = statusConfig[option.value as keyof typeof statusConfig];
                                      const OptionIcon = optionStatus.icon;
                                      
                                      return (
                                        <SelectItem 
                                          key={option.value} 
                                          value={option.value}
                                          className="flex items-center gap-2"
                                        >
                                          <OptionIcon className="w-4 h-4" />
                                          <div>
                                            <div>{option.label}</div>
                                            <div className="text-xs text-gray-500">
                                              {optionStatus.description}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Technical Info */}
                              <div className="border-t pt-4 text-xs text-gray-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-gray-400">Order ID:</div>
                                    <code className="bg-gray-100 px-2 py-1 rounded break-all">
                                      {order.id}
                                    </code>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Transaction ID:</div>
                                    <code className="bg-gray-100 px-2 py-1 rounded break-all">
                                      {order.transactionId}
                                    </code>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Customer ID:</div>
                                    <code className="bg-gray-100 px-2 py-1 rounded break-all">
                                      {order.customerId}
                                    </code>
                                  </div>
                                  <div className="md:col-span-3">
                                    <div className="text-gray-400">Created:</div>
                                    <div>{format(order.createdAt.toDate(), 'PPpp')}</div>
                                  </div>
                                  <div className="md:col-span-3">
                                    <div className="text-gray-400">Last Updated:</div>
                                    <div>{format(order.updatedAt.toDate(), 'PPpp')}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('all');
                      setPaymentFilter('all');
                      setSelectedDateRange('all');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="mt-6 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Error loading orders</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={fetchOrders} 
                      variant="outline" 
                      className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Total Results */}
              <div className="mt-6 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    Showing {filteredOrders.length} of {orders.length} total orders
                  </div>
                  <div className="text-xs text-gray-400">
                    AED {stats.totalRevenue} total revenue • {stats.thisMonthOrders} this month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Helper component for ChevronUp icon
function ChevronUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}