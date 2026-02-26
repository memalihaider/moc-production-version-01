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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Building,
  Settings,
  UserPlus,
  LogOut,
  ChevronRight,
  Package,
  Layers,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Download,
  Filter,
  Bell,
  Activity,
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
  const [activeTab, setActiveTab] = useState<string>("bookings");

  // Initial state with cached data
  const [overallStats, setOverallStats] = useState<OverallStats>(() => {
    if (typeof window !== 'undefined') {
      const cachedStats = localStorage.getItem('admin_dashboard_stats');
      if (cachedStats) {
        try {
          return JSON.parse(cachedStats);
        } catch {
          // Fallback to defaults
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
        const cachedBranches = localStorage.getItem('admin_branch_performance');
        if (cachedBranches) {
          try {
            return JSON.parse(cachedBranches);
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedActivities = localStorage.getItem('admin_recent_activities');
        if (cachedActivities) {
          try {
            return JSON.parse(cachedActivities);
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );

  // Recent items states with cached data
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedCategories = localStorage.getItem('admin_recent_categories');
        if (cachedCategories) {
          try {
            return JSON.parse(cachedCategories);
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedProducts = localStorage.getItem('admin_recent_products');
        if (cachedProducts) {
          try {
            return JSON.parse(cachedProducts);
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentServices, setRecentServices] = useState<RecentService[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedServices = localStorage.getItem('admin_recent_services');
        if (cachedServices) {
          try {
            return JSON.parse(cachedServices);
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedBookings = localStorage.getItem('admin_recent_bookings');
        if (cachedBookings) {
          try {
            return JSON.parse(cachedBookings);
          } catch {
            // Fallback to empty array
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

  // Fetch dashboard data - NON-BLOCKING
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("🔄 Fetching dashboard data...");

        // Use Promise.all for parallel fetching with timeout
        const fetchPromises = [
          getDocs(collection(db, "branches")),
          getDocs(collection(db, "feedbacks")),
          getDocs(collection(db, "services")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "bookings"))
        ];

        // Add timeout to prevent hanging
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

        // Convert to arrays
        const allBranches: BranchDocument[] = branchesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        const allServices: ServiceDocument[] = servicesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        const allProducts: ProductDocument[] = productsSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        const allCategories: CategoryDocument[] = categoriesSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        const allBookings: BookingDocument[] = bookingsSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        const allFeedbacks: FeedbackDocument[] = feedbacksSnapshot.docs.map(
          (doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        // Filter data based on user role
        let filteredServices: ServiceDocument[] = [];
        let filteredProducts: ProductDocument[] = [];
        let filteredCategories: CategoryDocument[] = [];
        let filteredBookings: BookingDocument[] = [];
        let filteredFeedbacks: FeedbackDocument[] = [];

        if (user?.role === "admin" && user?.branchId) {
          // BRANCH ADMIN: Filter for specific branch
          const userBranchId = user.branchId;
          const userBranchName = user.branchName;

          filteredServices = allServices.filter((service) =>
            service.branches?.includes(userBranchId)
          );

          filteredProducts = allProducts.filter((product) =>
            product.branches?.includes(userBranchId)
          );

          filteredCategories = allCategories.filter(
            (category) =>
              category.branchName === userBranchName ||
              (category.branchName &&
                category.branchName.includes(userBranchName || ""))
          );

          filteredBookings = allBookings.filter(
            (booking) =>
              booking.branchId === userBranchId ||
              booking.branchName === userBranchName
          );

          filteredFeedbacks = allFeedbacks.filter(
            (feedback) =>
              feedback.branchId === userBranchId ||
              feedback.branchName === userBranchName
          );
        } else {
          // SUPER ADMIN: Show all data
          filteredServices = allServices;
          filteredProducts = allProducts;
          filteredCategories = allCategories;
          filteredBookings = allBookings;
          filteredFeedbacks = allFeedbacks;
        }

        // Calculate stats
        const totalRevenue = filteredBookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0,
        );

        const totalRating = filteredFeedbacks.reduce(
          (sum, feedback) => sum + (feedback.rating || 0),
          0,
        );
        const avgRating =
          filteredFeedbacks.length > 0
            ? parseFloat((totalRating / filteredFeedbacks.length).toFixed(1))
            : 0;

        // Update overall stats
        const newStats = {
          totalBranches: user?.role === "admin" ? 1 : allBranches.length,
          totalRevenue: totalRevenue,
          totalCustomers: filteredFeedbacks.length,
          avgRating: avgRating,
          monthlyGrowth: 12.5,
          totalServices: filteredServices.length,
          totalProducts: filteredProducts.length,
          totalCategories: filteredCategories.length,
          totalBookings: filteredBookings.length,
        };

        setOverallStats(newStats);

        // Prepare branch performance data
        const branchPerformanceData: BranchPerformance[] = [];

        if (user?.role === "admin" && user?.branchId) {
          // For branch admin, only show their branch
          const userBranch = allBranches.find((b) => b.id === user.branchId);
          if (userBranch) {
            const branchBookings = filteredBookings;
            const branchFeedbacks = filteredFeedbacks;
            const branchRevenue = branchBookings.reduce(
              (sum, b) => sum + (b.totalAmount || 0),
              0,
            );
            const branchRatingTotal = branchFeedbacks.reduce(
              (sum, fb) => sum + (fb.rating || 0),
              0,
            );
            const branchRating =
              branchFeedbacks.length > 0
                ? branchRatingTotal / branchFeedbacks.length
                : 0;

            branchPerformanceData.push({
              id: userBranch.id,
              name: userBranch.name || user.branchName || "Your Branch",
              revenue: branchRevenue,
              customers: branchFeedbacks.length,
              rating: parseFloat(branchRating.toFixed(1)),
              status:
                branchRating >= 4.5
                  ? "excellent"
                  : branchRating >= 4.0
                    ? "good"
                    : branchRating >= 3.5
                      ? "average"
                      : "needs_attention",
              city: userBranch.city || "N/A",
              manager: userBranch.managerName || "N/A",
              bookings: branchBookings.length,
            });
          }
        } else {
          // For super admin, show all branches
          branchPerformanceData.push(
            ...allBranches.map((branch) => {
              const branchBookings = allBookings.filter(
                (b) => b.branchId === branch.id || b.branchName === branch.name,
              );
              const branchFeedbacks = allFeedbacks.filter(
                (f) => f.branchId === branch.id || f.branchName === branch.name,
              );
              const branchRevenue = branchBookings.reduce(
                (sum, b) => sum + (b.totalAmount || 0),
                0,
              );
              const branchRatingTotal = branchFeedbacks.reduce(
                (sum, f) => sum + (f.rating || 0),
                0,
              );
              const branchRating =
                branchFeedbacks.length > 0
                  ? branchRatingTotal / branchFeedbacks.length
                  : 0;

              return {
                id: branch.id,
                name: branch.name || "Unnamed Branch",
                revenue: branchRevenue,
                customers: branchFeedbacks.length,
                rating: parseFloat(branchRating.toFixed(1)),
                status:
                  branchRating >= 4.5
                    ? "excellent"
                    : branchRating >= 4.0
                      ? "good"
                      : branchRating >= 3.5
                        ? "average"
                        : "needs_attention",
                city: branch.city || "N/A",
                manager: branch.managerName || "N/A",
                bookings: branchBookings.length,
              };
            }),
          );
        }

        setBranchPerformance(branchPerformanceData);

        // Prepare recent activities
        const recentActivitiesData: RecentActivity[] = filteredFeedbacks
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
              branch: feedback.branchName || user?.branchName || "Your Branch",
            };
          });

        // Prepare recent categories
        const recentCategoriesData: RecentCategory[] = filteredCategories
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
            branch: category.branchName || user?.branchName || "All Branches",
            time: calculateTimeAgo(category.createdAt?.toDate()),
            isActive: category.isActive || false,
          }));

        // Prepare recent products
        const recentProductsData: RecentProduct[] = filteredProducts
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

        // Prepare recent services
        const recentServicesData: RecentService[] = filteredServices
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

        // Prepare recent bookings
        const recentBookingsData: RecentBooking[] = filteredBookings
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

        // Update all states
        setRecentActivities(recentActivitiesData);
        setRecentCategories(recentCategoriesData);
        setRecentProducts(recentProductsData);
        setRecentServices(recentServicesData);
        setRecentBookings(recentBookingsData);

        // Cache data in localStorage
        try {
          localStorage.setItem('admin_dashboard_stats', JSON.stringify(newStats));
          localStorage.setItem('admin_branch_performance', JSON.stringify(branchPerformanceData));
          localStorage.setItem('admin_recent_activities', JSON.stringify(recentActivitiesData));
          localStorage.setItem('admin_recent_categories', JSON.stringify(recentCategoriesData));
          localStorage.setItem('admin_recent_products', JSON.stringify(recentProductsData));
          localStorage.setItem('admin_recent_services', JSON.stringify(recentServicesData));
          localStorage.setItem('admin_recent_bookings', JSON.stringify(recentBookingsData));
          localStorage.setItem('admin_dashboard_last_fetched', Date.now().toString());
        } catch (error) {
          console.log('Could not cache dashboard data');
        }

        console.log("✅ Dashboard data loaded successfully!");
      } catch (error) {
        console.log("Dashboard data fetch:", error);
        // Keep using cached data if available
      }
    };

    // Only fetch fresh data if cache is older than 5 minutes
    const lastFetched = localStorage.getItem('admin_dashboard_last_fetched');
    const shouldFetch = !lastFetched || (Date.now() - parseInt(lastFetched)) > 300000; // 5 minutes
    
    if (shouldFetch) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
      case "completed":
      case "excellent":
        return "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200";
      case "good":
      case "pending":
        return "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200";
      case "average":
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200";
      case "needs_attention":
      case "cancelled":
        return "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Sidebar */}
      <AdminSidebar
        role={user?.role === "super_admin" ? "super_admin" : "branch_admin"}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0 overflow-hidden",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0",
        )}
      >
        {/* Modern Header */}
        <header className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 shadow-lg shadow-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-4">
              <AdminMobileSidebar
                role={
                  user?.role === "super_admin" ? "super_admin" : "branch_admin"
                }
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Building className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white font-serif">
                      {user?.role === "admin"
                        ? "Branch Dashboard"
                        : "Super Admin Dashboard"}
                    </h1>
                    {user?.role === "admin" && user?.branchName && (
                      <Badge className="bg-white/20 text-white border-0 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
                        🏢 {user.branchName}
                      </Badge>
                    )}
                    {user?.role === "super_admin" && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 px-3 py-1 rounded-full">
                        👑 Super Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-white/90 mt-1 flex items-center gap-2">
                    <Activity className="h-3 w-3 animate-pulse" />
                    {user?.role === "admin"
                      ? `Managing ${user?.branchName || "your branch"}`
                      : "Multi-Branch Management System"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="text-sm font-semibold">{user?.email}</p>
                  <p className="text-xs opacity-90 capitalize">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                className="bg-white text-primary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="h-full p-4 lg:p-6">
            {/* Dashboard Stats Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">
                    Dashboard Overview
                  </h2>
                  <p className="text-gray-600">
                    Real-time statistics and performance metrics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:border-primary/30 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:border-primary/30 rounded-xl"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </div>

              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Revenue
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        ${overallStats.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-green-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{overallStats.monthlyGrowth}%
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">This month</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Customers Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Customers
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {overallStats.totalCustomers}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-purple-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.2%
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Active customers
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                        style={{ width: '65%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Branches Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      {user?.role === "admin" ? "Your Branch" : "Total Branches"}
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {overallStats.totalBranches}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-blue-100 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {user?.role === "admin"
                        ? "Your branch status"
                        : "All locations operational"}
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Average Rating Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Average Rating
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl font-bold text-gray-900 flex items-center">
                        {overallStats.avgRating}
                        <Star className="h-5 w-5 text-amber-500 ml-1 fill-amber-500" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(overallStats.avgRating)
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Based on {overallStats.totalCustomers} reviews
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Customer satisfaction</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                        style={{ width: `${overallStats.avgRating * 20}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-pink-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Services
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalServices}
                      </p>
                    </div>
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Settings className="h-5 w-5 text-pink-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-cyan-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalProducts}
                      </p>
                    </div>
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Package className="h-5 w-5 text-cyan-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-orange-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Categories
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalCategories}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Layers className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-teal-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalBookings}
                      </p>
                    </div>
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-indigo-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Growth Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        +{overallStats.monthlyGrowth}%
                      </p>
                    </div>
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs Section for Recent Items */}
            <Card className="border-none shadow-xl mb-8 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 font-serif">
                          Recent Items
                        </CardTitle>
                        <CardDescription>
                          Browse through your latest additions and activities
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:border-primary/30"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View All
                        </Button>
                      </div>
                    </div>
                    <TabsList className="grid grid-cols-5 w-full bg-gray-100/50 p-1 rounded-xl">
                      <TabsTrigger
                        value="bookings"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary rounded-lg transition-all"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Bookings
                        {recentBookings.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-primary text-white">
                            {recentBookings.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="services"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-pink-600 rounded-lg transition-all"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Services
                        {recentServices.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-pink-500 text-white">
                            {recentServices.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="products"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-cyan-600 rounded-lg transition-all"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Products
                        {recentProducts.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-cyan-500 text-white">
                            {recentProducts.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="categories"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600 rounded-lg transition-all"
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Categories
                        {recentCategories.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-orange-500 text-white">
                            {recentCategories.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="activities"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 rounded-lg transition-all"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Activities
                        {recentActivities.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-purple-500 text-white">
                            {recentActivities.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Bookings Tab */}
                  <TabsContent value="bookings" className="mt-0">
                    {recentBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Recent Bookings
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Bookings will appear here once customers start booking
                          services
                        </p>
                        <Link
                          href="/admin/bookings"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-md"
                        >
                          <Calendar className="h-4 w-4" />
                          View All Bookings
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50/50 border border-gray-100 rounded-2xl hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl">
                                <Calendar className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {booking.serviceName}
                                  </h3>
                                  <Badge
                                    className={cn(
                                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                      getStatusColor(booking.status),
                                    )}
                                  >
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(booking.status)}
                                      {booking.status}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Customer
                                    </p>
                                    <p className="font-semibold">
                                      {booking.customerName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-semibold">{booking.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Time</p>
                                    <p className="font-semibold">{booking.time}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Amount</p>
                                    <p className="font-semibold text-lg text-green-600">
                                      AED {booking.totalAmount}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors ml-4" />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Services Tab */}
                  <TabsContent value="services" className="mt-0">
                    {recentServices.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                          <Settings className="h-10 w-10 text-pink-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Services Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding services to see them here
                        </p>
                        <Link
                          href="/admin/services"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors shadow-md"
                        >
                          <Settings className="h-4 w-4" />
                          Add First Service
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentServices.map((service) => (
                          <div
                            key={service.id}
                            className="p-5 bg-gradient-to-br from-white to-pink-50/30 border border-gray-100 rounded-2xl hover:border-pink-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl">
                                  <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {service.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {service.category}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  getStatusColor(service.status),
                                )}
                              >
                                {service.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500">Price</p>
                                <p className="text-xl font-bold text-primary">
                                  AED {service.price}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="text-lg font-semibold">
                                  {service.duration} mins
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Added {service.time}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products" className="mt-0">
                    {recentProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center mb-4">
                          <Package className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Products Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding products to see them here
                        </p>
                        <Link
                          href="/admin/products"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-md"
                        >
                          <Package className="h-4 w-4" />
                          Add First Product
                        </Link>
                    </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-5 bg-gradient-to-br from-white to-cyan-50/30 border border-gray-100 rounded-2xl hover:border-cyan-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl">
                                  <Package className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  getStatusColor(product.status),
                                )}
                              >
                                {product.status}
                              </Badge>
                            </div>
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1">Price</p>
                              <p className="text-2xl font-bold text-primary">
                                AED {product.price}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Added {product.time}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Categories Tab */}
                  <TabsContent value="categories" className="mt-0">
                    {recentCategories.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
                          <Layers className="h-10 w-10 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Categories Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding categories to organize your services and
                          products
                        </p>
                        <Link
                          href="/admin/categories"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                        >
                          <Layers className="h-4 w-4" />
                          Add First Category
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentCategories.map((category) => (
                          <div
                            key={category.id}
                            className="p-5 bg-gradient-to-br from-white to-orange-50/30 border border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                                  <Layers className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {category.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
                                      {category.type}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "px-2 py-0.5 text-xs",
                                        category.isActive
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700",
                                      )}
                                    >
                                      {category.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500">Branch</p>
                                <p className="font-semibold">{category.branch}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                  Added {category.time}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Activities Tab */}
                  <TabsContent value="activities" className="mt-0">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4">
                          <Activity className="h-10 w-10 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Recent Activities
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Activities will appear here as users interact with the
                          system
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-4 p-5 bg-gradient-to-r from-white to-purple-50/30 border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="p-2.5 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                              {activity.type === "customer_feedback" ? (
                                <Star className="h-5 w-5 text-purple-600" />
                              ) : (
                                <Activity className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {activity.message}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                    {activity.time}
                                  </span>
                                  {activity.branch && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                                      {activity.branch}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Quick Actions & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <Card className="border-none shadow-xl">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-900 font-serif">
                        Quick Actions
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add More
                      </Button>
                    </div>
                    <CardDescription>
                      Manage your business with these quick actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Link
                        href="/admin/branches"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Building className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Manage Branches
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          View & manage branches
                        </span>
                      </Link>

                      <Link
                        href="/admin/staff"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-green-500/30 hover:bg-gradient-to-br hover:from-green-500/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Manage Staff
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          Add/Edit staff members
                        </span>
                      </Link>

                      <Link
                        href="/admin/categories"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Layers className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Categories
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          Organize services & products
                        </span>
                      </Link>

                      <Link
                        href="/admin/products"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-cyan-500/30 hover:bg-gradient-to-br hover:from-cyan-500/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Package className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Products
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          Manage inventory
                        </span>
                      </Link>

                      <Link
                        href="/admin/services"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-pink-500/30 hover:bg-gradient-to-br hover:from-pink-500/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Settings className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Services
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          Edit & manage services
                        </span>
                      </Link>

                      <Link
                        href="/admin/bookings"
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100 hover:border-amber-500/30 hover:bg-gradient-to-br hover:from-amber-500/5 hover:to-white hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-center text-gray-900">
                          Bookings
                        </span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          View all bookings
                        </span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <Card className="border-none shadow-xl h-fit">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-900 font-serif">
                      Recent Activities
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    Latest system activities and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activities</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50/50 to-white border border-gray-100 rounded-xl hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
                        >
                          <div className="relative">
                            <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full mt-2"></div>
                            <div className="absolute top-2 left-2 w-3 h-3 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full animate-ping"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {activity.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {activity.time}
                              </span>
                              {activity.branch && (
                                <Badge className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {activity.branch}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* System Status */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      System Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Database Connection
                        </span>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Firebase Services
                        </span>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Running
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          API Response Time
                        </span>
                        <Badge className="bg-blue-100 text-blue-700">
                          <Clock className="h-3 w-3 mr-1" />
                          124ms
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Dashboard updated in real-time • Last refresh: Just now • All
                times are in your local timezone
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}