"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Building,
  BarChart3,
  Settings,
  UserPlus,
  LogOut,
  ChevronRight,
  Package,
  Layers,
  Star,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AdminSidebar,
  AdminMobileSidebar,
} from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

// Firebase imports
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

// Define TypeScript interfaces
interface OverallStats {
  totalBranches: number;
  totalRevenue: number;
  totalCustomers: number;
  avgRating: number;
  monthlyGrowth: number;
  totalServices: number;
  totalProducts: number;
  totalCategories: number;
  totalBookings: number;
}

interface BranchPerformance {
  id: string;
  name: string;
  revenue: number;
  customers: number;
  rating: number;
  status: string;
  city: string;
  manager: string;
  bookings: number;
}

interface RecentActivity {
  type: string;
  message: string;
  time: string;
  branch?: string;
}

interface RecentCategory {
  id: string;
  name: string;
  type: string;
  branch: string;
  time: string;
  isActive: boolean;
}

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  time: string;
  status: string;
}

interface RecentService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  time: string;
  status: string;
}

interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  time: string;
  totalAmount: number;
  status: string;
  timeAgo: string;
}

// Firebase document interfaces
interface BranchDocument {
  id: string;
  name?: string;
  city?: string;
  managerName?: string;
  [key: string]: any;
}

