'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Users, TrendingUp, Download, RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from 'xlsx'; // Excel export ke liye

// Interfaces for data types
interface Service {
  id: string;
  name: string;
  price: number;
  revenue: number;
  totalBookings: number;
  branchNames: string[];
  status: string;
}

interface Booking {
  id: string;
  branch: string;
  totalAmount: number;
  status: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  servicePrice: number;
  bookingDate: Date;
  createdAt: any;
  paymentStatus: string;
  paymentMethod: string;
  date: string;
}

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  branchNames: string[];
  products: Array<{
    productName: string;
    price: number;
    quantity: number;
  }>;
  createdAt: any;
}

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    totalCustomers: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueChange: number;
    bookingsChange: number;
    ordersChange: number;
  };
  branchPerformance: Array<{
    name: string;
    revenue: number;
    bookings: number;
    customers: number;
    orders: number;
    growth: number;
  }>;
  topServices: Array<{
    name: string;
    revenue: number;
    bookings: number;
    avgPrice: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    bookings: number;
    orders: number;
  }>;
  revenueByBranch: Array<{
    branch: string;
    revenue: number;
    percentage: number;
    bookings: number;
  }>;
}

// Custom Loading Component
const LoadingCard = () => (
  <Card>
    <CardHeader>
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
    </CardContent>
  </Card>
);

const LoadingRow = () => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
      <div className="flex justify-between mt-2">
        <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Helper function to get date range based on timeRange
const getDateRange = (timeRange: string) => {
  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, endDate: now };
};

// Helper function to check if date is within range
const isWithinDateRange = (date: Date, startDate: Date, endDate: Date) => {
  return date >= startDate && date <= endDate;
};

// Helper function to get month name from date
const getMonthName = (date: Date) => {
  return date.toLocaleString('default', { month: 'short' });
};