interface FeedbackDocument {
  id: string;
  rating?: number;
  customerName?: string;
  branchName?: string;
  branchId?: string;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface ServiceDocument {
  id: string;
  name?: string;
  price?: number;
  revenue?: number;
  duration?: number;
  category?: string;
  status?: string;
  branches?: string[];
  branchNames?: string[];
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface ProductDocument {
  id: string;
  name?: string;
  price?: number;
  revenue?: number;
  category?: string;
  status?: string;
  branches?: string[];
  branchNames?: string[];
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface CategoryDocument {
  id: string;
  name?: string;
  type?: string;
  branchName?: string;
  isActive?: boolean;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface BookingDocument {
  id: string;
  serviceName?: string;
  customerName?: string;
  date?: string;
  time?: string;
  totalAmount?: number;
  status?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Initial state with cached data if available
  const [overallStats, setOverallStats] = useState<OverallStats>(() => {
    if (typeof window !== 'undefined') {
      const cachedStats = localStorage.getItem('dashboard_stats');
      if (cachedStats) {
        try {
          return JSON.parse(cachedStats);
        } catch {
          // If cached data is invalid, return defaults
        }
      }
    }
    return {
      totalBranches: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      avgRating: 0,
      monthlyGrowth: 0,
      totalServices: 0,
      totalProducts: 0,
      totalCategories: 0,
      totalBookings: 0,
    };
  });

  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedBranches = localStorage.getItem('dashboard_branches');
        if (cachedBranches) {
          try {
            return JSON.parse(cachedBranches);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedActivities = localStorage.getItem('dashboard_activities');
        if (cachedActivities) {
          try {
            return JSON.parse(cachedActivities);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );

  // Recent items states with initial cached values
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedCategories = localStorage.getItem('dashboard_categories');
        if (cachedCategories) {
          try {
            return JSON.parse(cachedCategories);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedProducts = localStorage.getItem('dashboard_products');
        if (cachedProducts) {
          try {
            return JSON.parse(cachedProducts);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentServices, setRecentServices] = useState<RecentService[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedServices = localStorage.getItem('dashboard_services');
        if (cachedServices) {
          try {
            return JSON.parse(cachedServices);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedBookings = localStorage.getItem('dashboard_bookings');
        if (cachedBookings) {
          try {
            return JSON.parse(cachedBookings);
          } catch {
            // If cached data is invalid, return empty array
          }
        }
      }
      return [];
    }
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Helper function to calculate time ago
  const calculateTimeAgo = (date: Date | null | undefined): string => {
    if (!date) return "Recently";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour${
        Math.floor(diffInSeconds / 3600) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffInSeconds / 86400)} day${
      Math.floor(diffInSeconds / 86400) > 1 ? "s" : ""
    } ago`;
  };

  // Fetch all data from Firebase - NON-BLOCKING
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use Promise.all for parallel fetching
        const fetchPromises = [
          getDocs(collection(db, "branches")),
          getDocs(collection(db, "feedbacks")),
          getDocs(collection(db, "services")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "bookings"))
        ];

        // Wait for all data with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Data fetch timeout')), 5000)
        );

        const results = await Promise.race([
          Promise.all(fetchPromises),
          timeoutPromise
        ]) as any[];

        const [
          branchesSnapshot,
          feedbacksSnapshot,
          servicesSnapshot,
          productsSnapshot,
          categoriesSnapshot,
          bookingsSnapshot
        ] = results;

        // Process data
        const branchesData: BranchDocument[] = branchesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const feedbacksData: FeedbackDocument[] = feedbacksSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const servicesData: ServiceDocument[] = servicesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const productsData: ProductDocument[] = productsSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const categoriesData: CategoryDocument[] = categoriesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        const bookingsData: BookingDocument[] = bookingsSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        // Calculate overall stats
        const totalBranches = branchesData.length;

        // Calculate total revenue from bookings
        const totalBookingsRevenue = bookingsData.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0
        );

        // Calculate average rating
        const totalRating = feedbacksData.reduce(
          (sum, feedback) => sum + (feedback.rating || 0),
          0
        );
        const avgRating =
          feedbacksData.length > 0
            ? parseFloat((totalRating / feedbacksData.length).toFixed(1))
            : 0;

        // Prepare branch performance data
        const branchPerformanceData: BranchPerformance[] = branchesData.map(
          (branch) => {
            const branchFeedbacks = feedbacksData.filter(
              (fb) => fb.branchId === branch.id || fb.branchName === branch.name
            );

            const branchRatingTotal = branchFeedbacks.reduce(
              (sum, fb) => sum + (fb.rating || 0),
              0
            );
            const branchRating =
              branchFeedbacks.length > 0
                ? parseFloat((branchRatingTotal / branchFeedbacks.length).toFixed(1))
                : 0;

            const branchServices = servicesData.filter(
              (service) =>
                service.branches?.includes(branch.id) ||
                service.branchNames?.includes(branch.name as string)
            );
            const branchProducts = productsData.filter(
              (product) =>
                product.branches?.includes(branch.id) ||
                product.branchNames?.includes(branch.name as string)
            );

            const branchServiceRevenue = branchServices.reduce(
              (sum, s) => sum + (s.revenue || 0),
              0
            );
            const branchProductRevenue = branchProducts.reduce(
              (sum, p) => sum + (p.revenue || 0),
              0
            );
            const branchRevenue = branchServiceRevenue + branchProductRevenue;

            const branchBookings = bookingsData.filter(
              (booking) =>
                booking.branchId === branch.id ||
                booking.branchName === branch.name
            );

            let status = "average";
            if (branchRating >= 4.5) status = "excellent";
            else if (branchRating >= 4.0) status = "good";
            else if (branchRating >= 3.5) status = "average";
            else status = "needs_attention";

            return {
              id: branch.id,
              name: branch.name || "Unnamed Branch",
              revenue: branchRevenue,
              customers: branchFeedbacks.length,
              rating: branchRating,
              status: status,
              city: branch.city || "N/A",
              manager: branch.managerName || "N/A",
              bookings: branchBookings.length,
            };
          }
        );

        // Prepare recent activities
        const recentActivitiesData: RecentActivity[] = feedbacksData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((feedback) => {
            const timeAgo = calculateTimeAgo(feedback.createdAt?.toDate());
            return {
              type: "customer_feedback",
              message: `New ${feedback.rating || 0}★ review from ${
                feedback.customerName || "Customer"
              }`,
              time: timeAgo,
              branch: feedback.branchName || "Unknown Branch",
            };
          });

        // Get recent categories
        const recentCategoriesData: RecentCategory[] = categoriesData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((category) => ({
            id: category.id,
            name: category.name || "Unnamed Category",
            type: category.type || "service",
            branch: category.branchName || "All Branches",
            time: calculateTimeAgo(category.createdAt?.toDate()),
            isActive: category.isActive || false,
          }));

        // Get recent products
        const recentProductsData: RecentProduct[] = productsData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((product) => ({
            id: product.id,
            name: product.name || "Unnamed Product",
            price: product.price || 0,
            category: product.category || "Uncategorized",
            time: calculateTimeAgo(product.createdAt?.toDate()),
            status: product.status || "active",
          }));

        // Get recent services
        const recentServicesData: RecentService[] = servicesData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((service) => ({
            id: service.id,
            name: service.name || "Unnamed Service",
            price: service.price || 0,
            duration: service.duration || 0,
            category: service.category || "Uncategorized",
            time: calculateTimeAgo(service.createdAt?.toDate()),
            status: service.status || "active",
          }));

        // Get recent bookings
        const recentBookingsData: RecentBooking[] = bookingsData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((booking) => ({
            id: booking.id,
            serviceName: booking.serviceName || "Service",
            customerName: booking.customerName || "Customer",
            date: booking.date || "N/A",
            time: booking.time || "N/A",
            totalAmount: booking.totalAmount || 0,
            status: booking.status || "pending",
            timeAgo: calculateTimeAgo(booking.createdAt?.toDate()),
          }));

        // Update state with real data
        const newStats = {
          totalBranches: totalBranches,
          totalRevenue: totalBookingsRevenue,
          totalCustomers: feedbacksData.length,
          avgRating: avgRating,
          monthlyGrowth: 12.5,
          totalServices: servicesData.length,
          totalProducts: productsData.length,
          totalCategories: categoriesData.length,
          totalBookings: bookingsData.length,
        };

        setOverallStats(newStats);
        setBranchPerformance(branchPerformanceData);
        setRecentActivities(recentActivitiesData);
        setRecentCategories(recentCategoriesData);
        setRecentProducts(recentProductsData);
        setRecentServices(recentServicesData);
        setRecentBookings(recentBookingsData);

        // Cache data in localStorage
        try {
          localStorage.setItem('dashboard_stats', JSON.stringify(newStats));
          localStorage.setItem('dashboard_branches', JSON.stringify(branchPerformanceData));
          localStorage.setItem('dashboard_activities', JSON.stringify(recentActivitiesData));
          localStorage.setItem('dashboard_categories', JSON.stringify(recentCategoriesData));
          localStorage.setItem('dashboard_products', JSON.stringify(recentProductsData));
          localStorage.setItem('dashboard_services', JSON.stringify(recentServicesData));
          localStorage.setItem('dashboard_bookings', JSON.stringify(recentBookingsData));
          localStorage.setItem('dashboard_last_fetched', Date.now().toString());
        } catch (error) {
          console.log('Could not cache dashboard data');
        }

      } catch (error) {
        console.log("Dashboard data fetch:", error);
        // Keep using cached data if available
      }
    };

    // Only fetch fresh data if cache is older than 5 minutes
    const lastFetched = localStorage.getItem('dashboard_last_fetched');
    const shouldFetch = !lastFetched || (Date.now() - parseInt(lastFetched)) > 300000; // 5 minutes
    
    if (shouldFetch) {
      fetchDashboardData();
    }
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
      case "completed":
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "needs_attention":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Sidebar - Now visible by default */}
      <AdminSidebar
        role="super_admin"
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <AdminMobileSidebar
                role="super_admin"
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
              <div>
                <h1 className="text-2xl font-serif font-bold text-primary">
                  Super Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-Branch Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.email}
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hidden sm:flex border-primary/10 text-primary hover:bg-primary/5"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0 bg-[#f8f9fa]">
          <div className="h-full p-4 lg:p-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Branches Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Branches
                  </CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {overallStats.totalBranches}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    All locations active
                  </p>
                </CardContent>
              </Card>

              {/* Total Revenue Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Revenue
                  </CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    AED {overallStats.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    +{overallStats.monthlyGrowth}% from last month
                  </p>
                </CardContent>
              </Card>

              {/* Total Customers Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Customers
                  </CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {overallStats.totalCustomers.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              {/* Average Rating Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Average Rating
                  </CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {overallStats.avgRating}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Based on {overallStats.totalCustomers} reviews
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Total Bookings Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Bookings
                  </CardTitle>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {overallStats.totalBookings}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Appointments scheduled
                  </p>
                </CardContent>
              </Card>

              {/* Total Services Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Services
                  </CardTitle>
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Settings className="h-4 w-4 text-pink-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {overallStats.totalServices}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active services
                  </p>
                </CardContent>
              </Card>

              {/* Total Products Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Products
                  </CardTitle>
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Package className="h-4 w-4 text-cyan-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {overallStats.totalProducts}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available products
                  </p>
                </CardContent>
              </Card>

              {/* Total Categories Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Total Categories
                  </CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Layers className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {overallStats.totalCategories}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Service & product categories
                  </p>
                </CardContent>
              </Card>

              {/* Monthly Growth Card */}
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Growth Rate
                  </CardTitle>
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    +{overallStats.monthlyGrowth}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly increase
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Items Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Bookings */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Recent Bookings
                  </CardTitle>
                  <CardDescription>
                    Latest appointments and reservations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent bookings
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-primary">
                                {booking.serviceName}
                              </h3>
                              <Badge
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                  getStatusColor(booking.status)
                                )}
                              >
                                {getStatusBadge(booking.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Customer
                                </p>
                                <p className="font-semibold">
                                  {booking.customerName}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Date & Time
                                </p>
                                <p className="font-semibold">
                                  {booking.date} • {booking.time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-lg font-bold text-primary">
                                AED {booking.totalAmount}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {booking.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Services */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <Settings className="w-5 h-5 text-pink-600" />
                    Recently Added Services
                  </CardTitle>
                  <CardDescription>
                    New services added to branches
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentServices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent services
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-pink-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-primary">
                                {service.name}
                              </h3>
                              <Badge
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                  getStatusColor(service.status)
                                )}
                              >
                                {service.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Category
                                </p>
                                <p className="font-semibold">
                                  {service.category}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Duration
                                </p>
                                <p className="font-semibold">
                                  {service.duration} mins
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-lg font-bold text-primary">
                                AED {service.price}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {service.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Another Row for Products and Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Products */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <Package className="w-5 h-5 text-cyan-600" />
                    Recently Added Products
                  </CardTitle>
                  <CardDescription>New products in inventory</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent products
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-primary">
                                {product.name}
                              </h3>
                              <Badge
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                  getStatusColor(product.status)
                                )}
                              >
                                {product.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Category
                                </p>
                                <p className="font-semibold">
                                  {product.category}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Price
                                </p>
                                <p className="font-semibold">
                                  AED {product.price}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">
                                Added {product.time}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Categories */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="flex items-center gap-2 text-lg font-serif">
                    <Layers className="w-5 h-5 text-orange-600" />
                    Recently Added Categories
                  </CardTitle>
                  <CardDescription>
                    New service & product categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No recent categories
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-primary">
                                {category.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                    category.isActive
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  )}
                                >
                                  {category.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none bg-blue-100 text-blue-700">
                                  {category.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Branch
                                </p>
                                <p className="font-semibold">
                                  {category.branch}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Added
                                </p>
                                <p className="font-semibold">{category.time}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Branch Performance and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Branch Performance */}
              <div className="lg:col-span-2">
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-serif">
                      <Building className="w-5 h-5 text-secondary" />
                      Branch Performance Overview
                    </CardTitle>
                    <CardDescription>
                      Revenue, customers, and ratings across all locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {branchPerformance.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No branch data available
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {branchPerformance.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-secondary/30 hover:shadow-sm transition-all group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-primary">
                                  {branch.name}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {branch.city}
                                </span>
                                <Badge
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                    branch.status === "excellent"
                                      ? "bg-green-100 text-green-700"
                                      : branch.status === "good"
                                      ? "bg-blue-100 text-blue-700"
                                      : branch.status === "average"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-red-100 text-red-700"
                                  )}
                                >
                                  {branch.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Revenue
                                  </p>
                                  <p className="font-semibold text-primary">
                                    ${branch.revenue.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Customers
                                  </p>
                                  <p className="font-semibold text-primary">
                                    {branch.customers}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Rating
                                  </p>
                                  <p className="font-semibold text-secondary">
                                    ⭐ {branch.rating}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Bookings
                                  </p>
                                  <p className="font-semibold text-primary">
                                    {branch.bookings}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-muted-foreground text-xs">
                                  Manager:{" "}
                                  <span className="font-semibold">
                                    {branch.manager}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-secondary hover:text-secondary hover:bg-secondary/5 font-bold text-xs uppercase tracking-widest"
                            >
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities & Quick Actions */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-lg font-serif">
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      System-wide administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <Link
                      href="/super-admin/branches"
                      className="flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Manage Branch
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/staff"
                      className="flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Manage Staff
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/categories"
                      className="flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Manage Categories
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/products"
                      className="flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Manage Products
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/services"
                      className="flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Manage Services
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-lg font-serif">
                      Recent Activities
                    </CardTitle>
                    <CardDescription>
                      Latest customer feedback and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          No recent activities
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-primary">
                                {activity.message}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  {activity.time}
                                </p>
                                {activity.branch && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {activity.branch}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}