export default function SuperAdminAnalytics() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true); // By default open
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rawData, setRawData] = useState<{
    services: Service[];
    bookings: Booking[];
    orders: Order[];
  } | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Function to fetch data from Firebase
  const fetchAnalyticsData = async (range: string = timeRange) => {
    setIsLoading(true);
    try {
      // Get current and previous date ranges
      const { startDate: currentStart, endDate: currentEnd } = getDateRange(range);
      const previousRange = getPreviousDateRange(range);
      const { startDate: previousStart, endDate: previousEnd } = getDateRange(previousRange);

      // Fetch services
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const services: Service[] = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Service));

      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      const allBookings: Booking[] = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert date to Date object
        let bookingDate = new Date();
        if (data.date) {
          bookingDate = new Date(data.date);
        } else if (data.createdAt && data.createdAt.toDate) {
          bookingDate = data.createdAt.toDate();
        } else if (data.bookingDate) {
          bookingDate = new Date(data.bookingDate);
        }
        
        return {
          id: doc.id,
          ...data,
          bookingDate: bookingDate
        } as unknown as Booking;
      });

      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const allOrders: Order[] = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        let orderDate = new Date();
        if (data.orderDate) {
          orderDate = new Date(data.orderDate);
        } else if (data.createdAt && data.createdAt.toDate) {
          orderDate = data.createdAt.toDate();
        }
        
        return {
          id: doc.id,
          ...data,
          orderDate: orderDate
        } as unknown as Order;
      });

      // Store raw data for export
      setRawData({
        services,
        bookings: allBookings,
        orders: allOrders
      });

      // Filter data for current period
      const currentBookings = allBookings.filter(booking => 
        isWithinDateRange(booking.bookingDate, currentStart, currentEnd)
      );
      const currentOrders = allOrders.filter(order => 
        isWithinDateRange(order.orderDate, currentStart, currentEnd)
      );

      // Filter data for previous period
      const previousBookings = allBookings.filter(booking => 
        isWithinDateRange(booking.bookingDate, previousStart, previousEnd)
      );
      const previousOrders = allOrders.filter(order => 
        isWithinDateRange(order.orderDate, previousStart, previousEnd)
      );

      // Calculate current period analytics
      const currentAnalytics = calculateAnalytics(services, currentBookings, currentOrders);
      
      // Calculate previous period analytics
      const previousAnalytics = calculateAnalytics(services, previousBookings, previousOrders);
      
      // Calculate growth percentages
      const calculatedAnalytics = calculateGrowth(currentAnalytics, previousAnalytics);
      
      setAnalytics(calculatedAnalytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get previous date range
  const getPreviousDateRange = (range: string) => {
    switch (range) {
      case '7d':
        return '7d';
      case '30d':
        return '30d';
      case '90d':
        return '90d';
      case '1y':
        return '1y';
      default:
        return '30d';
    }
  };

  // Calculate analytics from data
  const calculateAnalytics = (
    services: Service[],
    bookings: Booking[],
    orders: Order[]
  ): AnalyticsData => {
    // Total revenue from bookings and orders
    const totalBookingRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const totalOrderRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalRevenue = totalBookingRevenue + totalOrderRevenue;

    // Total bookings
    const totalBookings = bookings.length;

    // Unique customers from bookings and orders
    const bookingCustomers = new Set(bookings.map(b => b.customerId));
    const orderCustomers = new Set(orders.map(o => o.customerEmail));
    const totalCustomers = new Set([...bookingCustomers, ...orderCustomers]).size;

    // Total orders
    const totalOrders = orders.length;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalOrderRevenue / totalOrders : 0;

    // Branch performance calculation
    const branchMap = new Map<string, {
      revenue: number;
      bookings: number;
      customers: Set<string>;
      orders: number;
    }>();

    // Process bookings by branch
    bookings.forEach(booking => {
      const branch = booking.branch || "Unknown";
      const existing = branchMap.get(branch) || { 
        revenue: 0, 
        bookings: 0, 
        customers: new Set<string>(), 
        orders: 0 
      };
      
      existing.revenue += booking.totalAmount || 0;
      existing.bookings += 1;
      if (booking.customerId) {
        existing.customers.add(booking.customerId);
      }
      
      branchMap.set(branch, existing);
    });

    // Process orders by branch
    orders.forEach(order => {
      const branch = order.branchNames?.[0] || "Unknown";
      const existing = branchMap.get(branch) || { 
        revenue: 0, 
        bookings: 0, 
        customers: new Set<string>(), 
        orders: 0 
      };
      
      existing.revenue += order.totalAmount || 0;
      existing.orders += 1;
      if (order.customerEmail) {
        existing.customers.add(order.customerEmail);
      }
      
      branchMap.set(branch, existing);
    });

    // Convert branch map to array
    const branchPerformance = Array.from(branchMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      bookings: data.bookings,
      customers: data.customers.size,
      orders: data.orders,
      growth: 0 // Will be calculated later
    }));

    // Top services calculation
    const serviceRevenueMap = new Map<string, { revenue: number; bookings: number }>();
    
    bookings.forEach(booking => {
      const serviceName = booking.serviceName || "Unknown Service";
      const existing = serviceRevenueMap.get(serviceName) || { revenue: 0, bookings: 0 };
      existing.revenue += booking.totalAmount || 0;
      existing.bookings += 1;
      serviceRevenueMap.set(serviceName, existing);
    });

    const topServices = Array.from(serviceRevenueMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        bookings: data.bookings,
        avgPrice: data.bookings > 0 ? data.revenue / data.bookings : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Monthly trends calculation
    const monthlyMap = new Map<string, { revenue: number; bookings: number; orders: number }>();
    
    // Process bookings for monthly trends
    bookings.forEach(booking => {
      const monthKey = getMonthName(booking.bookingDate);
      const existing = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0, orders: 0 };
      existing.revenue += booking.totalAmount || 0;
      existing.bookings += 1;
      monthlyMap.set(monthKey, existing);
    });

    // Process orders for monthly trends
    orders.forEach(order => {
      const monthKey = getMonthName(order.orderDate);
      const existing = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0, orders: 0 };
      existing.revenue += order.totalAmount || 0;
      existing.orders += 1;
      monthlyMap.set(monthKey, existing);
    });

    // Get last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      const monthData = monthlyMap.get(monthName) || { revenue: 0, bookings: 0, orders: 0 };
      
      return {
        month: monthName,
        revenue: monthData.revenue,
        bookings: monthData.bookings,
        orders: monthData.orders
      };
    });

    // Revenue by branch for distribution
    const totalBranchRevenue = branchPerformance.reduce((sum, branch) => sum + branch.revenue, 0);
    const revenueByBranch = branchPerformance.map(branch => ({
      branch: branch.name,
      revenue: branch.revenue,
      percentage: totalBranchRevenue > 0 ? (branch.revenue / totalBranchRevenue) * 100 : 0,
      bookings: branch.bookings
    }));

    return {
      overview: {
        totalRevenue,
        totalBookings,
        totalCustomers,
        totalOrders,
        avgOrderValue,
        revenueChange: 0,
        bookingsChange: 0,
        ordersChange: 0
      },
      branchPerformance: branchPerformance.sort((a, b) => b.revenue - a.revenue),
      topServices,
      monthlyTrends,
      revenueByBranch: revenueByBranch.sort((a, b) => b.revenue - a.revenue)
    };
  };

  // Calculate growth percentages between current and previous period
  const calculateGrowth = (current: AnalyticsData, previous: AnalyticsData): AnalyticsData => {
    const calculatePercentageChange = (currentVal: number, previousVal: number) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    // Calculate growth for overview
    const overview = {
      ...current.overview,
      revenueChange: calculatePercentageChange(current.overview.totalRevenue, previous.overview.totalRevenue),
      bookingsChange: calculatePercentageChange(current.overview.totalBookings, previous.overview.totalBookings),
      ordersChange: calculatePercentageChange(current.overview.totalOrders, previous.overview.totalOrders)
    };

    // Calculate growth for branch performance
    const branchPerformance = current.branchPerformance.map(branch => {
      const previousBranch = previous.branchPerformance.find(b => b.name === branch.name);
      const previousRevenue = previousBranch?.revenue || 0;
      const growth = calculatePercentageChange(branch.revenue, previousRevenue);
      
      return {
        ...branch,
        growth
      };
    });

    return {
      ...current,
      overview,
      branchPerformance
    };
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!analytics || !rawData) return;

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // 1. Overview Sheet
      const overviewData = [
        ['Analytics Overview Report'],
        ['Generated on:', new Date().toLocaleString()],
        ['Time Range:', timeRange],
        [],
        ['Metric', 'Value', 'Growth %'],
        ['Total Revenue', `AED ${analytics.overview.totalRevenue.toLocaleString()}`, `${analytics.overview.revenueChange.toFixed(1)}%`],
        ['Total Bookings', analytics.overview.totalBookings, `${analytics.overview.bookingsChange.toFixed(1)}%`],
        ['Total Customers', analytics.overview.totalCustomers, `${analytics.overview.bookingsChange.toFixed(1)}%`],
        ['Total Orders', analytics.overview.totalOrders, `${analytics.overview.ordersChange.toFixed(1)}%`],
        ['Average Order Value', `AED ${analytics.overview.avgOrderValue.toFixed(2)}`, ''],
      ];
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

      // 2. Branch Performance Sheet
      const branchData = [
        ['Branch Performance Report'],
        [],
        ['Branch Name', 'Revenue', 'Bookings', 'Customers', 'Orders', 'Growth %']
      ];
      
      analytics.branchPerformance.forEach(branch => {
        branchData.push([
          branch.name,
          branch.revenue.toString(),
          branch.bookings.toString(),
          branch.customers.toString(),
          branch.orders.toString(),
          `${branch.growth.toFixed(1)}%`
        ]);
      });
      
      const branchWs = XLSX.utils.aoa_to_sheet(branchData);
      XLSX.utils.book_append_sheet(wb, branchWs, 'Branch Performance');

      // 3. Monthly Trends Sheet
      const monthlyData = [
        ['Monthly Trends Report'],
        [],
        ['Month', 'Revenue', 'Bookings', 'Orders']
      ];
      
      analytics.monthlyTrends.forEach(month => {
        monthlyData.push([
          month.month,
          month.revenue.toString(),
          month.bookings.toString(),
          month.orders.toString()
        ]);
      });
      
      const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Trends');

      // 4. Top Services Sheet
      const servicesData = [
        ['Top Services Report'],
        [],
        ['Rank', 'Service Name', 'Revenue', 'Bookings', 'Average Price']
      ];
      
      analytics.topServices.forEach((service, index) => {
        servicesData.push([
          (index + 1).toString(),
          service.name,
          service.revenue.toString(),
          service.bookings.toString(),
          service.avgPrice.toString()
        ]);
      });
      
      const servicesWs = XLSX.utils.aoa_to_sheet(servicesData);
      XLSX.utils.book_append_sheet(wb, servicesWs, 'Top Services');

      // 5. Raw Bookings Data Sheet
      if (rawData.bookings && rawData.bookings.length > 0) {
        const bookingsData = [
          ['Raw Bookings Data'],
          [],
          ['Booking ID', 'Customer', 'Service', 'Branch', 'Amount', 'Status', 'Date']
        ];
        
        rawData.bookings.slice(0, 1000).forEach(booking => { // Limit to 1000 rows
          bookingsData.push([
            booking.id.substring(0, 10) + '...',
            booking.customerName || 'N/A',
            booking.serviceName || 'N/A',
            booking.branch || 'N/A',
            (booking.totalAmount || 0).toString(),
            booking.status || 'N/A',
            booking.bookingDate instanceof Date ? booking.bookingDate.toLocaleDateString() : 'N/A'
          ]);
        });
        
        const bookingsWs = XLSX.utils.aoa_to_sheet(bookingsData);
        XLSX.utils.book_append_sheet(wb, bookingsWs, 'Raw Bookings');
      }

      // 6. Raw Orders Data Sheet
      if (rawData.orders && rawData.orders.length > 0) {
        const ordersData = [
          ['Raw Orders Data'],
          [],
          ['Order ID', 'Customer', 'Branch', 'Amount', 'Status', 'Date']
        ];
        
        rawData.orders.slice(0, 1000).forEach(order => { // Limit to 1000 rows
          ordersData.push([
            order.id.substring(0, 10) + '...',
            order.customerName || 'N/A',
            order.branchNames?.[0] || 'N/A',
            (order.totalAmount || 0).toString(),
            order.paymentStatus || 'N/A',
            order.orderDate instanceof Date ? order.orderDate.toLocaleDateString() : 'N/A'
          ]);
        });
        
        const ordersWs = XLSX.utils.aoa_to_sheet(ordersData);
        XLSX.utils.book_append_sheet(wb, ordersWs, 'Raw Orders');
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `analytics_report_${timestamp}.xlsx`;
      
      // Export the workbook
      XLSX.writeFile(wb, filename);
      
      console.log('Excel file exported successfully:', filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExport = () => {
    exportToExcel();
  };

  if (isLoading || !analytics) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex h-screen bg-gray-50">
          <AdminSidebar 
            role="super_admin" 
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
          />
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            sidebarOpen ? "lg:ml-0" : "lg:ml-0"
          )}>
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
              <div className="flex items-center justify-between px-4 py-4 lg:px-8">
                <div className="flex items-center gap-4">
                  <AdminMobileSidebar 
                    role="super_admin" 
                    onLogout={handleLogout}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)} 
                  />
                  <div>
                    <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-9 bg-gray-200 rounded w-9 animate-pulse"></div>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 lg:p-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </div>

                {/* Branch Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-1 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      {[...Array(5)].map((_, i) => (
                        <LoadingRow key={i} />
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-1 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      {[...Array(5)].map((_, i) => (
                        <LoadingRow key={i} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar 
          role="super_admin" 
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar 
                  role="super_admin" 
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)} 
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
                  <p className="text-sm text-gray-600">
                    Real-time performance across all branches
                    {lastUpdated && (
                      <span className="ml-2 text-xs text-gray-500">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={(value) => {
                  setTimeRange(value);
                  fetchAnalyticsData(value);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
               
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={analytics.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(analytics.overview.revenueChange)}
                      </span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalBookings)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={analytics.overview.bookingsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(analytics.overview.bookingsChange)}
                      </span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalCustomers)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={analytics.overview.bookingsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(analytics.overview.bookingsChange)}
                      </span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalOrders)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={analytics.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(analytics.overview.ordersChange)}
                      </span> from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Branch Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Branch Performance</CardTitle>
                    <CardDescription>Revenue and performance by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.branchPerformance.map((branch, index) => {
                        const maxRevenue = Math.max(...analytics.branchPerformance.map(b => b.revenue));
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{branch.name}</span>
                                <span className="text-sm text-gray-600">{formatCurrency(branch.revenue)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-secondary h-2 rounded-full"
                                  style={{ width: `${maxRevenue > 0 ? (branch.revenue / maxRevenue) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{branch.bookings} bookings • {branch.customers} customers</span>
                                <span className={branch.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPercentage(branch.growth)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>Revenue, bookings and orders over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.monthlyTrends.map((month, index) => {
                        const maxRevenue = Math.max(...analytics.monthlyTrends.map(m => m.revenue));
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium w-12">{month.month}</span>
                            <div className="flex-1 mx-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(month.revenue)}</div>
                              <div className="text-xs text-gray-500">
                                {month.bookings} bookings • {month.orders} orders
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Services</CardTitle>
                    <CardDescription>Most popular services across all branches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-gray-600">{service.bookings} bookings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(service.revenue)}</p>
                            <p className="text-sm text-green-600">
                              Avg: {formatCurrency(service.avgPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Distribution</CardTitle>
                    <CardDescription>Revenue breakdown by branch</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.revenueByBranch.map((branch, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{branch.branch}</span>
                              <span className="text-sm text-gray-600">{formatCurrency(branch.revenue)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${branch.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{branch.bookings} bookings</span>
                              <span>{branch.percentage.toFixed(1)}% of total</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}